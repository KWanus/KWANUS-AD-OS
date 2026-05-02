import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VERTICAL_TO_BUSINESS: Record<string, string> = {
  affiliate: "affiliate",
  dropship: "ecommerce",
  ecommerce: "ecommerce",
  digital: "content_creator",
  local_service: "local_service",
};

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
    const strategy = (synthesis?.winningStrategy ?? {}) as Record<string, unknown>;
    const audience = (synthesis?.targetAudience ?? {}) as Record<string, unknown>;
    const bestProduct = (synthesis?.bestProduct ?? {}) as Record<string, unknown>;

    const descriptionParts: string[] = [];
    if (bestProduct.name) descriptionParts.push(`Top product: ${bestProduct.name}`);
    if (strategy.primaryAngle) descriptionParts.push(`Angle: ${strategy.primaryAngle}`);
    if (typeof audience.demographics === "string") descriptionParts.push(`Audience: ${audience.demographics}`);

    const businessType = VERTICAL_TO_BUSINESS[run.vertical] ?? "affiliate";

    return NextResponse.json({
      ok: true,
      himalayaInput: {
        businessType,
        niche: run.subNiche ?? run.niche,
        goal: "more_leads",
        description: descriptionParts.join(". ") || `${run.niche} business based on market intelligence`,
      },
    });
  } catch (error) {
    console.error("[market-intelligence/to-himalaya] error:", error);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
