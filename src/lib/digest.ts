import type { Journey } from "@/lib/types";
import { buildCalendar } from "@/lib/engine";

export interface DigestEntry {
  journey: string;
  task: string;
  service?: string;
  applicationRef?: string;
  overdueDays: number;
}

export interface SlaDigest {
  subject: string;
  text: string;
  overdue: DigestEntry[];
  warning: DigestEntry[];
}

/**
 * Pure SLA digest builder: turns journeys into the overdue/warning summary
 * that POST /api/digest emails (or previews). Unit-tested in digest.test.ts.
 */
export function buildSlaDigest(journeys: Journey[], now = new Date()): SlaDigest {
  const overdue: DigestEntry[] = [];
  const warning: DigestEntry[] = [];

  for (const j of journeys) {
    const title = j.title.replace(" Journey", "");
    for (const e of buildCalendar(j, now)) {
      if (e.severity === "info") continue;
      const entry: DigestEntry = {
        journey: `${j.emoji} ${title}`,
        task: e.title.replace(" — decision expected", ""),
        service: e.service,
        applicationRef: e.applicationRef,
        overdueDays: Math.round((now.getTime() - new Date(e.date).getTime()) / 86_400_000),
      };
      (e.severity === "urgent" ? overdue : warning).push(entry);
    }
  }

  const n = overdue.length;
  const subject =
    n === 0
      ? `[UMANG] ${warning.length} application(s) nearing their decision deadline`
      : `[UMANG] ${n} application(s) past their decision date — escalate now`;

  const lines: string[] = [];
  if (overdue.length) {
    lines.push("OVERDUE — expected decision date has passed:");
    for (const e of overdue) {
      lines.push(`  • ${e.journey} — ${e.task}${e.applicationRef ? ` (ref ${e.applicationRef})` : ""}: ${e.overdueDays} day(s) overdue`);
    }
  }
  if (warning.length) {
    lines.push(`${lines.length ? "\n" : ""}DUE SOON — within 5 days:`);
    for (const e of warning) {
      lines.push(`  • ${e.journey} — ${e.task}${e.applicationRef ? ` (ref ${e.applicationRef})` : ""}: decision expected in ${-e.overdueDays} day(s)`);
    }
  }
  if (!lines.length) lines.push("Nothing overdue or due soon. All applications are within their SLA windows.");

  return {
    subject,
    text: `Your UMANG government-application digest\n\n${lines.join("\n")}\n\nOpen your calendar: /calendar`,
    overdue,
    warning,
  };
}