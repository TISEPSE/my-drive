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
