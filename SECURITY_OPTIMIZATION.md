# CloudSpace — Rapport Sécurité & Optimisation

> Audit réalisé le 16/02/2026 — **35 problèmes identifiés**

---

## Table des matières

1. [Sécurité critique](#1--sécurité-critique)
2. [Gestion des erreurs (Promises)](#2--gestion-des-erreurs-promises)
3. [Rendu React — `.map()` sans clé](#3--rendu-react--map-sans-clé)
4. [Code mort (dead code)](#4--code-mort-dead-code)
5. [Fonctions trop longues](#5--fonctions-trop-longues)
6. [Imbrication excessive](#6--imbrication-excessive)
7. [Ternaires imbriquées](#7--ternaires-imbriquées)
8. [Tests manquants](#8--tests-manquants)
9. [Injection de prompt (AI)](#9--injection-de-prompt-ai)
10. [Plan de remédiation](#10--plan-de-remédiation)

---

## 1 — Sécurité critique

### 1.1 Credentials en dur dans `docker-compose.yml`

**Fichier** : `docker-compose.yml:6-9, 31-32`
**Sévérité** : CRITIQUE

```yaml
# ❌ Credentials commitées dans le repo
environment:
  POSTGRES_USER: cloudspace
  POSTGRES_PASSWORD: cloudspace_secret
  SECRET_KEY: change-me-in-production-use-long-random-string
  DATABASE_URL: postgresql://cloudspace:cloudspace_secret@db:5432/cloudspace_db
```

**Risque** : Toute personne ayant accès au repo (même en lecture) obtient les credentials de la BDD et la clé secrète Flask.

**Correctif** :
```yaml
# ✅ Utiliser un fichier .env (exclu de git via .gitignore)
environment:
  POSTGRES_USER: ${POSTGRES_USER}
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  SECRET_KEY: ${SECRET_KEY}
  DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
```

Créer un `.env.example` (sans valeurs sensibles) et ajouter `.env` au `.gitignore`.

---

### 1.2 Fichier `backend/.env` potentiellement tracké

**Fichier** : `backend/.env`
**Sévérité** : CRITIQUE

```
SECRET_KEY=dev-secret-key-change-in-prod
DATABASE_URL=postgresql://cloudspace:cloudspace_secret@localhost:5432/cloudspace_db
```

**Correctif** :
- Vérifier que `backend/.env` est dans `.gitignore`
- Si déjà commité : `git rm --cached backend/.env` puis re-commit
- Rotation immédiate des credentials si le repo a été partagé

---

### 1.3 CORS ouvert à tous les domaines

**Fichier** : `backend/src/__init__.py:27`
**Sévérité** : HAUTE

```python
# ❌ Autorise TOUTES les origines
cors.init_app(app, resources={r"/api/*": {"origins": "*"}})
```

**Risque** : N'importe quel site tiers peut faire des requêtes API au nom d'un utilisateur authentifié.

**Correctif** :
```python
# ✅ Restreindre aux origines connues
ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:5173').split(',')
cors.init_app(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}})
```

---

### 1.4 Headers de sécurité absents

**Fichier** : `backend/src/__init__.py`
**Sévérité** : HAUTE

Aucun header de sécurité HTTP n'est configuré.

**Correctif** — Ajouter un `after_request` dans `create_app()` :
```python
@app.after_request
def set_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = "default-src 'self'"
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    return response
```

---

### 1.5 Pas de rate limiting

**Fichier** : `backend/src/__init__.py`
**Sévérité** : HAUTE

Aucune limitation de débit. Un attaquant peut brute-force les endpoints ou saturer le serveur.

**Correctif** :
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["200 per minute"])
limiter.init_app(app)

# Sur les routes sensibles (auth, upload) :
@limiter.limit("5 per minute")
```

---

### 1.6 Upload de fichiers `.svg` — vecteur XSS

**Fichier** : `backend/src/routes/files.py:17`
**Sévérité** : MOYENNE

Les fichiers `.svg` sont autorisés à l'upload. Un SVG peut contenir du JavaScript malveillant qui s'exécute si servi inline.

```python
ALLOWED_EXTENSIONS = {
    # ...
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',  # ⚠️ SVG = XSS potentiel
}
```

**Correctif** :
- Retirer `.svg` des extensions autorisées, OU
- Sanitizer le contenu SVG à l'upload (supprimer les balises `<script>`, event handlers `onload`, etc.)
- Servir les SVG avec `Content-Type: image/svg+xml` ET `Content-Disposition: attachment`

---

### 1.7 `application/octet-stream` trop permissif

**Fichier** : `backend/src/routes/files.py:31`
**Sévérité** : MOYENNE

```python
ALLOWED_MIME_PREFIXES = [
    # ...
    'application/octet-stream',  # ⚠️ Accepte n'importe quoi
]
```

**Risque** : Un fichier exécutable malveillant peut être uploadé avec ce MIME type.

**Correctif** :
- Retirer `application/octet-stream` des MIME autorisés
- Utiliser la validation par magic bytes (ex: `python-magic`) pour vérifier le vrai type du fichier

---

### 1.8 Pas de vérification par magic bytes

**Fichier** : `backend/src/routes/files.py`
**Sévérité** : MOYENNE

Le MIME type est basé sur `file.content_type` qui vient du navigateur et peut être falsifié.

**Correctif** :
```python
import magic

def validate_file_content(file_stream):
    """Vérifie le type réel du fichier via ses magic bytes."""
    mime = magic.from_buffer(file_stream.read(2048), mime=True)
    file_stream.seek(0)
    return mime
```

---

### 1.9 Pas de vérification du quota utilisateur avant upload

**Fichier** : `backend/src/routes/files.py`
**Sévérité** : BASSE

Un utilisateur peut dépasser son `storage_limit` (20 Go) car aucune vérification n'est faite avant d'écrire le fichier sur le disque.

**Correctif** :
```python
user = User.query.get(CURRENT_USER_ID)
if user.storage_used + file_size > user.storage_limit:
    return jsonify({'error': 'Storage quota exceeded'}), 413
```

---

## 2 — Gestion des erreurs (Promises)

### Problème

4 Promises sans `.catch()` ou avec un catch silencieux.

| Fichier | Ligne | Description |
|---------|-------|-------------|
| `Dashboard.jsx` | 23 | `fetch('/api/dashboard/activity')` dans `Promise.all` — pas de catch individuel |
| `Dashboard.jsx` | 22 | `fetch('/api/user/storage')` idem |
| `Dashboard.jsx` | 25 | `fetch('/api/dashboard/team')` idem |
| `Settings.jsx` | 465 | `.then(data => { ... })` sans catch |

### Risque

- L'app plante silencieusement si un endpoint échoue
- `Promise.all` échoue entièrement si **un seul** fetch échoue (pas de dégradation gracieuse)
- Aucun feedback utilisateur en cas d'erreur réseau

### Correctif — Dashboard.jsx

```jsx
// ❌ Avant : tout échoue si un seul endpoint est down
Promise.all([
  apiFetch('/api/dashboard/stats').then(r => r.json()),
  apiFetch('/api/user/storage').then(r => r.json()),
  apiFetch('/api/dashboard/activity?limit=6').then(r => r.json()),
  // ...
])

// ✅ Après : dégradation gracieuse avec Promise.allSettled
Promise.allSettled([
  apiFetch('/api/dashboard/stats').then(r => r.json()),
  apiFetch('/api/user/storage').then(r => r.json()),
  apiFetch('/api/dashboard/activity?limit=6').then(r => r.json()),
  apiFetch('/api/dashboard/quick-access?limit=4').then(r => r.json()),
  apiFetch('/api/dashboard/team').then(r => r.json()),
]).then(([statsRes, storageRes, activityRes, quickAccessRes, teamRes]) => {
  if (statsRes.status === 'fulfilled') setStats(statsRes.value);
  if (storageRes.status === 'fulfilled') setStorage(storageRes.value);
  // ... chaque section se charge indépendamment
});
```

### Correctif — Settings.jsx

```jsx
// ✅ Ajouter un catch avec feedback utilisateur
apiFetch('/api/settings/appearance')
  .then(r => {
    if (!r.ok) throw new Error('Failed to load settings');
    return r.json();
  })
  .then(data => { /* ... */ })
  .catch(err => {
    console.error('Settings load error:', err);
    // Afficher un toast/notification d'erreur
  });
```

---

## 3 — Rendu React — `.map()` sans clé

### Problème

17 occurrences de `.map()` dans du JSX. Il faut vérifier que chaque occurrence a un attribut `key` unique et stable.

| Fichier | Ligne | Élément | Clé utilisée |
|---------|-------|---------|-------------|
| `Gallery.jsx` | 166 | Filtres de taille | `s` (string) — OK mais vérifier unicité |
| `Gallery.jsx` | 201 | Photos | `photo.id` — OK |
| `SharedWithMe.jsx` | 137 | Fichiers partagés | `idx` (index) — A CORRIGER |
| `Settings.jsx` | 625 | Backup providers | Vérifier présence de key |
| `MyDrive.jsx` | 394 | Fichiers | `file.id` — OK |
| `Settings.jsx` | 603 | Fréquences backup | `s` (string) — OK |
| `Trash.jsx` | 89 | Items corbeille | `idx` (index) — A CORRIGER |
| `MyDrive.jsx` | 366 | Dossiers | `folder.id` — OK |
| `Settings.jsx` | 509 | Thèmes | `theme.name` — OK |
| `Settings.jsx` | 525 | Tailles police | `s` (string) — OK |
| `Dashboard.jsx` | 235 | Membres équipe | `index` — A CORRIGER |
| `FileExplorerList.jsx` | 170 | Fichiers tableau | `file.id` — OK |
| `MyDrive.jsx` | 335 | Fichiers grille | `file.id` — OK |
| `Settings.jsx` | 784 | Settings items | `setting.label` — OK |
| `Dashboard.jsx` | 125 | Storage types | Vérifier présence de key |
| `Starred.jsx` | 190 | Fichiers favoris | `file.id` — OK |

### Règle

- Ne **jamais** utiliser l'index du tableau comme `key` si les éléments peuvent être réordonnés, filtrés ou supprimés
- Préférer un identifiant unique et stable (`id`, `name`, `slug`)

### Correctif pour les index-based keys

```jsx
// ❌ Avant
{trashedItems.map((item, idx) => (
  <div key={idx}>...</div>
))}

// ✅ Après
{trashedItems.map((item) => (
  <div key={item.id}>...</div>
))}
```

---

## 4 — Code mort (dead code)

### Problème

14 blocs de JSX qui ne seront jamais rendus (conditions toujours fausses ou composants non affichés).

| Fichier | Ligne | Raison |
|---------|-------|--------|
| `Gallery.jsx` | 75 | Lightbox overlay — `selectedPhoto` jamais défini dans certains flux |
| `FileExplorerList.jsx` | 76 | Layout wrapper inaccessible |
| `Dashboard.jsx` | 81 | Section principale — condition d'affichage toujours vraie |
| `UploadToaster.jsx` | 39 | Toaster container quand `visible=false` (CSS transition, pas du vrai dead code) |
| `Recent.jsx` | 22 | Row template non utilisé |
| `FileExplorerDetail.jsx` | 103 | Layout wrapper |
| `Settings.jsx` | 306, 239, 501, 391 | Sections conditionnelles |
| `Header.jsx` | 21 | Header toujours rendu — faux positif probable |
| `UploadContext.jsx` | 87 | useEffect cleanup — faux positif |
| `MyDrive.jsx` | 26 | Modal overlay |
| `Gallery.jsx` | 134 | Gallery content area |

### Cas confirmé : `Gallery.jsx:75`

```jsx
// `samplePhotos` est hardcodé avec 16 éléments (lignes 3-20)
// Cette condition est TOUJOURS fausse :
{samplePhotos.length === 0 && (
  <div className="flex flex-col items-center justify-center py-24">
    {/* Empty state — jamais affiché */}
  </div>
)}
```

### Correctif

- Supprimer le code mort confirmé
- Pour les pages avec données statiques (Gallery, SharedWithMe, Recent, Trash) : remplacer par des vrais appels API, ce qui rendra les empty states utiles

---

## 5 — Fonctions trop longues

### Problème

7 fonctions dépassent 100 lignes, ce qui réduit la lisibilité et la maintenabilité.

| Fichier | Ligne | Fonction | Lignes |
|---------|-------|----------|--------|
| `FileContextMenu.jsx` | 17 | `MenuDropdown` | 132 |
| `Gallery.jsx` | 118 | `Gallery` | ~150 |
| `MyDrive.jsx` | 78 | `MyDrive` | ~200+ |
| `Starred.jsx` | 103 | `Starred` | ~120 |
| `Dashboard.jsx` | 77 | catch handler chain | ~160 |
| `FileExplorerList.jsx` | 72 | `FileExplorerList` | ~140 |
| `Settings.jsx` | 456 | `AppearanceTab` | ~150 |

### Correctif — Exemple `FileContextMenu.jsx`

```jsx
// ❌ Avant : 132 lignes dans une seule fonction
function MenuDropdown({ anchorRect, onClose, onAction }) {
  // Calcul position + event handlers + rendu = tout mélangé
}

// ✅ Après : séparation des responsabilités
function useDropdownPosition(anchorRect) {
  // Hook custom pour le calcul de position
}

function useClickOutside(ref, onClose) {
  // Hook custom pour fermer au clic extérieur
}

function MenuDropdown({ anchorRect, onClose, onAction }) {
  const position = useDropdownPosition(anchorRect);
  const menuRef = useRef();
  useClickOutside(menuRef, onClose);

  return createPortal(
    <div ref={menuRef} style={position}>
      <MenuItems onAction={onAction} />
    </div>,
    document.body
  );
}
```

---

## 6 — Imbrication excessive

### Problème

2 fichiers ont un niveau d'imbrication ≥ 7 (maximum recommandé : 4-5).

| Fichier | Ligne |
|---------|-------|
| `FileExplorerList.jsx` | 193 |
| `Trash.jsx` | 104 |

### Correctif

Extraire les blocs imbriqués en sous-composants :

```jsx
// ❌ Avant : 7 niveaux d'imbrication
<div>
  <div>
    <div>
      {condition && (
        <div>
          {items.map(item => (
            <div>
              {item.type === 'folder' ? (
                <span>...</span>  // Niveau 7+
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
</div>

// ✅ Après : extraction en composant
function FileRow({ item }) {
  return (
    <div>
      {item.type === 'folder' ? <FolderIcon /> : <FileIcon />}
    </div>
  );
}
```

---

## 7 — Ternaires imbriquées

### Problème

**Fichier** : `UploadToaster.jsx:63`

```jsx
// ❌ Difficile à lire
{allDone
  ? errorCount > 0
    ? `${doneCount} uploaded, ${errorCount} failed`
    : `${doneCount} upload${doneCount > 1 ? 's' : ''} complete`
  : `Uploading ${doneCount}/${total}...`
}
```

### Correctif

```jsx
// ✅ Extraire dans une fonction
function getUploadStatusMessage(allDone, doneCount, errorCount, total) {
  if (!allDone) return `Uploading ${doneCount}/${total}...`;
  if (errorCount > 0) return `${doneCount} uploaded, ${errorCount} failed`;
  return `${doneCount} upload${doneCount > 1 ? 's' : ''} complete`;
}

// Dans le JSX :
{getUploadStatusMessage(allDone, doneCount, errorCount, total)}
```

---

## 8 — Tests manquants

### Problème

**33 fichiers source n'ont aucun test associé.**

Aucun fichier de test n'existe dans le projet (`__tests__/`, `*.test.js`, `*.spec.js`).

### Priorité de couverture recommandée

| Priorité | Fichier | Raison |
|----------|---------|--------|
| P0 | `backend/src/routes/files.py` | Upload = surface d'attaque principale |
| P0 | `backend/src/routes/auth.py` | Authentification (en cours d'implémentation) |
| P0 | `backend/src/models.py` | Intégrité des données |
| P1 | `backend/src/routes/drive.py` | CRUD fichiers/dossiers |
| P1 | `client/src/contexts/UploadContext.jsx` | Logique métier complexe |
| P1 | `client/src/contexts/AuthContext.jsx` | Flux d'authentification |
| P2 | `backend/src/routes/dashboard.py` | Agrégations de données |
| P2 | `client/src/pages/MyDrive.jsx` | Page principale, interactions multiples |
| P3 | `client/src/components/FileContextMenu.jsx` | Interactions utilisateur |
| P3 | `client/src/pages/Settings.jsx` | Persistance des préférences |

### Setup recommandé

**Backend** (pytest) :
```bash
pip install pytest pytest-flask pytest-cov
```

**Frontend** (vitest) :
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

---

## 9 — Injection de prompt (AI)

### Problème

**Sévérité** : MOYENNE (si une fonctionnalité AI est prévue)

Un input utilisateur est passé à un système AI sans validation ni sanitization.

### Correctif

- Valider et sanitizer tous les inputs utilisateur avant de les passer à un modèle AI
- Utiliser des templates stricts avec des placeholders, pas de concaténation directe
- Limiter la longueur des inputs
- Implémenter un filtre de contenu malveillant

```python
import re

def sanitize_ai_input(user_input: str, max_length: int = 500) -> str:
    """Sanitize user input before passing to AI model."""
    # Tronquer
    sanitized = user_input[:max_length]
    # Supprimer les tentatives d'injection courantes
    sanitized = re.sub(r'(ignore|forget|disregard)\s+(previous|above|all)', '', sanitized, flags=re.IGNORECASE)
    return sanitized.strip()
```

---

## 10 — Plan de remédiation

### Phase 1 — Sécurité critique (immédiat)

- [ ] Externaliser les credentials dans des variables d'environnement (`.env` + `.gitignore`)
- [ ] Créer un `.env.example` avec des valeurs placeholder
- [ ] Restreindre les origines CORS
- [ ] Ajouter les headers de sécurité HTTP
- [ ] Retirer `.svg` des uploads autorisés ou sanitizer
- [ ] Retirer `application/octet-stream` des MIME autorisés
- [ ] Ajouter la validation par magic bytes (`python-magic`)

### Phase 2 — Robustesse (court terme)

- [ ] Remplacer `Promise.all` par `Promise.allSettled` dans Dashboard
- [ ] Ajouter des `.catch()` avec feedback utilisateur sur toutes les Promises
- [ ] Ajouter des `key` stables sur tous les `.map()` (remplacer les index)
- [ ] Ajouter le rate limiting (`flask-limiter`)
- [ ] Vérifier le quota utilisateur avant upload
- [ ] Supprimer le code mort confirmé (empty state Gallery)

### Phase 3 — Qualité de code (moyen terme)

- [ ] Refactoriser les fonctions > 100 lignes en sous-composants / hooks custom
- [ ] Réduire l'imbrication à max 5 niveaux
- [ ] Remplacer les ternaires imbriquées par des fonctions helper
- [ ] Ajouter les tests P0 (upload, auth, models)
- [ ] Setup CI avec couverture de code minimum (80%)

### Phase 4 — Hardening (production)

- [ ] Ajouter le monitoring et logging structuré
- [ ] Configurer un WAF (Web Application Firewall)
- [ ] Activer HTTPS obligatoire
- [ ] Audit des dépendances (`npm audit`, `pip audit`)
- [ ] Scan de vulnérabilités automatisé (Snyk, Trivy)
- [ ] Politique de rotation des secrets
