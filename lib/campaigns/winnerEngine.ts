// ---------------------------------------------------------------------------
// A/B Winner Recommendation Engine
// Analyzes ad variation metrics and recommends which to scale, kill, or keep testing
// ---------------------------------------------------------------------------

export type VariationMetrics = {
  impressions?: number;
  clicks?: number;
  ctr?: string;
  roas?: number;
  spend?: number;
  conversions?: number;
};

export type VariationWithMetrics = {
  id: string;
  name: string;
  type: string;
  status: string;
  metrics: VariationMetrics | null;
};

export type WinnerRecommendation = {
  variationId: string;
  name: string;
  action: "scale" | "keep-testing" | "kill";
  reason: string;
  confidence: "high" | "medium" | "low";
  score: number; // 0-100
};

export type ABAnalysis = {
  hasEnoughData: boolean;
  minimumSpendReached: boolean;
  recommendations: WinnerRecommendation[];
  summary: string;
  topPerformer: string | null;
};

const MIN_IMPRESSIONS = 500;
const MIN_SPEND = 30; // $30 minimum before judging
const MIN_CLICKS = 10;

export function analyzeVariations(variations: VariationWithMetrics[]): ABAnalysis {
  const withMetrics = variations.filter(
    (v) => v.metrics && v.status !== "dead" && (v.metrics.impressions ?? 0) > 0
  );

  if (withMetrics.length === 0) {
    return {
      hasEnoughData: false,
      minimumSpendReached: false,
      recommendations: variations.map((v) => ({
        variationId: v.id,
        name: v.name,
        action: "keep-testing" as const,
        reason: "No data yet — run ads and enter metrics to get recommendations",
        confidence: "low" as const,
        score: 50,
      })),
      summary: "No metrics data available. Enter your ad platform numbers to get winner recommendations.",
      topPerformer: null,
    };
  }

  const totalSpend = withMetrics.reduce((s, v) => s + (v.metrics?.spend ?? 0), 0);
  const totalImpressions = withMetrics.reduce((s, v) => s + (v.metrics?.impressions ?? 0), 0);
  const minimumSpendReached = totalSpend >= MIN_SPEND;
  const hasEnoughData = totalImpressions >= MIN_IMPRESSIONS && minimumSpendReached;

  // Score each variation
  const scored = withMetrics.map((v) => {
    const m = v.metrics!;
    const impressions = m.impressions ?? 0;
    const clicks = m.clicks ?? 0;
    const conversions = m.conversions ?? 0;
    const spend = m.spend ?? 0;
    const roas = m.roas ?? 0;

    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cvr = clicks > 0 ? (conversions / clicks) * 100 : 0;

    // Weighted score: ROAS (40%) + CTR (30%) + CVR (30%)
    let score = 0;

    // ROAS score (0-40 points)
    if (roas >= 4) score += 40;
    else if (roas >= 3) score += 35;
    else if (roas >= 2) score += 28;
    else if (roas >= 1.5) score += 20;
    else if (roas >= 1) score += 12;
    else if (roas > 0) score += 5;

    // CTR score (0-30 points)
    if (ctr >= 3) score += 30;
    else if (ctr >= 2) score += 25;
    else if (ctr >= 1.5) score += 20;
    else if (ctr >= 1) score += 15;
    else if (ctr >= 0.5) score += 8;
    else score += 3;

    // CVR score (0-30 points)
    if (cvr >= 5) score += 30;
    else if (cvr >= 3) score += 25;
    else if (cvr >= 2) score += 18;
    else if (cvr >= 1) score += 12;
    else if (cvr > 0) score += 5;

    return { ...v, score, ctr, cvr, spend, impressions, clicks, conversions, roas };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Generate recommendations
  const topScore = scored[0]?.score ?? 0;
  const recommendations: WinnerRecommendation[] = scored.map((v, i) => {
    const dataConfidence = v.impressions >= MIN_IMPRESSIONS && v.spend >= MIN_SPEND
      ? "high" as const
      : v.impressions >= MIN_IMPRESSIONS / 2
        ? "medium" as const
        : "low" as const;

    if (i === 0 && v.score >= 60 && hasEnoughData) {
      return {
        variationId: v.id,
        name: v.name,
        action: "scale" as const,
        reason: `Top performer. ${v.roas > 0 ? `${v.roas}x ROAS. ` : ""}${v.ctr.toFixed(1)}% CTR${v.conversions > 0 ? `. ${v.conversions} conversions.` : "."} Scale budget 2-3x.`,
        confidence: dataConfidence,
        score: v.score,
      };
    }

    if (v.score < 30 && v.spend >= MIN_SPEND) {
      return {
        variationId: v.id,
        name: v.name,
        action: "kill" as const,
        reason: `Underperforming. ${v.ctr.toFixed(1)}% CTR${v.roas > 0 ? `, ${v.roas}x ROAS` : ""}. Spent $${v.spend.toFixed(0)} with poor results. Kill and redirect budget.`,
        confidence: dataConfidence,
        score: v.score,
      };
    }

    if (v.score >= topScore * 0.8) {
      return {
        variationId: v.id,
        name: v.name,
        action: "keep-testing" as const,
        reason: `Close to top performer (${v.score} vs ${topScore}). Needs more data before deciding. Keep running.`,
        confidence: dataConfidence,
        score: v.score,
      };
    }

    return {
      variationId: v.id,
      name: v.name,
      action: v.score >= 40 ? "keep-testing" as const : "kill" as const,
      reason: v.score >= 40
        ? `Moderate performance. ${v.ctr.toFixed(1)}% CTR. Keep testing for ${MIN_IMPRESSIONS - v.impressions > 0 ? `${MIN_IMPRESSIONS - v.impressions} more impressions` : "more data"}.`
        : `Low performance. Consider killing if no improvement after $${Math.max(0, MIN_SPEND - v.spend).toFixed(0)} more spend.`,
      confidence: dataConfidence,
      score: v.score,
    };
  });

  // Add unscored variations
  const unscoredVariations = variations.filter(
    (v) => !scored.find((s) => s.id === v.id) && v.status !== "dead"
  );
  for (const v of unscoredVariations) {
    recommendations.push({
      variationId: v.id,
      name: v.name,
      action: "keep-testing",
      reason: "No metrics yet. Start running this ad and enter performance data.",
      confidence: "low",
      score: 0,
    });
  }

  const topPerformer = scored[0]?.name ?? null;
  const summary = hasEnoughData
    ? `${topPerformer} is your top performer (score: ${topScore}/100). ${scored.filter(s => s.score < 30).length} variations should be killed. ${scored.filter(s => s.score >= 60).length} ready to scale.`
    : `Not enough data yet. Need at least ${MIN_IMPRESSIONS} impressions and $${MIN_SPEND} spend per variation. Keep testing all active variations.`;

  return {
    hasEnoughData,
    minimumSpendReached,
    recommendations,
    summary,
    topPerformer,
  };
}
