"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "./LocaleProvider";

export type CommandItem = {
  id: string;
  label: string;
  icon: string;
  group: string;
  hint?: string;
  keywords?: string;
  run: () => void;
};

/**
 * ⌘K command palette — keyboard-first navigation & actions (Linear-style).
 * Mounted once in the header; opens via ⌘K / Ctrl+K or the header search pill.
 */
export default function CommandPalette({ items, open, onOpenChange }: { items: CommandItem[]; open: boolean; onOpenChange: (open: boolean) => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;
  return <PalettePanel items={items} onClose={onOpenChange} />;
}

/** Inner panel remounts on every open — query/selection reset for free, no reset effects. */
function PalettePanel({ items, onClose }: { items: CommandItem[]; onClose: (open: boolean) => void }) {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => `${it.label} ${it.keywords ?? ""}`.toLowerCase().includes(q));
  }, [items, query]);

  const activeIdx = Math.min(active, Math.max(filtered.length - 1, 0));

  function runItem(it: CommandItem) {
    onClose(false);
    it.run();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(Math.min(activeIdx + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(Math.max(activeIdx - 1, 0));
    } else if (e.key === "Enter" && filtered[activeIdx]) {
      e.preventDefault();
      runItem(filtered[activeIdx]);
    }
  }

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  return (
    <div className="fixed inset-0 z-50 bg-indigo-950/50 backdrop-blur-sm p-4 pt-[12vh]" onClick={() => onClose(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="mx-auto max-w-xl rounded-2xl bg-white shadow-[0_32px_80px_-24px_rgba(26,20,64,0.5)] ring-1 ring-indigo-ink/10 overflow-hidden anim-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-indigo-ink/[0.06]">
          <span aria-hidden className="text-slate-400 text-sm">🔍</span>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("palette.placeholder")}
            className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
          />
          <span className="kbd">esc</span>
        </div>

        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="text-center text-sm text-slate-400 py-10">{t("palette.noResults")}</p>
          )}
          {filtered.map((it, idx) => {
            const showGroup = idx === 0 || filtered[idx - 1].group !== it.group;
            return (
              <div key={it.id}>
                {showGroup && <p className="eyebrow px-2.5 pt-3 pb-1.5">{it.group}</p>}
                <button
                  data-idx={idx}
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => runItem(it)}
                  className={`w-full flex items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm transition ${
                    idx === activeIdx ? "bg-saffron/10 ring-1 ring-saffron/30 text-indigo-ink" : "text-slate-700"
                  }`}
                >
                  <span aria-hidden className="w-6 h-6 grid place-items-center rounded-lg bg-slate-100 text-xs shrink-0">{it.icon}</span>
                  <span className="flex-1 truncate font-medium">{it.label}</span>
                  {it.hint && <span className="text-[11px] tabular-nums text-slate-400">{it.hint}</span>}
                  {idx === activeIdx && <span aria-hidden className="text-[10px] text-slate-400 font-mono">↵</span>}
                </button>
              </div>
            );
          })}
        </div>

        <div className="px-4 py-2.5 border-t border-indigo-ink/[0.06] bg-slate-50/70 flex items-center gap-3 text-[10px] text-slate-400">
          <span><span className="kbd">↑</span> <span className="kbd">↓</span> navigate</span>
          <span><span className="kbd">↵</span> select</span>
          <span className="ml-auto flex items-center gap-1"><span className="hidden sm:inline">press</span> <span className="kbd">⌘</span><span className="kbd">K</span></span>
        </div>
      </div>
    </div>
  );
}

/** Built-in navigation commands available on every page. */
export function navigateCommands(router: ReturnType<typeof useRouter>, labels: { journeys: string; benefits: string; calendar: string; about: string }): CommandItem[] {
  const nav: [string, string, string][] = [
    ["/", "🧭", labels.journeys],
    ["/benefits", "💰", labels.benefits],
    ["/calendar", "📅", labels.calendar],
    ["/about", "ℹ️", labels.about],
  ];
  return nav.map(([href, icon, label]) => ({
    id: `nav:${href}`,
    label,
    icon,
    group: "Navigate",
    run: () => router.push(href),
  }));
}
