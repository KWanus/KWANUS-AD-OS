// ---------------------------------------------------------------------------
// Meta Campaign Insights API — fetch performance metrics
// GET /api/ads/meta/campaigns/[campaignId]/insights?period=last_7d
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getMetaCampaignInsights } from "@/lib/ads/metaAdsService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { campaignId } = await params;
    const period = (req.nextUrl.searchParams.get("period") || "last_7d") as
      | "today"
      | "yesterday"
      | "last_7d"
      | "last_30d";

    const insights = await getMetaCampaignInsights(userId, campaignId, period);

    return NextResponse.json({ insights });
  } catch (err) {
    console.error("[API] Error fetching campaign insights:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch insights" },
      { status: 500 }
    );
  }
}
