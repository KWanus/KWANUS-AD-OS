import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { runId } = (await req.json()) as { runId?: string };
    if (!runId) {
      return NextResponse.json({ ok: false, error: "runId required" }, { status: 400 });
    }

    const run = await prisma.marketIntelligence.findFirst({
      where: { id: runId, userId: user.id },
    });

    if (!run) {
      return NextResponse.json({ ok: false, error: "Run not found" }, { status: 404 });
    }

    const synthesis = run.marketSynthesis as Record<string, unknown> | null;
    const assets = run.generatedAssets as Record<string, unknown> | null;
    const winners = run.winnerAnalysis as unknown[];

    const bestProduct = (synthesis?.bestProduct ?? {}) as Record<string, unknown>;
    const strategy = (synthesis?.winningStrategy ?? {}) as Record<string, unknown>;
    const audience = (synthesis?.targetAudience ?? {}) as Record<string, unknown>;
    const dayOnePlan = (synthesis?.dayOnePlan ?? {}) as Record<string, unknown>;

    const hooks = (assets?.hooks ?? []) as string[];
    const adScripts = (assets?.adScripts ?? []) as Array<Record<string, unknown>>;
    const emailSequence = (assets?.emailSequence ?? []) as Array<Record<string, unknown>>;

    const campaignName = `MI: ${run.niche}${run.topProductName ? ` — ${run.topProductName}` : ""}`;

    const workflowState = {
      executionTier: run.executionTier ?? "elite",
      sourceType: "market_intelligence",
      sourceRunId: runId,
      adHooks: hooks.map((h: string, i: number) => ({ format: `Hook ${i + 1}`, hook: h })),
      adScripts: adScripts.map((s) => ({
        title: String(s.title ?? "Ad Script"),
        duration: String(s.duration ?? "30s"),
        script: String(s.script ?? s.body ?? ""),
      })),
      landingPage: {
        headline: String(bestProduct.name ?? run.topProductName ?? ""),
        subheadline: String(strategy.primaryAngle ?? ""),
        benefitBullets: Array.isArray(audience.painPoints) ? (audience.painPoints as string[]).slice(0, 5) : [],
      },
      emailSequence: emailSequence.map((e) => ({
        subject: String(e.subject ?? ""),
        body: String(e.body ?? ""),
        timing: String(e.timing ?? e.sendDay ?? "Day 1"),
      })),
      targetAudience: audience,
      winningStrategy: strategy,
    };

    const campaign = await prisma.campaign.create({
      data: {
        userId: user.id,
        name: campaignName,
        mode: "operator",
        status: "draft",
        productName: run.topProductName ?? null,
        productUrl: run.topProductUrl ?? null,
        sourceType: "market_intelligence",
        workflowState: workflowState as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({
      ok: true,
      campaignId: campaign.id,
      campaignName: campaign.name,
    });
  } catch (error) {
    console.error("[market-intelligence/to-campaign] error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
