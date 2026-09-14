# Product Requirements Document: Lenny Growth Assistant

## 1. User
Product managers, startup founders, growth operators, and anyone seeking structured advice on product strategy and growth grounded in real practitioner experience.

## 2. Problem
- High-quality product/growth knowledge is scattered across podcast episodes
- Manual transcript search is slow and inconsistent
- Generic chatbots hallucinate citations
- Insights are hard to turn into essays or strategy artifacts

## 3. Solution
A conversational AI assistant that ingests Lenny-style podcast transcripts, answers with citations, generates Ship 30 essays (~1,250 words), and renders Markdown/HTML artifacts in-app. Supports Ollama (default) and cloud LLMs via a unified abstraction.

## 4. Success Metrics
| Metric | Target |
|--------|--------|
| Grounded answers with sources or honest "insufficient evidence" | ≥90% |
| Fabricated transcript citations | 0 |
| Session context isolation | 100% |
| Ship 30 essay length | 1,100–1,350 words |
| Model switch without code change | Yes |
| Graceful Ollama failure | Error + fallback path |

## 5. Assumptions
- Sample transcript fixtures ship in `data/transcripts/` (clearly labeled)
- Ollama `llama3.2` is the default local model
- PostgreSQL + pgvector available via Docker Compose
- No auth for MVP (trusted local/demo environment)
- API keys provided by evaluator after implementation for cloud verification

## 6. Scope — In
Chat, sessions, RAG, sources, Ship 30 skill, artifact generation, artifact viewer, Ollama + Anthropic + OpenAI, Docker, tests, docs

## 7. Scope — Out
Auth, real-time collaboration, audio ingestion, fine-tuning, external export integrations

## 8. User Flows
1. **Ask question** → RAG retrieval → grounded answer + sources
2. **Ship 30 essay** → skill transforms context → artifact panel
3. **Strategy/HTML artifact** → sanitized render in viewer
4. **Switch model** → UI selector → backend router (no code change)

## 9. Acceptance Criteria
See README final checklist — all items must pass for completion.

## 10. Risks
| Risk | Mitigation |
|------|------------|
| Ollama offline | Demo fallback + cloud switch |
| HTML injection | Bleach + sandboxed iframe |
| Empty retrieval | Explicit insufficient-knowledge response |

## 11. Trade-offs
- Internal agent router vs heavy Agent SDK → lighter deps, documented in architecture.md
- Hash embeddings fallback → demo works without embed model
- Ollama on host (macOS) → better GPU perf vs all-in-docker

## 12. Implementation Plan
11 phases completed: docs → DB → LLM → RAG → agent → skills → UI → security → cloud → tests → verification
