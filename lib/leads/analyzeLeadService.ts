/**
 * analyzeLeadService — core lead analysis logic extracted for direct service calls.
 * Used by both the route handler and the n8n webhook processor.
 */

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

export type AnalyzeLeadResult = {
  ok: boolean;
  noWebsite?: boolean;
  score?: number;
  verdict?: string;
  executionTier?: ExecutionTier;
  error?: string;
};

export async function analyzeLeadById(
  leadId: string,
  userId: string,
  executionTier: ExecutionTier = "elite"
): Promise<AnalyzeLeadResult> {
  const lead = await prisma.lead.findFirst({ where: { id: leadId, userId } });
  if (!lead) return { ok: false, error: "Lead not found" };

  await prisma.lead.update({ where: { id: leadId }, data: { status: "analyzing" } });

  try {
    if (!lead.website) {
      await prisma.lead.update({
        where: { id: leadId },
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
      return { ok: true, noWebsite: true, executionTier };
    }

    const input = normalizeInput(lead.website, "consultant");
    if (!input.valid) {
      await prisma.lead.update({ where: { id: leadId }, data: { status: "analyzed", score: 0, verdict: "Invalid URL" } });
      return { ok: true, score: 0, verdict: "Invalid URL", executionTier };
    }

    const page = await Promise.race([
      fetchPage(input.url),
      new Promise<null>((r) => setTimeout(() => r(null), 20000)),
    ]);

    if (!page) {
      await prisma.lead.update({
        where: { id: leadId },
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
      return { ok: true, score: 15, verdict: "Unreadable", executionTier };
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
      where: { id: leadId },
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

    return { ok: true, score: scoreResult.total, verdict: scoreResult.verdict, executionTier };
  } catch (err) {
    console.error("analyzeLeadById error:", err);
    await prisma.lead.update({ where: { id: leadId }, data: { status: "new" } }).catch(() => null);
    return { ok: false, error: String(err) };
  }
}
