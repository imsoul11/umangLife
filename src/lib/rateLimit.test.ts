import { afterEach, describe, expect, it } from "vitest";
import { clientKey, rateLimit, resetRateLimits } from "@/lib/rateLimit";

afterEach(() => resetRateLimits());

describe("rateLimit", () => {
  const opts = { capacity: 3, refillPerMinute: 60 };
  const T0 = 1_000_000;

  it("allows requests up to capacity, then blocks with a retry hint", () => {
    expect(rateLimit("k", opts, T0).ok).toBe(true);
    expect(rateLimit("k", opts, T0).ok).toBe(true);
    expect(rateLimit("k", opts, T0).ok).toBe(true);
    const blocked = rateLimit("k", opts, T0);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("refills tokens as time passes", () => {
    const slow = { capacity: 3, refillPerMinute: 6 }; // 1 token per 10s
    for (let i = 0; i < 3; i++) rateLimit("k", slow, T0);
    expect(rateLimit("k", slow, T0).ok).toBe(false);
    // 10s later — exactly 1 token restored
    expect(rateLimit("k", slow, T0 + 10_000).ok).toBe(true);
    expect(rateLimit("k", slow, T0 + 10_000).ok).toBe(false);
  });

  it("never refills beyond capacity", () => {
    rateLimit("k", opts, T0);
    // 10 minutes later — still capped at 3 tokens
    for (let i = 0; i < 4; i++) rateLimit("k", opts, T0 + 600_000);
    expect(rateLimit("k", opts, T0 + 600_000).ok).toBe(false);
  });

  it("tracks keys independently", () => {
    for (let i = 0; i < 3; i++) rateLimit("a", opts, T0);
    expect(rateLimit("a", opts, T0).ok).toBe(false);
    expect(rateLimit("b", opts, T0).ok).toBe(true);
  });
});

describe("clientKey", () => {
  it("uses the first x-forwarded-for hop", () => {
    const req = new Request("https://x.local", { headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" } });
    expect(clientKey(req)).toBe("1.2.3.4");
  });

  it("falls back to a shared local key", () => {
    expect(clientKey(new Request("https://x.local"))).toBe("local");
  });
});
