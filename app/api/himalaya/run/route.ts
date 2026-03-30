import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runHimalaya } from "@/lib/himalaya";
import type { HimalayaInput } from "@/lib/himalaya";

/**
 * Himalaya Run API
 *
 * POST with action:"save" — saves a completed run to the database
 * POST without action — runs the full pipeline end-to-end, saves, and returns results
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    let userId: string | null = null;
    try {
      const { userId: clerkId } = await auth();
      if (clerkId) {
        const user = await getOrCreateUser();
        userId = user?.id ?? null;
      }
    } catch { /* auth optional */ }

    // ── Save action: persist a completed run ─────────────────────────────
    if (body.action === "save") {
      const { mode, input, diagnosis, strategy, generated, created } = body;

      const run = await prisma.himalayaRun.create({
        data: {
          userId,
          mode,
          input: input || {},
          diagnosis: diagnosis || null,
          strategy: strategy || null,
          generation: generated || null,
          results: { mode, diagnosis, strategy, generated, created },
          trace: null,
          status: "complete",
        },
      });

      return NextResponse.json({ ok: true, runId: run.id });
    }

    // ── Full pipeline run ────────────────────────────────────────────────
    const input = body as HimalayaInput;
    if (input.mode !== "scratch" && input.mode !== "improve") {
      return NextResponse.json({ ok: false, error: "Invalid mode." }, { status: 400 });
    }

    const results = await runHimalaya(input, userId);

    // Persist the run
    const run = await prisma.himalayaRun.create({
      data: {
        userId,
        mode: input.mode,
        input: input as Record<string, unknown>,
        diagnosis: results.diagnosis as Record<string, unknown>,
        strategy: results.strategy as Record<string, unknown>,
        generation: results.generated as Record<string, unknown>,
        results: results as Record<string, unknown>,
        trace: results.trace as Record<string, unknown>,
        status: "complete",
      },
    });

    return NextResponse.json({ ok: true, runId: run.id, ...results });
  } catch (err) {
    console.error("Himalaya run error:", err);
    const message = err instanceof Error ? err.message : "Pipeline failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
