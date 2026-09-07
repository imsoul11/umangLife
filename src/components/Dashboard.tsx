"use client";

import { useMemo, useState } from "react";
import type { CalendarEntry, TaskInstance } from "@/lib/types";
import { buildCalendar, computeTaskStatuses } from "@/lib/engine";
import TaskWizard from "@/components/TaskWizard";
import JourneyBuilder from "@/components/JourneyBuilder";
import JourneyGraph from "@/components/JourneyGraph";
import ChatPanel from "@/components/ChatPanel";
import DashboardHeader from "@/components/DashboardHeader";
import EmptyState, { SAMPLE_PROMPTS } from "@/components/EmptyState";
import ProgressCard from "@/components/ProgressCard";
import CalendarStrip from "@/components/CalendarStrip";
import ProfileEditor from "@/components/ProfileEditor";
import { JourneyProvider, useJourneys } from "@/components/JourneyProvider";

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
  } = useJourneys();
  const [editorOpen, setEditorOpen] = useState(false);

  const activeJourney = journeys.find((j) => j.id === activeId) ?? null;
  const activeTasks: TaskInstance[] = activeJourney ? computeTaskStatuses(activeJourney, docs) : [];
  const calendar: CalendarEntry[] = useMemo(
    () => journeys.flatMap((j) => buildCalendar(j)),
    [journeys],
  );
  const doneCount = activeTasks.filter((t) => t.status === "done").length;
  const progress = activeTasks.length ? Math.round((doneCount / activeTasks.length) * 100) : 0;

  return (
    <div className="relative min-h-screen z-[1]">
      <DashboardHeader profile={profile} onReset={resetDemo} onOpenProfile={() => setEditorOpen(true)} />

      <main className="max-w-7xl mx-auto p-4 lg:p-6 grid lg:grid-cols-[1fr_400px] gap-4 lg:gap-6">
        <section className="space-y-4 min-w-0">
          {/* Welcome back — reconstructed entirely from persisted state */}
          {!building && journeys.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {journeys.map((j) => {
                const st = computeTaskStatuses(j, docs);
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

          {building ? (
            <JourneyBuilder stage={buildStage} />
          ) : !activeJourney ? (
            <EmptyState onPrompt={sendMessage} />
          ) : (
            <>
              <ProgressCard journey={activeJourney} progress={progress} done={doneCount} total={activeTasks.length} />
              {calendar.length > 0 && <CalendarStrip entries={calendar} />}
              <JourneyGraph
                tasks={activeTasks}
                onSelect={setActiveTask}
                revealCount={reveal && activeJourney && reveal.journeyId === activeJourney.id ? reveal.n : undefined}
              />
            </>
          )}
        </section>

        <section className="lg:h-[calc(100vh-96px)] lg:sticky lg:top-6">
          <ChatPanel messages={messages} thinking={thinking} onSend={sendMessage} onAction={handleChatAction} samples={journeys.length === 0 ? SAMPLE_PROMPTS.slice(0, 2) : []} scopeLabel={activeJourney ? `${activeJourney.emoji} ${activeJourney.title.replace(" Journey", "")}` : journeys.length ? `${journeys.length} journeys` : undefined} />
        </section>
      </main>

      {digiToast && (
        <div key={digiToast.key} className="fixed bottom-5 right-5 z-[60] anim-rise">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white/95 backdrop-blur px-4 py-3 shadow-xl">
            <div className="w-9 h-9 rounded-full bg-emerald-100 grid place-items-center text-lg">🛡</div>
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
