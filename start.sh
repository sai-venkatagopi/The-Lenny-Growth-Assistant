#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

PYTHON="${PYTHON:-python3.11}"
if ! command -v "$PYTHON" >/dev/null 2>&1; then
  PYTHON=python3
fi

echo "==> Lenny Growth Assistant — starting"

# .env
if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "    Created .env from .env.example"
fi

# Docker / Postgres
if ! docker info >/dev/null 2>&1; then
  echo "    Starting Docker Desktop..."
  open -a Docker 2>/dev/null || open -a "Docker Desktop" 2>/dev/null || true
  for _ in $(seq 1 40); do
    docker info >/dev/null 2>&1 && break
    sleep 2
  done
fi

if docker info >/dev/null 2>&1; then
  echo "    Starting PostgreSQL..."
  docker compose up postgres -d
  for _ in $(seq 1 30); do
    docker compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1 && break
    sleep 1
  done
else
  echo "ERROR: Docker is required for PostgreSQL. Start Docker Desktop and re-run ./start.sh"
  exit 1
fi

# Backend venv
if [[ ! -d backend/.venv ]]; then
  echo "    Creating Python virtualenv..."
  "$PYTHON" -m venv backend/.venv
fi

echo "    Installing backend dependencies..."
backend/.venv/bin/pip install -q -r backend/requirements.txt

echo "    Running migrations..."
(cd backend && ../backend/.venv/bin/alembic upgrade head)

echo "    Ingesting transcripts..."
(cd backend && ../backend/.venv/bin/python -m app.rag.ingestion --transcripts-dir ../data/transcripts)

# Frontend deps
if [[ ! -d frontend/node_modules ]]; then
  echo "    Installing frontend dependencies..."
  (cd frontend && npm install)
fi

# Free ports if stale processes from a previous run
if lsof -ti :8000 >/dev/null 2>&1; then
  echo "    Stopping stale backend on :8000..."
  lsof -ti :8000 | xargs kill -9 2>/dev/null || true
  sleep 1
fi
if lsof -ti :5173 >/dev/null 2>&1; then
  echo "    Stopping stale frontend on :5173..."
  lsof -ti :5173 | xargs kill -9 2>/dev/null || true
  sleep 1
fi

# Ollama check
if curl -sf http://localhost:11434/api/tags >/dev/null 2>&1; then
  echo "    Ollama: OK"
else
  echo "    WARNING: Ollama not reachable — start it or use cloud model in UI"
fi

echo "    Starting backend on http://localhost:8000 ..."
(cd backend && ../backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000) &
BACKEND_PID=$!

echo "    Starting frontend on http://localhost:5173 ..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

cleanup() {
  echo ""
  echo "==> Shutting down..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

sleep 3
if curl -sf http://localhost:8000/api/health >/dev/null; then
  echo ""
  echo "✅ Ready!"
  echo "   App:     http://localhost:5173"
  echo "   API:     http://localhost:8000/docs"
  echo "   Press Ctrl+C to stop"
else
  echo "ERROR: Backend failed to start. Check logs above."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  exit 1
fi

wait
