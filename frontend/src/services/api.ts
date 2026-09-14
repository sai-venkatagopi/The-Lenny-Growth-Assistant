import type {
  Artifact,
  ChatResponse,
  ModelOption,
  Session,
  SessionSummary,
} from "../types/chat";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    const err = data as { error?: { code: string; message: string }; detail?: unknown };
    const detail = err.error || (typeof err.detail === "object" ? err.detail : null);
    throw new Error(
      (detail as { message?: string })?.message || `Request failed: ${res.status}`
    );
  }
  return data as T;
}

export const api = {
  health: () => request<{ status: string }>("/api/health"),
  ollamaHealth: () => request<{ available: boolean; model_available?: boolean }>("/api/health/ollama"),

  listSessions: () => request<SessionSummary[]>("/api/sessions"),
  createSession: (title = "New conversation") =>
    request<Session>("/api/sessions", { method: "POST", body: JSON.stringify({ title }) }),
  getSession: (id: string) => request<Session>(`/api/sessions/${id}`),
  deleteSession: (id: string) => request<{ deleted: boolean }>(`/api/sessions/${id}`, { method: "DELETE" }),

  chat: (sessionId: string, message: string, action?: string) =>
    request<ChatResponse>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, message, action }),
    }),

  createArtifact: (sessionId: string, req: string, type = "markdown", skill?: string) =>
    request<Artifact>("/api/artifacts", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, request: req, type, skill }),
    }),

  getArtifact: (id: string) => request<Artifact>(`/api/artifacts/${id}`),

  listModels: () =>
    request<{ models: ModelOption[]; active: { provider: string; ollama_available: boolean } }>(
      "/api/models"
    ),
  switchModel: (provider: string, model?: string) =>
    request<{ provider: string; model: string; display: string }>("/api/models/active", {
      method: "PATCH",
      body: JSON.stringify({ provider, model }),
    }),
};
