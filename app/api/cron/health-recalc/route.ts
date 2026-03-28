import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeHealthScore } from "@/lib/clients/healthScore";

const BATCH_SIZE = 200;

/**
 * POST /api/cron/health-recalc
 * Recalculate health scores for ALL clients across ALL users.
 * Designed to be called by a cron job (Vercel Cron, n8n, or external scheduler).
 *
 * Secured via CRON_SECRET header — not Clerk auth (runs system-wide).
 * Processes clients in batches to prevent timeouts on large datasets.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get("x-cron-secret") ?? req.headers.get("authorization")?.replace("Bearer ", "");

  if (!secret || secret === "REPLACE_ME") {
    // In production, reject if CRON_SECRET not configured
    if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
      return NextResponse.json({ ok: false, error: "CRON_SECRET not configured" }, { status: 403 });
    }
    console.warn("CRON_SECRET not configured — allowing in development");
  } else if (provided !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    let totalProcessed = 0;
    let totalUpdated = 0;
    let cursor: string | undefined;

    while (true) {
      const clients = await prisma.client.findMany({
        select: {
          id: true,
          lastContactAt: true,
          pipelineStage: true,
          dealValue: true,
          createdAt: true,
          healthScore: true,
          healthStatus: true,
        },
        take: BATCH_SIZE,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { id: "asc" },
      });

      if (clients.length === 0) break;

      // Batch updates: collect all that need updating, then do them in a transaction
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

      if (updates.length > 0) {
        await prisma.$transaction(
          updates.map(({ id, score, status }) =>
            prisma.client.update({
              where: { id },
              data: { healthScore: score, healthStatus: status },
            })
          )
        );
        totalUpdated += updates.length;
      }

      totalProcessed += clients.length;
      cursor = clients[clients.length - 1].id;

      // If we got fewer than BATCH_SIZE, we're done
      if (clients.length < BATCH_SIZE) break;
    }

    return NextResponse.json({
      ok: true,
      total: totalProcessed,
      updated: totalUpdated,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Cron health recalc error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

// Also support GET for simple cron services that only do GET
export async function GET(req: NextRequest) {
  return POST(req);
}
