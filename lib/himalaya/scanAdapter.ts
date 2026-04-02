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
import { buildAssetPackage } from "@/src/logic/ad-os/buildAssetPackage";
import { runTruthEngine, getProfileForMode } from "@/rules/truthEngine";

/**
 * Runs the full scan + analysis + asset generation pipeline for a URL.
 * Returns an AnalysisRun ID that can be fed into the orchestrator.
 *
 * This is the same logic as /api/analyze but callable from the orchestrator
 * instead of only from an HTTP endpoint.
 */
export async function runScanPipeline(
  url: string,
  mode: "consultant" | "operator",
  userId: string,
): Promise<{ analysisId: string | null; success: boolean; error?: string }> {
  const input = normalizeInput(url, mode);
  if (!input.valid) {
    return { analysisId: null, success: false, error: input.error };
  }

  const page = await fetchPage(input.url);
  if (!page.ok) {
    return { analysisId: null, success: false, error: `Could not fetch page: ${page.error ?? "unknown"}` };
  }

  // Analysis pipeline
  const linkType = classifyLink(input.url, page);
  const signals = extractSignals(page);
  const diagnosis = diagnoseLink(signals, linkType);
  const scoreResult = scoreOpportunity(signals, diagnosis, page);
  const packet = buildDecisionPacket(signals, diagnosis, scoreResult, linkType, input.mode);

  // Opportunity engine
  const dimensions = scoreOpportunityDimensions(signals, page);
  const classified = classifyOpportunity(dimensions);
  const gaps = detectOpportunityGaps(dimensions, signals);
  const recommendation = recommendOpportunityPath(classified.status, dimensions, input.mode);
  const opportunityPacket = buildOpportunityPacket(classified, dimensions, gaps, recommendation);

  // Truth engine
  const truthProfile = getProfileForMode(input.mode);
  const truthResult = runTruthEngine(dimensions, truthProfile);

  // Asset generation
  const isReject = truthResult.verdict === "Reject" || opportunityPacket.status === "Reject";
  const assets = isReject ? null : buildAssetPackage(packet, opportunityPacket, input.mode, "elite");

  // Persist
  try {
    const run = await prisma.analysisRun.create({
      data: {
        userId,
        mode: input.mode,
        rawSignals: signals as object,
        inputUrl: input.url,
        linkType,
        title: page.title || signals.productName || input.url,
        score: scoreResult.total,
        verdict: scoreResult.verdict,
        confidence: scoreResult.confidence,
        summary: packet.summary,
        decisionPacket: packet as object,
      },
    });

    await prisma.opportunityAssessment.create({
      data: {
        analysisRunId: run.id,
        status: opportunityPacket.status,
        totalScore: opportunityPacket.totalScore,
        demandPotential: dimensions.demandPotential,
        offerStrength: dimensions.offerStrength,
        emotionalLeverage: dimensions.emotionalLeverage,
        trustCredibility: dimensions.trustCredibility,
        conversionReadiness: dimensions.conversionReadiness,
        adViability: dimensions.adViability,
        emailLifecyclePotential: dimensions.emailLifecyclePotential,
        seoPotential: dimensions.seoPotential,
        differentiation: dimensions.differentiation,
        risk: dimensions.risk,
        topGaps: opportunityPacket.topGaps,
        topStrengths: opportunityPacket.topStrengths,
        recommendedPath: opportunityPacket.recommendedPath,
        opportunityPacket: opportunityPacket as object,
      },
    });

    if (assets) {
      await prisma.assetPackage.create({
        data: {
          analysisRunId: run.id,
          mode: input.mode,
          adHooks: assets.adHooks as object,
          adScripts: assets.adScripts as object,
          adBriefs: assets.adBriefs as object,
          landingPage: assets.landingPage as object,
          emailSequences: assets.emailSequences as object,
          executionChecklist: assets.executionChecklist as object,
        },
      });
    }

    return { analysisId: run.id, success: true };
  } catch (err) {
    console.error("Scan pipeline DB write failed:", err);
    return { analysisId: null, success: false, error: "Database save failed" };
  }
}
