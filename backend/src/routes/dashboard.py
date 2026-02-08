from flask import Blueprint, request, jsonify
from sqlalchemy import func
from datetime import datetime, timezone, timedelta
from src.extensions import db
from src.models import User, File, ActivityLog
from src.utils import format_file_size, format_relative_time

dashboard_bp = Blueprint('dashboard', __name__)

CURRENT_USER_ID = 'user-alex-001'

# Color mapping for team member avatars
USER_COLORS = {
    'user-alex-001': 'bg-slate-600',
    'user-sarah-001': 'bg-pink-500',
    'user-mike-001': 'bg-teal-500',
    'user-jessica-001': 'bg-violet-500',
    'user-david-001': 'bg-amber-500',
}

ACTION_VERBS = {
    'file_uploaded': 'uploaded',
    'file_edited': 'edited',
    'file_viewed': 'viewed',
    'file_downloaded': 'downloaded',
    'file_shared': 'shared',
    'file_moved': 'moved',
    'file_renamed': 'renamed',
    'file_trashed': 'moved to trash',
    'file_restored': 'restored',
    'file_starred': 'starred',
    'file_locked': 'locked',
    'file_copied': 'copied',
    'comment_added': 'commented on',
    'folder_created': 'created folder',
}


@dashboard_bp.route('/api/dashboard/stats')
def dashboard_stats():
    user = User.query.get(CURRENT_USER_ID)
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)

    total_files = File.query.filter_by(
        owner_id=CURRENT_USER_ID, is_trashed=False
    ).count()

    files_this_week = File.query.filter(
        File.owner_id == CURRENT_USER_ID,
        File.is_trashed == False,
        File.created_at >= week_ago,
    ).count()

    trash_items = File.query.filter_by(
        owner_id=CURRENT_USER_ID, is_trashed=True
    ).count()

    # Calculate auto-delete countdown
    oldest_trash = File.query.filter_by(
        owner_id=CURRENT_USER_ID, is_trashed=True
    ).order_by(File.trashed_at.asc()).first()

    if oldest_trash and oldest_trash.trashed_at:
        days_in_trash = (now - oldest_trash.trashed_at.replace(tzinfo=timezone.utc)).days
        auto_delete_days = max(30 - days_in_trash, 0)
        trash_auto_delete = f"{auto_delete_days}d"
    else:
        trash_auto_delete = "30d"

    return jsonify({
        'total_files': total_files,
        'total_files_change': f"+{files_this_week} this week",
        'storage_used': format_file_size(user.storage_used),
        'storage_percentage': round(user.storage_used / user.storage_limit * 100) if user.storage_limit else 0,
        'shared_files': 0,
        'shared_files_change': '+0 this week',
        'trash_items': trash_items,
        'trash_auto_delete': trash_auto_delete,
    })


@dashboard_bp.route('/api/dashboard/activity')
def dashboard_activity():
    limit = request.args.get('limit', 6, type=int)

    activities = ActivityLog.query.order_by(
        ActivityLog.created_at.desc()
    ).limit(limit).all()

    result = []
    for act in activities:
        user = User.query.get(act.user_id)
        if not user:
            continue

        file_obj = File.query.get(act.file_id) if act.file_id else None
        initials = user.first_name[0] + user.last_name[0]

        is_current = user.id == CURRENT_USER_ID
        display_name = 'You' if is_current else f"{user.first_name} {user.last_name[0]}."

        result.append({
            'id': act.id,
            'user': {
                'id': user.id,
                'name': display_name,
                'initials': initials,
                'color': USER_COLORS.get(user.id, 'bg-slate-500'),
            },
            'action': ACTION_VERBS.get(act.action, act.action),
            'target': file_obj.name if file_obj else 'a file',
            'target_id': act.file_id,
            'time': format_relative_time(act.created_at),
            'created_at': act.created_at.isoformat() + 'Z' if act.created_at else None,
        })

    return jsonify({'activities': result})


@dashboard_bp.route('/api/dashboard/quick-access')
def dashboard_quick_access():
    limit = request.args.get('limit', 4, type=int)

    # Get recent file activities for current user
    activities = ActivityLog.query.filter(
        ActivityLog.user_id == CURRENT_USER_ID,
        ActivityLog.file_id.isnot(None),
        ActivityLog.action.in_(['file_edited', 'file_viewed', 'file_uploaded']),
    ).order_by(ActivityLog.created_at.desc()).all()

    seen_files = set()
    result = []

    for act in activities:
        if act.file_id in seen_files:
            continue
        seen_files.add(act.file_id)

        file_obj = File.query.get(act.file_id)
        if not file_obj or file_obj.is_trashed:
            continue

        action_labels = {
            'file_edited': 'Edited',
            'file_viewed': 'Opened',
            'file_uploaded': 'Uploaded',
        }
        label = action_labels.get(act.action, 'Accessed')
        subtitle = f"{label} {format_relative_time(act.created_at)}"

        result.append({
            'id': file_obj.id,
            'name': file_obj.name,
            'icon': file_obj.icon,
            'icon_color': file_obj.icon_color,
            'icon_bg': file_obj.icon_bg or 'bg-slate-500/10',
            'subtitle': subtitle,
            'is_owner': file_obj.owner_id == CURRENT_USER_ID,
        })

        if len(result) >= limit:
            break

    return jsonify({'files': result})


@dashboard_bp.route('/api/dashboard/team')
def dashboard_team():
    members = User.query.filter(User.id != CURRENT_USER_ID).all()

    result = []
    for m in members:
        files_count = File.query.filter_by(
            owner_id=m.id, is_trashed=False
        ).count()
        initials = m.first_name[0] + m.last_name[0]

        result.append({
            'id': m.id,
            'name': f"{m.first_name} {m.last_name}",
            'initials': initials,
            'color': USER_COLORS.get(m.id, 'bg-slate-500'),
            'role': m.role,
            'files_count': files_count,
            'is_online': m.is_online,
        })

    online_count = sum(1 for m in result if m['is_online'])

    return jsonify({
        'members': result,
        'online_count': online_count,
    })
