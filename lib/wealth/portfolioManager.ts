// ---------------------------------------------------------------------------
// Portfolio Manager — manage multiple businesses from one dashboard
// Each "portfolio item" is a complete Himalaya deployment
// Track performance, compare, allocate resources across businesses
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";

export type PortfolioItem = {
  id: string;
  name: string;
  niche: string;
  status: "active" | "growing" | "stable" | "declining" | "new";
  monthlyRevenue: number;
  monthlyProfit: number;
  growthRate: number;
  siteSlug: string | null;
  sitePublished: boolean;
  emailFlows: number;
  campaigns: number;
  contacts: number;
  createdAt: string;
  healthScore: number;
};

export type PortfolioSummary = {
  totalBusinesses: number;
  totalMonthlyRevenue: number;
  totalMonthlyProfit: number;
  avgGrowthRate: number;
  bestPerformer: string | null;
  worstPerformer: string | null;
  diversificationScore: number; // 0-100 — how diversified across niches
  items: PortfolioItem[];
};

export async function getPortfolio(userId: string): Promise<PortfolioSummary> {
  // Get all analysis runs (each represents a business/deployment)
  const runs = await prisma.analysisRun.findMany({
    where: { userId },
    select: { id: true, title: true, inputUrl: true, score: true, mode: true, createdAt: true, rawSignals: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Get all deployments
  const deployments = await prisma.himalayaDeployment.findMany({
    where: { userId },
    select: { analysisRunId: true, siteId: true, campaignId: true, emailFlowId: true },
  });

  // Get all sites with views
  const sites = await prisma.site.findMany({
    where: { userId },
    select: { id: true, name: true, slug: true, published: true, totalViews: true },
  });

  const siteIds = sites.map((s) => s.id);

  // Get orders grouped by site
  const orders = siteIds.length > 0
    ? await prisma.siteOrder.findMany({
        where: { siteId: { in: siteIds }, status: "paid" },
        select: { siteId: true, amountCents: true },
      })
    : [];

  const contacts = await prisma.emailContact.count({ where: { userId } });
  const flowCount = await prisma.emailFlow.count({ where: { userId } });
  const campaignCount = await prisma.campaign.count({ where: { userId } });

  // Build portfolio items
  const items: PortfolioItem[] = [];
  const niches = new Set<string>();

  for (const run of runs) {
    const signals = run.rawSignals as Record<string, unknown> | null;
    const foundation = signals?.foundation as Record<string, unknown> | undefined;
    const profile = foundation?.businessProfile as Record<string, string> | undefined;
    const niche = profile?.niche ?? "general";
    niches.add(niche);

    const deployment = deployments.find((d) => d.analysisRunId === run.id);
    const site = deployment?.siteId ? sites.find((s) => s.id === deployment.siteId) : null;
    const siteOrders = site ? orders.filter((o) => o.siteId === site.id) : [];
    const revenue = siteOrders.reduce((s, o) => s + o.amountCents, 0) / 100;

    items.push({
      id: run.id,
      name: run.title ?? "Business",
      niche,
      status: revenue > 0 ? "active" : site?.published ? "growing" : "new",
      monthlyRevenue: revenue,
      monthlyProfit: revenue * 0.7,
      growthRate: 0,
      siteSlug: site?.slug ?? null,
      sitePublished: site?.published ?? false,
      emailFlows: deployment?.emailFlowId ? 1 : 0,
      campaigns: deployment?.campaignId ? 1 : 0,
      contacts: 0,
      createdAt: run.createdAt.toISOString(),
      healthScore: run.score ?? 50,
    });
  }

  const totalRevenue = items.reduce((s, i) => s + i.monthlyRevenue, 0);
  const totalProfit = items.reduce((s, i) => s + i.monthlyProfit, 0);
  const avgGrowth = items.length > 0 ? items.reduce((s, i) => s + i.growthRate, 0) / items.length : 0;

  const sorted = [...items].sort((a, b) => b.monthlyRevenue - a.monthlyRevenue);
  const diversificationScore = Math.min(100, niches.size * 20); // More niches = more diversified

  return {
    totalBusinesses: items.length,
    totalMonthlyRevenue: totalRevenue,
    totalMonthlyProfit: totalProfit,
    avgGrowthRate: avgGrowth,
    bestPerformer: sorted[0]?.name ?? null,
    worstPerformer: sorted.length > 1 ? sorted[sorted.length - 1]?.name ?? null : null,
    diversificationScore,
    items,
  };
}
