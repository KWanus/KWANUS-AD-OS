// ---------------------------------------------------------------------------
// Revenue Forecasting — predict next 30/60/90 day revenue from trends
// Uses linear regression on daily revenue data
// ---------------------------------------------------------------------------

export type Forecast = {
  next30Days: number;
  next60Days: number;
  next90Days: number;
  dailyAvg: number;
  trend: "growing" | "stable" | "declining";
  trendPercent: number;
  confidence: "high" | "medium" | "low";
};

export function forecastRevenue(dailyRevenue: { date: string; revenue: number }[]): Forecast {
  if (dailyRevenue.length < 7) {
    const total = dailyRevenue.reduce((s, d) => s + d.revenue, 0);
    const dailyAvg = dailyRevenue.length > 0 ? total / dailyRevenue.length : 0;
    return {
      next30Days: dailyAvg * 30,
      next60Days: dailyAvg * 60,
      next90Days: dailyAvg * 90,
      dailyAvg,
      trend: "stable",
      trendPercent: 0,
      confidence: "low",
    };
  }

  // Simple linear regression on daily revenue
  const n = dailyRevenue.length;
  const xs = dailyRevenue.map((_, i) => i);
  const ys = dailyRevenue.map((d) => d.revenue);

  const sumX = xs.reduce((s, x) => s + x, 0);
  const sumY = ys.reduce((s, y) => s + y, 0);
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
  const sumXX = xs.reduce((s, x) => s + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Predict forward
  const predictDay = (day: number) => Math.max(0, intercept + slope * (n + day));

  const next30 = Array.from({ length: 30 }, (_, i) => predictDay(i)).reduce((s, v) => s + v, 0);
  const next60 = Array.from({ length: 60 }, (_, i) => predictDay(i)).reduce((s, v) => s + v, 0);
  const next90 = Array.from({ length: 90 }, (_, i) => predictDay(i)).reduce((s, v) => s + v, 0);

  const dailyAvg = sumY / n;

  // Trend analysis (compare first half vs second half)
  const mid = Math.floor(n / 2);
  const firstHalfAvg = ys.slice(0, mid).reduce((s, y) => s + y, 0) / Math.max(mid, 1);
  const secondHalfAvg = ys.slice(mid).reduce((s, y) => s + y, 0) / Math.max(n - mid, 1);
  const trendPercent = firstHalfAvg > 0
    ? Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100)
    : secondHalfAvg > 0 ? 100 : 0;

  const trend: Forecast["trend"] =
    trendPercent >= 10 ? "growing" : trendPercent <= -10 ? "declining" : "stable";

  const confidence: Forecast["confidence"] =
    n >= 21 ? "high" : n >= 14 ? "medium" : "low";

  return {
    next30Days: Math.round(next30 * 100) / 100,
    next60Days: Math.round(next60 * 100) / 100,
    next90Days: Math.round(next90 * 100) / 100,
    dailyAvg: Math.round(dailyAvg * 100) / 100,
    trend,
    trendPercent,
    confidence,
  };
}
