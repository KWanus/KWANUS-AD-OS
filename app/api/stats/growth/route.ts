import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * GET /api/stats/growth
 * Returns month-over-month growth metrics for dashboard.
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      clientsThisMonth, clientsLastMonth,
      campaignsThisMonth, campaignsLastMonth,
      analysesThisMonth, analysesLastMonth,
      leadsThisMonth, leadsLastMonth,
      sitesThisMonth, sitesLastMonth,
    ] = await Promise.all([
      prisma.client.count({ where: { userId: user.id, createdAt: { gte: thisMonth } } }),
      prisma.client.count({ where: { userId: user.id, createdAt: { gte: lastMonth, lt: thisMonth } } }),
      prisma.campaign.count({ where: { userId: user.id, createdAt: { gte: thisMonth } } }),
      prisma.campaign.count({ where: { userId: user.id, createdAt: { gte: lastMonth, lt: thisMonth } } }),
      prisma.analysisRun.count({ where: { userId: user.id, createdAt: { gte: thisMonth } } }),
      prisma.analysisRun.count({ where: { userId: user.id, createdAt: { gte: lastMonth, lt: thisMonth } } }),
      prisma.lead.count({ where: { userId: user.id, createdAt: { gte: thisMonth } } }),
      prisma.lead.count({ where: { userId: user.id, createdAt: { gte: lastMonth, lt: thisMonth } } }),
      prisma.site.count({ where: { userId: user.id, createdAt: { gte: thisMonth } } }),
      prisma.site.count({ where: { userId: user.id, createdAt: { gte: lastMonth, lt: thisMonth } } }),
    ]);

    function growth(current: number, previous: number) {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    }

    return NextResponse.json({
      ok: true,
      metrics: {
        clients: { thisMonth: clientsThisMonth, lastMonth: clientsLastMonth, growth: growth(clientsThisMonth, clientsLastMonth) },
        campaigns: { thisMonth: campaignsThisMonth, lastMonth: campaignsLastMonth, growth: growth(campaignsThisMonth, campaignsLastMonth) },
        analyses: { thisMonth: analysesThisMonth, lastMonth: analysesLastMonth, growth: growth(analysesThisMonth, analysesLastMonth) },
        leads: { thisMonth: leadsThisMonth, lastMonth: leadsLastMonth, growth: growth(leadsThisMonth, leadsLastMonth) },
        sites: { thisMonth: sitesThisMonth, lastMonth: sitesLastMonth, growth: growth(sitesThisMonth, sitesLastMonth) },
      },
    });
  } catch (err) {
    console.error("Growth stats error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
