"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CalendarEntry, ChatAction, ChatMessage, CitizenProfile, Journey, TaskInstance } from "@/lib/types";
import { MOCK_DIGILOCKER_DOCS, MOCK_PROFILE } from "@/data/mocks";
import { SCHEMES } from "@/data/schemes";
import { buildCalendar, byUrgencyDesc, computeTaskStatuses, computeUrgency, matchSchemes } from "@/lib/engine";
import TaskWizard from "@/components/TaskWizard";
import JourneyGraph from "@/components/JourneyGraph";
import ChatPanel from "@/components/ChatPanel";

const STORAGE_KEY = "umanglife-session-v2"; // DB swap point: read()

const SAMPLE_PROMPTS = [
  "I changed my job and moved from Maharashtra to Karnataka for TCS",
  "I bought a second-hand car yesterday",
  "What's still pending from my job change?",
];

export default function Dashboard() {
  const [profile] = useState<CitizenProfile>(MOCK_PROFILE);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [activeTask, setActiveTask] = useState<TaskInstance | null>(null);
  const hydrated = useRef(false);

  /* ---- persistence: the "database" (swap these two effects for API calls) ---- */
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const saved = JSON.parse(raw) as { journeys?: Journey[]; messages?: ChatMessage[] };
        if (saved.journeys?.length) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time hydration from localStorage
          setJourneys(saved.journeys);
           
          setActiveId(saved.journeys[0].id);
        }
         
        if (saved.messages) setMessages(saved.messages);
      } catch {}
    }
    hydrated.current = true;
  }, []);
  useEffect(() => {
    if (!hydrated.current) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ journeys, messages }));
  }, [journeys, messages]);

  const activeJourney = journeys.find((j) => j.id === activeId) ?? null;
  const allTasks: TaskInstance[] = useMemo(
    () => journeys.flatMap((j) => computeTaskStatuses(j, MOCK_DIGILOCKER_DOCS)),
    [journeys],
  );
  const activeTasks: TaskInstance[] = activeJourney ? computeTaskStatuses(activeJourney, MOCK_DIGILOCKER_DOCS) : [];
  const matches = useMemo(() => matchSchemes(profile, SCHEMES), [profile]);
  const calendar: CalendarEntry[] = useMemo(
    () => journeys.flatMap((j) => buildCalendar(j)),
    [journeys],
  );
  const eligible = matches.filter((m) => m.eligible);
  const doneCount = activeTasks.filter((t) => t.status === "done").length;
  const progress = activeTasks.length ? Math.round((doneCount / activeTasks.length) * 100) : 0;

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || thinking) return;
      const userMsg: ChatMessage = { role: "user", content: text.trim(), ts: Date.now() };
      const history = messages.slice(-8);
      setMessages((m) => [...m, userMsg]);
      setThinking(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMsg.content, profile, journeys, history }),
        });
        const data = await res.json();
        const reply: ChatMessage = {
          role: "assistant",
          content: data.reply ?? data.error ?? "Something went wrong.",
          ts: Date.now(),
          actions: data.actions,
        };
        setMessages((m) => [...m, reply]);
        if (data.detection?.journey) {
          const incoming: Journey = data.detection.journey;
          setJourneys((prev) => prev.some((j) => j.id === incoming.id) ? prev : [...prev, incoming]);
          setActiveId(incoming.id);
        }
      } catch {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "Network error — is the dev server running?", ts: Date.now() },
        ]);
      } finally {
        setThinking(false);
      }
    },
    [messages, profile, journeys, thinking],
  );

  /** Complete or submit a task inside its journey, then recompute that graph. */
  const completeTask = useCallback(
    (journeyId: string, taskId: string, submitOnly: boolean) => {
      let createdRef: string | undefined;
      setJourneys((prev) =>
        prev.map((j) => {
          if (j.id !== journeyId) return j;
          const target = j.tasks.find((t) => t.id === taskId);
          if (!target) return j;
          if (submitOnly && target.slaDays) {
            createdRef = `${target.service.slice(0, 2)}-${Math.floor(10000 + Math.random() * 89999)}`;
          }
          const tasks = j.tasks.map((t) =>
            t.id === taskId
              ? submitOnly && t.slaDays
                ? { ...t, status: "in_progress" as const, submittedAt: new Date().toISOString(), applicationRef: createdRef }
                : { ...t, status: "done" as const, completedAt: new Date().toISOString() }
              : t,
          );
          return { ...j, tasks: computeTaskStatuses({ ...j, tasks }, MOCK_DIGILOCKER_DOCS) };
        }),
      );
      setActiveTask(null);
    },
    [],
  );

  const handleChatAction = useCallback(
    (a: ChatAction) => {
      const owner = journeys.find((j) => j.tasks.some((t) => t.id === a.taskId));
      if (!owner) return;
      const t = computeTaskStatuses(owner, MOCK_DIGILOCKER_DOCS).find((x) => x.id === a.taskId);
      if (!t || t.status === "locked" || t.status === "done") return;
      setActiveId(owner.id);
      if (a.kind === "mark_done") {
        completeTask(owner.id, t.id, Boolean(t.slaDays));
      } else {
        setActiveTask(t);
      }
    },
    [journeys, completeTask],
  );

  const readyNow = allTasks.filter((t) => t.status === "ready").sort(byUrgencyDesc);
  const needsAction = allTasks.filter((t) => t.status === "action_required").sort(byUrgencyDesc);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-600 text-white grid place-items-center font-bold">U</div>
          <div>
            <h1 className="font-bold text-slate-900 leading-tight">UMANG Life Journey</h1>
            <p className="text-xs text-slate-500">Life events → ordered government actions</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center font-semibold">
            {profile.name[0]}
          </span>
          <div className="leading-tight">
            <p className="font-medium text-slate-800">{profile.name}</p>
            <p className="text-xs text-slate-500">{profile.state} · {profile.occupation}</p>
          </div>
          <button
            onClick={() => { localStorage.removeItem(STORAGE_KEY); setJourneys([]); setMessages([]); setActiveId(null); }}
            className="ml-3 text-xs text-slate-400 hover:text-slate-600 underline"
          >
            reset demo
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-6 grid lg:grid-cols-[1fr_400px] gap-4 lg:gap-6">
        <section className="space-y-4 min-w-0">
          {/* Welcome back — reconstructed entirely from persisted state */}
          {journeys.length > 0 && (
            <WelcomeBackCard ready={readyNow} actionNeeded={needsAction} />
          )}

          {journeys.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {journeys.map((j) => {
                const st = computeTaskStatuses(j, MOCK_DIGILOCKER_DOCS);
                const done = st.filter((t) => t.status === "done").length;
                return (
                  <button key={j.id} onClick={() => setActiveId(j.id)}
                    className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-medium border transition ${
                      j.id === activeId ? "bg-orange-600 text-white border-orange-600" : "bg-white text-slate-600 border-slate-200 hover:border-orange-300"
                    }`}>
                    {j.emoji} {j.title.replace(" Journey", "")} · {done}/{st.length}
                  </button>
                );
              })}
            </div>
          )}

          {!activeJourney ? (
            <EmptyState onPrompt={sendMessage} />
          ) : (
            <>
              <ProgressCard journey={activeJourney} progress={progress} done={doneCount} total={activeTasks.length} />
              {calendar.length > 0 && <CalendarStrip entries={calendar} />}
              <JourneyGraph tasks={activeTasks} onSelect={setActiveTask} />
              <a href="/benefits" className="block rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 hover:border-emerald-400 transition">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl">✅</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{eligible.length} government benefits match your profile</p>
                      <p className="text-xs text-slate-500 truncate">Sukanya Samriddhi · Gruha Jyothi · +{Math.max(eligible.length - 2, 0)} more — see why you qualify</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-emerald-700">View all →</span>
                </div>
              </a>
            </>
          )}
        </section>

        <section className="lg:h-[calc(100vh-96px)] lg:sticky lg:top-6">
          <ChatPanel messages={messages} thinking={thinking} onSend={sendMessage} onAction={handleChatAction} samples={journeys.length === 0 ? SAMPLE_PROMPTS.slice(0, 2) : []} />
        </section>
      </main>

      {activeTask && activeJourney && (
        <TaskWizard task={activeTask} entities={activeJourney.entities} docs={MOCK_DIGILOCKER_DOCS} profile={profile} onClose={() => setActiveTask(null)} onComplete={(taskId, sub) => completeTask(activeJourney.id, taskId, sub)} />
      )}
    </div>
  );
}

/* ---------------- subcomponents ---------------- */

function WelcomeBackCard({
  ready,
  actionNeeded,
}: {
  ready: TaskInstance[];
  actionNeeded: TaskInstance[];
}) {
  if (ready.length === 0 && actionNeeded.length === 0) return null;
  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200 p-4">
      <p className="text-sm font-semibold text-slate-800">
        👋 You have {ready.length + actionNeeded.length} thing{ready.length + actionNeeded.length !== 1 ? "s" : ""} to take care of.
      </p>
      <ul className="mt-1 space-y-1">
        {[...actionNeeded.map((t) => ({ t, icon: "⚠️" })), ...ready.map((t) => ({ t, icon: "🔵" }))].slice(0, 4).map(({ t, icon }) => {
          const u = computeUrgency(t);
          return (
            <li key={t.id + t.title} className="flex items-center justify-between gap-3 text-xs bg-white/70 rounded-lg px-3 py-2">
              <span className="truncate text-slate-700">{icon} {t.title}{u ? ` — ${u.chip}` : ""}</span>
              <span className="shrink-0 text-slate-400">{t.applicationRef ? `ref ${t.applicationRef}` : t.status === "ready" ? "ready now" : "needs document"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function EmptyState({ onPrompt }: { onPrompt: (t: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-5">
      <div className="text-5xl">🏛️</div>
      <h2 className="text-xl font-semibold text-slate-800">Tell me what happened in your life</h2>
      <p className="text-sm text-slate-500 max-w-md mx-auto">
        Describe a life event in plain words. I&apos;ll find every government action you need, in the right order.
      </p>
      <div className="flex flex-wrap justify-center gap-2 pt-2">
        {SAMPLE_PROMPTS.slice(0, 2).map((s) => (
          <button key={s} onClick={() => onPrompt(s)} className="text-xs px-3 py-2 rounded-full border border-slate-300 text-slate-600 hover:border-orange-500 hover:text-orange-600 transition">
            “{s}”
          </button>
        ))}
      </div>
    </div>
  );
}

function ProgressCard({ journey, progress, done, total }: { journey: Journey; progress: number; done: number; total: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
      <div className="text-3xl">{journey.emoji}</div>
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-slate-900">{journey.title}</h2>
        <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-lg font-bold text-slate-900">{done}/{total}</p>
        <p className="text-xs text-slate-500">completed</p>
      </div>
    </div>
  );
}

function CalendarStrip({ entries }: { entries: CalendarEntry[] }) {
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

export function StatusBadge({ status }: { status: TaskInstance["status"] }) {
  const map = {
    locked: ["🔒", "bg-slate-100 text-slate-500"],
    ready: ["▶", "bg-blue-100 text-blue-700"],
    in_progress: ["⏳", "bg-yellow-100 text-yellow-700"],
    action_required: ["⚠️", "bg-amber-100 text-amber-800"],
    done: ["✓", "bg-emerald-100 text-emerald-700"],
  } as const;
  const [icon, cls] = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${cls}`}>
      {icon} {status.replace("_", " ")}
    </span>
  );
}
