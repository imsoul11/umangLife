import { randomUUID } from "node:crypto";

/**
 * Resolves who owns the incoming request's data. Today: an anonymous device
 * cookie; auth (commit b) upgrades this to an authenticated user id and
 * migrates device data on login.
 */
export interface Owner {
  id: string;
  /** Set-Cookie header value when a new device identity was minted */
  setCookie?: string;
}

export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(`${name}=`)) return trimmed.slice(name.length + 1);
  }
  return undefined;
}

export const DEVICE_COOKIE = "umang_device";

export function resolveOwner(request: Request): Owner {
  const device = readCookie(request, DEVICE_COOKIE);
  if (device) return { id: `device:${device}` };
  const id = randomUUID();
  return {
    id: `device:${id}`,
    setCookie: `${DEVICE_COOKIE}=${id}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly`,
  };
}
