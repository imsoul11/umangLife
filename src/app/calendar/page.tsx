"use client";

import { useEffect, useMemo, useState } from "react";
import type { CalendarEntry, Journey, TaskInstance } from "@/lib/types";
import { buildCalendar } from "@/lib/engine";
import { buildDemoJourneys } from "@/data/seed";

const STORAGE_KEY = "umanglife-session-v2";
const GRIEVANCE_KEY = "umanglife-grievances-v1";

interface EscalatedRecord {
  grievanceId: string;
  at: string;
}

interface GrievanceState {
  entry: CalendarEntry;
  subject: string;
  body: string;
  drafting: boolean;
  filing: boolean;
  grievanceId?: string;
  facts?: string[];
}

type View = "month" | "timeline";

function entryKey(e: { journey: Journey; id: string }): string {
  return `${e.journey.id}:${e.id}`;
}

function toDayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysTo(dateIso: string): number {
  return Math.floor((new Date(dateIso).getTime() - Date.now()) / 86_400_000);
}

function monthCells(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const startDow = first.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const SEV_CLASS = {
  urgent: "bg-red-500",
  warning: "bg-amber-400",
  info: "bg-indigo-300",
} as const;

export default function CalendarPage() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [grievance, setGrievance] = useState<GrievanceState | null>(null);
  const [ready, setReady] = useState(false);
  /** entryId -> filed grievance; once set, the entry can only be viewed, never re-filed */
  const [escalated, setEscalated] = useState<Record<string, EscalatedRecord>>({});
  const [view, setView] = useState<View>("month");
  const today = new Date();
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selectedDay, setSelectedDay] = useState<string>(toDayKey(today.toISOString()));

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
    try {
      const raw = localStorage.getItem(GRIEVANCE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, EscalatedRecord>;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read
        setEscalated(saved);
      }
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(GRIEVANCE_KEY, JSON.stringify(escalated));
  }, [ready, escalated]);

  const entries = useMemo(() => {
    const all: (CalendarEntry & { journey: Journey })[] = [];
    for (const j of journeys) {
      for (const e of buildCalendar(j)) all.push({ ...e, journey: j });
    }
    return all.sort((a, b) => a.date.localeCompare(b.date));
  }, [journeys]);

  const byDay = useMemo(() => {
    const map = new Map<string, (CalendarEntry & { journey: Journey })[]>();
    for (const e of entries) {
      const k = toDayKey(e.date);
      map.set(k, [...(map.get(k) ?? []), e]);
    }
    return map;
  }, [entries]);

  const firstEntryDay = entries[0] ? toDayKey(entries[0].date) : toDayKey(today.toISOString());
  const selectedKey = byDay.has(selectedDay) ? selectedDay : byDay.has(firstEntryDay) ? firstEntryDay : selectedDay;
  const dayEntries = byDay.get(selectedKey) ?? [];
  const urgentCount = entries.filter((e) => e.severity === "urgent").length;

  async function draftGrievance(entry: CalendarEntry, journey: Journey) {
    const existing = escalated[entryKey({ journey, id: entry.id })];
    if (existing) {
      // already filed — open read-only with the stored ID
      setGrievance({
        entry,
        subject: "",
        body: "",
        drafting: false,
        filing: false,
        grievanceId: existing.grievanceId,
      });
      return;
    }
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
        body: JSON.stringify({ task, journey: owner, profile: { name: "Antas Jain", state: "Karnataka" } }),
      });
      const data = await res.json();
      setGrievance((g) => (g && g.entry.id === entry.id ? { ...g, subject: data.subject ?? "", body: data.body ?? "", drafting: false, facts: data.facts } : g));
    } catch {
      setGrievance((g) => (g && g.entry.id === entry.id ? { ...g, drafting: false } : g));
    }
  }

  function fileGrievance() {
    if (!grievance) return;
    setGrievance({ ...grievance, filing: true });
    setTimeout(() => {
      const gid = `GRV-${Math.floor(100000 + Math.random() * 899999)}`;
      const e = grievance.entry;
      const owner = journeys.find((x) => x.tasks.some((t) => t.id === e.relatedTaskId));
      if (owner) {
        const key = entryKey({ journey: owner, id: e.id });
        setEscalated((prev) => ({ ...prev, [key]: { grievanceId: gid, at: new Date().toISOString() } }));
      }
      setGrievance((g) => (g ? { ...g, filing: false, grievanceId: gid } : g));
    }, 1400);
  }

  if (!ready) return null;

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
        <div className="flex items-center gap-3">
          {view === "month" && (
            <div className="flex items-center gap-1 text-sm">
              <button onClick={() => setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))} className="w-7 h-7 grid place-items-center rounded-lg border border-slate-200 hover:border-saffron text-slate-600">←</button>
              <span className="w-28 text-center font-medium text-slate-800">
                {new Date(cursor.y, cursor.m, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </span>
              <button onClick={() => setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))} className="w-7 h-7 grid place-items-center rounded-lg border border-slate-200 hover:border-saffron text-slate-600">→</button>
              <button
                onClick={() => {
                  setCursor({ y: today.getFullYear(), m: today.getMonth() });
                  setSelectedDay(toDayKey(today.toISOString()));
                }}
                className="ml-1 px-2.5 py-1 rounded-lg text-xs border border-slate-200 text-slate-600 hover:border-saffron"
              >
                Today
              </button>
            </div>
          )}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
            {(["month", "timeline"] as View[]).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 font-medium ${view === v ? "bg-indigo-ink text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
                {v === "month" ? "Month" : "Timeline"}
              </button>
            ))}
          </div>
          <a href="/" className="text-sm text-saffron font-medium hover:underline">← Back</a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-6 space-y-4">
        {urgentCount > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 anim-rise">
            🚨 <b>{urgentCount} application{urgentCount !== 1 ? "s" : ""}</b> past the expected decision date — consider escalating below.
          </div>
        )}

        {journeys.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-4xl">📅</p>
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
            <div>
              <a href="/" className="text-sm text-saffron font-medium hover:underline">← Start a life event journey</a>
            </div>
          </div>
        ) : view === "month" ? (
          <>
            {/* ---- month grid ---- */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400 bg-slate-50 border-b border-slate-100">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {monthCells(cursor.y, cursor.m).map((date, i) => {
                  if (!date) return <div key={i} className="aspect-square" />;
                  const inMonth = date.getMonth() === cursor.m;
                  const isToday = toDayKey(date.toISOString()) === toDayKey(today.toISOString());
                  const k = toDayKey(date.toISOString());
                  const dayEnts = byDay.get(k) ?? [];
                  const selected = k === selectedKey;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedDay(k);
                        if (date.getMonth() !== cursor.m) setCursor({ y: date.getFullYear(), m: date.getMonth() });
                      }}
                      className={`aspect-square p-1.5 border-t border-l border-slate-100 relative flex flex-col items-center justify-between hover:bg-orange-50/70 transition ${inMonth ? "" : "opacity-30"} ${
                        selected ? "bg-saffron/10 ring-2 ring-inset ring-saffron/60" : ""
                      }`}
                    >
                      <span
                        className={`text-xs leading-none mt-1 ${
                          isToday ? "w-5 h-5 rounded-full bg-indigo-ink text-white grid place-items-center font-bold" : "font-medium " + (inMonth ? "text-slate-700" : "text-slate-400")
                        }`}
                      >
                        {date.getDate()}
                      </span>
                      {dayEnts.length > 0 && (
                        <div className="flex gap-0.5 mb-1">
                          {dayEnts.slice(0, 3).map((e, ei) => (
                            <span key={ei} className={`w-1.5 h-1.5 rounded-full ${SEV_CLASS[e.severity]}`} />
                          ))}
                          {dayEnts.length > 3 && <span className="text-[9px] leading-none text-slate-400">+{dayEnts.length - 3}</span>}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="px-4 py-2 border-t border-slate-100 flex flex-wrap gap-4 text-[10px] text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Overdue</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> ≤ 5 days left</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-300" /> In progress</span>
              </div>
            </div>

            {/* ---- selected day ---- */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                {new Date(selectedKey).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
              </h3>
              {dayEntries.length === 0 ? (
                <p className="text-sm text-slate-400">Nothing due this day.</p>
              ) : (
                <div className="space-y-2">
                  {dayEntries.map((e, i) => (
                    <EntryRow
                      key={e.id + i}
                      e={e}
                      index={i}
                      escalatedInfo={escalated[entryKey(e)]}
                      onEscalate={() => draftGrievance(e, e.journey)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* ---- timeline ---- */
          <div className="space-y-2">
            {entries.map((e, i) => (
              <EntryRow
                key={e.id + i}
                e={e}
                index={i}
                escalatedInfo={escalated[entryKey(e)]}
                onEscalate={() => draftGrievance(e, e.journey)}
              />
            ))}
          </div>
        )}
      </main>

      {grievance && (
        <GrievanceModal g={grievance} onClose={() => setGrievance(null)} onEdit={(subject, body) => setGrievance((g) => (g ? { ...g, subject, body } : g))} onFile={fileGrievance} />
      )}
    </div>
  );
}

function EntryRow({
  e,
  index,
  escalatedInfo,
  onEscalate,
}: {
  e: CalendarEntry & { journey: Journey };
  index: number;
  escalatedInfo?: EscalatedRecord;
  onEscalate: () => void;
}) {
  const dLeft = daysTo(e.date);
  const overdue = dLeft < 0;
  return (
    <div
      className={`anim-rise rounded-xl border p-4 flex items-center gap-4 ${overdue ? "border-red-300 bg-red-50/70" : e.severity === "warning" ? "border-amber-300 bg-amber-50/60" : "border-slate-200 bg-white"}`}
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <div className={`w-12 h-12 shrink-0 rounded-lg grid place-items-center text-center leading-tight ${overdue ? "bg-red-600 text-white" : "bg-indigo-ink text-white"}`}>
        <div className="text-[10px] font-semibold">{new Date(e.date).toLocaleDateString("en-IN", { month: "short" })}</div>
        <div className="text-base font-bold leading-none">{new Date(e.date).getDate()}</div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 leading-snug">{e.title}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {e.journey.emoji} {e.journey.title.replace(" Journey", "")} · {e.service?.replace("_", " ")} · <span className="font-mono">{e.applicationRef ?? "no ref yet"}</span>
        </p>
        <p className={`text-xs mt-0.5 ${overdue ? "font-semibold text-red-700" : dLeft <= 5 ? "text-amber-700" : "text-slate-500"}`}>
          {overdue ? `Overdue by ${Math.abs(dLeft)} day${Math.abs(dLeft) !== 1 ? "s" : ""}` : dLeft === 0 ? "Decision expected today" : `In ${dLeft} day${dLeft !== 1 ? "s" : ""}`}
        </p>
      </div>
      <button
        onClick={onEscalate}
        className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
          escalatedInfo
            ? "bg-emerald-600 text-white border-emerald-600 cursor-pointer"
            : overdue
              ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
              : "border-saffron text-saffron hover:bg-saffron hover:text-white"
        }`}
      >
        {escalatedInfo ? `✓ Filed · ${escalatedInfo.grievanceId}` : "⚖️ Escalate"}
      </button>
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