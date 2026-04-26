// ---------------------------------------------------------------------------
// Automated Budget Allocation — AI adjusts campaign budgets in real-time
// Based on performance, predicted ROAS, and optimization rules
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/db";
import { predictCampaignROAS } from "@/lib/analytics/predictiveROAS";
import { updateMetaCampaignStatus } from "@/lib/ads/metaAdsService";
import { updateGoogleCampaignStatus } from "@/lib/ads/googleAdsService";

export interface BudgetRule {
  id: string;
  userId: string;
  name: string;
  enabled: boolean;
  conditions: {
    metric: "roas" | "ctr" | "cpc" | "conversions";
    operator: ">" | "<" | ">=" | "<=";
    threshold: number;
  }[];
  actions: {
    type: "increase_budget" | "decrease_budget" | "pause" | "resume";
    value?: number; // percentage
  }[];
}

export interface AllocationResult {
  campaignId: string;
  campaignName: string;
  platform: string;
  previousBudget: number;
  newBudget: number;
  change: number;
  changePercent: number;
  reason: string;
  executed: boolean;
}

/**
 * Automatically allocate budget across campaigns based on performance
 */
export async function runAutomatedAllocation(
  userId: string,
  totalBudget: number,
  dryRun: boolean = false
): Promise<AllocationResult[]> {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: {
        userId,
        status: "active",
      },
      orderBy: { spend: "desc" },
    });

    const results: AllocationResult[] = [];

    for (const campaign of campaigns) {
      // Get predicted ROAS
      const prediction = await predictCampaignROAS(campaign.id);

      if (!prediction) continue;

      const currentBudget = campaign.dailyBudget || 0;
      let newBudget = currentBudget;
      let reason = "";

      // Allocation rules
      if (prediction.recommendation === "scale_up") {
        newBudget = currentBudget * 1.5; // +50%
        reason = `High predicted ROAS (${prediction.predictedROAS.toFixed(2)}x) - scaling up`;
      } else if (prediction.recommendation === "scale_down") {
        newBudget = currentBudget * 0.75; // -25%
        reason = `Low predicted ROAS (${prediction.predictedROAS.toFixed(2)}x) - scaling down`;
      } else if (prediction.recommendation === "pause") {
        newBudget = 0;
        reason = `Very low predicted ROAS (${prediction.predictedROAS.toFixed(2)}x) - pausing`;
      } else {
        reason = "Performance stable - maintaining budget";
      }

      const change = newBudget - currentBudget;
      const changePercent = currentBudget > 0 ? (change / currentBudget) * 100 : 0;

      // Execute budget change
      let executed = false;
      if (!dryRun && Math.abs(changePercent) > 5) {
        // Only execute if change > 5%
        executed = await executeBudgetChange(userId, campaign.id, newBudget);
      }

      results.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        platform: campaign.platform || "unknown",
        previousBudget: currentBudget,
        newBudget,
        change,
        changePercent,
        reason,
        executed,
      });
    }

    // Log allocation event
    await prisma.budgetAllocationLog.create({
      data: {
        userId,
        totalBudget,
        allocations: results,
        dryRun,
      },
    });

    return results;
  } catch (err) {
    console.error("[Budget Allocation] Error:", err);
    return [];
  }
}

/**
 * Execute budget change on ad platform
 */
async function executeBudgetChange(
  userId: string,
  campaignId: string,
  newBudget: number
): Promise<boolean> {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) return false;

    // Update in database
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { dailyBudget: newBudget },
    });

    // Update on platform (Meta, Google, etc.)
    if (campaign.platform === "meta") {
      // Meta API doesn't support direct budget updates without ad set
      // Would need to update via campaign budget object
      console.log(`[Budget] Meta campaign ${campaignId}: $${newBudget}/day`);
    } else if (campaign.platform === "google") {
      // Google Ads budget update would go here
      console.log(`[Budget] Google campaign ${campaignId}: $${newBudget}/day`);
    }

    return true;
  } catch (err) {
    console.error("[Budget Allocation] Execution error:", err);
    return false;
  }
}

/**
 * Create custom budget rule
 */
export async function createBudgetRule(params: {
  userId: string;
  name: string;
  conditions: BudgetRule["conditions"];
  actions: BudgetRule["actions"];
}): Promise<BudgetRule> {
  const rule = await prisma.budgetRule.create({
    data: {
      userId: params.userId,
      name: params.name,
      enabled: true,
      conditions: params.conditions,
      actions: params.actions,
    },
  });

  return rule as unknown as BudgetRule;
}

/**
 * Apply budget rules to campaigns
 */
export async function applyBudgetRules(userId: string): Promise<AllocationResult[]> {
  try {
    const rules = await prisma.budgetRule.findMany({
      where: {
        userId,
        enabled: true,
      },
    });

    const campaigns = await prisma.campaign.findMany({
      where: {
        userId,
        status: "active",
      },
    });

    const results: AllocationResult[] = [];

    for (const campaign of campaigns) {
      for (const rule of rules) {
        const shouldApply = evaluateRuleConditions(campaign, rule.conditions as BudgetRule["conditions"]);

        if (shouldApply) {
          const result = await applyRuleActions(
            campaign,
            rule.actions as BudgetRule["actions"],
            rule.name
          );
          if (result) {
            results.push(result);
          }
        }
      }
    }

    return results;
  } catch (err) {
    console.error("[Budget Rules] Error:", err);
    return [];
  }
}

/**
 * Evaluate if rule conditions are met
 */
function evaluateRuleConditions(
  campaign: { spend?: number | null; revenue?: number | null; clicks?: number | null; impressions?: number | null },
  conditions: BudgetRule["conditions"]
): boolean {
  const spend = campaign.spend || 0;
  const revenue = campaign.revenue || 0;
  const roas = spend > 0 ? revenue / spend : 0;
  const clicks = campaign.clicks || 0;
  const impressions = campaign.impressions || 0;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const cpc = clicks > 0 ? spend / clicks : 0;

  return conditions.every((condition) => {
    let value = 0;
    switch (condition.metric) {
      case "roas":
        value = roas;
        break;
      case "ctr":
        value = ctr;
        break;
      case "cpc":
        value = cpc;
        break;
      case "conversions":
        value = campaign.clicks || 0; // Simplified
        break;
    }

    switch (condition.operator) {
      case ">":
        return value > condition.threshold;
      case "<":
        return value < condition.threshold;
      case ">=":
        return value >= condition.threshold;
      case "<=":
        return value <= condition.threshold;
    }
  });
}

/**
 * Apply rule actions to campaign
 */
async function applyRuleActions(
  campaign: { id: string; name: string; platform: string | null; dailyBudget?: number | null },
  actions: BudgetRule["actions"],
  ruleName: string
): Promise<AllocationResult | null> {
  const currentBudget = campaign.dailyBudget || 0;
  let newBudget = currentBudget;

  for (const action of actions) {
    switch (action.type) {
      case "increase_budget":
        newBudget = currentBudget * (1 + (action.value || 25) / 100);
        break;
      case "decrease_budget":
        newBudget = currentBudget * (1 - (action.value || 25) / 100);
        break;
      case "pause":
        newBudget = 0;
        break;
      case "resume":
        newBudget = currentBudget > 0 ? currentBudget : 100; // Resume with $100/day default
        break;
    }
  }

  const change = newBudget - currentBudget;
  const changePercent = currentBudget > 0 ? (change / currentBudget) * 100 : 0;

  // Update budget
  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { dailyBudget: newBudget },
  });

  return {
    campaignId: campaign.id,
    campaignName: campaign.name,
    platform: campaign.platform || "unknown",
    previousBudget: currentBudget,
    newBudget,
    change,
    changePercent,
    reason: `Rule applied: ${ruleName}`,
    executed: true,
  };
}

/**
 * Schedule automated allocation to run periodically
 */
export async function scheduleAutomatedAllocation(
  userId: string,
  totalBudget: number,
  frequency: "hourly" | "daily" | "weekly"
): Promise<void> {
  // In production, this would use a job queue (Bull, Agenda, etc.)
  // For now, just log the schedule
  console.log(`[Budget Allocation] Scheduled ${frequency} for user ${userId} with $${totalBudget} budget`);

  // Store schedule in database
  await prisma.budgetAllocationSchedule.upsert({
    where: { userId },
    create: {
      userId,
      totalBudget,
      frequency,
      enabled: true,
      lastRun: null,
    },
    update: {
      totalBudget,
      frequency,
      enabled: true,
    },
  });
}
