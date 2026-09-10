import type { ChatMessage, CitizenProfile, DigilockerDocument, Journey } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

/**
 * The ONLY module callers use for persistence. Since the server-store commit
 * this is an API client over /api/session + /api/escalations (backed by
 * SQLite in src/lib/db.ts); the locale preference stays device-local.
 * Swapping the backend means changing the route handlers, not this contract.
 */

export interface SessionSnapshot {
  journeys?: Journey[];
  messages?: ChatMessage[];
  activeId?: string | null;
  profile?: CitizenProfile;
  docs?: DigilockerDocument[];
}

export interface EscalatedRecord {
  grievanceId: string;
  at: string;
}

export type EscalationMap = Record<string, EscalatedRecord>;

export async function loadSession(): Promise<SessionSnapshot | null> {
  try {
    const res = await fetch("/api/session", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as SessionSnapshot | null;
  } catch {
    return null;
  }
}

export async function saveSession(snapshot: SessionSnapshot): Promise<void> {
  try {
    await fetch("/api/session", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
    });
  } catch {
    // offline / server down — keep working in memory
  }
}

export async function clearSession(): Promise<void> {
  try {
    await fetch("/api/session", { method: "DELETE" });
  } catch {}
}

export async function loadEscalations(): Promise<EscalationMap> {
  try {
    const res = await fetch("/api/escalations", { cache: "no-store" });
    if (!res.ok) return {};
    return (await res.json()) as EscalationMap;
  } catch {
    return {};
  }
}

export async function saveEscalations(map: EscalationMap): Promise<void> {
  try {
    await fetch("/api/escalations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(map),
    });
  } catch {}
}

const LOCALE_KEY = "umanglife-locale";

export function loadLocale(): Locale | null {
  try {
    const v = localStorage.getItem(LOCALE_KEY);
    return v === "en" || v === "hi" ? v : null;
  } catch {
    return null;
  }
}

export function saveLocale(locale: Locale): void {
  localStorage.setItem(LOCALE_KEY, locale);
}
