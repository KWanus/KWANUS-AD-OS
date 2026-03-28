import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * POST /api/campaigns/[id]/advance
 * Advance a campaign to the next workflow phase.
 * Phases: 1=SOURCE → 2=AUDIT → 3=STRATEGIZE → 4=PRODUCE → 5=DEPLOY
 */

const PHASE_NAMES: Record<number, string> = {
  1: "SOURCE",
  2: "AUDIT",
  3: "STRATEGIZE",
  4: "PRODUCE",
  5: "DEPLOY",
};

const STATUS_MAP: Record<number, string> = {
  1: "draft",
  2: "draft",
  3: "draft",
  4: "active",
  5: "active",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const campaign = await prisma.campaign.findFirst({
      where: { id, userId: user.id },
      select: { id: true, currentPhase: true, status: true, workflowState: true },
    });

    if (!campaign) {
      return NextResponse.json({ ok: false, error: "Campaign not found" }, { status: 404 });
    }

    const body = await req.json() as { phase?: number; status?: string };

    const currentPhase = campaign.currentPhase ?? 1;
    const nextPhase = body.phase ?? Math.min(currentPhase + 1, 5);

    if (nextPhase < 1 || nextPhase > 5) {
      return NextResponse.json({ ok: false, error: "Invalid phase (1-5)" }, { status: 400 });
    }

    const newStatus = body.status ?? STATUS_MAP[nextPhase] ?? campaign.status;
    const workflowState = (campaign.workflowState as Record<string, unknown>) ?? {};

    // Log phase transition
    workflowState[`phase${currentPhase}_completedAt`] = new Date().toISOString();
    workflowState[`phase${nextPhase}_startedAt`] = new Date().toISOString();

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        currentPhase: nextPhase,
        status: newStatus,
        workflowState: workflowState as object,
      },
    });

    return NextResponse.json({
      ok: true,
      campaign: {
        id: updated.id,
        currentPhase: nextPhase,
        phaseName: PHASE_NAMES[nextPhase],
        status: newStatus,
      },
      transition: {
        from: { phase: currentPhase, name: PHASE_NAMES[currentPhase] },
        to: { phase: nextPhase, name: PHASE_NAMES[nextPhase] },
      },
    });
  } catch (err) {
    console.error("Campaign advance error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
