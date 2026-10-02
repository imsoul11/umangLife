import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Kv } from "@/lib/db";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "umang-kv-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("Kv (SQLite-backed)", () => {
  it("round-trips, overwrites and deletes values", async () => {
    const kv = new Kv(path.join(dir, "a.db"));
    expect(await kv.get("missing")).toBeNull();
    await kv.set("k", "v1");
    expect(await kv.get("k")).toBe("v1");
    await kv.set("k", "v2");
    expect(await kv.get("k")).toBe("v2");
    await kv.del("k");
    expect(await kv.get("k")).toBeNull();
    kv.close();
  });

  it("persists across connections to the same file", async () => {
    new Kv(path.join(dir, "b.db")).set("k", "persisted");
    const kv = new Kv(path.join(dir, "b.db"));
    expect(await kv.get("k")).toBe("persisted");
    kv.close();
  });

  it("rekeys a prefix for owner migration", async () => {
    const kv = new Kv(path.join(dir, "c.db"));
    await kv.set("session:device:abc", "s1");
    await kv.set("escalations:device:abc", "e1");
    await kv.set("session:other", "keep");
    await kv.rekeyPrefix("session:device:abc", "session:user:u1");
    await kv.rekeyPrefix("escalations:device:abc", "escalations:user:u1");
    expect(await kv.get("session:user:u1")).toBe("s1");
    expect(await kv.get("escalations:user:u1")).toBe("e1");
    expect(await kv.get("session:device:abc")).toBeNull();
    expect(await kv.get("escalations:device:abc")).toBeNull();
    expect(await kv.get("session:other")).toBe("keep");
    kv.close();
  });
});
