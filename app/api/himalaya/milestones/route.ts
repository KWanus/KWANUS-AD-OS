import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { checkMilestones, getTaxGuidance } from "@/lib/himalaya/milestones";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });

    const milestones = await checkMilestones(user.id);
    const achieved = milestones.filter(m => m.achieved);
    const next = milestones.find(m => !m.achieved);

    // Calculate revenue for tax guidance
    const revenueMilestone = milestones.find(m => m.id === "revenue_10000" && m.achieved)
      ? 10000
      : milestones.find(m => m.id === "revenue_5000" && m.achieved)
      ? 5000
      : milestones.find(m => m.id === "revenue_1000" && m.achieved)
      ? 1000
      : milestones.find(m => m.id === "revenue_100" && m.achieved)
      ? 100
      : 0;

    const taxGuidance = getTaxGuidance(revenueMilestone);

    return NextResponse.json({
      ok: true,
      milestones,
      achieved: achieved.length,
      total: milestones.length,
      next: next ?? null,
      taxGuidance,
    });
  } catch (err) {
    console.error("Milestones error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
