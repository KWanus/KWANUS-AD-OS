import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/himalaya/run/[runId]
 *
 * Returns a saved Himalaya run by ID.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;

    const run = await prisma.himalayaRun.findUnique({
      where: { id: runId },
    });

    if (!run) {
      return NextResponse.json({ ok: false, error: "Run not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      runId: run.id,
      mode: run.mode,
      status: run.status,
      input: run.input,
      diagnosis: run.diagnosis,
      strategy: run.strategy,
      generated: run.generation,
      results: run.results,
      trace: run.trace,
      createdAt: run.createdAt,
    });
  } catch (err) {
    console.error("Himalaya run fetch error:", err);
    return NextResponse.json({ ok: false, error: "Failed to load run." }, { status: 500 });
  }
}
