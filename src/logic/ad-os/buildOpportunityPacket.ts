import type { DimensionScores } from "./scoreOpportunityDimensions";
import type { ClassifiedOpportunity } from "./classifyOpportunity";
import type { GapDetectionResult } from "./detectOpportunityGaps";
import type { PathRecommendation } from "./recommendOpportunityPath";

export type OpportunityPacket = {
  status: string;
  totalScore: number;
  dimensionScores: DimensionScores;
  topGaps: string[];
  topStrengths: string[];
  recommendedPath: string;
  priorityActions: string[];
  whyCouldWin: string;
  whyCouldFail: string;
};

function buildWhyCouldWin(strengths: string[], dimensions: DimensionScores): string {
  if (strengths.length === 0) return "Insufficient data to determine win conditions.";
  const top = strengths.slice(0, 2).join(" and ").toLowerCase();
  const adNote = dimensions.adViability >= 65 ? " Ad potential is strong." : "";
  return `This opportunity shows ${top}.${adNote}`;
}

function buildWhyCouldFail(gaps: string[], dimensions: DimensionScores): string {
  const firstGap = gaps[0];
  if (!firstGap || firstGap.startsWith("No critical")) {
    return "No major failure patterns detected at current signal level.";
  }
  const riskNote = dimensions.risk > 50 ? " Risk profile is elevated." : "";
  return `Biggest risk: ${firstGap.toLowerCase()}.${riskNote}`;
}

export function buildOpportunityPacket(
  classified: ClassifiedOpportunity,
  dimensions: DimensionScores,
  gaps: GapDetectionResult,
  recommendation: PathRecommendation
): OpportunityPacket {
  return {
    status: classified.status,
    totalScore: classified.totalScore,
    dimensionScores: dimensions,
    topGaps: gaps.topGaps,
    topStrengths: gaps.topStrengths,
    recommendedPath: recommendation.path,
    priorityActions: recommendation.priorityActions,
    whyCouldWin: buildWhyCouldWin(gaps.topStrengths, dimensions),
    whyCouldFail: buildWhyCouldFail(gaps.topGaps, dimensions),
  };
}
