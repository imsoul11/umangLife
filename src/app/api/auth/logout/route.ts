import { NextResponse } from "next/server";
import { CLEAR_AUTH_COOKIE, destroyAuthSession } from "@/lib/auth";
import { readCookie } from "@/lib/identity";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  destroyAuthSession(readCookie(request, "umang_auth"));
  return NextResponse.json({ ok: true }, { headers: { "Set-Cookie": CLEAR_AUTH_COOKIE } });
}
