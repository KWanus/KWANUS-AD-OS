import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Extract JSON from a Claude response. Handles:
 * - Clean JSON responses
 * - JSON wrapped in markdown code blocks
 * - JSON embedded in prose text
 * - Nested objects (greedy match to find outermost braces)
 */
export function extractJson<T = Record<string, unknown>>(raw: string): T {
  // Try direct parse first (cleanest case)
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed) as T;
    } catch {
      // Fall through to regex extraction
    }
  }

  // Try to find JSON in markdown code block
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim()) as T;
    } catch {
      // Fall through
    }
  }

  // Find outermost JSON object by matching braces
  const startIdx = trimmed.indexOf("{");
  if (startIdx === -1) throw new Error("No JSON object found in AI response");

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIdx; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) {
        const candidate = trimmed.slice(startIdx, i + 1);
        try {
          return JSON.parse(candidate) as T;
        } catch {
          throw new Error("Found JSON-like structure but failed to parse it");
        }
      }
    }
  }

  // Last resort: greedy regex (original approach)
  const match = trimmed.match(/\{[\s\S]+\}/);
  if (match) {
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      throw new Error("Found JSON-like structure but failed to parse it");
    }
  }

  throw new Error("No valid JSON found in AI response");
}

/**
 * Call Claude and extract JSON from the response.
 * Shared utility to replace the duplicated callClaude pattern across 21+ route files.
 */
export async function callClaude<T = Record<string, unknown>>(
  system: string,
  prompt: string,
  options?: {
    model?: string;
    maxTokens?: number;
  }
): Promise<T> {
  const r = await anthropic.messages.create({
    model: options?.model ?? "claude-sonnet-4-6",
    max_tokens: options?.maxTokens ?? 4096,
    system,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = r.content[0].type === "text" ? r.content[0].text : "{}";
  return extractJson<T>(raw);
}

// ─── Domain-Specific System Prompts ──────────────────────────────────────────

export const AFFILIATE_SYSTEM_PROMPT = `You are the world's best affiliate marketing strategist inside Himalaya Agency OS.
Return valid JSON only. No markdown. No commentary outside JSON.
Before generating any output, analyze what the TOP 1% 7-figure affiliate marketers do in this niche.
Study the best bridge pages, email sequences, ad angles, and traffic strategies used by super-affiliates.
Then produce outputs that BEAT those benchmarks.`;

export const AGENCY_SYSTEM_PROMPT = `You are the world's best digital marketing agency consultant inside Himalaya Agency OS.
Return valid JSON only. No markdown. No commentary outside JSON.
Before generating any output, analyze what TOP 1% agencies charge, deliver, and promise for this business type and niche.
Then produce outputs that BEAT those benchmarks.`;

export const LOCAL_SYSTEM_PROMPT = `You are the world's best local SEO and digital marketing expert inside Himalaya Agency OS.
Return valid JSON only. No markdown. No commentary outside JSON.
Before generating any output, analyze what the TOP 1% local marketing agencies charge and deliver for this niche/location.
Then produce outputs that BEAT those benchmarks — more specific, higher ROI, better positioned.`;

export const DROPSHIP_SYSTEM_PROMPT = `You are the world's best e-commerce and dropshipping strategist inside Himalaya Agency OS.
Return valid JSON only. No markdown. No commentary outside JSON.
Before generating any output, research what the TOP 1% Shopify stores and dropshippers do in this niche.
Analyze 7-figure store patterns, winning product characteristics, and viral ad strategies.
Then produce outputs that BEAT those benchmarks.`;

export const CONSULT_SYSTEM_PROMPT = `You are the world's best business consultant and proposal writer inside Himalaya Agency OS.
Return valid JSON only. No markdown. No commentary outside JSON.
Before generating any output, research what the TOP 1% of consultants and coaches in this exact niche charge, deliver, and say.
Then produce outputs that BEAT those benchmarks — sharper positioning, stronger value props, higher conversion.`;
