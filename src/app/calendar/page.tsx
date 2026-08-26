"use client";

import { useEffect, useMemo, useState } from "react";
import type { CalendarEntry, Journey, TaskInstance } from "@/lib/types";
import { buildCalendar } from "@/lib/engine";
import { buildDemoJourneys } from "@/data/seed";

const STORAGE_KEY = "umanglife-session-v2";

interface GrievanceState {
  entry: CalendarEntry;
  subject: string;
  body: string;
  drafting: boolean;
  filing: boolean;
  grievanceId?: string;
  facts?: string[];
}

function daysTo(dateIso: string): number {
  return Math.floor((new Date(dateIso).getTime() - Date.now()) / 86_400_000);
}

export default function CalendarPage() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [grievance, setGrievance] = useState<GrievanceState | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { journeys?: Journey[] };
        if (saved.journeys) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read
          setJourneys(saved.journeys);
        }
      }
    } catch {}
    setReady(true);
  }, []);

  const entries = useMemo(() => {
    const all: (CalendarEntry & { journey: Journey })[] = [];
    for (const j of journeys) {
      for (const e of buildCalendar(j)) all.push({ ...e, journey: j });
    }
    return all.sort((a, b) => a.date.localeCompare(b.date));
  }, [journeys]);

  async function draftGrievance(entry: CalendarEntry) {
    setGrievance({ entry, subject: "", body: "", drafting: true, filing: false });
    const task = allTasksOf(entry, journeys);
    const owner = journeys.find((x) => x.tasks.some((t) => t.id === entry.relatedTaskId && t.status === "in_progress"));
    if (!task || !owner) {
      setGrievance({ entry, subject: "Not enough context", body: "This entry has no filed application behind it yet — submit the application first.", drafting: false, filing: false });
      return;
    }
    try {
      const res = await fetch("/api/grievance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task,
          journey: owner,
          profile: { name: "Antas Jain", state: "Karnataka" },
        }),
      });
      const data = await res.json();
      setGrievance((g) =>
        g && g.entry.id === entry.id
          ? { ...g, subject: data.subject ?? "", body: data.body ?? "", drafting: false, facts: data.facts }
          : g,
      );
    } catch {
      setGrievance((g) => (g && g.entry.id === entry.id ? { ...g, drafting: false } : g));
    }
  }

  function fileGrievance() {
    if (!grievance) return;
    setGrievance({ ...grievance, filing: true });
    setTimeout(() => {
      const gid = `GRV-${Math.floor(100000 + Math.random() * 899999)}`;
      setGrievance((g) => (g ? { ...g, filing: false, grievanceId: gid } : g));
    }, 1400);
  }

  if (!ready) return null;
  if (journeys.length === 0) {
    return (
      <div className="grid place-items-center min-h-[60vh] text-center">
        <div className="space-y-4">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-slate-600 font-medium">No active applications to track yet.</p>
          <button
            onClick={() => {
              const seeded = buildDemoJourneys();
              setJourneys(seeded);
              localStorage.setItem(STORAGE_KEY, JSON.stringify({ journeys: seeded, messages: [] }));
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-saffron to-saffron-deep text-white text-sm font-semibold shadow-md hover:opacity-95 transition"
          >
            ✨ Load demo with live applications (one overdue)
          </button>
          <p className="text-xs text-slate-400">or </p>
          <a href="/" className="text-sm text-saffron font-medium hover:underline">← Start a life event journey</a>
        </div>
      </div>
    );
  }

  const urgentCount = entries.filter((e) => e.severity === "urgent").length;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-indigo-ink/10 bg-white/70 backdrop-blur-lg px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-saffron to-saffron-deep text-white grid place-items-center font-bold shadow-md">📅</div>
          <div>
            <h1 className="font-display font-semibold text-indigo-ink text-lg leading-tight tracking-tight">My Government Calendar</h1>
            <p className="text-[11px] text-slate-500">Every filed application, its decision deadline, and your escalation path</p>
          </div>
        </div>
        <a href="/" className="text-sm text-saffron font-medium hover:underline">← Back to journeys</a>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-6">
        {urgentCount > 0 && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 anim-rise">
            🚨 <b>{urgentCount} application{urgentCount !== 1 ? "s" : ""}</b> past the expected decision date — consider escalating below.
          </div>
        )}
        {entries.length === 0 ? (
          <p className="text-slate-500">Submit an application from your journey to see its tracking here.</p>
        ) : (
          <div className="space-y-2.5">
            {entries.map((e, i) => {
              const dLeft = daysTo(e.date);
              const overdue = dLeft < 0;
              return (
                <div key={e.id + i} className={`anim-rise rounded-xl border p-4 flex items-center gap-4 ${overdue ? "border-red-300 bg-red-50/70" : e.severity === "warning" ? "border-amber-300 bg-amber-50/60" : "border-slate-200 bg-white"}`} style={{ animationDelay: `${i * 45}ms` }}>
                  <div className={`w-12 h-12 shrink-0 rounded-lg grid place-items-center text-center leading-tight ${overdue ? "bg-red-600 text-white" : "bg-indigo-ink text-white"}`}>
                    <div className="text-[10px] font-semibold">{new Date(e.date).toLocaleDateString("en-IN", { month: "short" })}</div>
                    <div className="text-base font-bold leading-none">{new Date(e.date).getDate()}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 leading-snug">{e.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {e.journey.emoji} {e.journey.title.replace(" Journey", "")} · {e.service?.replace("_", " ")} ·{" "}
                      <span className="font-mono">{e.applicationRef ?? "no ref yet"}</span>
                    </p>
                    <p className={`text-xs mt-0.5 ${overdue ? "font-semibold text-red-700" : dLeft <= 5 ? "text-amber-700" : "text-slate-500"}`}>
                      {overdue ? `Overdue by ${Math.abs(dLeft)} day${Math.abs(dLeft) !== 1 ? "s" : ""}` : dLeft === 0 ? "Decision expected today" : `In ${dLeft} day${dLeft !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <button
                    onClick={() => draftGrievance(e)}
                    className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                      overdue ? "bg-red-600 text-white border-red-600 hover:bg-red-700" : "border-saffron text-saffron hover:bg-saffron hover:text-white"
                    }`}
                  >
                    ⚖️ Escalate
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {grievance && (
        <GrievanceModal g={grievance} onClose={() => setGrievance(null)} onEdit={(subject, body) => setGrievance((g) => (g ? { ...g, subject, body } : g))} onFile={fileGrievance} />
      )}
    </div>
  );
}

function allTasksOf(entry: CalendarEntry, journeys: Journey[]): TaskInstance | undefined {
  for (const j of journeys) {
    const t = j.tasks.find((x) => x.id === entry.relatedTaskId);
    if (t) return t;
  }
  return undefined;
}

function GrievanceModal({
  g,
  onClose,
  onEdit,
  onFile,
}: {
  g: GrievanceState;
  onClose: () => void;
  onEdit: (subject: string, body: string) => void;
  onFile: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl anim-pop overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-400">
            ⚖️ Escalation · CPGRAMS · Centralised Public Grievance Redress &amp; Monitoring System
          </div>
          <h3 className="font-semibold text-lg text-slate-900 mt-1">Raise a grievance for “{g.entry.title}”</h3>
          <p className="text-xs text-slate-500 mt-0.5">{g.entry.applicationRef ? `Application ${g.entry.applicationRef} · ${g.entry.service?.replace("_", " ")}` : ""}</p>
        </div>

        <div className="p-6 space-y-4 max-h-[55vh] overflow-y-auto">
          {g.grievanceId ? (
            <div className="text-center space-y-3 py-8 anim-pop">
              <div className="text-5xl">⚖️</div>
              <h4 className="font-semibold text-xl text-slate-900">Grievance filed</h4>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                Your complaint has been submitted to CPGRAMS with your journey&apos;s full context. Track it with:
              </p>
              <div className="inline-block px-5 py-2.5 rounded-xl bg-indigo-ink text-white font-mono text-base tracking-wide">{g.grievanceId}</div>
              <p className="text-xs text-slate-400">Application context (refs, dates, department) was attached automatically — nothing re-explained.</p>
            </div>
          ) : g.drafting ? (
            <div className="flex items-center gap-3 py-10 justify-center text-sm text-slate-600">
              <span className="w-5 h-5 rounded-full border-2 border-saffron border-t-transparent animate-spin" />
              Assembling your complaint from journey facts…
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-slate-600">Subject</label>
                <input value={g.subject} onChange={(e) => onEdit(e.target.value, g.body)} className="mt-1 w-full text-sm text-slate-900 bg-white px-3 py-2 rounded-lg border border-slate-200 focus:border-saffron focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Complaint body — edit freely, facts are grounded in your journey</label>
                <textarea value={g.body} rows={11} onChange={(e) => onEdit(g.subject, e.target.value)} className="mt-1 w-full text-sm text-slate-900 bg-white px-3 py-2 rounded-lg border border-slate-200 focus:border-saffron focus:outline-none leading-relaxed" />
              </div>
              {g.facts && g.facts.length > 0 && (
                <details className="text-xs text-slate-400">
                  <summary className="cursor-pointer select-none">Fact context attached to this grievance ({g.facts.length})</summary>
                  <ul className="mt-1.5 space-y-0.5">
                    {g.facts.map((f) => <li key={f}>• {f}</li>)}
                  </ul>
                </details>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
          {g.grievanceId ? (
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-semibold">Close</button>
          ) : g.drafting ? null : (
            <>
              <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-700">Cancel</button>
              <button onClick={onFile} disabled={g.filing} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold transition">
                {g.filing ? "Filing to CPGRAMS…" : "🚩 File grievance to CPGRAMS"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}