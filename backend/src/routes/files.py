import os
import uuid
import logging
import magic
from flask import Blueprint, request, jsonify, current_app, send_file, g
from werkzeug.utils import secure_filename
from src.extensions import db
from src.models import File, User, ActivityLog
from src.utils import get_icon_for_mime, format_file_size
from src.auth import login_required

logger = logging.getLogger(__name__)

files_bp = Blueprint('files', __name__)

MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB per file

ALLOWED_EXTENSIONS = {
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.txt', '.csv', '.md', '.rtf',
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.ico',
    '.mp4', '.mov', '.avi', '.mkv', '.webm',
    '.mp3', '.wav', '.ogg', '.flac', '.aac',
    '.zip', '.rar', '.7z', '.tar', '.gz',
    '.json', '.xml', '.html', '.css', '.js', '.ts',
}

ALLOWED_MIME_PREFIXES = [
    'image/', 'video/', 'audio/', 'text/',
    'application/pdf', 'application/json', 'application/xml',
    'application/zip', 'application/x-rar', 'application/x-7z',
    'application/msword', 'application/vnd.openxmlformats-officedocument',
    'application/vnd.ms-excel', 'application/vnd.ms-powerpoint',
]

BLOCKED_MIME_TYPES = {'image/svg+xml'}


@files_bp.route('/api/files/upload', methods=['POST'])
@login_required
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    # Sanitize filename
    original_name = file.filename
    safe_name = secure_filename(file.filename)
    if not safe_name:
        return jsonify({'error': 'Invalid filename'}), 400

    # Validate extension
    ext = os.path.splitext(safe_name)[1].lower()
    if ext and ext not in ALLOWED_EXTENSIONS:
        return jsonify({'error': f'File type {ext} is not allowed'}), 400

    # Validate MIME type via magic bytes (ignores browser-supplied Content-Type)
    real_mime = magic.from_buffer(file.read(2048), mime=True)
    file.seek(0)
    if real_mime in BLOCKED_MIME_TYPES:
        return jsonify({'error': f'File type {real_mime} is not allowed'}), 400
    if not any(real_mime.startswith(p) for p in ALLOWED_MIME_PREFIXES):
        return jsonify({'error': f'File type {real_mime} is not allowed'}), 400
    mime_type = real_mime

    # Check file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    if file_size > MAX_FILE_SIZE:
        return jsonify({'error': 'File too large. Maximum size is 100 MB'}), 413

    # Check user storage quota
    user = db.session.get(User, g.current_user_id)
    if user and (user.storage_used + file_size) > user.storage_limit:
        return jsonify({'error': 'Storage quota exceeded. Free up space or upgrade your plan.'}), 413

    parent_id = request.form.get('parent_id')
    if parent_id in ('null', '', 'undefined', 'None'):
        parent_id = None

    # Save to user-specific directory
    upload_folder = current_app.config['UPLOAD_FOLDER']
    user_dir = os.path.join(upload_folder, 'files', g.current_user_id)
    os.makedirs(user_dir, exist_ok=True)

    file_uuid = str(uuid.uuid4())
    stored_name = file_uuid + ext
    save_path = os.path.join(user_dir, stored_name)
    file.save(save_path)

    file_size = os.path.getsize(save_path)

    icon, icon_color, icon_bg = get_icon_for_mime(mime_type, original_name)

    new_file = File(
        name=original_name,
        is_folder=False,
        mime_type=mime_type,
        size=file_size,
        icon=icon,
        icon_color=icon_color,
        icon_bg=icon_bg,
        owner_id=g.current_user_id,
        parent_id=parent_id,
        storage_path=save_path,
    )
    db.session.add(new_file)

    # Update user storage usage
    if user:
        user.storage_used = (user.storage_used or 0) + file_size

    log = ActivityLog(
        user_id=g.current_user_id,
        file_id=new_file.id,
        action='file_uploaded',
        details={'size': file_size},
    )
    db.session.add(log)
    db.session.commit()
    logger.info('File uploaded: %s (%s bytes) by user %s', new_file.name, file_size, g.current_user_id)

    return jsonify({
        'id': new_file.id,
        'name': new_file.name,
        'size': new_file.size,
        'formatted_size': format_file_size(new_file.size),
        'mime_type': new_file.mime_type,
        'icon': new_file.icon,
        'icon_color': new_file.icon_color,
        'icon_bg': new_file.icon_bg,
        'created_at': new_file.created_at.isoformat() + 'Z',
    }), 201


@files_bp.route('/api/files/<file_id>', methods=['DELETE'])
@login_required
def trash_file(file_id):
    from datetime import datetime, timezone

    f = File.query.filter_by(id=file_id, owner_id=g.current_user_id).first()
    if not f:
        return jsonify({'error': 'File not found'}), 404

    now = datetime.now(timezone.utc)
    f.original_parent_id = f.parent_id
    f.is_trashed = True
    f.trashed_at = now

    # If folder, trash children recursively
    if f.is_folder:
        _trash_children(f.id, now)

    log = ActivityLog(
        user_id=g.current_user_id,
        file_id=f.id,
        action='file_trashed',
    )
    db.session.add(log)
    db.session.commit()
    logger.info('File trashed: %s by user %s', f.name, g.current_user_id)

    return jsonify({
        'id': f.id,
        'is_trashed': True,
        'trashed_at': f.trashed_at.isoformat() + 'Z',
    })


def _trash_children(folder_id, now):
    children = File.query.filter_by(parent_id=folder_id, is_trashed=False).all()
    for child in children:
        child.original_parent_id = child.parent_id
        child.is_trashed = True
        child.trashed_at = now
        if child.is_folder:
            _trash_children(child.id, now)


@files_bp.route('/api/files/<file_id>/download')
@login_required
def download_file(file_id):
    f = File.query.filter_by(id=file_id, owner_id=g.current_user_id).first()
    if not f or not f.storage_path:
        return jsonify({'error': 'File not found'}), 404

    if not os.path.exists(f.storage_path):
        return jsonify({'error': 'File not found on disk'}), 404

    inline = request.args.get('inline') == 'true'
    logger.info('File downloaded: %s by user %s', f.name, g.current_user_id)
    return send_file(
        f.storage_path,
        mimetype=f.mime_type or 'application/octet-stream',
        as_attachment=not inline,
        download_name=f.name,
    )


@files_bp.route('/api/files/<file_id>/star', methods=['PUT'])
@login_required
def toggle_star(file_id):
    f = File.query.filter_by(id=file_id, owner_id=g.current_user_id).first()
    if not f:
        return jsonify({'error': 'File not found'}), 404

    f.is_starred = not f.is_starred
    action = 'file_starred' if f.is_starred else 'file_unstarred'

    log = ActivityLog(
        user_id=g.current_user_id,
        file_id=f.id,
        action=action,
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'id': f.id,
        'is_starred': f.is_starred,
    })


@files_bp.route('/api/files/<file_id>/rename', methods=['PUT'])
@login_required
def rename_file(file_id):
    data = request.get_json()
    new_name = data.get('name', '').strip()

    if not new_name:
        return jsonify({'error': 'Name is required'}), 400

    f = File.query.filter_by(id=file_id, owner_id=g.current_user_id).first()
    if not f:
        return jsonify({'error': 'File not found'}), 404

    # Check duplicate
    existing = File.query.filter(
        File.owner_id == g.current_user_id,
        File.parent_id == f.parent_id,
        File.name == new_name,
        File.id != f.id,
        File.is_trashed == False,
    ).first()

    if existing:
        return jsonify({'error': 'A file with this name already exists in this location'}), 400

    old_name = f.name
    f.name = new_name

    log = ActivityLog(
        user_id=g.current_user_id,
        file_id=f.id,
        action='file_renamed',
        details={'old_name': old_name, 'new_name': new_name},
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'id': f.id,
        'name': f.name,
        'updated_at': f.updated_at.isoformat() + 'Z' if f.updated_at else None,
    })


def _is_descendant(potential_child_id, ancestor_id):
    """Return True if potential_child_id is inside ancestor_id's subtree."""
    item = db.session.get(File, potential_child_id)
    while item and item.parent_id:
        if item.parent_id == ancestor_id:
            return True
        item = db.session.get(File, item.parent_id)
    return False


@files_bp.route('/api/files/<file_id>/lock', methods=['PUT'])
@login_required
def toggle_lock(file_id):
    from werkzeug.security import generate_password_hash, check_password_hash

    f = File.query.filter_by(id=file_id, owner_id=g.current_user_id, is_folder=True).first()
    if not f:
        return jsonify({'error': 'Folder not found'}), 404

    data = request.get_json() or {}
    password = data.get('password', '').strip()

    if not f.is_locked:
        if not password or len(password) < 4:
            return jsonify({'error': 'Password must be at least 4 characters'}), 400
        f.is_locked = True
        f.lock_password_hash = generate_password_hash(password)
        action = 'file_locked'
    else:
        if not password:
            return jsonify({'error': 'Password is required'}), 400
        if not f.lock_password_hash or not check_password_hash(f.lock_password_hash, password):
            return jsonify({'error': 'Incorrect password'}), 403
        f.is_locked = False
        f.lock_password_hash = None
        action = 'file_unlocked'

    db.session.add(ActivityLog(user_id=g.current_user_id, file_id=f.id, action=action))
    db.session.commit()
    return jsonify({'id': f.id, 'is_locked': f.is_locked})


@files_bp.route('/api/files/<file_id>/verify-lock', methods=['POST'])
@login_required
def verify_lock(file_id):
    from werkzeug.security import check_password_hash

    f = File.query.filter_by(id=file_id, owner_id=g.current_user_id, is_folder=True).first()
    if not f:
        return jsonify({'error': 'Folder not found'}), 404

    if not f.is_locked:
        return jsonify({'verified': True})

    data = request.get_json() or {}
    password = data.get('password', '').strip()
    if not password or not f.lock_password_hash:
        return jsonify({'error': 'Password is required'}), 400

    if not check_password_hash(f.lock_password_hash, password):
        return jsonify({'verified': False, 'error': 'Incorrect password'}), 403

    return jsonify({'verified': True})


@files_bp.route('/api/files/<file_id>/move', methods=['POST'])
@login_required
def move_file(file_id):
    f = File.query.filter_by(id=file_id, owner_id=g.current_user_id).first()
    if not f:
        return jsonify({'error': 'File not found'}), 404

    data = request.get_json() or {}
    destination_id = data.get('destination_id') or None
    if destination_id in ('null', '', 'undefined', 'None'):
        destination_id = None

    if destination_id:
        dest = File.query.filter_by(id=destination_id, owner_id=g.current_user_id, is_folder=True).first()
        if not dest:
            return jsonify({'error': 'Destination folder not found'}), 404
        if destination_id == file_id:
            return jsonify({'error': 'Cannot move a folder into itself'}), 400
        if f.is_folder and _is_descendant(destination_id, file_id):
            return jsonify({'error': 'Cannot move a folder into one of its subfolders'}), 400

    existing = File.query.filter(
        File.owner_id == g.current_user_id,
        File.parent_id == destination_id,
        File.name == f.name,
        File.id != f.id,
        File.is_trashed == False,
    ).first()
    if existing:
        return jsonify({'error': 'An item with this name already exists at the destination'}), 400

    old_parent = f.parent_id
    f.parent_id = destination_id
    db.session.add(ActivityLog(
        user_id=g.current_user_id, file_id=f.id, action='file_moved',
        details={'from': old_parent, 'to': destination_id},
    ))
    db.session.commit()
    return jsonify({'id': f.id, 'parent_id': f.parent_id})


@files_bp.route('/api/files/<file_id>', methods=['GET'])
@login_required
def get_file_details(file_id):
    import hashlib

    f = File.query.filter_by(id=file_id, owner_id=g.current_user_id).first()
    if not f:
        return jsonify({'error': 'File not found'}), 404

    # Build path
    path_parts = []
    current = f.parent
    while current:
        path_parts.insert(0, current.name)
        current = current.parent
    path = '/My Drive' + ('/' + '/'.join(path_parts) if path_parts else '')

    # Owner email
    owner = db.session.get(User, f.owner_id)
    owner_email = owner.email if owner else None

    # SHA1 for files with content (skip if > 500 MB)
    sha1 = None
    has_content = bool(f.storage_path and os.path.exists(f.storage_path))
    if has_content and f.size and f.size <= 500 * 1024 * 1024:
        h = hashlib.sha1()
        with open(f.storage_path, 'rb') as fp:
            while chunk := fp.read(65536):
                h.update(chunk)
        sha1 = h.hexdigest()

    items_count = None
    if f.is_folder:
        items_count = File.query.filter_by(parent_id=f.id, is_trashed=False).count()

    return jsonify({
        'id': f.id,
        'name': f.name,
        'is_folder': f.is_folder,
        'mime_type': f.mime_type,
        'size': f.size,
        'formatted_size': format_file_size(f.size),
        'icon': f.icon,
        'icon_color': f.icon_color,
        'icon_bg': f.icon_bg or ('bg-yellow-50 dark:bg-yellow-500/10' if f.is_folder else 'bg-slate-50 dark:bg-[#151e26]'),
        'is_starred': f.is_starred,
        'is_locked': f.is_locked,
        'has_content': has_content,
        'created_at': f.created_at.isoformat() + 'Z' if f.created_at else None,
        'updated_at': f.updated_at.isoformat() + 'Z' if f.updated_at else None,
        'parent_id': f.parent_id,
        'owner_email': owner_email,
        'sha1': sha1,
        'path': path,
        'items_count': items_count,
    })


def _add_folder_to_zip(zf, folder, prefix):
    children = File.query.filter_by(parent_id=folder.id, is_trashed=False).all()
    for child in children:
        if child.is_folder:
            _add_folder_to_zip(zf, child, f"{prefix}/{child.name}")
        elif child.storage_path and os.path.exists(child.storage_path):
            zf.write(child.storage_path, f"{prefix}/{child.name}")


@files_bp.route('/api/files/<file_id>/download-zip')
@login_required
def download_folder_zip(file_id):
    import io
    import zipfile

    folder = File.query.filter_by(id=file_id, owner_id=g.current_user_id, is_folder=True).first()
    if not folder:
        return jsonify({'error': 'Folder not found'}), 404

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        _add_folder_to_zip(zf, folder, folder.name)
    buf.seek(0)

    return send_file(
        buf,
        mimetype='application/zip',
        as_attachment=True,
        download_name=f"{folder.name}.zip",
    )
