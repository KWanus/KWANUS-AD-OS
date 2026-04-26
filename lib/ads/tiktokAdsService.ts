// ---------------------------------------------------------------------------
// TikTok Ads API Service — manage TikTok ad campaigns
// Handles campaign creation, updates, and performance tracking
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/db";
import { decryptToken } from "@/lib/oauth/encryption";

const TIKTOK_API_BASE = "https://business-api.tiktok.com/open_api/v1.3";

export type TikTokCampaignObjective =
  | "REACH"
  | "TRAFFIC"
  | "VIDEO_VIEWS"
  | "LEAD_GENERATION"
  | "ENGAGEMENT"
  | "APP_PROMOTION"
  | "WEB_CONVERSIONS"
  | "PRODUCT_SALES";

export type TikTokCampaignStatus = "ENABLE" | "DISABLE" | "DELETE";

export interface CreateTikTokCampaignParams {
  name: string;
  objective: TikTokCampaignObjective;
  budget: number;
  budgetMode: "BUDGET_MODE_DAY" | "BUDGET_MODE_TOTAL";
}

export interface TikTokCampaignInsights {
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  costPerConversion?: number;
}

/**
 * Get user's TikTok access token
 */
async function getTikTokAccessToken(userId: string): Promise<string> {
  const connection = await prisma.adPlatformConnection.findUnique({
    where: {
      userId_platform: {
        userId,
        platform: "tiktok",
      },
    },
  });

  if (!connection) {
    throw new Error("TikTok Ads not connected. Please connect your account first.");
  }

  return decryptToken(connection.accessToken);
}

/**
 * Get user's TikTok advertiser ID
 */
async function getTikTokAdvertiserId(userId: string): Promise<string> {
  const connection = await prisma.adPlatformConnection.findUnique({
    where: {
      userId_platform: {
        userId,
        platform: "tiktok",
      },
    },
  });

  if (!connection?.accountId) {
    throw new Error("No TikTok advertiser ID found");
  }

  return connection.accountId;
}

/**
 * Create a new TikTok ad campaign
 */
export async function createTikTokCampaign(
  userId: string,
  params: CreateTikTokCampaignParams
): Promise<{ id: string; name: string }> {
  const accessToken = await getTikTokAccessToken(userId);
  const advertiserId = await getTikTokAdvertiserId(userId);

  const response = await fetch(`${TIKTOK_API_BASE}/campaign/create/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Token": accessToken,
    },
    body: JSON.stringify({
      advertiser_id: advertiserId,
      campaign_name: params.name,
      objective_type: params.objective,
      budget: params.budget,
      budget_mode: params.budgetMode,
    }),
  });

  if (!response.ok) {
    throw new Error("TikTok API error: Failed to create campaign");
  }

  const data = await response.json() as {
    code?: number;
    message?: string;
    data?: { campaign_id: string };
  };

  if (data.code !== 0 || !data.data) {
    throw new Error(`TikTok API error: ${data.message || "Unknown error"}`);
  }

  return {
    id: data.data.campaign_id,
    name: params.name,
  };
}

/**
 * Get campaign insights/performance metrics
 */
export async function getTikTokCampaignInsights(
  userId: string,
  campaignId: string,
  startDate: string = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  endDate: string = new Date().toISOString().split("T")[0]
): Promise<TikTokCampaignInsights> {
  const accessToken = await getTikTokAccessToken(userId);
  const advertiserId = await getTikTokAdvertiserId(userId);

  const response = await fetch(`${TIKTOK_API_BASE}/reports/integrated/get/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Access-Token": accessToken,
    },
  });

  const params = new URLSearchParams({
    advertiser_id: advertiserId,
    report_type: "BASIC",
    dimensions: JSON.stringify(["campaign_id"]),
    metrics: JSON.stringify([
      "impressions",
      "clicks",
      "spend",
      "conversions",
      "ctr",
      "cpc",
      "cpm",
      "cost_per_conversion",
    ]),
    start_date: startDate,
    end_date: endDate,
    filtering: JSON.stringify([{ field: "campaign_id", operator: "IN", value: [campaignId] }]),
  });

  const reportResponse = await fetch(
    `${TIKTOK_API_BASE}/reports/integrated/get/?${params.toString()}`,
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Token": accessToken,
      },
    }
  );

  if (!reportResponse.ok) {
    throw new Error("TikTok API error: Failed to fetch insights");
  }

  const data = await reportResponse.json() as {
    code?: number;
    data?: {
      list?: Array<{
        metrics?: {
          impressions?: string;
          clicks?: string;
          spend?: string;
          conversions?: number;
          ctr?: string;
          cpc?: string;
          cpm?: string;
          cost_per_conversion?: string;
        };
      }>;
    };
  };

  if (data.code !== 0 || !data.data?.list?.[0]?.metrics) {
    return {
      impressions: 0,
      clicks: 0,
      spend: 0,
      conversions: 0,
      ctr: 0,
      cpc: 0,
      cpm: 0,
    };
  }

  const metrics = data.data.list[0].metrics;

  return {
    impressions: parseInt(metrics.impressions || "0", 10),
    clicks: parseInt(metrics.clicks || "0", 10),
    spend: parseFloat(metrics.spend || "0"),
    conversions: metrics.conversions || 0,
    ctr: parseFloat(metrics.ctr || "0"),
    cpc: parseFloat(metrics.cpc || "0"),
    cpm: parseFloat(metrics.cpm || "0"),
    costPerConversion: metrics.cost_per_conversion ? parseFloat(metrics.cost_per_conversion) : undefined,
  };
}

/**
 * Get all campaigns for a user
 */
export async function getTikTokCampaigns(
  userId: string
): Promise<Array<{
  id: string;
  name: string;
  status: string;
  objective: string;
}>> {
  const accessToken = await getTikTokAccessToken(userId);
  const advertiserId = await getTikTokAdvertiserId(userId);

  const params = new URLSearchParams({
    advertiser_id: advertiserId,
    fields: JSON.stringify(["campaign_id", "campaign_name", "operation_status", "objective_type"]),
  });

  const response = await fetch(`${TIKTOK_API_BASE}/campaign/get/?${params.toString()}`, {
    headers: {
      "Content-Type": "application/json",
      "Access-Token": accessToken,
    },
  });

  if (!response.ok) {
    throw new Error("TikTok API error: Failed to fetch campaigns");
  }

  const data = await response.json() as {
    code?: number;
    data?: {
      list?: Array<{
        campaign_id: string;
        campaign_name: string;
        operation_status: string;
        objective_type: string;
      }>;
    };
  };

  if (data.code !== 0 || !data.data?.list) {
    return [];
  }

  return data.data.list.map((campaign) => ({
    id: campaign.campaign_id,
    name: campaign.campaign_name,
    status: campaign.operation_status,
    objective: campaign.objective_type,
  }));
}

/**
 * Update campaign status
 */
export async function updateTikTokCampaignStatus(
  userId: string,
  campaignId: string,
  status: TikTokCampaignStatus
): Promise<{ success: boolean }> {
  const accessToken = await getTikTokAccessToken(userId);
  const advertiserId = await getTikTokAdvertiserId(userId);

  const response = await fetch(`${TIKTOK_API_BASE}/campaign/update/status/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Token": accessToken,
    },
    body: JSON.stringify({
      advertiser_id: advertiserId,
      campaign_ids: [campaignId],
      opt_status: status,
    }),
  });

  if (!response.ok) {
    throw new Error("TikTok API error: Failed to update status");
  }

  const data = await response.json() as { code?: number };

  if (data.code !== 0) {
    throw new Error("TikTok API error: Failed to update status");
  }

  return { success: true };
}
