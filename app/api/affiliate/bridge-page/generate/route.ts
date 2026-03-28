import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { callClaude, AFFILIATE_SYSTEM_PROMPT } from "@/lib/ai/claude";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import type { ExecutionTier } from "@/lib/sites/conversionEngine";

// POST /api/affiliate/bridge-page/generate
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const limited = rateLimit(`ai:${user.id}`, RATE_LIMITS.aiGeneration);
    if (limited) return limited;

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
- Name: ${offer.name}
- Platform: ${offer.platform}
- Niche: ${offer.niche}
- Vendor URL: ${offer.url}
${offer.affiliateUrl ? `- Affiliate Link: ${offer.affiliateUrl}` : ""}
${offer.commission != null ? `- Commission: ${offer.commission}%` : ""}
${offer.notes ? `- Notes: ${offer.notes}` : ""}
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

    const landing = await callClaude(AFFILIATE_SYSTEM_PROMPT, prompt);

    await prisma.affiliateOffer.update({
      where: { id: offer.id },
      data: { landingJson: landing as object },
    });

    return NextResponse.json({ ok: true, landing, offerId: offer.id, executionTier });
  } catch (err) {
    console.error("Bridge page generate error:", err);
    return NextResponse.json({ ok: false, error: "Bridge page generation failed" }, { status: 500 });
  }
}
