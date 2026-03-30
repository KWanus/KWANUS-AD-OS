import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Himalaya Strategy API — the decision brain.
 *
 * Takes diagnosis output and decides what to generate and in what order.
 * Returns a prioritized action plan + generation queue.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      mode: "scratch" | "improve";
      diagnosis: Record<string, unknown>;
    };

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ ok: false, error: "AI not configured." }, { status: 500 });
    }

    const systemPrompt = `You are Himalaya's Strategy Engine — a business consultant that decides what to build, in what order, and why.

You must return a JSON object (no markdown fences, no explanation outside JSON) with this exact structure:
{
  "summary": "1-2 sentence strategic assessment",
  "actions": [
    {
      "priority": 1,
      "action": "short action title",
      "why": "why this matters most right now",
      "impact": "high" | "medium" | "low",
      "engine": "profile" | "site" | "email" | "ads" | "operations"
    }
  ],
  "generateQueue": ["profile", "site", "email"],
  "defer": ["list of things to NOT build yet and why"]
}

Rules:
- Maximum 5 actions, ordered by priority
- generateQueue is the ordered list of what Himalaya should generate now
- defer is what should NOT be built yet
- Be specific and opinionated — you know the shortest path
- For scratch users: always start with profile, then site, then email
- For improve users: fix the biggest weakness first`;

    let userPrompt: string;

    if (body.mode === "scratch") {
      const d = body.diagnosis;
      userPrompt = `MODE: Starting from scratch

BUSINESS TYPE: ${d.businessType || "not specified"}
NICHE: ${d.niche || "not specified"}
GOAL: ${d.goal || "not specified"}
DESCRIPTION: ${d.description || "none provided"}
ARCHETYPE DATA: ${d.archetype ? JSON.stringify(d.archetype) : "none"}

Decide what this person needs built first and in what order. Be direct and specific to their business type and niche.`;
    } else {
      const d = body.diagnosis;
      userPrompt = `MODE: Improving existing business

URL: ${d.url || "none"}
SCORE: ${d.score || "unknown"}/100
VERDICT: ${d.verdict || "unknown"}
STRENGTHS: ${d.strengths || "unknown"}
WEAKNESSES: ${d.weaknesses || "unknown"}
DIAGNOSTICS: ${d.diagnostics ? JSON.stringify(d.diagnostics) : "none"}
GAPS: ${d.gaps ? JSON.stringify(d.gaps) : "none"}
CHALLENGE: ${d.challenge || "not specified"}
DESCRIPTION: ${d.businessDescription || "none"}

Based on this diagnosis, decide what should be fixed first. Prioritize by impact. Be specific about which engine should handle each fix.`;
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";

    // Parse the JSON response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ ok: false, error: "Strategy generation failed." }, { status: 500 });
    }

    const strategy = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      ok: true,
      mode: body.mode,
      strategy,
    });
  } catch (err) {
    console.error("Himalaya strategize error:", err);
    return NextResponse.json({ ok: false, error: "Strategy failed." }, { status: 500 });
  }
}
