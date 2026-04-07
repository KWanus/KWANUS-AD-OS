// ---------------------------------------------------------------------------
// Exit Readiness Score — track business value for eventual sale
// Calculates what a buyer would pay based on SDE multiple
// Identifies what to improve to increase sale price
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";

export type ExitValuation = {
  estimatedValue: number;
  sdeMultiple: number;          // Seller's Discretionary Earnings multiple
  annualProfit: number;
  exitReadinessScore: number;   // 0-100
  valuationDrivers: ValuationDriver[];
  improvementActions: ExitAction[];
  comparableRange: { low: number; high: number };
};

export type ValuationDriver = {
  factor: string;
  score: number;        // 0-10
  weight: number;       // How much this affects the multiple
  status: "strong" | "average" | "weak";
  detail: string;
};

export type ExitAction = {
  action: string;
  impact: string;       // How much this increases valuation
  effort: "low" | "medium" | "high";
  timeframe: string;
};

export async function calculateExitReadiness(userId: string): Promise<ExitValuation> {
  const siteIds = (await prisma.site.findMany({ where: { userId }, select: { id: true, totalViews: true, published: true } }));
  const publishedSites = siteIds.filter(s => (s as any).published);

  const orders = await prisma.siteOrder.findMany({
    where: { siteId: { in: siteIds.map(s => s.id) }, status: "paid" },
    select: { amountCents: true, createdAt: true },
  });

  const contacts = await prisma.emailContact.count({ where: { userId, status: "subscribed" } });
  const flows = await prisma.emailFlow.count({ where: { userId, status: "active" } });
  const campaigns = await prisma.campaign.count({ where: { userId } });

  const totalRevenue = orders.reduce((s, o) => s + o.amountCents, 0) / 100;
  const annualRevenue = totalRevenue * (12 / Math.max(1, getMonthsOfData(orders)));
  const annualProfit = annualRevenue * 0.7; // Assume 70% margin for digital

  // Calculate valuation drivers
  const drivers: ValuationDriver[] = [];

  // 1. Revenue trend (most important)
  const recentRevenue = orders.filter(o => new Date(o.createdAt) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
    .reduce((s, o) => s + o.amountCents, 0) / 100;
  const olderRevenue = orders.filter(o => {
    const d = new Date(o.createdAt);
    return d > new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) && d <= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  }).reduce((s, o) => s + o.amountCents, 0) / 100;

  const growthTrend = olderRevenue > 0 ? ((recentRevenue - olderRevenue) / olderRevenue) * 100 : recentRevenue > 0 ? 100 : 0;
  const trendScore = growthTrend >= 20 ? 9 : growthTrend >= 0 ? 6 : growthTrend >= -10 ? 4 : 2;
  drivers.push({ factor: "Revenue Trend", score: trendScore, weight: 0.25, status: trendScore >= 7 ? "strong" : trendScore >= 5 ? "average" : "weak", detail: `${growthTrend >= 0 ? "+" : ""}${growthTrend.toFixed(0)}% growth` });

  // 2. Profit margin
  const marginScore = 8; // Digital businesses typically have high margins
  drivers.push({ factor: "Profit Margin", score: marginScore, weight: 0.15, status: "strong", detail: "~70% estimated margin" });

  // 3. Customer diversification
  const uniqueCustomers = new Set(orders.map(o => (o as any).customerEmail)).size;
  const diversScore = uniqueCustomers >= 50 ? 9 : uniqueCustomers >= 20 ? 7 : uniqueCustomers >= 5 ? 5 : 2;
  drivers.push({ factor: "Customer Base", score: diversScore, weight: 0.15, status: diversScore >= 7 ? "strong" : diversScore >= 5 ? "average" : "weak", detail: `${uniqueCustomers} unique customers` });

  // 4. Systems & automation
  const automationScore = Math.min(10, 2 + flows + (campaigns > 0 ? 2 : 0) + (publishedSites.length > 0 ? 2 : 0) + (contacts >= 100 ? 2 : 0));
  drivers.push({ factor: "Systems & Automation", score: automationScore, weight: 0.15, status: automationScore >= 7 ? "strong" : automationScore >= 4 ? "average" : "weak", detail: `${flows} flows, ${campaigns} campaigns, ${publishedSites.length} sites` });

  // 5. Email list (owned asset)
  const listScore = contacts >= 1000 ? 9 : contacts >= 500 ? 7 : contacts >= 100 ? 5 : contacts >= 10 ? 3 : 1;
  drivers.push({ factor: "Email List", score: listScore, weight: 0.15, status: listScore >= 7 ? "strong" : listScore >= 4 ? "average" : "weak", detail: `${contacts.toLocaleString()} subscribers` });

  // 6. Traffic sources
  const trafficScore = publishedSites.length >= 3 ? 8 : publishedSites.length >= 1 ? 5 : 2;
  drivers.push({ factor: "Traffic Diversity", score: trafficScore, weight: 0.15, status: trafficScore >= 7 ? "strong" : trafficScore >= 4 ? "average" : "weak", detail: `${publishedSites.length} published sites` });

  // Calculate SDE multiple
  const avgDriverScore = drivers.reduce((s, d) => s + d.score * d.weight, 0) / drivers.reduce((s, d) => s + d.weight, 0);
  const sdeMultiple = Math.max(1, Math.min(5, avgDriverScore * 0.5)); // 1x - 5x SDE
  const estimatedValue = Math.round(annualProfit * sdeMultiple);
  const exitReadinessScore = Math.round(avgDriverScore * 10);

  // Improvement actions
  const improvementActions: ExitAction[] = [];

  const weakDrivers = drivers.filter(d => d.status === "weak").sort((a, b) => b.weight - a.weight);
  for (const driver of weakDrivers.slice(0, 3)) {
    if (driver.factor === "Revenue Trend") {
      improvementActions.push({ action: "Grow revenue consistently for 6+ months", impact: "Increases multiple from 2x to 3-4x", effort: "high", timeframe: "6 months" });
    }
    if (driver.factor === "Customer Base") {
      improvementActions.push({ action: "Acquire 20+ diverse customers", impact: "Reduces buyer risk = higher multiple", effort: "medium", timeframe: "3 months" });
    }
    if (driver.factor === "Email List") {
      improvementActions.push({ action: "Grow email list to 500+ subscribers", impact: "Owned audience = transferable asset", effort: "medium", timeframe: "2 months" });
    }
    if (driver.factor === "Systems & Automation") {
      improvementActions.push({ action: "Document all processes and automate key workflows", impact: "Business runs without you = higher value", effort: "medium", timeframe: "1 month" });
    }
  }

  // Always add
  improvementActions.push({ action: "Maintain 12 months of clean financial records", impact: "Required for any serious buyer", effort: "low", timeframe: "Ongoing" });

  return {
    estimatedValue,
    sdeMultiple: Math.round(sdeMultiple * 10) / 10,
    annualProfit: Math.round(annualProfit),
    exitReadinessScore,
    valuationDrivers: drivers,
    improvementActions,
    comparableRange: {
      low: Math.round(annualProfit * Math.max(1, sdeMultiple - 1)),
      high: Math.round(annualProfit * (sdeMultiple + 1)),
    },
  };
}

function getMonthsOfData(orders: { createdAt: Date }[]): number {
  if (orders.length === 0) return 1;
  const earliest = Math.min(...orders.map(o => new Date(o.createdAt).getTime()));
  return Math.max(1, Math.round((Date.now() - earliest) / (30 * 24 * 60 * 60 * 1000)));
}
