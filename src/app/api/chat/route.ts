import { NextResponse } from "next/server";
import type { ChatRequest } from "@/lib/types";
import { runChat } from "@/lib/chat";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest;
    if (!body.message || !body.profile) {
      return NextResponse.json({ error: "message and profile are required" }, { status: 400 });
    }
    const result = await runChat({
      message: body.message,
      profile: body.profile,
      journeys: body.journeys ?? [],
      history: body.history ?? [],
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[chat]", err);
    const message = err instanceof Error ? err.message : "Chat failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
