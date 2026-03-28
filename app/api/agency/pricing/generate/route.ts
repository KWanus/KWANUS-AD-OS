import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { callClaude, AGENCY_SYSTEM_PROMPT } from "@/lib/ai/claude";
import { ExecutionTier } from "@/lib/sites/conversionEngine";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { niche, businessType, competitorUrls, targetRevenue, auditId } = body;
    const executionTier: ExecutionTier = body.executionTier === "core" ? "core" : "elite";

    if (!niche || !businessType) {
      return NextResponse.json({ ok: false, error: "niche and businessType are required" }, { status: 400 });
    }

    // Optionally link to an audit
    let audit = null;
    if (auditId) {
      audit = await prisma.agencyAudit.findFirst({
        where: { id: auditId, userId: user.id },
      });
      // Not a hard error — just proceed without it
    }

    const prompt = `Generate a recommended agency pricing strategy for offering services in this market.

Niche: ${niche}
Business Type of clients: ${businessType}
${competitorUrls ? `Competitor URLs to research: ${Array.isArray(competitorUrls) ? competitorUrls.join(", ") : competitorUrls}` : ""}
${targetRevenue ? `Agency target monthly revenue: $${targetRevenue}` : ""}
Execution Tier: ${executionTier}

${executionTier === "elite"
  ? "Elite mode: think like a premium agency owner. Push for better value anchors, higher-confidence premium positioning, stronger package differentiation, and better upsell logic."
  : "Core mode: produce a strong practical pricing strategy with clean package logic and credible market positioning."}

Research what top agencies in this space actually charge. Factor in value delivery, market sophistication, and client ROI.
Position the recommended pricing to win clients while maximizing profit margin.

Return this exact JSON structure:
{
  "marketRates": { "low": 0, "mid": 0, "premium": 0 },
  "recommendedPosition": "mid|premium",
  "reasoning": "string",
  "packages": [
    {
      "name": "string",
      "price": 0,
      "billingCycle": "string",
      "deliverables": ["string"],
      "profitMargin": "string"
    }
  ],
  "valueAnchors": ["string"],
  "pricingPsychology": ["string"],
  "upsellOpportunities": ["string"]
}`;

    const result = await callClaude(AGENCY_SYSTEM_PROMPT, prompt);

    // If tied to an audit, persist pricingJson
    if (audit) {
      await prisma.agencyAudit.update({
        where: { id: auditId },
        data: { pricingJson: result as object },
      });
    }

    return NextResponse.json({ ok: true, pricing: result, executionTier, ...(audit ? { auditId } : {}) });
  } catch (err) {
    console.error("Pricing generate error:", err);
    return NextResponse.json({ ok: false, error: "Failed to generate pricing" }, { status: 500 });
  }
}
