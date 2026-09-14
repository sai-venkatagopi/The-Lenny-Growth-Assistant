# API Reference

Base URL: `http://localhost:8000`

## Health
- `GET /api/health` — service status
- `GET /api/health/ollama` — Ollama connectivity

## Sessions
- `POST /api/sessions` — `{ "title": "..." }`
- `GET /api/sessions` — list recent
- `GET /api/sessions/{id}` — session + messages
- `DELETE /api/sessions/{id}`

## Chat
- `POST /api/chat`
```json
{
  "session_id": "uuid",
  "message": "What makes an activation loop durable?",
  "action": null
}
```
Actions: `ship30` (optional)

Response includes `sources[]`, `model`, optional `artifact`.

## Artifacts
- `POST /api/artifacts` — `{ "session_id", "request", "type": "markdown|html", "skill": "ship30" }`
- `GET /api/artifacts/{id}`

## Models
- `GET /api/models`
- `PATCH /api/models/active` — `{ "provider": "ollama", "model": "llama3.2" }`

## Errors
```json
{ "error": { "code": "OLLAMA_UNAVAILABLE", "message": "..." } }
```
