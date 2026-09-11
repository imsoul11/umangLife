import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getKv } from "@/lib/db";

const SESSION_TTL_MS = 7 * 86_400_000;
export const AUTH_COOKIE = "umang_auth";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export interface UserRecord {
  userId: string;
  email: string;
  name: string | null;
  passwordHash: string;
  createdAt: number;
}

const userKey = (email: string) => `user:${email.toLowerCase()}`;

export function getUser(email: string): UserRecord | null {
  const raw = getKv().get(userKey(email));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserRecord;
  } catch {
    return null;
  }
}

export function putUser(user: UserRecord): void {
  getKv().set(userKey(user.email), JSON.stringify(user));
}

export interface AuthSession {
  userId: string;
  email: string;
  name: string | null;
}

export function createAuthSession(user: { userId: string; email: string; name: string | null }): string {
  const token = randomBytes(32).toString("hex");
  getKv().set(`auth:${token}`, JSON.stringify({ ...user, exp: Date.now() + SESSION_TTL_MS }));
  return token;
}

export function readAuthSession(token: string | undefined): AuthSession | null {
  if (!token) return null;
  const raw = getKv().get(`auth:${token}`);
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as AuthSession & { exp: number };
    if (Date.now() > s.exp) {
      getKv().del(`auth:${token}`);
      return null;
    }
    return { userId: s.userId, email: s.email, name: s.name };
  } catch {
    return null;
  }
}

export function destroyAuthSession(token: string | undefined): void {
  if (token) getKv().del(`auth:${token}`);
}

/**
 * Carries an anonymous device's data over to an account on first login —
 * but never clobbers data the account already has.
 */
export function migrateDeviceData(deviceOwnerId: string, userOwnerId: string): void {
  if (deviceOwnerId === userOwnerId) return;
  const kv = getKv();
  for (const kind of ["session", "escalations"]) {
    const from = kv.get(`${kind}:${deviceOwnerId}`);
    if (from && !kv.get(`${kind}:${userOwnerId}`)) {
      kv.set(`${kind}:${userOwnerId}`, from);
    }
    kv.del(`${kind}:${deviceOwnerId}`);
  }
}

export const AUTH_COOKIE_MAX_AGE = 7 * 86_400;

export function authCookie(token: string): string {
  return `${AUTH_COOKIE}=${token}; Path=/; Max-Age=${AUTH_COOKIE_MAX_AGE}; SameSite=Lax; HttpOnly`;
}

export const CLEAR_AUTH_COOKIE = `${AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly`;
