// ---------------------------------------------------------------------------
// Customer Lifetime Value Maximizer
// Automates: upsell sequences, cross-sell recommendations,
// win-back campaigns, loyalty programs, referral incentives
// Goal: extract maximum revenue from every customer relationship
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import { enrollContact } from "@/lib/integrations/emailFlowEngine";

export type LTVStrategy = {
  currentLTV: number;
  targetLTV: number;
  gap: number;
  strategies: LTVAction[];
  projectedIncrease: number;
};

export type LTVAction = {
  type: "upsell" | "cross_sell" | "retention" | "referral" | "reactivation" | "loyalty";
  title: string;
  description: string;
  estimatedLTVIncrease: number;
  implementation: string;
  automatable: boolean;
  triggerEvent: string;
};

export function generateLTVStrategies(input: {
  avgOrderValue: number;
  repeatPurchaseRate: number;    // % of customers who buy again
  avgPurchaseFrequency: number;  // purchases per year
  customerCount: number;
  churnRate: number;
}): LTVStrategy {
  const currentLTV = input.avgOrderValue * input.avgPurchaseFrequency * (1 / Math.max(input.churnRate / 100, 0.1));
  const targetLTV = currentLTV * 2.5; // Goal: 2.5x LTV
  const strategies: LTVAction[] = [];

  // 1. Post-purchase upsell (immediate)
  strategies.push({
    type: "upsell",
    title: "Post-purchase upsell sequence",
    description: "24 hours after purchase, offer a complementary product or premium upgrade at 20% discount.",
    estimatedLTVIncrease: input.avgOrderValue * 0.25,
    implementation: "Create a post-purchase email flow with upsell offer. Himalaya can auto-deploy this.",
    automatable: true,
    triggerEvent: "purchase.completed",
  });

  // 2. Cross-sell based on purchase history
  strategies.push({
    type: "cross_sell",
    title: "Related product recommendations",
    description: "7 days after purchase, recommend related products based on what they bought.",
    estimatedLTVIncrease: input.avgOrderValue * 0.15,
    implementation: "Add cross-sell email to the post-purchase flow at Day 7.",
    automatable: true,
    triggerEvent: "purchase.completed + 7 days",
  });

  // 3. Loyalty program
  if (input.customerCount >= 10) {
    strategies.push({
      type: "loyalty",
      title: "VIP loyalty tier",
      description: "After 2+ purchases, auto-enroll in VIP tier with early access, exclusive discounts, and priority support.",
      estimatedLTVIncrease: input.avgOrderValue * 0.4,
      implementation: "Create a VIP email flow triggered on 2nd purchase. Add VIP tag to contacts.",
      automatable: true,
      triggerEvent: "2nd purchase",
    });
  }

  // 4. Referral program
  strategies.push({
    type: "referral",
    title: "Customer referral program",
    description: "Offer 15% commission or store credit for each referral. Every customer becomes a salesperson.",
    estimatedLTVIncrease: input.avgOrderValue * 0.3,
    implementation: "Add referral link to thank-you page and post-purchase emails.",
    automatable: true,
    triggerEvent: "purchase.completed",
  });

  // 5. Win-back campaign
  if (input.churnRate > 5) {
    strategies.push({
      type: "reactivation",
      title: "Win-back campaign for churned customers",
      description: `${input.churnRate.toFixed(0)}% churn rate. Send a 're-engagement' sequence to customers inactive for 60+ days.`,
      estimatedLTVIncrease: input.avgOrderValue * 0.2,
      implementation: "Create re-engagement email flow: 'We miss you' + special offer + urgency.",
      automatable: true,
      triggerEvent: "60 days since last activity",
    });
  }

  // 6. Annual subscription conversion
  if (input.avgPurchaseFrequency >= 2) {
    strategies.push({
      type: "retention",
      title: "Convert to annual subscription",
      description: "Offer 2 months free if they commit to annual billing. Locks in revenue + reduces churn.",
      estimatedLTVIncrease: input.avgOrderValue * input.avgPurchaseFrequency * 0.3,
      implementation: "After 3rd purchase, send subscription conversion offer with savings breakdown.",
      automatable: true,
      triggerEvent: "3rd purchase",
    });
  }

  const projectedIncrease = strategies.reduce((s, a) => s + a.estimatedLTVIncrease, 0);

  return {
    currentLTV: Math.round(currentLTV),
    targetLTV: Math.round(targetLTV),
    gap: Math.round(targetLTV - currentLTV),
    strategies,
    projectedIncrease: Math.round(projectedIncrease),
  };
}

/** Auto-deploy LTV strategies as email flows */
export async function deployLTVFlows(userId: string, strategies: LTVAction[]): Promise<{ deployed: number }> {
  let deployed = 0;

  for (const strategy of strategies.filter((s) => s.automatable)) {
    try {
      // Check if flow already exists for this strategy
      const existing = await prisma.emailFlow.findFirst({
        where: { userId, name: { contains: strategy.title.slice(0, 30) } },
      });
      if (existing) continue;

      // Create flow stub — user can customize
      await prisma.emailFlow.create({
        data: {
          userId,
          name: strategy.title,
          trigger: strategy.triggerEvent.split(".")[0] ?? "custom",
          triggerConfig: { source: "ltv_maximizer", type: strategy.type },
          status: "draft",
          nodes: [
            { id: "trigger_0", type: "trigger", data: { label: strategy.triggerEvent }, position: { x: 250, y: 0 } },
            { id: "email_0", type: "email", data: { subject: `${strategy.title} — customize this`, body: strategy.description, label: strategy.title }, position: { x: 250, y: 150 } },
          ],
          edges: [
            { id: "e_0", source: "trigger_0", target: "email_0" },
          ],
        },
      });
      deployed++;
    } catch {
      // Non-blocking
    }
  }

  return { deployed };
}
