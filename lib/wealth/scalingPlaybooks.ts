// ---------------------------------------------------------------------------
// Scaling Playbooks — proven step-by-step sequences that scale revenue
// Based on business stage, niche, and current metrics
// The system picks the right playbook and executes it
// ---------------------------------------------------------------------------

export type ScalingPlaybook = {
  id: string;
  name: string;
  stage: "0-1k" | "1k-5k" | "5k-10k" | "10k-50k" | "50k+";
  description: string;
  duration: string;
  steps: PlaybookStep[];
  expectedOutcome: string;
  prerequisites: string[];
};

export type PlaybookStep = {
  week: number;
  title: string;
  actions: string[];
  kpi: string;
  automatable: boolean;
  himalayaTool: string;     // Which Himalaya feature handles this
};

export function getPlaybookForStage(monthlyRevenue: number, niche: string): ScalingPlaybook {
  if (monthlyRevenue < 1000) return zeroToOneK(niche);
  if (monthlyRevenue < 5000) return oneKToFiveK(niche);
  if (monthlyRevenue < 10000) return fiveKToTenK(niche);
  if (monthlyRevenue < 50000) return tenKToFiftyK(niche);
  return fiftyKPlus(niche);
}

function zeroToOneK(niche: string): ScalingPlaybook {
  return {
    id: "0-1k",
    name: "Zero to First $1,000",
    stage: "0-1k",
    description: "Your only job is to get your first paying customers. Speed beats perfection.",
    duration: "30 days",
    expectedOutcome: "$500-$1,000/mo revenue with 5-10 customers",
    prerequisites: ["A deployed Himalaya business", "A way to reach your audience"],
    steps: [
      { week: 1, title: "Deploy & validate", actions: ["Run Himalaya with your niche", "Publish your site", "Share with 10 people you know for feedback", "Fix the #1 issue they mention"], kpi: "Site published, 3+ feedback sessions", automatable: true, himalayaTool: "/launch" },
      { week: 2, title: "First traffic", actions: ["Post daily on 1 social platform", "Join 3 communities where your audience hangs out", "Share value (not pitches) — answer questions", "DM 5 people who engage with your content"], kpi: "50+ site visitors, 3+ conversations", automatable: true, himalayaTool: "/content" },
      { week: 3, title: "First sales", actions: ["Launch a $20/day ad campaign", "Email your contacts list about what you built", "Offer a founding-member discount (40% off)", "Follow up with every lead within 1 hour"], kpi: "First 2-3 paying customers", automatable: true, himalayaTool: "/campaigns" },
      { week: 4, title: "Refine & repeat", actions: ["Ask customers for testimonials", "Kill ads that aren't converting", "Double down on what's working", "Set up your email flow to nurture new leads"], kpi: "$500+ in revenue, 5+ customers", automatable: true, himalayaTool: "/emails" },
    ],
  };
}

function oneKToFiveK(niche: string): ScalingPlaybook {
  return {
    id: "1k-5k",
    name: "Scale to $5,000/month",
    stage: "1k-5k",
    description: "You have product-market fit. Now systematize what's working and add fuel.",
    duration: "60 days",
    expectedOutcome: "$5,000/mo revenue with reliable customer acquisition",
    prerequisites: ["$1k+/mo current revenue", "At least 5 customers", "One working acquisition channel"],
    steps: [
      { week: 1, title: "Optimize the winner", actions: ["Identify your best-performing ad/content", "Create 3 variations of it using AI Generate", "Test all 3 — find the new winner", "Increase ad budget 2x on the winner"], kpi: "ROAS improved 20%+", automatable: true, himalayaTool: "/campaigns" },
      { week: 2, title: "Email monetization", actions: ["Set up abandoned cart flow", "Set up post-purchase upsell flow", "Send a weekly broadcast with value + soft CTA", "Clean your list — remove bounces"], kpi: "Email contributing 20%+ of revenue", automatable: true, himalayaTool: "/emails" },
      { week: 3, title: "Second channel", actions: ["If ads work → add organic content", "If organic works → add paid ads", "Generate 7-day content calendar", "Post consistently on second platform"], kpi: "Second channel generating leads", automatable: true, himalayaTool: "/content" },
      { week: 4, title: "Price optimization", actions: ["Test a 20% price increase", "Add a premium tier (3x price)", "Create an offer stack with bonuses", "Add urgency/scarcity to your offer"], kpi: "Average order value increased 15%+", automatable: false, himalayaTool: "/tools/offer-builder" },
      { week: 6, title: "Referral engine", actions: ["Launch customer referral program", "Add referral CTA to post-purchase emails", "Offer 15% commission per referral", "Track referral revenue separately"], kpi: "10%+ of new customers from referrals", automatable: true, himalayaTool: "/api/referrals" },
      { week: 8, title: "Systems check", actions: ["Review all metrics in revenue dashboard", "Run the autonomous optimizer", "Fix top 2 revenue leaks", "Document what's working for consistency"], kpi: "$5k/mo revenue, automated acquisition", automatable: true, himalayaTool: "/revenue" },
    ],
  };
}

function fiveKToTenK(niche: string): ScalingPlaybook {
  return {
    id: "5k-10k",
    name: "Break Through to $10,000/month",
    stage: "5k-10k",
    description: "You have a real business. Now add leverage — systems that multiply without your time.",
    duration: "90 days",
    expectedOutcome: "$10,000/mo with 50%+ automated",
    prerequisites: ["$5k+/mo revenue", "Email list of 500+", "2+ acquisition channels"],
    steps: [
      { week: 1, title: "Launch second business", actions: ["Run Himalaya for an adjacent niche", "Deploy full stack in one click", "Reuse your winning playbook", "Cross-promote between businesses"], kpi: "Second business deployed", automatable: true, himalayaTool: "/launch" },
      { week: 3, title: "LTV maximization", actions: ["Deploy upsell + cross-sell flows", "Create a VIP tier for top customers", "Launch a course or digital product", "Add annual subscription option"], kpi: "LTV increased 30%+", automatable: true, himalayaTool: "/api/wealth/ltv" },
      { week: 5, title: "Audience building", actions: ["Grow email list to 1,000+", "Create a lead magnet (free guide/tool)", "Run a webinar or live training", "Build authority content on YouTube/podcast"], kpi: "1,000+ email subscribers", automatable: false, himalayaTool: "/blog-writer" },
      { week: 8, title: "Automation audit", actions: ["Let the autonomous optimizer run weekly", "Auto-kill underperforming ads", "Auto-scale winning ads", "Auto-send follow-ups to cold leads"], kpi: "50%+ of revenue from automated systems", automatable: true, himalayaTool: "/api/intelligence/optimize" },
      { week: 12, title: "Portfolio review", actions: ["Check portfolio manager across all businesses", "Identify weakest performer — fix or kill", "Shift resources to highest ROI business", "Plan next expansion"], kpi: "$10k/mo combined, growing", automatable: true, himalayaTool: "/api/wealth/portfolio" },
    ],
  };
}

function tenKToFiftyK(niche: string): ScalingPlaybook {
  return {
    id: "10k-50k",
    name: "Scale to $50,000/month",
    stage: "10k-50k",
    description: "Time to build a team, expand markets, and create real defensibility.",
    duration: "6 months",
    expectedOutcome: "$50,000/mo with multiple revenue streams",
    prerequisites: ["$10k+/mo revenue", "Proven product-market fit", "Automated systems in place"],
    steps: [
      { week: 1, title: "Geographic expansion", actions: ["Deploy to 3 new regions/cities", "Localize ads and content", "Set up local tracking per market"], kpi: "3 new markets launched", automatable: true, himalayaTool: "/launch" },
      { week: 4, title: "White-label launch", actions: ["Enable white-label mode", "Package your system for agencies", "Set pricing tiers (Starter/Growth/Scale)", "Onboard first 3 agency clients"], kpi: "3 white-label clients", automatable: true, himalayaTool: "/api/whitelabel" },
      { week: 8, title: "Product suite", actions: ["Launch a course ($497)", "Create a membership ($97/mo)", "Offer consulting ($2,000+/engagement)", "Bundle everything into a $997 package"], kpi: "3+ revenue streams active", automatable: false, himalayaTool: "/tools/offer-builder" },
      { week: 16, title: "Defensibility", actions: ["Build processes that work without you", "Document everything", "Hire or outsource operations", "Focus on strategy, not execution"], kpi: "Business runs 80%+ without you", automatable: false, himalayaTool: "/api/wealth/threats" },
      { week: 24, title: "Exit prep", actions: ["Check exit readiness score", "Fix valuation weaknesses", "Maintain 12 months clean records", "Consider: keep growing or sell?"], kpi: "Exit readiness score 70+", automatable: true, himalayaTool: "/api/wealth/exit" },
    ],
  };
}

function fiftyKPlus(niche: string): ScalingPlaybook {
  return {
    id: "50k+",
    name: "Beyond $50K — Build an Empire",
    stage: "50k+",
    description: "You've won the game. Now build something that lasts and compounds for decades.",
    duration: "Ongoing",
    expectedOutcome: "Multiple income streams, team, and optionality",
    prerequisites: ["$50k+/mo revenue", "Team in place", "Systems automated"],
    steps: [
      { week: 1, title: "Portfolio diversification", actions: ["Launch in 2-3 more niches", "Invest profits into new Himalaya deployments", "Each new business = $5-10k/mo potential", "Diversify across niches to reduce risk"], kpi: "5+ active businesses", automatable: true, himalayaTool: "/api/wealth/portfolio" },
      { week: 4, title: "Acquisition", actions: ["Buy small businesses in your niche", "Apply your Himalaya system to them", "10x their revenue with your proven playbook", "Compound through acquisition"], kpi: "1+ business acquired", automatable: false, himalayaTool: "/api/wealth/opportunities" },
      { week: 12, title: "Legacy building", actions: ["Create content that builds your personal brand", "Build an audience that follows YOU, not just your business", "Write the book, start the podcast, speak on stages", "This makes every future business easier to launch"], kpi: "Personal brand established", automatable: false, himalayaTool: "/content" },
    ],
  };
}
