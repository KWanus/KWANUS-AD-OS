/**
 * GET /api/automations/[id]/stats
 * Returns aggregated stats for an automation including run history metrics.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const automation = await prisma.automation.findFirst({
      where: { id, userId: user.id },
      select: {
        id: true,
        name: true,
        status: true,
        trigger: true,
        runsTotal: true,
        runsSuccess: true,
        runsFailed: true,
        lastRunAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!automation) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    // Aggregate from runs for more detailed metrics
    const [runAgg, recentRuns, pausedCount] = await Promise.all([
      prisma.automationRun.aggregate({
        where: { automationId: id },
        _sum: { emailsSent: true, contactsCount: true, errorCount: true },
        _avg: { emailsSent: true },
      }),
      prisma.automationRun.findMany({
        where: { automationId: id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, status: true, emailsSent: true, contactsCount: true, startedAt: true, completedAt: true },
      }),
      prisma.automationRun.count({
        where: { automationId: id, status: "paused" },
      }),
    ]);

    const successRate = automation.runsTotal > 0
      ? Math.round((automation.runsSuccess / automation.runsTotal) * 1000) / 10
      : 0;

    return NextResponse.json({
      ok: true,
      stats: {
        ...automation,
        successRate,
        pausedRuns: pausedCount,
        totalEmailsSent: runAgg._sum.emailsSent ?? 0,
        totalContactsProcessed: runAgg._sum.contactsCount ?? 0,
        totalErrors: runAgg._sum.errorCount ?? 0,
        avgEmailsPerRun: Math.round((runAgg._avg.emailsSent ?? 0) * 10) / 10,
        recentRuns,
      },
    });
  } catch (err) {
    console.error("Automation stats error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
