# CloudSpace — Guide Backend

Application web de gestion de fichiers cloud (type Google Drive). Frontend React terminé, backend Flask.

## Stack

- **Frontend** : React + Vite + Tailwind CSS (port 5173 dev / port 8080 Docker via Nginx)
- **Backend** : Flask + SQLAlchemy (port 5000)
- **BDD** : PostgreSQL 16 (Docker)
- **Uploads** : `/app/uploads/` (Docker volume)
- **Auth** : JWT (access token 15 min + refresh token 7 jours), `login_required` decorator dans `src/auth.py`

## Sécurité en place

- JWT avec `login_required` sur toutes les routes protégées
- Magic bytes validation via `python-magic` (MIME réel, pas le Content-Type navigateur)
- `.svg` et `application/octet-stream` bloqués à l'upload
- CORS restreint à `ALLOWED_ORIGINS` (env var)
- Headers HTTP : X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, HSTS, CSP, Referrer-Policy
- Rate limiting : `flask-limiter` (200 req/min par défaut)
- Quota utilisateur vérifié avant écriture sur disque
- Logging structuré JSON (`JsonFormatter`)

## Tests

- **Backend** : pytest + pytest-flask, SQLite in-memory, 13 tests dans `backend/tests/`
- **Frontend** : vitest + @testing-library/react, dans `client/src/tests/`
- **Lancement automatique** : les tests s'exécutent à chaque `docker compose up` via `entrypoint.sh` — le serveur démarre seulement si tous les tests passent

## Convention API

- Toutes les routes commencent par `/api/`
- Réponses JSON, erreurs : `{ "error": "message" }` + code HTTP
- `icon_color` et `icon_bg` sont calculés côté backend via `get_icon_for_mime()` dans `utils.py`
- Tailles en octets bruts + format lisible (`size` + `formatted_size`)
- Temps relatifs calculés côté backend (`format_relative_time`)

## Modèles (backend/src/models.py)

| Modèle | Champs clés |
|--------|------------|
| **User** | id (UUID), first_name, last_name, email, password_hash, bio, avatar_url, role, is_online, storage_used, storage_limit (20GB), two_factor_enabled |
| **File** | id (UUID), name, is_folder, mime_type, size, icon/icon_color/icon_bg, parent_id (self-ref), owner_id, is_starred, is_locked, is_trashed, trashed_at, original_parent_id, storage_path |
| **TokenBlocklist** | jti (JWT ID révoqué) |
| **SharedFile** | file_id, shared_by_id, shared_with_id, permission (viewer/editor/owner) |
| **ActivityLog** | user_id, file_id, action (string), details (JSON) |
| **Comment** | file_id, user_id, text |
| **UserSettings** | user_id, theme, font_size, compact_mode, sidebar_position |
| **Notification** | user_id, type, title, message, is_read, related_file_id |

## Routes API

### Implémentées

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Inscription `{ first_name, last_name, email, password }` |
| POST | `/api/auth/login` | Connexion → access_token + refresh_token |
| POST | `/api/auth/refresh` | Renouveler l'access token via refresh token |
| POST | `/api/auth/logout` | Révoquer le refresh token (TokenBlocklist) |
| GET | `/api/drive/contents?parent_id=` | Liste fichiers/dossiers (folders[], files[], breadcrumbs) |
| POST | `/api/drive/folders` | Créer un dossier `{ name, parent_id }` |
| POST | `/api/files/upload` | Upload multipart (file + parent_id), validation magic bytes |
| GET | `/api/files/<id>/download?inline=true` | Télécharger/servir un fichier |
| PUT | `/api/files/<id>/star` | Toggle favori |
| PUT | `/api/files/<id>/rename` | Renommer `{ name }` |
| DELETE | `/api/files/<id>` | Mettre à la corbeille (soft delete) |
| GET | `/api/trash` | Liste des éléments en corbeille |
| POST | `/api/trash/<id>/restore` | Restaurer un élément |
| DELETE | `/api/trash/<id>` | Supprimer définitivement |
| DELETE | `/api/trash` | Vider la corbeille |
| GET | `/api/dashboard/stats` | Stats : total_files, storage, shared, trash |
| GET | `/api/dashboard/activity?limit=` | Activité récente |
| GET | `/api/dashboard/quick-access?limit=` | Fichiers récemment consultés |
| GET | `/api/dashboard/team` | Membres de l'équipe |
| GET | `/api/user/storage` | Stockage utilisé + breakdown par type |
| GET/PUT | `/api/settings/appearance` | Préférences (theme, font_size, compact_mode, sidebar_position) |

### À implémenter

| Route | Description |
|-------|-------------|
| GET/PUT | `/api/user/profile` — Profil utilisateur |
| POST | `/api/user/profile/avatar` — Upload avatar |
| POST | `/api/user/password/change` |
| POST | `/api/files/<id>/move` — Déplacer `{ destination_id }` |
| POST | `/api/files/<id>/copy` — Copier |
| PUT | `/api/files/<id>/lock` — Toggle verrouillage |
| GET | `/api/files/<id>` — Détails fichier |
| GET | `/api/files/<id>/activity` — Historique d'un fichier |
| POST | `/api/files/<id>/comments` — Ajouter commentaire |
| POST | `/api/files/<id>/share` — Partager `{ email, permission }` |
| DELETE | `/api/files/<id>/share/<userId>` — Retirer partage |
| GET | `/api/sharing/shared-with-me` — Fichiers partagés avec moi |
| GET | `/api/files/recent` — Fichiers récents groupés par date |
| GET | `/api/files/starred` — Favoris |
| GET | `/api/activity/history` — Journal complet |
| GET | `/api/search?q=&type=&scope=` — Recherche globale |
| GET/PUT | `/api/notifications` — Notifications |

## Mapping mime_type → icône (backend/src/utils.py)

La fonction `get_icon_for_mime(mime_type, filename)` retourne `(icon, icon_color, icon_bg)`.
Elle consulte d'abord `EXTENSION_ICON_MAP` (priorité), puis `MIME_ICON_MAP`, puis `DEFAULT_ICON`.

| Catégorie | Couleur |
|-----------|---------|
| PDF | `text-red-500` / `bg-red-50` |
| Word `.docx` | `text-blue-500` / `bg-blue-50` |
| Excel `.xlsx` | `text-green-500` / `bg-green-50` |
| PowerPoint `.pptx` | `text-orange-500` / `bg-orange-50` |
| Image | `text-indigo-500` / `bg-indigo-50` |
| Video | `text-purple-500` / `bg-purple-50` |
| Audio | `text-pink-500` / `bg-pink-50` |
| Archives `.zip/.rar/.7z/.tar/.gz` | `text-stone-600` / `bg-stone-200` |
| JSON/XML/YAML | `text-yellow-500` / `bg-yellow-50` |
| JS/TS | `text-yellow-400` ou `text-blue-400` |
| JSX/TSX | `text-cyan-400` ou `text-cyan-500` |
| HTML | `text-orange-400` / `bg-orange-50` |
| CSS | `text-pink-400` / `bg-pink-50` |
| SQL | `text-cyan-500` / `bg-cyan-50` |
| Python `.py` | `text-yellow-500` / `bg-yellow-50` |
| Figma `.fig` | `text-purple-500` / `bg-purple-50` |
| Markdown `.md` | `text-slate-500` / `bg-slate-100` |
| CSV | `text-green-500` / `bg-green-50` |
| Epub | `text-teal-500` / `bg-teal-50` |
| Fallback | `text-slate-500` / `bg-slate-200` |

## Actions ActivityLog

`file_created`, `file_uploaded`, `file_edited`, `file_viewed`, `file_downloaded`, `file_renamed`, `file_moved`, `file_copied`, `file_locked`, `file_unlocked`, `file_starred`, `file_unstarred`, `file_trashed`, `file_restored`, `file_deleted`, `file_shared`, `file_unshared`, `comment_added`, `folder_created`, `avatar_changed`, `password_changed`, `settings_updated`

## Structure backend

```
backend/
├── entrypoint.sh        # Lance pytest puis démarre le serveur
├── dockerfile
├── requirements.txt
├── tests/
│   ├── conftest.py      # Fixtures pytest (app, db, client, test_user, auth_headers)
│   ├── test_models.py   # Tests User + File (5 tests)
│   └── test_upload.py   # Tests upload/download (8 tests)
└── src/
    ├── __init__.py      # create_app() — CORS, headers sécurité, limiter, blueprints, seed
    ├── auth.py          # JWT helpers + login_required decorator
    ├── models.py        # Tous les modèles SQLAlchemy
    ├── extensions.py    # db, migrate, cors, limiter
    ├── utils.py         # get_icon_for_mime, format_file_size, format_relative_time
    ├── seed.py          # Données de test (s'exécute si User table vide)
    └── routes/
        ├── auth.py      # /api/auth/*
        ├── drive.py     # /api/drive/*
        ├── files.py     # /api/files/*
        ├── trash.py     # /api/trash/*
        ├── dashboard.py # /api/dashboard/*
        ├── storage.py   # /api/user/storage
        └── settings.py  # /api/settings/*
```

## Pages frontend (client/src/pages/)

Dashboard, MyDrive, SharedWithMe, Recent, Starred, Gallery, Trash, History, Settings, FileExplorerList, FileExplorerDetail

## Docker

3 services : `db` (postgres:16), `api` (Flask), `client` (Nginx).
- Port exposé : **8080** (Nginx → port 80 interne)
- Nginx proxie `/api/` vers `http://api:5000` (sans trailing slash sur proxy_pass)
- Credentials via `.env` à la racine (voir `.env.example`)
- Reset BDD : `docker compose down && docker volume rm my-drive_pgdata && docker compose up -d`
