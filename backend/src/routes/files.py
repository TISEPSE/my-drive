import os
import uuid
from flask import Blueprint, request, jsonify, current_app, send_file, g
from werkzeug.utils import secure_filename
from src.extensions import db
from src.models import File, ActivityLog
from src.utils import get_icon_for_mime, format_file_size
from src.auth import login_required

files_bp = Blueprint('files', __name__)

MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB per file

ALLOWED_EXTENSIONS = {
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.txt', '.csv', '.md', '.rtf',
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico',
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
    'application/octet-stream',
]


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

    # Validate MIME type
    mime_type = file.content_type or 'application/octet-stream'
    if not any(mime_type.startswith(p) for p in ALLOWED_MIME_PREFIXES):
        return jsonify({'error': f'File type {mime_type} is not allowed'}), 400

    # Check file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    if file_size > MAX_FILE_SIZE:
        return jsonify({'error': 'File too large. Maximum size is 100 MB'}), 413

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

    log = ActivityLog(
        user_id=g.current_user_id,
        file_id=new_file.id,
        action='file_uploaded',
        details={'size': file_size},
    )
    db.session.add(log)
    db.session.commit()

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
