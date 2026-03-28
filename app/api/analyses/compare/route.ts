import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * POST /api/analyses/compare
 * Compare two scan analyses side by side.
 * Returns both analyses with dimension score diffs highlighted.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { analysisIdA: string; analysisIdB: string };

    if (!body.analysisIdA || !body.analysisIdB) {
      return NextResponse.json({ ok: false, error: "Two analysis IDs required" }, { status: 400 });
    }

    const [a, b] = await Promise.all([
      prisma.analysisRun.findFirst({
        where: { id: body.analysisIdA, userId: user.id },
        include: { opportunityAssessments: { take: 1 } },
      }),
      prisma.analysisRun.findFirst({
        where: { id: body.analysisIdB, userId: user.id },
        include: { opportunityAssessments: { take: 1 } },
      }),
    ]);

    if (!a || !b) {
      return NextResponse.json({ ok: false, error: "One or both analyses not found" }, { status: 404 });
    }

    const oppA = a.opportunityAssessments[0];
    const oppB = b.opportunityAssessments[0];

    const dimensions = [
      "demandPotential", "offerStrength", "emotionalLeverage", "trustCredibility",
      "conversionReadiness", "adViability", "emailLifecyclePotential", "seoPotential",
      "differentiation", "risk",
    ] as const;

    const comparison = dimensions.map(dim => {
      const valA = (oppA?.[dim] ?? 0) as number;
      const valB = (oppB?.[dim] ?? 0) as number;
      const diff = valB - valA;
      return {
        dimension: dim,
        a: valA,
        b: valB,
        diff,
        winner: diff > 0 ? "b" : diff < 0 ? "a" : "tie",
      };
    });

    const scoreDiff = (b.score ?? 0) - (a.score ?? 0);

    return NextResponse.json({
      ok: true,
      analysisA: {
        id: a.id,
        title: a.title,
        inputUrl: a.inputUrl,
        score: a.score,
        verdict: a.verdict,
        mode: a.mode,
      },
      analysisB: {
        id: b.id,
        title: b.title,
        inputUrl: b.inputUrl,
        score: b.score,
        verdict: b.verdict,
        mode: b.mode,
      },
      comparison,
      scoreDiff,
      overallWinner: scoreDiff > 0 ? "b" : scoreDiff < 0 ? "a" : "tie",
      summary: `${scoreDiff > 0 ? b.title ?? b.inputUrl : a.title ?? a.inputUrl} scores ${Math.abs(scoreDiff)} points higher overall. ${
        comparison.filter(c => c.winner === "a").length
      } dimensions favor A, ${
        comparison.filter(c => c.winner === "b").length
      } favor B.`,
    });
  } catch (err) {
    console.error("Compare error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
