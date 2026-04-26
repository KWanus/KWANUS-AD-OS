// ---------------------------------------------------------------------------
// Google Ads API Service — manage Google Ads campaigns
// Handles campaign creation, updates, and performance tracking
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/db";
import { decryptToken } from "@/lib/oauth/encryption";

const GOOGLE_ADS_API_VERSION = "v18";
const GOOGLE_ADS_API_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

export type GoogleCampaignStatus = "ENABLED" | "PAUSED" | "REMOVED";

export interface CreateGoogleCampaignParams {
  name: string;
  advertisingChannelType: "SEARCH" | "DISPLAY" | "SHOPPING" | "VIDEO" | "PERFORMANCE_MAX";
  status: GoogleCampaignStatus;
  budgetAmountMicros: number; // Amount in micros (1 USD = 1,000,000 micros)
}

export interface GoogleCampaignInsights {
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
  averageCpc: number;
  costPerConversion?: number;
}

/**
 * Get user's Google Ads access token
 */
async function getGoogleAccessToken(userId: string): Promise<string> {
  const connection = await prisma.adPlatformConnection.findUnique({
    where: {
      userId_platform: {
        userId,
        platform: "google",
      },
    },
  });

  if (!connection) {
    throw new Error("Google Ads not connected. Please connect your account first.");
  }

  // Check if token expired and refresh if needed
  if (connection.expiresAt && connection.expiresAt < new Date()) {
    if (!connection.refreshToken) {
      throw new Error("Google access token expired and no refresh token available. Please reconnect.");
    }

    // Refresh the token
    const refreshToken = decryptToken(connection.refreshToken);
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh Google access token");
    }

    const data = await response.json() as { access_token: string; expires_in: number };
    const { encryptToken } = await import("@/lib/oauth/encryption");

    // Update stored token
    await prisma.adPlatformConnection.update({
      where: { userId_platform: { userId, platform: "google" } },
      data: {
        accessToken: encryptToken(data.access_token),
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
      },
    });

    return data.access_token;
  }

  return decryptToken(connection.accessToken);
}

/**
 * Get user's Google Ads customer ID
 */
async function getGoogleCustomerId(userId: string): Promise<string> {
  const connection = await prisma.adPlatformConnection.findUnique({
    where: {
      userId_platform: {
        userId,
        platform: "google",
      },
    },
  });

  if (!connection?.accountId) {
    throw new Error("No Google Ads customer ID found");
  }

  return connection.accountId;
}

/**
 * Create a new Google Ads campaign
 */
export async function createGoogleCampaign(
  userId: string,
  params: CreateGoogleCampaignParams
): Promise<{ id: string; name: string }> {
  const accessToken = await getGoogleAccessToken(userId);
  const customerId = await getGoogleCustomerId(userId);

  // First create budget
  const budgetResponse = await fetch(
    `${GOOGLE_ADS_API_BASE}/customers/${customerId}/campaignBudgets:mutate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        operations: [
          {
            create: {
              name: `Budget for ${params.name}`,
              amountMicros: params.budgetAmountMicros.toString(),
              deliveryMethod: "STANDARD",
            },
          },
        ],
      }),
    }
  );

  if (!budgetResponse.ok) {
    const error = await budgetResponse.json() as { error?: { message?: string } };
    throw new Error(`Google Ads API error: ${error.error?.message || "Failed to create budget"}`);
  }

  const budgetData = await budgetResponse.json() as {
    results?: Array<{ resourceName: string }>;
  };

  const budgetResourceName = budgetData.results?.[0]?.resourceName;

  if (!budgetResourceName) {
    throw new Error("Failed to get budget resource name");
  }

  // Create campaign
  const campaignResponse = await fetch(
    `${GOOGLE_ADS_API_BASE}/customers/${customerId}/campaigns:mutate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        operations: [
          {
            create: {
              name: params.name,
              advertisingChannelType: params.advertisingChannelType,
              status: params.status,
              campaignBudget: budgetResourceName,
            },
          },
        ],
      }),
    }
  );

  if (!campaignResponse.ok) {
    const error = await campaignResponse.json() as { error?: { message?: string } };
    throw new Error(`Google Ads API error: ${error.error?.message || "Failed to create campaign"}`);
  }

  const campaignData = await campaignResponse.json() as {
    results?: Array<{ resourceName: string }>;
  };

  const campaignId = campaignData.results?.[0]?.resourceName.split("/").pop() || "";

  return {
    id: campaignId,
    name: params.name,
  };
}

/**
 * Get campaign insights/performance metrics
 */
export async function getGoogleCampaignInsights(
  userId: string,
  campaignId: string,
  dateRange: "TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "LAST_30_DAYS" = "LAST_7_DAYS"
): Promise<GoogleCampaignInsights> {
  const accessToken = await getGoogleAccessToken(userId);
  const customerId = await getGoogleCustomerId(userId);

  const query = `
    SELECT
      campaign.id,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.ctr,
      metrics.average_cpc,
      metrics.cost_per_conversion
    FROM campaign
    WHERE campaign.id = ${campaignId}
      AND segments.date DURING ${dateRange}
  `;

  const response = await fetch(
    `${GOOGLE_ADS_API_BASE}/customers/${customerId}/googleAds:search`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  if (!response.ok) {
    const error = await response.json() as { error?: { message?: string } };
    throw new Error(`Google Ads API error: ${error.error?.message || "Failed to fetch insights"}`);
  }

  const data = await response.json() as {
    results?: Array<{
      metrics?: {
        impressions?: string;
        clicks?: string;
        costMicros?: string;
        conversions?: number;
        ctr?: number;
        averageCpc?: string;
        costPerConversion?: string;
      };
    }>;
  };

  const metrics = data.results?.[0]?.metrics;

  if (!metrics) {
    return {
      impressions: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
      ctr: 0,
      averageCpc: 0,
    };
  }

  return {
    impressions: parseInt(metrics.impressions || "0", 10),
    clicks: parseInt(metrics.clicks || "0", 10),
    cost: parseInt(metrics.costMicros || "0", 10) / 1000000,
    conversions: metrics.conversions || 0,
    ctr: metrics.ctr || 0,
    averageCpc: parseInt(metrics.averageCpc || "0", 10) / 1000000,
    costPerConversion: metrics.costPerConversion ? parseFloat(metrics.costPerConversion) / 1000000 : undefined,
  };
}

/**
 * Get all campaigns for a user
 */
export async function getGoogleCampaigns(
  userId: string
): Promise<Array<{
  id: string;
  name: string;
  status: string;
  advertisingChannelType: string;
}>> {
  const accessToken = await getGoogleAccessToken(userId);
  const customerId = await getGoogleCustomerId(userId);

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type
    FROM campaign
    ORDER BY campaign.id DESC
    LIMIT 100
  `;

  const response = await fetch(
    `${GOOGLE_ADS_API_BASE}/customers/${customerId}/googleAds:search`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  if (!response.ok) {
    const error = await response.json() as { error?: { message?: string } };
    throw new Error(`Google Ads API error: ${error.error?.message || "Failed to fetch campaigns"}`);
  }

  const data = await response.json() as {
    results?: Array<{
      campaign?: {
        id?: string;
        name?: string;
        status?: string;
        advertisingChannelType?: string;
      };
    }>;
  };

  return (data.results || []).map((result) => ({
    id: result.campaign?.id || "",
    name: result.campaign?.name || "",
    status: result.campaign?.status || "",
    advertisingChannelType: result.campaign?.advertisingChannelType || "",
  }));
}

/**
 * Update campaign status
 */
export async function updateGoogleCampaignStatus(
  userId: string,
  campaignId: string,
  status: GoogleCampaignStatus
): Promise<{ success: boolean }> {
  const accessToken = await getGoogleAccessToken(userId);
  const customerId = await getGoogleCustomerId(userId);

  const response = await fetch(
    `${GOOGLE_ADS_API_BASE}/customers/${customerId}/campaigns:mutate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        operations: [
          {
            update: {
              resourceName: `customers/${customerId}/campaigns/${campaignId}`,
              status,
            },
            updateMask: "status",
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json() as { error?: { message?: string } };
    throw new Error(`Google Ads API error: ${error.error?.message || "Failed to update status"}`);
  }

  return { success: true };
}
