// ---------------------------------------------------------------------------
// Predictive ROAS Models — ML-powered campaign optimization predictions
// Uses historical data to predict future ROAS and recommend budget allocation
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/db";

export interface ROASPrediction {
  campaignId: string;
  campaignName: string;
  platform: string;
  currentROAS: number;
  predictedROAS: number;
  confidence: "high" | "medium" | "low";
  recommendation: "scale_up" | "maintain" | "scale_down" | "pause";
  suggestedBudgetChange: number;
  reasoning: string;
}

export interface PredictiveInsights {
  predictions: ROASPrediction[];
  overallROASForecast: number;
  budgetOptimizationScore: number; // 0-100
  recommendations: Array<{
    type: "opportunity" | "warning" | "optimization";
    message: string;
    impact: "high" | "medium" | "low";
  }>;
}

/**
 * Generate predictive ROAS insights for all active campaigns
 */
export async function generatePredictiveInsights(userId: string): Promise<PredictiveInsights> {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: {
        userId,
        status: "active",
      },
      include: {
        _count: {
          select: { leads: true, conversions: true },
        },
      },
      orderBy: { spend: "desc" },
    });

    const predictions: ROASPrediction[] = [];

    for (const campaign of campaigns) {
      const prediction = await predictCampaignROAS(campaign.id);
      if (prediction) {
        predictions.push(prediction);
      }
    }

    // Calculate overall forecast
    const totalPredictedRevenue = predictions.reduce((sum, p) => {
      const currentSpend = campaigns.find((c) => c.id === p.campaignId)?.spend || 0;
      return sum + currentSpend * p.predictedROAS;
    }, 0);

    const totalSpend = campaigns.reduce((sum, c) => sum + (c.spend || 0), 0);
    const overallROASForecast = totalSpend > 0 ? totalPredictedRevenue / totalSpend : 0;

    // Calculate optimization score
    const budgetOptimizationScore = calculateOptimizationScore(predictions);

    // Generate recommendations
    const recommendations = generateRecommendations(predictions);

    return {
      predictions,
      overallROASForecast,
      budgetOptimizationScore,
      recommendations,
    };
  } catch (err) {
    console.error("[Predictive ROAS] Error generating insights:", err);
    return {
      predictions: [],
      overallROASForecast: 0,
      budgetOptimizationScore: 0,
      recommendations: [],
    };
  }
}

/**
 * Predict ROAS for a single campaign using historical data
 */
export async function predictCampaignROAS(campaignId: string): Promise<ROASPrediction | null> {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        conversions: {
          orderBy: { createdAt: "desc" },
          take: 30,
        },
        leads: {
          orderBy: { createdAt: "desc" },
          take: 100,
        },
      },
    });

    if (!campaign) return null;

    const currentROAS = campaign.spend && campaign.spend > 0
      ? (campaign.revenue || 0) / campaign.spend
      : 0;

    // Simple moving average prediction (can be enhanced with actual ML)
    const recentConversions = campaign.conversions.slice(0, 10);
    const historicalConversions = campaign.conversions.slice(10, 30);

    const recentAvgValue = recentConversions.length > 0
      ? recentConversions.reduce((sum, c) => sum + (c.value || 0), 0) / recentConversions.length
      : 0;

    const historicalAvgValue = historicalConversions.length > 0
      ? historicalConversions.reduce((sum, c) => sum + (c.value || 0), 0) / historicalConversions.length
      : recentAvgValue;

    // Predict future ROAS based on trend
    const trendMultiplier = historicalAvgValue > 0
      ? recentAvgValue / historicalAvgValue
      : 1;

    const predictedROAS = currentROAS * trendMultiplier;

    // Determine confidence based on data volume
    const dataPoints = campaign.conversions.length + campaign.leads.length;
    const confidence: "high" | "medium" | "low" = dataPoints > 50
      ? "high"
      : dataPoints > 20
      ? "medium"
      : "low";

    // Generate recommendation
    const { recommendation, suggestedBudgetChange, reasoning } = generateRecommendation(
      currentROAS,
      predictedROAS,
      confidence
    );

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      platform: campaign.platform || "unknown",
      currentROAS,
      predictedROAS,
      confidence,
      recommendation,
      suggestedBudgetChange,
      reasoning,
    };
  } catch (err) {
    console.error("[Predictive ROAS] Error predicting campaign ROAS:", err);
    return null;
  }
}

/**
 * Generate actionable recommendation based on ROAS prediction
 */
function generateRecommendation(
  currentROAS: number,
  predictedROAS: number,
  confidence: "high" | "medium" | "low"
): {
  recommendation: "scale_up" | "maintain" | "scale_down" | "pause";
  suggestedBudgetChange: number;
  reasoning: string;
} {
  const roasThreshold = 2.0; // Minimum acceptable ROAS
  const growthThreshold = 1.2; // 20% growth

  if (predictedROAS >= roasThreshold * growthThreshold && confidence === "high") {
    return {
      recommendation: "scale_up",
      suggestedBudgetChange: 50, // +50%
      reasoning: `Predicted ROAS of ${predictedROAS.toFixed(2)}x with high confidence suggests strong scaling opportunity`,
    };
  }

  if (predictedROAS >= roasThreshold && confidence !== "low") {
    return {
      recommendation: "maintain",
      suggestedBudgetChange: 0,
      reasoning: `Campaign performing well at ${predictedROAS.toFixed(2)}x predicted ROAS. Maintain current spend.`,
    };
  }

  if (predictedROAS >= roasThreshold * 0.8) {
    return {
      recommendation: "scale_down",
      suggestedBudgetChange: -25, // -25%
      reasoning: `Predicted ROAS of ${predictedROAS.toFixed(2)}x is below target. Reduce budget and optimize.`,
    };
  }

  return {
    recommendation: "pause",
    suggestedBudgetChange: -100, // Pause
    reasoning: `Predicted ROAS of ${predictedROAS.toFixed(2)}x is too low. Pause and optimize campaign before scaling.`,
  };
}

/**
 * Calculate budget optimization score (0-100)
 */
function calculateOptimizationScore(predictions: ROASPrediction[]): number {
  if (predictions.length === 0) return 0;

  // Score based on how well budget is allocated to high-ROAS campaigns
  const totalPredictions = predictions.length;
  const wellAllocated = predictions.filter((p) => {
    if (p.recommendation === "scale_up" && p.predictedROAS > 3) return true;
    if (p.recommendation === "maintain" && p.predictedROAS > 2) return true;
    return false;
  }).length;

  const poorlyAllocated = predictions.filter((p) => p.recommendation === "pause").length;

  const baseScore = (wellAllocated / totalPredictions) * 100;
  const penalty = (poorlyAllocated / totalPredictions) * 30;

  return Math.max(0, Math.min(100, baseScore - penalty));
}

/**
 * Generate high-level recommendations
 */
function generateRecommendations(
  predictions: ROASPrediction[]
): Array<{
  type: "opportunity" | "warning" | "optimization";
  message: string;
  impact: "high" | "medium" | "low";
}> {
  const recommendations: Array<{
    type: "opportunity" | "warning" | "optimization";
    message: string;
    impact: "high" | "medium" | "low";
  }> = [];

  // Find opportunities
  const scaleUpCampaigns = predictions.filter((p) => p.recommendation === "scale_up");
  if (scaleUpCampaigns.length > 0) {
    recommendations.push({
      type: "opportunity",
      message: `${scaleUpCampaigns.length} campaign(s) showing strong ROAS potential. Consider increasing budget by 50%.`,
      impact: "high",
    });
  }

  // Find warnings
  const pauseCampaigns = predictions.filter((p) => p.recommendation === "pause");
  if (pauseCampaigns.length > 0) {
    recommendations.push({
      type: "warning",
      message: `${pauseCampaigns.length} campaign(s) predicted to underperform. Pause and optimize before continuing.`,
      impact: "high",
    });
  }

  // Optimization suggestions
  const lowConfidenceCampaigns = predictions.filter((p) => p.confidence === "low");
  if (lowConfidenceCampaigns.length > 0) {
    recommendations.push({
      type: "optimization",
      message: `${lowConfidenceCampaigns.length} campaign(s) need more data for accurate predictions. Run for at least 2 more weeks.`,
      impact: "medium",
    });
  }

  // Platform diversification
  const platforms = new Set(predictions.map((p) => p.platform));
  if (platforms.size === 1) {
    recommendations.push({
      type: "optimization",
      message: "Consider diversifying to multiple ad platforms to reduce risk and find new audiences.",
      impact: "medium",
    });
  }

  return recommendations;
}

/**
 * Get optimal budget allocation across campaigns
 */
export async function getOptimalBudgetAllocation(
  userId: string,
  totalBudget: number
): Promise<Array<{
  campaignId: string;
  campaignName: string;
  currentBudget: number;
  recommendedBudget: number;
  expectedROAS: number;
  expectedRevenue: number;
}>> {
  try {
    const insights = await generatePredictiveInsights(userId);

    // Sort campaigns by predicted ROAS
    const sortedPredictions = insights.predictions
      .filter((p) => p.recommendation !== "pause")
      .sort((a, b) => b.predictedROAS - a.predictedROAS);

    // Allocate budget proportionally to predicted ROAS
    const totalWeight = sortedPredictions.reduce((sum, p) => sum + p.predictedROAS, 0);

    const campaigns = await prisma.campaign.findMany({
      where: {
        userId,
        id: { in: sortedPredictions.map((p) => p.campaignId) },
      },
    });

    return sortedPredictions.map((pred) => {
      const campaign = campaigns.find((c) => c.id === pred.campaignId);
      const weight = pred.predictedROAS / totalWeight;
      const recommendedBudget = totalBudget * weight;
      const expectedRevenue = recommendedBudget * pred.predictedROAS;

      return {
        campaignId: pred.campaignId,
        campaignName: pred.campaignName,
        currentBudget: campaign?.spend || 0,
        recommendedBudget,
        expectedROAS: pred.predictedROAS,
        expectedRevenue,
      };
    });
  } catch (err) {
    console.error("[Predictive ROAS] Error calculating optimal allocation:", err);
    return [];
  }
}
