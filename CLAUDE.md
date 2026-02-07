# CloudSpace — Backend Implementation Guide

## Sommaire du projet

CloudSpace est une application web de gestion de fichiers cloud (type Google Drive). Le frontend React est terminé, ce document décrit **exhaustivement** toute la logique backend à implémenter en Flask (Python).

---

## Architecture Générale

```
my-drive/
├── backend/
│   ├── app.py                  # Point d'entrée Flask
│   ├── dockerfile
│   ├── requirements.txt        # Dépendances (flask uniquement pour l'instant)
│   └── src/
│       └── __init__.py         # create_app() factory
├── client/                     # React + Vite (TERMINÉ)
│   └── src/
│       ├── components/         # Layout, Sidebar, Header, FileContextMenu
│       └── pages/              # Dashboard, MyDrive, SharedWithMe, Recent, Starred, History, Trash, Settings, FileExplorerList, FileExplorerDetail
├── docker-compose.yml          # api (Flask:5000) + client (Vite:80) sur réseau "my-net"
└── venv/
```

**Stack backend :**
- Flask (Python 3.11)
- Docker : container `Backend-Flask` expose le port 5000 sur le réseau interne `my-net`
- Le frontend appelle le backend via `/api/...` (le proxy Vite ou Nginx reverse proxy vers le container Flask)

**Convention d'API :** Toutes les routes commencent par `/api/`. Les réponses sont en JSON. Les erreurs retournent `{ "error": "message" }` avec le code HTTP approprié.

---

## Base de Données — Modèles

### 1. User (Utilisateur)

```python
class User:
    id              # UUID, primary key
    first_name      # String(50), NOT NULL — ex: "Alex"
    last_name       # String(50), NOT NULL — ex: "Davidson"
    email           # String(120), UNIQUE, NOT NULL — ex: "alex.davidson@cloudspace.com"
    password_hash   # String(256), NOT NULL — hashé avec werkzeug ou bcrypt
    bio             # Text, nullable — ex: "Lead Designer at CloudSpace..."
    avatar_url      # String(500), nullable — URL vers l'image de profil
    role            # String(50), default "member" — ex: "Designer", "Finance", "Manager", "Marketing"
    is_online       # Boolean, default False — statut en ligne pour l'affichage team
    storage_used    # BigInteger, default 0 — en octets (bytes)
    storage_limit   # BigInteger, default 21474836480 — 20 GB en octets
    two_factor_enabled  # Boolean, default False
    created_at      # DateTime, default utcnow
    updated_at      # DateTime, onupdate utcnow
```

**Relations :**
- Un User possède plusieurs `File` (relation one-to-many via `owner_id`)
- Un User possède plusieurs `SharedFile` (many-to-many avec File via table d'association)
- Un User possède plusieurs `ActivityLog`
- Un User possède un `UserSettings`

---

### 2. File (Fichier / Dossier)

C'est le modèle central. Un "File" peut être soit un fichier soit un dossier (discriminé par `is_folder`).

```python
class File:
    id              # UUID, primary key
    name            # String(255), NOT NULL — ex: "Logo_V2.fig", "Marketing Assets"
    is_folder       # Boolean, default False — True = dossier, False = fichier
    mime_type       # String(100), nullable — ex: "application/pdf", "image/png", null pour les dossiers
    size            # BigInteger, default 0 — taille en octets (0 pour les dossiers)
    icon            # String(50), NOT NULL — nom d'icone Material Symbols, ex: "image", "picture_as_pdf", "folder", "table_chart", "description", "slideshow", "video_file", "folder_zip", "data_object"
    icon_color      # String(50) — classe CSS Tailwind, ex: "text-indigo-500", "text-red-500"
    icon_bg         # String(100), nullable — classe CSS Tailwind pour le fond, ex: "bg-red-50 dark:bg-red-500/10"

    # Hiérarchie
    parent_id       # UUID, ForeignKey("file.id"), nullable — null = racine du drive
    owner_id        # UUID, ForeignKey("user.id"), NOT NULL

    # Métadonnées
    is_starred      # Boolean, default False
    is_locked       # Boolean, default False — verrouillé = lecture seule pour les autres
    is_trashed      # Boolean, default False — dans la corbeille
    trashed_at      # DateTime, nullable — date de mise en corbeille (pour auto-delete 30 jours)
    original_parent_id  # UUID, nullable — pour restaurer depuis la corbeille à l'emplacement d'origine

    # Stockage
    storage_path    # String(500), nullable — chemin physique sur le disque/S3, null pour les dossiers
    preview_url     # String(500), nullable — URL de la miniature/preview

    # Timestamps
    created_at      # DateTime, default utcnow
    updated_at      # DateTime, onupdate utcnow
```

**Relations :**
- `parent` : relation self-referential vers le dossier parent (File)
- `children` : relation inverse, liste des fichiers/dossiers enfants
- `owner` : relation many-to-one vers User
- `shares` : relation one-to-many vers SharedFile
- `activities` : relation one-to-many vers ActivityLog
- `comments` : relation one-to-many vers Comment

**Index importants :**
- `(owner_id, parent_id)` — pour lister le contenu d'un dossier rapidement
- `(owner_id, is_starred)` — pour la page Starred
- `(owner_id, is_trashed)` — pour la page Trash
- `(owner_id, updated_at)` — pour la page Recent

**Calculs dérivés pour les dossiers :**
- `items_count` : nombre d'enfants directs (calculé via COUNT query)
- `total_size` : somme récursive des tailles des fichiers enfants

---

### 3. SharedFile (Partage)

Table d'association pour le partage de fichiers entre utilisateurs.

```python
class SharedFile:
    id              # UUID, primary key
    file_id         # UUID, ForeignKey("file.id"), NOT NULL
    shared_by_id    # UUID, ForeignKey("user.id"), NOT NULL — celui qui partage
    shared_with_id  # UUID, ForeignKey("user.id"), NOT NULL — celui qui reçoit
    permission      # String(20), default "viewer" — "viewer", "editor", "owner"
    shared_at       # DateTime, default utcnow
```

**Relations :**
- `file` : relation many-to-one vers File
- `shared_by` : relation many-to-one vers User (celui qui partage)
- `shared_with` : relation many-to-one vers User (le destinataire)

**Contrainte unique :** `(file_id, shared_with_id)` — un fichier ne peut être partagé qu'une fois avec le même utilisateur.

---

### 4. ActivityLog (Historique d'activité)

Enregistre TOUTES les actions effectuées. Utilisé par : Dashboard (Recent Activity), page Recent, page History, FileExplorerDetail (Activity sidebar).

```python
class ActivityLog:
    id              # UUID, primary key
    user_id         # UUID, ForeignKey("user.id"), NOT NULL — qui a fait l'action
    file_id         # UUID, ForeignKey("file.id"), nullable — le fichier concerné (peut être null si action globale)
    action          # String(50), NOT NULL — type d'action (voir liste ci-dessous)
    details         # JSON, nullable — détails supplémentaires selon l'action
    created_at      # DateTime, default utcnow, indexed
```

**Types d'action possibles (`action`) :**

| Action | Description | Champ `details` attendu |
|--------|-------------|------------------------|
| `file_created` | Fichier/dossier créé | `{}` |
| `file_uploaded` | Fichier uploadé | `{ "size": 14000000 }` |
| `file_edited` | Fichier modifié/mis à jour | `{ "version": 3 }` |
| `file_viewed` | Fichier ouvert/consulté | `{}` |
| `file_downloaded` | Fichier téléchargé | `{}` |
| `file_renamed` | Fichier renommé | `{ "old_name": "Logo_Draft.fig", "new_name": "Logo_V2.fig" }` |
| `file_moved` | Fichier déplacé | `{ "from_folder": "UUID", "to_folder": "UUID" }` |
| `file_copied` | Copie créée | `{ "copy_id": "UUID" }` |
| `file_locked` | Fichier verrouillé | `{}` |
| `file_unlocked` | Fichier déverrouillé | `{}` |
| `file_starred` | Fichier mis en favoris | `{}` |
| `file_unstarred` | Fichier retiré des favoris | `{}` |
| `file_trashed` | Fichier mis à la corbeille | `{}` |
| `file_restored` | Fichier restauré de la corbeille | `{}` |
| `file_deleted` | Fichier supprimé définitivement | `{ "name": "fichier.pdf" }` |
| `file_shared` | Fichier partagé avec quelqu'un | `{ "shared_with": "UUID", "permission": "editor" }` |
| `file_unshared` | Partage retiré | `{ "unshared_from": "UUID" }` |
| `comment_added` | Commentaire ajouté | `{ "comment_id": "UUID" }` |
| `folder_created` | Dossier créé | `{}` |
| `avatar_changed` | Photo de profil changée | `{}` |
| `password_changed` | Mot de passe changé | `{}` |
| `settings_updated` | Paramètres modifiés | `{ "setting": "theme", "value": "dark" }` |

---

### 5. Comment (Commentaire)

Commentaires sur les fichiers. Visible dans FileExplorerDetail (panneau latéral droit, onglet Activity).

```python
class Comment:
    id              # UUID, primary key
    file_id         # UUID, ForeignKey("file.id"), NOT NULL
    user_id         # UUID, ForeignKey("user.id"), NOT NULL
    text            # Text, NOT NULL — contenu du commentaire
    created_at      # DateTime, default utcnow
    updated_at      # DateTime, onupdate utcnow
```

**Relations :**
- `file` : relation many-to-one vers File
- `user` : relation many-to-one vers User

---

### 6. UserSettings (Préférences utilisateur)

Stocke les préférences d'apparence et de configuration. Visible dans la page Settings (onglet Appearance).

```python
class UserSettings:
    id              # UUID, primary key
    user_id         # UUID, ForeignKey("user.id"), UNIQUE, NOT NULL
    theme           # String(20), default "dark" — "dark", "light", "midnight", "nord", "sunset", "system"
    font_size       # String(10), default "medium" — "small", "medium", "large"
    compact_mode    # Boolean, default False
    sidebar_position # String(10), default "left" — "left", "right"
    created_at      # DateTime, default utcnow
    updated_at      # DateTime, onupdate utcnow
```

---

### 7. Notification

```python
class Notification:
    id              # UUID, primary key
    user_id         # UUID, ForeignKey("user.id"), NOT NULL — destinataire
    type            # String(50), NOT NULL — "share", "comment", "mention", "system"
    title           # String(255), NOT NULL
    message         # Text, nullable
    is_read         # Boolean, default False
    related_file_id # UUID, ForeignKey("file.id"), nullable
    created_at      # DateTime, default utcnow
```

---

## Routes API — Spécification Complète

### Authentification (`/api/auth/...`)

Ces routes gèrent l'inscription, la connexion et la déconnexion. Le frontend affiche un avatar "AD" et le nom "Alex D." dans le header, ainsi que le profil complet dans Settings.

#### `POST /api/auth/register`
Inscription d'un nouvel utilisateur.
```
Request body:
{
    "first_name": "Alex",
    "last_name": "Davidson",
    "email": "alex.davidson@cloudspace.com",
    "password": "motdepasse123"
}

Response 201:
{
    "id": "uuid",
    "first_name": "Alex",
    "last_name": "Davidson",
    "email": "alex.davidson@cloudspace.com",
    "token": "jwt_token_ici"
}

Response 409: { "error": "Email already exists" }
Response 400: { "error": "Missing required fields" }
```

**Logique :**
1. Vérifier que tous les champs sont présents et valides (email format, password >= 8 chars)
2. Vérifier que l'email n'existe pas déjà
3. Hasher le mot de passe avec `werkzeug.security.generate_password_hash`
4. Créer le User en BDD
5. Créer un UserSettings par défaut pour ce user
6. Créer un dossier racine "My Drive" pour ce user (optionnel, ou bien la racine = parent_id null)
7. Générer un JWT token
8. Retourner le user + token

#### `POST /api/auth/login`
Connexion d'un utilisateur existant.
```
Request body:
{
    "email": "alex.davidson@cloudspace.com",
    "password": "motdepasse123"
}

Response 200:
{
    "id": "uuid",
    "first_name": "Alex",
    "last_name": "Davidson",
    "email": "alex.davidson@cloudspace.com",
    "avatar_url": null,
    "token": "jwt_token_ici"
}

Response 401: { "error": "Invalid email or password" }
```

**Logique :**
1. Trouver le user par email
2. Vérifier le mot de passe avec `werkzeug.security.check_password_hash`
3. Mettre `is_online = True`
4. Générer un JWT token
5. Retourner le user + token

#### `POST /api/auth/logout`
Déconnexion. Affiché dans le menu utilisateur du Header (dropdown du bouton "Alex D." + expand_more).
```
Headers: Authorization: Bearer <token>

Response 200: { "message": "Logged out successfully" }
```

**Logique :**
1. Invalider le token (blacklist ou expiration)
2. Mettre `is_online = False` pour le user

---

### Profil Utilisateur (`/api/user/...`)

Ces routes alimentent la page **Settings** (onglet Profile) et le **Header** (avatar + nom).

#### `GET /api/user/profile`
Récupère le profil de l'utilisateur connecté. Utilisé par : Header (affichage "Alex D." + avatar "AD"), Settings (formulaire Profile Information), Dashboard (message "Welcome back, Alex").
```
Headers: Authorization: Bearer <token>

Response 200:
{
    "id": "uuid",
    "first_name": "Alex",
    "last_name": "Davidson",
    "email": "alex.davidson@cloudspace.com",
    "bio": "Lead Designer at CloudSpace. Loves minimalism and clean code.",
    "avatar_url": null,
    "role": "Designer",
    "storage_used": 16324091904,
    "storage_limit": 21474836480,
    "two_factor_enabled": false,
    "created_at": "2024-01-15T10:00:00Z"
}
```

#### `PUT /api/user/profile`
Met à jour le profil. Déclenché par le bouton "Save Changes" dans Settings > Profile Information. Le bouton "Cancel" côté frontend réinitialise le formulaire sans appeler l'API.
```
Headers: Authorization: Bearer <token>
Request body:
{
    "first_name": "Alex",
    "last_name": "Davidson",
    "email": "alex.davidson@cloudspace.com",
    "bio": "Updated bio text."
}

Response 200: { user object mis à jour }
Response 400: { "error": "Invalid email format" }
Response 409: { "error": "Email already in use" }
```

**Logique :**
1. Valider les champs (email format, longueur)
2. Si l'email change, vérifier qu'il n'est pas déjà pris
3. Mettre à jour le user en BDD
4. Logger un ActivityLog `settings_updated`
5. Retourner le user mis à jour

#### `POST /api/user/profile/avatar`
Upload d'une nouvelle photo de profil. Déclenché par le bouton "Change Photo" dans Settings.
```
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data
Body: file (image)

Response 200:
{
    "avatar_url": "/uploads/avatars/uuid.jpg"
}

Response 400: { "error": "Invalid file type. Allowed: jpg, png, gif, webp" }
Response 413: { "error": "File too large. Max 5MB" }
```

**Logique :**
1. Valider le type de fichier (jpg, png, gif, webp uniquement)
2. Valider la taille (max 5 MB)
3. Sauvegarder le fichier sur disque/S3
4. Mettre à jour `avatar_url` du user
5. Logger un ActivityLog `avatar_changed`

#### `POST /api/user/password/change`
Changer le mot de passe. Déclenché par le bouton "Change Password" dans Settings > Account Security.
```
Headers: Authorization: Bearer <token>
Request body:
{
    "current_password": "ancien_mdp",
    "new_password": "nouveau_mdp"
}

Response 200: { "message": "Password changed successfully" }
Response 400: { "error": "New password must be at least 8 characters" }
Response 401: { "error": "Current password is incorrect" }
```

**Logique :**
1. Vérifier que le mot de passe actuel est correct
2. Valider le nouveau mot de passe (>= 8 chars)
3. Hasher et sauvegarder le nouveau mot de passe
4. Logger un ActivityLog `password_changed`

#### `POST /api/user/2fa/toggle`
Active/désactive la 2FA. Déclenché par le toggle switch dans Settings > Account Security.
```
Headers: Authorization: Bearer <token>

Response 200:
{
    "two_factor_enabled": true,
    "message": "2FA enabled"
}
```

---

### Stockage (`/api/user/storage`)

Alimente la section "Storage" du **Sidebar** (barre de progression 75%, "15 GB of 20 GB used") et la carte "Storage Used" du **Dashboard**.

#### `GET /api/user/storage`
```
Headers: Authorization: Bearer <token>

Response 200:
{
    "used": 16324091904,
    "limit": 21474836480,
    "percentage": 76,
    "formatted_used": "15.2 GB",
    "formatted_limit": "20 GB",
    "breakdown": [
        { "type": "Images", "size": 5798205850, "formatted": "5.4 GB", "percent": 36, "icon": "image" },
        { "type": "Videos", "size": 4402341478, "formatted": "4.1 GB", "percent": 27, "icon": "movie" },
        { "type": "Documents", "size": 3435973837, "formatted": "3.2 GB", "percent": 21, "icon": "description" },
        { "type": "Spreadsheets", "size": 1610612736, "formatted": "1.5 GB", "percent": 10, "icon": "table_chart" },
        { "type": "Other", "size": 1073741824, "formatted": "1.0 GB", "percent": 6, "icon": "folder_zip" }
    ]
}
```

**Logique :**
1. Calculer `storage_used` = SUM de `size` de tous les fichiers (is_folder=False, is_trashed=False) du user
2. Grouper par mime_type pour le breakdown :
   - Images : `image/*`
   - Videos : `video/*`
   - Documents : `application/pdf`, `application/msword`, `application/vnd.openxmlformats*doc*`, `text/*`
   - Spreadsheets : `application/vnd.ms-excel`, `application/vnd.openxmlformats*sheet*`
   - Other : tout le reste
3. Calculer les pourcentages

---

### Préférences d'apparence (`/api/settings/...`)

Alimente la section **Appearance** de la page Settings (thèmes, font size, compact mode, sidebar position).

#### `GET /api/settings/appearance`
```
Headers: Authorization: Bearer <token>

Response 200:
{
    "theme": "dark",
    "font_size": "medium",
    "compact_mode": false,
    "sidebar_position": "left"
}
```

#### `PUT /api/settings/appearance`
Déclenché quand l'utilisateur clique sur une carte de thème, un bouton de font size, le toggle compact mode, ou un bouton sidebar position.
```
Headers: Authorization: Bearer <token>
Request body (partiel accepté):
{
    "theme": "midnight"
}

Response 200:
{
    "theme": "midnight",
    "font_size": "medium",
    "compact_mode": false,
    "sidebar_position": "left"
}
```

---

### Dashboard (`/api/dashboard/...`)

Alimente la page **Dashboard** avec toutes ses sections : stats cards, storage breakdown, activity feed, quick access, team members.

#### `GET /api/dashboard/stats`
Fournit les 4 cartes de statistiques en haut du Dashboard.
```
Headers: Authorization: Bearer <token>

Response 200:
{
    "total_files": 1284,
    "total_files_change": "+24 this week",
    "storage_used": "15.2 GB",
    "storage_percentage": 75,
    "shared_files": 342,
    "shared_files_change": "+8 this week",
    "trash_items": 5,
    "trash_auto_delete": "28d"
}
```

**Logique :**
1. `total_files` = COUNT de File WHERE owner_id = current_user AND is_trashed = False
2. `total_files_change` = COUNT de File WHERE created_at >= 7 jours ago MINUS COUNT de la semaine précédente
3. `storage_used` = voir route /api/user/storage
4. `shared_files` = COUNT de SharedFile WHERE shared_by_id = current_user
5. `trash_items` = COUNT de File WHERE owner_id = current_user AND is_trashed = True
6. `trash_auto_delete` = MIN(30 - jours_depuis_trashed_at) des fichiers en corbeille

#### `GET /api/dashboard/activity`
Fournit le feed "Recent Activity" du Dashboard (6 dernières actions).
```
Headers: Authorization: Bearer <token>
Query params: ?limit=6

Response 200:
{
    "activities": [
        {
            "id": "uuid",
            "user": {
                "id": "uuid",
                "name": "Sarah M.",
                "initials": "SM",
                "avatar_url": null,
                "color": "#ec4899"
            },
            "action": "uploaded",
            "target": "Hero_Banner_v4.jpg",
            "target_id": "uuid",
            "time": "10 min ago",
            "created_at": "2024-10-26T14:30:00Z"
        }
    ]
}
```

**Logique :**
1. Récupérer les N derniers ActivityLog liés aux fichiers du current_user (ses propres fichiers + fichiers partagés avec lui)
2. Pour chaque log, résoudre le user (nom, initiales, couleur)
3. Formater le timestamp en temps relatif ("10 min ago", "2h ago", etc.)
4. Traduire le `action` en verbe lisible ("file_uploaded" -> "uploaded")

#### `GET /api/dashboard/quick-access`
Fournit les 4 fichiers les plus récemment consultés/modifiés. Section "Quick Access" du Dashboard.
```
Headers: Authorization: Bearer <token>
Query params: ?limit=4

Response 200:
{
    "files": [
        {
            "id": "uuid",
            "name": "Project_Brief_v3.docx",
            "icon": "description",
            "icon_color": "text-blue-400",
            "icon_bg": "bg-blue-500/10",
            "subtitle": "Edited 10m ago",
            "is_owner": true
        }
    ]
}
```

**Logique :**
1. Récupérer les ActivityLog du current_user avec action IN ("file_edited", "file_viewed", "file_uploaded") triés par created_at DESC
2. Dé-dupliquer par file_id (garder le plus récent)
3. Limiter à N résultats
4. Formater le subtitle : "Edited 10m ago", "Opened yesterday", etc.

#### `GET /api/dashboard/team`
Fournit la liste des membres de l'équipe. Section "Team Members" du Dashboard.
```
Headers: Authorization: Bearer <token>

Response 200:
{
    "members": [
        {
            "id": "uuid",
            "name": "Sarah Miller",
            "initials": "SM",
            "color": "#ec4899",
            "role": "Designer",
            "files_count": 156,
            "is_online": true
        }
    ],
    "online_count": 3
}
```

**Logique :**
1. Récupérer tous les Users sauf le current_user (ou bien tous ceux de la même "organisation" si on implémente le multi-tenant)
2. Pour chaque user : compter ses fichiers (File WHERE owner_id = user.id AND is_trashed = False)
3. Calculer les initiales depuis first_name + last_name
4. Attribuer une couleur basée sur un hash du nom ou stockée en BDD

---

### Fichiers et Dossiers (`/api/files/...` et `/api/drive/...`)

C'est le coeur de l'application. Ces routes alimentent les pages **My Drive**, **FileExplorerList**, **FileExplorerDetail**.

#### `GET /api/drive/contents`
Liste le contenu du Drive de l'utilisateur (racine ou un dossier spécifique). Utilisé par la page **My Drive** et **FileExplorerList**.
```
Headers: Authorization: Bearer <token>
Query params:
  ?parent_id=null          # null = racine du drive, sinon UUID du dossier parent
  &sort=name               # name, size, modified (default: name)
  &order=asc               # asc, desc (default: asc)
  &type=all                # all, folder, file (default: all)

Response 200:
{
    "current_folder": {
        "id": "uuid",
        "name": "Q4 Marketing",
        "parent_id": "uuid"
    },
    "breadcrumbs": [
        { "id": null, "name": "My Drive" },
        { "id": "uuid-projects", "name": "Projects" },
        { "id": "uuid-q4", "name": "Q4 Marketing" }
    ],
    "folders": [
        {
            "id": "uuid",
            "name": "Marketing Assets",
            "items_count": 24,
            "icon": "folder",
            "icon_color": "text-yellow-500",
            "is_locked": false,
            "updated_at": "2024-10-24T10:00:00Z"
        }
    ],
    "files": [
        {
            "id": "uuid",
            "name": "Logo_V2.fig",
            "size": 14680064,
            "formatted_size": "14 MB",
            "icon": "image",
            "icon_color": "text-indigo-500",
            "icon_bg": "bg-indigo-50 dark:bg-indigo-500/10",
            "mime_type": "application/x-figma",
            "is_starred": false,
            "is_locked": false,
            "updated_at": "2024-10-26T14:28:00Z",
            "formatted_date": "2 min ago",
            "owners": [
                { "id": "uuid", "initials": "SM", "color": "#ec4899" },
                { "id": "uuid", "initials": "JD", "color": "#3b82f6" }
            ]
        }
    ]
}
```

**Logique :**
1. Si `parent_id` est null : récupérer File WHERE owner_id = current_user AND parent_id IS NULL AND is_trashed = False
2. Sinon : vérifier que le current_user a accès au dossier parent, puis récupérer les enfants
3. Séparer folders (is_folder=True) et files (is_folder=False)
4. Pour chaque dossier : COUNT des enfants = items_count
5. Pour chaque fichier : résoudre les owners (le owner + ceux qui ont un SharedFile)
6. Construire le breadcrumb en remontant les parents récursivement
7. Trier selon le paramètre `sort`

#### `POST /api/drive/folders`
Créer un nouveau dossier. Déclenché par le bouton "Create New Folder" dans MyDrive (grid view).
```
Headers: Authorization: Bearer <token>
Request body:
{
    "name": "New Folder",
    "parent_id": null
}

Response 201:
{
    "id": "uuid",
    "name": "New Folder",
    "is_folder": true,
    "parent_id": null,
    "created_at": "2024-10-26T15:00:00Z"
}

Response 400: { "error": "Folder name already exists in this location" }
```

**Logique :**
1. Valider le nom (pas vide, pas de caractères interdits)
2. Vérifier qu'aucun dossier avec le même nom n'existe au même niveau
3. Créer le File avec is_folder=True
4. Logger un ActivityLog `folder_created`

#### `POST /api/files/upload`
Upload d'un fichier. Déclenché par le bouton "New Upload" dans le Sidebar.
```
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data
Body:
  file: <binary>
  parent_id: "uuid" (optionnel, null = racine)

Response 201:
{
    "id": "uuid",
    "name": "document.pdf",
    "size": 2457600,
    "formatted_size": "2.4 MB",
    "mime_type": "application/pdf",
    "icon": "picture_as_pdf",
    "icon_color": "text-red-500",
    "icon_bg": "bg-red-50 dark:bg-red-500/10",
    "created_at": "2024-10-26T15:00:00Z"
}

Response 400: { "error": "No file provided" }
Response 413: { "error": "Storage limit exceeded. You have 4.8 GB remaining" }
```

**Logique :**
1. Valider qu'un fichier est fourni
2. Vérifier que le user a assez d'espace de stockage restant
3. Déterminer le mime_type (python-magic ou extension)
4. Déterminer l'icône et la couleur selon le mime_type (voir table de mapping ci-dessous)
5. Sauvegarder le fichier sur disque/S3
6. Créer le File en BDD
7. Mettre à jour storage_used du user
8. Logger un ActivityLog `file_uploaded`
9. Générer une preview/thumbnail si c'est une image ou un PDF

**Table de mapping mime_type → icon + couleur :**

| Catégorie | mime_type pattern | icon | icon_color | icon_bg |
|-----------|-------------------|------|------------|---------|
| PDF | `application/pdf` | `picture_as_pdf` | `text-red-500` | `bg-red-50 dark:bg-red-500/10` |
| Word | `application/msword`, `*wordprocessingml*` | `description` | `text-blue-500` | `bg-blue-50 dark:bg-blue-500/10` |
| Excel | `application/vnd.ms-excel`, `*spreadsheetml*` | `table_chart` | `text-green-500` | `bg-green-50 dark:bg-green-500/10` |
| PowerPoint | `application/vnd.ms-powerpoint`, `*presentationml*` | `slideshow` | `text-orange-500` | `bg-orange-50 dark:bg-orange-500/10` |
| Image | `image/*` | `image` | `text-indigo-500` | `bg-indigo-50 dark:bg-indigo-500/10` |
| Video | `video/*` | `video_file` | `text-purple-500` | `bg-purple-50 dark:bg-purple-500/10` |
| Audio | `audio/*` | `audio_file` | `text-pink-500` | `bg-pink-50 dark:bg-pink-500/10` |
| Archive | `application/zip`, `application/x-rar*`, `application/x-7z*` | `folder_zip` | `text-gray-500` | `bg-gray-50 dark:bg-gray-500/10` |
| Code/JSON | `text/javascript`, `application/json`, `text/html`, `text/css` | `data_object` | `text-yellow-500` | `bg-yellow-50 dark:bg-yellow-500/10` |
| Figma | extension `.fig` | `image` | `text-indigo-500` | `bg-indigo-50 dark:bg-indigo-500/10` |
| Autre | tout le reste | `draft` | `text-slate-500` | `bg-slate-50 dark:bg-slate-500/10` |

#### `GET /api/files/:fileId`
Récupère les détails d'un fichier. Utilisé par **FileExplorerDetail** (panneau latéral droit).
```
Headers: Authorization: Bearer <token>

Response 200:
{
    "id": "uuid",
    "name": "Logo_V2.fig",
    "type": "Figma Design File",
    "size": 14680064,
    "formatted_size": "14 MB",
    "icon": "image",
    "icon_color": "text-indigo-500",
    "icon_bg": "bg-indigo-50 dark:bg-indigo-500/10",
    "mime_type": "application/x-figma",
    "is_starred": false,
    "is_locked": false,
    "preview_url": "/uploads/previews/uuid.jpg",
    "owner": {
        "id": "uuid",
        "name": "Sarah Miller",
        "initials": "SM"
    },
    "shared_with": [
        { "id": "uuid", "name": "John Doe", "initials": "JD", "permission": "editor" }
    ],
    "created_at": "2024-09-15T10:00:00Z",
    "updated_at": "2024-10-26T14:28:00Z",
    "parent_path": "My Drive/Projects/Q4 Marketing"
}

Response 404: { "error": "File not found" }
Response 403: { "error": "Access denied" }
```

#### `PUT /api/files/:fileId/rename`
Renommer un fichier. Déclenché par l'action "Rename" du FileContextMenu (icône `edit`, raccourci F2).
```
Headers: Authorization: Bearer <token>
Request body:
{
    "name": "Logo_V3_Final.fig"
}

Response 200: { updated file object }
Response 400: { "error": "A file with this name already exists in this location" }
```

**Logique :**
1. Vérifier que le user est owner ou a la permission "editor"
2. Vérifier qu'aucun fichier avec le même nom n'existe dans le même dossier
3. Mettre à jour le nom
4. Logger un ActivityLog `file_renamed` avec `details: { old_name, new_name }`

#### `POST /api/files/:fileId/move`
Déplacer un fichier. Déclenché par l'action "Move to..." du FileContextMenu (icône `drive_file_move`).
```
Headers: Authorization: Bearer <token>
Request body:
{
    "destination_id": "uuid-du-dossier-cible"
}

Response 200: { updated file object }
Response 400: { "error": "Cannot move a folder into itself" }
Response 404: { "error": "Destination folder not found" }
```

**Logique :**
1. Vérifier permissions
2. Si c'est un dossier : vérifier qu'on ne le déplace pas dans un de ses propres descendants (boucle infinie)
3. Vérifier qu'aucun fichier avec le même nom n'existe à la destination
4. Mettre à jour `parent_id`
5. Logger un ActivityLog `file_moved`

#### `POST /api/files/:fileId/copy`
Copier un fichier. Déclenché par l'action "Make a copy" du FileContextMenu (icône `content_copy`, raccourci Ctrl+C).
```
Headers: Authorization: Bearer <token>
Request body:
{
    "destination_id": null
}

Response 201: { new file object (la copie) }
Response 413: { "error": "Storage limit exceeded" }
```

**Logique :**
1. Dupliquer l'entrée File en BDD avec un nouveau UUID
2. Nommer la copie "Copy of {nom_original}" (ou "{nom_original} (1)" si "Copy of..." existe déjà)
3. Dupliquer le fichier physique sur disque/S3
4. Mettre à jour storage_used du user
5. Logger un ActivityLog `file_copied`
6. Si c'est un dossier : copier récursivement tous les enfants

#### `PUT /api/files/:fileId/lock`
Verrouiller/déverrouiller un fichier. Déclenché par l'action "Lock" du FileContextMenu (icône `lock`).
```
Headers: Authorization: Bearer <token>

Response 200:
{
    "id": "uuid",
    "is_locked": true
}
```

**Logique :**
1. Vérifier que le user est owner
2. Toggle `is_locked` (si True → False, si False → True)
3. Logger un ActivityLog `file_locked` ou `file_unlocked`

#### `PUT /api/files/:fileId/star`
Ajouter/retirer des favoris. Déclenché par un clic sur l'étoile (visible dans Starred page). Aussi accessible dans un futur bouton star dans le context menu ou la vue détail.
```
Headers: Authorization: Bearer <token>

Response 200:
{
    "id": "uuid",
    "is_starred": true
}
```

**Logique :**
1. Toggle `is_starred`
2. Logger un ActivityLog `file_starred` ou `file_unstarred`

#### `GET /api/files/:fileId/download`
Télécharger un fichier. Déclenché par l'action "Download" du FileContextMenu (icône `download`, raccourci Ctrl+D).
```
Headers: Authorization: Bearer <token>

Response 200: Binary file stream avec headers Content-Disposition
Response 404: { "error": "File not found" }
```

**Logique :**
1. Vérifier les permissions (owner ou shared with)
2. Logger un ActivityLog `file_downloaded`
3. Retourner le fichier avec `send_file()` de Flask

#### `GET /api/files/:fileId/preview`
Récupérer un aperçu. Déclenché par l'action "Preview" du FileContextMenu (icône `visibility`, raccourci Space) et dans FileExplorerDetail (le panneau preview).
```
Headers: Authorization: Bearer <token>

Response 200:
{
    "preview_url": "/uploads/previews/uuid.jpg",
    "preview_type": "image",
    "can_preview": true
}

Response 200 (pas de preview):
{
    "preview_url": null,
    "preview_type": null,
    "can_preview": false
}
```

#### `GET /api/files/:fileId/activity`
Récupère l'historique d'activité d'un fichier spécifique. Utilisé par **FileExplorerDetail** (onglet Activity du panneau latéral droit).
```
Headers: Authorization: Bearer <token>
Query params: ?limit=20

Response 200:
{
    "activities": [
        {
            "id": "uuid",
            "user": {
                "name": "Sarah M.",
                "initials": "SM",
                "color": "#ec4899"
            },
            "action": "Uploaded a new version",
            "time": "10m ago",
            "created_at": "2024-10-26T14:28:00Z"
        },
        {
            "id": "uuid",
            "user": {
                "name": "John D.",
                "initials": "JD",
                "color": "#3b82f6"
            },
            "action": "Commented on file",
            "quote": "The logo looks great! Just one small tweak needed on the gradient.",
            "time": "5m ago"
        }
    ]
}
```

#### `POST /api/files/:fileId/comments`
Ajouter un commentaire sur un fichier. Déclenché par le champ "Write a comment..." + bouton send dans FileExplorerDetail.
```
Headers: Authorization: Bearer <token>
Request body:
{
    "text": "The logo looks great! Just one small tweak needed on the gradient."
}

Response 201:
{
    "id": "uuid",
    "text": "The logo looks great!...",
    "user": {
        "name": "Alex Davidson",
        "initials": "AD"
    },
    "created_at": "2024-10-26T15:00:00Z"
}

Response 400: { "error": "Comment text is required" }
```

**Logique :**
1. Valider que le texte n'est pas vide
2. Créer le Comment en BDD
3. Logger un ActivityLog `comment_added`
4. Créer une Notification pour le owner du fichier (si le commentateur n'est pas le owner)

---

### Partage (`/api/sharing/...`)

Alimente la page **Shared with me** et l'action "Share" du FileContextMenu.

#### `GET /api/sharing/shared-with-me`
Liste les fichiers partagés avec l'utilisateur. Utilisé par la page **SharedWithMe**.
```
Headers: Authorization: Bearer <token>
Query params:
  ?sort=date               # date, name, size (default: date)
  &order=desc

Response 200:
{
    "files": [
        {
            "id": "uuid",
            "name": "Website_Mockups_V3.fig",
            "type": "Figma Design File",
            "icon": "image",
            "icon_bg": "bg-purple-100 dark:bg-purple-900/40",
            "icon_color": "text-purple-600 dark:text-purple-400",
            "is_folder": false,
            "shared_by": {
                "id": "uuid",
                "name": "Sarah Miller",
                "avatar_url": "https://i.pravatar.cc/32?img=1"
            },
            "date_shared": "Today, 10:23 AM",
            "size": "45 MB",
            "permission": "editor"
        }
    ]
}
```

**Logique :**
1. Récupérer SharedFile WHERE shared_with_id = current_user
2. Pour chaque SharedFile, joindre le File et le User (shared_by)
3. Trier selon le paramètre sort
4. Formater les dates et tailles

#### `POST /api/files/:fileId/share`
Partager un fichier. Déclenché par l'action "Share" du FileContextMenu (icône `share`, raccourci Ctrl+S).
```
Headers: Authorization: Bearer <token>
Request body:
{
    "email": "sarah@cloudspace.com",
    "permission": "editor"
}

Response 201:
{
    "shared_with": {
        "id": "uuid",
        "name": "Sarah Miller",
        "email": "sarah@cloudspace.com"
    },
    "permission": "editor"
}

Response 404: { "error": "User not found" }
Response 409: { "error": "File already shared with this user" }
```

**Logique :**
1. Vérifier que le user est owner du fichier
2. Trouver le destinataire par email
3. Vérifier que le fichier n'est pas déjà partagé avec cette personne
4. Créer le SharedFile
5. Logger un ActivityLog `file_shared`
6. Créer une Notification pour le destinataire

#### `DELETE /api/files/:fileId/share/:userId`
Retirer le partage.
```
Headers: Authorization: Bearer <token>

Response 200: { "message": "Sharing removed" }
```

---

### Fichiers récents (`/api/files/recent`)

Alimente la page **Recent** avec les fichiers récemment consultés/modifiés, groupés par date.

#### `GET /api/files/recent`
```
Headers: Authorization: Bearer <token>
Query params:
  ?limit=20
  &offset=0

Response 200:
{
    "groups": [
        {
            "label": "Today",
            "files": [
                {
                    "id": "uuid",
                    "name": "Project_Brief_v3.docx",
                    "icon": "description",
                    "icon_color": "text-blue-500",
                    "icon_bg": "bg-blue-500/10",
                    "owner": "You",
                    "activity": "Edited 10:42 AM",
                    "activity_type": "file_edited",
                    "updated_at": "2024-10-26T10:42:00Z"
                }
            ]
        },
        {
            "label": "Yesterday",
            "files": [...]
        },
        {
            "label": "Last Week",
            "files": [...]
        }
    ]
}
```

**Logique :**
1. Récupérer les ActivityLog du current_user avec action IN ("file_edited", "file_viewed", "file_uploaded", "file_created") triés par created_at DESC
2. Dé-dupliquer par file_id (garder la plus récente activité par fichier)
3. Grouper par date relative :
   - Aujourd'hui (created_at >= début de la journée)
   - Hier (created_at >= début d'hier AND < début d'aujourd'hui)
   - Cette semaine (created_at >= lundi de cette semaine)
   - Semaine dernière (created_at >= lundi semaine dernière)
   - Plus ancien : grouper par mois ("October 2024", etc.)
4. Pour le champ `owner` : "You" si owner_id == current_user, sinon le nom abrégé du owner

---

### Favoris (`/api/files/starred`)

Alimente la page **Starred** avec les fichiers et dossiers marqués comme favoris.

#### `GET /api/files/starred`
```
Headers: Authorization: Bearer <token>
Query params: ?sort=name

Response 200:
{
    "folders": [
        {
            "id": "uuid",
            "name": "Design System V2",
            "items_count": 48,
            "size": "320 MB",
            "icon": "folder",
            "icon_color": "text-yellow-500",
            "is_locked": false
        }
    ],
    "files": [
        {
            "id": "uuid",
            "name": "Q3_Financial_Summary.pdf",
            "icon": "picture_as_pdf",
            "icon_color": "text-red-500",
            "icon_bg": "bg-slate-50 dark:bg-[#151e26]",
            "updated_at": "Updated 2h ago",
            "type_badge": "PDF",
            "badge_color": "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400",
            "is_image": false,
            "preview_url": null
        }
    ]
}
```

**Logique :**
1. Récupérer File WHERE (owner_id = current_user OR shared_with) AND is_starred = True AND is_trashed = False
2. Séparer folders et files
3. Pour les dossiers : calculer items_count et total_size
4. Pour les fichiers : déterminer type_badge depuis l'extension/mime_type et si c'est une image
5. Trier selon le paramètre sort

**Table de mapping extension → type_badge :**
| Extension | type_badge |
|-----------|-----------|
| .pdf | PDF |
| .doc, .docx | DOC |
| .xls, .xlsx | XLS |
| .ppt, .pptx | PPT |
| .jpg, .jpeg, .png, .gif, .webp, .svg | IMG |
| .mp4, .avi, .mov, .mkv | MP4 |
| .mp3, .wav, .flac | MP3 |
| .zip, .rar, .7z | ZIP |
| .fig | FIG |
| autre | FILE |

---

### Historique (`/api/activity/history`)

Alimente la page **History** avec le journal complet de toutes les actions.

#### `GET /api/activity/history`
```
Headers: Authorization: Bearer <token>
Query params:
  ?limit=20
  &offset=0
  &filter=all              # all, uploads, edits, shares, deletes, comments

Response 200:
{
    "groups": [
        {
            "date": "Today",
            "events_count": 4,
            "events": [
                {
                    "id": "uuid",
                    "time": "11:42 AM",
                    "action": "You edited",
                    "target": "Project_Brief_v3.docx",
                    "target_id": "uuid",
                    "icon": "edit_document",
                    "icon_color": "text-blue-500",
                    "icon_bg": "bg-blue-500/10"
                }
            ]
        },
        {
            "date": "Yesterday",
            "events_count": 4,
            "events": [...]
        }
    ],
    "has_more": true
}
```

**Logique :**
1. Récupérer TOUS les ActivityLog liés au current_user (ses actions + actions des autres sur ses fichiers) triés par created_at DESC
2. Grouper par date (Today, Yesterday, date exacte pour les plus anciens)
3. Pour chaque event, mapper l'action vers un texte lisible et une icône :

| Action DB | Texte affiché | Icône |
|-----------|---------------|-------|
| `file_edited` | "You edited" / "{User} edited" | `edit_document` |
| `file_uploaded` | "You uploaded" / "{User} uploaded" | `upload_file` |
| `file_shared` | "You shared" / "{User} shared" | `share` |
| `file_renamed` | "You renamed" | `drive_file_rename_outline` |
| `file_trashed` | "You moved to trash" | `delete` |
| `comment_added` | "{User} commented on" | `comment` |
| `file_downloaded` | "You downloaded" | `download` |
| `folder_created` | "You created folder" | `create_new_folder` |
| `file_unshared` | "{User} removed sharing on" | `person_remove` |
| `file_restored` | "You restored from trash" | `restore_from_trash` |
| `file_locked` | "You locked" | `lock` |
| `file_copied` | "You made a copy of" | `content_copy` |
| `file_moved` | "You moved" | `drive_file_move` |

---

### Corbeille (`/api/trash/...`)

Alimente la page **Trash**.

#### `GET /api/trash`
```
Headers: Authorization: Bearer <token>

Response 200:
{
    "items": [
        {
            "id": "uuid",
            "name": "Old_Project_Archive_v1.zip",
            "icon": "folder_zip",
            "icon_bg": "bg-gray-100 dark:bg-gray-900/40",
            "icon_color": "text-gray-600 dark:text-gray-400",
            "is_folder": false,
            "original_location": "My Drive/Projects",
            "date_deleted": "Today, 10:23 AM",
            "days_remaining": 28,
            "trashed_at": "2024-10-26T10:23:00Z"
        }
    ],
    "total_count": 5
}
```

**Logique :**
1. Récupérer File WHERE owner_id = current_user AND is_trashed = True
2. Trier par trashed_at DESC (les plus récents en premier)
3. Pour `original_location` : reconstruire le chemin depuis `original_parent_id` en remontant les parents
4. Pour `days_remaining` : calculer 30 - (now - trashed_at).days

#### `POST /api/trash/:fileId/restore`
Restaurer un fichier de la corbeille.
```
Headers: Authorization: Bearer <token>

Response 200: { restored file object }
Response 404: { "error": "File not found in trash" }
Response 409: { "error": "Original location no longer exists. File restored to root." }
```

**Logique :**
1. Vérifier que le fichier est bien en corbeille et appartient au user
2. Mettre `is_trashed = False`, `trashed_at = null`
3. Restaurer `parent_id = original_parent_id` (si le dossier parent existe encore, sinon mettre à la racine)
4. Mettre `original_parent_id = null`
5. Logger un ActivityLog `file_restored`

#### `DELETE /api/trash/:fileId`
Supprimer définitivement un fichier de la corbeille.
```
Headers: Authorization: Bearer <token>

Response 200: { "message": "File permanently deleted" }
```

**Logique :**
1. Vérifier que le fichier est en corbeille et appartient au user
2. Supprimer le fichier physique sur disque/S3
3. Si c'est un dossier : supprimer récursivement tous les enfants (fichiers physiques + entrées BDD)
4. Supprimer l'entrée File de la BDD
5. Mettre à jour storage_used du user
6. Logger un ActivityLog `file_deleted`

#### `DELETE /api/trash`
Vider la corbeille. Déclenché par le bouton rouge "Empty Trash" (icône `delete_forever`).
```
Headers: Authorization: Bearer <token>

Response 200:
{
    "message": "Trash emptied",
    "deleted_count": 5,
    "space_freed": "650 MB"
}
```

**Logique :**
1. Récupérer tous les File WHERE owner_id = current_user AND is_trashed = True
2. Pour chaque fichier : supprimer le fichier physique
3. Supprimer toutes les entrées File
4. Recalculer storage_used du user
5. Logger un ActivityLog pour chaque fichier supprimé (ou un seul `trash_emptied`)

#### `DELETE /api/files/:fileId` (Move to trash)
Mettre un fichier à la corbeille. Déclenché par l'action "Move to Trash" du FileContextMenu (icône `delete`, raccourci Del).
```
Headers: Authorization: Bearer <token>

Response 200:
{
    "id": "uuid",
    "is_trashed": true,
    "trashed_at": "2024-10-26T15:00:00Z"
}
```

**Logique :**
1. Vérifier que le user est owner
2. Sauvegarder `original_parent_id = parent_id`
3. Mettre `is_trashed = True`, `trashed_at = now`
4. Si c'est un dossier : mettre récursivement tous les enfants en corbeille aussi
5. Logger un ActivityLog `file_trashed`

---

### Recherche (`/api/search`)

Alimente la barre de recherche du **Header**. Le placeholder change selon la page active.

#### `GET /api/search`
```
Headers: Authorization: Bearer <token>
Query params:
  ?q=logo                  # texte de recherche
  &type=all                # all, file, folder, user
  &scope=all               # all, drive, shared, trash
  &limit=10

Response 200:
{
    "results": [
        {
            "type": "file",
            "id": "uuid",
            "name": "Logo_V2.fig",
            "icon": "image",
            "icon_color": "text-indigo-500",
            "path": "My Drive/Projects/Q4 Marketing",
            "modified": "2 min ago",
            "size": "14 MB"
        },
        {
            "type": "folder",
            "id": "uuid",
            "name": "Logo Assets",
            "icon": "folder",
            "icon_color": "text-yellow-500",
            "path": "My Drive/Design",
            "items_count": 12
        },
        {
            "type": "user",
            "id": "uuid",
            "name": "Sarah Miller",
            "email": "sarah@cloudspace.com",
            "avatar_url": null
        }
    ],
    "total_count": 15
}
```

**Logique :**
1. Rechercher dans File.name avec ILIKE '%query%' WHERE (owner_id = current_user OR shared with current_user) AND is_trashed = False (sauf si scope = trash)
2. Si type includes "user" : rechercher aussi dans User.first_name, User.last_name, User.email
3. Trier par pertinence (correspondance exacte > début de nom > contient)
4. Limiter les résultats
5. Pour chaque résultat fichier : reconstruire le path

---

### Notifications (`/api/notifications`)

Alimente le bouton cloche du **Header**.

#### `GET /api/notifications`
```
Headers: Authorization: Bearer <token>
Query params: ?unread_only=false

Response 200:
{
    "notifications": [
        {
            "id": "uuid",
            "type": "share",
            "title": "Sarah Miller shared a file with you",
            "message": "Website_Mockups_V3.fig",
            "is_read": false,
            "related_file_id": "uuid",
            "created_at": "2024-10-26T10:23:00Z",
            "time_ago": "2h ago"
        }
    ],
    "unread_count": 3
}
```

#### `PUT /api/notifications/:id/read`
Marquer une notification comme lue.
```
Response 200: { "is_read": true }
```

#### `PUT /api/notifications/read-all`
Marquer toutes les notifications comme lues.
```
Response 200: { "message": "All notifications marked as read" }
```

---

## Tâches automatiques (CRON / Background Jobs)

### 1. Auto-suppression de la corbeille
Les fichiers en corbeille depuis plus de 30 jours doivent être supprimés automatiquement. Le frontend affiche "Items in trash are deleted forever after 30 days." sur la page Trash.

```python
# À exécuter toutes les heures ou une fois par jour
def cleanup_trash():
    cutoff = datetime.utcnow() - timedelta(days=30)
    expired_files = File.query.filter(
        File.is_trashed == True,
        File.trashed_at <= cutoff
    ).all()
    for file in expired_files:
        # Supprimer fichier physique
        # Supprimer de la BDD
        # Mettre à jour storage_used du owner
```

### 2. Mise à jour du statut en ligne
Mettre `is_online = False` pour les utilisateurs inactifs depuis plus de 5 minutes (pas de requête API récente).

---

## Structure de fichiers backend recommandée

```
backend/
├── app.py                          # Point d'entrée, create_app()
├── dockerfile
├── requirements.txt                # flask, flask-sqlalchemy, flask-migrate, flask-cors, flask-jwt-extended, python-dotenv, werkzeug, python-magic
├── .env                            # Variables d'environnement (SECRET_KEY, DATABASE_URL, JWT_SECRET, UPLOAD_FOLDER)
├── migrations/                     # Alembic migrations (flask-migrate)
└── src/
    ├── __init__.py                 # create_app() factory avec config, extensions, blueprints
    ├── config.py                   # Configuration (dev, prod, test)
    ├── extensions.py               # db, migrate, jwt, cors instances
    ├── models/
    │   ├── __init__.py             # Import all models
    │   ├── user.py                 # User, UserSettings
    │   ├── file.py                 # File
    │   ├── shared_file.py          # SharedFile
    │   ├── activity_log.py         # ActivityLog
    │   ├── comment.py              # Comment
    │   └── notification.py         # Notification
    ├── routes/
    │   ├── __init__.py             # Register all blueprints
    │   ├── auth.py                 # /api/auth/* (register, login, logout)
    │   ├── user.py                 # /api/user/* (profile, avatar, password, 2fa, storage)
    │   ├── drive.py                # /api/drive/* (contents, create folder)
    │   ├── files.py                # /api/files/* (upload, detail, rename, move, copy, lock, star, download, preview, activity, comments, delete/trash)
    │   ├── sharing.py              # /api/sharing/* (shared-with-me, share, unshare)
    │   ├── dashboard.py            # /api/dashboard/* (stats, activity, quick-access, team)
    │   ├── recent.py               # /api/files/recent
    │   ├── starred.py              # /api/files/starred
    │   ├── trash.py                # /api/trash/* (list, restore, delete, empty)
    │   ├── history.py              # /api/activity/history
    │   ├── search.py               # /api/search
    │   ├── notifications.py        # /api/notifications/*
    │   └── settings.py             # /api/settings/* (appearance)
    ├── services/
    │   ├── file_service.py         # Logique métier fichiers (upload, copy, move, delete, icon mapping)
    │   ├── storage_service.py      # Calcul stockage, breakdown par type
    │   ├── activity_service.py     # Logging d'activités, formatage temps relatif
    │   ├── notification_service.py # Création et envoi de notifications
    │   └── search_service.py       # Logique de recherche
    ├── utils/
    │   ├── auth.py                 # Décorateurs d'authentification, JWT helpers
    │   ├── formatters.py           # Formatage taille (bytes → "14 MB"), temps relatif ("2h ago"), dates
    │   ├── validators.py           # Validation email, password, noms de fichiers
    │   ├── file_icons.py           # Mapping mime_type → icon, color, bg (la table ci-dessus)
    │   └── permissions.py          # Vérification permissions fichier (owner, shared, locked)
    └── uploads/                    # Dossier de stockage local des fichiers uploadés
        ├── files/                  # Fichiers utilisateur
        ├── avatars/                # Photos de profil
        └── previews/               # Thumbnails et previews générés
```

---

## Dépendances Python à ajouter

```
flask
flask-sqlalchemy
flask-migrate
flask-cors
flask-jwt-extended
python-dotenv
werkzeug
python-magic
Pillow                  # Pour la génération de thumbnails
```

---

## Variables d'environnement (.env)

```
FLASK_ENV=development
SECRET_KEY=change-me-in-production
JWT_SECRET_KEY=change-me-too
DATABASE_URL=sqlite:///cloudspace.db
UPLOAD_FOLDER=./src/uploads
MAX_CONTENT_LENGTH=524288000    # 500 MB max upload
```

---

## Middleware et décorateurs

### `@jwt_required`
Toutes les routes sauf `/api/auth/register` et `/api/auth/login` nécessitent un token JWT valide dans le header `Authorization: Bearer <token>`.

### `@owner_required(file_id)`
Vérifie que le current_user est le propriétaire du fichier. Utilisé pour : rename, move, delete, lock, share.

### `@access_required(file_id)`
Vérifie que le current_user est owner OU a un SharedFile pour ce fichier. Utilisé pour : get detail, download, preview, comment, view activity.

### CORS
Le frontend tourne sur `http://localhost:5173` (dev Vite) ou `http://localhost:80` (Docker). Configurer `flask-cors` pour autoriser ces origines.

---

## Ordre d'implémentation recommandé

1. **Config + Extensions** : config.py, extensions.py, .env, requirements.txt
2. **Modèles** : User, File, SharedFile, ActivityLog, Comment, UserSettings, Notification
3. **Auth** : register, login, logout + JWT
4. **User profile** : GET/PUT profile, avatar upload, password change
5. **Drive** : list contents, create folder, breadcrumbs
6. **Files** : upload, detail, rename, move, copy, lock, star, delete (trash)
7. **Trash** : list, restore, permanent delete, empty
8. **Sharing** : share file, list shared-with-me, unshare
9. **Recent + Starred** : list recent files, list starred
10. **Activity + History** : activity logging service, history page
11. **Dashboard** : stats, storage breakdown, activity feed, quick access, team
12. **Search** : global search
13. **Notifications** : create on events, list, mark read
14. **Settings** : appearance preferences
15. **Background jobs** : trash cleanup, online status

---

## Notes importantes

- **Toutes les données sont actuellement en dur dans le frontend.** Chaque page a ses propres constantes (arrays d'objets) en haut du fichier. L'objectif est de remplacer ces constantes par des appels API `fetch()` + `useEffect()` dans chaque composant React.
- **Le frontend utilise des classes CSS Tailwind pour les icônes et couleurs.** Le backend doit retourner ces classes directement (ex: `"icon_color": "text-red-500"`) car le frontend les applique telles quelles dans les `className`.
- **Les temps relatifs** ("2h ago", "Yesterday", "Oct 24") doivent être calculés côté backend pour être cohérents. Utiliser une fonction utilitaire `format_relative_time(datetime)`.
- **Les tailles de fichiers** doivent être retournées en octets bruts ET en format lisible (ex: `"size": 14680064, "formatted_size": "14 MB"`).
- **Le docker-compose** expose le backend sur le port 5000 du réseau interne. Le client Nginx/Vite devra faire un proxy_pass vers `http://api:5000` pour les routes `/api/*`.

---

## Scripts de provisioning stockage VPS / Serveurs distants

Ces scripts servent à préparer l'espace disque sur un VPS ou un serveur distant pour héberger les fichiers uploadés par les utilisateurs de CloudSpace. Ils doivent être exécutés **avant** le déploiement du backend.

---

### Script 1 : Setup initial du stockage sur un VPS (Ubuntu/Debian)

Ce script s'exécute sur le VPS en tant que root. Il crée l'arborescence de stockage, configure les permissions, et monte un volume dédié si disponible.

```bash
#!/usr/bin/env bash
# setup_storage.sh — Provisioning du stockage CloudSpace sur un VPS
# Usage: sudo bash setup_storage.sh [--disk /dev/vdb] [--size 50G] [--mount /data/cloudspace]
#
# Ce script :
#   1. Détecte ou formate un disque supplémentaire (volume bloc VPS)
#   2. Monte le volume sur le point de montage choisi
#   3. Crée toute l'arborescence de dossiers pour CloudSpace
#   4. Configure les permissions et quotas
#   5. Ajoute l'entrée dans /etc/fstab pour le montage automatique au boot
#   6. Installe un cron de monitoring d'espace disque

set -euo pipefail

# ─── Valeurs par défaut ───────────────────────────────────────
DISK=""
MOUNT_POINT="/data/cloudspace"
APP_USER="cloudspace"
APP_GROUP="cloudspace"
MAX_STORAGE_GB=50
ALERT_THRESHOLD_PERCENT=85
ADMIN_EMAIL=""

# ─── Parsing des arguments ────────────────────────────────────
while [[ $# -gt 0 ]]; do
    case "$1" in
        --disk)     DISK="$2";              shift 2 ;;
        --size)     MAX_STORAGE_GB="${2%G}"; shift 2 ;;
        --mount)    MOUNT_POINT="$2";       shift 2 ;;
        --user)     APP_USER="$2";          shift 2 ;;
        --email)    ADMIN_EMAIL="$2";       shift 2 ;;
        *)          echo "Option inconnue: $1"; exit 1 ;;
    esac
done

echo "================================================"
echo "  CloudSpace Storage Provisioning"
echo "================================================"
echo "  Mount point : $MOUNT_POINT"
echo "  Disk        : ${DISK:-'(aucun, stockage local)'}"
echo "  Max storage : ${MAX_STORAGE_GB} GB"
echo "  App user    : $APP_USER"
echo "================================================"

# ─── 1. Créer l'utilisateur système ──────────────────────────
if ! id "$APP_USER" &>/dev/null; then
    echo "[1/7] Création de l'utilisateur système '$APP_USER'..."
    groupadd -f "$APP_GROUP"
    useradd -r -g "$APP_GROUP" -d "$MOUNT_POINT" -s /usr/sbin/nologin "$APP_USER"
else
    echo "[1/7] Utilisateur '$APP_USER' existe déjà. OK."
fi

# ─── 2. Préparer le disque (si spécifié) ─────────────────────
if [[ -n "$DISK" ]]; then
    echo "[2/7] Préparation du disque $DISK..."

    # Vérifier que le disque existe
    if [[ ! -b "$DISK" ]]; then
        echo "ERREUR: Le disque $DISK n'existe pas."
        echo "Disques disponibles :"
        lsblk -d -o NAME,SIZE,TYPE,MOUNTPOINT
        exit 1
    fi

    # Vérifier si le disque est déjà formaté
    FSTYPE=$(blkid -o value -s TYPE "$DISK" 2>/dev/null || echo "")
    if [[ -z "$FSTYPE" ]]; then
        echo "  → Formatage de $DISK en ext4..."
        mkfs.ext4 -L cloudspace-data "$DISK"
    else
        echo "  → Disque déjà formaté ($FSTYPE). On le garde tel quel."
    fi

    # Créer le point de montage
    mkdir -p "$MOUNT_POINT"

    # Monter le disque
    if ! mountpoint -q "$MOUNT_POINT"; then
        echo "  → Montage de $DISK sur $MOUNT_POINT..."
        mount "$DISK" "$MOUNT_POINT"
    else
        echo "  → $MOUNT_POINT est déjà monté."
    fi

    # Ajouter dans /etc/fstab pour montage automatique au boot
    DISK_UUID=$(blkid -o value -s UUID "$DISK")
    FSTAB_ENTRY="UUID=$DISK_UUID  $MOUNT_POINT  ext4  defaults,noatime,nofail  0  2"
    if ! grep -q "$DISK_UUID" /etc/fstab; then
        echo "  → Ajout dans /etc/fstab..."
        echo "$FSTAB_ENTRY" >> /etc/fstab
    fi
else
    echo "[2/7] Pas de disque spécifié, utilisation du stockage local."
    mkdir -p "$MOUNT_POINT"
fi

# ─── 3. Créer l'arborescence CloudSpace ──────────────────────
echo "[3/7] Création de l'arborescence de stockage..."

# Dossiers principaux
mkdir -p "$MOUNT_POINT/files"          # Fichiers uploadés par les utilisateurs
mkdir -p "$MOUNT_POINT/avatars"        # Photos de profil
mkdir -p "$MOUNT_POINT/previews"       # Thumbnails et previews générés
mkdir -p "$MOUNT_POINT/temp"           # Fichiers temporaires (uploads en cours)
mkdir -p "$MOUNT_POINT/backups"        # Sauvegardes BDD et fichiers critiques
mkdir -p "$MOUNT_POINT/logs"           # Logs de stockage et monitoring

# Structure des fichiers utilisateurs : files/{user_uuid_prefix}/{user_uuid}/
# Les fichiers sont organisés par les 2 premiers caractères de l'UUID du user
# pour éviter d'avoir des milliers de dossiers au même niveau.
# Exemple : files/a3/a3f4e2b1-..../document.pdf
# Cette structure est créée dynamiquement à l'upload, pas ici.

echo "  Arborescence créée :"
echo "    $MOUNT_POINT/"
echo "    ├── files/          # Fichiers utilisateurs (organisés par UUID)"
echo "    ├── avatars/        # Photos de profil"
echo "    ├── previews/       # Thumbnails générés"
echo "    ├── temp/           # Uploads en cours"
echo "    ├── backups/        # Sauvegardes"
echo "    └── logs/           # Logs de monitoring"

# ─── 4. Permissions ──────────────────────────────────────────
echo "[4/7] Configuration des permissions..."

chown -R "$APP_USER:$APP_GROUP" "$MOUNT_POINT"
chmod 750 "$MOUNT_POINT"
chmod 750 "$MOUNT_POINT/files"
chmod 750 "$MOUNT_POINT/avatars"
chmod 750 "$MOUNT_POINT/previews"
chmod 770 "$MOUNT_POINT/temp"       # Le backend doit écrire dans temp
chmod 700 "$MOUNT_POINT/backups"    # Seulement le owner peut lire les backups
chmod 750 "$MOUNT_POINT/logs"

# Sticky bit sur temp pour empêcher les suppressions croisées
chmod +t "$MOUNT_POINT/temp"

echo "  Permissions appliquées."

# ─── 5. Quotas disque (optionnel, si le filesystem supporte) ─
echo "[5/7] Configuration des quotas..."

# Installer quota si pas présent
if command -v setquota &>/dev/null; then
    # Activer les quotas sur la partition (nécessite remount)
    QUOTA_SIZE_KB=$((MAX_STORAGE_GB * 1024 * 1024))
    HARD_LIMIT_KB=$((QUOTA_SIZE_KB + (QUOTA_SIZE_KB / 10)))  # Hard limit = soft + 10%

    # On met un quota par utilisateur système si nécessaire
    echo "  Quota configuré : soft=${MAX_STORAGE_GB}GB, hard=$((MAX_STORAGE_GB + MAX_STORAGE_GB/10))GB"
    echo "  Note: Les quotas par utilisateur CloudSpace sont gérés au niveau applicatif (BDD User.storage_limit)"
else
    echo "  Package 'quota' non installé. Les quotas sont gérés au niveau applicatif."
fi

# ─── 6. Script de nettoyage automatique ──────────────────────
echo "[6/7] Installation des tâches cron..."

# Nettoyage des fichiers temp vieux de plus de 24h
CRON_TEMP_CLEANUP="0 */6 * * * find $MOUNT_POINT/temp -type f -mmin +1440 -delete 2>/dev/null"

# Nettoyage des previews orphelines vieilles de plus de 7 jours (les previews de fichiers supprimés)
CRON_PREVIEW_CLEANUP="0 3 * * 0 find $MOUNT_POINT/previews -type f -mtime +7 -delete 2>/dev/null"

# Monitoring de l'espace disque : alerte si > seuil
cat > "$MOUNT_POINT/logs/check_disk_space.sh" << 'MONITOR_EOF'
#!/usr/bin/env bash
# Script de monitoring espace disque CloudSpace

MOUNT_POINT="__MOUNT_POINT__"
THRESHOLD=__THRESHOLD__
ADMIN_EMAIL="__ADMIN_EMAIL__"
LOG_FILE="$MOUNT_POINT/logs/disk_usage.log"

# Récupérer le pourcentage d'utilisation
USAGE=$(df "$MOUNT_POINT" | tail -1 | awk '{print $5}' | tr -d '%')
TOTAL=$(df -h "$MOUNT_POINT" | tail -1 | awk '{print $2}')
USED=$(df -h "$MOUNT_POINT" | tail -1 | awk '{print $3}')
AVAIL=$(df -h "$MOUNT_POINT" | tail -1 | awk '{print $4}')

# Logger l'utilisation
echo "$(date '+%Y-%m-%d %H:%M:%S') | Usage: ${USAGE}% | Used: $USED / $TOTAL | Available: $AVAIL" >> "$LOG_FILE"

# Alerte si au-dessus du seuil
if [[ "$USAGE" -ge "$THRESHOLD" ]]; then
    MESSAGE="ALERTE: L'espace disque CloudSpace est à ${USAGE}% (seuil: ${THRESHOLD}%)\n"
    MESSAGE+="Utilisé: $USED sur $TOTAL\n"
    MESSAGE+="Disponible: $AVAIL\n"
    MESSAGE+="Montage: $MOUNT_POINT"

    echo -e "$MESSAGE" >> "$LOG_FILE"

    # Envoyer un email si configuré
    if [[ -n "$ADMIN_EMAIL" ]] && command -v mail &>/dev/null; then
        echo -e "$MESSAGE" | mail -s "[CloudSpace] ALERTE: Espace disque à ${USAGE}%" "$ADMIN_EMAIL"
    fi

    # Aussi écrire dans syslog
    logger -t cloudspace-storage "ALERTE: Espace disque à ${USAGE}% sur $MOUNT_POINT"
fi

# Rotation du log (garder les 1000 dernières lignes)
if [[ -f "$LOG_FILE" ]] && [[ $(wc -l < "$LOG_FILE") -gt 1000 ]]; then
    tail -500 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
fi
MONITOR_EOF

# Remplacer les placeholders
sed -i "s|__MOUNT_POINT__|$MOUNT_POINT|g" "$MOUNT_POINT/logs/check_disk_space.sh"
sed -i "s|__THRESHOLD__|$ALERT_THRESHOLD_PERCENT|g" "$MOUNT_POINT/logs/check_disk_space.sh"
sed -i "s|__ADMIN_EMAIL__|$ADMIN_EMAIL|g" "$MOUNT_POINT/logs/check_disk_space.sh"
chmod +x "$MOUNT_POINT/logs/check_disk_space.sh"

# Installer les crons
CRON_DISK_MONITOR="*/30 * * * * $MOUNT_POINT/logs/check_disk_space.sh"

# Écrire les crons (en préservant les crons existants)
(crontab -l 2>/dev/null | grep -v "cloudspace"; echo "$CRON_TEMP_CLEANUP"; echo "$CRON_PREVIEW_CLEANUP"; echo "$CRON_DISK_MONITOR") | crontab -

echo "  Crons installés :"
echo "    - Nettoyage temp : toutes les 6h"
echo "    - Nettoyage previews orphelines : dimanche 3h"
echo "    - Monitoring disque : toutes les 30min (alerte à ${ALERT_THRESHOLD_PERCENT}%)"

# ─── 7. Résumé ───────────────────────────────────────────────
echo "[7/7] Vérification finale..."

DISK_TOTAL=$(df -h "$MOUNT_POINT" | tail -1 | awk '{print $2}')
DISK_AVAIL=$(df -h "$MOUNT_POINT" | tail -1 | awk '{print $4}')

echo ""
echo "================================================"
echo "  PROVISIONING TERMINÉ"
echo "================================================"
echo "  Point de montage : $MOUNT_POINT"
echo "  Espace total     : $DISK_TOTAL"
echo "  Espace disponible: $DISK_AVAIL"
echo "  Utilisateur       : $APP_USER:$APP_GROUP"
echo ""
echo "  Pour utiliser ce stockage dans le backend Flask,"
echo "  ajouter dans le .env :"
echo ""
echo "    UPLOAD_FOLDER=$MOUNT_POINT"
echo ""
echo "  Et dans docker-compose.yml, monter le volume :"
echo ""
echo "    volumes:"
echo "      - $MOUNT_POINT:$MOUNT_POINT"
echo "================================================"
```

---

### Script 2 : Allocation d'un volume bloc sur les principaux cloud providers

Scripts courts pour allouer un volume de stockage depuis les CLI des cloud providers, puis l'attacher au VPS.

#### AWS (EBS Volume)

```bash
#!/usr/bin/env bash
# aws_provision_storage.sh — Créer et attacher un volume EBS
# Prérequis : aws-cli configuré (aws configure)
# Usage: bash aws_provision_storage.sh [--size 100] [--region eu-west-3] [--instance-id i-xxxxx]

set -euo pipefail

SIZE_GB="${1:-100}"
REGION="${2:-eu-west-3}"
INSTANCE_ID="${3:-$(curl -s http://169.254.169.254/latest/meta-data/instance-id)}"
AZ=$(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)

echo "Création d'un volume EBS de ${SIZE_GB}GB dans $AZ..."

# 1. Créer le volume EBS
VOLUME_ID=$(aws ec2 create-volume \
    --volume-type gp3 \
    --size "$SIZE_GB" \
    --availability-zone "$AZ" \
    --tag-specifications "ResourceType=volume,Tags=[{Key=Name,Value=cloudspace-data},{Key=Project,Value=cloudspace}]" \
    --query 'VolumeId' \
    --output text \
    --region "$REGION")

echo "Volume créé : $VOLUME_ID"

# 2. Attendre que le volume soit disponible
echo "Attente que le volume soit disponible..."
aws ec2 wait volume-available --volume-ids "$VOLUME_ID" --region "$REGION"

# 3. Attacher le volume à l'instance
DEVICE="/dev/xvdf"
echo "Attachement de $VOLUME_ID à $INSTANCE_ID sur $DEVICE..."
aws ec2 attach-volume \
    --volume-id "$VOLUME_ID" \
    --instance-id "$INSTANCE_ID" \
    --device "$DEVICE" \
    --region "$REGION"

# 4. Attendre que le volume soit attaché
echo "Attente de l'attachement..."
aws ec2 wait volume-in-use --volume-ids "$VOLUME_ID" --region "$REGION"
sleep 5  # Laisser le temps au kernel de détecter le device

echo ""
echo "Volume $VOLUME_ID attaché sur $DEVICE"
echo ""
echo "Étape suivante : exécuter le script de setup :"
echo "  sudo bash setup_storage.sh --disk $DEVICE --size ${SIZE_GB}G"
```

#### Hetzner Cloud

```bash
#!/usr/bin/env bash
# hetzner_provision_storage.sh — Créer et attacher un volume Hetzner
# Prérequis : hcloud CLI configuré (hcloud context create)
# Usage: bash hetzner_provision_storage.sh [--size 100] [--server cloudspace-vps]

set -euo pipefail

SIZE_GB="${1:-100}"
SERVER_NAME="${2:-cloudspace-vps}"

echo "Création d'un volume Hetzner de ${SIZE_GB}GB..."

# 1. Créer le volume
VOLUME_NAME="cloudspace-data"
hcloud volume create \
    --name "$VOLUME_NAME" \
    --size "$SIZE_GB" \
    --server "$SERVER_NAME" \
    --format ext4 \
    --automount

echo "Volume '$VOLUME_NAME' créé et attaché à '$SERVER_NAME'"

# 2. Récupérer le point de montage
# Hetzner monte automatiquement sur /mnt/HC_Volume_XXXXX
MOUNT_INFO=$(hcloud volume describe "$VOLUME_NAME" -o format='{{.LinuxDevice}}')
echo "Device: $MOUNT_INFO"

echo ""
echo "Étape suivante : exécuter le script de setup :"
echo "  sudo bash setup_storage.sh --disk $MOUNT_INFO --size ${SIZE_GB}G"
```

#### DigitalOcean

```bash
#!/usr/bin/env bash
# digitalocean_provision_storage.sh — Créer et attacher un volume DO
# Prérequis : doctl configuré (doctl auth init)
# Usage: bash digitalocean_provision_storage.sh [--size 100] [--droplet-id 123456]

set -euo pipefail

SIZE_GB="${1:-100}"
REGION="${2:-fra1}"
DROPLET_ID="${3:-$(curl -s http://169.254.169.254/metadata/v1/id)}"

echo "Création d'un volume DigitalOcean de ${SIZE_GB}GB..."

# 1. Créer le volume
VOLUME_ID=$(doctl compute volume create cloudspace-data \
    --region "$REGION" \
    --size "${SIZE_GB}GiB" \
    --fs-type ext4 \
    --format json | jq -r '.[0].id')

echo "Volume créé : $VOLUME_ID"

# 2. Attacher le volume au droplet
doctl compute volume-action attach "$VOLUME_ID" "$DROPLET_ID"

echo "Volume attaché au droplet $DROPLET_ID"
echo ""
echo "Le volume est monté sur /mnt/cloudspace-data"
echo ""
echo "Étape suivante : exécuter le script de setup :"
echo "  sudo bash setup_storage.sh --disk /dev/disk/by-id/scsi-0DO_Volume_cloudspace-data --size ${SIZE_GB}G"
```

#### OVH / Scaleway / Générique (volume déjà attaché)

```bash
#!/usr/bin/env bash
# generic_provision_storage.sh — Pour un VPS avec un disque déjà attaché
# Usage: bash generic_provision_storage.sh

set -euo pipefail

echo "=== Disques disponibles ==="
echo ""
lsblk -d -o NAME,SIZE,TYPE,MOUNTPOINT,FSTYPE
echo ""

echo "=== Partitions non montées ==="
UNMOUNTED=$(lsblk -rn -o NAME,SIZE,TYPE,MOUNTPOINT | awk '$3=="disk" && $4=="" {print "/dev/"$1, $2}')
if [[ -z "$UNMOUNTED" ]]; then
    echo "Aucun disque non monté trouvé."
    echo ""
    echo "Si vous utilisez le stockage local, exécutez simplement :"
    echo "  sudo bash setup_storage.sh"
else
    echo "$UNMOUNTED"
    echo ""
    echo "Pour utiliser un de ces disques, exécutez :"
    echo "  sudo bash setup_storage.sh --disk /dev/VOTRE_DISQUE --size TAILLE"
fi
```

---

### Script 3 : Backup automatique du stockage et de la BDD

```bash
#!/usr/bin/env bash
# backup_cloudspace.sh — Sauvegarde incrémentale des fichiers + dump BDD
# Usage: bash backup_cloudspace.sh
# À mettre en cron : 0 2 * * * /path/to/backup_cloudspace.sh
#
# Ce script :
#   1. Dump la base de données SQLite/PostgreSQL
#   2. Fait un rsync incrémental des fichiers vers le dossier backups
#   3. Compresse et date l'archive
#   4. Supprime les backups de plus de 30 jours
#   5. (Optionnel) Envoie le backup vers un stockage distant (S3, rsync distant)

set -euo pipefail

# ─── Configuration ────────────────────────────────────────────
MOUNT_POINT="/data/cloudspace"
BACKUP_DIR="$MOUNT_POINT/backups"
DB_PATH="$MOUNT_POINT/../backend/instance/cloudspace.db"   # SQLite
# DB_URL="postgresql://user:pass@localhost/cloudspace"      # PostgreSQL (si applicable)
RETENTION_DAYS=30
DATE=$(date '+%Y-%m-%d_%H%M%S')
BACKUP_NAME="cloudspace_backup_$DATE"
REMOTE_BACKUP=""  # Optionnel : user@remote:/backups/ ou s3://bucket/backups/

echo "[$(date)] Début du backup CloudSpace..."

# ─── 1. Dump de la base de données ───────────────────────────
echo "[1/4] Dump de la base de données..."
mkdir -p "$BACKUP_DIR/db"

if [[ -f "$DB_PATH" ]]; then
    # SQLite
    sqlite3 "$DB_PATH" ".backup '$BACKUP_DIR/db/cloudspace_$DATE.db'"
    echo "  SQLite dump → $BACKUP_DIR/db/cloudspace_$DATE.db"
else
    # PostgreSQL (décommenter si nécessaire)
    # pg_dump "$DB_URL" > "$BACKUP_DIR/db/cloudspace_$DATE.sql"
    # echo "  PostgreSQL dump → $BACKUP_DIR/db/cloudspace_$DATE.sql"
    echo "  Base de données non trouvée à $DB_PATH, skip."
fi

# ─── 2. Backup incrémental des fichiers ──────────────────────
echo "[2/4] Backup incrémental des fichiers..."
mkdir -p "$BACKUP_DIR/files_snapshot"

# rsync incrémental avec hard links vers le dernier backup (économise l'espace)
LATEST_LINK="$BACKUP_DIR/files_snapshot/latest"
rsync -a --delete \
    --link-dest="$LATEST_LINK" \
    "$MOUNT_POINT/files/" \
    "$MOUNT_POINT/avatars/" \
    "$BACKUP_DIR/files_snapshot/$DATE/"

# Mettre à jour le lien "latest"
rm -f "$LATEST_LINK"
ln -sf "$DATE" "$LATEST_LINK"

echo "  Fichiers synchronisés → $BACKUP_DIR/files_snapshot/$DATE/"

# ─── 3. Compression (optionnel, pour les dumps BDD) ──────────
echo "[3/4] Compression du dump BDD..."
if [[ -f "$BACKUP_DIR/db/cloudspace_$DATE.db" ]]; then
    gzip "$BACKUP_DIR/db/cloudspace_$DATE.db"
    echo "  Compressé → cloudspace_$DATE.db.gz"
fi

# ─── 4. Rotation : supprimer les vieux backups ───────────────
echo "[4/4] Rotation des backups (rétention: ${RETENTION_DAYS} jours)..."

# Supprimer les dumps BDD vieux
find "$BACKUP_DIR/db" -name "*.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null
find "$BACKUP_DIR/db" -name "*.sql" -mtime +$RETENTION_DAYS -delete 2>/dev/null
find "$BACKUP_DIR/db" -name "*.db" -mtime +$RETENTION_DAYS -delete 2>/dev/null

# Supprimer les snapshots fichiers vieux
find "$BACKUP_DIR/files_snapshot" -maxdepth 1 -mindepth 1 -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null

DELETED=$(find "$BACKUP_DIR" -maxdepth 2 -mtime +$RETENTION_DAYS -type f 2>/dev/null | wc -l)
echo "  $DELETED anciens fichiers supprimés."

# ─── 5. Envoi distant (optionnel) ────────────────────────────
if [[ -n "$REMOTE_BACKUP" ]]; then
    echo "[Bonus] Envoi du backup vers $REMOTE_BACKUP..."
    if [[ "$REMOTE_BACKUP" == s3://* ]]; then
        # AWS S3
        aws s3 sync "$BACKUP_DIR/db/" "$REMOTE_BACKUP/db/" --storage-class STANDARD_IA
        aws s3 sync "$BACKUP_DIR/files_snapshot/$DATE/" "$REMOTE_BACKUP/files/$DATE/" --storage-class STANDARD_IA
    else
        # rsync distant
        rsync -azP "$BACKUP_DIR/db/" "$REMOTE_BACKUP/db/"
        rsync -azP --link-dest="$REMOTE_BACKUP/files/latest" \
            "$BACKUP_DIR/files_snapshot/$DATE/" "$REMOTE_BACKUP/files/$DATE/"
    fi
    echo "  Backup distant envoyé."
fi

# ─── Résumé ──────────────────────────────────────────────────
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | awk '{print $1}')
echo ""
echo "=== Backup terminé ==="
echo "  Date       : $DATE"
echo "  Taille     : $BACKUP_SIZE"
echo "  Emplacement: $BACKUP_DIR"
echo "[$(date)] Fin du backup."
```

---

### Script 4 : Expansion de stockage à chaud (ajout d'espace sans downtime)

Ce script s'exécute quand on veut augmenter l'espace disque sans arrêter le serveur.

```bash
#!/usr/bin/env bash
# expand_storage.sh — Expansion du volume à chaud
# Usage: sudo bash expand_storage.sh [--disk /dev/vdb] [--new-size 200G]
#
# Prérequis :
#   - Le volume bloc doit déjà avoir été redimensionné côté provider
#     (ex: aws ec2 modify-volume, hcloud volume resize, doctl volume resize)
#   - Le filesystem ext4 supporte le resize en ligne (à chaud)

set -euo pipefail

DISK="${1:-/dev/vdb}"
MOUNT_POINT="/data/cloudspace"

echo "=== Expansion du stockage CloudSpace ==="
echo ""

# 1. Vérifier que le disque existe et est monté
if [[ ! -b "$DISK" ]]; then
    echo "ERREUR: $DISK n'existe pas."
    exit 1
fi

if ! mountpoint -q "$MOUNT_POINT"; then
    echo "ERREUR: $MOUNT_POINT n'est pas monté."
    exit 1
fi

# 2. Afficher l'état actuel
echo "État actuel :"
df -h "$MOUNT_POINT"
echo ""

# 3. Vérifier si le disque a de l'espace non alloué
PART_SIZE=$(blockdev --getsize64 "$DISK")
FS_SIZE=$(df --output=size -B1 "$MOUNT_POINT" | tail -1 | tr -d ' ')

if [[ "$PART_SIZE" -le "$FS_SIZE" ]]; then
    echo "Le filesystem utilise déjà tout l'espace du disque."
    echo "Avez-vous redimensionné le volume côté provider ?"
    echo ""
    echo "Commandes pour redimensionner :"
    echo "  AWS    : aws ec2 modify-volume --volume-id vol-xxx --size 200"
    echo "  Hetzner: hcloud volume resize cloudspace-data --size 200"
    echo "  DO     : doctl compute volume-action resize cloudspace-data --size 200"
    exit 1
fi

# 4. Redimensionner la partition (si partitionné, sinon skip)
# Pour un volume raw (pas de table de partition), on skip cette étape
if [[ "$DISK" == *[0-9] ]]; then
    # C'est une partition (ex: /dev/vdb1), on a besoin de growpart
    PARENT_DISK=$(echo "$DISK" | sed 's/[0-9]*$//')
    PART_NUM=$(echo "$DISK" | grep -o '[0-9]*$')
    echo "Redimensionnement de la partition..."
    growpart "$PARENT_DISK" "$PART_NUM"
fi

# 5. Redimensionner le filesystem ext4 à chaud
echo "Redimensionnement du filesystem ext4 à chaud..."
resize2fs "$DISK"

# 6. Vérifier le résultat
echo ""
echo "Nouvel état :"
df -h "$MOUNT_POINT"
echo ""
echo "Expansion terminée."
```

---

### Script 5 : Calcul et vérification de l'intégrité du stockage

Script utilitaire pour vérifier que l'espace disque réel correspond à ce que la BDD déclare, et détecter les fichiers orphelins.

```bash
#!/usr/bin/env bash
# audit_storage.sh — Audit d'intégrité du stockage CloudSpace
# Usage: bash audit_storage.sh
# Ce script compare l'espace disque réel avec les données en BDD
# et détecte les incohérences (fichiers orphelins, entrées BDD sans fichier, etc.)

set -euo pipefail

MOUNT_POINT="/data/cloudspace"
DB_PATH="/data/cloudspace/../backend/instance/cloudspace.db"

echo "=== Audit de stockage CloudSpace ==="
echo "Date : $(date)"
echo ""

# ─── 1. Statistiques disque ──────────────────────────────────
echo "─── Espace disque ───"
df -h "$MOUNT_POINT"
echo ""

echo "─── Répartition par dossier ───"
du -sh "$MOUNT_POINT/files" 2>/dev/null   || echo "  files/    : (vide)"
du -sh "$MOUNT_POINT/avatars" 2>/dev/null || echo "  avatars/  : (vide)"
du -sh "$MOUNT_POINT/previews" 2>/dev/null|| echo "  previews/ : (vide)"
du -sh "$MOUNT_POINT/temp" 2>/dev/null    || echo "  temp/     : (vide)"
du -sh "$MOUNT_POINT/backups" 2>/dev/null || echo "  backups/  : (vide)"
echo ""

# ─── 2. Comptage des fichiers ────────────────────────────────
echo "─── Comptage fichiers ───"
FILE_COUNT=$(find "$MOUNT_POINT/files" -type f 2>/dev/null | wc -l)
AVATAR_COUNT=$(find "$MOUNT_POINT/avatars" -type f 2>/dev/null | wc -l)
PREVIEW_COUNT=$(find "$MOUNT_POINT/previews" -type f 2>/dev/null | wc -l)
TEMP_COUNT=$(find "$MOUNT_POINT/temp" -type f 2>/dev/null | wc -l)

echo "  Fichiers utilisateurs : $FILE_COUNT"
echo "  Avatars               : $AVATAR_COUNT"
echo "  Previews              : $PREVIEW_COUNT"
echo "  Fichiers temporaires  : $TEMP_COUNT"
echo ""

# ─── 3. Fichiers temp suspects (plus de 24h) ────────────────
echo "─── Fichiers temporaires suspects (> 24h) ───"
OLD_TEMP=$(find "$MOUNT_POINT/temp" -type f -mmin +1440 2>/dev/null)
if [[ -n "$OLD_TEMP" ]]; then
    echo "$OLD_TEMP" | head -20
    OLD_TEMP_COUNT=$(echo "$OLD_TEMP" | wc -l)
    echo "  → $OLD_TEMP_COUNT fichiers temp de plus de 24h (uploads échoués ?)"
else
    echo "  Aucun. OK."
fi
echo ""

# ─── 4. Gros fichiers (top 10) ──────────────────────────────
echo "─── Top 10 plus gros fichiers ───"
find "$MOUNT_POINT/files" -type f -printf '%s %p\n' 2>/dev/null | sort -rn | head -10 | while read SIZE PATH; do
    HR_SIZE=$(numfmt --to=iec-i --suffix=B "$SIZE" 2>/dev/null || echo "${SIZE}B")
    echo "  $HR_SIZE  $(basename "$PATH")"
done
echo ""

# ─── 5. Vérification BDD vs Disque (si SQLite dispo) ────────
if [[ -f "$DB_PATH" ]] && command -v sqlite3 &>/dev/null; then
    echo "─── Cohérence BDD ↔ Disque ───"

    # Taille totale déclarée en BDD
    DB_TOTAL_SIZE=$(sqlite3 "$DB_PATH" "SELECT COALESCE(SUM(size), 0) FROM file WHERE is_folder = 0 AND is_trashed = 0;" 2>/dev/null || echo "0")
    DB_TOTAL_HR=$(numfmt --to=iec-i --suffix=B "$DB_TOTAL_SIZE" 2>/dev/null || echo "${DB_TOTAL_SIZE}B")

    # Taille réelle sur disque
    DISK_TOTAL_SIZE=$(du -sb "$MOUNT_POINT/files" 2>/dev/null | awk '{print $1}')
    DISK_TOTAL_HR=$(numfmt --to=iec-i --suffix=B "$DISK_TOTAL_SIZE" 2>/dev/null || echo "${DISK_TOTAL_SIZE}B")

    echo "  Taille déclarée (BDD)  : $DB_TOTAL_HR"
    echo "  Taille réelle (disque) : $DISK_TOTAL_HR"

    DIFF=$((DISK_TOTAL_SIZE - DB_TOTAL_SIZE))
    if [[ ${DIFF#-} -gt 104857600 ]]; then  # Écart > 100MB
        DIFF_HR=$(numfmt --to=iec-i --suffix=B "${DIFF#-}" 2>/dev/null)
        echo "  ⚠ ÉCART DÉTECTÉ : $DIFF_HR (fichiers orphelins probables)"
    else
        echo "  ✓ Cohérent (écart < 100MB)"
    fi

    # Nombre de fichiers en BDD vs sur disque
    DB_FILE_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM file WHERE is_folder = 0 AND is_trashed = 0;" 2>/dev/null || echo "?")
    echo ""
    echo "  Fichiers en BDD   : $DB_FILE_COUNT"
    echo "  Fichiers sur disque: $FILE_COUNT"
else
    echo "─── Vérification BDD ignorée (SQLite non trouvé) ───"
fi

echo ""
echo "=== Fin de l'audit ==="
```

---

### Intégration avec le docker-compose

Pour que le backend Flask puisse accéder au stockage provisionné, ajouter un volume mount dans le `docker-compose.yml` :

```yaml
version: "3.9"

services:
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: Backend-Flask
    expose:
      - "5000"
    volumes:
      - storage_data:/data/cloudspace          # Volume de stockage des fichiers
      - ./backend/instance:/app/instance       # BDD SQLite (si utilisée)
    environment:
      - UPLOAD_FOLDER=/data/cloudspace
      - DATABASE_URL=sqlite:///instance/cloudspace.db
    networks:
      - my-net

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
    container_name: Frontend-Vite
    ports:
      - "80:80"
    depends_on:
      - api
    networks:
      - my-net

volumes:
  storage_data:
    driver: local
    driver_opts:
      type: none
      device: /data/cloudspace      # Pointe vers le stockage provisionné par setup_storage.sh
      o: bind

networks:
  my-net:
```

**Si le stockage est sur le même disque que le système (pas de volume externe) :**

```yaml
volumes:
  storage_data:
    driver: local
    # Pas de driver_opts, Docker gère lui-même le volume dans /var/lib/docker/volumes/
```

---

### Récapitulatif des scripts

| Script | Quand l'utiliser | Exécuté sur |
|--------|-----------------|-------------|
| `setup_storage.sh` | Setup initial du VPS, une seule fois | VPS (root) |
| `aws_provision_storage.sh` | Créer un volume EBS sur AWS | Local ou VPS |
| `hetzner_provision_storage.sh` | Créer un volume sur Hetzner | Local ou VPS |
| `digitalocean_provision_storage.sh` | Créer un volume sur DigitalOcean | Local ou VPS |
| `generic_provision_storage.sh` | Identifier les disques disponibles | VPS |
| `backup_cloudspace.sh` | Backup quotidien (cron) | VPS |
| `expand_storage.sh` | Ajouter de l'espace sans downtime | VPS (root) |
| `audit_storage.sh` | Vérification d'intégrité périodique | VPS |
