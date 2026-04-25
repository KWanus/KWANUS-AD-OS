import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const { runId } = await params;

    const run = await prisma.marketIntelligence.findFirst({
      where: { id: runId, userId: user.id },
    });

    if (!run) {
      return NextResponse.json({ ok: false, error: "Run not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      run: {
        id: run.id,
        niche: run.niche,
        subNiche: run.subNiche,
        vertical: run.vertical,
        status: run.status,
        score: run.score,
        executionTier: run.executionTier,
        topProductName: run.topProductName,
        topProductUrl: run.topProductUrl,
        estimatedEarnings: run.estimatedEarnings,
        discoveredProducts: run.products,
        winnerProfiles: run.winnerAnalysis,
        adIntelligence: run.adIntelligence,
        synthesis: run.marketSynthesis,
        generatedAssets: run.generatedAssets,
        funnelBlueprint: run.funnelBlueprint,
        createdAt: run.createdAt,
      },
    });
  } catch (error) {
    console.error("[market-intelligence/[runId]] GET error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to load run" },
      { status: 500 }
    );
  }
}
