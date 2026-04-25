import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const bestProduct = (synthesis?.bestProduct ?? {}) as Record<string, unknown>;
    const winningStrategy = (synthesis?.winningStrategy ?? {}) as Record<string, unknown>;
    const targetAudience = (synthesis?.targetAudience ?? {}) as Record<string, unknown>;

    const niche = run.subNiche ? `${run.niche} - ${run.subNiche}` : run.niche;
    const productName = run.topProductName ?? bestProduct.name ?? "Unknown Product";
    const primaryAngle = (winningStrategy.primaryAngle as string) ?? "";
    const audienceDesc = (targetAudience.demographics as string) ?? "";

    const verticalToBusinessType: Record<string, string> = {
      affiliate: "affiliate_marketing",
      dropship: "dropshipping",
      local_service: "local_service",
      coaching: "coaching",
      ecommerce: "ecommerce",
      info_product: "info_product",
    };

    const himalayaInput = {
      mode: "scratch" as const,
      businessType: verticalToBusinessType[run.vertical ?? "affiliate"] ?? "affiliate_marketing",
      niche,
      goal: `Launch a ${run.vertical ?? "affiliate"} business promoting "${productName}" in the ${niche} niche. ${primaryAngle ? `Primary angle: ${primaryAngle}.` : ""} ${audienceDesc ? `Target audience: ${audienceDesc}.` : ""}`,
      description: buildDescription(run, synthesis),
    };

    return NextResponse.json({
      ok: true,
      himalayaInput,
      metadata: {
        sourceRunId: runId,
        niche: run.niche,
        topProduct: run.topProductName,
        score: run.score,
      },
    });
  } catch (error) {
    console.error("[market-intelligence/to-himalaya] error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to convert" },
      { status: 500 }
    );
  }
}

function buildDescription(
  run: { niche: string; subNiche: string | null; vertical: string | null; topProductName: string | null; estimatedEarnings: string | null },
  synthesis: Record<string, unknown> | null
): string {
  const parts: string[] = [];

  parts.push(`Market intelligence scan of the "${run.niche}" niche${run.subNiche ? ` (sub-niche: ${run.subNiche})` : ""}.`);

  if (run.topProductName) {
    parts.push(`Top product identified: ${run.topProductName}.`);
  }
  if (run.estimatedEarnings) {
    parts.push(`Estimated earnings potential: ${run.estimatedEarnings}/day.`);
  }

  if (synthesis) {
    const strategy = synthesis.winningStrategy as Record<string, unknown> | undefined;
    if (strategy?.primaryAngle) {
      parts.push(`Winning angle: ${strategy.primaryAngle}.`);
    }
    if (strategy?.differentiator) {
      parts.push(`Key differentiator: ${strategy.differentiator}.`);
    }

    const audience = synthesis.targetAudience as Record<string, unknown> | undefined;
    if (audience?.demographics) {
      parts.push(`Target audience: ${audience.demographics}.`);
    }

    const funnel = synthesis.funnelBlueprint as Record<string, unknown> | undefined;
    if (funnel?.steps && Array.isArray(funnel.steps)) {
      parts.push(`Funnel: ${funnel.steps.length}-step blueprint ready.`);
    }
  }

  return parts.join(" ");
}
