// ---------------------------------------------------------------------------
// Campaign Health Engine — monitors campaign performance and alerts
// Detects: stale campaigns, underperformers, missing assets, scaling opportunities
// ---------------------------------------------------------------------------

export type CampaignHealthCheck = {
  id: string;
  name: string;
  status: "healthy" | "warning" | "critical";
  issues: HealthIssue[];
  score: number; // 0-100
};

export type HealthIssue = {
  severity: "critical" | "warning" | "info";
  message: string;
  action: string;
};

export function checkCampaignHealth(campaign: {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  adVariations: {
    type: string;
    status: string;
    metrics: Record<string, number> | null;
    content: Record<string, unknown>;
  }[];
  hasAnalysis: boolean;
}): CampaignHealthCheck {
  const issues: HealthIssue[] = [];
  let score = 100;

  const hooks = campaign.adVariations.filter((v) => v.type === "hook");
  const scripts = campaign.adVariations.filter((v) => v.type === "script");
  const withMetrics = campaign.adVariations.filter((v) => v.metrics && (v.metrics.impressions ?? 0) > 0);
  const withImages = hooks.filter((h) => typeof h.content.imageBase64 === "string");
  const winners = campaign.adVariations.filter((v) => v.status === "winner");
  const dead = campaign.adVariations.filter((v) => v.status === "dead");
  const daysSinceCreation = Math.floor((Date.now() - new Date(campaign.createdAt).getTime()) / (1000 * 60 * 60 * 24));

  // No variations at all
  if (hooks.length + scripts.length === 0) {
    issues.push({ severity: "critical", message: "No ad variations created", action: "Generate hooks using the AI Generate tab" });
    score -= 30;
  }

  // No images
  if (hooks.length > 0 && withImages.length === 0) {
    issues.push({ severity: "warning", message: "No images on any hook", action: "Click 'Images for All' to generate images" });
    score -= 15;
  }

  // No metrics entered
  if (hooks.length > 0 && withMetrics.length === 0 && daysSinceCreation > 3) {
    issues.push({ severity: "warning", message: `Campaign is ${daysSinceCreation} days old with no performance data`, action: "Enter your ad platform metrics or connect a pixel" });
    score -= 10;
  }

  // No analysis backing
  if (!campaign.hasAnalysis) {
    issues.push({ severity: "info", message: "Not backed by an analysis", action: "Run a Himalaya scan for data-driven hooks" });
    score -= 5;
  }

  // Still in draft after 7+ days
  if (campaign.status === "draft" && daysSinceCreation > 7) {
    issues.push({ severity: "warning", message: `Still in draft after ${daysSinceCreation} days`, action: "Set status to 'active' and start running ads" });
    score -= 10;
  }

  // All variations are dead
  if (dead.length > 0 && dead.length === hooks.length + scripts.length) {
    issues.push({ severity: "critical", message: "All variations marked dead", action: "Generate new hooks with a different angle" });
    score -= 25;
  }

  // Has a winner but still testing others
  if (winners.length > 0 && campaign.adVariations.filter((v) => v.status === "testing").length > 0) {
    issues.push({ severity: "info", message: "Winner found but still testing others", action: "Consider pausing testers and scaling the winner" });
  }

  // High CTR with no conversions
  const highCtrNoConv = withMetrics.filter((v) => {
    const m = v.metrics!;
    const ctr = (m.impressions ?? 0) > 0 ? ((m.clicks ?? 0) / (m.impressions ?? 1)) * 100 : 0;
    return ctr > 2 && (m.conversions ?? 0) === 0 && (m.impressions ?? 0) > 500;
  });
  if (highCtrNoConv.length > 0) {
    issues.push({ severity: "warning", message: `${highCtrNoConv.length} variation(s) with good CTR but zero conversions`, action: "Landing page or offer may be the bottleneck — check conversion rate" });
    score -= 10;
  }

  score = Math.max(0, Math.min(100, score));
  const status: CampaignHealthCheck["status"] =
    score >= 70 ? "healthy" : score >= 40 ? "warning" : "critical";

  return { id: campaign.id, name: campaign.name, status, issues, score };
}
