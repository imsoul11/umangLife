import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Kv } from "@/lib/db";

type Auth = typeof import("@/lib/auth");

let dataDir: string;
let kv: Kv;
let mod: Auth;

beforeAll(async () => {
  dataDir = mkdtempSync(path.join(tmpdir(), "umang-auth-"));
  process.env.UMANG_DATA_DIR = dataDir;
  kv = (await import("@/lib/db")).getKv();
  mod = await import("@/lib/auth");
});

afterAll(() => {
  delete process.env.UMANG_DATA_DIR;
  rmSync(dataDir, { recursive: true, force: true });
});

describe("password hashing", () => {
  it("verifies the right password and rejects the wrong one", () => {
    const stored = mod.hashPassword("hunter2secret");
    expect(mod.verifyPassword("hunter2secret", stored)).toBe(true);
    expect(mod.verifyPassword("wrong", stored)).toBe(false);
    expect(mod.verifyPassword("hunter2secret", "nonsense")).toBe(false);
  });

  it("salts so identical passwords hash differently", () => {
    expect(mod.hashPassword("same")).not.toBe(mod.hashPassword("same"));
  });
});

describe("auth sessions", () => {
  it("creates, reads and destroys a session token", () => {
    const token = mod.createAuthSession({ userId: "u1", email: "a@b.co", name: null });
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(mod.readAuthSession(token)).toEqual({ userId: "u1", email: "a@b.co", name: null });
    mod.destroyAuthSession(token);
    expect(mod.readAuthSession(token)).toBeNull();
  });

  it("returns null for absent or malformed tokens", () => {
    expect(mod.readAuthSession(undefined)).toBeNull();
    expect(mod.readAuthSession("nope")).toBeNull();
  });
});

describe("user records", () => {
  it("round-trips users keyed by email case-insensitively", () => {
    mod.putUser({ userId: "u1", email: "A@B.co", name: "Antas", passwordHash: "s:h", createdAt: 1 });
    expect(mod.getUser("a@b.co")?.userId).toBe("u1");
    expect(mod.getUser("A@B.CO")?.userId).toBe("u1");
    expect(mod.getUser("nobody@x.co")).toBeNull();
  });
});

describe("device data migration", () => {
  it("moves device data into an empty account and cleans up", () => {
    kv.set("session:device:d1", JSON.stringify({ journeys: [1] }));
    kv.set("escalations:device:d1", JSON.stringify({ k: { grievanceId: "g", at: "t" } }));
    mod.migrateDeviceData("device:d1", "user:u1");
    expect(kv.get("session:user:u1")).toBe(JSON.stringify({ journeys: [1] }));
    expect(kv.get("escalations:user:u1")).toBeTruthy();
    expect(kv.get("session:device:d1")).toBeNull();
    expect(kv.get("escalations:device:d1")).toBeNull();
  });

  it("never clobbers existing account data", () => {
    kv.set("session:user:u2", JSON.stringify({ journeys: ["existing"] }));
    kv.set("session:device:d2", JSON.stringify({ journeys: [] }));
    mod.migrateDeviceData("device:d2", "user:u2");
    expect(kv.get("session:user:u2")).toBe(JSON.stringify({ journeys: ["existing"] }));
    expect(kv.get("session:device:d2")).toBeNull();
  });
});
