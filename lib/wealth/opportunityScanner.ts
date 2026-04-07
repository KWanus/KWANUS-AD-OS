// ---------------------------------------------------------------------------
// Market Opportunity Scanner — finds new revenue streams automatically
// Analyzes: current niche performance, adjacent markets, trending topics,
// underserved segments, and seasonal opportunities
// ---------------------------------------------------------------------------

export type OpportunityScan = {
  currentNiche: string;
  opportunities: MarketOpportunity[];
  seasonalAlerts: SeasonalAlert[];
  nicheExpansions: NicheExpansion[];
};

export type MarketOpportunity = {
  id: string;
  type: "adjacent_market" | "underserved_segment" | "product_expansion" | "channel_expansion" | "geographic_expansion";
  title: string;
  description: string;
  estimatedRevenue: string;
  effort: "low" | "medium" | "high";
  timeToRevenue: string;
  confidence: "high" | "medium" | "low";
  action: string;
};

export type SeasonalAlert = {
  event: string;
  timing: string;
  relevance: string;
  suggestedAction: string;
};

export type NicheExpansion = {
  fromNiche: string;
  toNiche: string;
  overlap: number;      // % audience overlap
  reasoning: string;
  estimatedAdditionalRevenue: string;
};

/** Scan for opportunities based on business data */
export function scanOpportunities(input: {
  niche: string;
  audience: string;
  monthlyRevenue: number;
  topProducts: string[];
  currentChannels: string[];
}): OpportunityScan {
  const opportunities: MarketOpportunity[] = [];

  // 1. Product expansion
  if (input.topProducts.length > 0) {
    opportunities.push({
      id: "product-upsell",
      type: "product_expansion",
      title: "Create a premium tier",
      description: `Your best product performs well. Create a 3x priced premium version with VIP access, faster delivery, or personal support.`,
      estimatedRevenue: `$${Math.round(input.monthlyRevenue * 0.3)}-${Math.round(input.monthlyRevenue * 0.5)}/mo`,
      effort: "medium",
      timeToRevenue: "2-4 weeks",
      confidence: "high",
      action: "Use the Offer Builder to create a premium stack, then deploy with Himalaya",
    });
  }

  // 2. Course/digital product
  opportunities.push({
    id: "course-launch",
    type: "product_expansion",
    title: `Create a course: "How to ${input.niche}"`,
    description: "Package your expertise into a $97-$497 course. Your email list is the built-in audience.",
    estimatedRevenue: "$1k-$5k per launch",
    effort: "high",
    timeToRevenue: "4-8 weeks",
    confidence: "medium",
    action: "Use the Course Outline Builder to create curriculum, then use the Course Hosting system to deliver",
  });

  // 3. Channel expansion
  const allChannels = ["paid_ads", "organic_social", "email", "seo", "outreach", "partnerships"];
  const unusedChannels = allChannels.filter((c) => !input.currentChannels.includes(c));
  if (unusedChannels.length > 0) {
    opportunities.push({
      id: "new-channel",
      type: "channel_expansion",
      title: `Expand to ${unusedChannels[0].replace(/_/g, " ")}`,
      description: `You're not using ${unusedChannels[0].replace(/_/g, " ")} yet. Each new channel typically adds 30-60% more revenue.`,
      estimatedRevenue: `$${Math.round(input.monthlyRevenue * 0.3)}-${Math.round(input.monthlyRevenue * 0.6)}/mo`,
      effort: "medium",
      timeToRevenue: "2-4 weeks",
      confidence: "medium",
      action: `Deploy a ${unusedChannels[0].replace(/_/g, " ")} campaign using the AI Generate tab`,
    });
  }

  // 4. Geographic expansion
  opportunities.push({
    id: "geo-expand",
    type: "geographic_expansion",
    title: "Expand to a new market/region",
    description: `If you're serving one area, replicate your model in adjacent markets. Same system, new audience.`,
    estimatedRevenue: `$${Math.round(input.monthlyRevenue * 0.5)}-${Math.round(input.monthlyRevenue * 1)}/mo`,
    effort: "medium",
    timeToRevenue: "4-8 weeks",
    confidence: "medium",
    action: "Run Himalaya with your niche + new location to deploy a new site and campaign",
  });

  // 5. Referral/affiliate program
  opportunities.push({
    id: "referral-program",
    type: "channel_expansion",
    title: "Launch a customer referral program",
    description: "Turn every customer into a salesperson. Offer 10-20% commission or credit for referrals.",
    estimatedRevenue: `$${Math.round(input.monthlyRevenue * 0.15)}-${Math.round(input.monthlyRevenue * 0.3)}/mo`,
    effort: "low",
    timeToRevenue: "1-2 weeks",
    confidence: "high",
    action: "Set up referral links via the Referral Engine, add referral CTA to post-purchase emails",
  });

  // Seasonal alerts
  const month = new Date().getMonth();
  const seasonalAlerts: SeasonalAlert[] = [];

  if (month >= 9 && month <= 11) {
    seasonalAlerts.push({
      event: "Holiday Season (Q4)",
      timing: "Now — November/December",
      relevance: "Consumer spending peaks. E-commerce sees 20-30% more revenue.",
      suggestedAction: "Launch a holiday campaign, create limited-time offers, increase ad budget 50%",
    });
  }
  if (month === 0) {
    seasonalAlerts.push({
      event: "New Year / Fresh Start",
      timing: "January",
      relevance: "People set goals, invest in self-improvement, start businesses.",
      suggestedAction: "Launch 'New Year' campaigns, offer fresh-start bundles, target resolution-setters",
    });
  }
  if (month >= 3 && month <= 4) {
    seasonalAlerts.push({
      event: "Spring Launch Season",
      timing: "April-May",
      relevance: "New business launches peak. People emerge from winter ready to invest.",
      suggestedAction: "Create spring-themed campaigns, offer launch packages, increase content output",
    });
  }

  // Niche expansions
  const nicheExpansions: NicheExpansion[] = [
    {
      fromNiche: input.niche,
      toNiche: `${input.niche} + consulting`,
      overlap: 70,
      reasoning: "Offer consulting/coaching alongside your product. Same audience, higher ticket.",
      estimatedAdditionalRevenue: `$${Math.round(input.monthlyRevenue * 0.5)}/mo`,
    },
    {
      fromNiche: input.niche,
      toNiche: `${input.niche} for enterprises`,
      overlap: 30,
      reasoning: "Enterprise version of what you sell to individuals. 10x price, longer sales cycle.",
      estimatedAdditionalRevenue: `$${Math.round(input.monthlyRevenue * 2)}/mo potential`,
    },
  ];

  // Sort by confidence then estimated revenue
  opportunities.sort((a, b) => {
    const confOrder = { high: 0, medium: 1, low: 2 };
    return confOrder[a.confidence] - confOrder[b.confidence];
  });

  return {
    currentNiche: input.niche,
    opportunities,
    seasonalAlerts,
    nicheExpansions,
  };
}
