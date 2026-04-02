import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { runHimalaya } from "@/lib/himalaya/orchestrator";
import type { HimalayaUserInput } from "@/lib/himalaya/contracts";

/**
 * POST /api/himalaya/run
 *
 * Universal entry point for running the Himalaya pipeline.
 * Accepts both scratch and improve inputs.
 * Returns full pipeline result with trace.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as HimalayaUserInput;

    if (!body.mode) {
      return NextResponse.json({ ok: false, error: "mode is required (scratch or improve)" }, { status: 400 });
    }

    if (body.mode === "scratch" && (!body.profileId || !body.path)) {
      return NextResponse.json({ ok: false, error: "profileId and path required for scratch mode" }, { status: 400 });
    }

    const result = await runHimalaya(body, user.id);

    return NextResponse.json({
      ok: result.success,
      runId: result.runId,
      mode: result.mode,
      title: result.title,
      summary: result.summary,
      strategy: result.strategy,
      trace: result.trace,
      error: result.success ? undefined : "Pipeline completed with failures",
    });
  } catch (err) {
    console.error("Himalaya run error:", err);
    return NextResponse.json({ ok: false, error: "Pipeline failed" }, { status: 500 });
  }
}
