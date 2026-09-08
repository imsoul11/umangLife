export type AiProvider = "gemini" | "openai";

/** Validates and returns the configured AI provider (default: gemini). */
export function aiProvider(): AiProvider {
  const p = process.env.AI_PROVIDER ?? "gemini";
  if (p !== "gemini" && p !== "openai") {
    throw new Error(`AI_PROVIDER must be "gemini" or "openai" — got "${p}"`);
  }
  return p;
}

/** Returns the provider's API key or throws with the exact env var to set. */
export function requireApiKey(provider: AiProvider): string {
  const name = provider === "gemini" ? "GEMINI_API_KEY" : "OPENAI_API_KEY";
  const value = process.env[name];
  if (!value) throw new Error(`${name} missing — set it in .env.local`);
  return value;
}
