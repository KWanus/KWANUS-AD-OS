import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { runMarketIntelligence } from "@/lib/market-intelligence/engine";
import type { MarketIntelligenceInput } from "@/lib/market-intelligence/types";

// ---------------------------------------------------------------------------
// POST — Run full Market Intelligence pipeline
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Partial<MarketIntelligenceInput>;

    if (!body.niche || typeof body.niche !== "string" || body.niche.trim().length < 2) {
      return NextResponse.json({ ok: false, error: "Niche is required" }, { status: 400 });
    }

    const input: MarketIntelligenceInput = {
      niche: body.niche.trim(),
      subNiche: body.subNiche?.trim() || undefined,
      vertical: body.vertical ?? "affiliate",
      executionTier: body.executionTier ?? "elite",
      maxProducts: Math.min(body.maxProducts ?? 5, 8),
      includeAdIntelligence: body.includeAdIntelligence ?? true,
      generateAssets: body.generateAssets ?? true,
      specificUrls: body.specificUrls,
    };

    const result = await runMarketIntelligence(input);

    const run = await prisma.marketIntelligence.create({
      data: {
        userId: user.id,
        niche: input.niche,
        subNiche: input.subNiche ?? null,
        vertical: input.vertical ?? "affiliate",
        status: result.status,
        products: result.discoveredProducts as unknown as Prisma.InputJsonValue,
        winnerAnalysis: result.winnerProfiles as unknown as Prisma.InputJsonValue,
        adIntelligence: result.winnerProfiles.reduce(
          (acc: Record<string, unknown>, w) => ({ ...acc, [w.product.name]: w.adIntelligence }),
          {}
        ) as unknown as Prisma.InputJsonValue,
        marketSynthesis: (result.synthesis ?? {}) as unknown as Prisma.InputJsonValue,
        generatedAssets: (result.generatedAssets ?? {}) as unknown as Prisma.InputJsonValue,
        funnelBlueprint: (result.synthesis?.funnelBlueprint ?? {}) as unknown as Prisma.InputJsonValue,
        executionTier: input.executionTier ?? "elite",
        score: result.score,
        topProductName: result.synthesis?.bestProduct?.name ?? null,
        topProductUrl: result.synthesis?.bestProduct?.url ?? null,
        estimatedEarnings: result.synthesis?.bestProduct?.estimatedEarningsPerDay ?? null,
      },
    });

    return NextResponse.json({
      ok: true,
      runId: run.id,
      result: { ...result, id: run.id },
    });
  } catch (error) {
    console.error("[market-intelligence] POST error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// GET — List past Market Intelligence runs
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const user = await getOrCreateUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const runs = await prisma.marketIntelligence.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        niche: true,
        subNiche: true,
        vertical: true,
        status: true,
        score: true,
        topProductName: true,
        estimatedEarnings: true,
        executionTier: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, runs });
  } catch (error) {
    console.error("[market-intelligence] GET error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to load runs" },
      { status: 500 }
    );
  }
}
