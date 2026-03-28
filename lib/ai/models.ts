/**
 * Pinned AI model identifiers.
 * Update here to change the model used across the entire app.
 * Never hardcode model strings inline — always import from here.
 */

export const AI_MODELS = {
  /** Primary reasoning model: analysis, generation, long-form copy */
  CLAUDE_PRIMARY: "claude-sonnet-4-6",
  /** Fast model: classification, intent detection, short tasks */
  OPENAI_FAST: "gpt-4o-mini",
} as const;

export type ClaudeModel = (typeof AI_MODELS)["CLAUDE_PRIMARY"];
export type OpenAIModel = (typeof AI_MODELS)["OPENAI_FAST"];
