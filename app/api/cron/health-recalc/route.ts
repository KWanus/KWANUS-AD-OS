import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeHealthScore } from "@/lib/clients/healthScore";
import { config } from "@/lib/config";

/**
 * POST /api/cron/health-recalc
 * Recalculate health scores for ALL clients across ALL users.
 * Designed to be called by a cron job (Vercel Cron, n8n, or external scheduler).
 *
 * Secured via CRON_SECRET header — not Clerk auth (runs system-wide).
 */

const PLACEHOLDER_PATTERNS = ["REPLACE_ME", "PLACEHOLDER", "CHANGEME", "YOUR_SECRET", "XXXXX"];

function isPlaceholder(val: string) {
  return PLACEHOLDER_PATTERNS.some((p) => val.toUpperCase().includes(p));
}

function verifyCronSecret(req: NextRequest): boolean {
  const secret = config.cronSecret;
  // Fail closed: if secret is not configured or is a placeholder, deny all access
  if (!secret || isPlaceholder(secret)) return false;

  const provided =
    req.headers.get("x-cron-secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  // Constant-time-ish comparison to avoid timing attacks
  if (!provided || provided.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < secret.length; i++) {
    diff |= secret.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return diff === 0;
}

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
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

    // Compute new scores, then batch all writes in a single transaction
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
          prisma.client.update({ where: { id }, data: { healthScore: score, healthStatus: status } })
        )
      );
    }
    const updated = updates.length;

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
