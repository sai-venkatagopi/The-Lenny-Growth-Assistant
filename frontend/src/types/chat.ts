export interface SourceCitation {
  chunk_id?: string;
  title: string;
  url?: string | null;
  speaker?: string | null;
  snippet: string;
  relevance: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  model_used?: string | null;
  sources?: SourceCitation[] | null;
  created_at?: string;
}

export interface ChatResponse {
  id: string;
  session_id: string;
  role: string;
  content: string;
  sources: SourceCitation[];
  model: string;
  artifact?: Artifact | null;
}

export interface Artifact {
  id: string;
  type: "markdown" | "html";
  title: string;
  content: string;
  css?: string | null;
  created_at?: string;
}

export interface SessionSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface Session extends SessionSummary {
  messages: Message[];
}

export interface ModelOption {
  id: string;
  provider: string;
  model: string;
  label: string;
  is_default: boolean;
}

export interface ApiError {
  error: { code: string; message: string };
}
