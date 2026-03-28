import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { callClaude, AFFILIATE_SYSTEM_PROMPT } from "@/lib/ai/claude";
import { getBusinessContext } from "@/lib/archetypes/getBusinessContext";
import type { ExecutionTier } from "@/lib/sites/conversionEngine";

// POST /api/affiliate/funnel/generate
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
      ? `\n\nPrior Analysis:\n${JSON.stringify(offer.offerAnalysis, null, 2)}`
      : "";
    const businessContext = await getBusinessContext(user.id);

    const prompt = `Generate a complete affiliate funnel for this offer.

Offer:
- Name: ${offer.name}
- Platform: ${offer.platform}
- Niche: ${offer.niche}
- URL: ${offer.url}
${offer.commission != null ? `- Commission: ${offer.commission}%` : ""}
${offer.gravity != null ? `- Gravity/Score: ${offer.gravity}` : ""}
${offer.notes ? `- Notes: ${offer.notes}` : ""}${analysisContext}
${businessContext}
Execution Tier: ${executionTier}

${executionTier === "elite"
  ? "Elite mode: map this funnel like a serious affiliate operator. Push for stronger message match, smarter sequencing, tighter monetization, and better traffic-plan specificity."
  : "Core mode: build a strong practical funnel with clear page, email, and traffic structure."}

Return this exact JSON structure:
{
  "funnelName": "catchy name for this funnel",
  "funnelType": "bridge_page|quiz_funnel|vsl_funnel|email_first",
  "bridgePage": {
    "headline": "attention-grabbing headline",
    "subheadline": "supporting subheadline",
    "hook": "opening hook paragraph",
    "body": "full body copy that presells without hard selling",
    "cta": "call to action text",
    "socialProof": "social proof section copy",
    "faq": [
      { "q": "common question", "a": "persuasive answer" }
    ]
  },
  "thankYouPage": {
    "headline": "thank you page headline",
    "body": "body copy with next steps and upsell bridge",
    "nextStep": "specific next action for the reader"
  },
  "emailSequence": [
    {
      "day": 0,
      "subject": "email subject line",
      "preview": "preview text",
      "body": "full email body",
      "cta": "call to action"
    }
  ],
  "trafficPlan": {
    "primarySource": "best traffic source for this funnel",
    "budget": "recommended starting budget",
    "targeting": "specific targeting parameters",
    "bidStrategy": "recommended bidding approach"
  }
}

The emailSequence should have at least 5 emails (days 0, 1, 2, 4, 7).`;

    const funnel = await callClaude(AFFILIATE_SYSTEM_PROMPT, prompt);

    await prisma.affiliateOffer.update({
      where: { id: offer.id },
      data: { funnelJson: funnel as object },
    });

    return NextResponse.json({ ok: true, funnel, offerId: offer.id, executionTier });
  } catch (err) {
    console.error("Funnel generate error:", err);
    return NextResponse.json({ ok: false, error: "Funnel generation failed" }, { status: 500 });
  }
}
