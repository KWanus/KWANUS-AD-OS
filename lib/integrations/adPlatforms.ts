// ---------------------------------------------------------------------------
// Ad Platform Integration — Meta Marketing API + Google Ads API
// Push campaigns directly to ad platforms
// ---------------------------------------------------------------------------

export type AdPlatformConfig = {
  platform: "meta" | "google";
  accessToken: string;
  accountId: string; // Meta ad account ID or Google customer ID
};

export type AdCreativeInput = {
  name: string;
  headline: string;
  body: string;
  ctaText: string;
  linkUrl: string;
  imageBase64?: string;
  videoUrl?: string;
  platform: "meta" | "google";
};

export type PushResult = {
  ok: boolean;
  campaignId?: string;
  adSetId?: string;
  adCreativeId?: string;
  adId?: string;
  error?: string;
};

// ── META (Facebook/Instagram) ────────────────────────────────────────────

/** Upload an image to Meta Ad Account */
async function metaUploadImage(
  accountId: string,
  accessToken: string,
  imageBase64: string
): Promise<string | null> {
  try {
    const formData = new FormData();
    // Convert base64 to blob
    const bytes = Buffer.from(imageBase64, "base64");
    const blob = new Blob([bytes], { type: "image/png" });
    formData.append("filename", blob, "ad_creative.png");
    formData.append("access_token", accessToken);

    const response = await fetch(
      `https://graph.facebook.com/v25.0/act_${accountId}/adimages`,
      { method: "POST", body: formData }
    );

    if (!response.ok) return null;
    const data = await response.json();
    // Extract image hash from response
    const images = data.images;
    if (images) {
      const firstKey = Object.keys(images)[0];
      return images[firstKey]?.hash ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

/** Create a Meta ad campaign */
async function metaCreateCampaign(
  accountId: string,
  accessToken: string,
  name: string,
  objective: string = "OUTCOME_TRAFFIC"
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v25.0/act_${accountId}/campaigns`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          objective,
          status: "PAUSED",
          special_ad_categories: [],
          access_token: accessToken,
        }),
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    return data.id ?? null;
  } catch {
    return null;
  }
}

/** Create a Meta ad set */
async function metaCreateAdSet(
  accountId: string,
  accessToken: string,
  campaignId: string,
  name: string,
  dailyBudgetCents: number = 2000 // $20/day default
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v25.0/act_${accountId}/adsets`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          campaign_id: campaignId,
          daily_budget: dailyBudgetCents,
          billing_event: "IMPRESSIONS",
          optimization_goal: "LINK_CLICKS",
          bid_strategy: "LOWEST_COST_WITHOUT_CAP",
          status: "PAUSED",
          targeting: { geo_locations: { countries: ["US"] } },
          access_token: accessToken,
        }),
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    return data.id ?? null;
  } catch {
    return null;
  }
}

/** Create a Meta ad creative */
async function metaCreateAdCreative(
  accountId: string,
  accessToken: string,
  input: AdCreativeInput,
  imageHash?: string
): Promise<string | null> {
  try {
    const creativeData: Record<string, unknown> = {
      name: input.name,
      object_story_spec: {
        link_data: {
          message: input.body,
          link: input.linkUrl,
          name: input.headline,
          call_to_action: {
            type: "LEARN_MORE",
            value: { link: input.linkUrl },
          },
          ...(imageHash && { image_hash: imageHash }),
        },
      },
      access_token: accessToken,
    };

    const response = await fetch(
      `https://graph.facebook.com/v25.0/act_${accountId}/adcreatives`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creativeData),
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    return data.id ?? null;
  } catch {
    return null;
  }
}

/** Full Meta campaign push — creates campaign → ad set → creative → ad */
export async function pushToMeta(input: {
  accountId: string;
  accessToken: string;
  campaignName: string;
  creatives: AdCreativeInput[];
  dailyBudgetCents?: number;
  linkUrl: string;
}): Promise<PushResult> {
  try {
    const { accountId, accessToken, campaignName, creatives, dailyBudgetCents } = input;

    // 1. Create campaign
    const campaignId = await metaCreateCampaign(accountId, accessToken, campaignName);
    if (!campaignId) return { ok: false, error: "Failed to create Meta campaign" };

    // 2. Create ad set
    const adSetId = await metaCreateAdSet(
      accountId, accessToken, campaignId, `${campaignName} - Ad Set`, dailyBudgetCents
    );
    if (!adSetId) return { ok: false, error: "Failed to create Meta ad set", campaignId };

    // 3. Create creatives and ads
    for (const creative of creatives) {
      let imageHash: string | undefined;
      if (creative.imageBase64) {
        imageHash = (await metaUploadImage(accountId, accessToken, creative.imageBase64)) ?? undefined;
      }

      const creativeId = await metaCreateAdCreative(accountId, accessToken, creative, imageHash);
      if (!creativeId) continue;

      // 4. Create ad linking creative to ad set
      await fetch(`https://graph.facebook.com/v25.0/act_${accountId}/ads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: creative.name,
          adset_id: adSetId,
          creative: { creative_id: creativeId },
          status: "PAUSED",
          access_token: accessToken,
        }),
      });
    }

    return { ok: true, campaignId, adSetId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Meta push failed" };
  }
}

// ── GOOGLE ADS ──────────────────────────────────────────────────────────

/** Push campaign to Google Ads (requires google-ads-api package) */
export async function pushToGoogle(input: {
  customerId: string;
  developerToken: string;
  refreshToken: string;
  clientId: string;
  clientSecret: string;
  campaignName: string;
  headlines: string[];
  descriptions: string[];
  finalUrl: string;
  dailyBudgetMicros?: number; // in micros (1,000,000 = $1)
}): Promise<PushResult> {
  // Google Ads API requires the google-ads-api package
  // This is a placeholder that shows the structure — actual implementation
  // requires OAuth flow which the user sets up in their Google Ads account
  try {
    // Dynamic import to avoid breaking if package isn't installed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import("google-ads-api" as string);
    const GoogleAdsApi = mod.GoogleAdsApi;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client: any = new GoogleAdsApi({
      client_id: input.clientId,
      client_secret: input.clientSecret,
      developer_token: input.developerToken,
    });

    const customer = client.Customer({
      customer_id: input.customerId,
      refresh_token: input.refreshToken,
    });

    // Create campaign budget
    const budgetResult = await customer.campaignBudgets.create([
      {
        name: `${input.campaignName} Budget`,
        amount_micros: input.dailyBudgetMicros ?? 20_000_000, // $20/day default
        delivery_method: "STANDARD",
      },
    ]);

    const budgetResourceName = budgetResult.results[0]?.resource_name;
    if (!budgetResourceName) return { ok: false, error: "Failed to create Google budget" };

    // Create campaign
    const campaignResult = await customer.campaigns.create([
      {
        name: input.campaignName,
        advertising_channel_type: "SEARCH",
        status: "PAUSED",
        campaign_budget: budgetResourceName,
        manual_cpc: {},
      },
    ]);

    const campaignResourceName = campaignResult.results[0]?.resource_name;

    return {
      ok: true,
      campaignId: campaignResourceName ?? undefined,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Google Ads push failed. Ensure google-ads-api is installed and credentials are configured.",
    };
  }
}

// ── TIKTOK ADS ──────────────────────────────────────────────────────────

/** Push campaign to TikTok Ads via Marketing API */
export async function pushToTikTok(input: {
  accessToken: string;
  advertiserId: string;
  campaignName: string;
  creatives: { text: string; imageBase64?: string; videoUrl?: string; landingUrl: string }[];
  dailyBudgetCents?: number;
}): Promise<PushResult> {
  try {
    const { accessToken, advertiserId, campaignName, creatives, dailyBudgetCents } = input;
    const baseUrl = "https://business-api.tiktok.com/open_api/v1.3";

    // 1. Create campaign
    const campaignRes = await fetch(`${baseUrl}/campaign/create/`, {
      method: "POST",
      headers: {
        "Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        advertiser_id: advertiserId,
        campaign_name: campaignName,
        objective_type: "TRAFFIC",
        budget_mode: "BUDGET_MODE_DAY",
        budget: (dailyBudgetCents ?? 2000) / 100, // TikTok uses dollars not cents
        operation_status: "DISABLE", // Start paused
      }),
    });

    if (!campaignRes.ok) {
      const errData = await campaignRes.json().catch(() => ({}));
      return { ok: false, error: `TikTok campaign creation failed: ${JSON.stringify(errData)}` };
    }

    const campaignData = await campaignRes.json();
    const tiktokCampaignId = campaignData?.data?.campaign_id;
    if (!tiktokCampaignId) return { ok: false, error: "TikTok campaign ID not returned" };

    // 2. Create ad group
    const adGroupRes = await fetch(`${baseUrl}/adgroup/create/`, {
      method: "POST",
      headers: {
        "Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        advertiser_id: advertiserId,
        campaign_id: tiktokCampaignId,
        adgroup_name: `${campaignName} - Ad Group`,
        placement_type: "PLACEMENT_TYPE_AUTOMATIC",
        budget_mode: "BUDGET_MODE_DAY",
        budget: (dailyBudgetCents ?? 2000) / 100,
        schedule_type: "SCHEDULE_FROM_NOW",
        billing_event: "CPC",
        bid_type: "BID_TYPE_NO_BID",
        optimization_goal: "CLICK",
        location_ids: ["6252001"], // US
        operation_status: "DISABLE",
      }),
    });

    if (!adGroupRes.ok) {
      return { ok: false, error: "TikTok ad group creation failed", campaignId: tiktokCampaignId };
    }

    const adGroupData = await adGroupRes.json();
    const adGroupId = adGroupData?.data?.adgroup_id;

    // 3. Upload images and create ads
    for (const creative of creatives) {
      let imageId: string | undefined;

      // Upload image if provided
      if (creative.imageBase64) {
        const imgRes = await fetch(`${baseUrl}/file/image/ad/upload/`, {
          method: "POST",
          headers: {
            "Access-Token": accessToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            advertiser_id: advertiserId,
            upload_type: "UPLOAD_BY_FILE_URL",
            image_url: `data:image/png;base64,${creative.imageBase64.slice(0, 100)}`, // TikTok requires URL
          }),
        });
        const imgData = await imgRes.json().catch(() => null);
        imageId = imgData?.data?.image_id;
      }

      // Create ad
      if (adGroupId) {
        await fetch(`${baseUrl}/ad/create/`, {
          method: "POST",
          headers: {
            "Access-Token": accessToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            advertiser_id: advertiserId,
            adgroup_id: adGroupId,
            creatives: [{
              ad_name: `${campaignName} Ad`,
              ad_text: creative.text,
              landing_page_url: creative.landingUrl,
              ...(imageId && { image_ids: [imageId] }),
              ...(creative.videoUrl && { video_id: creative.videoUrl }),
              call_to_action: "LEARN_MORE",
            }],
          }),
        });
      }
    }

    return { ok: true, campaignId: tiktokCampaignId, adSetId: adGroupId ?? undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "TikTok push failed" };
  }
}

/** Check if user has ad platform credentials configured */
export function hasAdPlatformConfig(user: {
  metaPixelId?: string | null;
  googleAdsId?: string | null;
  tiktokPixelId?: string | null;
}): { hasMeta: boolean; hasGoogle: boolean; hasTikTok: boolean } {
  return {
    hasMeta: !!user.metaPixelId,
    hasGoogle: !!user.googleAdsId,
    hasTikTok: !!user.tiktokPixelId,
  };
}
