# CloudSpace POC Completion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer toutes les données hardcodées des pages frontend par de vraies données API, et créer les routes backend manquantes pour obtenir un POC fonctionnel de bout en bout.

**Architecture:** Ajout de 4 routes dans `files.py` (starred, recent, gallery, copy) + 3 nouveaux blueprints Flask (history, sharing, search) + connexion des 5 pages React aux vrais endpoints. Chaque page remplace ses tableaux statiques par un `useEffect` + `apiFetch`.

**Tech Stack:** Flask + SQLAlchemy (backend), React + `apiFetch` de `src/lib/api.js` (frontend), Tailwind CSS.

---

## File Map

### Backend — fichiers modifiés
- `backend/src/routes/files.py` — ajout de `GET /api/files/starred`, `GET /api/files/recent`, `GET /api/files/gallery`, `POST /api/files/<id>/copy`
- `backend/src/routes/__init__.py` — enregistrement des nouveaux blueprints

### Backend — nouveaux fichiers
- `backend/src/routes/history.py` — `GET /api/activity/history`
- `backend/src/routes/sharing.py` — `GET /api/sharing/shared-with-me`
- `backend/src/routes/search.py` — `GET /api/search?q=&type=`

### Frontend — fichiers modifiés
- `client/src/pages/Starred.jsx` — connecté à `/api/files/starred`
- `client/src/pages/Recent.jsx` — connecté à `/api/files/recent`
- `client/src/pages/History.jsx` — connecté à `/api/activity/history`
- `client/src/pages/SharedWithMe.jsx` — connecté à `/api/sharing/shared-with-me`
- `client/src/pages/Gallery.jsx` — connecté à `/api/files/gallery`

---

## Task 1 — Backend: routes starred, recent, gallery dans files.py

**Files:**
- Modify: `backend/src/routes/files.py` (ajouter après la route `/rename`)

- [ ] **Step 1 : Ajouter GET /api/files/starred**

Ajouter à la fin de `backend/src/routes/files.py` :

```python
@files_bp.route('/api/files/starred', methods=['GET'])
@login_required
def list_starred():
    from src.utils import format_file_size, format_relative_time

    items = File.query.filter_by(
        owner_id=g.current_user_id,
        is_starred=True,
        is_trashed=False,
    ).order_by(File.updated_at.desc()).all()

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
            'items_count': File.query.filter_by(parent_id=f.id, is_trashed=False).count() if f.is_folder else None,
        }

    folders = [serialize(f) for f in items if f.is_folder]
    files = [serialize(f) for f in items if not f.is_folder]
    return jsonify({'folders': folders, 'files': files})
```

- [ ] **Step 2 : Ajouter GET /api/files/recent**

Ajouter après la route starred :

```python
@files_bp.route('/api/files/recent', methods=['GET'])
@login_required
def list_recent():
    from collections import defaultdict
    from src.utils import format_file_size, format_relative_time
    from src.models import ActivityLog
    from datetime import datetime, timezone, timedelta

    # Récupère les 100 dernières activités de l'utilisateur sur ses fichiers
    activities = ActivityLog.query.filter(
        ActivityLog.user_id == g.current_user_id,
        ActivityLog.file_id.isnot(None),
    ).order_by(ActivityLog.created_at.desc()).limit(100).all()

    seen = set()
    ordered_files = []
    for act in activities:
        if act.file_id in seen:
            continue
        seen.add(act.file_id)
        f = db.session.get(File, act.file_id)
        if f and not f.is_trashed and not f.is_folder:
            ordered_files.append((f, act))

    # Grouper par date relative
    now = datetime.now(timezone.utc)
    today = now.date()
    yesterday = (now - timedelta(days=1)).date()
    week_ago = now - timedelta(days=7)

    groups = defaultdict(list)

    for f, act in ordered_files[:50]:
        act_date = act.created_at.date() if act.created_at else today
        if act_date == today:
            group_key = "Aujourd'hui"
        elif act_date == yesterday:
            group_key = 'Hier'
        elif act.created_at >= week_ago:
            group_key = 'Cette semaine'
        else:
            group_key = 'Plus tôt'

        action_labels = {
            'file_uploaded': 'Importé',
            'file_edited': 'Modifié',
            'file_viewed': 'Consulté',
            'file_renamed': 'Renommé',
            'file_starred': 'Mis en favori',
            'file_downloaded': 'Téléchargé',
        }
        activity_label = action_labels.get(act.action, 'Accédé')
        if act.created_at:
            time_str = act.created_at.strftime('%H:%M')
            activity_str = f"{activity_label} à {time_str}"
        else:
            activity_str = activity_label

        groups[group_key].append({
            'id': f.id,
            'name': f.name,
            'mime_type': f.mime_type,
            'size': f.size,
            'formatted_size': format_file_size(f.size) if f.size else '--',
            'icon': f.icon,
            'icon_color': f.icon_color,
            'icon_bg': f.icon_bg or 'bg-slate-50',
            'activity': activity_str,
            'updated_at': f.updated_at.isoformat() + 'Z' if f.updated_at else None,
        })

    # Ordre fixe des groupes
    order = ["Aujourd'hui", 'Hier', 'Cette semaine', 'Plus tôt']
    result = [
        {'date': key, 'files': groups[key]}
        for key in order if key in groups
    ]
    return jsonify({'groups': result})
```

- [ ] **Step 3 : Ajouter GET /api/files/gallery**

Ajouter après la route recent :

```python
@files_bp.route('/api/files/gallery', methods=['GET'])
@login_required
def list_gallery():
    from src.utils import format_file_size

    images = File.query.filter(
        File.owner_id == g.current_user_id,
        File.is_trashed == False,
        File.is_folder == False,
        File.mime_type.like('image/%'),
    ).order_by(File.created_at.desc()).all()

    return jsonify({'images': [{
        'id': f.id,
        'name': f.name,
        'mime_type': f.mime_type,
        'size': f.size,
        'formatted_size': format_file_size(f.size) if f.size else '--',
        'created_at': f.created_at.isoformat() + 'Z' if f.created_at else None,
    } for f in images]})
```

- [ ] **Step 4 : Ajouter POST /api/files/<id>/copy**

```python
@files_bp.route('/api/files/<file_id>/copy', methods=['POST'])
@login_required
def copy_file(file_id):
    import shutil
    from src.utils import format_file_size

    f = File.query.filter_by(id=file_id, owner_id=g.current_user_id, is_folder=False).first()
    if not f:
        return jsonify({'error': 'File not found'}), 404

    data = request.get_json() or {}
    destination_id = data.get('destination_id') or f.parent_id

    # Générer un nom unique
    base, ext = os.path.splitext(f.name)
    copy_name = f"{base} (copie){ext}"
    # Éviter les doublons
    counter = 2
    while File.query.filter_by(
        owner_id=g.current_user_id, parent_id=destination_id,
        name=copy_name, is_trashed=False,
    ).first():
        copy_name = f"{base} (copie {counter}){ext}"
        counter += 1

    # Copier le fichier physique si présent
    new_storage_path = None
    if f.storage_path and os.path.exists(f.storage_path):
        upload_folder = current_app.config['UPLOAD_FOLDER']
        user_dir = os.path.join(upload_folder, 'files', g.current_user_id)
        os.makedirs(user_dir, exist_ok=True)
        new_uuid = str(uuid.uuid4())
        _, file_ext = os.path.splitext(f.storage_path)
        new_storage_path = os.path.join(user_dir, new_uuid + file_ext)
        shutil.copy2(f.storage_path, new_storage_path)

    new_file = File(
        name=copy_name,
        is_folder=False,
        mime_type=f.mime_type,
        size=f.size,
        icon=f.icon,
        icon_color=f.icon_color,
        icon_bg=f.icon_bg,
        owner_id=g.current_user_id,
        parent_id=destination_id,
        storage_path=new_storage_path,
    )
    db.session.add(new_file)

    user = db.session.get(User, g.current_user_id)
    if user and f.size:
        user.storage_used = (user.storage_used or 0) + f.size

    db.session.add(ActivityLog(
        user_id=g.current_user_id, file_id=new_file.id, action='file_copied',
        details={'original_id': file_id},
    ))
    db.session.commit()

    return jsonify({
        'id': new_file.id,
        'name': new_file.name,
        'mime_type': new_file.mime_type,
        'size': new_file.size,
        'formatted_size': format_file_size(new_file.size) if new_file.size else '--',
        'icon': new_file.icon,
        'icon_color': new_file.icon_color,
        'icon_bg': new_file.icon_bg,
        'parent_id': new_file.parent_id,
    }), 201
```

- [ ] **Step 5 : Vérifier manuellement via curl**

```bash
# Depuis le répertoire projet, après docker compose up
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@cloudspace.io","password":"password123"}' | python3 -m json.tool

# Récupérer le token et tester
TOKEN="<access_token_ici>"
curl -s http://localhost:8080/api/files/starred \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
curl -s http://localhost:8080/api/files/recent \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
curl -s http://localhost:8080/api/files/gallery \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

Réponse attendue : `{ "folders": [...], "files": [...] }` pour starred, `{ "groups": [...] }` pour recent, `{ "images": [...] }` pour gallery (listes vides si aucun fichier en base).

- [ ] **Step 6 : Commit**

```bash
cd /home/baptiste/Vscode/my-drive
git add backend/src/routes/files.py
git commit -m "feat(backend): add starred, recent, gallery, copy routes"
```

---

## Task 2 — Backend: blueprint history.py

**Files:**
- Create: `backend/src/routes/history.py`
- Modify: `backend/src/routes/__init__.py`

- [ ] **Step 1 : Créer backend/src/routes/history.py**

```python
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify, g
from src.extensions import db
from src.models import ActivityLog, File, User
from src.utils import format_relative_time
from src.auth import login_required

history_bp = Blueprint('history', __name__)

ACTION_ICONS = {
    'file_uploaded':   ('upload_file',              'text-green-500',  'bg-green-500/10'),
    'file_edited':     ('edit_document',             'text-blue-500',   'bg-blue-500/10'),
    'file_viewed':     ('visibility',                'text-slate-500',  'bg-slate-500/10'),
    'file_downloaded': ('download',                  'text-purple-500', 'bg-purple-500/10'),
    'file_renamed':    ('drive_file_rename_outline', 'text-orange-500', 'bg-orange-500/10'),
    'file_trashed':    ('delete',                    'text-red-500',    'bg-red-500/10'),
    'file_restored':   ('restore_from_trash',        'text-green-500',  'bg-green-500/10'),
    'file_starred':    ('star',                      'text-yellow-500', 'bg-yellow-500/10'),
    'file_unstarred':  ('star_border',               'text-slate-400',  'bg-slate-400/10'),
    'file_shared':     ('share',                     'text-indigo-500', 'bg-indigo-500/10'),
    'file_unshared':   ('person_remove',             'text-red-400',    'bg-red-400/10'),
    'file_moved':      ('drive_file_move',           'text-cyan-500',   'bg-cyan-500/10'),
    'file_copied':     ('content_copy',              'text-blue-400',   'bg-blue-400/10'),
    'file_locked':     ('lock',                      'text-slate-500',  'bg-slate-500/10'),
    'file_unlocked':   ('lock_open',                 'text-slate-400',  'bg-slate-400/10'),
    'file_deleted':    ('delete_forever',            'text-red-600',    'bg-red-600/10'),
    'folder_created':  ('create_new_folder',         'text-yellow-500', 'bg-yellow-500/10'),
    'comment_added':   ('comment',                   'text-teal-500',   'bg-teal-500/10'),
}

ACTION_LABELS = {
    'file_uploaded':   'Vous avez importé',
    'file_edited':     'Vous avez modifié',
    'file_viewed':     'Vous avez consulté',
    'file_downloaded': 'Vous avez téléchargé',
    'file_renamed':    'Vous avez renommé',
    'file_trashed':    'Vous avez mis à la corbeille',
    'file_restored':   'Vous avez restauré depuis la corbeille',
    'file_starred':    'Vous avez mis en favori',
    'file_unstarred':  'Vous avez retiré des favoris',
    'file_shared':     'Vous avez partagé',
    'file_unshared':   'Vous avez retiré le partage de',
    'file_moved':      'Vous avez déplacé',
    'file_copied':     'Vous avez copié',
    'file_locked':     'Vous avez verrouillé',
    'file_unlocked':   'Vous avez déverrouillé',
    'file_deleted':    'Vous avez supprimé définitivement',
    'folder_created':  'Vous avez créé le dossier',
    'comment_added':   'Vous avez commenté',
}

DEFAULT_ICON = ('history', 'text-slate-500', 'bg-slate-500/10')


@history_bp.route('/api/activity/history')
@login_required
def get_history():
    page = request.args.get('page', 1, type=int)
    per_page = 30

    total = ActivityLog.query.filter_by(user_id=g.current_user_id).count()

    activities = ActivityLog.query.filter_by(
        user_id=g.current_user_id,
    ).order_by(ActivityLog.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    now = datetime.now(timezone.utc)
    today = now.date()
    yesterday = (now - timedelta(days=1)).date()

    groups = defaultdict(list)
    group_order = []

    for act in activities:
        act_date = act.created_at.date() if act.created_at else today
        if act_date == today:
            label = "Aujourd'hui"
        elif act_date == yesterday:
            label = 'Hier'
        else:
            label = act.created_at.strftime('%-d %B %Y') if act.created_at else 'Plus tôt'

        if label not in group_order:
            group_order.append(label)

        file_obj = db.session.get(File, act.file_id) if act.file_id else None
        icon, icon_color, icon_bg = ACTION_ICONS.get(act.action, DEFAULT_ICON)
        action_label = ACTION_LABELS.get(act.action, act.action)
        time_str = act.created_at.strftime('%H:%M') if act.created_at else ''

        groups[label].append({
            'id': act.id,
            'action': action_label,
            'target': file_obj.name if file_obj else 'un élément',
            'target_id': act.file_id,
            'icon': icon,
            'icon_color': icon_color,
            'icon_bg': icon_bg,
            'time': time_str,
            'created_at': act.created_at.isoformat() + 'Z' if act.created_at else None,
        })

    result = [{'date': d, 'events': groups[d]} for d in group_order]
    return jsonify({
        'groups': result,
        'total': total,
        'page': page,
        'per_page': per_page,
        'has_more': (page * per_page) < total,
    })
```

- [ ] **Step 2 : Enregistrer le blueprint dans __init__.py**

Dans `backend/src/routes/__init__.py`, ajouter :

```python
from src.routes.history import history_bp

def register_blueprints(app):
    # ... lignes existantes ...
    app.register_blueprint(history_bp)   # ← ajouter cette ligne
```

- [ ] **Step 3 : Tester**

```bash
TOKEN="<access_token>"
curl -s "http://localhost:8080/api/activity/history?page=1" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

Réponse attendue : `{ "groups": [...], "total": N, "page": 1, "has_more": false }`

- [ ] **Step 4 : Commit**

```bash
git add backend/src/routes/history.py backend/src/routes/__init__.py
git commit -m "feat(backend): add activity history route with pagination"
```

---

## Task 3 — Backend: blueprint sharing.py

**Files:**
- Create: `backend/src/routes/sharing.py`
- Modify: `backend/src/routes/__init__.py`

- [ ] **Step 1 : Créer backend/src/routes/sharing.py**

```python
from flask import Blueprint, jsonify, g
from src.extensions import db
from src.models import SharedFile, File, User
from src.utils import format_file_size, format_relative_time
from src.auth import login_required

sharing_bp = Blueprint('sharing', __name__)


@sharing_bp.route('/api/sharing/shared-with-me')
@login_required
def shared_with_me():
    shares = SharedFile.query.filter_by(shared_with_id=g.current_user_id).all()

    result = []
    for share in shares:
        f = db.session.get(File, share.file_id)
        if not f or f.is_trashed:
            continue
        owner = db.session.get(User, share.shared_by_id)

        result.append({
            'id': f.id,
            'name': f.name,
            'is_folder': f.is_folder,
            'mime_type': f.mime_type,
            'size': f.size,
            'formatted_size': format_file_size(f.size) if f.size else '--',
            'icon': f.icon,
            'icon_color': f.icon_color,
            'icon_bg': f.icon_bg or 'bg-slate-50',
            'permission': share.permission,
            'shared_by': {
                'id': owner.id if owner else None,
                'name': f"{owner.first_name} {owner.last_name}" if owner else 'Inconnu',
                'email': owner.email if owner else None,
                'avatar_url': owner.avatar_url if owner else None,
            },
            'shared_at': share.created_at.isoformat() + 'Z' if share.created_at else None,
            'relative_time': format_relative_time(share.created_at) if share.created_at else None,
            'updated_at': f.updated_at.isoformat() + 'Z' if f.updated_at else None,
        })

    return jsonify({'shared_files': result})
```

- [ ] **Step 2 : Vérifier que SharedFile a created_at dans le modèle**

Lire `backend/src/models.py` et chercher la classe `SharedFile`. Si elle n'a pas de champ `created_at`, l'ajouter :

```python
class SharedFile(db.Model):
    __tablename__ = 'shared_file'
    # champs existants...
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))  # ajouter si absent
```

- [ ] **Step 3 : Enregistrer dans __init__.py**

```python
from src.routes.sharing import sharing_bp

# dans register_blueprints(app):
app.register_blueprint(sharing_bp)
```

- [ ] **Step 4 : Tester**

```bash
curl -s http://localhost:8080/api/sharing/shared-with-me \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

Réponse attendue : `{ "shared_files": [...] }` (liste vide si aucun partage)

- [ ] **Step 5 : Commit**

```bash
git add backend/src/routes/sharing.py backend/src/routes/__init__.py backend/src/models.py
git commit -m "feat(backend): add shared-with-me endpoint"
```

---

## Task 4 — Backend: blueprint search.py

**Files:**
- Create: `backend/src/routes/search.py`
- Modify: `backend/src/routes/__init__.py`

- [ ] **Step 1 : Créer backend/src/routes/search.py**

```python
from flask import Blueprint, request, jsonify, g
from sqlalchemy import or_
from src.extensions import db
from src.models import File
from src.utils import format_file_size, format_relative_time
from src.auth import login_required

search_bp = Blueprint('search', __name__)

TYPE_MIME_MAP = {
    'image':    'image/',
    'video':    'video/',
    'audio':    'audio/',
    'document': ['application/pdf', 'application/msword',
                 'application/vnd.openxmlformats-officedocument'],
    'spreadsheet': ['application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml'],
    'archive':  ['application/zip', 'application/x-rar', 'application/x-7z',
                 'application/gzip'],
    'code':     ['text/javascript', 'text/typescript', 'text/html',
                 'text/css', 'application/json', 'application/xml'],
}


@search_bp.route('/api/search')
@login_required
def search():
    q = request.args.get('q', '').strip()
    file_type = request.args.get('type', '')
    limit = request.args.get('limit', 30, type=int)

    if not q or len(q) < 2:
        return jsonify({'results': [], 'total': 0})

    query = File.query.filter(
        File.owner_id == g.current_user_id,
        File.is_trashed == False,
        File.name.ilike(f'%{q}%'),
    )

    if file_type and file_type in TYPE_MIME_MAP:
        prefixes = TYPE_MIME_MAP[file_type]
        if isinstance(prefixes, str):
            query = query.filter(File.mime_type.like(prefixes + '%'))
        else:
            query = query.filter(or_(*[File.mime_type.like(p + '%') for p in prefixes]))

    results = query.order_by(File.updated_at.desc()).limit(limit).all()

    return jsonify({
        'results': [{
            'id': f.id,
            'name': f.name,
            'is_folder': f.is_folder,
            'mime_type': f.mime_type,
            'size': f.size,
            'formatted_size': format_file_size(f.size) if f.size else '--',
            'icon': f.icon,
            'icon_color': f.icon_color,
            'icon_bg': f.icon_bg or 'bg-slate-50',
            'parent_id': f.parent_id,
            'updated_at': f.updated_at.isoformat() + 'Z' if f.updated_at else None,
            'relative_time': format_relative_time(f.updated_at) if f.updated_at else None,
        } for f in results],
        'total': len(results),
        'query': q,
    })
```

- [ ] **Step 2 : Enregistrer dans __init__.py**

```python
from src.routes.search import search_bp
# dans register_blueprints(app):
app.register_blueprint(search_bp)
```

- [ ] **Step 3 : Tester**

```bash
curl -s "http://localhost:8080/api/search?q=photo" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

curl -s "http://localhost:8080/api/search?q=report&type=document" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

- [ ] **Step 4 : Commit**

```bash
git add backend/src/routes/search.py backend/src/routes/__init__.py
git commit -m "feat(backend): add global search endpoint"
```

---

## Task 5 — Frontend: connecter Starred.jsx

**Files:**
- Modify: `client/src/pages/Starred.jsx`

- [ ] **Step 1 : Réécrire Starred.jsx**

Remplacer l'intégralité du fichier par :

```jsx
import { useState, useEffect } from 'react'
import FileContextMenu from '../components/FileContextMenu'
import { apiFetch } from '../lib/api'

function FolderRow({ folder }) {
  return (
    <div className="flex items-center p-3 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg hover:bg-slate-50 dark:hover:bg-[#1f2d3d] cursor-pointer transition-colors shadow-sm group">
      <div className="relative mr-3 flex-shrink-0">
        <span
          className={`material-symbols-outlined text-xl ${folder.icon_color}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {folder.is_locked ? 'folder_shared' : 'folder'}
        </span>
        {folder.is_locked && (
          <span
            className="absolute -bottom-0.5 -right-1 material-symbols-outlined text-[10px] text-slate-400 dark:text-slate-500"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            lock
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{folder.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {folder.items_count != null ? `${folder.items_count} éléments` : '--'}
          {folder.formatted_size && folder.formatted_size !== '--' ? ` · ${folder.formatted_size}` : ''}
        </p>
      </div>
      <FileContextMenu className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-border-dark opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
    </div>
  )
}

function FileCard({ file }) {
  return (
    <div className="group relative bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg p-2 hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
      <div className={`aspect-[4/3] ${file.icon_bg} rounded-md mb-2 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-border-dark`}>
        <span className={`material-symbols-outlined text-2xl ${file.icon_color} opacity-80`}>{file.icon}</span>
      </div>
      <div className="flex items-center">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate" title={file.name}>{file.name}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {file.formatted_size} · {file.relative_time}
          </p>
        </div>
        <FileContextMenu className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-border-dark opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
          <span className="material-symbols-outlined text-[16px]">more_vert</span>
        </FileContextMenu>
      </div>
    </div>
  )
}

function FileRowList({ file }) {
  return (
    <tr className="group hover:bg-slate-50 dark:hover:bg-[#1f2d3d] transition-colors cursor-pointer">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${file.icon_bg} flex items-center justify-center flex-shrink-0`}>
            <span
              className={`material-symbols-outlined text-xl ${file.icon_color}`}
              style={file.is_folder ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {file.is_folder ? 'folder' : file.icon}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{file.name}</p>
            {file.is_folder && file.items_count != null && (
              <p className="text-xs text-slate-500">{file.items_count} éléments</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-5 py-3 hidden md:table-cell">
        <span className="text-sm text-slate-500 dark:text-slate-400">{file.relative_time || '--'}</span>
      </td>
      <td className="px-5 py-3 hidden sm:table-cell">
        <span className="text-sm text-slate-500 dark:text-slate-400">{file.formatted_size || '--'}</span>
      </td>
      <td className="px-5 py-3 text-right">
        <FileContextMenu className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-border-dark rounded-full transition-colors opacity-0 group-hover:opacity-100" />
      </td>
    </tr>
  )
}

export default function Starred() {
  const [view, setView] = useState('grid')
  const [folders, setFolders] = useState([])
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/api/files/starred')
      .then(r => r.json())
      .then(data => {
        setFolders(data.folders || [])
        setFiles(data.files || [])
      })
      .finally(() => setLoading(false))
  }, [])

  const isEmpty = !loading && folders.length === 0 && files.length === 0

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Favoris</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-border-dark overflow-hidden">
            <button
              onClick={() => setView('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${view === 'grid' ? 'text-primary bg-primary/5 dark:bg-primary/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <span className="material-symbols-outlined">grid_view</span>
              Grille
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${view === 'list' ? 'text-primary bg-primary/5 dark:bg-primary/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <span className="material-symbols-outlined">view_list</span>
              Liste
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-slate-400 dark:text-slate-500">
          <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
          Chargement...
        </div>
      )}

      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3">star</span>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Aucun favori</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Marquez des fichiers avec ★ pour les retrouver ici.</p>
        </div>
      )}

      {!loading && !isEmpty && view === 'grid' && (
        <>
          {folders.length > 0 && (
            <section className="mb-8">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Dossiers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {folders.map(f => <FolderRow key={f.id} folder={f} />)}
              </div>
            </section>
          )}
          {files.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Fichiers</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {files.map(f => <FileCard key={f.id} file={f} />)}
              </div>
            </section>
          )}
        </>
      )}

      {!loading && !isEmpty && view === 'list' && (
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-[#151e26] border-b border-slate-200 dark:border-border-dark">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[50%]">Nom</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[25%] hidden md:table-cell">Modifié</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[20%] hidden sm:table-cell">Taille</th>
                <th className="px-5 py-3 w-[5%]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
              {[...folders, ...files].map(f => <FileRowList key={f.id} file={f} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2 : Vérifier visuellement dans le navigateur**

Naviguer sur `/starred`. La page doit afficher l'état de chargement puis soit les fichiers étoilés, soit le message vide « Aucun favori ». Marquer un fichier en favori depuis MyDrive puis revenir sur /starred pour vérifier qu'il apparaît.

- [ ] **Step 3 : Commit**

```bash
git add client/src/pages/Starred.jsx
git commit -m "feat(frontend): connect Starred page to real API"
```

---

## Task 6 — Frontend: connecter Recent.jsx

**Files:**
- Modify: `client/src/pages/Recent.jsx`

- [ ] **Step 1 : Réécrire Recent.jsx**

Remplacer l'intégralité du fichier par :

```jsx
import { useState, useEffect } from 'react'
import FileContextMenu from '../components/FileContextMenu'
import { apiFetch } from '../lib/api'

function FileRow({ file }) {
  return (
    <tr className="group hover:bg-slate-50 dark:hover:bg-[#1f2d3d] transition-colors cursor-pointer">
      <td className="px-5 py-3 w-[45%]">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center ${file.icon_bg} rounded-lg`}>
            <span className={`material-symbols-outlined text-[16px] ${file.icon_color}`}>{file.icon}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{file.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 md:hidden">{file.activity}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3 w-[25%] hidden md:table-cell">
        <span className="text-sm text-slate-500 dark:text-slate-400">{file.activity}</span>
      </td>
      <td className="px-5 py-3 w-[20%] hidden sm:table-cell">
        <span className="text-sm text-slate-500 dark:text-slate-400">{file.formatted_size || '--'}</span>
      </td>
      <td className="px-5 py-3 w-[10%] text-right">
        <FileContextMenu className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-border-dark rounded-full transition-colors opacity-0 group-hover:opacity-100">
          <span className="material-symbols-outlined">more_vert</span>
        </FileContextMenu>
      </td>
    </tr>
  )
}

function DateGroup({ group }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{group.date}</span>
        <div className="flex-1 h-px bg-slate-200 dark:bg-border-dark" />
        <span className="text-xs text-slate-400">{group.files.length} fichier{group.files.length > 1 ? 's' : ''}</span>
      </div>
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-[#151e26] border-b border-slate-200 dark:border-border-dark">
            <tr>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[45%]">Nom</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[25%] hidden md:table-cell">Activité</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[20%] hidden sm:table-cell">Taille</th>
              <th className="px-5 py-2.5 w-[10%]" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
            {group.files.map(f => <FileRow key={f.id} file={f} />)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Recent() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/api/files/recent')
      .then(r => r.json())
      .then(data => setGroups(data.groups || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Récents</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Fichiers consultés et modifiés récemment</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-slate-400 dark:text-slate-500">
          <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
          Chargement...
        </div>
      )}

      {!loading && groups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3">history</span>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Aucune activité récente</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Vos fichiers récemment consultés apparaîtront ici.</p>
        </div>
      )}

      {!loading && groups.map(group => <DateGroup key={group.date} group={group} />)}
    </div>
  )
}
```

- [ ] **Step 2 : Vérifier visuellement**

Naviguer sur `/recent`. Les fichiers récents doivent s'afficher groupés par date (Aujourd'hui, Hier, etc.). Si aucune activité, le message vide s'affiche.

- [ ] **Step 3 : Commit**

```bash
git add client/src/pages/Recent.jsx
git commit -m "feat(frontend): connect Recent page to real API"
```

---

## Task 7 — Frontend: connecter History.jsx

**Files:**
- Modify: `client/src/pages/History.jsx`

- [ ] **Step 1 : Réécrire History.jsx**

Remplacer l'intégralité du fichier par :

```jsx
import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '../lib/api'

export default function History() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchPage = useCallback((p, append = false) => {
    const setter = append ? setLoadingMore : setLoading
    setter(true)
    apiFetch(`/api/activity/history?page=${p}`)
      .then(r => r.json())
      .then(data => {
        if (append) {
          setGroups(prev => {
            const merged = [...prev]
            for (const newGroup of (data.groups || [])) {
              const existing = merged.find(g => g.date === newGroup.date)
              if (existing) {
                existing.events = [...existing.events, ...newGroup.events]
              } else {
                merged.push(newGroup)
              }
            }
            return merged
          })
        } else {
          setGroups(data.groups || [])
        }
        setHasMore(data.has_more || false)
      })
      .finally(() => setter(false))
  }, [])

  useEffect(() => { fetchPage(1) }, [fetchPage])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchPage(next, true)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Historique</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Journal de toutes les actions de votre espace</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-slate-400 dark:text-slate-500">
          <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
          Chargement...
        </div>
      )}

      {!loading && groups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3">history</span>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Aucune activité</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Vos actions apparaîtront ici au fil du temps.</p>
        </div>
      )}

      <div className="space-y-8">
        {groups.map(group => (
          <div key={group.date}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{group.date}</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-border-dark" />
              <span className="text-xs text-slate-400 dark:text-slate-500">{group.events.length} actions</span>
            </div>
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-border-dark overflow-hidden">
              {group.events.map((event, idx) => (
                <div
                  key={event.id}
                  className={`flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-[#1f2d3d] transition-colors ${
                    idx < group.events.length - 1 ? 'border-b border-slate-100 dark:border-border-dark' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${event.icon_bg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`material-symbols-outlined text-[16px] ${event.icon_color}`}>{event.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-medium text-slate-900 dark:text-white">{event.action}</span>
                      {' '}
                      <span className="font-medium text-primary">{event.target}</span>
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0 tabular-nums">{event.time}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center pb-8">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="text-sm text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors font-medium disabled:opacity-50"
          >
            {loadingMore ? 'Chargement...' : "Charger plus d'historique..."}
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2 : Vérifier visuellement**

Naviguer sur `/history`. L'historique réel des actions doit s'afficher. Uploader un fichier depuis MyDrive puis revenir sur /history pour vérifier que l'action apparaît.

- [ ] **Step 3 : Commit**

```bash
git add client/src/pages/History.jsx
git commit -m "feat(frontend): connect History page to real API with pagination"
```

---

## Task 8 — Frontend: connecter SharedWithMe.jsx

**Files:**
- Modify: `client/src/pages/SharedWithMe.jsx`

- [ ] **Step 1 : Réécrire SharedWithMe.jsx**

Remplacer l'intégralité du fichier par :

```jsx
import { useState, useEffect } from 'react'
import FileContextMenu from '../components/FileContextMenu'
import { apiFetch } from '../lib/api'

function AvatarFallback({ name }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'
  return (
    <div className="w-7 h-7 rounded-full bg-slate-400 flex items-center justify-center flex-shrink-0">
      <span className="text-[10px] font-bold text-white">{initials}</span>
    </div>
  )
}

export default function SharedWithMe() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/api/sharing/shared-with-me')
      .then(r => r.json())
      .then(data => setItems(data.shared_files || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Partagés avec moi</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Fichiers et dossiers partagés par d'autres membres
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-slate-400 dark:text-slate-500">
          <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
          Chargement...
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3">group</span>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Aucun partage reçu</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Quand quelqu'un partage un fichier avec vous, il apparaît ici.
          </p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="w-[40%] text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nom</th>
                <th className="hidden sm:table-cell w-[25%] text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Partagé par</th>
                <th className="hidden md:table-cell w-[15%] text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                <th className="hidden lg:table-cell w-[10%] text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Taille</th>
                <th className="hidden lg:table-cell w-[10%] text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Permission</th>
                <th className="w-[5%] text-right px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <div className={`w-7 h-7 rounded-lg ${item.icon_bg} flex items-center justify-center`}>
                          <span
                            className={`material-symbols-outlined text-[14px] leading-none ${item.icon_color}`}
                            style={item.is_folder ? { fontVariationSettings: "'FILL' 1" } : undefined}
                          >
                            {item.is_folder ? 'folder' : item.icon}
                          </span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white dark:bg-surface-dark rounded-full flex items-center justify-center shadow-sm">
                          <span className="material-symbols-outlined text-blue-500 text-[11px]">group</span>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.mime_type || 'Dossier'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      {item.shared_by.avatar_url ? (
                        <img src={item.shared_by.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <AvatarFallback name={item.shared_by.name} />
                      )}
                      <span className="text-sm text-slate-700 dark:text-slate-300">{item.shared_by.name}</span>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-5 py-3">
                    <span className="text-sm text-slate-500 dark:text-slate-400">{item.relative_time || '--'}</span>
                  </td>
                  <td className="hidden lg:table-cell px-5 py-3">
                    <span className="text-sm text-slate-500 dark:text-slate-400">{item.formatted_size || '--'}</span>
                  </td>
                  <td className="hidden lg:table-cell px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      item.permission === 'editor'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {item.permission === 'editor' ? 'Éditeur' : 'Lecteur'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <FileContextMenu className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <span className="material-symbols-outlined">more_vert</span>
                    </FileContextMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2 : Vérifier visuellement**

Naviguer sur `/shared-with-me`. Message vide attendu si aucun fichier n'a été partagé. Partager un fichier depuis MyDrive avec un autre compte (via le ShareModal) et vérifier qu'il apparaît ici pour le destinataire.

- [ ] **Step 3 : Commit**

```bash
git add client/src/pages/SharedWithMe.jsx
git commit -m "feat(frontend): connect SharedWithMe page to real API"
```

---

## Task 9 — Frontend: connecter Gallery.jsx

**Files:**
- Modify: `client/src/pages/Gallery.jsx`

- [ ] **Step 1 : Réécrire Gallery.jsx**

Remplacer la section `const samplePhotos = [...]` et le composant `export default function Gallery()` par la version avec fetch. Remplacer l'intégralité du fichier par :

```jsx
import { useState, useEffect, useRef } from 'react'
import { apiFetch, getAccessToken } from '../lib/api'

function PhotoCard({ photo, gridSize, mosaic, onClick }) {
  const thumbUrl = `/api/files/${photo.id}/download?inline=true`

  return (
    <div
      onClick={() => onClick(photo)}
      className={`group relative rounded-lg overflow-hidden cursor-pointer border border-slate-200/50 dark:border-border-dark/50 hover:border-primary/40 transition-all ${mosaic ? 'h-full' : 'aspect-square'}`}
    >
      <img
        src={thumbUrl}
        alt={photo.name}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        onError={e => { e.target.style.display = 'none' }}
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-150 flex flex-col justify-between opacity-0 group-hover:opacity-100">
        <div className="flex justify-end p-1.5">
          <button
            onClick={e => e.stopPropagation()}
            className="w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
          >
            <span className="material-symbols-outlined text-white text-[16px]">download</span>
          </button>
        </div>
        <div className="px-2 pb-2">
          <p className="text-[11px] font-medium text-white truncate">{photo.name}</p>
          <p className="text-[10px] text-white/60">{photo.formatted_size}</p>
        </div>
      </div>
    </div>
  )
}

function Lightbox({ photo, onClose, onPrev, onNext }) {
  if (!photo) return null
  const imgUrl = `/api/files/${photo.id}/download?inline=true`

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" onClick={onClose}>
        <span className="material-symbols-outlined text-white">close</span>
      </button>
      <button
        className="absolute left-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        onClick={e => { e.stopPropagation(); onPrev() }}
      >
        <span className="material-symbols-outlined text-white text-xl">chevron_left</span>
      </button>
      <div
        className="w-[70vw] max-w-[700px] aspect-square rounded-2xl overflow-hidden bg-black/40 flex items-center justify-center"
        onClick={e => e.stopPropagation()}
      >
        <img src={imgUrl} alt={photo.name} className="max-w-full max-h-full object-contain" />
      </div>
      <button
        className="absolute right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        onClick={e => { e.stopPropagation(); onNext() }}
      >
        <span className="material-symbols-outlined text-white text-xl">chevron_right</span>
      </button>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md rounded-xl px-5 py-2.5 flex items-center gap-5" onClick={e => e.stopPropagation()}>
        <p className="text-sm font-medium text-white">{photo.name}</p>
        <p className="text-xs text-white/60">{photo.formatted_size}</p>
      </div>
    </div>
  )
}

const gridSizes = {
  small: 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10',
  medium: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8',
  large: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
}

export default function Gallery() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [gridSize, setGridSize] = useState('medium')
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    apiFetch('/api/files/gallery')
      .then(r => r.json())
      .then(data => setPhotos(data.images || []))
      .finally(() => setLoading(false))
  }, [])

  const selectedIndex = selectedPhoto ? photos.findIndex(p => p.id === selectedPhoto.id) : -1
  const handlePrev = () => { if (selectedIndex > 0) setSelectedPhoto(photos[selectedIndex - 1]) }
  const handleNext = () => { if (selectedIndex < photos.length - 1) setSelectedPhoto(photos[selectedIndex + 1]) }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Galerie</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{photos.length} photo{photos.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-border-dark overflow-hidden">
            {[{ id: 'small', label: 'S' }, { id: 'medium', label: 'M' }, { id: 'large', label: 'L' }].map(s => (
              <button
                key={s.id}
                onClick={() => setGridSize(s.id)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  gridSize === s.id ? 'text-primary bg-primary/5 dark:bg-primary/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 bg-primary hover:bg-blue-600 text-white text-sm font-semibold px-3.5 py-2 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">add_photo_alternate</span>
            Upload
          </button>
          <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-slate-400 dark:text-slate-500">
          <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
          Chargement...
        </div>
      )}

      {!loading && photos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3">photo_library</span>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Aucune image</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Uploadez des images depuis Mon Drive pour les voir ici.</p>
        </div>
      )}

      {!loading && photos.length > 0 && (
        <div className={`grid ${gridSizes[gridSize]} gap-2`}>
          {photos.map(photo => (
            <PhotoCard key={photo.id} photo={photo} gridSize={gridSize} mosaic={false} onClick={setSelectedPhoto} />
          ))}
        </div>
      )}

      <Lightbox photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} onPrev={handlePrev} onNext={handleNext} />
    </div>
  )
}
```

- [ ] **Step 2 : Vérifier visuellement**

Naviguer sur `/gallery`. Si des images ont été uploadées dans MyDrive, elles doivent s'afficher en vignettes réelles (pas des placeholders colorés). Le lightbox doit afficher l'image réelle.

- [ ] **Step 3 : Commit**

```bash
git add client/src/pages/Gallery.jsx
git commit -m "feat(frontend): connect Gallery page to real images from API"
```

---

## Vérification finale

- [ ] Uploader un fichier image dans MyDrive → vérifier qu'il apparaît dans Gallery
- [ ] Marquer un fichier en favori → vérifier qu'il apparaît dans Starred
- [ ] Consulter/modifier un fichier → vérifier que Recent et History se mettent à jour
- [ ] Partager un fichier avec un autre compte → vérifier que SharedWithMe fonctionne pour le destinataire
- [ ] Tester la recherche via `curl /api/search?q=<mot>` et vérifier les résultats
- [ ] Vérifier que tous les tests backend passent : `docker compose exec api python -m pytest`

```bash
git tag poc-complete
```
