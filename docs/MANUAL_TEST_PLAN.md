# Manual UI Test Plan

## Setup
1. Start Docker Desktop (or local PostgreSQL + pgvector)
2. `docker compose up --build` OR local dev per README
3. Ensure Ollama running with `llama3.2`

## Tests
| # | Step | Expected |
|---|------|----------|
| 1 | Open http://localhost:5173 | Growth Studio loads, sidebar + chat visible |
| 2 | Click suggested prompt | Grounded answer with sources |
| 3 | Check source cards | Title, snippet, relevance % |
| 4 | Click Ship 30 essay | Artifact panel shows markdown essay |
| 5 | Click HTML concept | Sanitized preview in iframe |
| 6 | New conversation | Empty chat, separate session |
| 7 | Switch to Demo model | Next answer labeled fallback |
| 8 | Switch to Ollama | Model indicator updates |
| 9 | Stop Ollama, send message | Error or demo fallback |
| 10 | Reload page, select old session | Messages persist |

## Cloud verification (after API keys provided)
- Set `ANTHROPIC_API_KEY` in `.env`, switch model in UI, send message
- Repeat with `OPENAI_API_KEY`
