"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { ChatAction, ChatMessage, CitizenProfile, DigilockerDocument, Journey, TaskInstance } from "@/lib/types";
import { MOCK_DIGILOCKER_DOCS, MOCK_PROFILE } from "@/data/mocks";
import { computeTaskStatuses } from "@/lib/engine";
import { clearSession, loadSession, saveSession } from "@/lib/repository";
import { JOURNEY_BUILD_STAGES, JOURNEY_BUILD_STEP_MS } from "@/components/JourneyBuilder";

interface JourneyContextValue {
  profile: CitizenProfile;
  setProfile: Dispatch<SetStateAction<CitizenProfile>>;
  docs: DigilockerDocument[];
  setDocs: Dispatch<SetStateAction<DigilockerDocument[]>>;
  journeys: Journey[];
  activeId: string | null;
  setActiveId: Dispatch<SetStateAction<string | null>>;
  messages: ChatMessage[];
  thinking: boolean;
  activeTask: TaskInstance | null;
  setActiveTask: Dispatch<SetStateAction<TaskInstance | null>>;
  drafts: Record<string, Record<string, { value: string; source?: string }>>;
  setDrafts: Dispatch<SetStateAction<Record<string, Record<string, { value: string; source?: string }>>>>;
  fetchedForms: Set<string>;
  digiToast: { doc: string; key: number } | null;
  building: boolean;
  buildStage: number;
  reveal: { journeyId: string; n: number } | null;
  sendMessage: (text: string) => Promise<void>;
  completeTask: (journeyId: string, taskId: string, submitOnly: boolean, ref?: string, snapshot?: Record<string, string>) => void;
  handleChatAction: (a: ChatAction) => void;
  handleAskAi: (fieldLabel: string, taskTitle: string) => void;
  markFetched: (id: string) => void;
  resetDemo: () => void;
}

const JourneyContext = createContext<JourneyContextValue | null>(null);

export function useJourneys(): JourneyContextValue {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error("useJourneys must be used within <JourneyProvider>");
  return ctx;
}

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<CitizenProfile>(MOCK_PROFILE);
  const [docs, setDocs] = useState<DigilockerDocument[]>(MOCK_DIGILOCKER_DOCS);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [activeTask, setActiveTask] = useState<TaskInstance | null>(null);
  const [digiToast, setDigiToast] = useState<{ doc: string; key: number } | null>(null);
  useEffect(() => {
    if (!digiToast) return;
    const t = setTimeout(() => setDigiToast(null), 3800);
    return () => clearTimeout(t);
  }, [digiToast]);
  /** gate: never persist until the initial restore has been applied */
  const [restored, setRestored] = useState(false);

  /* ---- persistence: server store via repository (debounced saves) ---- */
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const saved = await loadSession();
      if (cancelled) return;
      if (saved) {
        if (saved.journeys?.length) {
          setJourneys(saved.journeys);
          // restore the tab the user was on — never silently jump to journeys[0]
          const valid = saved.activeId && saved.journeys.some((j) => j.id === saved.activeId) ? saved.activeId : saved.journeys[0].id;
          setActiveId(valid);
        }
        if (saved.messages) setMessages(saved.messages);
        if (saved.profile) setProfile(saved.profile);
        if (saved.docs) setDocs(saved.docs);
      }
      if (!cancelled) setRestored(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!restored) return;
    const t = setTimeout(() => {
      void saveSession({ journeys, messages, activeId, profile, docs });
    }, 300);
    return () => clearTimeout(t);
  }, [restored, journeys, messages, activeId, profile, docs]);

  /* ---- journey creation ceremony (declared before sendMessage uses it) ---- */
  const [building, setBuilding] = useState(false);
  const [buildStage, setBuildStage] = useState(0);
  const pendingJourney = useRef<Journey | null>(null);

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
          body: JSON.stringify({ message: userMsg.content, profile, journeys, focusedJourneyId: activeId, history, docs }),
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
          if (!journeys.some((j) => j.id === incoming.id)) {
            pendingJourney.current = incoming;
            setBuildStage(0);
            setBuilding(true);
          }
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
    [messages, profile, journeys, activeId, thinking, docs],
  );

  /** Drafts survive hopping from wizard to chat and back. */
  const [drafts, setDrafts] = useState<Record<string, Record<string, { value: string; source?: string }>>>({});
  /** forms already fetched this session — replay no ceremony */
  const [fetchedForms, setFetchedForms] = useState<Set<string>>(() => new Set());

  /* ---- step-by-step graph reveal after the ceremony ---- */
  const [reveal, setReveal] = useState<{ journeyId: string; n: number } | null>(null);
  useEffect(() => {
    if (!reveal) return;
    const j = journeys.find((x) => x.id === reveal.journeyId);
    if (!j) {
      // defer so we never setState synchronously inside the effect body
      const t = setTimeout(() => setReveal(null), 0);
      return () => clearTimeout(t);
    }
    if (reveal.n >= j.tasks.length) {
      const t = setTimeout(() => setReveal(null), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setReveal((r) => (r && r.journeyId === reveal.journeyId ? { ...r, n: r.n + 1 } : r)), 320);
    return () => clearTimeout(t);
  }, [reveal, journeys]);

  useEffect(() => {
    if (!building) return;
    if (buildStage >= JOURNEY_BUILD_STAGES) {
      // defer so we never setState synchronously inside the effect body
      const t = setTimeout(() => {
        const inc = pendingJourney.current;
        if (inc) {
          setJourneys((prev) => (prev.some((j) => j.id === inc.id) ? prev : [...prev, inc]));
          setActiveId(inc.id);
          setReveal({ journeyId: inc.id, n: 1 });
          pendingJourney.current = null;
        }
        setBuilding(false);
      }, 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setBuildStage((st) => st + 1), JOURNEY_BUILD_STEP_MS);
    return () => clearTimeout(t);
  }, [building, buildStage]);
  const markFetched = useCallback((id: string) => {
    setFetchedForms((prev) => {
      if (prev.has(id)) return prev;
      const n = new Set(prev);
      n.add(id);
      return n;
    });
  }, []);

  /**
   * Complete or submit a task, recompute the graph, then ACKNOWLEDGE it in the
   * conversation so the user never has to re-ask "what now?".
   */
  const completeTask = useCallback(
    (journeyId: string, taskId: string, submitOnly: boolean, ref?: string, snapshot?: Record<string, string>) => {
      const owner = journeys.find((j) => j.id === journeyId);
      if (!owner) return;
      const target = owner.tasks.find((t) => t.id === taskId);
      if (!target) return;
      const before = computeTaskStatuses(owner, docs);

      const tasksRaw = owner.tasks.map((t) =>
        t.id === taskId
          ? submitOnly && t.slaDays
            ? { ...t, status: "in_progress" as const, submittedAt: new Date().toISOString(), applicationRef: ref ?? t.applicationRef, submittedValues: snapshot ?? t.submittedValues }
            : { ...t, status: "done" as const, completedAt: new Date().toISOString(), submittedValues: snapshot ?? t.submittedValues }
          : t,
      );
      const draft: Journey = { ...owner, tasks: tasksRaw };
      const after = computeTaskStatuses(draft, docs);
      setJourneys((prev) => prev.map((j) => (j.id === journeyId ? { ...draft, tasks: after } : j)));
      setDrafts((d) => ({ ...d, [taskId]: {} }));

      // deterministic acknowledgment + chips for what just unlocked
      const newlyReady = after.filter((a) => a.status === "ready" && before.find((b) => b.id === a.id)?.status !== "ready");
      if (typeof document !== "undefined") {
        const userLine: ChatMessage = {
          role: "user",
          content: submitOnly ? `I just submitted my application for “${target.title}”.` : `I just completed “${target.title}”.`,
          ts: Date.now(),
        };
        const refNote = ref ? ` Reference number ${ref}.` : "";
        const unlockNote = newlyReady.length
          ? ` You can now start: ${newlyReady.map((t) => t.title).join(", ")}.`
          : newlyReady.length === 0 && after.every((t) => t.status === "done")
            ? " That was your final task — journey complete! 🎉"
            : "";
        const ack: ChatMessage = {
          role: "assistant",
          content: `${submitOnly ? "📨 Submitted" : "✓ Recorded"} — ${target.title}.${refNote}${unlockNote}`,
          ts: Date.now() + 1,
          actions: newlyReady.slice(0, 2).map((t) => ({
            journeyId,
            taskId: t.id,
            kind: "open_form" as const,
            label: t.title.length > 30 ? t.title.slice(0, 28) + "…" : t.title,
          })),
        };
        setMessages((m) => [...m, userLine, ack]);
      }
      // the completed step produces a document that ships to DigiLocker
      setDigiToast({
        doc: `${target.title.replace(/ Decision expected| to .*/g, "")} · ${target.service.replace("_", " ")}`,
        key: Date.now(),
      });
    },
    [journeys, docs],
  );

  /** Field-level "Ask AI" — hop to chat with a grounded question; draft is kept. */
  const handleAskAi = useCallback(
    (fieldLabel: string, taskTitle: string) => {
      setActiveTask(null);
      sendMessage(`I'm filling “${taskTitle}” but I'm stuck on the field “${fieldLabel}”. Where exactly do I find this information?`);
    },
    [sendMessage],
  );

  /** Chat chip → same execution paths as the graph UI. server stamps journeyId. */
  const handleChatAction = useCallback(
    (a: ChatAction) => {
      const owner = journeys.find((j) => j.id === a.journeyId) ?? journeys.find((j) => j.tasks.some((t) => t.id === a.taskId));
      if (!owner) return;
      const t = computeTaskStatuses(owner, docs).find((x) => x.id === a.taskId);
      if (!t || t.status === "locked" || t.status === "done") return;
      setActiveId(owner.id);
      if (a.kind === "mark_done") {
        completeTask(owner.id, t.id, Boolean(t.slaDays));
      } else {
        setActiveTask(t);
      }
    },
    [journeys, completeTask, docs],
  );

  const resetDemo = useCallback(() => {
    void clearSession();
    setJourneys([]);
    setMessages([]);
    setActiveId(null);
  }, []);

  const value: JourneyContextValue = {
    profile,
    setProfile,
    docs,
    setDocs,
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
  };

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}
