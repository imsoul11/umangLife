import type { ChatMessage, CitizenProfile, DigilockerDocument, Journey } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

/**
 * The ONLY module allowed to touch storage. Today that is localStorage;
 * swapping to a real database means reimplementing these functions as API
 * calls — no caller changes. (DB swap point)
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

const SESSION_KEY = "umanglife-session-v2";
const GRIEVANCE_KEY = "umanglife-grievances-v1";
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

export function loadSession(): SessionSnapshot | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionSnapshot) : null;
  } catch {
    return null;
  }
}

export function saveSession(snapshot: SessionSnapshot): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(snapshot));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function loadEscalations(): EscalationMap {
  try {
    const raw = localStorage.getItem(GRIEVANCE_KEY);
    return raw ? (JSON.parse(raw) as EscalationMap) : {};
  } catch {
    return {};
  }
}

export function saveEscalations(map: EscalationMap): void {
  localStorage.setItem(GRIEVANCE_KEY, JSON.stringify(map));
}
