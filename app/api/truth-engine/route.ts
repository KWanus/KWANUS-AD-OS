import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { runTruthEngine, SCORING_PROFILES } from "@/rules/truthEngine";
import type { DimensionScores } from "@/src/logic/ad-os/scoreOpportunityDimensions";

// GET /api/truth-engine — list available scoring profiles
export async function GET() {
  const profiles = Object.entries(SCORING_PROFILES).map(([key, profile]) => ({
    key,
    name: profile.name,
    description: profile.description,
    weights: profile.weights,
    thresholds: profile.thresholds,
  }));

  return NextResponse.json({ ok: true, profiles });
}

// POST /api/truth-engine — re-score an analysis with a different profile
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      analysisId?: string;
      dimensions?: DimensionScores;
      profile?: string;
    };

    // Validate profile
    const profileKey = body.profile ?? "balanced";
    if (!(profileKey in SCORING_PROFILES)) {
      const valid = Object.keys(SCORING_PROFILES).join(", ");
      return NextResponse.json({ ok: false, error: `Invalid profile. Must be one of: ${valid}` }, { status: 400 });
    }

    let dimensions: DimensionScores;

    if (body.dimensions) {
      // Validate dimension bounds (0-100)
      const DIMENSION_KEYS: (keyof DimensionScores)[] = [
        "demandPotential", "offerStrength", "emotionalLeverage", "trustCredibility",
        "conversionReadiness", "adViability", "emailLifecyclePotential", "seoPotential",
        "differentiation", "risk",
      ];
      for (const key of DIMENSION_KEYS) {
        const val = body.dimensions[key];
        if (val !== undefined && val !== null) {
          const num = Number(val);
          if (isNaN(num) || num < 0 || num > 100) {
            return NextResponse.json({ ok: false, error: `${key} must be 0-100` }, { status: 400 });
          }
          body.dimensions[key] = Math.round(num);
        } else {
          body.dimensions[key] = 0;
        }
      }
      dimensions = body.dimensions;
    } else if (body.analysisId) {
      // Load from saved analysis
      const analysis = await prisma.analysisRun.findFirst({
        where: { id: body.analysisId, userId: user.id },
        include: { opportunityAssessments: { take: 1 } },
      });

      if (!analysis) {
        return NextResponse.json({ ok: false, error: "Analysis not found" }, { status: 404 });
      }

      const opp = analysis.opportunityAssessments[0];
      if (!opp) {
        return NextResponse.json({ ok: false, error: "No opportunity data for this analysis" }, { status: 404 });
      }

      dimensions = {
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
      };
    } else {
      return NextResponse.json({ ok: false, error: "Provide analysisId or dimensions" }, { status: 400 });
    }

    const result = runTruthEngine(dimensions, profileKey);

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("Truth engine error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
