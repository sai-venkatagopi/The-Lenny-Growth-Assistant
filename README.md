# Lenny Growth Assistant

A full-stack AI growth assistant grounded in Lenny-style transcript material and customer discovery signals. The app combines a FastAPI backend, PostgreSQL + pgvector, a React frontend, and optional local/cloud model providers to power grounded Q&A, artifact generation, and session-based workflows.


## Architecture Overview

The project is organized into a few core layers:

- Frontend: React + Vite + TypeScript + Tailwind UI for chat, sessions, sources, and artifact rendering
- Backend: FastAPI app with endpoints for chat, sessions, health, models, and artifact generation
- RAG pipeline: transcript ingestion, chunking, embedding, retrieval, and source-grounded answer generation
- Data layer: PostgreSQL with pgvector for session metadata and retrieved source vectors
- Model layer:
  - Local default: Ollama (`llama3.2` + embedding model)
  - Cloud providers: Anthropic and OpenAI
  - Demo fallback: seeded responses when a provider is unavailable or clearly invalid

### Primary directories

```text
backend/            FastAPI service, models, agents, RAG, LLM routing
frontend/           React app and UI components
data/transcripts/   Sample transcript source material
docs/               API and operational docs
agent-transcripts/  Design and workflow notes
```

---

## Prerequisites

Before running the app, install the following:

- Docker Desktop (required for PostgreSQL and the default full-stack startup)
- Python 3.11
- Node 18+
- npm
- [Ollama](https://ollama.com/download)

### Recommended model setup

Install the default local chat and embedding models:

```bash
ollama pull llama3.2
ollama pull nomic-embed-text
```

If you plan to use cloud providers, also make sure you have valid keys for Anthropic and/or OpenAI.

---

## Installation

### 1) Copy environment variables

```bash
cd /Users/mounigopi/Desktop/Lennyy
cp .env.example .env
```

The project reads environment values from the root `.env` file by default.

### 2) Install dependencies

#### Backend

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

#### Frontend

```bash
cd frontend
npm install
```

### 3) Start PostgreSQL

The recommended startup route uses Docker Compose:

```bash
docker compose up postgres -d
```

If you want the full stack with backend + frontend in one command, continue with the quick start below.

---

## Environment Variables

The project uses values from the root `.env` file. See `.env.example` for the exact defaults.

| Variable | Default | Description |
|---|---|---|
| DATABASE_URL | `postgresql+asyncpg://postgres:postgres@localhost:5432/lenny_growth` | PostgreSQL connection string |
| MODEL_PROVIDER | `ollama` | `ollama`, `anthropic`, `openai`, or `demo` |
| OLLAMA_BASE_URL | `http://localhost:11434` | Ollama API URL |
| OLLAMA_MODEL | `llama3.2` | Local chat model |
| OLLAMA_EMBED_MODEL | `nomic-embed-text` | Local embedding model |
| CLOUD_PROVIDER | `anthropic` | Preferred cloud provider |
| ANTHROPIC_API_KEY | empty | Anthropic API key |
| ANTHROPIC_MODEL | `claude-3-5-haiku-20241022` | Anthropic chat model |
| OPENAI_API_KEY | empty | OpenAI API key |
| OPENAI_MODEL | `gpt-4o-mini` | OpenAI chat model |
| EMBEDDINGS_PROVIDER | `ollama` | Embedding provider: `ollama`, `openai`, or `hash` |
| DEMO_FALLBACK_ENABLED | `true` | Enable seeded demo responses when the model is unavailable |
| BACKEND_PORT | `8000` | FastAPI backend port |
| FRONTEND_PORT | `5173` | Vite frontend port |
| CORS_ORIGINS | `http://localhost:5173,http://localhost:3000` | Frontend CORS allowlist |
| RAG_TOP_K | `5` | Number of chunks to retrieve |
| RAG_MIN_RELEVANCE | `0.15` | Minimum retrieval similarity threshold |
| EMBEDDING_DIMENSION | `768` | Vector size used for embeddings |
| LLM_TIMEOUT_SECONDS | `120` | Model timeout in seconds |
| RAG_TIMEOUT_SECONDS | `30` | RAG pipeline timeout |
| LOG_LEVEL | `INFO` | Application log level |

---

## Local Model Setup

The default path is local Ollama; this is the recommended mode for development.

### Start Ollama

```bash
ollama serve
```

Verify it is reachable:

```bash
curl http://localhost:11434/api/tags
```

If the models are missing, pull them:

```bash
ollama pull llama3.2
ollama pull nomic-embed-text
```

### Use local model in the app

Set this in `.env`:

```env
MODEL_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
EMBEDDINGS_PROVIDER=ollama
```

Then restart the backend.

---

## Cloud Model Setup

You can switch the app to Anthropic or OpenAI using the environment settings or the UI model selector.

### Anthropic

```env
MODEL_PROVIDER=anthropic
CLOUD_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_key_here
ANTHROPIC_MODEL=claude-3-5-haiku-20241022
```

### OpenAI

```env
MODEL_PROVIDER=openai
CLOUD_PROVIDER=openai
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

### UI switching

The app also includes a model selector in the top-right header. Switching models in the UI changes the active provider for subsequent requests.

> Note: if a cloud key is invalid or expired, the backend may fail. In those cases, check the key, billing status, and model availability before retrying.

---

## Running the Project

### One-command startup (recommended)

```bash
cd /Users/mounigopi/Desktop/Lennyy
./start.sh
```

This command will:

- create `.env` if needed
- start PostgreSQL via Docker
- create the backend virtual environment if missing
- install backend dependencies
- run migrations
- ingest transcripts
- install frontend dependencies if needed
- start the backend and frontend

Open the app here:

- Frontend: http://localhost:5173
- API docs: http://localhost:8000/docs

### Manual startup

#### Start backend only

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Start frontend only

```bash
cd frontend
npm run dev -- --host 0.0.0.0
```

#### Start everything with Make

```bash
make start
```

---

## Ingestion / RAG Setup

The app relies on transcript data stored in `data/transcripts/*.md`.

Run ingestion like this:

```bash
make ingest
```

This will:

- read transcript files
- split them into chunks
- create embeddings
- store them in PostgreSQL via pgvector

If retrieval is empty or unexpectedly weak, rerun ingestion after verifying the transcript directory content.

---

## Testing

### Backend tests

```bash
make test-backend
```

or:

```bash
cd backend
source .venv/bin/activate
pytest -v
```

### Frontend tests

```bash
make test-frontend
```

or:

```bash
cd frontend
npm run test
```

### Full test suite

```bash
make test
```

---

## Manual UI Test Plan

1. Open the app and create a new session.
2. Ask a grounded question such as: “What makes an activation loop durable?”
3. Verify the response includes source citations and retrieval references.
4. Trigger a generated artifact such as the Ship 30 flow.
5. Switch providers from the model selector and verify the next message uses the selected path.
6. Disable Ollama or use invalid credentials and verify the app responds clearly instead of failing silently.
7. Create multiple sessions and confirm they remain isolated.

---

## Troubleshooting

### Ollama is not reachable

```bash
ollama serve
curl http://localhost:11434/api/tags
```

If the model is missing:

```bash
ollama pull llama3.2
ollama pull nomic-embed-text
```

### PostgreSQL connection errors

Check the database is running:

```bash
docker compose up postgres -d
docker compose ps
```

Then confirm `.env` contains the expected URL:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/lenny_growth
```

### Empty retrieval or missing sources

```bash
make ingest
```

Then verify transcript files exist under `data/transcripts/`.

### Backend startup fails

```bash
cd backend
source .venv/bin/activate
python -m app.main
```

Check:

- correct Python version (3.11)
- backend dependencies installed
- `.env` file exists
- database is reachable

### Cloud provider 503 / auth issues

Common causes:

- invalid API key
- expired or no credits remaining
- model not enabled on the account
- provider outage or temporary throttling

Verify with the provider dashboard and retry with a valid key after ensuring billing and permissions are active.

---

## Security Notes

- API keys are kept in backend environment settings, not in the frontend bundle.
- Artifact rendering is sanitized before display.
- Secrets should never be committed into the repository or logs.

---

## License

This project is intended for education and demo usage. Lenny podcast content and related materials remain the property of their respective owners.

# The-Lenny-Growth-Assistant
