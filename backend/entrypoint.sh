#!/bin/sh
set -e

echo "==> Running tests..."
python -m pytest tests/ -v
echo "==> Tests passed. Starting server..."

exec python3 app.py
