import { NextResponse } from "next/server";
import { authCookie, createAuthSession, getUser, hashPassword, migrateDeviceData, putUser } from "@/lib/auth";
import { DEVICE_COOKIE, readCookie } from "@/lib/identity";
import { randomUUID } from "node:crypto";
import { clientKey, rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limit = rateLimit(`auth-register:${clientKey(request)}`, { capacity: 10, refillPerMinute: 10 });
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many requests — try again shortly." }, { status: 429 });
  }
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string; name?: string } | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";
  if (!/.+@.+\..+/.test(email)) return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  if (getUser(email)) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });

  const user = {
    userId: randomUUID(),
    email,
    name: body?.name?.trim() || null,
    passwordHash: hashPassword(password),
    createdAt: Date.now(),
  };
  putUser(user);

  const device = readCookie(request, DEVICE_COOKIE);
  if (device) migrateDeviceData(`device:${device}`, `user:${user.userId}`);

  return NextResponse.json({ user: { email: user.email, name: user.name } }, {
    headers: { "Set-Cookie": authCookie(createAuthSession({ userId: user.userId, email: user.email, name: user.name })) },
  });
}
