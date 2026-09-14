.PHONY: help setup start run-backend run-frontend run-local ingest test test-backend test-frontend docker-up docker-down docker-build zip clean

PYTHON ?= python3.11
VENV = backend/.venv
PIP = $(VENV)/bin/pip
PY = $(VENV)/bin/python

help:
	@echo "Lenny Growth Assistant"
	@echo "  make start          One-command start (recommended)"
	@echo "  ./start.sh          Same as make start"
	@echo "  make setup          Install deps + migrate DB"
	@echo "  make docker-up      Start full Docker stack"
	@echo "  make ingest         Ingest transcripts"
	@echo "  make test           Run all tests"

setup:
	@test -f .env || cp .env.example .env
	@test -d $(VENV) || $(PYTHON) -m venv $(VENV)
	$(PIP) install -r backend/requirements.txt
	cd frontend && npm install
	docker compose up postgres -d
	@sleep 3
	cd backend && ../$(VENV)/bin/alembic upgrade head

start:
	@chmod +x start.sh && ./start.sh

docker-build:
	docker compose build

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down

ingest:
	cd backend && ../$(VENV)/bin/python -m app.rag.ingestion --transcripts-dir ../data/transcripts

run-backend:
	cd backend && ../$(VENV)/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

run-frontend:
	cd frontend && npm run dev

run-local: start

test-backend:
	cd backend && ../$(VENV)/bin/pytest -v

test-frontend:
	cd frontend && npm run test

test: test-backend test-frontend

zip:
	zip -r lenny-growth-assistant.zip . -x "*.git*" -x "node_modules/*" -x "backend/.venv/*" -x "frontend/node_modules/*" -x ".env" -x "*.zip"

clean:
	rm -rf backend/.pytest_cache backend/__pycache__ frontend/dist
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
