import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeHealthScore } from "@/lib/clients/healthScore";

/**
 * POST /api/cron/health-recalc
 * Recalculate health scores for ALL clients across ALL users.
 * Designed to be called by a cron job (Vercel Cron, n8n, or external scheduler).
 *
 * Secured via CRON_SECRET header — not Clerk auth (runs system-wide).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get("x-cron-secret") ?? req.headers.get("authorization")?.replace("Bearer ", "");

  if (secret && secret !== "REPLACE_ME" && provided !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
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
    });

    let updated = 0;
    for (const client of clients) {
      const { score, status } = computeHealthScore({
        lastContactAt: client.lastContactAt,
        pipelineStage: client.pipelineStage,
        dealValue: client.dealValue,
        createdAt: client.createdAt,
      });

      if (score !== client.healthScore || status !== client.healthStatus) {
        await prisma.client.update({
          where: { id: client.id },
          data: { healthScore: score, healthStatus: status },
        });
        updated++;
      }
    }

    return NextResponse.json({
      ok: true,
      total: clients.length,
      updated,
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
