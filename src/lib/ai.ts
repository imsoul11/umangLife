import OpenAI from "openai";

/**
 * Single AI entry point. Talks to Gemini through its OpenAI-compatible
 * endpoint; flip AI_PROVIDER=openai to swap providers with zero code change.
 */
export interface AIClient {
  client: OpenAI;
  model: string;
}

export function getAIClient(): AIClient {
  const provider = process.env.AI_PROVIDER ?? "gemini";

  if (provider === "openai") {
    return {
      client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
      model: process.env.AI_MODEL ?? "gpt-4o-mini",
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing — set it in .env.local");

  return {
    client: new OpenAI({
      apiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    }),
    model: process.env.AI_MODEL ?? "gemini-3.6-flash",
  };
}
