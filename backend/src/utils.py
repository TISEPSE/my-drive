from datetime import datetime, timezone


MIME_ICON_MAP = [
    # (pattern, icon, icon_color, icon_bg)
    # Documents
    ('application/pdf', 'picture_as_pdf', 'text-red-500', 'bg-red-50 dark:bg-red-500/10'),
    ('application/msword', 'description', 'text-blue-500', 'bg-blue-50 dark:bg-blue-500/10'),
    ('application/vnd.openxmlformats-officedocument.wordprocessingml', 'description', 'text-blue-500', 'bg-blue-50 dark:bg-blue-500/10'),
    ('application/vnd.ms-excel', 'table_chart', 'text-green-500', 'bg-green-50 dark:bg-green-500/10'),
    ('application/vnd.openxmlformats-officedocument.spreadsheetml', 'table_chart', 'text-green-500', 'bg-green-50 dark:bg-green-500/10'),
    ('application/vnd.ms-powerpoint', 'slideshow', 'text-orange-500', 'bg-orange-50 dark:bg-orange-500/10'),
    ('application/vnd.openxmlformats-officedocument.presentationml', 'slideshow', 'text-orange-500', 'bg-orange-50 dark:bg-orange-500/10'),
    # Media
    ('image/', 'image', 'text-indigo-500', 'bg-indigo-50 dark:bg-indigo-500/10'),
    ('video/', 'video_file', 'text-purple-500', 'bg-purple-50 dark:bg-purple-500/10'),
    ('audio/', 'audio_file', 'text-pink-500', 'bg-pink-50 dark:bg-pink-500/10'),
    # Archives
    ('application/zip', 'folder_zip', 'text-stone-600', 'bg-stone-200 dark:bg-stone-500/20'),
    ('application/x-rar', 'folder_zip', 'text-stone-600', 'bg-stone-200 dark:bg-stone-500/20'),
    ('application/vnd.rar', 'folder_zip', 'text-stone-600', 'bg-stone-200 dark:bg-stone-500/20'),
    ('application/x-7z', 'folder_zip', 'text-stone-600', 'bg-stone-200 dark:bg-stone-500/20'),
    ('application/x-tar', 'folder_zip', 'text-stone-600', 'bg-stone-200 dark:bg-stone-500/20'),
    ('application/gzip', 'folder_zip', 'text-stone-600', 'bg-stone-200 dark:bg-stone-500/20'),
    ('application/x-bzip', 'folder_zip', 'text-stone-600', 'bg-stone-200 dark:bg-stone-500/20'),
    # Code & data
    ('application/json', 'data_object', 'text-yellow-500', 'bg-yellow-50 dark:bg-yellow-500/10'),
    ('application/xml', 'data_object', 'text-yellow-500', 'bg-yellow-50 dark:bg-yellow-500/10'),
    ('application/sql', 'database', 'text-cyan-500', 'bg-cyan-50 dark:bg-cyan-500/10'),
    ('text/javascript', 'data_object', 'text-yellow-500', 'bg-yellow-50 dark:bg-yellow-500/10'),
    ('text/typescript', 'data_object', 'text-blue-400', 'bg-blue-50 dark:bg-blue-400/10'),
    ('text/html', 'code', 'text-orange-400', 'bg-orange-50 dark:bg-orange-400/10'),
    ('text/css', 'palette', 'text-pink-400', 'bg-pink-50 dark:bg-pink-400/10'),
    ('text/xml', 'data_object', 'text-yellow-500', 'bg-yellow-50 dark:bg-yellow-500/10'),
    ('text/csv', 'table_chart', 'text-green-500', 'bg-green-50 dark:bg-green-500/10'),
    ('text/markdown', 'description', 'text-slate-500', 'bg-slate-100 dark:bg-slate-500/10'),
    ('text/plain', 'description', 'text-blue-400', 'bg-blue-50 dark:bg-blue-400/10'),
    ('text/x-python', 'data_object', 'text-yellow-500', 'bg-yellow-50 dark:bg-yellow-500/10'),
    ('application/x-python', 'data_object', 'text-yellow-500', 'bg-yellow-50 dark:bg-yellow-500/10'),
    # Design tools
    ('application/x-figma', 'image', 'text-purple-500', 'bg-purple-50 dark:bg-purple-500/10'),
    # Ebooks
    ('application/epub', 'menu_book', 'text-teal-500', 'bg-teal-50 dark:bg-teal-500/10'),
]

DEFAULT_ICON = ('draft', 'text-slate-500', 'bg-slate-200 dark:bg-slate-500/20')

EXTENSION_ICON_MAP = {
    # Design
    '.fig':   ('image',         'text-purple-500', 'bg-purple-50 dark:bg-purple-500/10'),
    '.sketch': ('image',        'text-orange-400', 'bg-orange-50 dark:bg-orange-400/10'),
    '.xd':    ('image',         'text-pink-500',   'bg-pink-50 dark:bg-pink-500/10'),
    # Office
    '.pptx':  ('slideshow',     'text-orange-500', 'bg-orange-50 dark:bg-orange-500/10'),
    '.ppt':   ('slideshow',     'text-orange-500', 'bg-orange-50 dark:bg-orange-500/10'),
    '.docx':  ('description',   'text-blue-500',   'bg-blue-50 dark:bg-blue-500/10'),
    '.doc':   ('description',   'text-blue-500',   'bg-blue-50 dark:bg-blue-500/10'),
    '.xlsx':  ('table_chart',   'text-green-500',  'bg-green-50 dark:bg-green-500/10'),
    '.xls':   ('table_chart',   'text-green-500',  'bg-green-50 dark:bg-green-500/10'),
    '.csv':   ('table_chart',   'text-green-500',  'bg-green-50 dark:bg-green-500/10'),
    # Code
    '.py':    ('data_object',   'text-yellow-500', 'bg-yellow-50 dark:bg-yellow-500/10'),
    '.js':    ('data_object',   'text-yellow-400', 'bg-yellow-50 dark:bg-yellow-400/10'),
    '.ts':    ('data_object',   'text-blue-400',   'bg-blue-50 dark:bg-blue-400/10'),
    '.jsx':   ('data_object',   'text-cyan-400',   'bg-cyan-50 dark:bg-cyan-400/10'),
    '.tsx':   ('data_object',   'text-cyan-500',   'bg-cyan-50 dark:bg-cyan-500/10'),
    '.html':  ('code',          'text-orange-400', 'bg-orange-50 dark:bg-orange-400/10'),
    '.css':   ('palette',       'text-pink-400',   'bg-pink-50 dark:bg-pink-400/10'),
    '.sql':   ('database',      'text-cyan-500',   'bg-cyan-50 dark:bg-cyan-500/10'),
    '.json':  ('data_object',   'text-yellow-500', 'bg-yellow-50 dark:bg-yellow-500/10'),
    '.xml':   ('data_object',   'text-yellow-400', 'bg-yellow-50 dark:bg-yellow-400/10'),
    '.yaml':  ('data_object',   'text-green-400',  'bg-green-50 dark:bg-green-400/10'),
    '.yml':   ('data_object',   'text-green-400',  'bg-green-50 dark:bg-green-400/10'),
    '.sh':    ('terminal',      'text-slate-500',   'bg-slate-100 dark:bg-slate-500/10'),
    # Documents
    '.md':    ('description',   'text-slate-500',   'bg-slate-100 dark:bg-slate-500/10'),
    '.pdf':   ('picture_as_pdf','text-red-500',    'bg-red-50 dark:bg-red-500/10'),
    '.epub':  ('menu_book',     'text-teal-500',   'bg-teal-50 dark:bg-teal-500/10'),
    # Archives
    '.zip':   ('folder_zip',    'text-stone-600',   'bg-stone-200 dark:bg-stone-500/20'),
    '.rar':   ('folder_zip',    'text-stone-600',   'bg-stone-200 dark:bg-stone-500/20'),
    '.7z':    ('folder_zip',    'text-stone-600',   'bg-stone-200 dark:bg-stone-500/20'),
    '.tar':   ('folder_zip',    'text-stone-600',   'bg-stone-200 dark:bg-stone-500/20'),
    '.gz':    ('folder_zip',    'text-stone-600',   'bg-stone-200 dark:bg-stone-500/20'),
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
