// ---------------------------------------------------------------------------
// Ad Metrics Pull — fetch real campaign performance from Meta, Google, TikTok
// Unified interface: all platforms return the same shape
// ---------------------------------------------------------------------------

export type AdPlatformMetrics = {
  platform: "meta" | "google" | "tiktok";
  campaigns: PlatformCampaign[];
  totals: MetricsTotals;
  lastSynced: string;
};

export type PlatformCampaign = {
  id: string;
  name: string;
  status: "active" | "paused" | "completed" | "unknown";
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cpc: number;
  roas: number;
  cpa: number;
};

export type MetricsTotals = {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  roas: number;
};

// ── META ────────────────────────────────────────────────────────────────

export async function pullMetaMetrics(input: {
  accessToken: string;
  accountId: string;
  dateRange?: { since: string; until: string };
}): Promise<AdPlatformMetrics> {
  const { accessToken, accountId } = input;
  const since = input.dateRange?.since ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const until = input.dateRange?.until ?? new Date().toISOString().split("T")[0];

  try {
    const url = `https://graph.facebook.com/v25.0/act_${accountId}/campaigns?fields=name,status,insights.time_range({"since":"${since}","until":"${until}"}){spend,impressions,clicks,actions,action_values}&access_token=${accessToken}&limit=50`;

    const res = await fetch(url);
    if (!res.ok) return emptyMetrics("meta");

    const data = await res.json();
    const campaigns: PlatformCampaign[] = (data.data ?? []).map((c: Record<string, unknown>) => {
      const insights = ((c.insights as Record<string, unknown>)?.data as Record<string, unknown>[])?.[0] ?? {};
      const spend = parseFloat(String(insights.spend ?? 0));
      const impressions = parseInt(String(insights.impressions ?? 0));
      const clicks = parseInt(String(insights.clicks ?? 0));

      // Extract conversions and revenue from actions
      const actions = (insights.actions as { action_type: string; value: string }[]) ?? [];
      const actionValues = (insights.action_values as { action_type: string; value: string }[]) ?? [];
      const conversions = actions.find((a) => a.action_type === "purchase")?.value ?? actions.find((a) => a.action_type === "lead")?.value ?? "0";
      const revenue = actionValues.find((a) => a.action_type === "purchase")?.value ?? "0";

      const conv = parseInt(conversions);
      const rev = parseFloat(revenue);

      return {
        id: String(c.id),
        name: String(c.name),
        status: mapStatus(String(c.status)),
        spend,
        impressions,
        clicks,
        conversions: conv,
        revenue: rev,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
        roas: spend > 0 ? rev / spend : 0,
        cpa: conv > 0 ? spend / conv : 0,
      };
    });

    return {
      platform: "meta",
      campaigns,
      totals: calculateTotals(campaigns),
      lastSynced: new Date().toISOString(),
    };
  } catch {
    return emptyMetrics("meta");
  }
}

// ── GOOGLE ──────────────────────────────────────────────────────────────

export async function pullGoogleMetrics(input: {
  customerId: string;
  developerToken: string;
  accessToken: string;
  dateRange?: { since: string; until: string };
}): Promise<AdPlatformMetrics> {
  const since = input.dateRange?.since ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const until = input.dateRange?.until ?? new Date().toISOString().split("T")[0];

  try {
    const query = `SELECT campaign.id, campaign.name, campaign.status, metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions, metrics.conversions_value FROM campaign WHERE segments.date BETWEEN '${since}' AND '${until}'`;

    const res = await fetch(
      `https://googleads.googleapis.com/v18/customers/${input.customerId}/googleAds:searchStream`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          "developer-token": input.developerToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      }
    );

    if (!res.ok) return emptyMetrics("google");

    const data = await res.json();
    const results = data[0]?.results ?? [];

    const campaigns: PlatformCampaign[] = results.map((r: Record<string, Record<string, unknown>>) => {
      const spend = (Number(r.metrics?.cost_micros ?? 0)) / 1_000_000;
      const impressions = Number(r.metrics?.impressions ?? 0);
      const clicks = Number(r.metrics?.clicks ?? 0);
      const conversions = Number(r.metrics?.conversions ?? 0);
      const revenue = Number(r.metrics?.conversions_value ?? 0);

      return {
        id: String(r.campaign?.id ?? ""),
        name: String(r.campaign?.name ?? ""),
        status: mapGoogleStatus(String(r.campaign?.status ?? "")),
        spend, impressions, clicks, conversions, revenue,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
        roas: spend > 0 ? revenue / spend : 0,
        cpa: conversions > 0 ? spend / conversions : 0,
      };
    });

    return {
      platform: "google",
      campaigns,
      totals: calculateTotals(campaigns),
      lastSynced: new Date().toISOString(),
    };
  } catch {
    return emptyMetrics("google");
  }
}

// ── TIKTOK ──────────────────────────────────────────────────────────────

export async function pullTikTokMetrics(input: {
  accessToken: string;
  advertiserId: string;
  dateRange?: { since: string; until: string };
}): Promise<AdPlatformMetrics> {
  const since = input.dateRange?.since ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const until = input.dateRange?.until ?? new Date().toISOString().split("T")[0];

  try {
    const url = `https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/?advertiser_id=${input.advertiserId}&report_type=BASIC&data_level=AUCTION_CAMPAIGN&dimensions=["campaign_id"]&metrics=["campaign_name","spend","impressions","clicks","conversion","complete_payment_roas"]&start_date=${since}&end_date=${until}&page_size=50`;

    const res = await fetch(url, {
      headers: { "Access-Token": input.accessToken },
    });

    if (!res.ok) return emptyMetrics("tiktok");

    const data = await res.json();
    const rows = data.data?.list ?? [];

    const campaigns: PlatformCampaign[] = rows.map((r: Record<string, Record<string, unknown>>) => {
      const m = r.metrics ?? {};
      const d = r.dimensions ?? {};
      const spend = Number(m.spend ?? 0);
      const impressions = Number(m.impressions ?? 0);
      const clicks = Number(m.clicks ?? 0);
      const conversions = Number(m.conversion ?? 0);
      const roas = Number(m.complete_payment_roas ?? 0);

      return {
        id: String(d.campaign_id ?? ""),
        name: String(m.campaign_name ?? ""),
        status: "unknown" as const,
        spend, impressions, clicks, conversions,
        revenue: spend * roas,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
        roas,
        cpa: conversions > 0 ? spend / conversions : 0,
      };
    });

    return {
      platform: "tiktok",
      campaigns,
      totals: calculateTotals(campaigns),
      lastSynced: new Date().toISOString(),
    };
  } catch {
    return emptyMetrics("tiktok");
  }
}

// ── UNIFIED PULL ────────────────────────────────────────────────────────

export async function pullAllMetrics(config: {
  meta?: { accessToken: string; accountId: string };
  google?: { customerId: string; developerToken: string; accessToken: string };
  tiktok?: { accessToken: string; advertiserId: string };
  dateRange?: { since: string; until: string };
}): Promise<AdPlatformMetrics[]> {
  const promises: Promise<AdPlatformMetrics>[] = [];

  if (config.meta) promises.push(pullMetaMetrics({ ...config.meta, dateRange: config.dateRange }));
  if (config.google) promises.push(pullGoogleMetrics({ ...config.google, dateRange: config.dateRange }));
  if (config.tiktok) promises.push(pullTikTokMetrics({ ...config.tiktok, dateRange: config.dateRange }));

  const results = await Promise.allSettled(promises);
  return results
    .filter((r): r is PromiseFulfilledResult<AdPlatformMetrics> => r.status === "fulfilled")
    .map((r) => r.value);
}

// ── Helpers ─────────────────────────────────────────────────────────────

function calculateTotals(campaigns: PlatformCampaign[]): MetricsTotals {
  const spend = campaigns.reduce((s, c) => s + c.spend, 0);
  const impressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const clicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const conversions = campaigns.reduce((s, c) => s + c.conversions, 0);
  const revenue = campaigns.reduce((s, c) => s + c.revenue, 0);

  return {
    spend,
    impressions,
    clicks,
    conversions,
    revenue,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    roas: spend > 0 ? revenue / spend : 0,
  };
}

function mapStatus(metaStatus: string): PlatformCampaign["status"] {
  if (metaStatus === "ACTIVE") return "active";
  if (metaStatus === "PAUSED") return "paused";
  return "unknown";
}

function mapGoogleStatus(status: string): PlatformCampaign["status"] {
  if (status === "ENABLED") return "active";
  if (status === "PAUSED") return "paused";
  if (status === "REMOVED") return "completed";
  return "unknown";
}

function emptyMetrics(platform: AdPlatformMetrics["platform"]): AdPlatformMetrics {
  return {
    platform,
    campaigns: [],
    totals: { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0, ctr: 0, roas: 0 },
    lastSynced: new Date().toISOString(),
  };
}
