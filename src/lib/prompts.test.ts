import { describe, expect, it } from "vitest";
import { buildSystemPrompt } from "@/lib/prompts";
import { MOCK_PROFILE } from "@/data/mocks";

const PROMPT = () => buildSystemPrompt(MOCK_PROFILE, [], undefined);

describe("buildSystemPrompt", () => {
  it("stays in English by default and when locale is en", () => {
    expect(PROMPT()).not.toContain("हिंदी");
    expect(buildSystemPrompt(MOCK_PROFILE, [], undefined, "en")).not.toContain("हिंदी");
  });

  it("directs Hindi replies and keeps official names in English form", () => {
    const prompt = buildSystemPrompt(MOCK_PROFILE, [], undefined, "hi");
    expect(prompt).toContain("Reply ONLY in Hindi (Devanagari script)");
    expect(prompt).toContain("EPFO, PAN, Aadhaar");
  });
});
