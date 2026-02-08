from flask import Blueprint, request, jsonify
from src.extensions import db
from src.models import UserSettings

settings_bp = Blueprint('settings', __name__)

CURRENT_USER_ID = 'user-alex-001'


@settings_bp.route('/api/settings/appearance')
def get_appearance():
    s = UserSettings.query.filter_by(user_id=CURRENT_USER_ID).first()
    if not s:
        s = UserSettings(user_id=CURRENT_USER_ID)
        db.session.add(s)
        db.session.commit()

    return jsonify({
        'theme': s.theme,
        'font_size': s.font_size,
        'compact_mode': s.compact_mode,
        'sidebar_position': s.sidebar_position,
    })


@settings_bp.route('/api/settings/appearance', methods=['PUT'])
def update_appearance():
    data = request.get_json()
    s = UserSettings.query.filter_by(user_id=CURRENT_USER_ID).first()
    if not s:
        s = UserSettings(user_id=CURRENT_USER_ID)
        db.session.add(s)

    if 'theme' in data:
        s.theme = data['theme']
    if 'font_size' in data:
        s.font_size = data['font_size']
    if 'compact_mode' in data:
        s.compact_mode = data['compact_mode']
    if 'sidebar_position' in data:
        s.sidebar_position = data['sidebar_position']

    db.session.commit()

    return jsonify({
        'theme': s.theme,
        'font_size': s.font_size,
        'compact_mode': s.compact_mode,
        'sidebar_position': s.sidebar_position,
    })
