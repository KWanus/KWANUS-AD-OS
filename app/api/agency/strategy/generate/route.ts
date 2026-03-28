import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { callClaude, AGENCY_SYSTEM_PROMPT } from "@/lib/ai/claude";
import { getBusinessContext } from "@/lib/archetypes/getBusinessContext";
import { ExecutionTier } from "@/lib/sites/conversionEngine";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { auditId } = body;
    const executionTier: ExecutionTier = body.executionTier === "core" ? "core" : "elite";

    if (!auditId) {
      return NextResponse.json({ ok: false, error: "auditId is required" }, { status: 400 });
    }

    const audit = await prisma.agencyAudit.findFirst({
      where: { id: auditId, userId: user.id },
    });
    if (!audit) return NextResponse.json({ ok: false, error: "Audit not found" }, { status: 404 });

    const auditContext = audit.auditJson
      ? `\nFull audit results:\n${JSON.stringify(audit.auditJson)}`
      : "";
    const businessContext = await getBusinessContext(user.id);

    const prompt = `Generate a comprehensive 90-day growth roadmap based on this business audit.

Business: ${audit.businessName}
${audit.businessUrl ? `Website: ${audit.businessUrl}` : ""}
Niche: ${audit.niche}
Business Type: ${audit.businessType}
${audit.location ? `Location: ${audit.location}` : ""}
${audit.overallScore != null ? `Overall Audit Score: ${audit.overallScore}/100` : ""}
${auditContext}
${businessContext}
Execution Tier: ${executionTier}

${executionTier === "elite"
  ? "Elite mode: build this like a premium agency strategy deck. Use sharper prioritization, stronger sequencing, clearer revenue logic, and more credible operator-level KPI framing."
  : "Core mode: build a strong, practical 90-day roadmap with clear tasks, owners, KPIs, and outcomes."}

Build a phased, results-oriented 90-day roadmap. Each phase should have clear tasks, owners, KPIs, and projected outcomes.
Make the projected revenue lift specific and credible based on the audit findings.

Return this exact JSON structure:
{
  "executiveSummary": "string",
  "phases": [
    {
      "phase": 1,
      "name": "Foundation (Days 1-30)",
      "focus": "string",
      "tasks": [{ "task": "string", "owner": "agency|client", "timeline": "string", "tool": "string" }],
      "kpis": ["string"],
      "expectedOutcome": "string"
    },
    {
      "phase": 2,
      "name": "Acceleration (Days 31-60)",
      "focus": "string",
      "tasks": [{ "task": "string", "owner": "agency|client", "timeline": "string", "tool": "string" }],
      "kpis": ["string"],
      "expectedOutcome": "string"
    },
    {
      "phase": 3,
      "name": "Scale (Days 61-90)",
      "focus": "string",
      "tasks": [{ "task": "string", "owner": "agency|client", "timeline": "string", "tool": "string" }],
      "kpis": ["string"],
      "expectedOutcome": "string"
    }
  ],
  "totalProjectedRevenueLift": "string",
  "roi": "string",
  "risksToMitigate": ["string"]
}`;

    const result = await callClaude(AGENCY_SYSTEM_PROMPT, prompt);

    const updated = await prisma.agencyAudit.update({
      where: { id: auditId },
      data: { strategyJson: result as object },
    });

    return NextResponse.json({ ok: true, strategy: result, audit: updated, executionTier });
  } catch (err) {
    console.error("Strategy generate error:", err);
    return NextResponse.json({ ok: false, error: "Failed to generate strategy" }, { status: 500 });
  }
}
