import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearSession,
  loadEscalations,
  loadSession,
  saveEscalations,
  saveSession,
} from "@/lib/repository";
import type { ChatMessage, DigilockerDocument, Journey } from "@/lib/types";

const store = new Map<string, string>();

beforeEach(() => {
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  store.clear();
});

const journey: Journey = {
  id: "j1",
  lifeEvent: "JOB_CHANGE",
  title: "Job change",
  emoji: "💼",
  createdAt: "2026-01-01T00:00:00.000Z",
  entities: {},
  tasks: [],
};

const message: ChatMessage = { role: "user", content: "hello", ts: 1 };

const PROFILE = {
  name: "Antas Jain",
  age: 27,
  gender: "male" as const,
  state: "Karnataka",
  occupation: "salaried" as const,
  annualIncomeInr: 450000,
  married: true,
  children: [],
  hasDisability: false,
  paysIncomeTax: true,
};

describe("session repository", () => {
  it("round-trips a snapshot", () => {
    saveSession({ journeys: [journey], messages: [message], activeId: "j1" });
    expect(loadSession()).toEqual({ journeys: [journey], messages: [message], activeId: "j1" });
  });

  it("round-trips profile and document edits", () => {
    const doc: DigilockerDocument = { type: "ADDRESS_PROOF", issuer: "Self uploaded", verified: true, fields: {} };
    saveSession({ journeys: [journey], activeId: "j1", profile: { ...PROFILE, state: "Delhi" }, docs: [doc] });
    const saved = loadSession();
    expect(saved?.profile?.state).toBe("Delhi");
    expect(saved?.docs).toEqual([doc]);
  });

  it("returns null when nothing is stored", () => {
    expect(loadSession()).toBeNull();
  });

  it("returns null on corrupted JSON instead of throwing", () => {
    localStorage.setItem("umanglife-session-v2", "{not json");
    expect(loadSession()).toBeNull();
  });

  it("clearSession removes the snapshot", () => {
    saveSession({ journeys: [journey] });
    clearSession();
    expect(loadSession()).toBeNull();
  });
});

describe("escalations repository", () => {
  it("round-trips an escalation map and defaults to empty", () => {
    expect(loadEscalations()).toEqual({});
    saveEscalations({ "j1:a-sla": { grievanceId: "CPGRAMS-1", at: "2026-09-05T00:00:00.000Z" } });
    expect(loadEscalations()).toEqual({
      "j1:a-sla": { grievanceId: "CPGRAMS-1", at: "2026-09-05T00:00:00.000Z" },
    });
  });

  it("returns an empty map on corrupted JSON instead of throwing", () => {
    localStorage.setItem("umanglife-grievances-v1", "]]]");
    expect(loadEscalations()).toEqual({});
  });
});
