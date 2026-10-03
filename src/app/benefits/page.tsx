"use client";

import { useEffect, useMemo, useState } from "react";
import type { CitizenProfile, SchemeMatch } from "@/lib/types";
import { SCHEMES } from "@/data/schemes";
import { MOCK_PROFILE } from "@/data/mocks";
import { matchSchemes } from "@/lib/engine";
import { loadSession } from "@/lib/repository";
import { useLocale } from "@/components/LocaleProvider";
import PageHeader from "@/components/PageHeader";

type Tab = "eligible" | "near" | "all";

export default function BenefitsPage() {
  const { t } = useLocale();
  const [profile, setProfile] = useState<CitizenProfile>(MOCK_PROFILE);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const saved = await loadSession();
      if (!cancelled && saved?.profile) setProfile(saved.profile);
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  const matches = useMemo(() => matchSchemes(profile, SCHEMES), [profile]);
  const [tab, setTab] = useState<Tab>("eligible");

  const eligible = matches.filter((m) => m.eligible);
  const near = matches.filter((m) => !m.eligible && m.score >= 0.5);
  const rest = matches.filter((m) => !m.eligible && m.score < 0.5);
  const visible = tab === "eligible" ? [...eligible, ...near] : tab === "near" ? [...near, ...rest] : matches;

  return (
    <div className="min-h-screen relative z-[1]">
      <PageHeader
        icon={<span className="font-display text-lg leading-none">₹</span>}
        title={t("benefits.title")}
        subtitle={t("benefits.subtitle", { e: eligible.length, n: matches.length, s: profile.state })}
      />

      <main className="max-w-5xl mx-auto p-4 lg:p-6">
        <div className="inline-flex rounded-full bg-white/85 p-1 ring-1 ring-indigo-ink/[0.08] shadow-sm mb-4">
          {([
            ["eligible", t("benefits.tab.eligible", { n: eligible.length })],
            ["near", t("benefits.tab.ineligible", { n: near.length + rest.length })],
            ["all", t("benefits.tab.all", { n: matches.length })],
          ] as [Tab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                tab === id ? "bg-gradient-to-br from-jade to-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-jade"
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
          {t("benefits.disclaimer")}
        </p>
      </main>
    </div>
  );
}

function SchemeRow({ m }: { m: SchemeMatch }) {
  const { t, localeTag } = useLocale();
  const s = m.scheme;
  return (
    <div className={`card-hover relative overflow-hidden rounded-xl border p-4 bg-white shadow-sm ${
      m.eligible ? "border-emerald-200 border-l-4 border-l-emerald-500" : "border-slate-200 bg-slate-50/60 opacity-80"
    }`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-semibold text-slate-900">{s.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{s.department}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${s.level === "central" ? "bg-indigo-100 text-indigo-700" : "bg-orange-100 text-orange-700"}`}>
            {s.level === "central" ? t("benefits.levelCentral") : s.state}
          </span>
          {m.eligible ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gradient-to-br from-jade to-emerald-600 text-white shadow-sm">{t("benefits.qualify")}</span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-300 text-slate-600">{t("benefits.criteriaMet", { p: Math.round(m.score * 100) })}</span>
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
          {m.eligible ? t("benefits.whyQualify", { a: m.matchedWhy.length, b: s.criteria.length }) : t("benefits.criteriaCheck", { a: m.matchedWhy.length, b: s.criteria.length })}
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
        {t("benefits.source")}{" "}
        <a href={s.sourceUrl} target="_blank" rel="noreferrer" className="underline hover:text-slate-600">{s.sourceUrl.replace(/^https?:\/\//, "")}</a>
        {" "}· {t("benefits.updated", { d: new Date(s.lastUpdated).toLocaleDateString(localeTag, { month: "short", year: "numeric" }) })}
      </p>
    </div>
  );
}
