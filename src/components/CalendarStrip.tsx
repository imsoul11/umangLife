"use client";

import type { CalendarEntry } from "@/lib/types";
import { useLocale } from "./LocaleProvider";

const SEV_BAR = {
  urgent: "bg-red-500",
  warning: "bg-amber-400",
  info: "bg-indigo-300",
} as const;

export default function CalendarStrip({ entries }: { entries: CalendarEntry[] }) {
  const { t } = useLocale();
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("calendar.title")}</h3>
        <span className="rounded-full bg-indigo-ink/[0.06] px-2 py-0.5 text-[10px] font-semibold text-indigo-ink/70 tabular-nums">
          {entries.length}
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {entries.map((e) => (
          <div
            key={e.id}
            className={`card-hover relative shrink-0 overflow-hidden rounded-xl border p-3 pl-3.5 text-xs w-44 bg-white shadow-sm ${
              e.severity === "urgent" ? "border-red-200 bg-red-50/70" : e.severity === "warning" ? "border-amber-200 bg-amber-50/70" : "border-slate-200"
            }`}
          >
            <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${SEV_BAR[e.severity]}`} />
            <p className="font-semibold text-slate-700 tabular-nums">{new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
            <p className="mt-1 text-slate-600 leading-snug">{e.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}