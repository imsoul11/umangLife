import type { Journey, LifeEventId } from "@/lib/types";
import { JOURNEY_TEMPLATES } from "@/data/journeys";
import { JOURNEY_PRESENTATION } from "@/data/presentation";
import { MOCK_DIGILOCKER_DOCS, MOCK_PROFILE } from "@/data/mocks";
import { computeTaskStatuses, materializeTaskDefs } from "@/lib/engine";

const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString();

/**
 * Builds a demo session where several applications are genuinely in flight —
 * some with deadlines ahead, one already past its SLA — so the combined
 * calendar and the escalation flow have real content on first visit.
 */
export function buildDemoJourneys(): Journey[] {
  const mk = (ev: LifeEventId): Journey => {
    const meta = JOURNEY_PRESENTATION[ev];
    const defs = materializeTaskDefs(JOURNEY_TEMPLATES[ev], MOCK_PROFILE);
    return {
      id: crypto.randomUUID(),
      lifeEvent: ev,
      title: meta.title,
      emoji: meta.emoji,
      createdAt: daysAgo(40),
      entities: ev === "JOB_CHANGE" ? { fromState: "Maharashtra", toState: "Karnataka", employerName: "TCS" } : {},
      tasks: defs.map((d) => ({ ...d as object, status: "locked" }) as Journey["tasks"][number]),
    };
  };

  const job = mk("JOB_CHANGE");
  job.tasks = job.tasks.map((t) => {
    if (["verify-identity", "new-employer-tax", "address-update", "state-benefits"].includes(t.id)) {
      return { ...t, status: "done", completedAt: daysAgo(35) };
    }
    if (t.id === "activate-uan" || t.id === "uan-kyc") return { ...t, status: "ready" };
    if (t.id === "pf-transfer") {
      return {
        ...t,
        status: "in_progress",
        submittedAt: daysAgo(18),
        applicationRef: "EP-48213",
        submittedValues: { prevMemberId: "MH/TOR/0023457", currentEmployer: "TCS", attestBy: "Present employer", reason: "Change of employment (EPF only)" },
      };
    }
    return t;
  });
  job.tasks = computeTaskStatuses(job, MOCK_DIGILOCKER_DOCS);

  const car = mk("VEHICLE_PURCHASE");
  car.tasks = car.tasks.map((t) => {
    if (["collect-seller-docs", "clear-challans", "puc-renew"].includes(t.id)) {
      return { ...t, status: "done", completedAt: daysAgo(34) };
    }
    if (t.id === "insurance-transfer") {
      return {
        ...t,
        status: "in_progress",
        submittedAt: daysAgo(6),
        applicationRef: "IN-771203",
        submittedValues: { policyNumber: "MOT/2026/88412", insurer: "ICICI Lombard", newOwnerName: "Antas Jain", saleProof: "Yes — sale letter/Form 29 copy" },
      };
    }
    if (t.id === "rc-ownership-transfer") {
      return {
        ...t,
        status: "in_progress",
        submittedAt: daysAgo(40),
        applicationRef: "TR-559003",
        submittedValues: { regNumber: "MH12QR4567", chassisLast5: "88214", engineLast5: "45109", buyerAddress: "12/3 Indiranagar, Bengaluru", insuranceValid: "Yes", purchaseDate: "2026-07-10" },
      };
    }
    if (t.id === "fastag-update") return { ...t, status: "ready" };
    return t;
  });
  car.tasks = computeTaskStatuses(car, MOCK_DIGILOCKER_DOCS);

  return [job, car];
}