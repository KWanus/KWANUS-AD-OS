import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
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
import type { ExecutionTier } from "@/lib/sites/conversionEngine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { url?: string; mode?: string; executionTier?: ExecutionTier };
    const input = normalizeInput(body.url ?? "", body.mode ?? "operator");
    const executionTier: ExecutionTier = body.executionTier === "core" ? "core" : "elite";

    if (!input.valid) {
      return NextResponse.json({ ok: false, error: input.error }, { status: 400 });
    }

    // Resolve user (non-blocking — analysis still works if auth fails)
    let userId: string | null = null;
    try {
      const { userId: clerkId } = await auth();
      if (clerkId) {
        const user = await getOrCreateUser();
        userId = user?.id ?? null;
      }
    } catch {
      // Auth is optional for analysis
    }

    const page = await fetchPage(input.url);

    if (!page.ok) {
      return NextResponse.json({
        ok: true,
        analysis: {
          mode: input.mode,
          inputUrl: input.url,
          linkType: "unknown",
          title: "",
          score: 0,
          verdict: "Reject",
          confidence: "Low",
          summary: `Could not fetch page: ${page.error ?? "unknown error"}. Try a different URL.`,
          decisionPacket: {
            audience: "Unknown",
            painDesire: "Unknown",
            angle: "Unknown",
            strengths: [],
            weaknesses: ["Page could not be fetched or is behind a login/paywall"],
            risks: ["Cannot analyze inaccessible pages"],
            nextActions: ["Ensure the URL is publicly accessible and try again"],
          },
        },
        opportunityAssessment: null,
        assetPackage: null,
      });
    }

    // Phase 2 — Link Analysis
    const linkType = classifyLink(input.url, page);
    const signals = extractSignals(page);
    const diagnosis = diagnoseLink(signals, linkType);
    const scoreResult = scoreOpportunity(signals, diagnosis, page);
    const packet = buildDecisionPacket(signals, diagnosis, scoreResult, linkType, input.mode);

    // Phase 3 — Opportunity Engine
    const dimensions = scoreOpportunityDimensions(signals, page);
    const classified = classifyOpportunity(dimensions);
    const gaps = detectOpportunityGaps(dimensions, signals);
    const recommendation = recommendOpportunityPath(classified.status, dimensions, input.mode);
    const opportunityPacket = buildOpportunityPacket(classified, dimensions, gaps, recommendation);

    // Phase 2 — Truth Engine (configurable weighted scoring)
    const truthProfile = getProfileForMode(input.mode);
    const truthResult = runTruthEngine(dimensions, truthProfile);

    // Phase 4 — Asset Generator (skip for Reject)
    const isReject = truthResult.verdict === "Reject" || opportunityPacket.status === "Reject";
    const assets = isReject ? null : buildAssetPackage(packet, opportunityPacket, input.mode, executionTier);

    // Persist — non-blocking
    let analysisRunId: string | null = null;
    try {
      const run = await prisma.analysisRun.create({
        data: {
          ...(userId ? { userId } : {}),
          mode: input.mode,
          rawSignals: { ...(signals as object), executionTier } as object,
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
      analysisRunId = run.id;

      const assessment = await prisma.opportunityAssessment.create({
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
            opportunityAssessmentId: assessment.id,
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
    } catch (dbErr) {
      console.error("DB write failed (non-fatal):", dbErr);
    }

    return NextResponse.json({
      ok: true,
      analysis: {
        id: analysisRunId,
        mode: input.mode,
        executionTier,
        inputUrl: input.url,
        linkType,
        title: page.title || signals.productName,
        score: truthResult.totalScore,
        verdict: truthResult.verdict,
        confidence: truthResult.confidence,
        summary: packet.summary,
        decisionPacket: packet,
      },
      opportunityAssessment: opportunityPacket,
      truthEngine: {
        totalScore: truthResult.totalScore,
        verdict: truthResult.verdict,
        confidence: truthResult.confidence,
        profile: truthResult.profile,
        breakdown: truthResult.breakdown,
        diagnostics: truthResult.diagnostics,
        strengthSummary: truthResult.strengthSummary,
        weaknessSummary: truthResult.weaknessSummary,
        actionPlan: truthResult.actionPlan,
      },
      assetPackage: assets,
    });
  } catch (err) {
    console.error("Analysis error:", err);
    return NextResponse.json({ ok: false, error: "Analysis failed. Please try again." }, { status: 500 });
  }
}
