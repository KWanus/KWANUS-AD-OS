import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Tier definitions
// ---------------------------------------------------------------------------

export type HimalayaTier = "free" | "pro" | "business";

export type TierLimits = {
  runsLimit: number;
  deploysLimit: number;
  fullAssets: boolean;
  deployment: boolean;
  executionTracking: boolean;
  outcomeTracking: boolean;
  adaptiveInsights: boolean;
  templates: boolean;
  presets: boolean;
  history: boolean;
  compare: boolean;
  regenerate: boolean;
  edit: boolean;
  export: boolean;
  nicheIntelligence: boolean;
};

const TIER_CONFIG: Record<HimalayaTier, TierLimits> = {
  free: {
    runsLimit: 2,
    deploysLimit: 1,
    fullAssets: false,      // partial assets only
    deployment: false,      // no deploy (or limited)
    executionTracking: false,
    outcomeTracking: false,
    adaptiveInsights: false,
    templates: false,
    presets: false,
    history: true,          // can see history (encourages upgrade)
    compare: false,
    regenerate: false,
    edit: false,
    export: false,
    nicheIntelligence: false, // no competitor scanning
  },
  pro: {
    runsLimit: 50,
    deploysLimit: 20,
    fullAssets: true,
    deployment: true,
    executionTracking: true,
    outcomeTracking: true,
    adaptiveInsights: true,
    templates: true,
    presets: true,
    history: true,
    compare: true,
    regenerate: true,
    edit: true,
    export: true,
    nicheIntelligence: true,
  },
  business: {
    runsLimit: 999,
    deploysLimit: 999,
    fullAssets: true,
    deployment: true,
    executionTracking: true,
    outcomeTracking: true,
    adaptiveInsights: true,
    templates: true,
    presets: true,
    history: true,
    compare: true,
    regenerate: true,
    edit: true,
    export: true,
    nicheIntelligence: true,
  },
};

export function getTierLimits(tier: HimalayaTier): TierLimits {
  return TIER_CONFIG[tier] ?? TIER_CONFIG.free;
}

// ---------------------------------------------------------------------------
// Subscription helpers
// ---------------------------------------------------------------------------

export type UserAccess = {
  tier: HimalayaTier;
  limits: TierLimits;
  usage: {
    runsUsed: number;
    deploysUsed: number;
    executionsUsed: number;
    outcomesLogged: number;
  };
  canRun: boolean;
  canDeploy: boolean;
  runsRemaining: number;
  deploysRemaining: number;
};

export async function getUserAccess(userId: string): Promise<UserAccess> {
  let sub = await prisma.himalayaSubscription.findUnique({
    where: { userId },
  });

  // Auto-create free tier if none exists
  if (!sub) {
    sub = await prisma.himalayaSubscription.create({
      data: { userId, tier: "free", runsLimit: 2, deploysLimit: 1 },
    });
  }

  const tier = sub.tier as HimalayaTier;
  const limits = getTierLimits(tier);

  return {
    tier,
    limits,
    usage: {
      runsUsed: sub.runsUsed,
      deploysUsed: sub.deploysUsed,
      executionsUsed: sub.executionsUsed,
      outcomesLogged: sub.outcomesLogged,
    },
    canRun: sub.runsUsed < sub.runsLimit,
    canDeploy: sub.deploysUsed < sub.deploysLimit,
    runsRemaining: Math.max(0, sub.runsLimit - sub.runsUsed),
    deploysRemaining: Math.max(0, sub.deploysLimit - sub.deploysUsed),
  };
}

export async function incrementUsage(
  userId: string,
  field: "runsUsed" | "deploysUsed" | "executionsUsed" | "outcomesLogged",
): Promise<void> {
  try {
    // Ensure subscription exists
    await prisma.himalayaSubscription.upsert({
      where: { userId },
      create: { userId, tier: "free", [field]: 1 },
      update: { [field]: { increment: 1 } },
    });
  } catch {
    // non-blocking
  }
}

export async function upgradeTier(userId: string, tier: HimalayaTier): Promise<void> {
  const limits = getTierLimits(tier);
  await prisma.himalayaSubscription.upsert({
    where: { userId },
    create: { userId, tier, runsLimit: limits.runsLimit, deploysLimit: limits.deploysLimit },
    update: { tier, runsLimit: limits.runsLimit, deploysLimit: limits.deploysLimit },
  });
}
