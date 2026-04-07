// ---------------------------------------------------------------------------
// GET /api/intelligence/leaks — detect revenue leaks in the funnel
// Returns dollar-value of each leak with prioritized fixes
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { detectRevenueLeaks } from "@/lib/intelligence/revenueLeakDetector";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const report = await detectRevenueLeaks(user.id);
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    console.error("Leak detection error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
