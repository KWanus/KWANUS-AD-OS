// ---------------------------------------------------------------------------
// POST /api/ads/optimize
// Run the auto-optimizer on a specific campaign or all active campaigns
// GET — run for all (called by cron)
// POST — run for specific campaign
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { optimizeCampaign, optimizeAllCampaigns, type AdPerformance } from "@/lib/ads/autoOptimizer";

/** GET — optimize all active campaigns (cron) */
export async function GET() {
  try {
    const result = await optimizeAllCampaigns();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Optimize all error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

/** POST — optimize a specific campaign */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      campaignId: string;
      performances?: AdPerformance[];
    };

    const result = await optimizeCampaign({
      userId: user.id,
      campaignId: body.campaignId,
      performances: body.performances ?? [],
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Optimize error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
