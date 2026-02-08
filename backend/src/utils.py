from datetime import datetime, timezone


MIME_ICON_MAP = [
    # (pattern, icon, icon_color, icon_bg)
    ('application/pdf', 'picture_as_pdf', 'text-red-500', 'bg-red-50 dark:bg-red-500/10'),
    ('application/msword', 'description', 'text-blue-500', 'bg-blue-50 dark:bg-blue-500/10'),
    ('application/vnd.openxmlformats-officedocument.wordprocessingml', 'description', 'text-blue-500', 'bg-blue-50 dark:bg-blue-500/10'),
    ('application/vnd.ms-excel', 'table_chart', 'text-green-500', 'bg-green-50 dark:bg-green-500/10'),
    ('application/vnd.openxmlformats-officedocument.spreadsheetml', 'table_chart', 'text-green-500', 'bg-green-50 dark:bg-green-500/10'),
    ('application/vnd.ms-powerpoint', 'slideshow', 'text-orange-500', 'bg-orange-50 dark:bg-orange-500/10'),
    ('application/vnd.openxmlformats-officedocument.presentationml', 'slideshow', 'text-orange-500', 'bg-orange-50 dark:bg-orange-500/10'),
    ('image/', 'image', 'text-indigo-500', 'bg-indigo-50 dark:bg-indigo-500/10'),
    ('video/', 'video_file', 'text-purple-500', 'bg-purple-50 dark:bg-purple-500/10'),
    ('audio/', 'audio_file', 'text-pink-500', 'bg-pink-50 dark:bg-pink-500/10'),
    ('application/zip', 'folder_zip', 'text-gray-500', 'bg-gray-50 dark:bg-gray-500/10'),
    ('application/x-rar', 'folder_zip', 'text-gray-500', 'bg-gray-50 dark:bg-gray-500/10'),
    ('application/x-7z', 'folder_zip', 'text-gray-500', 'bg-gray-50 dark:bg-gray-500/10'),
    ('text/javascript', 'data_object', 'text-yellow-500', 'bg-yellow-50 dark:bg-yellow-500/10'),
    ('application/json', 'data_object', 'text-yellow-500', 'bg-yellow-50 dark:bg-yellow-500/10'),
    ('text/html', 'data_object', 'text-yellow-500', 'bg-yellow-50 dark:bg-yellow-500/10'),
    ('text/css', 'data_object', 'text-yellow-500', 'bg-yellow-50 dark:bg-yellow-500/10'),
]

DEFAULT_ICON = ('draft', 'text-slate-500', 'bg-slate-50 dark:bg-slate-500/10')

EXTENSION_ICON_MAP = {
    '.fig': ('image', 'text-indigo-500', 'bg-indigo-50 dark:bg-indigo-500/10'),
    '.pptx': ('slideshow', 'text-orange-500', 'bg-orange-50 dark:bg-orange-500/10'),
    '.ppt': ('slideshow', 'text-orange-500', 'bg-orange-50 dark:bg-orange-500/10'),
    '.docx': ('description', 'text-blue-500', 'bg-blue-50 dark:bg-blue-500/10'),
    '.doc': ('description', 'text-blue-500', 'bg-blue-50 dark:bg-blue-500/10'),
    '.xlsx': ('table_chart', 'text-green-500', 'bg-green-50 dark:bg-green-500/10'),
    '.xls': ('table_chart', 'text-green-500', 'bg-green-50 dark:bg-green-500/10'),
}


def get_icon_for_mime(mime_type, filename=None):
    """Return (icon, icon_color, icon_bg) for a given MIME type and optional filename."""
    if filename:
        import os
        ext = os.path.splitext(filename)[1].lower()
        if ext in EXTENSION_ICON_MAP:
            return EXTENSION_ICON_MAP[ext]

    if mime_type:
        for pattern, icon, color, bg in MIME_ICON_MAP:
            if mime_type.startswith(pattern):
                return (icon, color, bg)

    return DEFAULT_ICON


def format_file_size(size_bytes):
    """Format bytes to human-readable size."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"


def format_relative_time(dt):
    """Format a datetime as relative time string."""
    if dt is None:
        return ''
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    diff = now - dt
    seconds = int(diff.total_seconds())

    if seconds < 60:
        return 'Just now'
    elif seconds < 3600:
        minutes = seconds // 60
        return f"{minutes}m ago"
    elif seconds < 86400:
        hours = seconds // 3600
        return f"{hours}h ago"
    elif seconds < 172800:
        return 'Yesterday'
    elif seconds < 604800:
        days = seconds // 86400
        return f"{days}d ago"
    else:
        return dt.strftime('%b %d, %Y')
