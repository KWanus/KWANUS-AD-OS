import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { ExecutionTier } from "@/lib/sites/conversionEngine";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const GLOBAL_RULE = `You are the world's best local SEO and digital marketing expert inside Himalaya Agency OS.
Return valid JSON only. No markdown. No commentary outside JSON.
Before generating any output, analyze what the TOP 1% local marketing agencies charge and deliver for this niche/location.
Then produce outputs that BEAT those benchmarks — more specific, higher ROI, better positioned.`;

async function callClaude(system: string, prompt: string) {
  const r = await anthropic.messages.create({
    model: "claude-sonnet-4-6-20250514",
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
    if (!clerkId)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user)
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { businessName, businessUrl, niche, location, phone, leadId } = body as {
      businessName: string;
      businessUrl?: string;
      niche: string;
      location: string;
      phone?: string;
      leadId?: string;
    };
    const executionTier: ExecutionTier = body.executionTier === "core" ? "core" : "elite";

    if (!businessName || !niche || !location) {
      return NextResponse.json(
        { ok: false, error: "businessName, niche, and location are required" },
        { status: 400 }
      );
    }

    // Create audit record with scanning status
    const audit = await prisma.localAudit.create({
      data: {
        userId: user.id,
        leadId: leadId ?? null,
        businessName,
        businessUrl: businessUrl ?? null,
        niche,
        location,
        phone: phone ?? null,
        status: "scanning",
      },
    });

    // Build the audit prompt
    const prompt = `Perform a comprehensive local presence audit for:
Business Name: ${businessName}
${businessUrl ? `Website: ${businessUrl}` : "Website: Not provided"}
Niche: ${niche}
Location: ${location}
${phone ? `Phone: ${phone}` : ""}
Execution Tier: ${executionTier}

${executionTier === "elite"
  ? "Elite mode: audit like a premium local growth operator. Be tougher, more commercially specific, and clearer about lead leaks, proof gaps, GMB weaknesses, and ranking opportunities."
  : "Core mode: deliver a strong practical local marketing audit with clear priorities and realistic fixes."}

Evaluate every major local SEO and digital presence factor. Score each category 0-100 based on typical baseline assumptions for a local business in this niche and location that hasn't actively optimized. Be specific about what's likely missing and what the impact is.

Return this exact JSON structure:
{
  "overallScore": <0-100 integer>,
  "scores": {
    "gmb": <0-100>,
    "reviews": <0-100>,
    "citations": <0-100>,
    "website": <0-100>,
    "seo": <0-100>,
    "competitors": <0-100>
  },
  "findings": [
    { "category": "GMB|Reviews|Citations|Website|SEO|Competitors", "severity": "critical|high|medium|low", "issue": "specific issue description", "fix": "specific actionable fix", "impact": "revenue/lead impact" }
  ],
  "topPriorities": ["priority 1", "priority 2", "priority 3", "priority 4", "priority 5"],
  "estimatedRevenueImpact": "specific dollar range or percentage lift expected from full optimization",
  "competitorAdvantages": ["what top competitors are doing that this business is not"],
  "quickWins": ["action that can be done in under 24 hours with immediate impact"]
}`;

    let auditData: Record<string, unknown>;
    try {
      auditData = await callClaude(GLOBAL_RULE, prompt);
    } catch (err) {
      await prisma.localAudit.update({
        where: { id: audit.id },
        data: { status: "error" },
      });
      throw err;
    }

    const scores = (auditData.scores as Record<string, number>) ?? {};

    const updated = await prisma.localAudit.update({
      where: { id: audit.id },
      data: {
        overallScore: typeof auditData.overallScore === "number" ? auditData.overallScore : null,
        gmbScore: typeof scores.gmb === "number" ? scores.gmb : null,
        reviewScore: typeof scores.reviews === "number" ? scores.reviews : null,
        citationScore: typeof scores.citations === "number" ? scores.citations : null,
        websiteScore: typeof scores.website === "number" ? scores.website : null,
        seoScore: typeof scores.seo === "number" ? scores.seo : null,
        competitorScore: typeof scores.competitors === "number" ? scores.competitors : null,
        auditJson: auditData as object,
        status: "complete",
      },
    });

    return NextResponse.json({ ok: true, audit: updated, executionTier });
  } catch (err) {
    console.error("Local audit POST error:", err);
    return NextResponse.json({ ok: false, error: "Failed to run audit" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user)
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const niche = searchParams.get("niche") ?? undefined;

    const audits = await prisma.localAudit.findMany({
      where: {
        userId: user.id,
        ...(status ? { status } : {}),
        ...(niche ? { niche } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ ok: true, audits });
  } catch (err) {
    console.error("Local audit GET error:", err);
    return NextResponse.json({ ok: false, error: "Failed to fetch audits" }, { status: 500 });
  }
}
