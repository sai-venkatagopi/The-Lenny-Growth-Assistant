import { ExternalLink, FileText, User } from "lucide-react";
import type { SourceCitation } from "../../types/chat";

interface Props {
  sources: SourceCitation[];
  onCollapse?: () => void;
}

export function SourceList({ sources, onCollapse }: Props) {
  if (!sources.length) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-ink-muted dark:text-slate-400 italic">
        <FileText size={20} className="mb-2 opacity-40" />
        No transcript sources retrieved for this answer yet.
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted dark:text-slate-400">
          Sources ({sources.length})
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] bg-teal-muted dark:bg-emerald-950/50 text-teal dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full">
            pgvector Match
          </span>
          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              className="p-1 rounded-md text-ink-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-slate-800 transition-colors ml-1"
              title="Hide Sources"
              aria-label="Hide Sources"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {sources.map((s, i) => {
        const score = Math.round(s.relevance * 100);
        return (
          <article
            key={s.chunk_id || i}
            className="rounded-2xl border border-black/8 dark:border-slate-800 bg-white dark:bg-slate-800/90 p-4 shadow-card dark:shadow-card-dark hover:shadow-premium dark:hover:shadow-premium-dark hover:border-teal/30 dark:hover:border-emerald-500/30 transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={15} className="text-teal dark:text-emerald-400 shrink-0" aria-hidden />
                <h4 className="text-xs font-bold text-ink dark:text-slate-100 truncate">{s.title}</h4>
              </div>
              <span
                className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  score >= 70
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                    : "bg-teal-muted text-teal dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {score}% Match
              </span>
            </div>

            {s.speaker && (
              <div className="flex items-center gap-1.5 text-[11px] text-ink-muted dark:text-slate-400 mb-2">
                <User size={12} className="shrink-0" />
                <span className="truncate">Guest: {s.speaker}</span>
              </div>
            )}

            <blockquote className="relative text-xs text-ink/80 dark:text-slate-300 leading-relaxed border-l-2 border-teal/40 dark:border-emerald-500/40 pl-3 py-0.5 my-2 italic bg-cream/40 dark:bg-slate-900/40 rounded-r-lg">
              "{s.snippet}"
            </blockquote>

            {s.url && (
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-teal dark:text-emerald-400 hover:underline"
              >
                View transcript <ExternalLink size={11} />
              </a>
            )}
          </article>
        );
      })}
    </div>
  );
}
