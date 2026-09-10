import { NextResponse } from "next/server";
import { readAuthSession } from "@/lib/auth";
import { readCookie } from "@/lib/identity";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = readAuthSession(readCookie(request, "umang_auth"));
  return NextResponse.json({ user: session ? { email: session.email, name: session.name } : null });
}
