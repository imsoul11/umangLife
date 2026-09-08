import { NextResponse } from "next/server";
import type { ChatRequest } from "@/lib/types";
import { runChat } from "@/lib/chat";
import { clientKey, rateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const limit = rateLimit(`chat:${clientKey(request)}`, { capacity: 10, refillPerMinute: 10 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests — please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }
  try {
    const body = (await request.json()) as ChatRequest;
    if (!body.message || !body.profile) {
      return NextResponse.json({ error: "message and profile are required" }, { status: 400 });
    }
    const result = await runChat({
      message: body.message,
      profile: body.profile,
      journeys: body.journeys ?? [],
      focusedJourneyId: body.focusedJourneyId,
      history: body.history ?? [],
      docs: body.docs,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[chat]", err);
    const message = err instanceof Error ? err.message : "Chat failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
