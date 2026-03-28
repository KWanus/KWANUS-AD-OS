import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import type { ExecutionTier } from "@/lib/sites/conversionEngine";
import { AI_MODELS } from "@/lib/ai/models";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const GLOBAL_RULE = `You are the world's best affiliate marketing strategist inside Himalaya Agency OS.
Return valid JSON only. No markdown. No commentary outside JSON.
Before generating any output, analyze what the TOP 1% 7-figure affiliate marketers do in this niche.
Study the best bridge pages, email sequences, ad angles, and traffic strategies used by super-affiliates.
Then produce outputs that BEAT those benchmarks.`;

async function callClaude(system: string, prompt: string) {
  const r = await anthropic.messages.create({
    model: AI_MODELS.CLAUDE_PRIMARY,
    max_tokens: 4096,
    system,
    messages: [{ role: "user", content: prompt }],
  });
  const raw = r.content[0].type === "text" ? r.content[0].text : "{}";
  const match = raw.match(/\{[\s\S]+\}/);
  if (!match) throw new Error("No JSON in Claude response");
  return JSON.parse(match[0]);
}

// POST /api/affiliate/research
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const body = await req.json() as {
      niche: string;
      budget?: string;
      trafficSource?: string;
      executionTier?: ExecutionTier;
    };
    const executionTier: ExecutionTier = body.executionTier === "core" ? "core" : "elite";

    if (!body.niche?.trim()) {
      return NextResponse.json({ ok: false, error: "niche is required" }, { status: 400 });
    }

    const prompt = `Research the affiliate marketing landscape for this niche and provide actionable intelligence.

Niche: ${body.niche}
${body.budget ? `Budget: ${body.budget}` : ""}
${body.trafficSource ? `Primary Traffic Source: ${body.trafficSource}` : ""}
Execution tier: ${executionTier}
${executionTier === "elite"
  ? "Go beyond generic niche research. Think like a top 1% affiliate operator choosing a niche worth serious capital and attention. Be sharper about buyer psychology, EPC realism, traffic-angle fit, and where beginners usually lose money."
  : "Keep the research strong, practical, and launch-ready for a user validating this niche."}

Draw on your knowledge of ClickBank, JVZoo, ShareASale, CJ Affiliate, Impact, Digistore24, MaxBounty, and other major networks.

Return this exact JSON structure:
{
  "topNetworks": [
    {
      "network": "network name",
      "category": "what categories/niches they specialize in",
      "avgGravity": "typical gravity or volume score",
      "avgComm": "typical commission percentage or flat rate",
      "topOffers": ["offer type 1", "offer type 2", "offer type 3"]
    }
  ],
  "topNicheAngles": [
    "angle 1 that works well in this niche",
    "angle 2",
    "angle 3",
    "angle 4",
    "angle 5"
  ],
  "competitionLevel": "low|medium|high",
  "estimatedEpc": "$X.XX-$X.XX",
  "recommendedTraffic": [
    "traffic source 1 with why it works",
    "traffic source 2 with why it works",
    "traffic source 3 with why it works"
  ],
  "offerCriteria": [
    "criteria 1 — what makes a good offer in this niche",
    "criteria 2",
    "criteria 3",
    "criteria 4",
    "criteria 5"
  ],
  "redFlags": [
    "red flag 1 — what to avoid",
    "red flag 2",
    "red flag 3"
  ],
  "seasonalTrends": "notes on any seasonal patterns or best times to promote",
  "estimatedRoi": "realistic ROI expectations for a beginner vs experienced affiliate",
  "entryStrategy": "recommended step-by-step approach for entering this niche as an affiliate"
}`;

    const research = await callClaude(GLOBAL_RULE, prompt);

    return NextResponse.json({ ok: true, research, niche: body.niche, executionTier });
  } catch (err) {
    console.error("Affiliate research error:", err);
    return NextResponse.json({ ok: false, error: "Research failed" }, { status: 500 });
  }
}
