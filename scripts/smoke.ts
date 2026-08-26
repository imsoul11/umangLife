import { computeTaskStatuses, matchSchemes } from "../src/lib/engine.ts";
import { JOB_CHANGE_TASKS } from "../src/data/journeys/job-change.ts";
import { SCHEMES } from "../src/data/schemes.ts";
import { MOCK_DIGILOCKER_DOCS, MOCK_PROFILE } from "../src/data/mocks.ts";

const journey = {
  id: "j1",
  lifeEvent: "JOB_CHANGE" as const,
  title: "Job change",
  emoji: "💼",
  createdAt: new Date().toISOString(),
  entities: {},
  tasks: JOB_CHANGE_TASKS.map((t) => ({ ...t, status: "locked" as const })),
};

const statuses = computeTaskStatuses(journey, MOCK_DIGILOCKER_DOCS);
console.log(
  "TASK STATUSES:",
  statuses.map((t) => `${t.id}=${t.status}`).join("  "),
);

const matches = matchSchemes(MOCK_PROFILE as never, SCHEMES);
console.log("\nELIGIBLE:", matches.filter((m) => m.eligible).map((m) => m.scheme.id));
console.log("FILTERED:", matches.filter((m) => !m.eligible).map((m) => m.scheme.id));
console.log(
  "\nWHY (first eligible):",
  matches.find((m) => m.eligible)?.matchedWhy,
);
