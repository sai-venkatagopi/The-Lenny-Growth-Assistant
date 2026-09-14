import { Loader2, Send } from "lucide-react";
import { FormEvent, useState } from "react";

interface Props {
  onSend: (text: string) => void;
  loading: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, loading, disabled }: Props) {
  const [text, setText] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="shrink-0 border-t border-black/8 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-[0_-4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)] backdrop-blur-md transition-colors duration-200">
      <form onSubmit={submit} className="mx-auto w-full max-w-3xl px-4 py-3.5 md:px-6">
        <div className="relative flex items-end gap-2.5 bg-cream-dark/60 dark:bg-slate-800/60 p-2 rounded-2xl border border-black/10 dark:border-slate-700/80 focus-within:border-teal/50 dark:focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-teal/10 dark:focus-within:ring-emerald-500/10 transition-all">
          <label htmlFor="chat-input" className="sr-only">
            Ask about product, growth, or customer discovery
          </label>
          <textarea
            id="chat-input"
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(e);
              }
            }}
            placeholder="Ask Lenny's corpus about product, growth, or metrics..."
            disabled={loading || disabled}
            className="flex-1 resize-none bg-transparent border-0 px-3 py-1.5 text-sm text-ink dark:text-slate-100 placeholder-ink-muted/70 dark:placeholder-slate-400 focus:outline-none focus:ring-0 disabled:opacity-60 max-h-32 scrollbar-thin"
          />
          <button
            type="submit"
            disabled={loading || disabled || !text.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal dark:bg-emerald-600 text-white transition-all duration-200 hover:bg-teal-light dark:hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-teal shadow-xs active:scale-95"
            aria-label="Send message"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={16} className="ml-0.5" />
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
