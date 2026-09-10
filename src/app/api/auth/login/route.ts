import { NextResponse } from "next/server";
import { authCookie, createAuthSession, getUser, migrateDeviceData, verifyPassword } from "@/lib/auth";
import { DEVICE_COOKIE, readCookie } from "@/lib/identity";
import { clientKey, rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limit = rateLimit(`auth-login:${clientKey(request)}`, { capacity: 10, refillPerMinute: 10 });
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many attempts — try again shortly." }, { status: 429 });
  }
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  const user = getUser(email);
  if (!user || !verifyPassword(body?.password ?? "", user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const device = readCookie(request, DEVICE_COOKIE);
  if (device) migrateDeviceData(`device:${device}`, `user:${user.userId}`);

  return NextResponse.json({ user: { email: user.email, name: user.name } }, {
    headers: { "Set-Cookie": authCookie(createAuthSession({ userId: user.userId, email: user.email, name: user.name })) },
  });
}
