import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { normalizeInput } from "@/src/logic/ad-os/normalizeInput";
import { fetchPage } from "@/src/logic/ad-os/fetchPage";
import { classifyLink } from "@/src/logic/ad-os/classifyLink";
import { extractSignals } from "@/src/logic/ad-os/extractSignals";
import { diagnoseLink } from "@/src/logic/ad-os/diagnoseLink";
import { scoreOpportunity } from "@/src/logic/ad-os/scoreOpportunity";
import { buildDecisionPacket } from "@/src/logic/ad-os/buildDecisionPacket";
import { scoreOpportunityDimensions } from "@/src/logic/ad-os/scoreOpportunityDimensions";
import { classifyOpportunity } from "@/src/logic/ad-os/classifyOpportunity";
import { detectOpportunityGaps } from "@/src/logic/ad-os/detectOpportunityGaps";
import { recommendOpportunityPath } from "@/src/logic/ad-os/recommendOpportunityPath";
import { buildOpportunityPacket } from "@/src/logic/ad-os/buildOpportunityPacket";
import type { ExecutionTier } from "@/lib/sites/conversionEngine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const lead = await prisma.lead.findFirst({ where: { id, userId: user.id } });
    if (!lead) return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });
    const body = await req.json() as { executionTier?: ExecutionTier };
    const executionTier: ExecutionTier = body.executionTier === "core" ? "core" : "elite";

    await prisma.lead.update({ where: { id, userId: user.id }, data: { status: "analyzing" } });

    // No website → score as zero digital presence (huge opportunity)
    if (!lead.website) {
      await prisma.lead.update({
        where: { id, userId: user.id },
        data: {
          status: "analyzed",
          score: 18,
          verdict: "No Web Presence",
          summary: `${lead.name} has no website — a prime opportunity to build their entire digital infrastructure from scratch.`,
          audience: `Local ${lead.niche} customers in ${lead.location}`,
          painPoints: "No online visibility, losing leads to competitors with sites",
          angle: "Build their first professional online presence",
          topGaps: ["No website", "No online booking", "No lead capture form", "No social proof"],
          topStrengths: ["Established local business", "Existing phone/address listing"],
          weaknesses: ["Zero digital presence", "Not showing up in searches"],
          analyzerJson: { executionTier } as object,
        },
      });
      return NextResponse.json({ ok: true, noWebsite: true });
    }

    const input = normalizeInput(lead.website, "consultant");
    if (!input.valid) {
      await prisma.lead.update({ where: { id, userId: user.id }, data: { status: "analyzed", score: 0, verdict: "Invalid URL" } });
      return NextResponse.json({ ok: true });
    }

    // Fetch with 20s timeout
    const page = await Promise.race([
      fetchPage(input.url),
      new Promise<null>((r) => setTimeout(() => r(null), 20000)),
    ]);

    if (!page) {
      await prisma.lead.update({
        where: { id, userId: user.id },
        data: {
          status: "analyzed",
          score: 15,
          verdict: "Unreadable",
          summary: "Site timed out — likely outdated tech, slow hosting, or JS-only rendering.",
          topGaps: ["Broken/slow site", "Poor technical performance", "Possible no mobile version"],
          topStrengths: [],
          weaknesses: ["Site unreachable or very slow"],
          analyzerJson: { executionTier } as object,
        },
      });
      return NextResponse.json({ ok: true });
    }

    const linkType = classifyLink(input.url, page);
    const signals = extractSignals(page);
    const diagnosis = diagnoseLink(signals, linkType);
    const scoreResult = scoreOpportunity(signals, diagnosis, page);
    const packet = buildDecisionPacket(signals, diagnosis, scoreResult, linkType, "consultant");

    const dimensions = scoreOpportunityDimensions(signals, page);
    const classified = classifyOpportunity(dimensions);
    const gaps = detectOpportunityGaps(dimensions, signals);
    const recommendation = recommendOpportunityPath(classified.status, dimensions, "consultant");
    const opportunityPacket = buildOpportunityPacket(classified, dimensions, gaps, recommendation);

    await prisma.lead.update({
      where: { id, userId: user.id },
      data: {
        status: "analyzed",
        score: scoreResult.total,
        verdict: scoreResult.verdict,
        summary: packet.summary,
        audience: packet.audience,
        painPoints: packet.painDesire,
        angle: packet.angle,
        topGaps: opportunityPacket.topGaps ?? [],
        topStrengths: opportunityPacket.topStrengths ?? [],
        weaknesses: packet.weaknesses ?? [],
        analyzerJson: {
          executionTier,
          scanProfile: executionTier === "elite"
            ? "Sharper operator-grade diagnosis for trust, clarity, and conversion."
            : "Strong launch-ready diagnosis for trust, clarity, and conversion.",
        } as object,
      },
    });

    return NextResponse.json({ ok: true, score: scoreResult.total, verdict: scoreResult.verdict, executionTier });
  } catch (err) {
    console.error("Lead analyze error:", err);
    await prisma.lead.update({ where: { id, userId: user.id }, data: { status: "new" } }).catch(() => null);
    return NextResponse.json({ ok: false, error: "Analysis failed" }, { status: 500 });
  }
}
