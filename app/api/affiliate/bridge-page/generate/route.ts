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

// POST /api/affiliate/bridge-page/generate
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

    const funnelContext = offer.funnelJson
      ? `\n\nFunnel Strategy:\n${JSON.stringify(offer.funnelJson, null, 2)}`
      : "";

    const prompt = `Generate a complete bridge/presell page for this affiliate offer. This page sits between the traffic source and the vendor's sales page. It warms up the prospect and pre-sells them before they click through.

Offer:
- Name: ${sanitize(offer.name)}
- Platform: ${sanitize(offer.platform)}
- Niche: ${sanitize(offer.niche)}
- Vendor URL: ${sanitize(offer.url)}
${offer.affiliateUrl ? `- Affiliate Link: ${sanitize(offer.affiliateUrl)}` : ""}
${offer.commission != null ? `- Commission: ${sanitize(offer.commission)}%` : ""}
${offer.notes ? `- Notes: ${sanitize(offer.notes)}` : ""}
Execution Tier: ${executionTier}
${executionTier === "elite"
  ? "Elite mode: write this like a top bridge-page operator. Push for a stronger emotional hook, better belief-shifting story, more credible proof, and tighter click-through psychology."
  : "Core mode: write a strong, trustworthy bridge page with practical persuasion and clear CTA flow."}${analysisContext}${funnelContext}

Return this exact JSON structure:
{
  "pageType": "bridge|presell|quiz|vsl",
  "seoTitle": "SEO-optimized page title",
  "headline": "powerful, benefit-driven headline",
  "hook": "opening hook — first paragraph that stops the scroll and creates curiosity",
  "storySection": "full story section that builds connection, credibility, and introduces the solution (3-5 paragraphs)",
  "transitionToOffer": "smooth transition paragraph that bridges the story to the offer without being salesy",
  "ctaText": "call-to-action button text",
  "socialProof": [
    "testimonial or social proof element 1",
    "testimonial or social proof element 2",
    "testimonial or social proof element 3"
  ],
  "faqs": [
    { "q": "frequently asked question", "a": "persuasive, trust-building answer" }
  ],
  "footerDisclaimer": "FTC-compliant disclaimer text for affiliate disclosure"
}

The story section should use the PAS (Problem-Agitate-Solution) or Hero's Journey framework. The page must feel authentic, not salesy. Include at least 4 FAQs.`;

    const landing = await callClaude(GLOBAL_RULE, prompt);

    await prisma.affiliateOffer.updateMany({
      where: { id: offer.id, userId: user.id },
      data: { landingJson: landing as object },
    });

    return NextResponse.json({ ok: true, landing, offerId: offer.id, executionTier });
  } catch (err) {
    console.error("Bridge page generate error:", err);
    return NextResponse.json({ ok: false, error: "Bridge page generation failed" }, { status: 500 });
  }
}
