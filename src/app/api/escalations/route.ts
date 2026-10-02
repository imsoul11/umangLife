import { NextResponse } from "next/server";
import { getStore } from "@/lib/db";
import { resolveOwner } from "@/lib/identity";
import { clientKey, rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 100_000;

function guard(request: Request): NextResponse | null {
  const limit = rateLimit(`escalations:${clientKey(request)}`, { capacity: 30, refillPerMinute: 30 });
  if (limit.ok) return null;
  return NextResponse.json(
    { error: "Too many requests — slow down a little." },
    { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
  );
}

export async function GET(request: Request) {
  const blocked = guard(request);
  if (blocked) return blocked;
  const owner = resolveOwner(request);
  const raw = await getStore().get(`escalations:${owner.id}`);
  const res = NextResponse.json(raw ? JSON.parse(raw) : {});
  if (owner.setCookie) res.headers.set("Set-Cookie", owner.setCookie);
  return res;
}

export async function PUT(request: Request) {
  const blocked = guard(request);
  if (blocked) return blocked;
  const owner = resolveOwner(request);
  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }
  await getStore().set(`escalations:${owner.id}`, body);
  const res = new NextResponse(null, { status: 204 });
  if (owner.setCookie) res.headers.set("Set-Cookie", owner.setCookie);
  return res;
}
