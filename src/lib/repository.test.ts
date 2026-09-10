import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearSession,
  loadEscalations,
  loadLocale,
  loadSession,
  saveEscalations,
  saveLocale,
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
  vi.restoreAllMocks();
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

/** Fake fetch backed by a route table: "METHOD path" -> JSON body. */
function stubFetch(routes: Record<string, unknown>, failAll = false): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (failAll) throw new TypeError("network down");
      const method = (init?.method ?? "GET").toUpperCase();
      const url = String(input).replace(/^https?:\/\/[^/]+/, "");
      const body = routes[`${method} ${url}`] ?? (method === "GET" ? null : undefined);
      return new Response(body === undefined ? null : JSON.stringify(body), {
        status: method === "PUT" || method === "DELETE" ? 204 : 200,
      });
    }),
  );
}

describe("session repository (server API)", () => {
  it("loads a stored snapshot", async () => {
    stubFetch({ "GET /api/session": { journeys: [journey], messages: [message], activeId: "j1" } });
    await expect(loadSession()).resolves.toEqual({ journeys: [journey], messages: [message], activeId: "j1" });
  });

  it("returns null when the server has no snapshot", async () => {
    stubFetch({ "GET /api/session": null });
    await expect(loadSession()).resolves.toBeNull();
  });

  it("returns null instead of throwing when the network fails", async () => {
    stubFetch({}, true);
    await expect(loadSession()).resolves.toBeNull();
    await expect(saveSession({ journeys: [journey] })).resolves.toBeUndefined();
    await expect(clearSession()).resolves.toBeUndefined();
  });

  it("saves profile and document edits in the snapshot", async () => {
    const doc: DigilockerDocument = { type: "ADDRESS_PROOF", issuer: "Self uploaded", verified: true, fields: {} };
    const put = vi.fn();
    vi.stubGlobal("fetch", put.mockResolvedValue(new Response(null, { status: 204 })));
    await saveSession({ journeys: [journey], activeId: "j1", profile: { ...PROFILE, state: "Delhi" }, docs: [doc] });
    const [url, init] = put.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/session");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(String(init.body))).toEqual({ journeys: [journey], activeId: "j1", profile: { ...PROFILE, state: "Delhi" }, docs: [doc] });
  });
});

describe("escalations repository (server API)", () => {
  it("round-trips an escalation map and defaults to empty", async () => {
    stubFetch({ "GET /api/escalations": { "j1:a-sla": { grievanceId: "CPGRAMS-1", at: "2026-09-05T00:00:00.000Z" } } });
    await expect(loadEscalations()).resolves.toEqual({
      "j1:a-sla": { grievanceId: "CPGRAMS-1", at: "2026-09-05T00:00:00.000Z" },
    });
  });

  it("returns an empty map instead of throwing when the network fails", async () => {
    stubFetch({}, true);
    await expect(loadEscalations()).resolves.toEqual({});
    await expect(saveEscalations({})).resolves.toBeUndefined();
  });
});

describe("locale repository (device-local)", () => {
  it("round-trips the locale and rejects unknown values", () => {
    expect(loadLocale()).toBeNull();
    saveLocale("hi");
    expect(loadLocale()).toBe("hi");
    localStorage.setItem("umanglife-locale", "fr");
    expect(loadLocale()).toBeNull();
  });
});
