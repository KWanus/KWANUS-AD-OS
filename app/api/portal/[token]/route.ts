// ---------------------------------------------------------------------------
// GET /api/portal/[token] — Public client portal
// Returns deliverables for a specific analysis run via shareable token
// No auth needed — accessed by the client
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Token is the analysis run ID (simple, no extra tables needed)
    const run = await prisma.analysisRun.findUnique({
      where: { id: token },
      include: { assetPackages: true },
    });

    if (!run) {
      return NextResponse.json({ ok: false, error: "Portal not found" }, { status: 404 });
    }

    const assets = run.assetPackages[0];
    const packet = run.decisionPacket as Record<string, unknown> | null;
    const signals = run.rawSignals as Record<string, unknown> | null;
    const foundation = signals?.foundation as Record<string, unknown> | undefined;
    const strategy = signals?.himalayaStrategy as Record<string, unknown> | undefined;

    // Build client-safe view (no internal data exposed)
    const portal = {
      title: run.title,
      score: run.score,
      verdict: run.verdict,
      summary: run.summary,
      createdAt: run.createdAt,

      // Strategy
      priorities: (strategy?.priorities as unknown[]) ?? [],
      reasoning: (strategy?.reasoning as string[]) ?? [],

      // Business profile
      businessProfile: foundation?.businessProfile ?? null,
      idealCustomer: foundation?.idealCustomer ?? null,
      offerDirection: foundation?.offerDirection ?? null,

      // Generated assets
      adHooks: assets?.adHooks ?? [],
      landingPage: assets?.landingPage ?? null,
      emailSequences: assets?.emailSequences ?? null,
      executionChecklist: assets?.executionChecklist ?? null,

      // Analysis insights
      audience: packet?.audience ?? null,
      painDesire: packet?.painDesire ?? null,
      angle: packet?.angle ?? null,
      strengths: packet?.strengths ?? [],
      weaknesses: packet?.weaknesses ?? [],
    };

    return NextResponse.json({ ok: true, portal });
  } catch (err) {
    console.error("Portal error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
