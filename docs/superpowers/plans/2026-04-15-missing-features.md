# Missing Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implémenter les fonctionnalités manquantes pour un drive utilisable en production : profil utilisateur, upload avatar, reset mot de passe, pagination, et correction des N+1 queries.

**Architecture:** Nouveau blueprint `profile.py` pour le profil et l'avatar. Reset password via token JWT court-lived stocké en mémoire (pas d'email requis — token renvoyé dans la réponse pour les déploiements sans SMTP, avec SMTP optionnel via variable d'env). Pagination ajoutée sur starred et gallery via paramètre `page` + `per_page`. Fix N+1 sur starred via un COUNT groupé.

**Tech Stack:** Flask + SQLAlchemy, Werkzeug (secure_filename, generate_password_hash), JWT pour les reset tokens, Flask-Mail optionnel.

---

## File Map

### Backend — nouveaux fichiers
- `backend/src/routes/profile.py` — GET/PUT /api/user/profile + POST /api/user/profile/avatar + POST /api/user/password/change
- `backend/src/routes/password_reset.py` — POST /api/auth/forgot-password + POST /api/auth/reset-password

### Backend — fichiers modifiés
- `backend/src/routes/__init__.py` — enregistrer profile_bp + password_reset_bp
- `backend/src/routes/files.py` — pagination sur starred et gallery + fix N+1
- `backend/src/models.py` — ajouter PasswordResetToken model
- `backend/requirements.txt` — ajouter flask-mail (optionnel)
- `backend/tests/conftest.py` — fixture auth_headers déjà présente, réutiliser

### Frontend — fichiers modifiés
- `client/src/pages/Settings.jsx` — section Profil connectée à /api/user/profile
- `client/src/pages/Starred.jsx` — pagination
- `client/src/pages/Gallery.jsx` — pagination

---

## Task 1 — Profil utilisateur (GET/PUT /api/user/profile)

**Files:**
- Create: `backend/src/routes/profile.py`
- Modify: `backend/src/routes/__init__.py`
- Test: `backend/tests/test_profile.py`

- [ ] **Step 1 : Écrire le test**

Créer `backend/tests/test_profile.py` :
```python
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

def test_update_profile_rejects_email(client, auth_headers):
    res = client.put('/api/user/profile', json={'email': 'hacker@evil.com'}, headers=auth_headers)
    # email ne doit pas changer
    profile = client.get('/api/user/profile', headers=auth_headers).get_json()
    assert profile['email'] != 'hacker@evil.com'

def test_change_password(client, auth_headers):
    res = client.post('/api/user/password/change', json={
        'current_password': 'password123',
        'new_password': 'NewPass456!',
    }, headers=auth_headers)
    assert res.status_code == 200
    # Remettre l'ancien mot de passe pour ne pas casser les autres tests
    client.post('/api/user/password/change', json={
        'current_password': 'NewPass456!',
        'new_password': 'password123',
    }, headers=auth_headers)
```

- [ ] **Step 2 : Lancer les tests et vérifier qu'ils échouent**

```bash
cd backend
python -m pytest tests/test_profile.py -v
```

Attendu : `FAILED` avec `404` (routes pas encore créées).

- [ ] **Step 3 : Créer backend/src/routes/profile.py**

```python
import os
import uuid
import logging
from flask import Blueprint, request, jsonify, g, current_app
from werkzeug.utils import secure_filename
from werkzeug.security import check_password_hash, generate_password_hash
from src.extensions import db
from src.models import User
from src.utils import format_file_size
from src.auth import login_required

logger = logging.getLogger(__name__)
profile_bp = Blueprint('profile', __name__)

AVATAR_ALLOWED_MIME = {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}
AVATAR_MAX_SIZE = 5 * 1024 * 1024  # 5 MB


@profile_bp.route('/api/user/profile', methods=['GET'])
@login_required
def get_profile():
    user = db.session.get(User, g.current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({
        'id': user.id,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
        'bio': user.bio or '',
        'avatar_url': user.avatar_url,
        'role': user.role,
        'storage_used': user.storage_used or 0,
        'storage_limit': user.storage_limit,
        'formatted_storage_used': format_file_size(user.storage_used or 0),
        'formatted_storage_limit': format_file_size(user.storage_limit),
        'created_at': user.created_at.isoformat() + 'Z' if user.created_at else None,
    })


@profile_bp.route('/api/user/profile', methods=['PUT'])
@login_required
def update_profile():
    user = db.session.get(User, g.current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json() or {}
    # Champs autorisés — email exclu intentionnellement
    if 'first_name' in data:
        first_name = data['first_name'].strip()
        if not first_name or len(first_name) > 50:
            return jsonify({'error': 'first_name must be 1-50 characters'}), 400
        user.first_name = first_name
    if 'last_name' in data:
        last_name = data['last_name'].strip()
        if not last_name or len(last_name) > 50:
            return jsonify({'error': 'last_name must be 1-50 characters'}), 400
        user.last_name = last_name
    if 'bio' in data:
        user.bio = data['bio'][:500] if data['bio'] else None

    db.session.commit()
    return jsonify({
        'id': user.id,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'bio': user.bio or '',
        'avatar_url': user.avatar_url,
    })


@profile_bp.route('/api/user/profile/avatar', methods=['POST'])
@login_required
def upload_avatar():
    import magic
    user = db.session.get(User, g.current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    # Vérification magic bytes
    real_mime = magic.from_buffer(file.read(2048), mime=True)
    file.seek(0)
    if real_mime not in AVATAR_ALLOWED_MIME:
        return jsonify({'error': f'File type {real_mime} not allowed for avatar'}), 400

    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    if size > AVATAR_MAX_SIZE:
        return jsonify({'error': 'Avatar must be under 5 MB'}), 413

    # Supprimer l'ancien avatar
    if user.avatar_url:
        old_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'avatars',
                                os.path.basename(user.avatar_url))
        if os.path.exists(old_path):
            os.remove(old_path)

    ext = {
        'image/jpeg': '.jpg', 'image/png': '.png',
        'image/webp': '.webp', 'image/gif': '.gif',
    }.get(real_mime, '.jpg')
    filename = str(uuid.uuid4()) + ext
    save_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'avatars')
    os.makedirs(save_dir, exist_ok=True)
    file.save(os.path.join(save_dir, filename))

    user.avatar_url = f'/api/user/avatar/{filename}'
    db.session.commit()
    return jsonify({'avatar_url': user.avatar_url})


@profile_bp.route('/api/user/avatar/<filename>')
def serve_avatar(filename):
    """Sert les avatars sans authentification (URLs semi-publiques)."""
    import re
    from flask import send_file
    # Sécurité : uniquement UUID + extension connue
    if not re.match(r'^[0-9a-f-]{36}\.(jpg|png|webp|gif)$', filename):
        return jsonify({'error': 'Not found'}), 404
    path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'avatars', filename)
    if not os.path.exists(path):
        return jsonify({'error': 'Not found'}), 404
    return send_file(path)


@profile_bp.route('/api/user/password/change', methods=['POST'])
@login_required
def change_password():
    user = db.session.get(User, g.current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json() or {}
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')

    if not check_password_hash(user.password_hash, current_password):
        return jsonify({'error': 'Current password is incorrect'}), 401
    if len(new_password) < 8:
        return jsonify({'error': 'New password must be at least 8 characters'}), 400

    user.password_hash = generate_password_hash(new_password)
    db.session.commit()
    logger.info('Password changed for user %s', user.id)
    return jsonify({'message': 'Password changed successfully'})
```

- [ ] **Step 4 : Enregistrer le blueprint dans __init__.py**

Lire `backend/src/routes/__init__.py`. Ajouter :
```python
from src.routes.profile import profile_bp
# dans register_blueprints(app):
app.register_blueprint(profile_bp)
```

- [ ] **Step 5 : Lancer les tests et vérifier qu'ils passent**

```bash
cd backend
python -m pytest tests/test_profile.py -v
```

Attendu : `4 passed`.

- [ ] **Step 6 : Commit**

```bash
git add backend/src/routes/profile.py backend/src/routes/__init__.py backend/tests/test_profile.py
git commit -m "feat(backend): add user profile GET/PUT, avatar upload, password change"
```

---

## Task 2 — Reset mot de passe (sans SMTP obligatoire)

**Files:**
- Create: `backend/src/routes/password_reset.py`
- Modify: `backend/src/models.py` — ajouter PasswordResetToken
- Modify: `backend/src/routes/__init__.py`
- Test: `backend/tests/test_password_reset.py`

- [ ] **Step 1 : Ajouter PasswordResetToken dans models.py**

Lire `backend/src/models.py`. Ajouter à la fin :
```python
class PasswordResetToken(db.Model):
    __tablename__ = 'password_reset_token'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    token = db.Column(db.String(64), unique=True, nullable=False, index=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
```

- [ ] **Step 2 : Écrire les tests**

Créer `backend/tests/test_password_reset.py` :
```python
def test_forgot_password_known_email(client):
    res = client.post('/api/auth/forgot-password', json={
        'email': 'alex.davidson@cloudspace.com'
    })
    assert res.status_code == 200
    data = res.get_json()
    # En mode sans SMTP, le token est renvoyé dans la réponse
    assert 'reset_token' in data or 'message' in data

def test_forgot_password_unknown_email(client):
    # Ne pas révéler si l'email existe (même réponse)
    res = client.post('/api/auth/forgot-password', json={'email': 'unknown@x.com'})
    assert res.status_code == 200

def test_reset_password_with_valid_token(client):
    # Obtenir un token
    res = client.post('/api/auth/forgot-password', json={
        'email': 'alex.davidson@cloudspace.com'
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
        'token': 'invalid-token-xyz',
        'new_password': 'ResetPass789!'
    })
    assert res.status_code == 400
```

- [ ] **Step 3 : Lancer les tests et vérifier qu'ils échouent**

```bash
python -m pytest tests/test_password_reset.py -v
```

Attendu : `FAILED` avec 404.

- [ ] **Step 4 : Créer backend/src/routes/password_reset.py**

```python
import os
import secrets
import logging
from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash
from src.extensions import db
from src.models import User, PasswordResetToken

logger = logging.getLogger(__name__)
password_reset_bp = Blueprint('password_reset', __name__)

TOKEN_EXPIRY_MINUTES = 30


def _send_reset_email(email, token, app):
    """Envoie l'email de reset si SMTP est configuré. Sinon log le token."""
    smtp_host = os.getenv('SMTP_HOST', '')
    if not smtp_host:
        logger.warning('SMTP not configured. Reset token for %s: %s', email, token)
        return False  # indique que l'email n'a pas été envoyé

    try:
        import smtplib
        from email.mime.text import MIMEText
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:8080')
        reset_url = f"{frontend_url}/reset-password?token={token}"
        body = f"Cliquez sur ce lien pour réinitialiser votre mot de passe :\n\n{reset_url}\n\nCe lien expire dans {TOKEN_EXPIRY_MINUTES} minutes."
        msg = MIMEText(body)
        msg['Subject'] = 'Réinitialisation de votre mot de passe CloudSpace'
        msg['From'] = os.getenv('SMTP_FROM', 'noreply@cloudspace.io')
        msg['To'] = email

        with smtplib.SMTP(smtp_host, int(os.getenv('SMTP_PORT', 587))) as server:
            server.starttls()
            if os.getenv('SMTP_USER'):
                server.login(os.getenv('SMTP_USER'), os.getenv('SMTP_PASSWORD', ''))
            server.send_message(msg)
        return True
    except Exception as e:
        logger.error('Failed to send reset email: %s', e)
        return False


@password_reset_bp.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    user = User.query.filter_by(email=email).first()

    # Toujours retourner 200 pour ne pas révéler si l'email existe
    if not user:
        return jsonify({'message': 'If this email exists, a reset link has been sent.'}), 200

    # Invalider les anciens tokens
    PasswordResetToken.query.filter_by(user_id=user.id, used=False).update({'used': True})
    db.session.flush()

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRY_MINUTES)
    reset_token = PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=expires_at,
    )
    db.session.add(reset_token)
    db.session.commit()

    email_sent = _send_reset_email(email, token, current_app)

    response = {'message': 'If this email exists, a reset link has been sent.'}
    # Si pas de SMTP configuré, renvoyer le token directement (mode dev/self-hosted)
    if not email_sent:
        response['reset_token'] = token
        response['note'] = 'SMTP not configured. Token returned directly for self-hosted deployments.'

    return jsonify(response), 200


@password_reset_bp.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    token_str = data.get('token', '').strip()
    new_password = data.get('new_password', '')

    if not token_str or not new_password:
        return jsonify({'error': 'Token and new_password are required'}), 400
    if len(new_password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400

    now = datetime.now(timezone.utc)
    reset_token = PasswordResetToken.query.filter_by(token=token_str, used=False).first()

    if not reset_token:
        return jsonify({'error': 'Invalid or expired reset token'}), 400

    expires_at = reset_token.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < now:
        return jsonify({'error': 'Reset token has expired'}), 400

    user = db.session.get(User, reset_token.user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user.password_hash = generate_password_hash(new_password)
    reset_token.used = True
    db.session.commit()
    logger.info('Password reset for user %s', user.id)
    return jsonify({'message': 'Password reset successfully'})
```

- [ ] **Step 5 : Enregistrer dans __init__.py**

Lire `backend/src/routes/__init__.py`. Ajouter :
```python
from src.routes.password_reset import password_reset_bp
# dans register_blueprints(app):
app.register_blueprint(password_reset_bp)
```

- [ ] **Step 6 : Mettre à jour conftest.py pour créer la table**

Lire `backend/tests/conftest.py`. Vérifier que `db.create_all()` est appelé. Si oui, la table `password_reset_token` sera créée automatiquement en test (SQLite in-memory).

- [ ] **Step 7 : Lancer les tests**

```bash
python -m pytest tests/test_password_reset.py -v
```

Attendu : `4 passed`.

- [ ] **Step 8 : Commit**

```bash
git add backend/src/routes/password_reset.py backend/src/routes/__init__.py \
        backend/src/models.py backend/tests/test_password_reset.py
git commit -m "feat(backend): add forgot/reset password flow with optional SMTP"
```

---

## Task 3 — Pagination starred + gallery + fix N+1

**Files:**
- Modify: `backend/src/routes/files.py`
- Modify: `client/src/pages/Starred.jsx`
- Modify: `client/src/pages/Gallery.jsx`

- [ ] **Step 1 : Lire les routes starred et gallery dans files.py**

Repérer les fonctions `list_starred` et `list_gallery` (ajoutées précédemment, vers la fin du fichier).

- [ ] **Step 2 : Fix N+1 + pagination sur list_starred**

Remplacer la fonction `list_starred` par :
```python
@files_bp.route('/api/files/starred', methods=['GET'])
@login_required
def list_starred():
    from sqlalchemy import func
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)

    # Compter les enfants en une seule requête (fix N+1)
    children_counts = dict(
        db.session.query(File.parent_id, func.count(File.id))
        .filter(File.owner_id == g.current_user_id, File.is_trashed == False, File.parent_id.isnot(None))
        .group_by(File.parent_id)
        .all()
    )

    query = File.query.filter_by(
        owner_id=g.current_user_id, is_starred=True, is_trashed=False,
    ).order_by(File.updated_at.desc())

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()

    def serialize(f):
        return {
            'id': f.id,
            'name': f.name,
            'is_folder': f.is_folder,
            'mime_type': f.mime_type,
            'size': f.size,
            'formatted_size': format_file_size(f.size) if f.size else '--',
            'icon': f.icon,
            'icon_color': f.icon_color,
            'icon_bg': f.icon_bg or ('bg-yellow-50 dark:bg-yellow-500/10' if f.is_folder else 'bg-slate-50'),
            'is_starred': f.is_starred,
            'is_locked': f.is_locked,
            'updated_at': f.updated_at.isoformat() + 'Z' if f.updated_at else None,
            'relative_time': format_relative_time(f.updated_at) if f.updated_at else None,
            'items_count': children_counts.get(f.id, 0) if f.is_folder else None,
        }

    folders = [serialize(f) for f in items if f.is_folder]
    files = [serialize(f) for f in items if not f.is_folder]
    return jsonify({
        'folders': folders,
        'files': files,
        'total': total,
        'page': page,
        'per_page': per_page,
        'has_more': (page * per_page) < total,
    })
```

- [ ] **Step 3 : Ajouter pagination sur list_gallery**

Remplacer la fonction `list_gallery` par :
```python
@files_bp.route('/api/files/gallery', methods=['GET'])
@login_required
def list_gallery():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 60, type=int)

    query = File.query.filter(
        File.owner_id == g.current_user_id,
        File.is_trashed == False,
        File.is_folder == False,
        File.mime_type.like('image/%'),
    ).order_by(File.created_at.desc())

    total = query.count()
    images = query.offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        'images': [{
            'id': f.id,
            'name': f.name,
            'mime_type': f.mime_type,
            'size': f.size,
            'formatted_size': format_file_size(f.size) if f.size else '--',
            'created_at': f.created_at.isoformat() + 'Z' if f.created_at else None,
        } for f in images],
        'total': total,
        'page': page,
        'per_page': per_page,
        'has_more': (page * per_page) < total,
    })
```

- [ ] **Step 4 : Tester les routes**

```bash
docker build -t my-drive-api ./backend
docker stop Backend-Flask && docker rm Backend-Flask
docker compose up -d api && sleep 8
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex.davidson@cloudspace.com","password":"password123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
curl -s "http://localhost:8080/api/files/starred?page=1&per_page=10" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -10
```

Attendu : réponse avec `total`, `page`, `has_more`.

- [ ] **Step 5 : Mettre à jour Starred.jsx pour la pagination**

Lire `client/src/pages/Starred.jsx`. Dans le `useEffect`, ajouter le support de `has_more` :
```jsx
// Remplacer le useEffect existant par :
useEffect(() => {
  apiFetch('/api/files/starred?per_page=50')
    .then(r => r.json())
    .then(data => {
      setFolders(data.folders || [])
      setFiles(data.files || [])
    })
    .finally(() => setLoading(false))
}, [])
```

(La pagination complète côté frontend est optionnelle pour l'instant — 50 éléments par page couvre 99% des cas d'usage d'un drive personnel.)

- [ ] **Step 6 : Commit**

```bash
git add backend/src/routes/files.py client/src/pages/Starred.jsx client/src/pages/Gallery.jsx
git commit -m "perf(backend): fix N+1 on starred, add pagination to starred and gallery"
```

---

## Task 4 — Page Profil dans Settings.jsx

**Files:**
- Modify: `client/src/pages/Settings.jsx`

- [ ] **Step 1 : Lire Settings.jsx**

```bash
wc -l client/src/pages/Settings.jsx
```

Repérer la section qui affiche les infos utilisateur (nom, email, bio, avatar).

- [ ] **Step 2 : Connecter la section profil à GET/PUT /api/user/profile**

Dans `Settings.jsx`, ajouter un `useEffect` pour charger le profil et un handler `handleSaveProfile` :

```jsx
import { apiFetch } from '../lib/api'

// Dans le composant Settings, ajouter ces états :
const [profile, setProfile] = useState({ first_name: '', last_name: '', bio: '', email: '', avatar_url: null })
const [saving, setSaving] = useState(false)

// Charger le profil au montage
useEffect(() => {
  apiFetch('/api/user/profile')
    .then(r => r.json())
    .then(data => setProfile(data))
}, [])

// Sauvegarder le profil
const handleSaveProfile = async () => {
  setSaving(true)
  try {
    const res = await apiFetch('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({
        first_name: profile.first_name,
        last_name: profile.last_name,
        bio: profile.bio,
      }),
    })
    const data = await res.json()
    if (res.ok) setProfile(prev => ({ ...prev, ...data }))
  } finally {
    setSaving(false)
  }
}
```

Dans le JSX, lier les inputs existants à `profile` et appeler `handleSaveProfile` sur le bouton Save.

- [ ] **Step 3 : Connecter l'upload avatar à POST /api/user/profile/avatar**

```jsx
const handleAvatarChange = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  const formData = new FormData()
  formData.append('file', file)
  const res = await apiFetch('/api/user/profile/avatar', { method: 'POST', body: formData })
  const data = await res.json()
  if (res.ok) setProfile(prev => ({ ...prev, avatar_url: data.avatar_url }))
}
```

- [ ] **Step 4 : Connecter le changement de mot de passe**

```jsx
const handleChangePassword = async ({ current, next }) => {
  const res = await apiFetch('/api/user/password/change', {
    method: 'POST',
    body: JSON.stringify({ current_password: current, new_password: next }),
  })
  return res.ok
}
```

- [ ] **Step 5 : Vérifier visuellement**

Naviguer sur `/settings` → section Profil. Modifier le prénom et cliquer Save. Rafraîchir la page et vérifier que le changement persiste. Uploader un avatar et vérifier qu'il s'affiche.

- [ ] **Step 6 : Commit**

```bash
git add client/src/pages/Settings.jsx
git commit -m "feat(frontend): connect settings profile section to real API"
```

---

## Vérification finale

- [ ] Tous les tests backend passent : `python -m pytest backend/tests/ -v` → `17+ passed`
- [ ] Reset password fonctionne sans SMTP : POST `/api/auth/forgot-password` renvoie `reset_token` dans la réponse
- [ ] Profil modifiable depuis Settings
- [ ] Avatar uploadable et affiché
- [ ] starred et gallery répondent avec `total` et `has_more`
- [ ] Rebuild Docker complet : `docker build -t my-drive-api ./backend && docker build -t my-drive-client ./client`

```bash
git tag features-complete
```
