// ---------------------------------------------------------------------------
// Market Research Engine — deep niche analysis from SerpAPI + AI
// Used by Himalaya foundation generation and competitor monitoring
// ---------------------------------------------------------------------------

export type MarketInsight = {
  marketSize: "large" | "medium" | "small" | "niche";
  growthTrend: "growing" | "stable" | "declining";
  avgPriceRange: string;
  topPlayers: string[];
  underservedAngles: string[];
  commonWeaknesses: string[];
  entryBarrier: "low" | "medium" | "high";
  recommendation: string;
};

/** Analyze market from competitor data */
export function analyzeMarket(competitors: {
  url: string;
  title: string;
  pricing?: string | null;
  trustSignals: string[];
  weaknesses: string[];
}[]): MarketInsight {
  const count = competitors.length;

  // Market size from competitor count
  const marketSize: MarketInsight["marketSize"] =
    count >= 10 ? "large" : count >= 5 ? "medium" : count >= 2 ? "small" : "niche";

  // Price analysis
  const prices = competitors
    .map((c) => c.pricing)
    .filter(Boolean)
    .map((p) => {
      const match = p!.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
      return match ? parseFloat(match[1].replace(",", "")) : null;
    })
    .filter((p): p is number => p !== null);

  const avgPriceRange = prices.length >= 2
    ? `$${Math.min(...prices).toFixed(0)} - $${Math.max(...prices).toFixed(0)}`
    : prices.length === 1
      ? `~$${prices[0].toFixed(0)}`
      : "Unknown";

  // Common weaknesses across competitors
  const weaknessFreq: Record<string, number> = {};
  for (const c of competitors) {
    for (const w of c.weaknesses) {
      const key = w.toLowerCase().slice(0, 50);
      weaknessFreq[key] = (weaknessFreq[key] ?? 0) + 1;
    }
  }
  const commonWeaknesses = Object.entries(weaknessFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);

  // Trust signal analysis
  const avgTrustSignals = count > 0
    ? competitors.reduce((s, c) => s + c.trustSignals.length, 0) / count
    : 0;

  const entryBarrier: MarketInsight["entryBarrier"] =
    avgTrustSignals >= 5 ? "high" : avgTrustSignals >= 2 ? "medium" : "low";

  // Top players
  const topPlayers = competitors.slice(0, 5).map((c) => c.title || c.url);

  // Underserved angles (from most common weaknesses)
  const underservedAngles = commonWeaknesses.map((w) => `Address: ${w}`);

  const recommendation = marketSize === "niche"
    ? "Small market — focus on being the best option, not the biggest."
    : entryBarrier === "high"
      ? "Competitive market — differentiate hard on one specific angle."
      : commonWeaknesses.length >= 3
        ? `Market has clear gaps: ${commonWeaknesses.slice(0, 2).join(", ")}. Position against these.`
        : "Market is accessible — move fast and establish authority early.";

  return {
    marketSize,
    growthTrend: "stable", // Would need trends API for real data
    avgPriceRange,
    topPlayers,
    underservedAngles,
    commonWeaknesses,
    entryBarrier,
    recommendation,
  };
}
