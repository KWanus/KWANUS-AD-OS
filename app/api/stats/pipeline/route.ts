import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * GET /api/stats/pipeline
 * Returns pipeline value breakdown by stage, win rate, and revenue stats.
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const clients = await prisma.client.findMany({
      where: { userId: user.id },
      select: { pipelineStage: true, dealValue: true, healthScore: true, healthStatus: true, createdAt: true },
    });

    const stages = ["lead", "qualified", "proposal", "active", "won", "churned"];
    const breakdown = stages.map(stage => {
      const stageClients = clients.filter(c => c.pipelineStage === stage);
      return {
        stage,
        count: stageClients.length,
        totalValue: stageClients.reduce((s, c) => s + (c.dealValue ?? 0), 0),
        avgHealth: stageClients.length > 0
          ? Math.round(stageClients.reduce((s, c) => s + c.healthScore, 0) / stageClients.length)
          : 0,
      };
    });

    const totalClients = clients.length;
    const wonClients = clients.filter(c => c.pipelineStage === "won");
    const churnedClients = clients.filter(c => c.pipelineStage === "churned");
    const activeClients = clients.filter(c => !["won", "churned"].includes(c.pipelineStage));

    const totalPipelineValue = activeClients.reduce((s, c) => s + (c.dealValue ?? 0), 0);
    const wonRevenue = wonClients.reduce((s, c) => s + (c.dealValue ?? 0), 0);
    const lostRevenue = churnedClients.reduce((s, c) => s + (c.dealValue ?? 0), 0);

    const closedClients = wonClients.length + churnedClients.length;
    const winRate = closedClients > 0 ? Math.round((wonClients.length / closedClients) * 100) : 0;

    const avgDealSize = wonClients.length > 0
      ? Math.round(wonRevenue / wonClients.length)
      : 0;

    // Weighted pipeline (probability by stage)
    const stageProbabilities: Record<string, number> = {
      lead: 0.1, qualified: 0.25, proposal: 0.5, active: 0.75, won: 1, churned: 0,
    };
    const weightedPipeline = activeClients.reduce((s, c) => {
      const prob = stageProbabilities[c.pipelineStage] ?? 0.1;
      return s + (c.dealValue ?? 0) * prob;
    }, 0);

    return NextResponse.json({
      ok: true,
      pipeline: {
        breakdown,
        totalClients,
        totalPipelineValue,
        weightedPipeline: Math.round(weightedPipeline),
        wonRevenue,
        lostRevenue,
        winRate,
        avgDealSize,
        atRisk: clients.filter(c => c.healthStatus === "red").length,
        healthy: clients.filter(c => c.healthStatus === "green").length,
      },
    });
  } catch (err) {
    console.error("Pipeline stats error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
