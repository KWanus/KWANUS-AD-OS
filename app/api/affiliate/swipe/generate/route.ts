import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import type { ExecutionTier } from "@/lib/sites/conversionEngine";
import { AI_MODELS } from "@/lib/ai/models";
import { config } from "@/lib/config";

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

function sanitize(value: unknown, max = 300): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\x00/g, "").replace(/[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "").trim().slice(0, max);
}

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

// POST /api/affiliate/swipe/generate
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

    const prompt = `Create a complete swipe file for promoting this affiliate offer.

Offer:
- Name: ${sanitize(offer.name)}
- Platform: ${sanitize(offer.platform)}
- Niche: ${sanitize(offer.niche)}
- URL: ${sanitize(offer.url)}
${offer.commission != null ? `- Commission: ${sanitize(offer.commission)}%` : ""}
${offer.affiliateUrl ? `- Affiliate URL: ${sanitize(offer.affiliateUrl)}` : ""}
${offer.notes ? `- Notes: ${sanitize(offer.notes)}` : ""}
Execution Tier: ${executionTier}
${executionTier === "elite"
  ? "Elite mode: write this like a top super-affiliate with better open-rate instincts, stronger sequencing, sharper urgency, and clearer psychological progression."
  : "Core mode: write strong practical swipe copy with clear persuasion and clean sequencing."}${analysisContext}

Return this exact JSON structure:
{
  "broadcasts": [
    {
      "subject": "broadcast subject line",
      "preview": "preview text under 90 chars",
      "body": "full broadcast email body with personality and persuasion",
      "ps": "P.S. line that adds urgency or social proof"
    }
  ],
  "sequence7day": [
    {
      "day": 1,
      "type": "story|value|proof|pitch",
      "subject": "subject line",
      "body": "full email body"
    }
  ],
  "sms": [
    "SMS message 1 under 160 chars with affiliate context",
    "SMS message 2"
  ],
  "pushNotifications": [
    {
      "title": "push notification title under 50 chars",
      "body": "push body under 100 chars"
    }
  ]
}

Requirements:
- broadcasts: at least 3 unique angles (curiosity, proof, urgency)
- sequence7day: full 7 days (days 1-7) covering story, value, proof, pitch progression
- sms: at least 4 messages
- pushNotifications: at least 4 notifications`;

    const swipe = await callClaude(GLOBAL_RULE, prompt);

    await prisma.affiliateOffer.updateMany({
      where: { id: offer.id, userId: user.id },
      data: { swipeJson: swipe as object },
    });

    return NextResponse.json({ ok: true, swipe, offerId: offer.id, executionTier });
  } catch (err) {
    console.error("Swipe generate error:", err);
    return NextResponse.json({ ok: false, error: "Swipe file generation failed" }, { status: 500 });
  }
}
