// ---------------------------------------------------------------------------
// Autonomous Goal Engine
// User sets a revenue target. System figures out and executes the plan.
// "I want $10k/mo" → calculates needed traffic, conversion rates, ad spend,
// then builds and deploys everything to hit the target.
//
// This is what makes Himalaya an OPERATING SYSTEM, not a tool.
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";

export type GoalConfig = {
  userId: string;
  targetMonthlyRevenue: number;
  timeline: "30days" | "60days" | "90days";
  currentState: {
    monthlyRevenue: number;
    monthlyViews: number;
    conversionRate: number;
    avgOrderValue: number;
    adSpend: number;
    emailListSize: number;
  };
};

export type GoalPlan = {
  targetRevenue: number;
  gap: number;                    // How much more revenue needed
  strategy: GoalStrategy;
  milestones: GoalMilestone[];
  requiredMetrics: RequiredMetrics;
  weeklyActions: WeeklyAction[];
  confidence: "high" | "medium" | "low";
  reasoning: string;
};

export type GoalStrategy = {
  primaryChannel: "paid_ads" | "organic" | "email" | "outreach";
  secondaryChannel: string;
  approach: string;
};

export type GoalMilestone = {
  week: number;
  target: string;
  metric: string;
  value: number;
};

export type RequiredMetrics = {
  monthlyVisitors: number;
  conversionRate: number;
  avgOrderValue: number;
  requiredAdSpend: number;
  requiredLeads: number;
  requiredCustomers: number;
  emailsToSend: number;
};

export type WeeklyAction = {
  week: number;
  actions: string[];
  automatable: boolean;  // Can Himalaya do this automatically?
};

export function generateGoalPlan(config: GoalConfig): GoalPlan {
  const { targetMonthlyRevenue, currentState, timeline } = config;
  const gap = targetMonthlyRevenue - currentState.monthlyRevenue;
  const weeks = timeline === "30days" ? 4 : timeline === "60days" ? 8 : 12;

  if (gap <= 0) {
    return {
      targetRevenue: targetMonthlyRevenue,
      gap: 0,
      strategy: { primaryChannel: "paid_ads", secondaryChannel: "email", approach: "You're already at target. Focus on scaling." },
      milestones: [],
      requiredMetrics: calculateRequired(0, currentState),
      weeklyActions: [],
      confidence: "high",
      reasoning: "You've already reached your revenue target. Consider setting a higher goal.",
    };
  }

  // Calculate what's needed
  const aov = currentState.avgOrderValue > 0 ? currentState.avgOrderValue : 100;
  const convRate = currentState.conversionRate > 0 ? currentState.conversionRate / 100 : 0.02;
  const requiredCustomers = Math.ceil(gap / aov);
  const requiredLeads = Math.ceil(requiredCustomers / 0.1); // 10% lead-to-customer
  const requiredVisitors = Math.ceil(requiredLeads / convRate);
  const estimatedAdSpend = requiredVisitors * 1.5; // $1.50 CPC average
  const emailsNeeded = requiredLeads * 7; // 7-email sequence

  // Pick strategy based on current state
  let primaryChannel: GoalStrategy["primaryChannel"] = "paid_ads";
  let approach = "";

  if (currentState.emailListSize >= requiredLeads * 2) {
    primaryChannel = "email";
    approach = `You have ${currentState.emailListSize} contacts. Focus on email campaigns to convert existing audience — cheapest path to revenue.`;
  } else if (estimatedAdSpend > targetMonthlyRevenue * 0.5) {
    primaryChannel = "organic";
    approach = `Ad spend would eat >50% of target revenue. Focus on organic content + SEO + social media to build traffic without ad costs.`;
  } else if (gap <= currentState.monthlyRevenue * 0.5) {
    primaryChannel = "email";
    approach = `Small gap to close. Optimize existing funnel: improve conversion rate, upsell existing customers, reactivate cold leads.`;
  } else {
    primaryChannel = "paid_ads";
    approach = `Paid ads are the fastest path. Estimated $${Math.round(estimatedAdSpend)} ad spend to generate ${requiredVisitors} visitors → ${requiredLeads} leads → ${requiredCustomers} customers.`;
  }

  // Generate milestones
  const milestones: GoalMilestone[] = [];
  const weeklyRevGrowth = gap / weeks;

  for (let w = 1; w <= Math.min(weeks, 12); w++) {
    const weekTarget = currentState.monthlyRevenue + (weeklyRevGrowth * w);
    milestones.push({
      week: w,
      target: `$${Math.round(weekTarget).toLocaleString()}/mo run rate`,
      metric: "monthly_revenue",
      value: Math.round(weekTarget),
    });
  }

  // Generate weekly actions
  const weeklyActions: WeeklyAction[] = [
    {
      week: 1,
      actions: [
        "Deploy Himalaya with your niche (creates site, emails, ads)",
        "Publish your site",
        "Set up tracking pixels (Meta, Google, TikTok) in Settings",
        primaryChannel === "paid_ads" ? "Launch first ad campaign with $20/day budget" : "Generate and post 7 days of social content",
      ],
      automatable: true,
    },
    {
      week: 2,
      actions: [
        "Review ad performance — kill losers, scale winners",
        "Check email open rates — rewrite subject lines if below 20%",
        "Follow up with all hot leads",
        "Generate more ad variations using AI Generate tab",
      ],
      automatable: true,
    },
    {
      week: 3,
      actions: [
        "A/B test your headline (use the variant generator)",
        "Send a broadcast to your email list with an offer",
        "Add testimonials to your site (use the review collector)",
        "Increase ad budget 2x on winning variations",
      ],
      automatable: false,
    },
    {
      week: 4,
      actions: [
        "Review: are you on track for the monthly target?",
        "Check revenue leak detector — fix the top leak",
        "Generate a proposal for any hot leads (consultant mode)",
        "Plan next month's content calendar",
      ],
      automatable: true,
    },
  ];

  if (weeks > 4) {
    weeklyActions.push({
      week: 5,
      actions: [
        "Scale winning ads to new audiences",
        "Launch on a second platform (if only on one)",
        "Build a referral program for existing customers",
        "Create a case study from your best customer",
      ],
      automatable: false,
    });
  }

  const confidence: GoalPlan["confidence"] =
    gap <= currentState.monthlyRevenue ? "high" :
    gap <= currentState.monthlyRevenue * 3 ? "medium" : "low";

  const reasoning = confidence === "high"
    ? `This is a ${Math.round((gap / Math.max(currentState.monthlyRevenue, 1)) * 100)}% increase — achievable with focused optimization and consistent execution.`
    : confidence === "medium"
      ? `This requires significant growth. Focus on ${primaryChannel} and execute every week. The plan is realistic but requires discipline.`
      : `This is an ambitious target. It may take longer than ${timeline}. Start with the plan and adjust based on early results.`;

  return {
    targetRevenue: targetMonthlyRevenue,
    gap,
    strategy: { primaryChannel, secondaryChannel: primaryChannel === "email" ? "paid_ads" : "email", approach },
    milestones,
    requiredMetrics: calculateRequired(gap, currentState),
    weeklyActions,
    confidence,
    reasoning,
  };
}

function calculateRequired(gap: number, state: GoalConfig["currentState"]): RequiredMetrics {
  const aov = state.avgOrderValue > 0 ? state.avgOrderValue : 100;
  const convRate = state.conversionRate > 0 ? state.conversionRate / 100 : 0.02;
  const requiredCustomers = Math.ceil(gap / aov);
  const requiredLeads = Math.ceil(requiredCustomers / 0.1);
  const requiredVisitors = Math.ceil(requiredLeads / convRate);

  return {
    monthlyVisitors: requiredVisitors,
    conversionRate: convRate * 100,
    avgOrderValue: aov,
    requiredAdSpend: Math.round(requiredVisitors * 1.5),
    requiredLeads,
    requiredCustomers,
    emailsToSend: requiredLeads * 7,
  };
}
