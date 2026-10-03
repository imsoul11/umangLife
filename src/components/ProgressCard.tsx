"use client";

import type { Journey } from "@/lib/types";
import { useLocale } from "./LocaleProvider";

export default function ProgressCard({ journey, progress, done, total, onDelete }: { journey: Journey; progress: number; done: number; total: number; onDelete?: () => void }) {
  const { t } = useLocale();
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-ink via-[#241b58] to-[#2e2170] p-5 text-white shadow-lift">
      <div aria-hidden className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-saffron/25 blur-3xl" />
      <div aria-hidden className="absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-jade/20 blur-3xl" />

      <div className="relative flex items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-2xl ring-1 ring-white/20 ring-inset backdrop-blur">
          {journey.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-semibold tracking-tight truncate">{journey.title}</h2>
            {onDelete && (
              <button
                onClick={onDelete}
                title={t("journey.delete")}
                className="w-6 h-6 shrink-0 grid place-items-center rounded-full text-white/40 hover:text-red-300 hover:bg-white/10 transition text-xs"
              >
                ✕
              </button>
            )}
          </div>
          <p className="mt-0.5 text-xs text-white/55">{t("progress.completed")} · {progress}%</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold tabular-nums leading-none">
            {done}<span className="text-white/50 text-lg">/{total}</span>
          </p>
        </div>
      </div>

      <div className="relative mt-4 h-2.5 overflow-hidden rounded-full bg-white/15 ring-1 ring-inset ring-white/10">
        <div
          className="relative h-full rounded-full bg-gradient-to-r from-saffron via-[#ffb347] to-gold shadow-[0_0_14px_rgba(255,122,26,0.6)] transition-all duration-700 ease-out"
          style={{ width: `${progress}%`, minWidth: progress > 0 ? "0.75rem" : 0 }}
        >
          {progress > 0 && progress < 100 && <span className="sheen absolute inset-0 rounded-full" aria-hidden />}
        </div>
      </div>
    </div>
  );
}