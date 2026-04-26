// ---------------------------------------------------------------------------
// Meta Campaigns API — fetch and manage Meta ad campaigns
// GET /api/ads/meta/campaigns - list all campaigns
// POST /api/ads/meta/campaigns - create new campaign
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getMetaCampaigns,
  createMetaCampaign,
  type CreateMetaCampaignParams,
} from "@/lib/ads/metaAdsService";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const campaigns = await getMetaCampaigns(userId);

    return NextResponse.json({ campaigns });
  } catch (err) {
    console.error("[API] Error fetching Meta campaigns:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await req.json() as CreateMetaCampaignParams;

    const campaign = await createMetaCampaign(userId, params);

    return NextResponse.json({ campaign });
  } catch (err) {
    console.error("[API] Error creating Meta campaign:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create campaign" },
      { status: 500 }
    );
  }
}
