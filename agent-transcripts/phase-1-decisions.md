# Agent Transcript: Phase 1 Architecture Decisions

**Date**: 2026-03-23  
**Project**: Lenny Growth Assistant

## Decisions Made

### 1. Internal Agent Orchestrator (not Claude Agent SDK)
**Reason**: Avoid heavy SDK dependencies for forward-deployed MVP. Skills are isolated modules with Pydantic intent detection.

### 2. Demo Fallback Provider
**Reason**: User requested deterministic demo when Ollama/cloud unavailable. All fallback responses prefixed with `[DEMO/SEEDED FALLBACK]`.

### 3. Sample Transcript Fixtures
**Reason**: Real Lenny corpus not bundled; three clearly labeled synthetic fixtures in `data/transcripts/` enable immediate RAG demo.

### 4. Embedding Fallback Chain
Ollama nomic-embed-text → hash-based deterministic vectors. Ensures ingestion works without embed model.

### 5. PostgreSQL + pgvector
Full migration from any MongoDB skeleton; Alembic migration `001_initial_schema`.

### 6. Premium UI ("Growth Studio")
Teal/cream palette matching Emergent mockup; three-column layout with animated loading states.

## Failed Approaches
- None yet at Phase 1

## Trade-offs Accepted
- Hash embeddings less accurate than neural embeddings for retrieval quality in dev-without-Ollama scenarios
- SQLite tests use JSON column patch + Python cosine fallback instead of pgvector

## Secrets
No API keys stored in repository. User provides Anthropic/OpenAI keys post-implementation for live verification.
