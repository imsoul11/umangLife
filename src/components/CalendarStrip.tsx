"use client";

import type { CalendarEntry } from "@/lib/types";

export default function CalendarStrip({ entries }: { entries: CalendarEntry[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">My Government Calendar</h3>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {entries.map((e) => (
          <div key={e.id} className={`shrink-0 rounded-xl border p-3 text-xs w-44 ${
            e.severity === "urgent" ? "border-red-200 bg-red-50" : e.severity === "warning" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"
          }`}>
            <p className="font-medium text-slate-700">{new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
            <p className="mt-1 text-slate-600 leading-snug">{e.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
