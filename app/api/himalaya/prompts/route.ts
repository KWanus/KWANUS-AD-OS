// ---------------------------------------------------------------------------
// GET /api/himalaya/prompts?runId=xxx
// Returns the full prompt kit for a given analysis run.
// These are niche-specific, ready-to-fire prompts for every tool.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { buildPromptKit, extractBusinessContext } from "@/lib/himalaya/promptEngine";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const runId = req.nextUrl.searchParams.get("runId");
    if (!runId) return NextResponse.json({ error: "runId required" }, { status: 400 });

    const run = await prisma.analysisRun.findFirst({
      where: { id: runId, userId: user.id },
    });

    if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

    const ctx = extractBusinessContext(run as {
      title?: string | null;
      mode: string;
      decisionPacket?: Record<string, unknown> | null;
      rawSignals?: Record<string, unknown> | null;
    });
    const kit = buildPromptKit(ctx);

    return NextResponse.json({ ok: true, context: ctx, prompts: kit });
  } catch (err) {
    console.error("Prompt generation error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
