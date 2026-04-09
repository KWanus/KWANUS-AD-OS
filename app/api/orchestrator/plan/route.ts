// ---------------------------------------------------------------------------
// POST /api/orchestrator/plan
// The master API: "I want $10k/month" → complete plan + ready to deploy
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { generateMasterPlan, type OrchestratorInput } from "@/lib/agents/masterOrchestrator";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as Omit<OrchestratorInput, "userId">;

    const plan = await generateMasterPlan({ ...body, userId: user.id });

    return NextResponse.json({ ok: true, plan });
  } catch (err) {
    console.error("Orchestrator error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
