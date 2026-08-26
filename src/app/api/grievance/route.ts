import { NextResponse } from "next/server";
import type { Journey, TaskInstance } from "@/lib/types";
import { getAIClient } from "@/lib/ai";

interface GrievanceRequest {
  task: TaskInstance;
  journey: Journey;
  profile: { name: string; state: string };
}

/**
 * Drafts a CPGRAMS-ready grievance from REAL journey facts only.
 * The model never invents — if given too little context it says so.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GrievanceRequest;
    if (!body.task || !body.journey) {
      return NextResponse.json({ error: "task and journey required" }, { status: 400 });
    }

    const t = body.task;
    const now = new Date();
    const submittedAt = t.submittedAt ? new Date(t.submittedAt) : null;
    const expected = submittedAt && t.slaDays ? new Date(submittedAt.getTime() + t.slaDays * 86_400_000) : null;
    const overdueDays = expected ? Math.max(0, Math.floor((now.getTime() - expected.getTime()) / 86_400_000)) : 0;

    const facts = [
      `Applicant: ${body.profile.name}, ${body.profile.state}`,
      `Service: ${t.service} — ${t.title}`,
      `Application ref: ${t.applicationRef ?? "N/A"}`,
      t.submittedAt ? `Submitted: ${submittedAt!.toLocaleDateString("en-IN")}` : null,
      expected ? `Expected decision by: ${expected.toLocaleDateString("en-IN")}` : null,
      `Within expected SLA: ${expected ? (expected.getTime() >= now.getTime() ? "YES — still within window" : `NO — overdue by ${overdueDays} day${overdueDays !== 1 ? "s" : ""}`) : "no SLA set"}`,
      `Journey: ${body.journey.emoji} ${body.journey.title} — ${body.journey.tasks.filter((x) => x.status === "done").length}/${body.journey.tasks.length} steps done`,
      t.status === "in_progress" ? "Current status: under department processing / verification." : `Current status: ${t.status}.`,
    ].filter(Boolean);

    const { client, model } = getAIClient();
    const res = await client.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You draft citizen grievances for filing on CPGRAMS (India's centralised public grievance redressal system).
STRICT RULES:
- Use ONLY the facts given. Never invent dates, numbers, application IDs, or outcomes.
- If the facts are too thin to draft (e.g. no reference number), say so honestly in "body" and ask for what's missing.
- Formal, courteous, one-page complaint: salutation, what was applied for and with which department, reference number, date submitted, current status, expected decision date, how long it is overdue (if at all), and a specific request for resolution.
- End with a polite request for acknowledgement and escalation to the concerned officer.
Return JSON only: {"subject": "<short line>", "body": "<full grievance text>"}`,
        },
        {
          role: "user",
          content: `FACTS:\n${facts.join("\n")}`,
        },
      ],
    });

    const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}") as {
      subject?: string;
      body?: string;
    };
    return NextResponse.json({
      subject: parsed.subject ?? "Complaint regarding pending government service",
      body: parsed.body ?? "Unable to draft grievance from available information.",
      facts,
    });
  } catch (err) {
    console.error("[grievance]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Grievance drafting failed" }, { status: 500 });
  }
}