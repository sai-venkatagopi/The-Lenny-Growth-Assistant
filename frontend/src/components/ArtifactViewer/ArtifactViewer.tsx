import DOMPurify from "dompurify";
import { Download, Eye, FileCode, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Artifact } from "../../types/chat";

interface Props {
  artifact: Artifact | null;
  loading?: boolean;
  onClear: () => void;
  onCollapse?: () => void;
}

export function ArtifactViewer({ artifact, loading, onClear, onCollapse }: Props) {
  const [tab, setTab] = useState<"render" | "raw">("render");

  const sanitizedHtml = useMemo(() => {
    if (!artifact || artifact.type !== "html") return "";
    return DOMPurify.sanitize(artifact.content, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ["script", "iframe", "object", "embed", "form"],
      FORBID_ATTR: ["onerror", "onclick", "onload", "onmouseover"],
    });
  }, [artifact]);

  const iframeSrc = useMemo(() => {
    if (!artifact || artifact.type !== "html") return "";
    const css = DOMPurify.sanitize(artifact.css || "", { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${sanitizedHtml}</body></html>`;
    return `data:text/html;charset=utf-8,${encodeURIComponent(doc)}`;
  }, [artifact, sanitizedHtml]);

  const download = () => {
    if (!artifact) return;
    const ext = artifact.type === "html" ? "html" : "md";
    const blob = new Blob([artifact.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${artifact.title.replace(/\s+/g, "-").slice(0, 40)}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <aside
      className="w-full lg:w-[380px] xl:w-[440px] h-full shrink-0 border-l border-black/10 dark:border-slate-800 bg-white/70 dark:bg-slate-900/80 backdrop-blur-md flex flex-col animate-fade-in transition-colors duration-200"
      aria-label="Artifact viewer"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-black/5 dark:border-slate-800">
        <div className="min-w-0 pr-2">
          <p className="text-[10px] uppercase tracking-wider text-ink-muted dark:text-slate-400 font-semibold">
            Artifact Canvas
          </p>
          <h3 className="font-display font-semibold text-sm text-ink dark:text-slate-100 truncate">
            {artifact?.title || "No active artifact"}
          </h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {artifact && (
            <>
              <button
                type="button"
                onClick={download}
                className="p-1.5 rounded-lg hover:bg-cream-dark dark:hover:bg-slate-800 text-ink-muted dark:text-slate-400 hover:text-teal dark:hover:text-emerald-400 transition-colors"
                aria-label="Download artifact"
                title="Download artifact"
              >
                <Download size={16} />
              </button>
              <button
                type="button"
                onClick={onClear}
                className="p-1.5 rounded-lg hover:bg-cream-dark dark:hover:bg-slate-800 text-ink-muted dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                aria-label="Clear artifact"
                title="Clear artifact"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              className="p-1.5 ml-1 rounded-lg hover:bg-cream-dark dark:hover:bg-slate-800 text-ink-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-200 transition-colors"
              title="Hide Artifact Canvas"
              aria-label="Hide Artifact Canvas"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      {artifact && (
        <div className="flex items-center gap-2 px-4 pt-3 pb-1 border-b border-black/5 dark:border-slate-800/60 bg-cream/40 dark:bg-slate-900/40">
          <button
            type="button"
            onClick={() => setTab("render")}
            className={`text-xs px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-all ${
              tab === "render"
                ? "bg-teal dark:bg-emerald-600 text-white shadow-xs"
                : "bg-cream-dark dark:bg-slate-800 text-ink-muted dark:text-slate-300 hover:bg-cream-darker dark:hover:bg-slate-700"
            }`}
          >
            <Eye size={13} />
            {artifact.type === "html" ? "Live Preview" : "Formatted Draft"}
          </button>
          <button
            type="button"
            onClick={() => setTab("raw")}
            className={`text-xs px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-all ${
              tab === "raw"
                ? "bg-teal dark:bg-emerald-600 text-white shadow-xs"
                : "bg-cream-dark dark:bg-slate-800 text-ink-muted dark:text-slate-300 hover:bg-cream-darker dark:hover:bg-slate-700"
            }`}
          >
            <FileCode size={13} /> Raw Code
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 flex flex-col">
        {loading && (
          <div className="space-y-4 animate-pulse p-2">
            <div className="h-5 bg-cream-dark dark:bg-slate-800 rounded-lg w-2/3" />
            <div className="h-4 bg-cream-dark dark:bg-slate-800 rounded-lg w-full" />
            <div className="h-4 bg-cream-dark dark:bg-slate-800 rounded-lg w-4/5" />
            <div className="h-48 bg-cream-dark dark:bg-slate-800 rounded-2xl" />
          </div>
        )}

        {!loading && !artifact && (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-ink-muted dark:text-slate-400 py-12 px-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-muted dark:bg-emerald-950/50 flex items-center justify-center mb-3 shadow-sm border border-teal/20 dark:border-emerald-500/20">
              <Sparkles size={24} className="text-teal dark:text-emerald-400" />
            </div>
            <h4 className="font-display font-semibold text-sm text-ink dark:text-slate-200 mb-1">
              Artifact Canvas Ready
            </h4>
            <p className="text-xs max-w-xs leading-relaxed">
              Click <strong className="text-teal dark:text-emerald-400">Ship 30 essay</strong>, <strong className="text-teal dark:text-emerald-400">Strategy brief</strong>, or <strong className="text-teal dark:text-emerald-400">HTML concept</strong> under any message to generate an artifact here.
            </p>
          </div>
        )}

        {!loading && artifact && tab === "render" && artifact.type === "markdown" && (
          <article className="prose-assistant bg-white dark:bg-slate-800 rounded-2xl border border-black/8 dark:border-slate-700/80 p-5 shadow-card dark:shadow-card-dark animate-slide-up">
            <span className="inline-block text-[10px] uppercase tracking-wider font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800/60 px-2.5 py-0.5 rounded-full mb-4">
              Ship 30 · Grounded Essay Draft
            </span>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{artifact.content}</ReactMarkdown>
          </article>
        )}

        {!loading && artifact && tab === "render" && artifact.type === "html" && (
          <div className="rounded-2xl border border-black/8 dark:border-slate-700/80 overflow-hidden shadow-card dark:shadow-card-dark animate-slide-up bg-white dark:bg-slate-800 flex-1 flex flex-col min-h-[420px]">
            <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border-b border-black/5 dark:border-slate-700/80 flex items-center justify-between">
              <span className="text-[10px] font-mono text-ink-muted dark:text-slate-400">Isolated Sandboxed Preview</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <iframe
              title={artifact.title}
              src={iframeSrc}
              sandbox=""
              className="w-full flex-1 border-0 min-h-[380px]"
              aria-label="Sanitized HTML artifact preview"
            />
          </div>
        )}

        {!loading && artifact && tab === "raw" && (
          <pre className="text-xs font-mono bg-slateCustom-900 text-slate-100 p-4 rounded-2xl overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-card dark:shadow-card-dark">
            {artifact.content}
          </pre>
        )}
      </div>
    </aside>
  );
}
