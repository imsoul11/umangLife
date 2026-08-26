import type {
  CalendarEntry,
  CitizenProfile,
  DigilockerDocument,
  Journey,
  PredicateOp,
  Scheme,
  SchemeMatch,
  TaskDef,
  TaskInstance,
} from "@/lib/types";

/* ============================================================
   PURE FUNCTIONS — no LLM, no IO. Fully unit-testable.
   ============================================================ */

/** Recompute runtime status of every task from what's been completed. */
export function computeTaskStatuses(
  journey: Journey,
  availableDocs: DigilockerDocument[],
): TaskInstance[] {
  const done = new Set(
    journey.tasks.filter((t) => t.status === "done").map((t) => t.id),
  );
  const docTypes = new Set(availableDocs.map((d) => d.type));

  return journey.tasks.map((task) => {
    if (task.status === "done") return task;
    if (task.submittedAt) return task;

    const depsDone = task.dependsOn.every((d) => done.has(d));
    if (!depsDone) return { ...task, status: "locked" };

    const docsMissing = (task.requiredDocs ?? []).some((doc) => !docTypes.has(doc));
    if (docsMissing) return { ...task, status: "action_required" };

    return { ...task, status: "ready" };
  });
}

/** Tasks the citizen can act on RIGHT NOW — the "what do I do first?" answer. */
export function nextAvailableTasks(tasks: TaskInstance[]): TaskInstance[] {
  return tasks.filter((t) => t.status === "ready");
}

/**
 * Filter a journey template down to the tasks relevant to THIS citizen.
 * Conditional tasks (requiresProfile) drop out when predicates fail —
 * e.g. vehicle re-registration never appears for someone without a vehicle.
 */
export function materializeTaskDefs(defs: TaskDef[], profile: CitizenProfile): TaskDef[] {
  return defs.filter((def) =>
    (def.requiresProfile ?? []).every((c) =>
      testCriterion(resolveField(profile, c.field), c.op, c.value),
    ),
  );
}

/* ---------------- Eligibility engine ---------------- */

function resolveField(profile: CitizenProfile, field: string): unknown {
  const derived: Record<string, unknown> = {
    childCount: profile.children?.length ?? 0,
    youngestChildAge: profile.children?.length
      ? Math.min(...profile.children.map((c) => c.age))
      : undefined,
    youngestGirlChildAge:
      profile.children?.filter((c) => c.gender === "female").map((c) => c.age).sort((a, b) => a - b)[0] ??
      null,
  };
  if (field in derived && derived[field] !== undefined) return derived[field];
  return (profile as unknown as Record<string, unknown>)[field];
}

function testCriterion(actual: unknown, op: PredicateOp, expected: unknown): boolean {
  switch (op) {
    case "eq":
      return actual === expected;
    case "neq":
      return actual !== expected;
    case "gte":
      return typeof actual === "number" && actual >= (expected as number);
    case "lte":
      return typeof actual === "number" && actual <= (expected as number);
    case "in":
      return Array.isArray(expected) && expected.includes(actual);
    case "exists":
      return actual !== undefined && actual !== null;
  }
}

/**
 * Deterministic scheme matching. The LLM never decides eligibility —
 * it only explains results this engine produces.
 */
export function matchSchemes(profile: CitizenProfile, schemes: Scheme[]): SchemeMatch[] {
  return schemes
    .map((scheme) => {
      const matchedWhy: string[] = [];
      const unmet: string[] = [];
      for (const c of scheme.criteria) {
        const ok = testCriterion(resolveField(profile, c.field), c.op, c.value);
        (ok ? matchedWhy : unmet).push(c.label);
      }
      return {
        scheme,
        eligible: unmet.length === 0,
        matchedWhy,
        unmet,
        score: matchedWhy.length / scheme.criteria.length,
      };
    })
    .sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.score - a.score);
}

/* ---------------- Urgency ---------------- */

export interface TaskUrgency {
  score: number;
  chip: string; // short badge, e.g. "⚖️ Legal deadline"
  consequence: string;
}

/**
 * Deterministic prioritization: static stakes (legal/financial/gateway)
 * boosted by live state. The LLM never decides urgency.
 */
export function computeUrgency(task: TaskInstance, now = new Date()): TaskUrgency | null {
  const u = task.urgency;
  if (!u) return null;
  let score = u.base;

  if (task.status === "action_required") score += 10;
  if (task.status === "ready") score += 8;
  if (task.status === "in_progress" && task.submittedAt && task.slaDays) {
    const elapsedDays = (now.getTime() - new Date(task.submittedAt).getTime()) / 86_400_000;
    if (elapsedDays > task.slaDays) score += 40; // SLA breached — exception territory
    else if (elapsedDays > task.slaDays * 0.75) score += 20;
  }

  const chips = {
    legal_deadline: "⚖️ Legal deadline",
    money_at_risk: "💸 Money at risk",
    gateway: "⛓️ Unblocks next steps",
    civic: "🗳️ Recommended",
  } as const;

  return { score, chip: chips[u.kind], consequence: u.consequence };
}

/** Sort helper — most urgent first; tasks without hints sink to the bottom. */
export function byUrgencyDesc(a: TaskInstance, b: TaskInstance): number {
  return (computeUrgency(b)?.score ?? -1) - (computeUrgency(a)?.score ?? -1);
}

/* ---------------- Government calendar ---------------- */

export function buildCalendar(journey: Journey, now = new Date()): CalendarEntry[] {
  const entries: CalendarEntry[] = [];
  for (const task of journey.tasks) {
    if (!task.slaDays || !task.submittedAt) continue;
    const deadline = new Date(task.submittedAt);
    deadline.setDate(deadline.getDate() + task.slaDays);
    const daysLeft = Math.round((deadline.getTime() - now.getTime()) / 86_400_000);
    entries.push({
      id: `${task.id}-sla`,
      date: deadline.toISOString(),
      title: `${task.title} — decision expected`,
      reason: "sla_deadline",
      relatedTaskId: task.id,
      severity: daysLeft < 0 ? "urgent" : daysLeft <= 5 ? "warning" : "info",
      service: task.service,
      applicationRef: task.applicationRef,
      submittedAt: task.submittedAt,
    });
  }
  return entries.sort((a, b) => a.date.localeCompare(b.date));
}
