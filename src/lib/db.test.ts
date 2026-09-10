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
  it("round-trips, overwrites and deletes values", () => {
    const kv = new Kv(path.join(dir, "a.db"));
    expect(kv.get("missing")).toBeNull();
    kv.set("k", "v1");
    expect(kv.get("k")).toBe("v1");
    kv.set("k", "v2");
    expect(kv.get("k")).toBe("v2");
    kv.del("k");
    expect(kv.get("k")).toBeNull();
    kv.close();
  });

  it("persists across connections to the same file", () => {
    new Kv(path.join(dir, "b.db")).set("k", "persisted");
    const kv = new Kv(path.join(dir, "b.db"));
    expect(kv.get("k")).toBe("persisted");
    kv.close();
  });

  it("rekeys a prefix for owner migration", () => {
    const kv = new Kv(path.join(dir, "c.db"));
    kv.set("session:device:abc", "s1");
    kv.set("escalations:device:abc", "e1");
    kv.set("session:other", "keep");
    kv.rekeyPrefix("session:device:abc", "session:user:u1");
    kv.rekeyPrefix("escalations:device:abc", "escalations:user:u1");
    expect(kv.get("session:user:u1")).toBe("s1");
    expect(kv.get("escalations:user:u1")).toBe("e1");
    expect(kv.get("session:device:abc")).toBeNull();
    expect(kv.get("escalations:device:abc")).toBeNull();
    expect(kv.get("session:other")).toBe("keep");
    kv.close();
  });
});
