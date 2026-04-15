from flask import Blueprint, jsonify, g
from src.extensions import db
from src.models import SharedFile, File, User
from src.utils import format_file_size, format_relative_time
from src.auth import login_required

sharing_bp = Blueprint('sharing', __name__)


@sharing_bp.route('/api/sharing/shared-with-me')
@login_required
def shared_with_me():
    shares = SharedFile.query.filter_by(shared_with_id=g.current_user_id).all()

    result = []
    for share in shares:
        f = db.session.get(File, share.file_id)
        if not f or f.is_trashed:
            continue
        owner = db.session.get(User, share.shared_by_id)

        result.append({
            'id': f.id,
            'name': f.name,
            'is_folder': f.is_folder,
            'mime_type': f.mime_type,
            'size': f.size,
            'formatted_size': format_file_size(f.size) if f.size else '--',
            'icon': f.icon,
            'icon_color': f.icon_color,
            'icon_bg': f.icon_bg or 'bg-slate-50',
            'permission': share.permission,
            'shared_by': {
                'id': owner.id if owner else None,
                'name': f"{owner.first_name} {owner.last_name}" if owner else 'Inconnu',
                'email': owner.email if owner else None,
                'avatar_url': owner.avatar_url if owner else None,
            },
            'shared_at': share.created_at.isoformat() + 'Z' if share.created_at else None,
            'relative_time': format_relative_time(share.created_at) if share.created_at else None,
            'updated_at': f.updated_at.isoformat() + 'Z' if f.updated_at else None,
        })

    return jsonify({'shared_files': result})
