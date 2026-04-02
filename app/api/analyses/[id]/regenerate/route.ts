import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { generateAdHooks } from "@/src/logic/ad-os/generateAdHooks";
import { generateAdScripts } from "@/src/logic/ad-os/generateAdScripts";
import { generateAdBriefs } from "@/src/logic/ad-os/generateAdBriefs";
import { generateLandingPage } from "@/src/logic/ad-os/generateLandingPage";
import { generateEmailSequences } from "@/src/logic/ad-os/generateEmailSequences";
import { generateExecutionChecklist } from "@/src/logic/ad-os/generateExecutionChecklist";
import type { DecisionPacket } from "@/src/logic/ad-os/buildDecisionPacket";
import type { OpportunityPacket } from "@/src/logic/ad-os/buildOpportunityPacket";
import type { AnalysisMode } from "@/src/logic/ad-os/normalizeInput";

const VALID_TARGETS = [
  "adHooks",
  "adScripts",
  "adBriefs",
  "landingPage",
  "emailSequences",
  "executionChecklist",
] as const;

type RegenerateTarget = (typeof VALID_TARGETS)[number];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as { target?: string };
    const target = body.target as RegenerateTarget;

    if (!target || !VALID_TARGETS.includes(target)) {
      return NextResponse.json(
        { ok: false, error: `Invalid target. Valid: ${VALID_TARGETS.join(", ")}` },
        { status: 400 }
      );
    }

    // Load analysis with decision packet and opportunity data
    const analysis = await prisma.analysisRun.findFirst({
      where: { id, userId: user.id },
      include: {
        opportunityAssessments: true,
        assetPackages: true,
      },
    });

    if (!analysis) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const packet = analysis.decisionPacket as unknown as DecisionPacket | null;
    if (!packet) {
      return NextResponse.json({ ok: false, error: "No decision packet available for regeneration" }, { status: 400 });
    }

    const opp = analysis.opportunityAssessments[0];
    const mode = analysis.mode as AnalysisMode;

    // Build opportunity packet from stored data
    const opportunityPacket: OpportunityPacket | null = opp
      ? {
          status: opp.status,
          totalScore: opp.totalScore ?? 0,
          dimensionScores: {
            demandPotential: opp.demandPotential ?? 0,
            offerStrength: opp.offerStrength ?? 0,
            emotionalLeverage: opp.emotionalLeverage ?? 0,
            trustCredibility: opp.trustCredibility ?? 0,
            conversionReadiness: opp.conversionReadiness ?? 0,
            adViability: opp.adViability ?? 0,
            emailLifecyclePotential: opp.emailLifecyclePotential ?? 0,
            seoPotential: opp.seoPotential ?? 0,
            differentiation: opp.differentiation ?? 0,
            risk: opp.risk ?? 0,
          },
          topGaps: (opp.topGaps ?? []) as string[],
          topStrengths: (opp.topStrengths ?? []) as string[],
          recommendedPath: opp.recommendedPath ?? "",
          priorityActions: [],
          whyCouldWin: "",
          whyCouldFail: "",
          recommendedBlocks: [],
        }
      : null;

    // Regenerate the targeted asset
    let regenerated: Record<string, unknown> = {};

    switch (target) {
      case "adHooks":
        regenerated = { adHooks: generateAdHooks(packet, mode) };
        break;
      case "adScripts":
        regenerated = { adScripts: generateAdScripts(packet, mode) };
        break;
      case "adBriefs":
        regenerated = { adBriefs: generateAdBriefs(packet, mode) };
        break;
      case "landingPage":
        if (!opportunityPacket) {
          return NextResponse.json({ ok: false, error: "Opportunity data required for landing page" }, { status: 400 });
        }
        regenerated = { landingPage: generateLandingPage(packet, opportunityPacket, mode) };
        break;
      case "emailSequences":
        regenerated = { emailSequences: generateEmailSequences(packet, mode) };
        break;
      case "executionChecklist":
        if (!opportunityPacket) {
          return NextResponse.json({ ok: false, error: "Opportunity data required for checklist" }, { status: 400 });
        }
        regenerated = { executionChecklist: generateExecutionChecklist(opportunityPacket, mode) };
        break;
    }

    // Update the asset package in DB
    const existingAsset = analysis.assetPackages[0];
    if (existingAsset) {
      await prisma.assetPackage.update({
        where: { id: existingAsset.id },
        data: regenerated,
      });
    }

    return NextResponse.json({ ok: true, target, regenerated });
  } catch (err) {
    console.error("Regenerate error:", err);
    return NextResponse.json({ ok: false, error: "Regeneration failed" }, { status: 500 });
  }
}
