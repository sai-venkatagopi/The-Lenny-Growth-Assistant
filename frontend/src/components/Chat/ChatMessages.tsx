import { AlertCircle, Code, FileText, PenTool, RefreshCw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import type { Message } from "../../types/chat";
import { ChatMessage } from "./ChatMessage";

interface Props {
  messages: Message[];
  loading: boolean;
  error: string | null;
  onRetry?: (text: string) => void;
  onQuickAction?: (action: string, prompt: string) => void;
}

const SUGGESTIONS = [
  {
    title: "Activation Loops",
    desc: "What makes an activation loop durable?",
    icon: Sparkles,
  },
  {
    title: "Growth Metrics",
    desc: "Which growth metrics matter most early on?",
    icon: FileText,
  },
  {
    title: "Customer Discovery",
    desc: "How should PMs run customer discovery?",
    icon: PenTool,
  },
];

const NEAR_BOTTOM_THRESHOLD = 120;

export function ChatMessages({ messages, loading, error, onRetry, onQuickAction }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const lastUser = [...messages].reverse().find((m) => m.role === "user");

  const checkNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD;
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      isNearBottomRef.current = checkNearBottom();
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [checkNearBottom]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const userJustSent = lastMessage?.role === "user";
    const shouldScroll = userJustSent || isNearBottomRef.current;

    if (shouldScroll) {
      bottomRef.current?.scrollIntoView?.({ behavior: "smooth" });
      if (userJustSent) {
        isNearBottomRef.current = true;
      }
    }
  }, [messages, loading]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 min-h-0 overflow-y-auto scrollbar-thin transition-colors duration-200"
      aria-label="Chat messages"
    >
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 md:px-6 md:py-8">
        {/* Empty State */}
        {messages.length === 0 && !loading && (
          <div className="flex min-h-[55vh] flex-col items-center justify-center py-8 text-center animate-fade-in">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-teal-muted dark:bg-emerald-950/60 shadow-premium dark:shadow-premium-dark border border-teal/20 dark:border-emerald-500/20">
              <Sparkles className="text-teal dark:text-emerald-400" size={32} aria-hidden />
            </div>
            <h2 className="mb-2 font-display text-2xl font-bold text-ink dark:text-slate-100">
              Lenny Growth Advisor
            </h2>
            <p className="mb-8 max-w-md text-sm text-ink-muted dark:text-slate-400 leading-relaxed">
              Ask product strategy, activation loops, and retention framework questions grounded in Lenny Podcast transcripts.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
              {SUGGESTIONS.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => onQuickAction?.("chat", item.desc)}
                    className="flex flex-col items-start p-4 text-left rounded-2xl border border-black/8 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-teal/40 dark:hover:border-emerald-500/40 hover:bg-cream-dark dark:hover:bg-slate-800 transition-all duration-200 shadow-sm hover:shadow-card group"
                  >
                    <div className="p-2 rounded-xl bg-teal-muted dark:bg-slate-700 text-teal dark:text-emerald-400 mb-2 group-hover:scale-105 transition-transform">
                      <IconComponent size={16} />
                    </div>
                    <span className="font-display font-semibold text-xs text-ink dark:text-slate-200 mb-1">
                      {item.title}
                    </span>
                    <span className="text-xs text-ink-muted dark:text-slate-400 line-clamp-2 leading-relaxed">
                      "{item.desc}"
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Message Stream */}
        {messages.map((m) => (
          <div key={m.id} className="space-y-2">
            <ChatMessage message={m} />
            {m.role === "assistant" && onQuickAction && (
              <div className="ml-11 flex animate-fade-in flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    onQuickAction("ship30", "Write a Ship 30 essay based on our discussion")
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 dark:border-violet-800/60 bg-violet-50 dark:bg-violet-950/40 px-3 py-1.5 text-xs font-medium text-violet-700 dark:text-violet-300 transition-colors hover:bg-violet-100 dark:hover:bg-violet-900/60 shadow-xs"
                >
                  <PenTool size={12} />
                  Ship 30 Essay
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onQuickAction(
                      "artifact-md",
                      "Create a one-page product strategy document from this discussion"
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/10 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-ink/80 dark:text-slate-300 transition-colors hover:border-teal/40 dark:hover:border-emerald-500/40 hover:bg-cream-dark dark:hover:bg-slate-700/80 shadow-xs"
                >
                  <FileText size={12} />
                  Strategy Brief
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onQuickAction(
                      "artifact-html",
                      "Create an HTML landing page concept based on this discussion"
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/10 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-ink/80 dark:text-slate-300 transition-colors hover:border-teal/40 dark:hover:border-emerald-500/40 hover:bg-cream-dark dark:hover:bg-slate-700/80 shadow-xs"
                >
                  <Code size={12} />
                  HTML Concept
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex animate-fade-in justify-start ml-11">
            <div className="rounded-2xl border border-black/8 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 shadow-card dark:shadow-card-dark">
              <div className="flex items-center gap-3 text-xs sm:text-sm text-ink-muted dark:text-slate-300 font-medium">
                <span className="flex gap-1.5">
                  <span className="h-2 w-2 animate-pulse-soft rounded-full bg-teal dark:bg-emerald-400" />
                  <span className="h-2 w-2 animate-pulse-soft rounded-full bg-teal dark:bg-emerald-400 [animation-delay:0.2s]" />
                  <span className="h-2 w-2 animate-pulse-soft rounded-full bg-teal dark:bg-emerald-400 [animation-delay:0.4s]" />
                </span>
                Grounding answer in transcript evidence…
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="flex animate-slide-up items-start gap-3 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-800 dark:text-red-300 ml-11 shadow-sm"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <p className="font-medium">{error}</p>
              {lastUser && onRetry && (
                <button
                  type="button"
                  onClick={() => onRetry(lastUser.content)}
                  className="mt-2 inline-flex items-center gap-1.5 font-medium text-xs text-red-700 dark:text-red-400 hover:underline"
                >
                  <RefreshCw size={13} /> Retry request
                </button>
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} aria-hidden className="h-px shrink-0" />
      </div>
    </div>
  );
}
