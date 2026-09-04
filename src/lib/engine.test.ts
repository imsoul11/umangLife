import { describe, expect, it } from "vitest";
import {
  buildCalendar,
  byUrgencyDesc,
  computeTaskStatuses,
  computeUrgency,
  materializeTaskDefs,
  matchSchemes,
  nextAvailableTasks,
} from "@/lib/engine";
import type {
  CitizenProfile,
  DigilockerDocument,
  Journey,
  Scheme,
  TaskDef,
  TaskInstance,
} from "@/lib/types";

const DOCS: DigilockerDocument[] = [
  { type: "AADHAAR", issuer: "UIDAI", verified: true, fields: { name: "Antas Jain" } },
  { type: "PAN", issuer: "Income Tax Dept", verified: true, fields: {} },
];

function task(overrides: Partial<TaskInstance> & Pick<TaskInstance, "id">): TaskInstance {
  return {
    title: overrides.id,
    description: "",
    service: "EPFO",
    dependsOn: [],
    status: "locked",
    ...overrides,
  };
}

function journey(tasks: TaskInstance[]): Journey {
  return {
    id: "j1",
    lifeEvent: "JOB_CHANGE",
    title: "Job change",
    emoji: "💼",
    createdAt: "2026-01-01T00:00:00.000Z",
    entities: {},
    tasks,
  };
}

const PROFILE: CitizenProfile = {
  name: "Antas Jain",
  age: 27,
  gender: "male",
  state: "Karnataka",
  occupation: "salaried",
  annualIncomeInr: 1200000,
  married: false,
  children: [],
  hasDisability: false,
  paysIncomeTax: true,
};

function scheme(criteria: Scheme["criteria"]): Scheme {
  return {
    id: "s1",
    name: "Test Scheme",
    department: "Test Dept",
    level: "central",
    benefits: ["₹5,000"],
    criteria,
    sourceUrl: "https://example.gov.in/s1",
    lastUpdated: "2026-08-01",
  };
}

describe("computeTaskStatuses", () => {
  it("keeps root tasks ready and locks tasks with unfinished deps", () => {
    const [a, b] = computeTaskStatuses(
      journey([task({ id: "a" }), task({ id: "b", dependsOn: ["a"] })]),
      DOCS,
    );
    expect(a.status).toBe("ready");
    expect(b.status).toBe("locked");
  });

  it("marks a task ready when deps are done and required docs exist", () => {
    const [, b] = computeTaskStatuses(
      journey([
        task({ id: "a", status: "done" }),
        task({ id: "b", dependsOn: ["a"], requiredDocs: ["AADHAAR"] }),
      ]),
      DOCS,
    );
    expect(b.status).toBe("ready");
  });

  it("marks a task action_required when a required doc is missing", () => {
    const [, b] = computeTaskStatuses(
      journey([
        task({ id: "a", status: "done" }),
        task({ id: "b", dependsOn: ["a"], requiredDocs: ["ADDRESS_PROOF"] }),
      ]),
      DOCS,
    );
    expect(b.status).toBe("action_required");
  });

  it("leaves done and submitted tasks untouched", () => {
    const done = task({ id: "a", status: "done" });
    const submitted = task({
      id: "b",
      status: "in_progress",
      submittedAt: "2026-09-01T00:00:00.000Z",
      dependsOn: ["a"],
    });
    const result = computeTaskStatuses(journey([done, submitted]), DOCS);
    expect(result[0]).toBe(done);
    expect(result[1]).toBe(submitted);
  });
});

describe("nextAvailableTasks", () => {
  it("returns only ready tasks", () => {
    const tasks = [
      task({ id: "a", status: "locked" }),
      task({ id: "b", status: "ready" }),
      task({ id: "c", status: "in_progress" }),
      task({ id: "d", status: "ready" }),
    ];
    expect(nextAvailableTasks(tasks).map((t) => t.id)).toEqual(["b", "d"]);
  });
});

describe("materializeTaskDefs", () => {
  const vehicleTask: TaskDef = {
    ...task({ id: "vehicle" }),
    requiresProfile: [{ label: "Owns a vehicle", field: "ownsVehicle", op: "eq", value: true }],
  };
  const universalTask: TaskDef = task({ id: "pf" });

  it("drops conditional tasks whose predicates fail", () => {
    expect(materializeTaskDefs([vehicleTask, universalTask], PROFILE).map((t) => t.id)).toEqual([
      "pf",
    ]);
  });

  it("keeps conditional tasks whose predicates hold", () => {
    const owner = { ...PROFILE, ownsVehicle: true };
    expect(materializeTaskDefs([vehicleTask, universalTask], owner).map((t) => t.id)).toEqual([
      "vehicle",
      "pf",
    ]);
  });

  it("supports the full predicate language", () => {
    const stateTask: TaskDef = {
      ...task({ id: "state" }),
      requiresProfile: [
        { label: "South state", field: "state", op: "in", value: ["Karnataka", "Kerala"] },
      ],
    };
    expect(materializeTaskDefs([stateTask], PROFILE)).toHaveLength(1);
    expect(materializeTaskDefs([stateTask], { ...PROFILE, state: "Delhi" })).toHaveLength(0);
  });
});

describe("matchSchemes", () => {
  const salariedScheme = scheme([
    { label: "Karnataka resident", field: "state", op: "eq", value: "Karnataka" },
    { label: "Salaried", field: "occupation", op: "eq", value: "salaried" },
  ]);

  it("matches all criteria and scores 1 for a fully eligible profile", () => {
    const [match] = matchSchemes(PROFILE, [salariedScheme]);
    expect(match.eligible).toBe(true);
    expect(match.unmet).toEqual([]);
    expect(match.score).toBe(1);
    expect(match.matchedWhy).toHaveLength(2);
  });

  it("reports unmet criteria and fractional score", () => {
    const [match] = matchSchemes({ ...PROFILE, occupation: "farmer" }, [salariedScheme]);
    expect(match.eligible).toBe(false);
    expect(match.unmet).toEqual(["Salaried"]);
    expect(match.score).toBe(0.5);
  });

  it("sorts eligible schemes before ineligible ones", () => {
    const ineligible = scheme([
      { label: "Female", field: "gender", op: "eq", value: "female" },
      { label: "Salaried", field: "occupation", op: "eq", value: "salaried" },
    ]);
    const [first, second] = matchSchemes(PROFILE, [ineligible, salariedScheme]);
    expect(first.eligible).toBe(true);
    expect(second.eligible).toBe(false);
  });

  it("resolves derived profile fields (childCount, youngestGirlChildAge)", () => {
    const childCountScheme = scheme([
      { label: "Has a child", field: "childCount", op: "gte", value: 1 },
    ]);
    const girlScheme = scheme([
      { label: "Daughter under 11", field: "youngestGirlChildAge", op: "lte", value: 10 },
    ]);
    const parent = {
      ...PROFILE,
      children: [
        { age: 8, gender: "female" as const },
        { age: 12, gender: "male" as const },
      ],
    };
    expect(matchSchemes(parent, [childCountScheme])[0].eligible).toBe(true);
    expect(matchSchemes(parent, [girlScheme])[0].eligible).toBe(true);
    expect(matchSchemes(PROFILE, [childCountScheme])[0].eligible).toBe(false);
    expect(matchSchemes(PROFILE, [girlScheme])[0].eligible).toBe(false);
  });
});

describe("computeUrgency", () => {
  const NOW = new Date("2026-09-05T00:00:00.000Z");
  const hint = { kind: "money_at_risk" as const, consequence: "CPF lapses", base: 50 };

  it("returns null when the task has no urgency hint", () => {
    expect(computeUrgency(task({ id: "a" }), NOW)).toBeNull();
  });

  it("boosts ready tasks by +8 and action_required by +10", () => {
    expect(computeUrgency(task({ id: "a", status: "ready", urgency: hint }), NOW)?.score).toBe(58);
    expect(
      computeUrgency(task({ id: "a", status: "action_required", urgency: hint }), NOW)?.score,
    ).toBe(60);
  });

  it("adds +40 when the SLA is breached", () => {
    const t = task({
      id: "a",
      status: "in_progress",
      submittedAt: "2026-08-26T00:00:00.000Z",
      slaDays: 7,
      urgency: hint,
    });
    expect(computeUrgency(t, NOW)?.score).toBe(90);
  });

  it("adds +20 when past 75% of the SLA but not breached", () => {
    const t = task({
      id: "a",
      status: "in_progress",
      submittedAt: "2026-08-28T00:00:00.000Z",
      slaDays: 10,
      urgency: hint,
    });
    expect(computeUrgency(t, NOW)?.score).toBe(70);
  });

  it("adds no SLA bonus while comfortably within the window", () => {
    const t = task({
      id: "a",
      status: "in_progress",
      submittedAt: "2026-09-01T00:00:00.000Z",
      slaDays: 20,
      urgency: hint,
    });
    expect(computeUrgency(t, NOW)?.score).toBe(50);
  });

  it("returns the correct chip for each urgency kind", () => {
    const kinds = [
      { kind: "legal_deadline" as const, chip: "⚖️ Legal deadline" },
      { kind: "money_at_risk" as const, chip: "💸 Money at risk" },
      { kind: "gateway" as const, chip: "⛓️ Unblocks next steps" },
      { kind: "civic" as const, chip: "🗳️ Recommended" },
    ];
    for (const { kind, chip } of kinds) {
      expect(computeUrgency(task({ id: "a", urgency: { ...hint, kind } }), NOW)?.chip).toBe(chip);
    }
  });
});

describe("byUrgencyDesc", () => {
  it("sorts most urgent first and sinks tasks without hints", () => {
    const hint = (base: number) => ({
      kind: "gateway" as const,
      consequence: "blocks next steps",
      base,
    });
    const sorted = [
      task({ id: "none" }),
      task({ id: "mid", urgency: hint(50) }),
      task({ id: "top", urgency: hint(90) }),
    ].sort(byUrgencyDesc);
    expect(sorted.map((t) => t.id)).toEqual(["top", "mid", "none"]);
  });
});

describe("buildCalendar", () => {
  const NOW = new Date("2026-09-05T00:00:00.000Z");

  it("builds SLA entries with correct severity buckets, sorted by date", () => {
    const entries = buildCalendar(
      journey([
        task({ id: "info", submittedAt: "2026-09-01T00:00:00.000Z", slaDays: 10 }),
        task({ id: "warning", submittedAt: "2026-09-01T00:00:00.000Z", slaDays: 5 }),
        task({ id: "urgent", submittedAt: "2026-08-20T00:00:00.000Z", slaDays: 5 }),
      ]),
      NOW,
    );
    expect(entries.map((e) => e.relatedTaskId)).toEqual(["urgent", "warning", "info"]);
    expect(entries.map((e) => e.severity)).toEqual(["urgent", "warning", "info"]);
    expect(entries.every((e) => e.reason === "sla_deadline" && e.id.endsWith("-sla"))).toBe(true);
  });

  it("skips tasks without an SLA or a submission date", () => {
    const entries = buildCalendar(
      journey([task({ id: "a" }), task({ id: "b", slaDays: 5 }), task({ id: "c", submittedAt: "2026-09-01T00:00:00.000Z" })]),
      NOW,
    );
    expect(entries).toEqual([]);
  });
});
