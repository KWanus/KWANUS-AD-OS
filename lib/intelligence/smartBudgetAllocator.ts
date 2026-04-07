// ---------------------------------------------------------------------------
// Smart Budget Allocator — AI distributes ad spend across platforms
// Based on real-time ROAS, allocates more to what's working
// ---------------------------------------------------------------------------

import type { AdPlatformMetrics } from "@/lib/integrations/adMetricsPull";

export type BudgetAllocation = {
  platform: string;
  currentSpend: number;
  suggestedSpend: number;
  change: number;           // +/- dollar change
  changePercent: number;
  reason: string;
  roas: number;
  confidence: "high" | "medium" | "low";
};

export type AllocationPlan = {
  totalBudget: number;
  allocations: BudgetAllocation[];
  strategy: string;
  expectedROAS: number;
};

export function allocateBudget(
  platforms: AdPlatformMetrics[],
  totalBudget: number
): AllocationPlan {
  const withData = platforms.filter((p) => p.totals.spend > 0);

  if (withData.length === 0) {
    // No data — split evenly
    const perPlatform = totalBudget / Math.max(platforms.length, 1);
    return {
      totalBudget,
      allocations: platforms.map((p) => ({
        platform: p.platform,
        currentSpend: 0,
        suggestedSpend: Math.round(perPlatform),
        change: Math.round(perPlatform),
        changePercent: 100,
        reason: "No data yet — starting with even split. Will optimize after 7 days of data.",
        roas: 0,
        confidence: "low",
      })),
      strategy: "Even split — no performance data available yet.",
      expectedROAS: 0,
    };
  }

  // Calculate ROAS-weighted allocation
  const totalROAS = withData.reduce((s, p) => s + Math.max(p.totals.roas, 0.1), 0);
  const totalCurrentSpend = withData.reduce((s, p) => s + p.totals.spend, 0);

  const allocations: BudgetAllocation[] = withData.map((p) => {
    const roas = p.totals.roas;
    const weight = Math.max(roas, 0.1) / totalROAS;

    // ROAS-weighted budget
    let suggestedSpend = Math.round(totalBudget * weight);

    // Guardrails: don't allocate more than 70% to one platform
    suggestedSpend = Math.min(suggestedSpend, Math.round(totalBudget * 0.7));

    // Don't cut a working platform to zero
    if (roas >= 1 && suggestedSpend < p.totals.spend * 0.5) {
      suggestedSpend = Math.round(p.totals.spend * 0.5);
    }

    const change = suggestedSpend - p.totals.spend;
    const changePercent = p.totals.spend > 0 ? (change / p.totals.spend) * 100 : 100;

    let reason = "";
    if (roas >= 3) {
      reason = `Scaling — ${roas.toFixed(1)}x ROAS. High performer, increasing allocation.`;
    } else if (roas >= 1.5) {
      reason = `Maintaining — ${roas.toFixed(1)}x ROAS. Profitable, holding steady.`;
    } else if (roas >= 1) {
      reason = `Cautious — ${roas.toFixed(1)}x ROAS. Break-even, testing with reduced budget.`;
    } else if (roas > 0) {
      reason = `Reducing — ${roas.toFixed(1)}x ROAS. Unprofitable, shifting budget to better performers.`;
    } else {
      reason = "No conversion data — running minimum spend to collect data.";
    }

    const confidence: BudgetAllocation["confidence"] =
      p.totals.impressions >= 5000 ? "high" :
      p.totals.impressions >= 1000 ? "medium" : "low";

    return {
      platform: p.platform,
      currentSpend: p.totals.spend,
      suggestedSpend,
      change,
      changePercent: Math.round(changePercent),
      reason,
      roas,
      confidence,
    };
  });

  // Add platforms with no data
  const dataPlatforms = new Set(withData.map((p) => p.platform));
  const noPlatforms = platforms.filter((p) => !dataPlatforms.has(p.platform));
  const remainingBudget = totalBudget - allocations.reduce((s, a) => s + a.suggestedSpend, 0);

  for (const p of noPlatforms) {
    const share = Math.round(remainingBudget / Math.max(noPlatforms.length, 1));
    allocations.push({
      platform: p.platform,
      currentSpend: 0,
      suggestedSpend: Math.max(share, 0),
      change: Math.max(share, 0),
      changePercent: 100,
      reason: "New platform — allocating test budget to collect data.",
      roas: 0,
      confidence: "low",
    });
  }

  // Normalize to total budget
  const allocTotal = allocations.reduce((s, a) => s + a.suggestedSpend, 0);
  if (allocTotal > 0 && allocTotal !== totalBudget) {
    const ratio = totalBudget / allocTotal;
    for (const a of allocations) {
      a.suggestedSpend = Math.round(a.suggestedSpend * ratio);
      a.change = a.suggestedSpend - a.currentSpend;
    }
  }

  const expectedROAS = allocations.reduce((s, a) => {
    return s + (a.roas * (a.suggestedSpend / Math.max(totalBudget, 1)));
  }, 0);

  const bestPlatform = allocations.sort((a, b) => b.roas - a.roas)[0];
  const strategy = bestPlatform?.roas >= 2
    ? `Concentrate on ${bestPlatform.platform} (${bestPlatform.roas.toFixed(1)}x ROAS) while testing others.`
    : "Collecting data across platforms — will optimize after more conversions.";

  return {
    totalBudget,
    allocations: allocations.sort((a, b) => b.suggestedSpend - a.suggestedSpend),
    strategy,
    expectedROAS: Math.round(expectedROAS * 10) / 10,
  };
}
