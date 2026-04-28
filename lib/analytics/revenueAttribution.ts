import { prisma } from "@/lib/prisma";

export interface RevenueSource {
  source: string;
  clients: number;
  totalRevenue: number;
  avgDealSize: number;
  conversionRate: number;
  roi?: number;
}

export interface ClientRevenue {
  clientId: string;
  clientName: string;
  source: string;
  totalRevenue: number;
  mrr?: number;
  lifetimeValue: number;
  acquisitionDate: Date;
}

export interface MRRProjection {
  currentMRR: number;
  projectedMRR: number;
  growthRate: number;
  churnRate: number;
  newMRR: number;
  expandedMRR: number;
  churnedMRR: number;
}

export interface DashboardMetrics {
  totalRevenue: number;
  currentMRR: number;
  avgDealSize: number;
  ltv: number;
  revenueBySource: RevenueSource[];
  topClients: ClientRevenue[];
  mrrProjection: MRRProjection;
  revenueThisMonth: number;
  revenueLastMonth: number;
  growthRate: number;
}

/**
 * Calculate revenue attribution by marketing source
 */
export async function getRevenueBySource(userId: string): Promise<RevenueSource[]> {
  // Get all clients with revenue data
  const clients = await prisma.client.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      sourceCampaignId: true,
      dealValue: true,
      pipelineStage: true,
      createdAt: true,
    },
  });

  // Get lead counts by source for conversion rate
  const leads = await prisma.lead.findMany({
    where: { userId },
    select: { source: true, status: true },
  });

  // Group by source
  const sourceMap = new Map<string, {
    clients: number;
    totalRevenue: number;
    leadCount: number;
  }>();

  // Process clients
  for (const client of clients) {
    const source = client.sourceCampaignId || "direct";
    const existing = sourceMap.get(source) || { clients: 0, totalRevenue: 0, leadCount: 0 };
    sourceMap.set(source, {
      clients: existing.clients + 1,
      totalRevenue: existing.totalRevenue + (client.dealValue || 0),
      leadCount: existing.leadCount,
    });
  }

  // Process leads for conversion rate
  for (const lead of leads) {
    const source = lead.source || "unknown";
    const existing = sourceMap.get(source) || { clients: 0, totalRevenue: 0, leadCount: 0 };
    sourceMap.set(source, {
      ...existing,
      leadCount: existing.leadCount + 1,
    });
  }

  // Convert to array with calculated metrics
  return Array.from(sourceMap.entries()).map(([source, data]) => ({
    source,
    clients: data.clients,
    totalRevenue: data.totalRevenue,
    avgDealSize: data.clients > 0 ? data.totalRevenue / data.clients : 0,
    conversionRate: data.leadCount > 0 ? (data.clients / data.leadCount) * 100 : 0,
  })).sort((a, b) => b.totalRevenue - a.totalRevenue);
}

/**
 * Get top revenue-generating clients
 */
export async function getTopClients(userId: string, limit = 10): Promise<ClientRevenue[]> {
  const clients = await prisma.client.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      source: true,
      dealValue: true,
      createdAt: true,
    },
    orderBy: { dealValue: "desc" },
    take: limit,
  });

  return clients.map(client => ({
    clientId: client.id,
    clientName: client.name,
    source: client.source || "unknown",
    totalRevenue: client.dealValue || 0,
    lifetimeValue: client.dealValue || 0, // In future, add subscription data
    acquisitionDate: client.createdAt,
  }));
}

/**
 * Calculate MRR and projections
 */
export async function getMRRProjection(userId: string): Promise<MRRProjection> {
  // Get all active subscription clients
  const clients = await prisma.client.findMany({
    where: {
      userId,
      status: { in: ["active", "onboarding"] },
    },
    select: {
      dealValue: true,
      createdAt: true,
    },
  });

  // Calculate current MRR (assume dealValue is total, divide by 12 for monthly)
  const currentMRR = clients.reduce((sum, c) => sum + ((c.dealValue || 0) / 12), 0);

  // Get clients from last 3 months for growth calculation
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const recentClients = clients.filter(c => c.createdAt >= threeMonthsAgo);
  const newMRR = recentClients.reduce((sum, c) => sum + ((c.dealValue || 0) / 12), 0);

  // Calculate growth rate (simplified)
  const growthRate = currentMRR > 0 ? (newMRR / currentMRR) * 100 : 0;

  // Estimate churn (assume 5% monthly churn as baseline)
  const churnRate = 5;
  const churnedMRR = currentMRR * (churnRate / 100);

  // Project next month
  const projectedMRR = currentMRR + (currentMRR * (growthRate / 100)) - churnedMRR;

  return {
    currentMRR: Math.round(currentMRR),
    projectedMRR: Math.round(projectedMRR),
    growthRate: Math.round(growthRate * 10) / 10,
    churnRate,
    newMRR: Math.round(newMRR),
    expandedMRR: 0, // Future: track upsells
    churnedMRR: Math.round(churnedMRR),
  };
}

/**
 * Get complete revenue dashboard metrics
 */
export async function getDashboardMetrics(userId: string): Promise<DashboardMetrics> {
  const [revenueBySource, topClients, mrrProjection] = await Promise.all([
    getRevenueBySource(userId),
    getTopClients(userId, 5),
    getMRRProjection(userId),
  ]);

  // Calculate totals
  const totalRevenue = revenueBySource.reduce((sum, s) => sum + s.totalRevenue, 0);
  const totalClients = revenueBySource.reduce((sum, s) => sum + s.clients, 0);
  const avgDealSize = totalClients > 0 ? totalRevenue / totalClients : 0;

  // Get this month vs last month revenue
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [thisMonthClients, lastMonthClients] = await Promise.all([
    prisma.himalayaClient.findMany({
      where: { userId, createdAt: { gte: startOfMonth } },
      select: { dealValue: true },
    }),
    prisma.himalayaClient.findMany({
      where: {
        userId,
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      select: { dealValue: true },
    }),
  ]);

  const revenueThisMonth = thisMonthClients.reduce((sum, c) => sum + (c.dealValue || 0), 0);
  const revenueLastMonth = lastMonthClients.reduce((sum, c) => sum + (c.dealValue || 0), 0);
  const growthRate = revenueLastMonth > 0
    ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
    : 0;

  return {
    totalRevenue: Math.round(totalRevenue),
    currentMRR: mrrProjection.currentMRR,
    avgDealSize: Math.round(avgDealSize),
    ltv: Math.round(avgDealSize * 1.5), // Simplified LTV = avg deal * 1.5
    revenueBySource,
    topClients,
    mrrProjection,
    revenueThisMonth: Math.round(revenueThisMonth),
    revenueLastMonth: Math.round(revenueLastMonth),
    growthRate: Math.round(growthRate * 10) / 10,
  };
}

/**
 * Track campaign performance with ad spend ROI
 */
export async function getCampaignROI(userId: string): Promise<Array<{
  campaign: string;
  spend: number;
  revenue: number;
  roi: number;
  clients: number;
}>> {
  // Get clients grouped by campaign/source
  const revenueBySource = await getRevenueBySource(userId);

  // In a real implementation, you'd track ad spend per campaign
  // For now, return revenue data with placeholder ROI calculations
  return revenueBySource.map(source => ({
    campaign: source.source,
    spend: 0, // Future: integrate with ad platforms
    revenue: source.totalRevenue,
    roi: 0, // Future: (revenue - spend) / spend * 100
    clients: source.clients,
  }));
}

/**
 * Get revenue history for the last 6 months
 */
export async function getRevenueHistory(userId: string): Promise<Array<{
  month: string;
  revenue: number;
  clients: number;
}>> {
  const history = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const clients = await prisma.client.findMany({
      where: {
        userId,
        createdAt: {
          gte: monthDate,
          lt: nextMonth,
        },
      },
      select: { dealValue: true },
    });

    const revenue = clients.reduce((sum, c) => sum + (c.dealValue || 0), 0);

    history.push({
      month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      revenue: Math.round(revenue),
      clients: clients.length,
    });
  }

  return history;
}
