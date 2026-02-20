from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from src.models import User, File
from src.extensions import db


def make_user(uid, email):
    return User(
        id=uid,
        first_name='Test',
        last_name='User',
        email=email,
        password_hash=generate_password_hash('testpass'),
    )


def test_user_creation(app, db):
    with app.app_context():
        user = make_user('u-test-1', 'alice@test.com')
        db.session.add(user)
        db.session.commit()

        found = db.session.get(User, 'u-test-1')
        assert found is not None
        assert found.email == 'alice@test.com'
        assert found.first_name == 'Test'


def test_password_hashing(app, db):
    with app.app_context():
        user = make_user('u-test-2', 'bob@test.com')
        db.session.add(user)
        db.session.commit()

        found = db.session.get(User, 'u-test-2')
        assert check_password_hash(found.password_hash, 'testpass')
        assert not check_password_hash(found.password_hash, 'wrongpassword')
        assert found.password_hash != 'testpass'


def make_file(name, owner_id, **kwargs):
    defaults = dict(is_folder=False, mime_type='application/pdf', size=1024,
                    icon='draft', icon_color='text-slate-500', icon_bg='bg-slate-50')
    defaults.update(kwargs)
    return File(name=name, owner_id=owner_id, **defaults)


def test_file_creation(app, db):
    with app.app_context():
        user = make_user('u-test-3', 'c@test.com')
        db.session.add(user)
        f = make_file('report.pdf', 'u-test-3', size=2048, mime_type='application/pdf')
        db.session.add(f)
        db.session.commit()

        found = File.query.filter_by(name='report.pdf').first()
        assert found is not None
        assert found.size == 2048
        assert found.is_trashed is False
        assert found.is_starred is False


def test_folder_creation(app, db):
    with app.app_context():
        user = make_user('u-test-4', 'd@test.com')
        db.session.add(user)
        folder = File(name='My Docs', is_folder=True, icon='folder',
                      icon_color='text-yellow-500', icon_bg='bg-yellow-50', owner_id='u-test-4')
        db.session.add(folder)
        db.session.commit()

        found = File.query.filter_by(name='My Docs').first()
        assert found.is_folder is True


def test_soft_delete(app, db):
    with app.app_context():
        user = make_user('u-test-5', 'e@test.com')
        db.session.add(user)
        f = make_file('old.txt', 'u-test-5')
        db.session.add(f)
        db.session.commit()

        f.is_trashed = True
        f.trashed_at = datetime.now(timezone.utc)
        db.session.commit()

        found = File.query.filter_by(name='old.txt').first()
        assert found.is_trashed is True
        assert found.trashed_at is not None
