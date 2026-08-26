"use client";

import type { SchemeMatch } from "@/lib/types";

export default function BenefitsPanel({ matches, nearMisses }: { matches: SchemeMatch[]; nearMisses: SchemeMatch[] }) {
  if (matches.length === 0 && nearMisses.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
        Benefits you may qualify for ({matches.length})
      </h3>
      <div className="grid sm:grid-cols-2 gap-2.5">
        {matches.map((m) => (
          <div key={m.scheme.id} className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-slate-800 leading-snug">{m.scheme.name}</p>
              <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                {m.scheme.level === "central" ? "Central" : m.scheme.state}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 leading-snug">{m.scheme.benefits.join(" · ")}</p>
            <details className="mt-2 group">
              <summary className="text-[11px] font-medium text-emerald-700 cursor-pointer select-none">Why you qualify →</summary>
              <ul className="mt-1.5 space-y-1">
                {m.matchedWhy.map((w) => (
                  <li key={w} className="text-[11px] text-slate-600">✓ {w}</li>
                ))}
              </ul>
              <p className="mt-1.5 text-[10px] text-slate-400">
                {m.scheme.department} · updated {new Date(m.scheme.lastUpdated).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
              </p>
            </details>
          </div>
        ))}
        {nearMisses.map((m) => (
          <div key={m.scheme.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 opacity-80">
            <p className="text-sm font-medium text-slate-600 leading-snug">{m.scheme.name}</p>
            <details className="mt-1.5">
              <summary className="text-[11px] font-medium text-slate-500 cursor-pointer select-none">Not eligible — why? →</summary>
              <ul className="mt-1 space-y-0.5">
                {m.unmet.map((u) => (
                  <li key={u} className="text-[11px] text-slate-500">✗ {u}</li>
                ))}
              </ul>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
