import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import type { SessionSummary } from "../types/chat";

export function useSessions() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const list = await api.listSessions();
    setSessions(list);
  }, []);

  const createSession = useCallback(async () => {
    const session = await api.createSession();
    setActiveId(session.id);
    await refresh();
    return session.id;
  }, [refresh]);

  const selectSession = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const deleteSession = useCallback(
    async (id: string) => {
      await api.deleteSession(id);
      const list = await api.listSessions();
      setSessions(list);
      if (activeId === id) {
        if (list.length > 0) {
          setActiveId(list[0].id);
        } else {
          const newSess = await api.createSession();
          setActiveId(newSess.id);
          await refresh();
        }
      }
    },
    [activeId, refresh]
  );

  useEffect(() => {
    (async () => {
      try {
        const list = await api.listSessions();
        setSessions(list);
        if (list.length > 0) {
          setActiveId(list[0].id);
        } else {
          const session = await api.createSession();
          setActiveId(session.id);
          await refresh();
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  return {
    sessions,
    activeId,
    loading,
    refresh,
    createSession,
    selectSession,
    deleteSession,
    setActiveId,
  };
}
