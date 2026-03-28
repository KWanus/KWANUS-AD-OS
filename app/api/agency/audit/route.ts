import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { ExecutionTier } from "@/lib/sites/conversionEngine";
import { AI_MODELS } from "@/lib/ai/models";
import { config } from "@/lib/config";

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

function sanitize(value: unknown, max = 500): string {
  if (value === undefined || value === null) return "";
  return String(value).replace(/\x00/g, "").replace(/[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "").trim().slice(0, max);
}

const GLOBAL_RULE = `You are the world's best digital marketing agency consultant inside Himalaya Agency OS.
Return valid JSON only. No markdown. No commentary outside JSON.
Before generating any output, analyze what TOP 1% agencies charge, deliver, and promise for this business type and niche.
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

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const businessType = searchParams.get("businessType") ?? undefined;

    const audits = await prisma.agencyAudit.findMany({
      where: {
        userId: user.id,
        ...(status ? { status } : {}),
        ...(businessType ? { businessType } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, audits });
  } catch (err) {
    console.error("AgencyAudit GET error:", err);
    return NextResponse.json({ ok: false, error: "Failed to fetch audits" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { businessName, businessUrl, niche, location, businessType, leadId, clientId } = body;
    const executionTier: ExecutionTier = body.executionTier === "core" ? "core" : "elite";

    if (!businessName || !niche || !businessType) {
      return NextResponse.json(
        { ok: false, error: "businessName, niche, and businessType are required" },
        { status: 400 }
      );
    }

    // Create audit record first with scanning status
    const audit = await prisma.agencyAudit.create({
      data: {
        userId: user.id,
        businessName,
        businessUrl: businessUrl ?? null,
        niche,
        location: location ?? null,
        businessType,
        leadId: leadId ?? null,
        clientId: clientId ?? null,
        status: "scanning",
      },
    });

    const sBusinessName = sanitize(businessName);
    const sBusinessUrl = sanitize(businessUrl, 2000);
    const sNiche = sanitize(niche);
    const sLocation = sanitize(location);
    const sBusinessType = sanitize(businessType);

    const prompt = `Perform a comprehensive 20-point digital marketing audit for this business.

Business Name: ${sBusinessName}
${sBusinessUrl ? `Website: ${sBusinessUrl}` : "No website provided"}
Niche: ${sNiche}
${sLocation ? `Location: ${sLocation}` : ""}
Business Type: ${sBusinessType}
Execution Tier: ${executionTier}

${executionTier === "elite"
  ? "Elite mode: audit like a premium growth operator. Be tougher, more commercially specific, and clearer about revenue leaks, offer gaps, proof gaps, and conversion friction."
  : "Core mode: deliver a sharp, practical audit with strong prioritization and clear fixes."}

Audit across these categories: Traffic, Conversion, Offer, Trust, Automation.
Score each point 0-100. Be specific about findings and actionable in recommendations.
Grade each item A through F. Mark critical issues clearly.

Return this exact JSON structure:
{
  "scores": {
    "overall": 0,
    "traffic": 0,
    "conversion": 0,
    "offer": 0,
    "trust": 0,
    "automation": 0
  },
  "auditPoints": [
    {
      "id": 1,
      "category": "Traffic",
      "item": "string",
      "grade": "A|B|C|D|F",
      "score": 0,
      "finding": "string",
      "recommendation": "string",
      "priority": "critical|high|medium|low",
      "estimatedImpact": "string",
      "estimatedEffort": "low|medium|high"
    }
  ],
  "topOpportunities": [
    { "title": "string", "estimatedRevenueLift": "string", "timeline": "string", "effort": "low|medium|high" }
  ],
  "competitivePosition": "string",
  "summary": "string"
}`;

    let auditResult;
    try {
      auditResult = await callClaude(GLOBAL_RULE, prompt);
    } catch (claudeErr) {
      // Update status to error but don't lose the record
      await prisma.agencyAudit.update({
        where: { id: audit.id },
        data: { status: "pending" },
      });
      throw claudeErr;
    }

    const scores = auditResult.scores ?? {};

    const updated = await prisma.agencyAudit.update({
      where: { id: audit.id },
      data: {
        status: "complete",
        overallScore: scores.overall ?? null,
        trafficScore: scores.traffic ?? null,
        conversionScore: scores.conversion ?? null,
        offerScore: scores.offer ?? null,
        trustScore: scores.trust ?? null,
        automationScore: scores.automation ?? null,
        auditJson: auditResult as object,
      },
    });

    return NextResponse.json({ ok: true, audit: updated, executionTier }, { status: 201 });
  } catch (err) {
    console.error("AgencyAudit POST error:", err);
    return NextResponse.json({ ok: false, error: "Failed to create audit" }, { status: 500 });
  }
}
