import io


def test_upload_requires_auth(client):
    """POST /api/files/upload without token → 401."""
    data = {'file': (io.BytesIO(b'hello'), 'hello.txt')}
    res = client.post('/api/files/upload', data=data, content_type='multipart/form-data')
    assert res.status_code == 401


def test_upload_no_file_field(client, auth_headers):
    """POST with no 'file' field → 400."""
    res = client.post('/api/files/upload', headers=auth_headers, data={}, content_type='multipart/form-data')
    assert res.status_code == 400


def test_upload_empty_filename(client, auth_headers):
    """POST with empty filename → 400."""
    data = {'file': (io.BytesIO(b'data'), '')}
    res = client.post('/api/files/upload', headers=auth_headers, data=data, content_type='multipart/form-data')
    assert res.status_code == 400


def test_upload_blocked_extension(client, auth_headers):
    """.exe should be rejected → 400."""
    data = {'file': (io.BytesIO(b'MZ\x90\x00'), 'malware.exe')}
    res = client.post('/api/files/upload', headers=auth_headers, data=data, content_type='multipart/form-data')
    assert res.status_code == 400


def test_upload_valid_text(client, auth_headers):
    """Valid .txt file → 201 with file metadata."""
    content = b'Hello, CloudSpace!'
    data = {'file': (io.BytesIO(content), 'note.txt')}
    res = client.post('/api/files/upload', headers=auth_headers, data=data, content_type='multipart/form-data')
    assert res.status_code == 201
    body = res.get_json()
    assert body['name'] == 'note.txt'
    assert 'id' in body


def test_upload_valid_json(client, auth_headers):
    """Valid .json file → 201."""
    content = b'{"key": "value"}'
    data = {'file': (io.BytesIO(content), 'data.json')}
    res = client.post('/api/files/upload', headers=auth_headers, data=data, content_type='multipart/form-data')
    assert res.status_code == 201


def test_download_requires_auth(client):
    """GET /api/files/<id>/download without token → 401."""
    res = client.get('/api/files/nonexistent-id/download')
    assert res.status_code == 401


def test_download_not_found(client, auth_headers):
    """GET /api/files/<bad-id>/download → 404."""
    res = client.get('/api/files/00000000-0000-0000-0000-000000000000/download', headers=auth_headers)
    assert res.status_code == 404
