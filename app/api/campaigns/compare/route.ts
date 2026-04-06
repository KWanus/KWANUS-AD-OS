// ---------------------------------------------------------------------------
// GET /api/campaigns/compare?ids=id1,id2
// Compare two campaigns side by side
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ids = req.nextUrl.searchParams.get("ids")?.split(",").filter(Boolean);
    if (!ids || ids.length < 2) {
      return NextResponse.json({ ok: false, error: "Provide 2 campaign IDs: ?ids=id1,id2" }, { status: 400 });
    }

    const campaigns = await prisma.campaign.findMany({
      where: { id: { in: ids.slice(0, 2) }, userId: user.id },
      include: {
        adVariations: { select: { id: true, name: true, type: true, status: true, metrics: true, platform: true } },
        analysisRun: { select: { title: true, score: true, verdict: true } },
      },
    });

    if (campaigns.length < 2) {
      return NextResponse.json({ ok: false, error: "Both campaigns must exist" }, { status: 404 });
    }

    const comparison = campaigns.map((c) => {
      const hooks = c.adVariations.filter((v) => v.type === "hook");
      const scripts = c.adVariations.filter((v) => v.type === "script");
      const winners = c.adVariations.filter((v) => v.status === "winner");
      const dead = c.adVariations.filter((v) => v.status === "dead");

      // Aggregate metrics
      const totalMetrics = c.adVariations.reduce(
        (acc, v) => {
          const m = (v.metrics ?? {}) as Record<string, number>;
          return {
            impressions: acc.impressions + (m.impressions ?? 0),
            clicks: acc.clicks + (m.clicks ?? 0),
            conversions: acc.conversions + (m.conversions ?? 0),
            spend: acc.spend + (m.spend ?? 0),
          };
        },
        { impressions: 0, clicks: 0, conversions: 0, spend: 0 }
      );

      const ctr = totalMetrics.impressions > 0 ? (totalMetrics.clicks / totalMetrics.impressions) * 100 : 0;
      const cvr = totalMetrics.clicks > 0 ? (totalMetrics.conversions / totalMetrics.clicks) * 100 : 0;

      return {
        id: c.id,
        name: c.name,
        status: c.status,
        mode: c.mode,
        analysis: c.analysisRun ? { title: c.analysisRun.title, score: c.analysisRun.score, verdict: c.analysisRun.verdict } : null,
        variations: {
          total: c.adVariations.length,
          hooks: hooks.length,
          scripts: scripts.length,
          winners: winners.length,
          dead: dead.length,
        },
        metrics: {
          ...totalMetrics,
          ctr: Math.round(ctr * 100) / 100,
          cvr: Math.round(cvr * 100) / 100,
          roas: totalMetrics.spend > 0 ? Math.round(((totalMetrics.conversions * 100) / totalMetrics.spend) * 100) / 100 : 0,
        },
        topVariation: winners[0] ?? hooks.sort((a, b) => {
          const ma = (a.metrics ?? {}) as Record<string, number>;
          const mb = (b.metrics ?? {}) as Record<string, number>;
          return (mb.conversions ?? 0) - (ma.conversions ?? 0);
        })[0] ?? null,
      };
    });

    return NextResponse.json({ ok: true, comparison });
  } catch (err) {
    console.error("Campaign compare error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
