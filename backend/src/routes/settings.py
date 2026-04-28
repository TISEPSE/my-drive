from flask import Blueprint, request, jsonify, g
from src.extensions import db
from src.models import UserSettings
from src.auth import login_required

settings_bp = Blueprint('settings', __name__)


@settings_bp.route('/api/settings/appearance')
@login_required
def get_appearance():
    s = UserSettings.query.filter_by(user_id=g.current_user_id).first()
    if not s:
        s = UserSettings(user_id=g.current_user_id)
        db.session.add(s)
        db.session.commit()

    return jsonify({
        'theme': s.theme,
        'font_size': s.font_size,
        'compact_mode': s.compact_mode,
        'sidebar_position': s.sidebar_position,
        'sidebar_hover': s.sidebar_hover,
    })


@settings_bp.route('/api/settings/appearance', methods=['PUT'])
@login_required
def update_appearance():
    data = request.get_json()
    s = UserSettings.query.filter_by(user_id=g.current_user_id).first()
    if not s:
        s = UserSettings(user_id=g.current_user_id)
        db.session.add(s)

    if 'theme' in data:
        s.theme = data['theme']
    if 'font_size' in data:
        s.font_size = data['font_size']
    if 'compact_mode' in data:
        s.compact_mode = data['compact_mode']
    if 'sidebar_position' in data:
        s.sidebar_position = data['sidebar_position']
    if 'sidebar_hover' in data:
        s.sidebar_hover = data['sidebar_hover']

    db.session.commit()

    return jsonify({
        'theme': s.theme,
        'font_size': s.font_size,
        'compact_mode': s.compact_mode,
        'sidebar_position': s.sidebar_position,
        'sidebar_hover': s.sidebar_hover,
    })
