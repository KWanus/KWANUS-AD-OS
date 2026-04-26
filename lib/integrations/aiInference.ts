// ---------------------------------------------------------------------------
// Unified AI Inference — works with or without paid APIs
// Priority: 1) Anthropic Claude 2) OpenAI GPT 3) Groq (free Llama)
// 4) Template-based generation (zero API, always works)
//
// This means AI ALWAYS works. No paid dependency required.
// Groq offers free tier with Llama 3.3 70B — excellent for marketing copy.
// ---------------------------------------------------------------------------

export type AIInput = {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
};

export type AIResult = {
  ok: boolean;
  content: string;
  provider: "anthropic" | "openai" | "groq" | "template";
  model: string;
  error?: string;
};

// ── Anthropic Claude (best quality) ─────────────────────────────────────

async function generateWithAnthropic(input: AIInput): Promise<AIResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, content: "", provider: "anthropic", model: "none", error: "No key" };

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: input.maxTokens ?? 2000,
        system: input.systemPrompt ?? "You are a world-class marketing copywriter.",
        messages: [{ role: "user", content: input.prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, content: "", provider: "anthropic", model: "claude-sonnet-4", error: (err as Record<string, Record<string, string>>).error?.message ?? `HTTP ${res.status}` };
    }

    const data = await res.json();
    const text = data.content?.find((c: Record<string, string>) => c.type === "text")?.text ?? "";
    return { ok: true, content: text, provider: "anthropic", model: data.model ?? "claude-sonnet-4" };
  } catch (err) {
    return { ok: false, content: "", provider: "anthropic", model: "claude-sonnet-4", error: err instanceof Error ? err.message : "Failed" };
  }
}

// ── OpenAI GPT (good quality) ───────────────────────────────────────────

async function generateWithOpenAI(input: AIInput): Promise<AIResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { ok: false, content: "", provider: "openai", model: "none", error: "No key" };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: input.systemPrompt ?? "You are a world-class marketing copywriter." },
          { role: "user", content: input.prompt },
        ],
        max_tokens: input.maxTokens ?? 2000,
        temperature: input.temperature ?? 0.8,
      }),
    });

    if (!res.ok) return { ok: false, content: "", provider: "openai", model: "gpt-4o-mini", error: `HTTP ${res.status}` };

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    return { ok: true, content: text, provider: "openai", model: "gpt-4o-mini" };
  } catch (err) {
    return { ok: false, content: "", provider: "openai", model: "gpt-4o-mini", error: err instanceof Error ? err.message : "Failed" };
  }
}

// ── Groq (FREE — Llama 3.3 70B) ────────────────────────────────────────

async function generateWithGroq(input: AIInput): Promise<AIResult> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return { ok: false, content: "", provider: "groq", model: "none", error: "No key" };

  // Import rate limiter
  const { rateLimit } = await import("@/lib/utils/rateLimiter");

  // RATE LIMIT - Enforce 2-second minimum delay to avoid bans
  await rateLimit("groq");

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: input.systemPrompt ?? "You are a world-class marketing copywriter." },
          { role: "user", content: input.prompt },
        ],
        max_tokens: input.maxTokens ?? 2000,
        temperature: input.temperature ?? 0.8,
      }),
    });

    // Handle rate limiting (429)
    if (res.status === 429) {
      console.warn("[Groq] Rate limited (429) — will retry with exponential backoff");
      return { ok: false, content: "", provider: "groq", model: "llama-3.3-70b", error: "Rate limited (429)" };
    }

    // Handle banned account or invalid key (400)
    if (res.status === 400) {
      const errorData = await res.json().catch(() => null);
      console.error("[Groq] HTTP 400 — Account may be banned or API key invalid:", errorData);
      return { ok: false, content: "", provider: "groq", model: "llama-3.3-70b", error: "Banned or invalid key (400)" };
    }

    if (!res.ok) return { ok: false, content: "", provider: "groq", model: "llama-3.3-70b", error: `HTTP ${res.status}` };

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    return { ok: true, content: text, provider: "groq", model: "llama-3.3-70b" };
  } catch (err) {
    return { ok: false, content: "", provider: "groq", model: "llama-3.3-70b", error: err instanceof Error ? err.message : "Failed" };
  }
}

// ── Template fallback (ZERO API, always works) ──────────────────────────

function generateWithTemplate(input: AIInput): AIResult {
  // Extract key context from the prompt to generate useful output
  const prompt = input.prompt.toLowerCase();

  let content = "";

  if (prompt.includes("headline") || prompt.includes("hook")) {
    content = "Get Real Results — Proven by Thousands. No Risk, No Guesswork. Start Today and See the Difference Within 7 Days. Your Success Is Our Only Mission.";
  } else if (prompt.includes("email") || prompt.includes("subject")) {
    content = "Subject: You made the right call — here's what happens next\n\nHey there,\n\nThank you for taking action. Most people think about it but never do. You're different.\n\nHere's what to expect:\n1. You'll see your first results within the first week\n2. By day 14, the momentum builds\n3. By day 30, you'll wonder why you didn't start sooner\n\nIf you have any questions, reply to this email. I read every response.\n\nTo your success,\nThe Team";
  } else if (prompt.includes("ad") || prompt.includes("facebook") || prompt.includes("tiktok")) {
    content = "Stop scrolling. If you've been struggling with [your challenge], this is for you.\n\nI was in the same spot 6 months ago. Tried everything. Nothing worked.\n\nThen I found a different approach — and everything changed.\n\nThe results? Real. Measurable. Fast.\n\nClick the link to see exactly how it works. No hype. Just results.\n\n→ [CTA Link]";
  } else if (prompt.includes("blog") || prompt.includes("article")) {
    content = "# How to Get Real Results: The Complete Guide\n\nMost people approach this the wrong way. They focus on the wrong things, waste time on tactics that don't work, and eventually give up.\n\nBut what if there was a simpler way?\n\n## The Problem\n\nThe core issue is that most approaches address symptoms, not root causes.\n\n## The Solution\n\nA systematic approach that targets the actual problem produces dramatically better results.\n\n## How to Get Started\n\n1. Start with the fundamentals\n2. Build on what works\n3. Measure and adjust\n\n## Conclusion\n\nThe best time to start was yesterday. The second best time is now.";
  } else if (prompt.includes("proposal")) {
    content = "# Growth Proposal\n\n## Executive Summary\nAfter analyzing your current situation, we've identified 3 key opportunities to accelerate growth.\n\n## The Opportunity\nYour business has strong fundamentals but is leaving significant revenue on the table.\n\n## Our Solution\nA systematic approach to optimize your funnel, improve conversion rates, and scale your best-performing channels.\n\n## Investment\nStarting at $997/month with a satisfaction guarantee.\n\n## Next Steps\nBook a call to discuss your specific situation.";
  } else {
    // Extract niche/topic from prompt for better template content
    const nicheMatch = input.prompt.match(/for\s+"?([^".\n]+)"?/i);
    const niche = nicheMatch?.[1] ?? "your business";
    content = `Here's a proven approach for ${niche}:\n\n1. Identify your ideal customer — who has the problem you solve?\n2. Create a clear offer — what do they get, what does it cost, what's the guarantee?\n3. Build a simple funnel — landing page → email capture → follow-up sequence\n4. Drive traffic — start with organic content (TikTok/Reels), then add $20/day paid ads\n5. Optimize — kill what doesn't work, double down on what does\n\nThe key is speed of execution. Don't overthink. Launch, measure, improve.\n\nFor more personalized content, add a free AI key:\n- Groq (FREE): console.groq.com/keys — Llama 3.3 70B\n- This takes 30 seconds and dramatically improves all generated content.`;
  }

  return { ok: true, content, provider: "template", model: "template-v1" };
}

// ── Unified generate — tries each provider in order ─────────────────────

export async function generateAI(input: AIInput): Promise<AIResult> {
  // 1. Try Anthropic (best quality)
  if (process.env.ANTHROPIC_API_KEY) {
    const result = await generateWithAnthropic(input);
    if (result.ok) return result;
    console.warn(`[AI] Anthropic failed: ${result.error}. Trying OpenAI...`);
  }

  // 2. Try OpenAI
  if (process.env.OPENAI_API_KEY) {
    const result = await generateWithOpenAI(input);
    if (result.ok) return result;
    console.warn(`[AI] OpenAI failed: ${result.error}. Trying Groq...`);
  }

  // 3. Try Groq (FREE)
  if (process.env.GROQ_API_KEY) {
    const result = await generateWithGroq(input);
    if (result.ok) return result;
    console.warn(`[AI] Groq failed: ${result.error}. Using template...`);
  }

  // 4. Template fallback (always works)
  return generateWithTemplate(input);
}

/** Check what AI providers are available */
export function getAIProviderStatus(): {
  anthropic: boolean;
  openai: boolean;
  groq: boolean;
  any: boolean;
  best: string;
} {
  const anthropic = !!process.env.ANTHROPIC_API_KEY;
  const openai = !!process.env.OPENAI_API_KEY;
  const groq = !!process.env.GROQ_API_KEY;

  const best = anthropic ? "Anthropic Claude" : openai ? "OpenAI GPT-4o" : groq ? "Groq Llama 3.3 (free)" : "Template fallback (configure an AI provider for better results)";

  return { anthropic, openai, groq, any: anthropic || openai || groq, best };
}
