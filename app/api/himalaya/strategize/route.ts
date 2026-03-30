import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { DiagnosisPayload, ImproveDiagnosis, StrategyPayload } from "@/lib/himalaya/contracts";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Himalaya Strategy API — the decision brain.
 *
 * Takes DiagnosisPayload → returns StrategyPayload.
 * Decides what to generate, in what order, and what to defer.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      mode: "scratch" | "improve";
      diagnosis: DiagnosisPayload;
    };

    if (!process.env.ANTHROPIC_API_KEY) {
      // Fallback without AI
      return NextResponse.json({
        ok: true,
        mode: body.mode,
        strategy: fallbackStrategy(body.mode),
      });
    }

    const systemPrompt = `You are Himalaya's Strategy Engine — a business consultant that decides what to build, in what order, and why.

Return a JSON object (no markdown fences) with this exact structure:
{
  "summary": "1-2 sentence strategic assessment",
  "actions": [
    { "priority": 1, "action": "short action title", "why": "why this matters", "impact": "high", "engine": "profile" }
  ],
  "generateQueue": ["profile", "site", "email"],
  "defer": ["what to NOT build yet"]
}

Rules:
- Maximum 5 actions, ordered by priority
- Be specific and opinionated — you know the shortest path
- For scratch: always start with profile → site → email
- For improve: fix the biggest weakness first
- No motivational language. Decisions only.`;

    let userPrompt: string;

    if (body.mode === "scratch") {
      const d = body.diagnosis;
      userPrompt = `MODE: Starting from scratch
BUSINESS TYPE: ${d.businessType || "not specified"}
NICHE: ${d.niche || "not specified"}
GOAL: ${d.goal || "not specified"}
DESCRIPTION: ${("description" in d ? d.description : null) || "none"}
ARCHETYPE: ${("archetype" in d && d.archetype) ? JSON.stringify(d.archetype) : "none"}

Decide what to build first.`;
    } else {
      const d = body.diagnosis as ImproveDiagnosis;
      userPrompt = `MODE: Improving existing business
URL: ${d.url || "none"}
SCORE: ${d.score ?? "unknown"}/100
VERDICT: ${d.verdict || "unknown"}
STRENGTHS: ${d.strengths || "unknown"}
WEAKNESSES: ${d.weaknesses || "unknown"}
DIAGNOSTICS: ${d.diagnostics ? JSON.stringify(d.diagnostics) : "none"}
CHALLENGE: ${d.challenge || "not specified"}
DESCRIPTION: ${d.businessDescription || "none"}

Decide what to fix first.`;
    }

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
    const match = raw.match(/\{[\s\S]*\}/);

    if (!match) {
      return NextResponse.json({
        ok: true,
        mode: body.mode,
        strategy: fallbackStrategy(body.mode),
      });
    }

    const parsed = JSON.parse(match[0]);
    const strategy: StrategyPayload = { ...parsed, status: "success", warnings: [] };

    return NextResponse.json({ ok: true, mode: body.mode, strategy });
  } catch (err) {
    console.error("Himalaya strategize error:", err);
    return NextResponse.json({ ok: false, error: "Strategy failed." }, { status: 500 });
  }
}

function fallbackStrategy(mode: "scratch" | "improve"): StrategyPayload {
  if (mode === "scratch") {
    return {
      status: "fallback",
      warnings: ["Used deterministic fallback strategy"],
      summary: "Build your business foundation: profile, site, and follow-up system.",
      actions: [
        { priority: 1, action: "Create business profile and positioning", why: "Foundation for everything else", impact: "high", engine: "profile" },
        { priority: 2, action: "Build homepage", why: "You need a home base online", impact: "high", engine: "site" },
        { priority: 3, action: "Set up email follow-up", why: "Capture and nurture leads from day one", impact: "medium", engine: "email" },
      ],
      generateQueue: ["profile", "site", "email"],
      defer: ["Ads — build your foundation first", "Advanced automations — not needed yet"],
    };
  }

  return {
    status: "fallback",
    warnings: ["Used deterministic fallback strategy"],
    summary: "Fix the biggest conversion blockers first, then build growth systems.",
    actions: [
      { priority: 1, action: "Fix site conversion issues", why: "Your site is leaking potential customers", impact: "high", engine: "site" },
      { priority: 2, action: "Strengthen offer clarity", why: "Visitors don't understand what you sell", impact: "high", engine: "profile" },
      { priority: 3, action: "Add follow-up system", why: "No follow-up means lost leads", impact: "medium", engine: "email" },
    ],
    generateQueue: ["site", "email"],
    defer: ["New ad campaigns — fix conversion first"],
  };
}
