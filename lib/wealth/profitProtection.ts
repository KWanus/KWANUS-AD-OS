// ---------------------------------------------------------------------------
// Profit Protection System — detect threats before they cost money
// Monitors: competitor moves, market shifts, cost increases,
// churn signals, regulatory changes, seasonal dips
// ---------------------------------------------------------------------------

export type Threat = {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  category: "competitor" | "market" | "cost" | "churn" | "technical" | "compliance";
  title: string;
  description: string;
  estimatedRisk: string;       // Dollar value at risk
  mitigation: string;
  timeframe: string;           // How soon this could impact
  detectedFrom: string;        // What signal triggered this
};

export type ThreatReport = {
  overallRisk: "low" | "moderate" | "elevated" | "high";
  threats: Threat[];
  protectionScore: number;     // 0-100 how protected you are
  recommendations: string[];
};

export function assessThreats(input: {
  monthlyRevenue: number;
  revenueGrowthRate: number;
  customerCount: number;
  churnRate: number;
  competitorCount: number;
  adSpend: number;
  adROAS: number;
  emailOpenRate: number;
  siteConversionRate: number;
  hasRecurringRevenue: boolean;
  hasDiversifiedChannels: boolean;
  hasEmailList: boolean;
  daysInBusiness: number;
}): ThreatReport {
  const threats: Threat[] = [];
  let protectionScore = 60;

  // Revenue concentration risk
  if (!input.hasDiversifiedChannels) {
    threats.push({
      id: "single-channel",
      severity: "high",
      category: "market",
      title: "Single channel dependency",
      description: "All revenue comes from one channel. If that channel changes (algorithm update, policy change, cost increase), revenue drops to zero overnight.",
      estimatedRisk: `$${input.monthlyRevenue.toLocaleString()}/mo at risk`,
      mitigation: "Launch on a second channel immediately. Email list is the safest backup — you own it.",
      timeframe: "Could happen any time",
      detectedFrom: "Channel analysis",
    });
    protectionScore -= 15;
  }

  // No recurring revenue
  if (!input.hasRecurringRevenue && input.monthlyRevenue > 0) {
    threats.push({
      id: "no-recurring",
      severity: "high",
      category: "market",
      title: "No recurring revenue",
      description: "Every month starts at $0. You have to re-earn all revenue from scratch. One bad month = crisis.",
      estimatedRisk: "100% of revenue at risk each month",
      mitigation: "Add a subscription/retainer tier. Even 20% recurring creates stability.",
      timeframe: "Ongoing",
      detectedFrom: "Revenue analysis",
    });
    protectionScore -= 10;
  }

  // Declining growth
  if (input.revenueGrowthRate < -10) {
    threats.push({
      id: "declining-revenue",
      severity: "critical",
      category: "market",
      title: "Revenue declining",
      description: `Revenue dropped ${Math.abs(input.revenueGrowthRate).toFixed(0)}% this month. If this continues, you'll be at $0 in ${Math.ceil(input.monthlyRevenue / (input.monthlyRevenue * Math.abs(input.revenueGrowthRate) / 100))} months.`,
      estimatedRisk: `$${input.monthlyRevenue.toLocaleString()}/mo declining`,
      mitigation: "Diagnose immediately: check ad performance, email metrics, site conversion, and competitor activity.",
      timeframe: "Immediate",
      detectedFrom: "Revenue trend",
    });
    protectionScore -= 20;
  }

  // Ad ROAS declining
  if (input.adROAS > 0 && input.adROAS < 1.5 && input.adSpend > 100) {
    threats.push({
      id: "low-roas",
      severity: "high",
      category: "cost",
      title: "Ad efficiency dropping",
      description: `ROAS is ${input.adROAS.toFixed(1)}x on $${input.adSpend}/mo spend. Below 1.5x, you're barely breaking even.`,
      estimatedRisk: `$${Math.round(input.adSpend * (1 - input.adROAS / 2))}/mo wasted`,
      mitigation: "Refresh ad creatives, test new audiences, kill underperforming variations. Consider organic channels.",
      timeframe: "This month",
      detectedFrom: "Ad metrics",
    });
    protectionScore -= 10;
  }

  // Email engagement dropping
  if (input.emailOpenRate > 0 && input.emailOpenRate < 15) {
    threats.push({
      id: "email-engagement",
      severity: "medium",
      category: "churn",
      title: "Email engagement declining",
      description: `${input.emailOpenRate.toFixed(0)}% open rate. Below 15% means your list is going cold or hitting spam.`,
      estimatedRisk: "Loss of email channel effectiveness",
      mitigation: "Clean your list (remove bounces), rewrite subject lines, re-engage inactive contacts.",
      timeframe: "1-2 months",
      detectedFrom: "Email metrics",
    });
    protectionScore -= 5;
  }

  // No email list
  if (!input.hasEmailList) {
    threats.push({
      id: "no-email-list",
      severity: "high",
      category: "market",
      title: "No owned audience",
      description: "You don't have an email list. This means you rent all your audience from platforms. They can take it away.",
      estimatedRisk: "Entire business depends on external platforms",
      mitigation: "Start building an email list TODAY. It's the only asset you truly own.",
      timeframe: "Strategic risk",
      detectedFrom: "Asset analysis",
    });
    protectionScore -= 15;
  }

  // Too few customers
  if (input.customerCount > 0 && input.customerCount < 10) {
    threats.push({
      id: "customer-concentration",
      severity: "medium",
      category: "churn",
      title: "Customer concentration risk",
      description: `Only ${input.customerCount} customers. Losing 1-2 would significantly impact revenue.`,
      estimatedRisk: `${Math.round(100 / input.customerCount)}% of revenue per customer lost`,
      mitigation: "Focus on acquiring more customers to reduce dependency on any single one.",
      timeframe: "Ongoing",
      detectedFrom: "Customer analysis",
    });
    protectionScore -= 5;
  }

  // Positive signals
  if (input.hasEmailList) protectionScore += 10;
  if (input.hasDiversifiedChannels) protectionScore += 10;
  if (input.hasRecurringRevenue) protectionScore += 10;
  if (input.revenueGrowthRate > 10) protectionScore += 5;
  if (input.daysInBusiness > 365) protectionScore += 5;

  protectionScore = Math.max(0, Math.min(100, protectionScore));

  const overallRisk: ThreatReport["overallRisk"] =
    threats.filter((t) => t.severity === "critical").length > 0 ? "high" :
    threats.filter((t) => t.severity === "high").length >= 2 ? "elevated" :
    threats.length >= 3 ? "moderate" : "low";

  const recommendations = [
    ...threats.slice(0, 3).map((t) => t.mitigation),
    protectionScore < 50 ? "URGENT: Your business has significant vulnerabilities. Address the top threat immediately." : null,
  ].filter(Boolean) as string[];

  return {
    overallRisk,
    threats: threats.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.severity] - order[b.severity];
    }),
    protectionScore,
    recommendations,
  };
}
