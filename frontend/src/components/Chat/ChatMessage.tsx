import { Bot, FileText, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "../../types/chat";

interface Props {
  message: Message;
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";
  const sourceCount = message.sources?.length || 0;

  return (
    <div
      className={`flex animate-slide-up gap-3 ${isUser ? "justify-end" : "justify-start"}`}
      role="article"
      aria-label={isUser ? "Your message" : "Assistant message"}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-teal dark:bg-emerald-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
          <Bot size={18} />
        </div>
      )}

      <div className={`flex flex-col max-w-[88%] sm:max-w-[82%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 shadow-sm transition-all ${
            isUser
              ? "bg-teal dark:bg-emerald-600 text-white rounded-tr-xs"
              : "bg-white dark:bg-slate-800 border border-black/8 dark:border-slate-700/80 text-ink dark:text-slate-100 rounded-tl-xs shadow-card dark:shadow-card-dark"
          }`}
        >
          {isUser ? (
            <p className="text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap font-normal">
              {message.content}
            </p>
          ) : (
            <div className="prose-assistant text-sm sm:text-[15px]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Message Meta Info */}
        <div className="flex items-center gap-2 mt-1.5 px-1 text-[11px] text-ink-muted dark:text-slate-400">
          {!isUser && message.model_used && (
            <span className="font-mono bg-cream-dark dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] text-teal dark:text-emerald-400 font-medium">
              {message.model_used}
            </span>
          )}
          {!isUser && sourceCount > 0 && (
            <span className="inline-flex items-center gap-1 bg-teal-muted dark:bg-emerald-950/40 text-teal dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-medium">
              <FileText size={11} />
              {sourceCount} {sourceCount === 1 ? "source" : "sources"} cited
            </span>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-cream-dark dark:bg-slate-700 border border-black/5 dark:border-slate-600 flex items-center justify-center text-ink-muted dark:text-slate-300 shrink-0 mt-0.5">
          <User size={18} />
        </div>
      )}
    </div>
  );
}
