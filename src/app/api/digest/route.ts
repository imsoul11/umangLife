import { NextResponse } from "next/server";
import type { Journey } from "@/lib/types";
import { buildSlaDigest } from "@/lib/digest";
import { getStore } from "@/lib/db";
import { resolveOwner } from "@/lib/identity";
import { clientKey, rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/**
 * SLA email digest. Sends via Resend when RESEND_API_KEY + SLA_DIGEST_TO are
 * set; otherwise returns the digest as a preview so the demo still works.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`digest:${clientKey(request)}`, { capacity: 2, refillPerMinute: 2 });
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many requests — try again later." }, { status: 429 });
  }
  try {
    const owner = resolveOwner(request);
    const raw = await getStore().get(`session:${owner.id}`);
    const snapshot = raw ? (JSON.parse(raw) as { journeys?: Journey[] }) : {};
    const digest = buildSlaDigest(snapshot.journeys ?? []);

    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.SLA_DIGEST_TO;
    if (!apiKey || !to) {
      return NextResponse.json({ sent: false, reason: "RESEND_API_KEY/SLA_DIGEST_TO not configured", ...digest });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "UMANG Demo <onboarding@resend.dev>", to: [to], subject: digest.subject, text: digest.text }),
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Resend failed: ${err.slice(0, 200)}` }, { status: 502 });
    }
    return NextResponse.json({ sent: true, subject: digest.subject, overdue: digest.overdue.length, warning: digest.warning.length });
  } catch (err) {
    console.error("[digest]", err);
    return NextResponse.json({ error: "Digest failed" }, { status: 500 });
  }
}
