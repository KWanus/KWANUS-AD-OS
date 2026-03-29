import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { computeHealthScore } from "@/lib/clients/healthScore";

/**
 * POST /api/clients/recalculate-health
 * Recalculate health scores for all clients.
 * Useful when health scores become stale (e.g. lastContactAt hasn't changed but days have passed).
 */
export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const clients = await prisma.client.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        lastContactAt: true,
        pipelineStage: true,
        dealValue: true,
        createdAt: true,
        healthScore: true,
        healthStatus: true,
      },
    });

    // Compute new scores and batch-update changed ones
    const updates: { id: string; score: number; status: string }[] = [];
    for (const client of clients) {
      const { score, status } = computeHealthScore({
        lastContactAt: client.lastContactAt,
        pipelineStage: client.pipelineStage,
        dealValue: client.dealValue,
        createdAt: client.createdAt,
      });
      if (score !== client.healthScore || status !== client.healthStatus) {
        updates.push({ id: client.id, score, status });
      }
    }

    // Batch updates in transaction (50 per batch to avoid timeouts)
    let updated = 0;
    for (let i = 0; i < updates.length; i += 50) {
      const batch = updates.slice(i, i + 50);
      await prisma.$transaction(
        batch.map(u => prisma.client.update({
          where: { id: u.id },
          data: { healthScore: u.score, healthStatus: u.status },
        }))
      );
      updated += batch.length;
    }

    return NextResponse.json({
      ok: true,
      total: clients.length,
      updated,
      message: updated > 0
        ? `Updated ${updated} of ${clients.length} client health scores.`
        : "All health scores are current.",
    });
  } catch (err) {
    console.error("Health recalculate:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
