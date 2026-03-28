import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { callClaude, AGENCY_SYSTEM_PROMPT } from "@/lib/ai/claude";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { ExecutionTier } from "@/lib/sites/conversionEngine";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const limited = rateLimit(`ai:${user.id}`, RATE_LIMITS.aiGeneration);
    if (limited) return limited;

    const body = await req.json();
    const { auditId, businessName, niche, businessType, summary } = body;
    const executionTier: ExecutionTier = body.executionTier === "core" ? "core" : "elite";

    let audit = null;
    let contextBusinessName = businessName;
    let contextNiche = niche;
    let contextBusinessType = businessType;
    let contextSummary = summary ?? "";
    let auditContext = "";

    if (auditId) {
      audit = await prisma.agencyAudit.findFirst({
        where: { id: auditId, userId: user.id },
      });
      if (!audit) return NextResponse.json({ ok: false, error: "Audit not found" }, { status: 404 });

      contextBusinessName = audit.businessName;
      contextNiche = audit.niche;
      contextBusinessType = audit.businessType;

      if (audit.auditJson) {
        auditContext = `\nAudit findings:\n${JSON.stringify(audit.auditJson)}`;
      }
      if (audit.strategyJson) {
        auditContext += `\n90-day strategy:\n${JSON.stringify(audit.strategyJson)}`;
      }
    }

    if (!contextBusinessName || !contextNiche || !contextBusinessType) {
      return NextResponse.json(
        { ok: false, error: "businessName, niche, and businessType are required (or provide auditId)" },
        { status: 400 }
      );
    }

    const prompt = `Generate a high-converting white-label agency proposal for this prospect.

Business: ${contextBusinessName}
Niche: ${contextNiche}
Business Type: ${contextBusinessType}
${contextSummary ? `Summary: ${contextSummary}` : ""}
${auditContext}
Execution Tier: ${executionTier}

${executionTier === "elite"
  ? "Elite mode: write this like a killer premium agency proposal. Sharpen diagnosis, premium positioning, proof framing, package contrast, urgency, and close-rate logic."
  : "Core mode: write a strong, persuasive agency proposal with clear structure, value framing, and practical next steps."}

Create a proposal that closes. Use the proven agency proposal formula: pain → hope → proof → offer → urgency.
Price packages at market rates for top-tier agencies in this niche. The Starter should be a no-brainer entry point.

Return this exact JSON structure:
{
  "proposalTitle": "string",
  "problemStatement": "string",
  "ourApproach": "string",
  "engagementOptions": [
    {
      "name": "Starter",
      "price": 1497,
      "billingCycle": "monthly",
      "deliverables": ["string"],
      "commitment": "30 days"
    },
    {
      "name": "Growth",
      "price": 2997,
      "billingCycle": "monthly",
      "deliverables": ["string"],
      "commitment": "90 days"
    },
    {
      "name": "Partnership",
      "price": 4997,
      "billingCycle": "monthly",
      "deliverables": ["string"],
      "commitment": "6 months"
    }
  ],
  "socialProof": "string",
  "guarantee": "string",
  "nextSteps": ["string"],
  "expiresIn": "72 hours"
}`;

    const result = await callClaude(AGENCY_SYSTEM_PROMPT, prompt);

    if (audit) {
      await prisma.agencyAudit.update({
        where: { id: auditId },
        data: { proposalJson: result as object },
      });
    }

    return NextResponse.json({ ok: true, proposal: result, executionTier, ...(audit ? { auditId } : {}) });
  } catch (err) {
    console.error("Proposal generate error:", err);
    return NextResponse.json({ ok: false, error: "Failed to generate proposal" }, { status: 500 });
  }
}
