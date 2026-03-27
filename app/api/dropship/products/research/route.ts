import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const GLOBAL_RULE = `You are the world's best e-commerce and dropshipping strategist inside Himalaya Agency OS.
Return valid JSON only. No markdown. No commentary outside JSON.
Before generating any output, research what the TOP 1% Shopify stores and dropshippers do in this niche.
Analyze 7-figure store patterns, winning product characteristics, and viral ad strategies.
Then produce outputs that BEAT those benchmarks.`;

async function callClaude(system: string, prompt: string) {
  const r = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system,
    messages: [{ role: "user", content: prompt }],
  });
  const raw = r.content[0].type === "text" ? r.content[0].text : "{}";
  const match = raw.match(/\{[\s\S]+\}/);
  if (!match) throw new Error("No JSON in Claude response");
  return JSON.parse(match[0]);
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { niche, budget, targetMarket } = body;

    if (!niche) {
      return NextResponse.json({ ok: false, error: "niche is required" }, { status: 400 });
    }

    const prompt = `Perform deep product opportunity research for the dropshipping niche: "${niche}".
${budget ? `Budget constraint: ${budget}` : ""}
${targetMarket ? `Target market: ${targetMarket}` : ""}

Identify the top winning product opportunities that meet 7-figure store criteria.
Score each product on demand (0-100), competition (0-100), trend (0-100), and overall winner score (0-100).
Higher demand = better. Lower competition = better. Higher trend = better.

Return this exact JSON structure:
{
  "marketAnalysis": "string",
  "winningCriteria": ["string"],
  "productOpportunities": [
    {
      "name": "string",
      "category": "string",
      "problemSolved": "string",
      "targetAudience": "string",
      "estimatedSupplierPrice": "$X-$XX",
      "estimatedRetailPrice": "$XX-$XXX",
      "estimatedMargin": "XX%",
      "demandScore": 0,
      "competitionScore": 0,
      "trendScore": 0,
      "winnerScore": 0,
      "bestSupplierPlatform": "aliexpress|cjdropshipping|zendrop|spocket",
      "topAngle": "string",
      "warningFlags": ["string"]
    }
  ],
  "avoidList": ["string"],
  "seasonality": "string",
  "trendingNow": ["string"]
}`;

    const result = await callClaude(GLOBAL_RULE, prompt);

    return NextResponse.json({ ok: true, research: result });
  } catch (err) {
    console.error("Dropship research error:", err);
    return NextResponse.json({ ok: false, error: "Failed to generate research" }, { status: 500 });
  }
}
