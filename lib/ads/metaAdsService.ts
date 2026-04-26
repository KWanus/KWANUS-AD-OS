// ---------------------------------------------------------------------------
// Meta Ads API Service — manage Facebook/Instagram ad campaigns
// Handles campaign creation, updates, and performance tracking
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/db";
import { decryptToken } from "@/lib/oauth/encryption";

const META_API_VERSION = "v21.0";
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

export type MetaCampaignObjective =
  | "OUTCOME_AWARENESS"
  | "OUTCOME_ENGAGEMENT"
  | "OUTCOME_TRAFFIC"
  | "OUTCOME_LEADS"
  | "OUTCOME_APP_PROMOTION"
  | "OUTCOME_SALES";

export type MetaCampaignStatus = "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";

export interface CreateMetaCampaignParams {
  name: string;
  objective: MetaCampaignObjective;
  status: MetaCampaignStatus;
  dailyBudget?: number;
  lifetimeBudget?: number;
  specialAdCategories?: string[];
}

export interface MetaCampaignInsights {
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions?: number;
  costPerConversion?: number;
}

/**
 * Get user's Meta access token
 */
async function getMetaAccessToken(userId: string): Promise<string> {
  const connection = await prisma.adPlatformConnection.findUnique({
    where: {
      userId_platform: {
        userId,
        platform: "meta",
      },
    },
  });

  if (!connection) {
    throw new Error("Meta Ads not connected. Please connect your account first.");
  }

  if (connection.expiresAt && connection.expiresAt < new Date()) {
    throw new Error("Meta access token expired. Please reconnect your account.");
  }

  return decryptToken(connection.accessToken);
}

/**
 * Get user's primary Meta ad account ID
 */
async function getMetaAdAccountId(userId: string): Promise<string> {
  const connection = await prisma.adPlatformConnection.findUnique({
    where: {
      userId_platform: {
        userId,
        platform: "meta",
      },
    },
  });

  if (!connection?.accountId) {
    throw new Error("No Meta ad account found");
  }

  return `act_${connection.accountId}`;
}

/**
 * Create a new Meta ad campaign
 */
export async function createMetaCampaign(
  userId: string,
  params: CreateMetaCampaignParams
): Promise<{ id: string; name: string }> {
  const accessToken = await getMetaAccessToken(userId);
  const adAccountId = await getMetaAdAccountId(userId);

  const body: Record<string, string | string[]> = {
    name: params.name,
    objective: params.objective,
    status: params.status,
    special_ad_categories: params.specialAdCategories || [],
  };

  if (params.dailyBudget) {
    body.daily_budget = (params.dailyBudget * 100).toString(); // Convert to cents
  }

  if (params.lifetimeBudget) {
    body.lifetime_budget = (params.lifetimeBudget * 100).toString(); // Convert to cents
  }

  const response = await fetch(
    `${META_API_BASE}/${adAccountId}/campaigns`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        access_token: accessToken,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json() as { error?: { message?: string } };
    throw new Error(`Meta API error: ${error.error?.message || "Unknown error"}`);
  }

  const data = await response.json() as { id: string };

  return {
    id: data.id,
    name: params.name,
  };
}

/**
 * Get campaign insights/performance metrics
 */
export async function getMetaCampaignInsights(
  userId: string,
  campaignId: string,
  datePreset: "today" | "yesterday" | "last_7d" | "last_30d" = "last_7d"
): Promise<MetaCampaignInsights> {
  const accessToken = await getMetaAccessToken(userId);

  const fields = [
    "impressions",
    "clicks",
    "spend",
    "reach",
    "ctr",
    "cpc",
    "cpm",
    "conversions",
    "cost_per_conversion",
  ].join(",");

  const response = await fetch(
    `${META_API_BASE}/${campaignId}/insights?fields=${fields}&date_preset=${datePreset}&access_token=${accessToken}`
  );

  if (!response.ok) {
    const error = await response.json() as { error?: { message?: string } };
    throw new Error(`Meta API error: ${error.error?.message || "Unknown error"}`);
  }

  const data = await response.json() as {
    data?: Array<{
      impressions?: string;
      clicks?: string;
      spend?: string;
      reach?: string;
      ctr?: string;
      cpc?: string;
      cpm?: string;
      conversions?: string;
      cost_per_conversion?: string;
    }>;
  };

  const insights = data.data?.[0];

  if (!insights) {
    return {
      impressions: 0,
      clicks: 0,
      spend: 0,
      reach: 0,
      ctr: 0,
      cpc: 0,
      cpm: 0,
    };
  }

  return {
    impressions: parseInt(insights.impressions || "0", 10),
    clicks: parseInt(insights.clicks || "0", 10),
    spend: parseFloat(insights.spend || "0"),
    reach: parseInt(insights.reach || "0", 10),
    ctr: parseFloat(insights.ctr || "0"),
    cpc: parseFloat(insights.cpc || "0"),
    cpm: parseFloat(insights.cpm || "0"),
    conversions: insights.conversions ? parseInt(insights.conversions, 10) : undefined,
    costPerConversion: insights.cost_per_conversion ? parseFloat(insights.cost_per_conversion) : undefined,
  };
}

/**
 * Get all campaigns for a user
 */
export async function getMetaCampaigns(
  userId: string
): Promise<Array<{
  id: string;
  name: string;
  status: string;
  objective: string;
  dailyBudget?: number;
  lifetimeBudget?: number;
}>> {
  const accessToken = await getMetaAccessToken(userId);
  const adAccountId = await getMetaAdAccountId(userId);

  const fields = [
    "id",
    "name",
    "status",
    "objective",
    "daily_budget",
    "lifetime_budget",
  ].join(",");

  const response = await fetch(
    `${META_API_BASE}/${adAccountId}/campaigns?fields=${fields}&access_token=${accessToken}`
  );

  if (!response.ok) {
    const error = await response.json() as { error?: { message?: string } };
    throw new Error(`Meta API error: ${error.error?.message || "Unknown error"}`);
  }

  const data = await response.json() as {
    data?: Array<{
      id: string;
      name: string;
      status: string;
      objective: string;
      daily_budget?: string;
      lifetime_budget?: string;
    }>;
  };

  return (data.data || []).map((campaign) => ({
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    objective: campaign.objective,
    dailyBudget: campaign.daily_budget ? parseInt(campaign.daily_budget, 10) / 100 : undefined,
    lifetimeBudget: campaign.lifetime_budget ? parseInt(campaign.lifetime_budget, 10) / 100 : undefined,
  }));
}

/**
 * Update campaign status (pause/resume)
 */
export async function updateMetaCampaignStatus(
  userId: string,
  campaignId: string,
  status: MetaCampaignStatus
): Promise<{ success: boolean }> {
  const accessToken = await getMetaAccessToken(userId);

  const response = await fetch(
    `${META_API_BASE}/${campaignId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        access_token: accessToken,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json() as { error?: { message?: string } };
    throw new Error(`Meta API error: ${error.error?.message || "Unknown error"}`);
  }

  return { success: true };
}

/**
 * Delete a campaign
 */
export async function deleteMetaCampaign(
  userId: string,
  campaignId: string
): Promise<{ success: boolean }> {
  return updateMetaCampaignStatus(userId, campaignId, "DELETED");
}
