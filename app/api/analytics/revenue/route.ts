import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { getDashboardMetrics, getCampaignROI } from "@/lib/analytics/revenueAttribution";

/** GET — Fetch revenue dashboard metrics */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const [metrics, campaigns] = await Promise.all([
      getDashboardMetrics(user.id),
      getCampaignROI(user.id),
    ]);

    return NextResponse.json({
      ok: true,
      metrics,
      campaigns,
    });
  } catch (err) {
    console.error("Revenue analytics error:", err);
    return NextResponse.json({ ok: false, error: "Failed to fetch analytics" }, { status: 500 });
  }
}
