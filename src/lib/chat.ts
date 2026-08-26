import type {
  ChatAction,
  ChatRequest,
  ChatResponse,
  Journey,
  LifeEventEntities,
  LifeEventId,
  TaskInstance,
} from "@/lib/types";
import type OpenAI from "openai";
import { getAIClient } from "@/lib/ai";
import { buildSystemPrompt } from "@/lib/prompts";
import { findKbTopic } from "@/data/kb";
import { JOURNEY_TEMPLATES } from "@/data/journeys";
import { MOCK_DIGILOCKER_DOCS } from "@/data/mocks";
import { computeTaskStatuses, materializeTaskDefs } from "@/lib/engine";

const EVENT_META: Record<LifeEventId, { title: string; emoji: string }> = {
  JOB_CHANGE: { title: "Job Change Journey", emoji: "💼" },
  NEW_CHILD: { title: "New Child Journey", emoji: "👶" },
  VEHICLE_PURCHASE: { title: "Vehicle Purchase Journey", emoji: "🚗" },
  HOME_PURCHASE: { title: "Home Purchase Journey", emoji: "🏠" },
};

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "detect_life_event",
      description:
        "Call when the user describes a major life event. Extract states and employer names when mentioned.",
      parameters: {
        type: "object",
        properties: {
          lifeEvent: {
            type: "string",
            enum: ["JOB_CHANGE", "NEW_CHILD", "VEHICLE_PURCHASE", "HOME_PURCHASE"],
          },
          fromState: { type: "string", description: "State the user is leaving, if mentioned" },
          toState: { type: "string", description: "State the user is moving to, if mentioned" },
          employerName: { type: "string", description: "New employer name, if mentioned" },
        },
        required: ["lifeEvent"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "lookup_kb",
      description: "Fetch official knowledge-base content for a topic slug.",
      parameters: {
        type: "object",
        properties: { slug: { type: "string" } },
        required: ["slug"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_journey_state",
      description: "Current status of every task in the user's active journeys.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "suggest_actions",
      description:
        "Attach tappable action buttons to your reply so the user can act immediately. Use as your FINAL step whenever your answer names tasks the user can act on now. Only reference task ids that exist; invalid or non-actionable ones are silently dropped.",
      parameters: {
        type: "object",
        properties: {
          actions: {
            type: "array",
            maxItems: 3,
            items: {
              type: "object",
              properties: {
                taskId: { type: "string", description: "exact task id from get_journey_state / journey context" },
                kind: { type: "string", enum: ["open_form", "mark_done"] },
                label: { type: "string", description: "short imperative, e.g. 'Open KYC form'" },
              },
              required: ["taskId", "kind", "label"],
            },
          },
        },
        required: ["actions"],
      },
    },
  },
];

function createJourney(
  lifeEvent: LifeEventId,
  entities: LifeEventEntities,
  profile: ChatRequest["profile"],
): Journey | null {
  const template = JOURNEY_TEMPLATES[lifeEvent];
  if (!template) return null;
  const meta = EVENT_META[lifeEvent];
  const tasks: TaskInstance[] = materializeTaskDefs(template, profile).map((t) => ({
    ...t,
    status: "locked" as const,
  }));
  const journey: Journey = {
    id: crypto.randomUUID(),
    lifeEvent,
    title: meta.title,
    emoji: meta.emoji,
    createdAt: new Date().toISOString(),
    entities,
    tasks,
  };
  journey.tasks = computeTaskStatuses(journey, MOCK_DIGILOCKER_DOCS);
  return journey;
}

interface ToolOutcome {
  payload: unknown;
  createdJourney?: Journey;
  actions?: ChatAction[];
}

/** Validate model-proposed chips against live task state — hallucination firewall. */
function validateActions(raw: unknown, req: ChatRequest): ChatAction[] {
  const list = (raw as { actions?: { taskId?: string; kind?: string; label?: string }[] })?.actions ?? [];
  const valid: ChatAction[] = [];
  for (const j of req.journeys ?? []) {
    for (const t of computeTaskStatuses(j, MOCK_DIGILOCKER_DOCS)) {
      const proposal = list.find((a) => a.taskId === t.id);
      if (!proposal || !proposal.label) continue;
      if (t.status === "ready") {
        valid.push({ journeyId: j.id, taskId: t.id, kind: (proposal.kind === "mark_done" ? "mark_done" : "open_form"), label: String(proposal.label).slice(0, 40) });
      } else if (t.status === "action_required" || t.status === "in_progress") {
        // only opening the form/detail view makes sense here
        valid.push({ journeyId: j.id, taskId: t.id, kind: "open_form", label: String(proposal.label).slice(0, 40) });
      }
    }
  }
  return valid.slice(0, 3);
}

function executeTool(name: string, argsJson: string, req: ChatRequest): ToolOutcome {
  const args = argsJson ? JSON.parse(argsJson) : {};

  if (name === "detect_life_event") {
    // dedupe: an active journey for this event already exists → reuse it (§5)
    const existing = (req.journeys ?? []).find((j) => j.lifeEvent === args.lifeEvent);
    if (existing) {
      return {
        payload: {
          alreadyActive: true,
          summary: `${existing.emoji} ${existing.title} is already in progress (${existing.tasks.filter((t) => t.status === "done").length}/${existing.tasks.length} done).`,
          journey: existing,
        },
      };
    }
    const journey = createJourney(args.lifeEvent as LifeEventId, args as LifeEventEntities, req.profile);
    if (!journey) return { payload: { error: `Unknown life event ${args.lifeEvent}` } };
    const ready = journey.tasks.filter((t) => t.status !== "locked").length;
    return {
      payload: {
        detected: true,
        summary: `${journey.emoji} ${journey.title}: ${journey.tasks.length} relevant actions found, ${ready} ready now.`,
        journey,
      },
      createdJourney: journey,
    };
  }

  if (name === "lookup_kb") {
    const topic = findKbTopic(String(args.slug));
    if (!topic) return { payload: { error: `No topic "${args.slug}"` } };
    return {
      payload: {
        department: topic.department,
        lastUpdated: topic.lastUpdated,
        content: topic.content,
      },
    };
  }

  if (name === "get_journey_state") {
    const journeys = req.journeys ?? [];
    if (!journeys.length) return { payload: { error: "No active journeys" } };
    return {
      payload: journeys.map((j) => ({
        journey: j.title,
        tasks: computeTaskStatuses(j, MOCK_DIGILOCKER_DOCS).map((t) => ({
          id: t.id,
          status: t.status,
          title: t.title,
          applicationRef: t.applicationRef,
        })),
      })),
    };
  }

  if (name === "suggest_actions") {
    const actions = validateActions(args, req);
    return { payload: { ok: true, attached: actions.length }, actions };
  }

  return { payload: { error: `Unknown tool ${name}` } };
}

const MAX_TOOL_ROUNDS = 3;

export async function runChat(req: ChatRequest): Promise<ChatResponse> {
  const { client, model } = getAIClient();
  let detectedJourney: Journey | undefined;
  let pendingActions: ChatAction[] | undefined;

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt(req.profile, req.journeys ?? [], req.focusedJourneyId) },
    ...req.history.slice(-8).map((m) => ({
      role: m.role,
      content: m.content,
    }) as OpenAI.ChatCompletionMessageParam),
    { role: "user", content: req.message },
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const res = await client.chat.completions.create({
      model,
      messages,
      tools: TOOLS,
      temperature: 0.3,
    });
    const msg = res.choices[0]?.message;
    if (!msg?.tool_calls?.length) {
      return {
        reply: msg?.content ?? "Sorry, could you rephrase that?",
        detection: detectedJourney
          ? { lifeEvent: detectedJourney.lifeEvent, entities: detectedJourney.entities, journey: detectedJourney }
          : undefined,
      };
    }
    let terminalText: string | undefined;
    const hadSuggestActions = msg.tool_calls.some(
      (c) => "function" in c && c.function?.name === "suggest_actions",
    );
    const nonTerminalCalls = msg.tool_calls.filter(
      (c) => !("function" in c) || c.function?.name !== "suggest_actions",
    );
    if (msg.content && msg.content.trim()) terminalText = msg.content;

    if (!hadSuggestActions || nonTerminalCalls.length > 0) {
      // keep history well-formed for Gemini: only push when more tool results follow
      messages.push(msg);
      for (const call of nonTerminalCalls) {
        if (!("function" in call) || !call.function) continue;
        const outcome = executeTool(call.function.name, call.function.arguments, req);
        if (outcome.createdJourney) detectedJourney = outcome.createdJourney;
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(outcome.payload),
        });
      }
    }

    if (hadSuggestActions) {
      for (const call of msg.tool_calls) {
        if ("function" in call && call.function?.name === "suggest_actions") {
          const outcome = executeTool("suggest_actions", call.function.arguments, req);
          if (outcome.actions?.length) pendingActions = outcome.actions;
        }
      }
      // never re-query the model from a truncated/assistant-ending history
      return {
        reply: terminalText ?? (pendingActions?.length ? "Here's what you can do right now:" : ""),
        detection: detectedJourney
          ? { lifeEvent: detectedJourney.lifeEvent, entities: detectedJourney.entities, journey: detectedJourney }
          : undefined,
        actions: pendingActions,
      };
    }
  }

  return {
    reply: "That involved a lot of lookups — try asking again more specifically.",
    detection: detectedJourney
      ? { lifeEvent: detectedJourney.lifeEvent, entities: detectedJourney.entities, journey: detectedJourney }
      : undefined,
    actions: pendingActions,
  };
}
