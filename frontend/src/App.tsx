import { Menu, Moon, Plus, Sun, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SplineSceneBasic } from "@/components/ui/demo";
import { ArtifactViewer } from "./components/ArtifactViewer/ArtifactViewer";
import { ChatInput } from "./components/Chat/ChatInput";
import { ChatMessages } from "./components/Chat/ChatMessages";
import { ModelSelector } from "./components/ModelSelector/ModelSelector";
import { SessionSidebar } from "./components/SessionSidebar/SessionSidebar";
import { SourceList } from "./components/SourceList/SourceList";
import { useChat } from "./hooks/useChat";
import { useResizablePanel } from "./hooks/useResizablePanel";
import { useSessions } from "./hooks/useSessions";
import { api } from "./services/api";

/** A vertical drag handle between two panels */
function ResizeHandle({
  onMouseDown,
  isDragging,
}: {
  onMouseDown: (e: React.MouseEvent) => void;
  isDragging: boolean;
}) {
  return (
    <div
      onMouseDown={onMouseDown}
      className={`group relative w-1.5 shrink-0 flex items-center justify-center cursor-col-resize select-none transition-colors duration-150 ${
        isDragging
          ? "bg-teal/40 dark:bg-emerald-500/40"
          : "bg-transparent hover:bg-teal/20 dark:hover:bg-emerald-500/20"
      }`}
      title="Drag to resize panel"
      aria-hidden="true"
    >
      {/* Visible dot-grip */}
      <div
        className={`w-0.5 h-12 rounded-full transition-all duration-150 ${
          isDragging
            ? "bg-teal dark:bg-emerald-400 scale-y-125"
            : "bg-black/15 dark:bg-white/15 group-hover:bg-teal/60 dark:group-hover:bg-emerald-400/60 group-hover:scale-y-110"
        }`}
      />
    </div>
  );
}

function RobotLogo({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-full bg-[#07080d] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] ${className}`}
      aria-label="Robot logo"
      role="img"
    >
      <div className="flex h-[58%] w-[58%] items-center justify-center rounded-[24%] bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]">
        <div className="flex w-[52%] items-center justify-between">
          <span className="h-2.5 w-2.5 rounded-full bg-[#07080d]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#07080d]" />
        </div>
      </div>
    </div>
  );
}

function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-[#050816] text-white overflow-y-auto">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10 lg:px-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RobotLogo className="h-10 w-10" />
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Growth Studio</div>
            </div>
          </div>
        </header>

        <main className="relative flex flex-1 items-center py-8">
          <div className="absolute inset-0 overflow-hidden rounded-[2rem] border border-white/10 bg-[#070b15] shadow-2xl shadow-emerald-500/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(45,212,191,0.2),transparent_25%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.18),transparent_30%),linear-gradient(135deg,#030712_0%,#0b1220_35%,#070b15_100%)]" />
            <div className="absolute inset-0 opacity-80">
              <SplineSceneBasic />
            </div>
          </div>

          <div className="relative z-10 mx-auto flex max-w-5xl w-full items-center justify-between gap-8 px-6 py-10 md:px-12">
            <div className="max-w-xl space-y-8">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-emerald-300 backdrop-blur-sm">
                AI-powered growth operating system
              </div>

              <div className="space-y-5">
                <h1 className="font-display text-5xl font-black tracking-tight text-white md:text-6xl">
                  The Lenny Growth Assistant
                </h1>
                <p className="text-lg text-slate-300 md:text-xl">
                  Turn raw customer signals into your next growth move. Research, synthesize, and act faster with a workflow built for discovery, strategy, and execution.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={onStart}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-teal-400 to-emerald-500 px-6 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition-transform hover:-translate-y-0.5"
                >
                  Start now
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [started, setStarted] = useState(false);

  const {
    sessions,
    activeId,
    createSession,
    selectSession,
    deleteSession,
    refresh,
    loading: sessionsLoading,
  } = useSessions();
  const chat = useChat(activeId);
  const [modelLabel, setModelLabel] = useState("Ollama — llama3.2");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"chat" | "artifact" | "sources">("chat");
  const [artifactLoading, setArtifactLoading] = useState(false);

  // ── Resizable panel widths ──────────────────────────────────────────────────
  const [sessionsWidth, sessionsDragging, sessionsHandleDown] = useResizablePanel({
    defaultWidth: 256,
    minWidth: 180,
    maxWidth: 420,
    storageKey: "panel_sessions_width",
    direction: "right",
  });
  const [artifactWidth, artifactDragging, artifactHandleDown] = useResizablePanel({
    defaultWidth: 400,
    minWidth: 280,
    maxWidth: 640,
    storageKey: "panel_artifact_width",
    direction: "left",
  });
  const [sourcesWidth, sourcesDragging, sourcesHandleDown] = useResizablePanel({
    defaultWidth: 320,
    minWidth: 200,
    maxWidth: 520,
    storageKey: "panel_sources_width",
    direction: "left",
  });

  // ── Panel visibility (persist) ──────────────────────────────────────────────
  const [sessionsPanelOpen, setSessionsPanelOpen] = useState<boolean>(
    () => localStorage.getItem("panel_sessions") !== "false"
  );
  const [artifactPanelOpen, setArtifactPanelOpen] = useState<boolean>(
    () => localStorage.getItem("panel_artifact") !== "false"
  );
  const [sourcesPanelOpen, setSourcesPanelOpen] = useState<boolean>(
    () => localStorage.getItem("panel_sources") !== "false"
  );

  const toggleSessions = () =>
    setSessionsPanelOpen((v) => { localStorage.setItem("panel_sessions", String(!v)); return !v; });
  const toggleArtifact = () =>
    setArtifactPanelOpen((v) => { localStorage.setItem("panel_artifact", String(!v)); return !v; });
  const toggleSources = () =>
    setSourcesPanelOpen((v) => { localStorage.setItem("panel_sources", String(!v)); return !v; });

  // ── Dark mode ───────────────────────────────────────────────────────────────
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    if (activeId) chat.loadSession(activeId);
  }, [activeId]);

  const handleNewSession = async () => {
    await createSession();
    chat.setMessages([]);
    chat.clearArtifact();
    setSidebarOpen(false);
    setMobilePanel("chat");
  };

  const handleSelectSession = async (id: string) => {
    selectSession(id);
    await chat.loadSession(id);
    setSidebarOpen(false);
    setMobilePanel("chat");
  };

  const handleDeleteSession = async (id: string) => {
    await deleteSession(id);
    if (activeId === id) {
      chat.setMessages([]);
      chat.clearArtifact();
    }
  };

  const handleSend = useCallback(
    async (text: string, action?: string) => {
      await chat.sendMessage(text, action);
      await refresh();
    },
    [chat, refresh]
  );

  const handleQuickAction = async (kind: string, prompt: string) => {
    if (!activeId) return;
    if (kind === "chat") { await handleSend(prompt); return; }
    setArtifactLoading(true);
    try {
      if (kind === "ship30") {
        await handleSend(prompt, "ship30");
      } else if (kind === "artifact-md") {
        chat.setArtifact(await api.createArtifact(activeId, prompt, "markdown"));
      } else if (kind === "artifact-html") {
        chat.setArtifact(await api.createArtifact(activeId, prompt, "html"));
      }
      setMobilePanel("artifact");
    } catch (e) {
      console.error(e);
    } finally {
      setArtifactLoading(false);
    }
  };

  if (!started) {
    return <LandingPage onStart={() => setStarted(true)} />;
  }

  if (sessionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream dark:bg-slateCustom-900">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#07080d] animate-pulse-soft shadow-premium">
            <RobotLogo className="h-8 w-8" />
          </div>
          <p className="text-sm font-medium text-ink-muted dark:text-slate-400">Loading Growth Studio…</p>
        </div>
      </div>
    );
  }

  // ── Panel collapse pill ─────────────────────────────────────────────────────
  const CollapsedStrip = ({
    label,
    onExpand,
    title,
    position,
  }: {
    label: string;
    onExpand: () => void;
    title: string;
    position: "left" | "right";
  }) => (
    <div
      className={`absolute top-1/2 -translate-y-1/2 ${
        position === "left" ? "left-0 rounded-r-xl border-r border-y" : "right-0 rounded-l-xl border-l border-y"
      } z-20 flex flex-col items-center py-3 gap-2 w-8 border-black/10 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md cursor-pointer hover:bg-teal-muted dark:hover:bg-emerald-900/60 transition-all shadow-md group`}
      onClick={onExpand}
      title={title}
      role="button"
      aria-label={title}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onExpand()}
    >
      <div className="w-5 h-5 rounded-md flex items-center justify-center transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal dark:text-emerald-400">
          {position === "left" ? (
            <polyline points="9 18 15 12 9 6" />
          ) : (
            <polyline points="15 18 9 12 15 6" />
          )}
        </svg>
      </div>
      <span
        className="text-[10px] font-semibold text-ink-muted dark:text-slate-400 uppercase tracking-widest mt-1"
        style={{ writingMode: "vertical-rl", transform: position === "left" ? "rotate(180deg)" : "rotate(180deg)" }}
      >
        {label}
      </span>
    </div>
  );

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-cream dark:bg-slateCustom-900 text-ink dark:text-slate-100 transition-colors duration-200">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-black/10 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-2.5 flex items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-2.5">
          {/* Mobile hamburger */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-xl text-ink dark:text-slate-200 hover:bg-cream-dark dark:hover:bg-slate-800 transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex h-8 w-8 items-center justify-center">
              <RobotLogo className="h-8 w-8" />
            </div>
            <h1 className="font-display font-bold text-lg text-ink dark:text-slate-100 tracking-tight">
              Growth <span className="text-teal dark:text-emerald-400 font-semibold">Studio</span>
            </h1>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStarted(false)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-sm font-medium text-ink dark:text-slate-200 hover:bg-cream dark:hover:bg-slate-700 transition-all"
            aria-label="Back to landing page"
            title="Back to landing page"
          >
            ← Back
          </button>

          <ModelSelector onModelChange={setModelLabel} />

          {/* Dark mode */}
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl border border-black/10 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-ink-muted dark:text-slate-300 hover:text-teal dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"
            aria-label="Toggle theme"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
          </button>

          <button
            type="button"
            onClick={handleNewSession}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal dark:bg-emerald-600 text-white text-sm font-semibold hover:bg-teal-light dark:hover:bg-emerald-500 transition-all shadow-sm active:scale-95"
          >
            <Plus size={15} /> New Chat
          </button>
        </div>
      </header>

      {/* ── Main Workspace ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Sessions Panel ── */}
        {sessionsPanelOpen ? (
          <>
            <div
              className={`hidden lg:flex flex-col h-full shrink-0 transition-none`}
              style={{ width: sessionsWidth }}
            >
              <SessionSidebar
                sessions={sessions}
                activeId={activeId}
                onNew={handleNewSession}
                onSelect={handleSelectSession}
                onDelete={handleDeleteSession}
                onCollapse={toggleSessions}
              />
            </div>
            {/* Sessions ↔ Chat drag handle */}
            <ResizeHandle onMouseDown={sessionsHandleDown} isDragging={sessionsDragging} />
          </>
        ) : (
          <div className="hidden lg:block">
            <CollapsedStrip label="Sessions" onExpand={toggleSessions} title="Show Recent Sessions" position="left" />
          </div>
        )}

        {/* Mobile sessions overlay */}
        {sidebarOpen && (
          <>
            <div className="lg:hidden fixed inset-y-0 left-0 top-[57px] z-30 w-72 h-full">
              <SessionSidebar
                sessions={sessions}
                activeId={activeId}
                onNew={handleNewSession}
                onSelect={handleSelectSession}
                onDelete={handleDeleteSession}
                onCollapse={toggleSessions}
              />
            </div>
            <button
              type="button"
              className="lg:hidden fixed inset-0 top-[57px] bg-black/40 backdrop-blur-sm z-20"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar overlay"
            />
          </>
        )}

        {/* ── Center Chat ── */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          {/* Mobile tab bar + model status */}
          <div className="px-4 py-1.5 border-b border-black/5 dark:border-slate-800 bg-teal-muted/40 dark:bg-emerald-950/20 text-xs text-teal dark:text-emerald-400 flex items-center justify-between font-medium">
            <span className="truncate text-[11px]">Engine: {modelLabel}</span>
            <div className="lg:hidden flex gap-1 bg-white/70 dark:bg-slate-800/80 p-0.5 rounded-lg border border-black/5 dark:border-slate-700">
              {(["chat", "artifact", "sources"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setMobilePanel(p)}
                  className={`px-2 py-1 rounded-md text-[11px] capitalize transition-all font-semibold ${
                    mobilePanel === p
                      ? "bg-teal dark:bg-emerald-600 text-white shadow-sm"
                      : "text-ink-muted dark:text-slate-400"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Chat view */}
          <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${mobilePanel !== "chat" ? "hidden lg:flex" : "flex"}`}>
            <ChatMessages
              messages={chat.messages}
              loading={chat.loading}
              error={chat.error}
              onRetry={chat.retry}
              onQuickAction={handleQuickAction}
            />
            <ChatInput onSend={(t) => handleSend(t)} loading={chat.loading} disabled={!activeId} />
          </div>

          {/* Mobile Sources tab */}
          <div className={`lg:hidden flex-1 overflow-y-auto p-4 ${mobilePanel === "sources" ? "block" : "hidden"}`}>
            <SourceList sources={chat.lastSources} />
          </div>
        </main>

        {/* ── Artifact Canvas Panel ── */}
        {artifactPanelOpen ? (
          <>
            {/* Chat ↔ Artifact drag handle */}
            <ResizeHandle onMouseDown={artifactHandleDown} isDragging={artifactDragging} />
            <div
              className={`${mobilePanel === "artifact" ? "flex" : "hidden"} lg:flex flex-col h-full shrink-0`}
              style={{ width: artifactWidth }}
            >
              <ArtifactViewer
                artifact={chat.artifact}
                loading={artifactLoading}
                onClear={chat.clearArtifact}
                onCollapse={toggleArtifact}
              />
            </div>
          </>
        ) : (
          <div className="hidden lg:block">
            <CollapsedStrip label="Artifact" onExpand={toggleArtifact} title="Show Artifact Canvas" position="right" />
          </div>
        )}

        {/* ── Sources Panel ── */}
        {sourcesPanelOpen ? (
          <>
            {/* Artifact ↔ Sources drag handle */}
            <ResizeHandle onMouseDown={sourcesHandleDown} isDragging={sourcesDragging} />
            <div
              className="hidden xl:flex flex-col h-full shrink-0 border-l border-black/10 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 overflow-y-auto scrollbar-thin p-4"
              style={{ width: sourcesWidth }}
            >
              <SourceList sources={chat.lastSources} onCollapse={toggleSources} />
            </div>
          </>
        ) : (
          <div className="hidden xl:block">
            <CollapsedStrip label="Sources" onExpand={toggleSources} title="Show Sources" position="right" />
          </div>
        )}
      </div>
    </div>
  );
}


