import { NextResponse } from "next/server";
import { getKv } from "@/lib/db";
import { resolveOwner } from "@/lib/identity";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 1_000_000;

export async function GET(request: Request) {
  const owner = resolveOwner(request);
  const raw = getKv().get(`session:${owner.id}`);
  const res = NextResponse.json(raw ? JSON.parse(raw) : null);
  if (owner.setCookie) res.headers.set("Set-Cookie", owner.setCookie);
  return res;
}

export async function PUT(request: Request) {
  const owner = resolveOwner(request);
  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }
  getKv().set(`session:${owner.id}`, body);
  const res = new NextResponse(null, { status: 204 });
  if (owner.setCookie) res.headers.set("Set-Cookie", owner.setCookie);
  return res;
}

export async function DELETE(request: Request) {
  const owner = resolveOwner(request);
  getKv().del(`session:${owner.id}`);
  return new NextResponse(null, { status: 204 });
}
