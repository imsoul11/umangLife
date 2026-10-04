"use client";

import type { Journey } from "@/lib/types";
import { useLocale } from "./LocaleProvider";

export default function ProgressCard({ journey, progress, done, total, onDelete }: { journey: Journey; progress: number; done: number; total: number; onDelete?: () => void }) {
  const { t } = useLocale();
  return (
    <div className="card-ink relative overflow-hidden p-5 anim-rise">
      <div aria-hidden className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-saffron/20 blur-3xl" />
      <div aria-hidden className="absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-jade/20 blur-3xl" />

      <div className="relative flex items-center gap-5">
        {/* progress ring */}
        <div
          className="relative h-[76px] w-[76px] shrink-0 rounded-full"
          style={{
            background: `conic-gradient(from -90deg, var(--saffron), var(--gold) ${progress}%, rgb(255 255 255 / 0.12) ${progress}%)`,
            boxShadow: "0 0 24px rgba(255,122,26,0.35)",
          }}
        >
          <div className="absolute inset-[7px] rounded-full bg-[#1c1548] grid place-items-center ring-1 ring-white/10">
            <span className="text-2xl leading-none">{journey.emoji}</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="eyebrow text-white/45">Life event · journey</p>
          <div className="flex items-center gap-2 mt-1">
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
          <p className="mt-1 text-xs text-white/55">
            <span className="tabular-nums">{done}</span> of <span className="tabular-nums">{total}</span> {t("progress.completed")}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-shimmer text-3xl font-bold tabular-nums leading-none">{progress}%</p>
        </div>
      </div>

      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/15 ring-1 ring-inset ring-white/10">
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