"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CalendarEntry, TaskInstance } from "@/lib/types";
import { buildCalendar, computeTaskStatuses, matchSchemes } from "@/lib/engine";
import { SCHEMES } from "@/data/schemes";
import TaskWizard from "@/components/TaskWizard";
import JourneyBuilder from "@/components/JourneyBuilder";
import JourneyGraph from "@/components/JourneyGraph";
import ChatPanel from "@/components/ChatPanel";
import DashboardHeader from "@/components/DashboardHeader";
import EmptyState from "@/components/EmptyState";
import ProgressCard from "@/components/ProgressCard";
import CalendarStrip from "@/components/CalendarStrip";
import ProfileEditor from "@/components/ProfileEditor";
import SlaBanner from "@/components/SlaBanner";
import { JourneyProvider, useJourneys } from "@/components/JourneyProvider";
import { useLocale } from "@/components/LocaleProvider";

function DashboardInner() {
  const {
    profile,
    docs,
    journeys,
    activeId,
    setActiveId,
    messages,
    thinking,
    activeTask,
    setActiveTask,
    drafts,
    setDrafts,
    fetchedForms,
    digiToast,
    building,
    buildStage,
    reveal,
    sendMessage,
    completeTask,
    handleChatAction,
    handleAskAi,
    markFetched,
    resetDemo,
    deleteJourney,
  } = useJourneys();
  const { t } = useLocale();
  const [editorOpen, setEditorOpen] = useState(false);

  const activeJourney = journeys.find((j) => j.id === activeId) ?? null;
  const activeTasks: TaskInstance[] = useMemo(
    () => (activeJourney ? computeTaskStatuses(activeJourney, docs) : []),
    [activeJourney, docs],
  );
  const calendar: CalendarEntry[] = useMemo(
    () => journeys.flatMap((j) => buildCalendar(j)),
    [journeys],
  );
  const doneCount = activeTasks.filter((t) => t.status === "done").length;
  const progress = activeTasks.length ? Math.round((doneCount / activeTasks.length) * 100) : 0;
  const nextAction = useMemo(
    () => activeTasks.find((t) => t.status === "action_required") ?? activeTasks.find((t) => t.status === "ready") ?? null,
    [activeTasks],
  );
  const eligibleCount = useMemo(() => matchSchemes(profile, SCHEMES).filter((m) => m.eligible).length, [profile]);

  return (
    <div className="relative min-h-screen z-[1]">
      <DashboardHeader
        profile={profile}
        onReset={resetDemo}
        onOpenProfile={() => setEditorOpen(true)}
        journeys={journeys.map((j) => {
          const st = computeTaskStatuses(j, docs);
          return { id: j.id, emoji: j.emoji, title: j.title, progressLabel: `${st.filter((x) => x.status === "done").length}/${st.length}` };
        })}
        onSelectJourney={setActiveId}
      />

      <main className="max-w-7xl mx-auto p-4 lg:p-6 grid lg:grid-cols-[1fr_400px] gap-4 lg:gap-6">
        <section className="space-y-4 min-w-0">
          <SlaBanner />

          {/* Welcome back — reconstructed entirely from persisted state */}
          {!building && journeys.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {journeys.map((j) => {
                const st = computeTaskStatuses(j, docs);
                const done = st.filter((t) => t.status === "done").length;
                const pct = st.length ? Math.round((done / st.length) * 100) : 0;
                const active = j.id === activeId;
                return (
                  <div key={j.id} className="flex shrink-0 items-center gap-0.5">
                    <button
                      onClick={() => setActiveId(j.id)}
                      className={`group flex shrink-0 items-center gap-2.5 rounded-full border py-1.5 pl-2.5 pr-3 text-xs font-medium transition ${
                        active
                          ? "border-saffron/50 bg-white text-indigo-ink shadow-md shadow-saffron/10 ring-2 ring-saffron/40"
                          : "border-slate-200 bg-white/70 text-slate-500 shadow-sm hover:border-saffron/40 hover:text-slate-700"
                      }`}
                    >
                      <span className="text-base leading-none">{j.emoji}</span>
                      <span className="flex flex-col items-start gap-1">
                        <span className="leading-none">{j.title.replace(" Journey", "")}</span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-1 w-14 overflow-hidden rounded-full bg-slate-200/80">
                            <span
                              className={`block h-full rounded-full transition-all duration-500 ${active ? "bg-gradient-to-r from-saffron to-gold" : "bg-slate-400/70"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </span>
                          <span className="text-[10px] tabular-nums text-slate-400">{done}/{st.length}</span>
                        </span>
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(t("journey.deleteConfirm"))) deleteJourney(j.id);
                      }}
                      title={t("journey.delete")}
                      className="w-6 h-6 grid place-items-center rounded-full text-slate-300 hover:text-red-600 hover:bg-red-50 transition text-xs"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {building ? (
            <JourneyBuilder stage={buildStage} />
          ) : !activeJourney ? (
            <EmptyState onPrompt={sendMessage} />
          ) : (
            /* ---- bento grid ---- */
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2 anim-rise">
                <ProgressCard
                  journey={activeJourney}
                  progress={progress}
                  done={doneCount}
                  total={activeTasks.length}
                  onDelete={() => {
                    if (window.confirm(t("journey.deleteConfirm"))) deleteJourney(activeJourney.id);
                  }}
                />
              </div>

              <NextActionTile task={nextAction} onOpen={setActiveTask} />

              {calendar.length > 0 && (
                <div className="md:col-span-2 anim-rise" style={{ animationDelay: "70ms" }}>
                  <CalendarStrip entries={calendar} />
                </div>
              )}

              <BenefitsTile eligible={eligibleCount} total={SCHEMES.length} />

              <div className="md:col-span-3 anim-rise" style={{ animationDelay: "140ms" }}>
                <JourneyGraph
                  tasks={activeTasks}
                  onSelect={setActiveTask}
                  revealCount={reveal && activeJourney && reveal.journeyId === activeJourney.id ? reveal.n : undefined}
                />
              </div>
            </div>
          )}
        </section>

        <section className="lg:h-[calc(100vh-96px)] lg:sticky lg:top-6">
          <ChatPanel messages={messages} thinking={thinking} onSend={sendMessage} onAction={handleChatAction} samples={journeys.length === 0 ? [t("sample.job"), t("sample.vehicle")] : []}scopeLabel={activeJourney ? `${activeJourney.emoji} ${activeJourney.title.replace(" Journey", "")}` : journeys.length ? `${journeys.length} journeys` : undefined} />
        </section>
      </main>

      {digiToast && (
        <div key={digiToast.key} className="fixed bottom-5 right-5 z-[60] anim-rise">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white/95 backdrop-blur px-4 py-3 shadow-lift ring-1 ring-emerald-100">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-jade to-emerald-600 text-white grid place-items-center text-lg shadow-md shadow-emerald-500/25">🛡</div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Saved to your DigiLocker</p>
              <p className="text-xs text-slate-500 truncate max-w-[220px]">{digiToast.doc}</p>
            </div>
          </div>
        </div>
      )}

      {editorOpen && <ProfileEditor onClose={() => setEditorOpen(false)} />}

      {activeTask && activeJourney && (
        <TaskWizard
          task={activeTask}
          entities={activeJourney.entities}
          docs={docs}
          profile={profile}
          savedDraft={drafts[activeTask.id]}
          skipFetch={fetchedForms.has(activeTask.id)}
          onFetched={() => markFetched(activeTask.id)}
          onClose={() => setActiveTask(null)}
          onComplete={(taskId, sub, ref, snapshot) => completeTask(activeJourney.id, taskId, sub, ref, snapshot)}
          onDraftChange={(tid, vals) => setDrafts((d) => ({ ...d, [tid]: vals }))}
          onAskAi={handleAskAi}
        />
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <JourneyProvider>
      <DashboardInner />
    </JourneyProvider>
  );
}

/** The one thing to do now — first actionable task in the DAG (action_required first, then ready). */
function NextActionTile({ task, onOpen }: { task: TaskInstance | null; onOpen: (t: TaskInstance) => void }) {
  const { t } = useLocale();
  if (!task) {
    return (
      <div className="card p-5 flex flex-col anim-rise" style={{ animationDelay: "60ms" }}>
        <p className="eyebrow">{t("tile.nextAction")}</p>
        <p className="mt-2.5 flex items-center gap-2 text-sm font-semibold text-jade">
          <span aria-hidden className="w-2 h-2 rounded-full bg-jade shadow-[0_0_8px_rgba(11,143,92,0.6)]" />
          {t("tile.allCaughtUp")}
        </p>
        <p className="mt-1 text-xs text-slate-500 leading-snug">{t("tile.caughtUpBody")}</p>
      </div>
    );
  }
  return (
    <button
      onClick={() => onOpen(task)}
      className="card card-hover p-5 text-left flex flex-col anim-rise"
      style={{ animationDelay: "60ms" }}
    >
      <p className="eyebrow">{t("tile.nextAction")}</p>
      <p className="mt-2.5 font-display font-semibold text-indigo-ink leading-snug">{task.title}</p>
      <p className="mt-1 text-[11px] text-slate-500">{task.service.replace("_", " ")}{task.status === "action_required" ? " · ⚠️ document missing" : ""}</p>
      <span className="mt-auto pt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-saffron">
        {t("tile.openForm")} <span aria-hidden>→</span>
      </span>
    </button>
  );
}

/** Benefit-match teaser — eligibility engine count, links to /benefits. */
function BenefitsTile({ eligible, total }: { eligible: number; total: number }) {
  const { t } = useLocale();
  return (
    <Link
      href="/benefits"
      className="card card-hover p-5 flex flex-col anim-rise"
      style={{ animationDelay: "90ms" }}
    >
      <p className="eyebrow">{t("nav.benefits")}</p>
      <p className="mt-2.5 text-3xl font-bold tabular-nums text-indigo-ink leading-none">
        {eligible}
        <span className="text-xl text-slate-300">/{total}</span>
      </p>
      <p className="mt-1.5 text-xs text-slate-500">{t("tile.schemesMatch")}</p>
      <span className="mt-auto pt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-jade">
        {t("tile.viewMatches")} <span aria-hidden>→</span>
      </span>
    </Link>
  );
}
