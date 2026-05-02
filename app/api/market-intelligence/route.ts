import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runMarketIntelligence, MIInput } from "@/lib/market-intelligence/engine";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as MIInput;
    if (!body.niche) {
      return NextResponse.json({ ok: false, error: "niche is required" }, { status: 400 });
    }

    const run = await prisma.marketIntelligence.create({
      data: {
        userId: user.id,
        niche: body.niche,
        subNiche: body.subNiche ?? null,
        vertical: body.vertical ?? "affiliate",
        executionTier: body.executionTier ?? "elite",
        status: "running",
      },
    });

    try {
      const result = await runMarketIntelligence(body);

      const updated = await prisma.marketIntelligence.update({
        where: { id: run.id },
        data: {
          status: "complete",
          score: result.score,
          topProductName: result.synthesis.bestProduct?.name ?? null,
          topProductUrl: result.synthesis.bestProduct?.url ?? null,
          discoveredProducts: result.discoveredProducts as unknown as Prisma.InputJsonValue,
          winnerAnalysis: result.winnerProfiles as unknown as Prisma.InputJsonValue,
          marketSynthesis: result.synthesis as unknown as Prisma.InputJsonValue,
          generatedAssets: result.generatedAssets as unknown as Prisma.InputJsonValue,
        },
      });

      return NextResponse.json({ ok: true, runId: updated.id, result });
    } catch (pipelineError) {
      await prisma.marketIntelligence.update({
        where: { id: run.id },
        data: {
          status: "failed",
          error: pipelineError instanceof Error ? pipelineError.message : "Pipeline failed",
        },
      });
      throw pipelineError;
    }
  } catch (error) {
    console.error("[market-intelligence] error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getOrCreateUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const runs = await prisma.marketIntelligence.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ ok: true, runs });
  } catch (error) {
    console.error("[market-intelligence] GET error:", error);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
