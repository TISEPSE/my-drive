import pytest


def test_forgot_password_known_email(client, db):
    from werkzeug.security import generate_password_hash
    from src.models import User
    from src.extensions import db as _db

    # Créer un utilisateur pour le test
    user = User(
        first_name='Reset',
        last_name='Test',
        email='alex.davidson@cloudspace.com',
        password_hash=generate_password_hash('password123'),
        is_verified=True,
    )
    _db.session.add(user)
    _db.session.commit()

    res = client.post('/api/auth/forgot-password', json={
        'email': 'alex.davidson@cloudspace.com'
    })
    assert res.status_code == 200
    data = res.get_json()
    # En mode sans SMTP, le token est renvoyé dans la réponse
    assert 'reset_token' in data or 'message' in data


def test_forgot_password_unknown_email(client):
    # Ne pas révéler si l'email existe (même réponse 200)
    res = client.post('/api/auth/forgot-password', json={'email': 'unknown@example.com'})
    assert res.status_code == 200


def test_forgot_password_missing_email(client):
    res = client.post('/api/auth/forgot-password', json={})
    assert res.status_code == 400


def test_reset_password_with_valid_token(client, db):
    from werkzeug.security import generate_password_hash
    from src.models import User
    from src.extensions import db as _db

    user = User(
        first_name='Reset',
        last_name='Test',
        email='reset.test@cloudspace.com',
        password_hash=generate_password_hash('oldpassword'),
        is_verified=True,
    )
    _db.session.add(user)
    _db.session.commit()

    res = client.post('/api/auth/forgot-password', json={
        'email': 'reset.test@cloudspace.com'
    })
    token = res.get_json().get('reset_token')
    if not token:
        pytest.skip('SMTP mode active, token not returned in response')

    res2 = client.post('/api/auth/reset-password', json={
        'token': token,
        'new_password': 'ResetPass789!'
    })
    assert res2.status_code == 200


def test_reset_password_with_invalid_token(client):
    res = client.post('/api/auth/reset-password', json={
        'token': 'invalid-token-xyz-000',
        'new_password': 'ResetPass789!'
    })
    assert res.status_code == 400


def test_reset_password_too_short(client, db):
    from werkzeug.security import generate_password_hash
    from src.models import User
    from src.extensions import db as _db

    user = User(
        first_name='Short',
        last_name='Pw',
        email='shortpw@cloudspace.com',
        password_hash=generate_password_hash('password123'),
        is_verified=True,
    )
    _db.session.add(user)
    _db.session.commit()

    res = client.post('/api/auth/forgot-password', json={'email': 'shortpw@cloudspace.com'})
    token = res.get_json().get('reset_token')
    if not token:
        pytest.skip('SMTP mode active')

    res2 = client.post('/api/auth/reset-password', json={
        'token': token,
        'new_password': 'short'
    })
    assert res2.status_code == 400
