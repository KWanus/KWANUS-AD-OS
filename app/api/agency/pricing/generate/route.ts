import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const GLOBAL_RULE = `You are the world's best digital marketing agency consultant inside Himalaya Agency OS.
Return valid JSON only. No markdown. No commentary outside JSON.
Before generating any output, analyze what TOP 1% agencies charge, deliver, and promise for this business type and niche.
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
    const { niche, businessType, competitorUrls, targetRevenue, auditId } = body;

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

    const result = await callClaude(GLOBAL_RULE, prompt);

    // If tied to an audit, persist pricingJson
    if (audit) {
      await prisma.agencyAudit.update({
        where: { id: auditId },
        data: { pricingJson: result as object },
      });
    }

    return NextResponse.json({ ok: true, pricing: result, ...(audit ? { auditId } : {}) });
  } catch (err) {
    console.error("Pricing generate error:", err);
    return NextResponse.json({ ok: false, error: "Failed to generate pricing" }, { status: 500 });
  }
}
