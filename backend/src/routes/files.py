import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from src.extensions import db
from src.models import File, ActivityLog
from src.utils import get_icon_for_mime, format_file_size

files_bp = Blueprint('files', __name__)

CURRENT_USER_ID = 'user-alex-001'


@files_bp.route('/api/files/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    parent_id = request.form.get('parent_id')
    if parent_id in ('null', '', 'undefined', 'None'):
        parent_id = None

    # Save file to disk
    upload_folder = current_app.config['UPLOAD_FOLDER']
    file_uuid = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    stored_name = file_uuid + ext
    save_path = os.path.join(upload_folder, 'files', stored_name)
    file.save(save_path)

    # Get actual file size
    file_size = os.path.getsize(save_path)

    # Determine MIME type and icon
    mime_type = file.content_type or 'application/octet-stream'
    icon, icon_color, icon_bg = get_icon_for_mime(mime_type, file.filename)

    new_file = File(
        name=file.filename,
        is_folder=False,
        mime_type=mime_type,
        size=file_size,
        icon=icon,
        icon_color=icon_color,
        icon_bg=icon_bg,
        owner_id=CURRENT_USER_ID,
        parent_id=parent_id,
        storage_path=save_path,
    )
    db.session.add(new_file)

    log = ActivityLog(
        user_id=CURRENT_USER_ID,
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
def trash_file(file_id):
    from datetime import datetime, timezone

    f = File.query.filter_by(id=file_id, owner_id=CURRENT_USER_ID).first()
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
        user_id=CURRENT_USER_ID,
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


@files_bp.route('/api/files/<file_id>/star', methods=['PUT'])
def toggle_star(file_id):
    f = File.query.filter_by(id=file_id, owner_id=CURRENT_USER_ID).first()
    if not f:
        return jsonify({'error': 'File not found'}), 404

    f.is_starred = not f.is_starred
    action = 'file_starred' if f.is_starred else 'file_unstarred'

    log = ActivityLog(
        user_id=CURRENT_USER_ID,
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
def rename_file(file_id):
    data = request.get_json()
    new_name = data.get('name', '').strip()

    if not new_name:
        return jsonify({'error': 'Name is required'}), 400

    f = File.query.filter_by(id=file_id, owner_id=CURRENT_USER_ID).first()
    if not f:
        return jsonify({'error': 'File not found'}), 404

    # Check duplicate
    existing = File.query.filter(
        File.owner_id == CURRENT_USER_ID,
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
        user_id=CURRENT_USER_ID,
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
