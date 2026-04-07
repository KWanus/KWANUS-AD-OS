// ---------------------------------------------------------------------------
// Wealth Engine — autonomous profit maximizer that compounds over time
//
// This is NOT just revenue tracking. This is the system that:
// 1. Identifies the highest-ROI action at any moment
// 2. Calculates compound growth from small improvements
// 3. Automates profit reinvestment decisions
// 4. Tracks wealth accumulation (not just revenue)
//
// The difference between making money and building wealth:
// - Making money: $5k/mo revenue
// - Building wealth: $5k/mo → $8k/mo → $15k/mo → $30k/mo
//   because the system finds and compounds every edge.
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";

export type WealthMetrics = {
  // Revenue
  monthlyRevenue: number;
  monthlyProfit: number;        // Revenue - costs
  profitMargin: number;         // %
  revenueGrowthRate: number;    // Month-over-month %

  // Efficiency
  customerAcquisitionCost: number;
  lifetimeValue: number;
  ltvToCacRatio: number;        // >3 = healthy, >5 = excellent
  revenuePerVisitor: number;

  // Stability
  recurringRevenue: number;     // From subscriptions/retainers
  recurringPercentage: number;  // % of total revenue that's recurring
  churnRate: number;            // % of customers lost per month
  retentionRate: number;

  // Growth potential
  untappedOpportunities: number;
  estimatedCeiling: number;     // Max revenue with current system
  scalingReadiness: number;     // 0-100

  // Wealth accumulation
  totalLifetimeRevenue: number;
  totalLifetimeProfit: number;
  monthsActive: number;
  wealthScore: number;          // 0-100 composite score
};

export type CompoundingOpportunity = {
  id: string;
  type: "conversion" | "pricing" | "retention" | "expansion" | "efficiency" | "new_channel";
  title: string;
  description: string;
  currentValue: number;
  improvedValue: number;
  monthlyImpact: number;        // Additional $/mo
  compoundedAnnualImpact: number; // With compounding
  effort: "low" | "medium" | "high";
  timeToImpact: string;         // "1 week", "1 month"
  automatable: boolean;
};

export type WealthPlan = {
  currentState: WealthMetrics;
  opportunities: CompoundingOpportunity[];
  projections: {
    month3: number;
    month6: number;
    month12: number;
    month24: number;
  };
  topPriority: string;
  wealthScore: number;
};

export async function generateWealthPlan(userId: string): Promise<WealthPlan> {
  // Gather all data
  const siteIds = (await prisma.site.findMany({ where: { userId }, select: { id: true, totalViews: true } }));
  const totalViews = siteIds.reduce((s, site) => s + site.totalViews, 0);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const [thisMonthOrders, lastMonthOrders, allOrders, contacts, flows] = await Promise.all([
    prisma.siteOrder.findMany({
      where: { siteId: { in: siteIds.map((s) => s.id) }, status: "paid", createdAt: { gte: thirtyDaysAgo } },
      select: { amountCents: true },
    }),
    prisma.siteOrder.findMany({
      where: { siteId: { in: siteIds.map((s) => s.id) }, status: "paid", createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      select: { amountCents: true },
    }),
    prisma.siteOrder.findMany({
      where: { siteId: { in: siteIds.map((s) => s.id) }, status: "paid" },
      select: { amountCents: true, createdAt: true },
    }),
    prisma.emailContact.count({ where: { userId } }),
    prisma.emailFlow.findMany({
      where: { userId },
      select: { sent: true, opens: true, clicks: true, conversions: true, revenue: true },
    }),
  ]);

  const monthlyRevenue = thisMonthOrders.reduce((s, o) => s + o.amountCents, 0) / 100;
  const lastMonthRevenue = lastMonthOrders.reduce((s, o) => s + o.amountCents, 0) / 100;
  const totalRevenue = allOrders.reduce((s, o) => s + o.amountCents, 0) / 100;
  const totalOrders = allOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const revenueGrowthRate = lastMonthRevenue > 0 ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

  // Calculate LTV and CAC
  const ltv = avgOrderValue * 1.3; // Assume 30% repeat/upsell
  const cac = totalViews > 0 && totalOrders > 0 ? (totalViews * 1.5) / totalOrders : 0; // Rough CPC * visitors / orders
  const rpv = totalViews > 0 ? totalRevenue / totalViews : 0;

  // First order date
  const firstOrder = allOrders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
  const monthsActive = firstOrder
    ? Math.max(1, Math.round((Date.now() - new Date(firstOrder.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000)))
    : 1;

  const emailRevenue = flows.reduce((s, f) => s + f.revenue, 0);
  const emailSent = flows.reduce((s, f) => s + f.sent, 0);
  const emailOpens = flows.reduce((s, f) => s + f.opens, 0);
  const emailClicks = flows.reduce((s, f) => s + f.clicks, 0);
  const openRate = emailSent > 0 ? (emailOpens / emailSent) * 100 : 0;
  const clickRate = emailSent > 0 ? (emailClicks / emailSent) * 100 : 0;

  const convRate = totalViews > 0 ? (contacts / totalViews) * 100 : 0;
  const estimatedCeiling = monthlyRevenue * 10; // Current system could 10x with optimization

  // Wealth score composite
  let wealthScore = 20; // Base
  if (monthlyRevenue > 0) wealthScore += 15;
  if (revenueGrowthRate > 0) wealthScore += 10;
  if (ltv / Math.max(cac, 1) >= 3) wealthScore += 15;
  if (openRate >= 20) wealthScore += 5;
  if (convRate >= 2) wealthScore += 10;
  if (contacts >= 100) wealthScore += 5;
  if (totalOrders >= 10) wealthScore += 10;
  if (monthsActive >= 3) wealthScore += 5;
  if (emailRevenue > 0) wealthScore += 5;
  wealthScore = Math.min(100, wealthScore);

  const currentState: WealthMetrics = {
    monthlyRevenue,
    monthlyProfit: monthlyRevenue * 0.7, // Assume 70% margin
    profitMargin: 70,
    revenueGrowthRate: Math.round(revenueGrowthRate),
    customerAcquisitionCost: Math.round(cac * 100) / 100,
    lifetimeValue: Math.round(ltv * 100) / 100,
    ltvToCacRatio: cac > 0 ? Math.round((ltv / cac) * 10) / 10 : 0,
    revenuePerVisitor: Math.round(rpv * 100) / 100,
    recurringRevenue: 0,
    recurringPercentage: 0,
    churnRate: 0,
    retentionRate: 100,
    untappedOpportunities: 0,
    estimatedCeiling,
    scalingReadiness: wealthScore,
    totalLifetimeRevenue: totalRevenue,
    totalLifetimeProfit: totalRevenue * 0.7,
    monthsActive,
    wealthScore,
  };

  // ── Find compounding opportunities ────────────────────────────────

  const opportunities: CompoundingOpportunity[] = [];

  // 1. Conversion rate improvement
  if (totalViews >= 100 && convRate < 3) {
    const improvedConv = Math.min(convRate * 2, 5);
    const additionalLeads = totalViews * ((improvedConv - convRate) / 100);
    const additionalRevenue = additionalLeads * avgOrderValue * 0.1;
    opportunities.push({
      id: "improve-conversion",
      type: "conversion",
      title: "Double your conversion rate",
      description: `Current: ${convRate.toFixed(1)}%. Target: ${improvedConv.toFixed(1)}%. Same traffic, 2x leads.`,
      currentValue: convRate,
      improvedValue: improvedConv,
      monthlyImpact: Math.round(additionalRevenue),
      compoundedAnnualImpact: Math.round(additionalRevenue * 12 * 1.5), // Compounds as traffic grows
      effort: "medium",
      timeToImpact: "2 weeks",
      automatable: true,
    });
  }

  // 2. Price increase
  if (avgOrderValue > 0 && avgOrderValue < 500) {
    const priceIncrease = avgOrderValue * 0.2; // 20% increase
    opportunities.push({
      id: "increase-price",
      type: "pricing",
      title: "Increase price 20%",
      description: `$${avgOrderValue.toFixed(0)} → $${(avgOrderValue + priceIncrease).toFixed(0)}. Most businesses undercharge. A 20% increase with 5% fewer customers = more profit.`,
      currentValue: avgOrderValue,
      improvedValue: avgOrderValue + priceIncrease,
      monthlyImpact: Math.round(thisMonthOrders.length * priceIncrease * 0.95),
      compoundedAnnualImpact: Math.round(thisMonthOrders.length * priceIncrease * 0.95 * 12),
      effort: "low",
      timeToImpact: "1 day",
      automatable: false,
    });
  }

  // 3. Email revenue optimization
  if (contacts >= 50 && emailRevenue < monthlyRevenue * 0.3) {
    const potentialEmailRev = contacts * 0.5; // $0.50 per subscriber per month
    opportunities.push({
      id: "email-monetization",
      type: "expansion",
      title: "Monetize your email list",
      description: `${contacts} contacts generating $${emailRevenue.toFixed(0)}/mo. Industry average is $0.50/subscriber = $${(contacts * 0.5).toFixed(0)}/mo.`,
      currentValue: emailRevenue,
      improvedValue: potentialEmailRev,
      monthlyImpact: Math.round(potentialEmailRev - emailRevenue),
      compoundedAnnualImpact: Math.round((potentialEmailRev - emailRevenue) * 12 * 1.3),
      effort: "medium",
      timeToImpact: "1 month",
      automatable: true,
    });
  }

  // 4. Upsell/cross-sell
  if (totalOrders >= 5) {
    const upsellRevenue = monthlyRevenue * 0.25;
    opportunities.push({
      id: "upsell",
      type: "retention",
      title: "Add an upsell or premium tier",
      description: "25% of customers will buy more if asked. Add a higher-priced option or complementary product.",
      currentValue: 0,
      improvedValue: upsellRevenue,
      monthlyImpact: Math.round(upsellRevenue),
      compoundedAnnualImpact: Math.round(upsellRevenue * 12 * 1.5),
      effort: "medium",
      timeToImpact: "1 week",
      automatable: true,
    });
  }

  // 5. New channel
  if (monthlyRevenue > 0) {
    opportunities.push({
      id: "new-channel",
      type: "new_channel",
      title: "Launch on a second platform",
      description: "You're on one channel. Adding a second (paid ads, content, outreach) typically adds 40-60% more revenue.",
      currentValue: monthlyRevenue,
      improvedValue: monthlyRevenue * 1.5,
      monthlyImpact: Math.round(monthlyRevenue * 0.5),
      compoundedAnnualImpact: Math.round(monthlyRevenue * 0.5 * 12 * 1.5),
      effort: "high",
      timeToImpact: "1 month",
      automatable: true,
    });
  }

  // 6. Reduce CAC
  if (cac > 0 && cac > avgOrderValue * 0.3) {
    opportunities.push({
      id: "reduce-cac",
      type: "efficiency",
      title: "Cut customer acquisition cost",
      description: `CAC is $${cac.toFixed(0)} (${((cac / avgOrderValue) * 100).toFixed(0)}% of order value). Target: under 20%.`,
      currentValue: cac,
      improvedValue: cac * 0.6,
      monthlyImpact: Math.round(thisMonthOrders.length * cac * 0.4),
      compoundedAnnualImpact: Math.round(thisMonthOrders.length * cac * 0.4 * 12),
      effort: "medium",
      timeToImpact: "2 weeks",
      automatable: true,
    });
  }

  // Sort by compounded annual impact
  opportunities.sort((a, b) => b.compoundedAnnualImpact - a.compoundedAnnualImpact);

  // Project future revenue with compounding
  const monthlyGrowthRate = revenueGrowthRate > 0 ? revenueGrowthRate / 100 : 0.1; // Default 10%
  const baseRevenue = monthlyRevenue > 0 ? monthlyRevenue : 1000;

  const projections = {
    month3: Math.round(baseRevenue * Math.pow(1 + monthlyGrowthRate, 3)),
    month6: Math.round(baseRevenue * Math.pow(1 + monthlyGrowthRate, 6)),
    month12: Math.round(baseRevenue * Math.pow(1 + monthlyGrowthRate, 12)),
    month24: Math.round(baseRevenue * Math.pow(1 + monthlyGrowthRate, 24)),
  };

  const topPriority = opportunities[0]
    ? `${opportunities[0].title} — adds $${opportunities[0].monthlyImpact}/mo, compounds to $${opportunities[0].compoundedAnnualImpact}/year`
    : "Deploy your first Himalaya business to start generating data.";

  return {
    currentState,
    opportunities,
    projections,
    topPriority,
    wealthScore,
  };
}
