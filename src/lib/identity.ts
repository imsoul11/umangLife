import { randomUUID } from "node:crypto";
import { readAuthSession } from "@/lib/auth";

/**
 * Owner resolution: an authenticated session cookie wins; otherwise an
 * anonymous device cookie, minting one when absent.
 */
export interface Owner {
  id: string;
  /** Set-Cookie header value when a new identity was minted this request */
  setCookie?: string;
}

export const DEVICE_COOKIE = "umang_device";

export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(`${name}=`)) return trimmed.slice(name.length + 1);
  }
  return undefined;
}

export function resolveOwner(request: Request): Owner {
  const auth = readAuthSession(readCookie(request, "umang_auth"));
  if (auth) return { id: `user:${auth.userId}` };

  const device = readCookie(request, DEVICE_COOKIE);
  if (device) return { id: `device:${device}` };
  const id = randomUUID();
  return {
    id: `device:${id}`,
    setCookie: `${DEVICE_COOKIE}=${id}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly`,
  };
}
