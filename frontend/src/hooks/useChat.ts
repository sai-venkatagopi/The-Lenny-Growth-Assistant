import { useCallback, useState } from "react";
import { api } from "../services/api";
import type { Artifact, Message, SourceCitation } from "../types/chat";

export function useChat(sessionId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSources, setLastSources] = useState<SourceCitation[]>([]);
  const [lastModel, setLastModel] = useState<string>("");
  const [artifact, setArtifact] = useState<Artifact | null>(null);

  const loadSession = useCallback(async (id: string) => {
    const session = await api.getSession(id);
    setMessages(session.messages);
    const lastAssistant = [...session.messages].reverse().find((m) => m.role === "assistant");
    if (lastAssistant?.sources) setLastSources(lastAssistant.sources);
    if (lastAssistant?.model_used) setLastModel(lastAssistant.model_used);
  }, []);

  const sendMessage = useCallback(
    async (text: string, action?: string) => {
      if (!sessionId || !text.trim()) return;
      setLoading(true);
      setError(null);
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
      };
      setMessages((prev) => [...prev, userMsg]);
      try {
        const res = await api.chat(sessionId, text, action);
        const assistantMsg: Message = {
          id: res.id,
          role: "assistant",
          content: res.content,
          model_used: res.model,
          sources: res.sources,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setLastSources(res.sources);
        setLastModel(res.model);
        if (res.artifact) setArtifact(res.artifact);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  const retry = useCallback(
    async (failedUserText: string) => {
      setMessages((prev) => {
        const copy = [...prev];
        if (copy.length && copy[copy.length - 1].role === "user") copy.pop();
        return copy;
      });
      await sendMessage(failedUserText);
    },
    [sendMessage]
  );

  const clearArtifact = useCallback(() => setArtifact(null), []);

  return {
    messages,
    loading,
    error,
    lastSources,
    lastModel,
    artifact,
    loadSession,
    sendMessage,
    retry,
    clearArtifact,
    setArtifact,
    setMessages,
  };
}
