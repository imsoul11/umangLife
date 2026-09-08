import { afterEach, describe, expect, it, vi } from "vitest";
import { aiProvider, requireApiKey } from "@/lib/env";

afterEach(() => vi.unstubAllEnvs());

describe("aiProvider", () => {
  it("defaults to gemini", () => {
    vi.stubEnv("AI_PROVIDER", "");
    delete process.env.AI_PROVIDER;
    expect(aiProvider()).toBe("gemini");
  });

  it("accepts both known providers", () => {
    vi.stubEnv("AI_PROVIDER", "openai");
    expect(aiProvider()).toBe("openai");
    vi.stubEnv("AI_PROVIDER", "gemini");
    expect(aiProvider()).toBe("gemini");
  });

  it("rejects unknown providers with a clear message", () => {
    vi.stubEnv("AI_PROVIDER", "claude");
    expect(() => aiProvider()).toThrowError('AI_PROVIDER must be "gemini" or "openai" — got "claude"');
  });
});

describe("requireApiKey", () => {
  it("throws with the exact env var name when missing", () => {
    delete process.env.GEMINI_API_KEY;
    expect(() => requireApiKey("gemini")).toThrowError("GEMINI_API_KEY missing — set it in .env.local");
    delete process.env.OPENAI_API_KEY;
    expect(() => requireApiKey("openai")).toThrowError("OPENAI_API_KEY missing — set it in .env.local");
  });

  it("returns the key when present", () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    expect(requireApiKey("gemini")).toBe("test-key");
  });
});
