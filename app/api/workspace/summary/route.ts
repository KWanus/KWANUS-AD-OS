import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * GET /api/workspace/summary
 * Returns a compact workspace summary for AI context and quick overviews.
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const [
      userRecord,
      clientStats,
      campaignStats,
      siteStats,
      flowStats,
      analysisStats,
      leadStats,
      topClient,
      latestAnalysis,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { plan: true, credits: true, businessType: true, workspaceName: true, onboardingCompleted: true },
      }),
      prisma.client.groupBy({
        by: ["healthStatus"],
        where: { userId: user.id },
        _count: true,
      }),
      prisma.campaign.groupBy({
        by: ["status"],
        where: { userId: user.id },
        _count: true,
      }),
      prisma.site.aggregate({
        where: { userId: user.id },
        _count: true,
      }),
      prisma.emailFlow.groupBy({
        by: ["status"],
        where: { userId: user.id },
        _count: true,
      }),
      prisma.analysisRun.aggregate({
        where: { userId: user.id },
        _count: true,
        _avg: { score: true },
      }),
      prisma.lead.aggregate({
        where: { userId: user.id },
        _count: true,
      }),
      prisma.client.findFirst({
        where: { userId: user.id },
        orderBy: { dealValue: "desc" },
        select: { name: true, dealValue: true, pipelineStage: true },
      }),
      prisma.analysisRun.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: { title: true, score: true, verdict: true },
      }),
    ]);

    const clientsByHealth: Record<string, number> = {};
    for (const g of clientStats) clientsByHealth[g.healthStatus] = g._count;

    const campaignsByStatus: Record<string, number> = {};
    for (const g of campaignStats) campaignsByStatus[g.status] = g._count;

    const flowsByStatus: Record<string, number> = {};
    for (const g of flowStats) flowsByStatus[g.status] = g._count;

    return NextResponse.json({
      ok: true,
      summary: {
        workspace: userRecord?.workspaceName ?? "Himalaya",
        plan: userRecord?.plan ?? "free",
        credits: userRecord?.credits ?? 0,
        businessType: userRecord?.businessType,
        onboarded: userRecord?.onboardingCompleted ?? false,
        clients: {
          total: Object.values(clientsByHealth).reduce((s, c) => s + c, 0),
          healthy: clientsByHealth["green"] ?? 0,
          atRisk: clientsByHealth["yellow"] ?? 0,
          critical: clientsByHealth["red"] ?? 0,
        },
        campaigns: campaignsByStatus,
        sites: siteStats._count,
        emailFlows: flowsByStatus,
        analyses: {
          total: analysisStats._count,
          avgScore: Math.round(analysisStats._avg.score ?? 0),
        },
        leads: leadStats._count,
        highlights: {
          topClient: topClient ? `${topClient.name} ($${topClient.dealValue?.toLocaleString() ?? 0})` : null,
          latestScan: latestAnalysis ? `${latestAnalysis.title} (${latestAnalysis.score}/100 — ${latestAnalysis.verdict})` : null,
        },
      },
    });
  } catch (err) {
    console.error("Workspace summary error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
