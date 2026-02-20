from datetime import datetime, timezone, timedelta
from werkzeug.security import generate_password_hash
from src.extensions import db
from src.models import User, File, ActivityLog, UserSettings
from src.utils import get_icon_for_mime


def seed_data():
    """Seed initial data if the database is empty."""
    if User.query.first() is not None:
        return

    user = User(
        id='user-alex-001',
        first_name='Alex',
        last_name='Davidson',
        email='alex.davidson@cloudspace.com',
        password_hash=generate_password_hash('password123'),
        bio='Lead Designer at CloudSpace. Loves minimalism and clean code.',
        role='Designer',
        is_online=True,
        storage_used=16324091904,
        storage_limit=21474836480,
    )
    db.session.add(user)

    team = [
        User(id='user-sarah-001', first_name='Sarah', last_name='Miller',
             email='sarah.miller@cloudspace.com',
             password_hash=generate_password_hash('password123'),
             role='Designer', is_online=True, storage_used=5*1024**3),
        User(id='user-mike-001', first_name='Mike', last_name='Ross',
             email='mike.ross@cloudspace.com',
             password_hash=generate_password_hash('password123'),
             role='Finance', is_online=True, storage_used=2*1024**3),
        User(id='user-jessica-001', first_name='Jessica', last_name='Pearson',
             email='jessica.pearson@cloudspace.com',
             password_hash=generate_password_hash('password123'),
             role='Manager', is_online=False, storage_used=3*1024**3),
        User(id='user-david-001', first_name='David', last_name='Kim',
             email='david.kim@cloudspace.com',
             password_hash=generate_password_hash('password123'),
             role='Marketing', is_online=True, storage_used=8*1024**3),
    ]
    db.session.add_all(team)

    now = datetime.now(timezone.utc)

    folders_data = [
        ('Marketing Assets', 24),
        ('Product Design', 156),
        ('Financials 2024', 8),
        ('Personal', 42),
        ('Confidential', 3),
        ('Clients', 12),
    ]
    folder_objs = []
    for name, _ in folders_data:
        locked = name == 'Confidential'
        f = File(
            name=name, is_folder=True,
            icon='folder_shared' if locked else 'folder',
            icon_color='text-indigo-500' if locked else 'text-yellow-500',
            owner_id='user-alex-001',
            is_locked=locked,
            created_at=now - timedelta(days=30),
            updated_at=now - timedelta(days=2),
        )
        db.session.add(f)
        folder_objs.append(f)

    files_data = [
        ('Logo_V2.fig',        'application/x-figma',                                                           2516582),
        ('Q3_Report.pdf',      'application/pdf',                                                               5033165),
        ('Budget_2024.xlsx',   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',             1258291),
        ('Project_Brief.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',        870400),
        ('Q4_Strategy.pptx',   'application/vnd.openxmlformats-officedocument.presentationml.presentation',   13107200),
        ('Demo_Recording.mp4', 'video/mp4',                                                                  134217728),
        ('config.json',        'application/json',                                                                4096),
        ('Archive_2023.zip',   'application/zip',                                                            471859200),
    ]

    file_objs = []
    for i, (name, mime, size) in enumerate(files_data):
        icon, color, bg = get_icon_for_mime(mime, filename=name)
        f = File(
            name=name, is_folder=False, mime_type=mime, size=size,
            icon=icon, icon_color=color, icon_bg=bg,
            owner_id='user-alex-001',
            created_at=now - timedelta(days=i * 3),
            updated_at=now - timedelta(hours=i * 5),
        )
        db.session.add(f)
        file_objs.append(f)

    db.session.flush()

    # Add child files inside folders for realistic item counts
    for folder, (_, count) in zip(folder_objs, folders_data):
        for j in range(min(count, 5)):
            child = File(
                name=f"file_{j+1}.txt", is_folder=False,
                mime_type='text/plain', size=1024 * (j + 1),
                icon='description', icon_color='text-blue-500',
                icon_bg='bg-blue-50 dark:bg-blue-500/10',
                parent_id=folder.id, owner_id='user-alex-001',
                created_at=now - timedelta(days=j),
                updated_at=now - timedelta(days=j),
            )
            db.session.add(child)

    activities = [
        ('user-sarah-001', file_objs[0].id, 'file_uploaded',
         {'size': 2516582}, now - timedelta(minutes=10)),
        ('user-mike-001', file_objs[2].id, 'comment_added',
         {}, now - timedelta(minutes=25)),
        ('user-alex-001', file_objs[3].id, 'file_edited',
         {'version': 3}, now - timedelta(hours=1)),
        ('user-jessica-001', file_objs[1].id, 'file_shared',
         {'shared_with': 'user-alex-001', 'permission': 'editor'}, now - timedelta(hours=2)),
        ('user-david-001', None, 'file_moved',
         {'from_folder': 'root', 'to_folder': folder_objs[0].id}, now - timedelta(hours=3)),
        ('user-alex-001', file_objs[3].id, 'file_downloaded',
         {}, now - timedelta(hours=5)),
        ('user-alex-001', file_objs[0].id, 'file_viewed',
         {}, now - timedelta(minutes=5)),
        ('user-alex-001', file_objs[1].id, 'file_viewed',
         {}, now - timedelta(hours=12)),
        ('user-alex-001', file_objs[2].id, 'file_edited',
         {'version': 2}, now - timedelta(days=1)),
        ('user-alex-001', file_objs[3].id, 'file_uploaded',
         {'size': 870400}, now - timedelta(days=2)),
    ]

    for uid, fid, action, details, created in activities:
        log = ActivityLog(
            user_id=uid, file_id=fid, action=action,
            details=details, created_at=created,
        )
        db.session.add(log)

    # Default user settings
    settings = UserSettings(user_id='user-alex-001', theme='dark')
    db.session.add(settings)

    db.session.commit()
