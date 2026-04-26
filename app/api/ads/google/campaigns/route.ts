// ---------------------------------------------------------------------------
// Google Ads Campaigns API — fetch and manage Google Ads campaigns
// GET /api/ads/google/campaigns - list all campaigns
// POST /api/ads/google/campaigns - create new campaign
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getGoogleCampaigns,
  createGoogleCampaign,
  type CreateGoogleCampaignParams,
} from "@/lib/ads/googleAdsService";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const campaigns = await getGoogleCampaigns(userId);

    return NextResponse.json({ campaigns });
  } catch (err) {
    console.error("[API] Error fetching Google campaigns:", err);
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

    const params = await req.json() as CreateGoogleCampaignParams;

    const campaign = await createGoogleCampaign(userId, params);

    return NextResponse.json({ campaign });
  } catch (err) {
    console.error("[API] Error creating Google campaign:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create campaign" },
      { status: 500 }
    );
  }
}
