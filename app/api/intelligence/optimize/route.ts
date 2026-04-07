// ---------------------------------------------------------------------------
// GET /api/intelligence/optimize — run autonomous optimizer
// Scans entire system and returns prioritized optimization actions
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { runAutonomousOptimization } from "@/lib/intelligence/autonomousOptimizer";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const report = await runAutonomousOptimization(user.id);
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    console.error("Optimizer error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
