import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { callClaude, LOCAL_SYSTEM_PROMPT } from "@/lib/ai/claude";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
type ExecutionTier = "core" | "elite";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user)
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { auditId, executionTier: rawExecutionTier } = body as { auditId: string; executionTier?: ExecutionTier };
    const executionTier: ExecutionTier = rawExecutionTier === "core" ? "core" : "elite";

    if (!auditId) {
      return NextResponse.json(
        { ok: false, error: "auditId is required" },
        { status: 400 }
      );
    }

    const audit = await prisma.localAudit.findFirst({
      where: { id: auditId, userId: user.id },
    });

    if (!audit) {
      return NextResponse.json({ ok: false, error: "Audit not found" }, { status: 404 });
    }

    if (audit.status !== "complete") {
      return NextResponse.json(
        { ok: false, error: "Audit must be in 'complete' status before generating a report" },
        { status: 422 }
      );
    }

    const auditSummary = audit.auditJson
      ? JSON.stringify(audit.auditJson, null, 2)
      : "No detailed audit data available.";

    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const prompt = `Generate a polished, client-facing local SEO audit report based on this audit data:

Business: ${audit.businessName}
${audit.businessUrl ? `Website: ${audit.businessUrl}` : ""}
Niche: ${audit.niche ?? "Local Business"}
Location: ${audit.location ?? ""}
Audit Date: ${today}

Score Summary:
- Overall: ${audit.overallScore ?? "N/A"}/100
- Google My Business: ${audit.gmbScore ?? "N/A"}/100
- Reviews: ${audit.reviewScore ?? "N/A"}/100
- Citations: ${audit.citationScore ?? "N/A"}/100
- Website: ${audit.websiteScore ?? "N/A"}/100
- Local SEO: ${audit.seoScore ?? "N/A"}/100
- Competitive Position: ${audit.competitorScore ?? "N/A"}/100

Full Audit Data:
${auditSummary}

Create a professional report that:
- Is written for the business owner (non-technical language)
- Builds urgency around missed revenue opportunity
- Positions your agency as the obvious solution
- Has clear, prioritized action items with expected outcomes
- Includes investment context (cost of inaction vs. cost of solution)
- Execution Tier: ${executionTier}
- ${executionTier === "elite"
    ? "Elite mode: make this feel like a premium, executive-ready client deliverable with stronger ROI framing, more credible urgency, and sharper strategic positioning."
    : "Core mode: keep it clear, practical, professional, and immediately useful for client communication."}

Return this exact JSON structure:
{
  "reportTitle": "Local SEO Audit Report — ${audit.businessName} — ${today}",
  "executiveSummary": "2-3 paragraph executive summary for the business owner",
  "scoreCard": [
    {
      "metric": "metric name",
      "current": "current score or status description",
      "benchmark": "what top performers in this niche achieve",
      "status": "good|warning|critical"
    }
  ],
  "recommendations": [
    {
      "priority": <1-10, 1 = highest>,
      "title": "recommendation title",
      "description": "what needs to be done and why",
      "expectedResult": "specific measurable outcome",
      "timeline": "realistic timeline like '2-4 weeks'"
    }
  ],
  "competitorAnalysis": "paragraph analysis of the competitive landscape and where this business stands",
  "investmentSummary": "paragraph framing the cost of inaction vs. investment in local SEO services, with realistic ROI framing"
}`;

    const result = await callClaude(LOCAL_SYSTEM_PROMPT, prompt);

    const updated = await prisma.localAudit.update({
      where: { id: auditId },
      data: { reportJson: result as object },
    });

    return NextResponse.json({ ok: true, report: result, audit: updated, executionTier });
  } catch (err) {
    console.error("SEO report POST error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to generate SEO report" },
      { status: 500 }
    );
  }
}
