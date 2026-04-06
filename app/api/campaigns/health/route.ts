// ---------------------------------------------------------------------------
// GET /api/campaigns/health — health check across all campaigns
// Returns issues, scores, and recommendations
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { checkCampaignHealth } from "@/lib/campaigns/campaignHealth";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const campaigns = await prisma.campaign.findMany({
      where: { userId: user.id },
      include: {
        adVariations: {
          select: { type: true, status: true, metrics: true, content: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const healthChecks = campaigns.map((c) =>
      checkCampaignHealth({
        id: c.id,
        name: c.name,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
        adVariations: c.adVariations.map((v) => ({
          type: v.type,
          status: v.status,
          metrics: v.metrics as Record<string, number> | null,
          content: v.content as Record<string, unknown>,
        })),
        hasAnalysis: !!c.analysisRunId,
      })
    );

    const critical = healthChecks.filter((h) => h.status === "critical").length;
    const warning = healthChecks.filter((h) => h.status === "warning").length;
    const healthy = healthChecks.filter((h) => h.status === "healthy").length;
    const avgScore = healthChecks.length > 0
      ? Math.round(healthChecks.reduce((s, h) => s + h.score, 0) / healthChecks.length)
      : 0;

    return NextResponse.json({
      ok: true,
      summary: { total: healthChecks.length, healthy, warning, critical, avgScore },
      campaigns: healthChecks,
    });
  } catch (err) {
    console.error("Campaign health error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
