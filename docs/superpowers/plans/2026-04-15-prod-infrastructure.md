# Production Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre le backend production-ready dans Docker : Gunicorn, Alembic migrations, CSP corrigé, rate limiting login.

**Architecture:** Remplacer `python3 app.py` par Gunicorn dans `entrypoint.sh`, activer les migrations Alembic via `flask db upgrade` au démarrage, corriger les headers CSP pour autoriser les CDN, durcir le rate limiting sur `/api/auth/login`.

**Tech Stack:** Flask + Gunicorn, Flask-Migrate (Alembic), Flask-Limiter.

---

## File Map

- Modify: `backend/requirements.txt` — ajouter gunicorn
- Modify: `backend/entrypoint.sh` — remplacer python3 app.py par gunicorn + flask db upgrade
- Modify: `backend/src/__init__.py` — fix CSP headers + rate limit login
- Modify: `backend/src/routes/auth.py` — rate limit spécifique sur /login

---

## Task 1 — Gunicorn

**Files:**
- Modify: `backend/requirements.txt`
- Modify: `backend/entrypoint.sh`

- [ ] **Step 1 : Ajouter gunicorn aux dépendances**

Dans `backend/requirements.txt`, ajouter après `psycopg2-binary` :
```
gunicorn
```

- [ ] **Step 2 : Remplacer Flask dev server dans entrypoint.sh**

Remplacer l'intégralité de `backend/entrypoint.sh` par :
```sh
#!/bin/sh
set -e

echo "==> Running tests..."
python -m pytest tests/ -v
echo "==> Tests passed."

echo "==> Applying database migrations..."
flask db upgrade
echo "==> Migrations done. Starting server..."

exec gunicorn \
  --workers 4 \
  --threads 2 \
  --bind 0.0.0.0:5000 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile - \
  "src:create_app()"
```

- [ ] **Step 3 : Rebuild et vérifier que gunicorn démarre**

```bash
docker build -t my-drive-api ./backend
docker stop Backend-Flask && docker rm Backend-Flask
docker compose up -d api
sleep 8
docker compose logs api --tail=15
```

Attendu dans les logs : `Booting worker with pid` (pas `Debugger is active`).

- [ ] **Step 4 : Vérifier que l'API répond**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/dashboard/stats \
  -H "Authorization: Bearer $(curl -s -X POST http://localhost:8080/api/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"alex.davidson@cloudspace.com","password":"password123"}' \
    | python3 -c 'import sys,json; print(json.load(sys.stdin)[\"access_token\"])')"
```

Attendu : `200`

- [ ] **Step 5 : Commit**

```bash
git add backend/requirements.txt backend/entrypoint.sh
git commit -m "feat(infra): switch to gunicorn with 4 workers, run db migrations on startup"
```

---

## Task 2 — Alembic migrations (activer le vrai workflow)

**Files:**
- Modify: `backend/src/__init__.py`

Le problème : `db.create_all()` crée les tables mais ne gère pas les changements de schéma. `flask db upgrade` applique les migrations Alembic. La migration initiale doit être générée.

- [ ] **Step 1 : Générer la migration initiale dans le container**

```bash
# Entrer dans le container (avec l'ancienne image ou en local avec venv)
docker compose exec api flask db migrate -m "initial schema"
```

Si le container tourne déjà avec gunicorn (pas de shell flask), lancer en local :
```bash
cd backend
pip install -r requirements.txt
FLASK_APP=app.py DATABASE_URL=postgresql://cloudspace:VOTRE_PWD@localhost:5432/cloudspace_db \
  flask db migrate -m "initial schema"
```

Attendu : création de `backend/migrations/versions/<hash>_initial_schema.py`

- [ ] **Step 2 : Vérifier la migration générée**

Lire `backend/migrations/versions/<hash>_initial_schema.py` et vérifier que les tables `user`, `file`, `activity_log`, `shared_file`, `user_settings`, `token_blocklist` sont toutes présentes.

- [ ] **Step 3 : Supprimer db.create_all() du code de démarrage**

Dans `backend/src/__init__.py`, remplacer :
```python
    with app.app_context():
        from src.models import User, File, ActivityLog, UserSettings, TokenBlocklist, GitHubConnection  # noqa: F401
        db.create_all()
        from src.seed import seed_data
        seed_data()
```
par :
```python
    with app.app_context():
        from src.seed import seed_data
        seed_data()
```

`flask db upgrade` (appelé dans entrypoint.sh) se charge désormais de créer/migrer les tables.

- [ ] **Step 4 : Tester en rebuild**

```bash
docker build -t my-drive-api ./backend
docker stop Backend-Flask && docker rm Backend-Flask
docker compose up -d api
sleep 10
docker compose logs api --tail=20
```

Attendu : `Running upgrade  -> <hash>, initial schema` dans les logs, puis démarrage gunicorn.

- [ ] **Step 5 : Commit**

```bash
git add backend/migrations/ backend/src/__init__.py
git commit -m "feat(infra): enable alembic migrations, remove db.create_all()"
```

---

## Task 3 — Fix CSP + rate limiting login

**Files:**
- Modify: `backend/src/__init__.py`
- Modify: `backend/src/routes/auth.py`

- [ ] **Step 1 : Corriger la CSP dans __init__.py**

Lire `backend/src/__init__.py`. Dans la fonction `set_security_headers`, remplacer :
```python
response.headers['Content-Security-Policy'] = "default-src 'self'"
```
par :
```python
response.headers['Content-Security-Policy'] = (
    "default-src 'self'; "
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; "
    "font-src 'self' https://fonts.gstatic.com; "
    "img-src 'self' data: blob: https://i.pravatar.cc; "
    "script-src 'self' 'unsafe-inline'; "
    "connect-src 'self'"
)
```

- [ ] **Step 2 : Vérifier que les fonts s'affichent**

Ouvrir `http://localhost:8080` dans le navigateur. Les icônes Material Symbols doivent s'afficher (avant elles pouvaient être bloquées). Vérifier dans DevTools → Network → Fonts qu'il n'y a pas de requêtes bloquées.

- [ ] **Step 3 : Ajouter rate limiting strict sur /api/auth/login**

Lire `backend/src/routes/auth.py`. Ajouter l'import en tête de fichier :
```python
from src.extensions import limiter
```

Sur la route `login`, ajouter le décorateur avant `@auth_bp.route` :
```python
@limiter.limit("10 per minute; 50 per hour", key_func=lambda: request.remote_addr)
@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    ...
```

- [ ] **Step 4 : Vérifier que le rate limit fonctionne**

```bash
for i in $(seq 1 12); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}')
  echo "Request $i: $STATUS"
done
```

Attendu : les 10 premières retournent `401`, à partir de la 11e → `429 Too Many Requests`.

- [ ] **Step 5 : Rebuild et commit**

```bash
docker build -t my-drive-api ./backend
docker stop Backend-Flask && docker rm Backend-Flask
docker compose up -d api
git add backend/src/__init__.py backend/src/routes/auth.py
git commit -m "fix(security): fix CSP headers for CDN fonts, add strict rate limit on login"
```

---

## Task 4 — Retirer 2FA de l'UI (champ inexistant côté backend)

**Files:**
- Modify: `client/src/pages/Settings.jsx` (ou le composant qui affiche le toggle 2FA)

- [ ] **Step 1 : Localiser le toggle 2FA dans le frontend**

```bash
grep -r "two_factor\|2fa\|2FA\|twoFactor" client/src/ --include="*.jsx" --include="*.tsx" -l
```

- [ ] **Step 2 : Supprimer ou marquer "Prochainement"**

Pour chaque fichier trouvé, remplacer le toggle 2FA par un badge "Prochainement" :
```jsx
<div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg opacity-60">
  <div>
    <p className="text-sm font-medium text-slate-900 dark:text-white">Authentification à deux facteurs</p>
    <p className="text-xs text-slate-500 dark:text-slate-400">Bientôt disponible</p>
  </div>
  <span className="text-xs font-medium text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
    Prochainement
  </span>
</div>
```

- [ ] **Step 3 : Rebuild frontend et vérifier**

```bash
docker build -t my-drive-client ./client
docker stop Frontend-Vite && docker rm Frontend-Vite
docker compose up -d client
```

Vérifier dans Settings que le toggle 2FA est remplacé par le badge.

- [ ] **Step 4 : Commit**

```bash
git add client/src/pages/Settings.jsx
git commit -m "fix(ui): replace 2FA toggle with coming-soon badge"
```
