# CloudSpace — Guide Backend

Application web de gestion de fichiers cloud (type Google Drive). Frontend React terminé, backend Flask.

## Stack

- **Frontend** : React + Vite + Tailwind CSS (port 5173 dev / port 80 Docker via Nginx)
- **Backend** : Flask + SQLAlchemy (port 5000)
- **BDD** : PostgreSQL 16 (Docker)
- **Uploads** : `/app/uploads/` (Docker volume)
- **Auth** : pas encore — simulé avec `CURRENT_USER_ID = 'user-alex-001'`

## Convention API

- Toutes les routes commencent par `/api/`
- Réponses JSON, erreurs : `{ "error": "message" }` + code HTTP
- Le frontend envoie les classes Tailwind pour les icônes/couleurs (`icon_color`, `icon_bg`)
- Tailles en octets bruts + format lisible (`size` + `formatted_size`)
- Temps relatifs calculés côté backend (`format_relative_time`)

## Modèles (backend/src/models.py)

| Modèle | Champs clés |
|--------|------------|
| **User** | id (UUID), first_name, last_name, email, password_hash, bio, avatar_url, role, is_online, storage_used, storage_limit (20GB), two_factor_enabled |
| **File** | id (UUID), name, is_folder, mime_type, size, icon/icon_color/icon_bg, parent_id (self-ref), owner_id, is_starred, is_locked, is_trashed, trashed_at, original_parent_id, storage_path |
| **SharedFile** | file_id, shared_by_id, shared_with_id, permission (viewer/editor/owner) |
| **ActivityLog** | user_id, file_id, action (string), details (JSON) |
| **Comment** | file_id, user_id, text |
| **UserSettings** | user_id, theme, font_size, compact_mode, sidebar_position |
| **Notification** | user_id, type, title, message, is_read, related_file_id |

## Routes API

### Implémentées

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/drive/contents?parent_id=` | Liste fichiers/dossiers (retourne folders[], files[], breadcrumbs) |
| POST | `/api/drive/folders` | Créer un dossier `{ name, parent_id }` |
| POST | `/api/files/upload` | Upload multipart (file + parent_id) |
| GET | `/api/files/<id>/download?inline=true` | Télécharger/servir un fichier |
| PUT | `/api/files/<id>/star` | Toggle favori |
| PUT | `/api/files/<id>/rename` | Renommer `{ name }` |
| DELETE | `/api/files/<id>` | Mettre à la corbeille (soft delete) |
| GET | `/api/dashboard/stats` | Stats : total_files, storage, shared, trash |
| GET | `/api/dashboard/activity?limit=` | Activité récente |
| GET | `/api/dashboard/quick-access?limit=` | Fichiers récemment consultés |
| GET | `/api/dashboard/team` | Membres de l'équipe |
| GET | `/api/user/storage` | Stockage utilisé + breakdown par type |
| GET/PUT | `/api/settings/appearance` | Préférences (theme, font_size, compact_mode, sidebar_position) |

### À implémenter

| Route | Description |
|-------|-------------|
| POST/POST/POST | `/api/auth/register`, `login`, `logout` — JWT |
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
| GET | `/api/trash` — Corbeille |
| POST | `/api/trash/<id>/restore` — Restaurer |
| DELETE | `/api/trash/<id>` — Supprimer définitivement |
| DELETE | `/api/trash` — Vider la corbeille |
| GET | `/api/search?q=&type=&scope=` — Recherche globale |
| GET/PUT | `/api/notifications` — Notifications |

## Mapping mime_type → icône

| Catégorie | Pattern | icon | icon_color |
|-----------|---------|------|------------|
| PDF | `application/pdf` | `picture_as_pdf` | `text-red-500` |
| Word | `*wordprocessingml*` | `description` | `text-blue-500` |
| Excel | `*spreadsheetml*` | `table_chart` | `text-green-500` |
| PowerPoint | `*presentationml*` | `slideshow` | `text-orange-500` |
| Image | `image/*` | `image` | `text-indigo-500` |
| Video | `video/*` | `video_file` | `text-purple-500` |
| Audio | `audio/*` | `audio_file` | `text-pink-500` |
| Archive | `application/zip`, `x-rar`, `x-7z` | `folder_zip` | `text-gray-500` |
| Code/JSON | `text/javascript`, `application/json` | `data_object` | `text-yellow-500` |
| Autre | fallback | `draft` | `text-slate-500` |

## Actions ActivityLog

`file_created`, `file_uploaded`, `file_edited`, `file_viewed`, `file_downloaded`, `file_renamed`, `file_moved`, `file_copied`, `file_locked`, `file_unlocked`, `file_starred`, `file_unstarred`, `file_trashed`, `file_restored`, `file_deleted`, `file_shared`, `file_unshared`, `comment_added`, `folder_created`, `avatar_changed`, `password_changed`, `settings_updated`

## Structure backend

```
backend/src/
├── __init__.py          # create_app() factory
├── models.py            # Tous les modèles SQLAlchemy
├── extensions.py        # db, migrate instances
├── utils.py             # get_icon_for_mime, format_file_size, format_relative_time
├── seed.py              # Données de test (s'exécute si User table vide)
└── routes/
    ├── drive.py         # /api/drive/*
    ├── files.py         # /api/files/*
    ├── dashboard.py     # /api/dashboard/*
    ├── storage.py       # /api/user/storage
    └── settings.py      # /api/settings/*
```

## Pages frontend (client/src/pages/)

Dashboard, MyDrive, SharedWithMe, Recent, Starred, Gallery, Trash, History, Settings, FileExplorerList, FileExplorerDetail

## Docker

3 services : `db` (postgres:16), `api` (Flask), `client` (Nginx).
Nginx proxie `/api/` vers `http://api:5000` (sans trailing slash sur proxy_pass).
