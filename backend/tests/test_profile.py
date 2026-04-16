import pytest


def test_get_profile(client, auth_headers):
    res = client.get('/api/user/profile', headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert 'email' in data
    assert 'first_name' in data
    assert 'last_name' in data
    assert 'storage_used' in data
    assert 'storage_limit' in data


def test_get_profile_requires_auth(client):
    res = client.get('/api/user/profile')
    assert res.status_code == 401


def test_update_profile(client, auth_headers):
    res = client.put('/api/user/profile', json={
        'first_name': 'Updated',
        'last_name': 'Name',
        'bio': 'Hello world',
    }, headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data['first_name'] == 'Updated'
    assert data['bio'] == 'Hello world'


def test_update_profile_rejects_empty_first_name(client, auth_headers):
    res = client.put('/api/user/profile', json={'first_name': '  '}, headers=auth_headers)
    assert res.status_code == 400


def test_update_profile_ignores_email(client, auth_headers):
    original = client.get('/api/user/profile', headers=auth_headers).get_json()
    client.put('/api/user/profile', json={'email': 'hacker@evil.com'}, headers=auth_headers)
    profile = client.get('/api/user/profile', headers=auth_headers).get_json()
    assert profile['email'] == original['email']


def test_change_password(client, auth_headers):
    res = client.post('/api/user/password/change', json={
        'current_password': 'testpassword',
        'new_password': 'NewPass456!',
    }, headers=auth_headers)
    assert res.status_code == 200

    # Remettre l'ancien mot de passe pour ne pas casser les autres tests
    client.post('/api/user/password/change', json={
        'current_password': 'NewPass456!',
        'new_password': 'testpassword',
    }, headers=auth_headers)


def test_change_password_wrong_current(client, auth_headers):
    res = client.post('/api/user/password/change', json={
        'current_password': 'wrongpassword',
        'new_password': 'NewPass456!',
    }, headers=auth_headers)
    assert res.status_code == 401


def test_change_password_too_short(client, auth_headers):
    res = client.post('/api/user/password/change', json={
        'current_password': 'testpassword',
        'new_password': 'short',
    }, headers=auth_headers)
    assert res.status_code == 400
