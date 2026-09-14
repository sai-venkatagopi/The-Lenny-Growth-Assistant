import { ChevronDown, Cpu, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../services/api";
import type { ModelOption } from "../../types/chat";

interface Props {
  onModelChange?: (display: string) => void;
}

export function ModelSelector({ onModelChange }: Props) {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selected, setSelected] = useState("");
  const [ollamaOk, setOllamaOk] = useState(false);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.listModels().then((res) => {
      setModels(res.models);
      setOllamaOk(res.active.ollama_available);
      const def = res.models.find((m) => m.is_default) || res.models[0];
      if (def) {
        setSelected(def.id);
        onModelChange?.(def.label);
      }
    });
  }, [onModelChange]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitch = async (m: ModelOption) => {
    setOpen(false);
    setSelected(m.id);
    const res = await api.switchModel(m.provider, m.model);
    onModelChange?.(res.display);
  };

  const current = models.find((m) => m.id === selected);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-black/10 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-sm text-ink dark:text-slate-200 hover:border-teal/40 dark:hover:border-emerald-500/40 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              ollamaOk ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              ollamaOk ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
        </span>
        <Cpu size={14} className="text-teal dark:text-emerald-400" aria-hidden />
        <span className="max-w-[150px] sm:max-w-[180px] truncate font-medium text-xs sm:text-sm">
          {current?.label || "Select model"}
        </span>
        <ChevronDown size={14} className="text-ink-muted dark:text-slate-400" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-1.5 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-premium dark:shadow-premium-dark border border-black/10 dark:border-slate-700 py-1.5 z-50 animate-slide-up"
        >
          <div className="px-3 py-1.5 border-b border-black/5 dark:border-slate-700/60 mb-1">
            <p className="text-[10px] uppercase tracking-wider text-ink-muted dark:text-slate-400 font-semibold">
              Select AI Engine
            </p>
          </div>
          {models.map((m) => {
            const isSelected = m.id === selected;
            return (
              <button
                key={m.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSwitch(m)}
                className={`w-full text-left px-3.5 py-2.5 text-xs sm:text-sm flex items-center justify-between transition-colors ${
                  isSelected
                    ? "bg-teal-muted dark:bg-emerald-950/40 text-teal dark:text-emerald-400 font-semibold"
                    : "text-ink dark:text-slate-200 hover:bg-cream-dark dark:hover:bg-slate-700/60"
                }`}
              >
                <div className="flex flex-col">
                  <span>{m.label}</span>
                  <span className="text-[10px] text-ink-muted dark:text-slate-400 capitalize">
                    {m.provider} {m.is_default ? "• Default" : ""}
                  </span>
                </div>
                {isSelected && <Sparkles size={14} className="text-teal dark:text-emerald-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
