"use client";

import { useMemo, useState } from "react";
import type { SchemeMatch } from "@/lib/types";
import { SCHEMES } from "@/data/schemes";
import { MOCK_PROFILE } from "@/data/mocks";
import { matchSchemes } from "@/lib/engine";

type Tab = "eligible" | "near" | "all";

export default function BenefitsPage() {
  const matches = useMemo(() => matchSchemes(MOCK_PROFILE, SCHEMES), []);
  const [tab, setTab] = useState<Tab>("eligible");

  const eligible = matches.filter((m) => m.eligible);
  const near = matches.filter((m) => !m.eligible && m.score >= 0.5);
  const rest = matches.filter((m) => !m.eligible && m.score < 0.5);
  const visible = tab === "eligible" ? [...eligible, ...near] : tab === "near" ? [...near, ...rest] : matches;

  return (
    <div className="min-h-screen bg-slate-50 relative z-[1]">
      <header className="sticky top-0 z-40 border-b border-indigo-ink/10 bg-white/70 backdrop-blur-lg px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-jade to-indigo-ink text-white grid place-items-center font-bold shadow-md">₹</div>
          <div>
            <h1 className="font-display font-semibold text-indigo-ink text-lg leading-tight tracking-tight">Your Benefit Matches</h1>
            <p className="text-xs text-slate-500">
              Deterministic eligibility engine · {eligible.length} of {matches.length} schemes matched ·{" "}
              {MOCK_PROFILE.state} resident
            </p>
          </div>
        </div>
        <a href="/" className="text-sm text-orange-600 hover:text-orange-700 font-medium">← Back to journeys</a>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-6">
        <div className="flex gap-2 mb-4">
          {([["eligible", `Eligible (${eligible.length})`], ["near", `Not eligible (${near.length + rest.length})`], ["all", `All schemes (${matches.length})`]] as [Tab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition ${
                tab === id ? "bg-emerald-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-300"
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-2.5">
          {visible.map((m) => (
            <SchemeRow key={m.scheme.id} m={m} />
          ))}
        </div>

        <p className="mt-6 text-[11px] text-slate-400 leading-relaxed max-w-3xl">
          Eligibility is evaluated by a transparent rules engine against published criteria — never by an AI model.
          Criteria change with budgets; always confirm on the department portal before applying. Sources &amp;
          last-updated dates shown per scheme.
        </p>
      </main>
    </div>
  );
}

function SchemeRow({ m }: { m: SchemeMatch }) {
  const s = m.scheme;
  return (
    <div className={`rounded-xl border p-4 ${m.eligible ? "border-emerald-200 bg-white" : "border-slate-200 bg-slate-50/60 opacity-80"}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-semibold text-slate-900">{s.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{s.department}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${s.level === "central" ? "bg-indigo-100 text-indigo-700" : "bg-orange-100 text-orange-700"}`}>
            {s.level === "central" ? "Central" : s.state}
          </span>
          {m.eligible ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-600 text-white">You qualify</span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-300 text-slate-600">{Math.round(m.score * 100)}% criteria met</span>
          )}
        </div>
      </div>

      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {s.benefits.map((b) => (
          <li key={b} className="text-xs text-slate-600">• {b}</li>
        ))}
      </ul>

      <details className="mt-2">
        <summary className="text-xs font-medium text-emerald-700 cursor-pointer select-none">
          {m.eligible ? "Why you qualify" : "Criteria check"} ({m.matchedWhy.length}/{s.criteria.length}) →
        </summary>
        <ul className="mt-1.5 space-y-1">
          {[...m.matchedWhy.map((w) => ({ t: w, ok: true })), ...m.unmet.map((u) => ({ t: u, ok: false }))].map(({ t, ok }) => (
            <li key={t} className={`text-xs ${ok ? "text-slate-600" : "text-red-500"}`}>
              {ok ? "✓" : "✗"} {t}
            </li>
          ))}
        </ul>
      </details>

      <p className="mt-2 text-[10px] text-slate-400">
        Source:{" "}
        <a href={s.sourceUrl} target="_blank" rel="noreferrer" className="underline hover:text-slate-600">{s.sourceUrl.replace(/^https?:\/\//, "")}</a>
        {" "}· updated {new Date(s.lastUpdated).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
      </p>
    </div>
  );
}
