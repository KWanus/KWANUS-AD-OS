// ---------------------------------------------------------------------------
// Learning Engine — Himalaya gets smarter the more businesses it runs
// Stores what works per niche, learns conversion patterns, improves over time
//
// This is THE moat. Nobody else has a system that learns from aggregate
// business data across all users to improve recommendations for each one.
//
// Data flow:
// 1. User deploys → system generates assets → tracks performance
// 2. When a hook/email/headline performs well → store the PATTERN (not the copy)
// 3. Next time someone in the same niche deploys → use winning patterns
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";

export type WinningPattern = {
  id: string;
  niche: string;
  type: "headline" | "hook" | "email_subject" | "cta" | "offer_angle";
  pattern: string;          // The structural pattern, not the literal copy
  example: string;          // One anonymized example
  conversionRate: number;   // Aggregate conversion rate
  sampleSize: number;       // How many times tested
  confidence: "high" | "medium" | "low";
  tags: string[];
};

export type NicheInsight = {
  niche: string;
  businessesAnalyzed: number;
  topHeadlinePatterns: string[];
  topHookAngles: string[];
  avgConversionRate: number;
  avgOrderValue: number;
  bestPerformingChannel: string;
  commonWeaknesses: string[];
  recommendations: string[];
};

/** Record a performance signal — called when we know something worked */
export async function recordWin(input: {
  userId: string;
  niche: string;
  type: WinningPattern["type"];
  content: string;
  conversionRate: number;
  channel?: string;
}): Promise<void> {
  try {
    // Extract the PATTERN, not the literal copy
    const pattern = extractPattern(input.content, input.type);

    await prisma.himalayaFunnelEvent.create({
      data: {
        userId: input.userId,
        event: "learning_signal",
        metadata: {
          niche: input.niche.toLowerCase(),
          type: input.type,
          pattern,
          content: input.content.slice(0, 200), // Truncated for privacy
          conversionRate: input.conversionRate,
          channel: input.channel ?? "unknown",
        },
      },
    });
  } catch {
    // Learning is never blocking
  }
}

/** Record a loss — something that didn't work */
export async function recordLoss(input: {
  userId: string;
  niche: string;
  type: WinningPattern["type"];
  content: string;
  reason: string;
}): Promise<void> {
  try {
    await prisma.himalayaFunnelEvent.create({
      data: {
        userId: input.userId,
        event: "learning_signal_negative",
        metadata: {
          niche: input.niche.toLowerCase(),
          type: input.type,
          pattern: extractPattern(input.content, input.type),
          reason: input.reason,
        },
      },
    });
  } catch {
    // Never blocking
  }
}

/** Get winning patterns for a niche */
export async function getWinningPatterns(niche: string, type?: WinningPattern["type"]): Promise<WinningPattern[]> {
  const events = await prisma.himalayaFunnelEvent.findMany({
    where: {
      event: "learning_signal",
      metadata: {
        path: ["niche"],
        equals: niche.toLowerCase(),
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Aggregate by pattern
  const patternMap: Record<string, {
    pattern: string;
    examples: string[];
    rates: number[];
    type: string;
    niche: string;
  }> = {};

  for (const e of events) {
    const meta = e.metadata as Record<string, unknown>;
    if (type && meta.type !== type) continue;

    const pattern = meta.pattern as string;
    if (!patternMap[pattern]) {
      patternMap[pattern] = {
        pattern,
        examples: [],
        rates: [],
        type: meta.type as string,
        niche: meta.niche as string,
      };
    }
    patternMap[pattern].rates.push(meta.conversionRate as number);
    if (patternMap[pattern].examples.length < 3) {
      patternMap[pattern].examples.push((meta.content as string) ?? "");
    }
  }

  return Object.entries(patternMap)
    .map(([id, data]) => {
      const avgRate = data.rates.reduce((s, r) => s + r, 0) / data.rates.length;
      return {
        id,
        niche: data.niche,
        type: data.type as WinningPattern["type"],
        pattern: data.pattern,
        example: data.examples[0] ?? "",
        conversionRate: Math.round(avgRate * 100) / 100,
        sampleSize: data.rates.length,
        confidence: data.rates.length >= 10 ? "high" as const : data.rates.length >= 3 ? "medium" as const : "low" as const,
        tags: [],
      };
    })
    .sort((a, b) => b.conversionRate - a.conversionRate);
}

/** Build niche insights from aggregate data */
export async function getNicheInsights(niche: string): Promise<NicheInsight | null> {
  const patterns = await getWinningPatterns(niche);
  if (patterns.length === 0) return null;

  const headlines = patterns.filter((p) => p.type === "headline");
  const hooks = patterns.filter((p) => p.type === "hook");

  return {
    niche,
    businessesAnalyzed: new Set(patterns.map((p) => p.example.slice(0, 20))).size,
    topHeadlinePatterns: headlines.slice(0, 5).map((h) => h.pattern),
    topHookAngles: hooks.slice(0, 5).map((h) => h.pattern),
    avgConversionRate: patterns.reduce((s, p) => s + p.conversionRate, 0) / patterns.length,
    avgOrderValue: 0, // Would need order data aggregation
    bestPerformingChannel: "unknown",
    commonWeaknesses: [],
    recommendations: patterns.slice(0, 3).map((p) =>
      `Use "${p.pattern}" pattern — ${p.conversionRate}% avg conversion across ${p.sampleSize} tests`
    ),
  };
}

// ── Pattern Extraction ──────────────────────────────────────────────────

function extractPattern(content: string, type: WinningPattern["type"]): string {
  const lower = content.toLowerCase();

  // Structural patterns we can learn from
  const patterns: string[] = [];

  // Question vs statement
  if (content.endsWith("?")) patterns.push("question");
  else if (content.endsWith("!")) patterns.push("exclamation");
  else patterns.push("statement");

  // Contains number
  if (/\d/.test(content)) patterns.push("has-number");

  // Contains "you/your"
  if (/\byou\b|\byour\b/i.test(content)) patterns.push("second-person");

  // Pain-focused vs outcome-focused
  if (/stop|tired|frustrated|struggling|hate|sick of|done with/i.test(lower)) patterns.push("pain-focused");
  if (/get|achieve|become|transform|unlock|discover/i.test(lower)) patterns.push("outcome-focused");

  // Urgency
  if (/now|today|limited|last|hurry|before/i.test(lower)) patterns.push("urgency");

  // Social proof
  if (/\d+.*(?:customer|client|people|review)/i.test(lower)) patterns.push("social-proof");

  // Specificity
  if (/\d+%|\$\d|in \d+ day|\d+ step/i.test(lower)) patterns.push("specific");

  // Length category
  const words = content.split(/\s+/).length;
  if (words <= 7) patterns.push("short");
  else if (words <= 15) patterns.push("medium");
  else patterns.push("long");

  return patterns.join("+");
}
