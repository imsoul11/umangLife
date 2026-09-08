import OpenAI from "openai";
import { aiProvider, requireApiKey } from "@/lib/env";

/**
 * Single AI entry point. Talks to Gemini through its OpenAI-compatible
 * endpoint; flip AI_PROVIDER=openai to swap providers with zero code change.
 */
export interface AIClient {
  client: OpenAI;
  model: string;
}

export function getAIClient(): AIClient {
  const provider = aiProvider();

  if (provider === "openai") {
    return {
      client: new OpenAI({ apiKey: requireApiKey("openai") }),
      model: process.env.AI_MODEL ?? "gpt-4o-mini",
    };
  }

  return {
    client: new OpenAI({
      apiKey: requireApiKey("gemini"),
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    }),
    model: process.env.AI_MODEL ?? "gemini-3.6-flash",
  };
}
