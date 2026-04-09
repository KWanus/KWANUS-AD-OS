// ---------------------------------------------------------------------------
// Master Orchestrator — THE brain of Himalaya
//
// Input: "I want to make $10k/month"
// Output: Complete business running, optimizing, and scaling toward that goal
//
// This connects every system:
// 1. Goal Engine → picks the strategy
// 2. Decision Engine → picks the business path
// 3. Path Deployer → builds everything specialized
// 4. Prompt Engine → generates all content
// 5. Ad Buying Agent → runs and optimizes ads
// 6. Email Flow Engine → nurtures leads
// 7. Autonomous Optimizer → fixes what's broken
// 8. Wealth Engine → finds compounding opportunities
// 9. Daily Action Queue → tells user what to do
// 10. Weekly Digest → reports progress
//
// The user's only job: set the goal, approve the plan, fund the ad account.
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import { generateGoalPlan, type GoalPlan } from "./goalEngine";
import { getPlaybookForStage } from "@/lib/wealth/scalingPlaybooks";

export type OrchestratorInput = {
  userId: string;
  goal: {
    type: "revenue" | "leads" | "customers" | "freedom";
    target: number;           // $10000, 100 leads, etc.
    timeline: "30days" | "60days" | "90days";
  };
  context: {
    hasExistingBusiness: boolean;
    existingRevenue: number;
    niche?: string;
    skills: string[];
    budget: "micro" | "bootstrap" | "funded";
    timeAvailable: "minimal" | "parttime" | "fulltime";
  };
};

export type OrchestratorPlan = {
  // What the system will do
  selectedPath: string;
  pathReasoning: string;

  // The revenue math
  goalPlan: GoalPlan;

  // What gets deployed
  deploymentPlan: {
    site: boolean;
    emailFlows: number;
    adCampaigns: number;
    chatWidget: boolean;
    bookingPage: boolean;
    paymentLink: boolean;
  };

  // The scaling playbook
  playbook: {
    stage: string;
    name: string;
    duration: string;
    steps: number;
  };

  // What runs automatically after deploy
  automations: {
    adBuyingAgent: boolean;
    emailProcessing: boolean;
    leadFollowup: boolean;
    competitorMonitoring: boolean;
    weeklyDigest: boolean;
    proactiveAlerts: boolean;
  };

  // Human approval needed for
  requiresApproval: string[];

  // Estimated timeline
  estimatedTimeToFirstRevenue: string;
  estimatedTimeToGoal: string;

  // Confidence
  confidence: "high" | "medium" | "low";
  reasoning: string;
};

export async function generateMasterPlan(input: OrchestratorInput): Promise<OrchestratorPlan> {
  const { userId, goal, context } = input;

  // ── 1. Pick the best business path ────────────────────────────────
  let selectedPath = "affiliate";
  let pathReasoning = "";

  if (context.hasExistingBusiness && context.existingRevenue > 0) {
    if (context.niche?.includes("agency") || context.niche?.includes("marketing")) {
      selectedPath = "agency";
      pathReasoning = "You have an existing agency — scale what works with better systems.";
    } else if (context.skills.includes("consulting") || context.skills.includes("coaching")) {
      selectedPath = "consultant";
      pathReasoning = "Your skills are best monetized through consulting/coaching packages.";
    } else {
      selectedPath = "digital_product";
      pathReasoning = "Package your existing expertise into a digital product for passive income.";
    }
  } else {
    // New business — pick based on budget and skills
    if (context.budget === "micro" && context.timeAvailable === "minimal") {
      selectedPath = "affiliate";
      pathReasoning = "Lowest cost, lowest time commitment. Promote existing products → earn commissions.";
    } else if (context.budget === "micro" && context.skills.includes("writing")) {
      selectedPath = "digital_product";
      pathReasoning = "You can write — create an ebook or course with minimal investment.";
    } else if (context.skills.includes("local") || context.niche?.includes("local")) {
      selectedPath = "local";
      pathReasoning = "Local businesses have high lifetime value and lower competition online.";
    } else if (context.budget === "funded") {
      selectedPath = "dropship";
      pathReasoning = "With budget available, dropshipping scales fast with paid ads.";
    } else if (context.skills.includes("marketing") || context.skills.includes("design")) {
      selectedPath = "agency";
      pathReasoning = "Your marketing skills = high-value services for other businesses.";
    } else {
      selectedPath = "consultant";
      pathReasoning = "Consulting has the fastest path to first revenue with minimal startup costs.";
    }
  }

  // ── 2. Generate the revenue plan ──────────────────────────────────
  const currentRevenue = context.existingRevenue;
  const targetRevenue = goal.type === "revenue" ? goal.target :
    goal.type === "customers" ? goal.target * 100 :  // Assume $100 per customer
    goal.type === "leads" ? goal.target * 10 :       // Assume $10 per lead value
    10000;                                            // Default $10k for "freedom"

  // Get current state from DB
  const siteIds = (await prisma.site.findMany({ where: { userId }, select: { id: true, totalViews: true } }));
  const totalViews = siteIds.reduce((s, site) => s + site.totalViews, 0);
  const contacts = await prisma.emailContact.count({ where: { userId } });
  const orders = await prisma.siteOrder.aggregate({
    where: { siteId: { in: siteIds.map(s => s.id) }, status: "paid" },
    _sum: { amountCents: true }, _count: true,
  });
  const orderCount = orders._count ?? 0;
  const totalRev = (orders._sum.amountCents ?? 0) / 100;

  const goalPlan = generateGoalPlan({
    userId,
    targetMonthlyRevenue: targetRevenue,
    timeline: goal.timeline,
    currentState: {
      monthlyRevenue: currentRevenue || totalRev,
      monthlyViews: totalViews,
      conversionRate: totalViews > 0 ? (contacts / totalViews) * 100 : 0,
      avgOrderValue: orderCount > 0 ? totalRev / orderCount : 0,
      adSpend: 0,
      emailListSize: contacts,
    },
  });

  // ── 3. Get the scaling playbook ───────────────────────────────────
  const playbook = getPlaybookForStage(currentRevenue || totalRev, context.niche ?? "business");

  // ── 4. Calculate what gets deployed ───────────────────────────────
  const deploymentPlan = {
    site: true,
    emailFlows: selectedPath === "affiliate" ? 1 : selectedPath === "consultant" ? 2 : 3,
    adCampaigns: 1,
    chatWidget: selectedPath !== "affiliate",
    bookingPage: selectedPath === "consultant" || selectedPath === "local",
    paymentLink: selectedPath !== "affiliate",
  };

  // ── 5. What runs automatically ────────────────────────────────────
  const automations = {
    adBuyingAgent: true,
    emailProcessing: true,
    leadFollowup: true,
    competitorMonitoring: true,
    weeklyDigest: true,
    proactiveAlerts: true,
  };

  // ── 6. What needs human approval ──────────────────────────────────
  const requiresApproval = [
    "Review and publish your site",
    "Fund your ad account (Meta/Google/TikTok)",
    selectedPath === "affiliate" ? "Paste your affiliate link" : null,
    selectedPath === "consultant" ? "Set your availability for bookings" : null,
    selectedPath === "dropship" ? "Confirm supplier and pricing" : null,
    "Approve the first ad creative before launch",
  ].filter(Boolean) as string[];

  // ── 7. Estimate timeline ──────────────────────────────────────────
  const gap = targetRevenue - (currentRevenue || totalRev);
  const estimatedTimeToFirstRevenue = currentRevenue > 0 ? "Already earning" :
    selectedPath === "affiliate" ? "7-14 days" :
    selectedPath === "consultant" ? "3-7 days" :
    selectedPath === "local" ? "7-14 days" :
    "14-30 days";

  const estimatedTimeToGoal = gap <= 0 ? "Already achieved" :
    gap <= 1000 ? "30-60 days" :
    gap <= 5000 ? "60-90 days" :
    gap <= 10000 ? "90-180 days" :
    "6-12 months";

  const confidence: OrchestratorPlan["confidence"] =
    gap <= (currentRevenue || 1000) ? "high" :
    gap <= (currentRevenue || 1000) * 5 ? "medium" : "low";

  const reasoning = `Selected ${selectedPath} path because: ${pathReasoning}\n\n` +
    `Revenue target: $${targetRevenue}/mo. Current: $${(currentRevenue || totalRev).toFixed(0)}/mo. Gap: $${gap.toFixed(0)}.\n\n` +
    `Strategy: ${goalPlan.strategy.approach}\n\n` +
    `The system will deploy your ${selectedPath} business, activate all automations, and begin optimizing from day 1. ` +
    `You'll receive daily action items and weekly performance digests.`;

  return {
    selectedPath,
    pathReasoning,
    goalPlan,
    deploymentPlan,
    playbook: {
      stage: playbook.stage,
      name: playbook.name,
      duration: playbook.duration,
      steps: playbook.steps.length,
    },
    automations,
    requiresApproval,
    estimatedTimeToFirstRevenue,
    estimatedTimeToGoal,
    confidence,
    reasoning,
  };
}
