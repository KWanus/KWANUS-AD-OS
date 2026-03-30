import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import type { ExecutionTier } from "@/lib/sites/conversionEngine";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const GLOBAL_RULE = `You are the world's best affiliate marketing strategist inside Himalaya Agency OS.
Return valid JSON only. No markdown. No commentary outside JSON.
Before generating any output, analyze what the TOP 1% 7-figure affiliate marketers do in this niche.
Study the best bridge pages, email sequences, ad angles, and traffic strategies used by super-affiliates.
Then produce outputs that BEAT those benchmarks.`;

async function callClaude(system: string, prompt: string) {
  const r = await anthropic.messages.create({
    model: "claude-sonnet-4-6-20250514",
    max_tokens: 4096,
    system,
    messages: [{ role: "user", content: prompt }],
  });
  const raw = r.content[0].type === "text" ? r.content[0].text : "{}";
  const match = raw.match(/\{[\s\S]+\}/);
  if (!match) throw new Error("No JSON in Claude response");
  return JSON.parse(match[0]);
}

// POST /api/affiliate/ads/generate
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const body = await req.json() as { offerId: string; executionTier?: ExecutionTier };
    const executionTier: ExecutionTier = body.executionTier === "core" ? "core" : "elite";
    if (!body.offerId) return NextResponse.json({ ok: false, error: "offerId is required" }, { status: 400 });

    const offer = await prisma.affiliateOffer.findFirst({
      where: { id: body.offerId, userId: user.id },
    });
    if (!offer) return NextResponse.json({ ok: false, error: "Offer not found" }, { status: 404 });

    const analysisContext = offer.offerAnalysis
      ? `\n\nOffer Analysis:\n${JSON.stringify(offer.offerAnalysis, null, 2)}`
      : "";

    const prompt = `Generate complete ad creative for Facebook/Instagram, TikTok, and Google for this affiliate offer.

Offer:
- Name: ${offer.name}
- Platform: ${offer.platform}
- Niche: ${offer.niche}
- URL: ${offer.url}
${offer.commission != null ? `- Commission: ${offer.commission}%` : ""}
${offer.notes ? `- Notes: ${offer.notes}` : ""}
Execution Tier: ${executionTier}
${executionTier === "elite"
  ? "Elite mode: write these like a super-affiliate buying serious traffic. Push for more dangerous hooks, stronger angle variation, better platform-native formatting, and clearer visual direction."
  : "Core mode: write strong launch-ready affiliate ads with practical hooks, copy, and creative ideas."}${analysisContext}

Return this exact JSON structure:
{
  "facebook": {
    "hooks": [
      "hook line 1 — pattern interrupt",
      "hook line 2 — curiosity gap",
      "hook line 3 — pain-based",
      "hook line 4 — result-based",
      "hook line 5 — controversial"
    ],
    "primaryTexts": [
      "full primary text ad copy variant 1",
      "full primary text ad copy variant 2",
      "full primary text ad copy variant 3"
    ],
    "headlines": [
      "headline 1",
      "headline 2",
      "headline 3",
      "headline 4",
      "headline 5"
    ],
    "descriptions": [
      "description 1",
      "description 2",
      "description 3"
    ],
    "thumbnailConcepts": [
      {
        "concept": "describe the visual concept",
        "elements": ["element 1", "element 2", "element 3"]
      }
    ]
  },
  "tiktok": {
    "hooks": [
      "TikTok hook 1 — first 3 seconds",
      "TikTok hook 2 — first 3 seconds",
      "TikTok hook 3 — first 3 seconds"
    ],
    "scriptAngles": [
      {
        "hook": "opening hook",
        "body": "middle content 15-30 seconds",
        "cta": "call to action"
      }
    ],
    "ugcBriefs": [
      "UGC creator brief 1 with full direction",
      "UGC creator brief 2 with full direction"
    ]
  },
  "google": {
    "headlines": [
      "headline 1 under 30 chars",
      "headline 2 under 30 chars",
      "headline 3 under 30 chars",
      "headline 4 under 30 chars",
      "headline 5 under 30 chars"
    ],
    "descriptions": [
      "description 1 under 90 chars",
      "description 2 under 90 chars",
      "description 3 under 90 chars"
    ],
    "keywords": [
      "keyword phrase 1",
      "keyword phrase 2",
      "keyword phrase 3",
      "keyword phrase 4",
      "keyword phrase 5"
    ]
  }
}`;

    const ads = await callClaude(GLOBAL_RULE, prompt);

    await prisma.affiliateOffer.update({
      where: { id: offer.id },
      data: { adHooksJson: ads as object },
    });

    return NextResponse.json({ ok: true, ads, offerId: offer.id, executionTier });
  } catch (err) {
    console.error("Ads generate error:", err);
    return NextResponse.json({ ok: false, error: "Ad generation failed" }, { status: 500 });
  }
}
