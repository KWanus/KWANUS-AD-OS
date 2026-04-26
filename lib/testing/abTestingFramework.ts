// ---------------------------------------------------------------------------
// A/B Testing Framework — test ad creatives, copy, and campaign variants
// Statistical significance testing with confidence intervals
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/db";

export type TestStatus = "draft" | "running" | "paused" | "completed" | "cancelled";
export type VariantType = "control" | "variant";

export interface ABTest {
  id: string;
  name: string;
  description?: string;
  status: TestStatus;
  startedAt?: Date;
  endedAt?: Date;
  trafficSplit: number; // 50 = 50/50 split
  minimumSampleSize: number;
  confidenceLevel: number; // 95 = 95% confidence
  primaryMetric: "conversions" | "revenue" | "roas" | "ctr" | "cpc";
  variants: ABTestVariant[];
  winner?: string;
  winnerLift?: number;
  statisticalSignificance?: number;
}

export interface ABTestVariant {
  id: string;
  testId: string;
  name: string;
  type: VariantType;
  campaignId?: string;
  adCreative?: {
    headline?: string;
    description?: string;
    imageUrl?: string;
    ctaText?: string;
  };
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    spend: number;
    ctr: number;
    cvr: number;
    roas: number;
    cpc: number;
  };
}

export interface TestResult {
  testId: string;
  status: TestStatus;
  hasWinner: boolean;
  winner?: {
    variantId: string;
    variantName: string;
    lift: number;
    confidence: number;
  };
  variants: Array<{
    id: string;
    name: string;
    type: VariantType;
    performance: number;
    sampleSize: number;
    isWinner: boolean;
  }>;
  recommendation: string;
  canDeclareWinner: boolean;
  statisticalSignificance: number;
}

/**
 * Create a new A/B test
 */
export async function createABTest(params: {
  userId: string;
  name: string;
  description?: string;
  controlCampaignId: string;
  variantCampaignId: string;
  trafficSplit?: number;
  primaryMetric?: "conversions" | "revenue" | "roas" | "ctr";
  minimumSampleSize?: number;
}): Promise<ABTest> {
  const test = await prisma.aBTest.create({
    data: {
      userId: params.userId,
      name: params.name,
      description: params.description,
      status: "draft",
      trafficSplit: params.trafficSplit || 50,
      primaryMetric: params.primaryMetric || "conversions",
      minimumSampleSize: params.minimumSampleSize || 100,
      confidenceLevel: 95,
      variants: {
        create: [
          {
            name: "Control",
            type: "control",
            campaignId: params.controlCampaignId,
          },
          {
            name: "Variant A",
            type: "variant",
            campaignId: params.variantCampaignId,
          },
        ],
      },
    },
    include: {
      variants: true,
    },
  });

  return test as unknown as ABTest;
}

/**
 * Start an A/B test
 */
export async function startABTest(testId: string): Promise<void> {
  await prisma.aBTest.update({
    where: { id: testId },
    data: {
      status: "running",
      startedAt: new Date(),
    },
  });
}

/**
 * Get test results with statistical analysis
 */
export async function getTestResults(testId: string): Promise<TestResult> {
  const test = await prisma.aBTest.findUnique({
    where: { id: testId },
    include: {
      variants: {
        include: {
          campaign: {
            include: {
              _count: {
                select: { conversions: true, leads: true },
              },
            },
          },
        },
      },
    },
  });

  if (!test) {
    throw new Error("Test not found");
  }

  // Calculate metrics for each variant
  const variantResults = test.variants.map((variant) => {
    const campaign = variant.campaign;
    const impressions = campaign?.impressions || 0;
    const clicks = campaign?.clicks || 0;
    const conversions = campaign?._count.conversions || 0;
    const revenue = campaign?.revenue || 0;
    const spend = campaign?.spend || 0;

    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cvr = clicks > 0 ? (conversions / clicks) * 100 : 0;
    const roas = spend > 0 ? revenue / spend : 0;

    let performance = 0;
    switch (test.primaryMetric) {
      case "conversions":
        performance = conversions;
        break;
      case "revenue":
        performance = revenue;
        break;
      case "roas":
        performance = roas;
        break;
      case "ctr":
        performance = ctr;
        break;
    }

    return {
      id: variant.id,
      name: variant.name,
      type: variant.type as VariantType,
      performance,
      sampleSize: clicks,
      conversions,
      revenue,
      ctr,
      cvr,
      roas,
      isWinner: false,
    };
  });

  // Find control and variant
  const control = variantResults.find((v) => v.type === "control");
  const variants = variantResults.filter((v) => v.type === "variant");

  if (!control || variants.length === 0) {
    return {
      testId: test.id,
      status: test.status as TestStatus,
      hasWinner: false,
      variants: variantResults,
      recommendation: "Test configuration incomplete",
      canDeclareWinner: false,
      statisticalSignificance: 0,
    };
  }

  // Calculate statistical significance
  const bestVariant = variants.reduce((best, current) =>
    current.performance > best.performance ? current : best
  );

  const { significance, canDeclareWinner } = calculateSignificance(
    control.conversions,
    control.sampleSize,
    bestVariant.conversions,
    bestVariant.sampleSize,
    test.confidenceLevel
  );

  const lift = control.performance > 0
    ? ((bestVariant.performance - control.performance) / control.performance) * 100
    : 0;

  // Check minimum sample size
  const hasMinimumSample = control.sampleSize >= test.minimumSampleSize &&
    bestVariant.sampleSize >= test.minimumSampleSize;

  const finalCanDeclareWinner = canDeclareWinner && hasMinimumSample;

  return {
    testId: test.id,
    status: test.status as TestStatus,
    hasWinner: finalCanDeclareWinner,
    winner: finalCanDeclareWinner
      ? {
          variantId: bestVariant.id,
          variantName: bestVariant.name,
          lift,
          confidence: significance,
        }
      : undefined,
    variants: variantResults.map((v) => ({
      ...v,
      isWinner: finalCanDeclareWinner && v.id === bestVariant.id,
    })),
    recommendation: getRecommendation(
      finalCanDeclareWinner,
      lift,
      hasMinimumSample,
      test.minimumSampleSize
    ),
    canDeclareWinner: finalCanDeclareWinner,
    statisticalSignificance: significance,
  };
}

/**
 * Calculate statistical significance using two-proportion z-test
 */
function calculateSignificance(
  controlConversions: number,
  controlSample: number,
  variantConversions: number,
  variantSample: number,
  confidenceLevel: number
): { significance: number; canDeclareWinner: boolean } {
  if (controlSample === 0 || variantSample === 0) {
    return { significance: 0, canDeclareWinner: false };
  }

  const p1 = controlConversions / controlSample;
  const p2 = variantConversions / variantSample;
  const pPool = (controlConversions + variantConversions) / (controlSample + variantSample);

  const se = Math.sqrt(pPool * (1 - pPool) * (1 / controlSample + 1 / variantSample));

  if (se === 0) {
    return { significance: 0, canDeclareWinner: false };
  }

  const zScore = Math.abs((p2 - p1) / se);

  // Convert z-score to confidence level (simplified)
  // z = 1.96 for 95%, z = 2.58 for 99%
  const significance = Math.min(
    99.9,
    50 + 45 * (1 - Math.exp(-zScore / 2))
  );

  const canDeclareWinner = significance >= confidenceLevel;

  return { significance, canDeclareWinner };
}

/**
 * Get recommendation based on test results
 */
function getRecommendation(
  hasWinner: boolean,
  lift: number,
  hasMinimumSample: boolean,
  minimumSampleSize: number
): string {
  if (!hasMinimumSample) {
    return `Continue test. Need ${minimumSampleSize} samples per variant for reliable results.`;
  }

  if (!hasWinner) {
    return "Continue test. No statistically significant difference detected yet.";
  }

  if (lift > 20) {
    return `🎉 Clear winner! ${lift.toFixed(1)}% lift. Roll out winning variant to 100% traffic immediately.`;
  }

  if (lift > 10) {
    return `✅ Winner detected. ${lift.toFixed(1)}% lift. Gradually roll out winning variant.`;
  }

  if (lift > 5) {
    return `⚠️ Marginal improvement (${lift.toFixed(1)}%). Consider cost vs benefit before rolling out.`;
  }

  return "No meaningful difference detected. Keep control or test new variants.";
}

/**
 * Complete test and declare winner
 */
export async function completeABTest(testId: string, winnerId?: string): Promise<void> {
  const results = await getTestResults(testId);

  await prisma.aBTest.update({
    where: { id: testId },
    data: {
      status: "completed",
      endedAt: new Date(),
      winner: winnerId || results.winner?.variantId,
      winnerLift: results.winner?.lift,
      statisticalSignificance: results.statisticalSignificance,
    },
  });
}

/**
 * Get all tests for a user
 */
export async function getUserTests(userId: string): Promise<ABTest[]> {
  const tests = await prisma.aBTest.findMany({
    where: { userId },
    include: {
      variants: {
        include: {
          campaign: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return tests as unknown as ABTest[];
}
