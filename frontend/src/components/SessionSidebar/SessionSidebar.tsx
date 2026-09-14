import { MessageSquarePlus, Sparkles, Trash2 } from "lucide-react";
import type { SessionSummary } from "../../types/chat";

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

interface Props {
  sessions: SessionSummary[];
  activeId: string | null;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
  collapsed?: boolean;
  onCollapse?: () => void;
}

export function SessionSidebar({ sessions, activeId, onNew, onSelect, onDelete, collapsed, onCollapse }: Props) {
  if (collapsed) return null;

  return (
    <aside
      className="w-72 sm:w-64 h-full shrink-0 border-r border-black/10 dark:border-slate-800 bg-white/70 dark:bg-slate-900/80 backdrop-blur-md flex flex-col animate-fade-in transition-colors duration-200"
      aria-label="Sessions"
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-black/5 dark:border-slate-800">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <RobotLogo className="h-10 w-10 shrink-0" />
            <div className="min-w-0">
              <h2 className="font-display font-bold text-base text-ink dark:text-slate-100 truncate">
                Lenny Growth
              </h2>
              <p className="text-xs text-ink-muted dark:text-slate-400 font-medium">Assistant & Advisor</p>
            </div>
          </div>
          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              className="p-1.5 rounded-lg text-ink-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-slate-800 transition-colors"
              title="Hide Sessions"
              aria-label="Hide Sessions"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>
              </svg>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal dark:bg-emerald-600 text-white text-sm font-semibold hover:bg-teal-light dark:hover:bg-emerald-500 transition-all duration-200 shadow-card hover:shadow-premium active:scale-[0.98]"
        >
          <MessageSquarePlus size={18} aria-hidden />
          <span>New Conversation</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
        <p className="text-[10px] uppercase tracking-wider text-ink-muted dark:text-slate-400 font-semibold px-2 mb-2">
          Recent Sessions ({sessions.length})
        </p>

        {sessions.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-ink-muted dark:text-slate-500">
            No conversations yet. Start a new chat above!
          </div>
        ) : (
          <ul className="space-y-1.5" role="list">
            {sessions.map((s) => {
              const isActive = activeId === s.id;
              return (
                <li key={s.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => onSelect(s.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 flex flex-col relative ${
                      isActive
                        ? "bg-teal-muted dark:bg-emerald-950/40 text-teal dark:text-emerald-400 font-semibold shadow-sm border border-teal/20 dark:border-emerald-500/20"
                        : "text-ink/80 dark:text-slate-300 hover:bg-cream-dark dark:hover:bg-slate-800/80 border border-transparent"
                    }`}
                  >
                    <span className="line-clamp-2 pr-6 leading-snug">{s.title || "Untitled Session"}</span>
                    <span className="text-[11px] text-ink-muted dark:text-slate-400 mt-1 block font-normal">
                      {s.message_count} message{s.message_count !== 1 ? "s" : ""}
                    </span>
                  </button>

                  {onDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(s.id);
                      }}
                      className="absolute right-2 top-2.5 p-1.5 rounded-lg text-ink-muted dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Delete session"
                      title="Delete session"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-black/5 dark:border-slate-800 bg-cream/40 dark:bg-slate-900/40">
        <div className="flex items-start gap-2.5 text-xs text-ink-muted dark:text-slate-400">
          <Sparkles size={16} className="text-teal dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden />
          <p className="leading-tight">
            Grounded by Lenny Podcast transcripts. Every response cites exact sources.
          </p>
        </div>
      </div>
    </aside>
  );
}
