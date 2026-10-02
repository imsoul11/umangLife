import { describe, expect, it } from "vitest";
import { buildSlaDigest } from "@/lib/digest";
import type { Journey, TaskInstance } from "@/lib/types";

const NOW = new Date("2026-09-05T00:00:00.000Z");

function journeyWith(id: string, emoji: string, title: string, tasks: TaskInstance[]): Journey {
  return { id, lifeEvent: "JOB_CHANGE", title, emoji, createdAt: "2026-01-01T00:00:00.000Z", entities: {}, tasks };
}

function slaTask(id: string, title: string, submittedAt: string, slaDays: number, ref?: string): TaskInstance {
  return { id, title, description: "", service: "EPFO", dependsOn: [], status: "in_progress", submittedAt, slaDays, applicationRef: ref };
}

describe("buildSlaDigest", () => {
  it("buckets overdue and due-soon entries with refs and day counts", () => {
    const digest = buildSlaDigest(
      [
        journeyWith("j1", "💼", "Job Change Journey", [
          slaTask("t1", "PF transfer decision", "2026-08-20T00:00:00.000Z", 5, "PF-123"),
          slaTask("t2", "UAN KYC decision", "2026-09-01T00:00:00.000Z", 5),
        ]),
      ],
      NOW,
    );
    expect(digest.overdue).toHaveLength(1);
    expect(digest.overdue[0]).toMatchObject({ journey: "💼 Job Change", task: "PF transfer decision", applicationRef: "PF-123", overdueDays: 11 });
    expect(digest.warning).toHaveLength(1);
    expect(digest.warning[0].overdueDays).toBe(-1);
    expect(digest.subject).toContain("1 application(s) past their decision date");
    expect(digest.text).toContain("OVERDUE");
    expect(digest.text).toContain("PF-123");
  });

  it("reports nothing pending when all applications are within SLA", () => {
    const digest = buildSlaDigest(
      [journeyWith("j1", "💼", "Job Change Journey", [slaTask("t1", "PF transfer decision", "2026-09-04T00:00:00.000Z", 30)])],
      NOW,
    );
    expect(digest.overdue).toHaveLength(0);
    expect(digest.warning).toHaveLength(0);
    expect(digest.subject).toContain("0 application(s) nearing");
    expect(digest.text).toContain("Nothing overdue");
  });

  it("handles journeys with no tracked applications", () => {
    const digest = buildSlaDigest([journeyWith("j1", "💼", "Job Change Journey", [{ id: "a", title: "a", description: "", service: "EPFO", dependsOn: [], status: "locked" }])], NOW);
    expect(digest.text).toContain("Nothing overdue");
  });
});