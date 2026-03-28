import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { isDatabaseUnavailable } from "@/lib/db/runtime";

/**
 * GET /api/dashboard
 * Single endpoint that returns all data needed for the dashboard in one request.
 * Eliminates the need for 10+ parallel fetches on the home page.
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      clientCount,
      atRiskClients,
      campaignCount,
      activeCampaigns,
      siteCount,
      publishedSites,
      leadCount,
      emailFlowCount,
      analysisCount,
      recentAnalyses,
      recentClients,
      recentLeads,
      pipelineValue,
      wonRevenue,
      clientsThisMonth,
      analysesThisMonth,
    ] = await Promise.all([
      prisma.client.count({ where: { userId: user.id } }),
      prisma.client.findMany({
        where: { userId: user.id, healthStatus: { in: ["red", "yellow"] } },
        select: { id: true, name: true, healthScore: true, healthStatus: true, lastContactAt: true },
        orderBy: { healthScore: "asc" },
        take: 5,
      }),
      prisma.campaign.count({ where: { userId: user.id } }),
      prisma.campaign.count({ where: { userId: user.id, status: { in: ["active", "testing", "scaling"] } } }),
      prisma.site.count({ where: { userId: user.id } }),
      prisma.site.count({ where: { userId: user.id, published: true } }),
      prisma.lead.count({ where: { userId: user.id } }),
      prisma.emailFlow.count({ where: { userId: user.id } }),
      prisma.analysisRun.count({ where: { userId: user.id } }),
      prisma.analysisRun.findMany({
        where: { userId: user.id },
        select: { id: true, title: true, inputUrl: true, score: true, verdict: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.client.findMany({
        where: { userId: user.id },
        select: { id: true, name: true, pipelineStage: true, healthScore: true, healthStatus: true, dealValue: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.lead.findMany({
        where: { userId: user.id },
        select: { id: true, name: true, niche: true, location: true, status: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.client.aggregate({
        where: { userId: user.id, pipelineStage: { notIn: ["won", "churned"] } },
        _sum: { dealValue: true },
      }),
      prisma.client.aggregate({
        where: { userId: user.id, pipelineStage: "won" },
        _sum: { dealValue: true },
      }),
      prisma.client.count({ where: { userId: user.id, createdAt: { gte: thisMonth } } }),
      prisma.analysisRun.count({ where: { userId: user.id, createdAt: { gte: thisMonth } } }),
    ]);

    return NextResponse.json({
      ok: true,
      dashboard: {
        counts: {
          clients: clientCount,
          campaigns: campaignCount,
          activeCampaigns,
          sites: siteCount,
          publishedSites,
          leads: leadCount,
          emailFlows: emailFlowCount,
          analyses: analysisCount,
        },
        revenue: {
          pipelineValue: pipelineValue._sum.dealValue ?? 0,
          wonRevenue: wonRevenue._sum.dealValue ?? 0,
        },
        growth: {
          clientsThisMonth,
          analysesThisMonth,
        },
        atRiskClients,
        recentAnalyses,
        recentClients,
        recentLeads,
      },
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    if (isDatabaseUnavailable(err)) {
      return NextResponse.json({ ok: true, dashboard: null, databaseUnavailable: true });
    }
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
