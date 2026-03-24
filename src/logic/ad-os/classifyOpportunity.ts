import type { DimensionScores } from "./scoreOpportunityDimensions";

export type OpportunityStatus =
  | "Build Immediately"
  | "Strong Opportunity"
  | "Test Carefully"
  | "Needs Rework"
  | "Reject";

const WEIGHTS = {
  demandPotential: 0.15,
  offerStrength: 0.15,
  emotionalLeverage: 0.15,
  trustCredibility: 0.10,
  conversionReadiness: 0.15,
  adViability: 0.10,
  emailLifecyclePotential: 0.05,
  seoPotential: 0.05,
  differentiation: 0.10,
};

export type ClassifiedOpportunity = {
  status: OpportunityStatus;
  totalScore: number;
};

export function classifyOpportunity(dimensions: DimensionScores): ClassifiedOpportunity {
  const weighted =
    dimensions.demandPotential * WEIGHTS.demandPotential +
    dimensions.offerStrength * WEIGHTS.offerStrength +
    dimensions.emotionalLeverage * WEIGHTS.emotionalLeverage +
    dimensions.trustCredibility * WEIGHTS.trustCredibility +
    dimensions.conversionReadiness * WEIGHTS.conversionReadiness +
    dimensions.adViability * WEIGHTS.adViability +
    dimensions.emailLifecyclePotential * WEIGHTS.emailLifecyclePotential +
    dimensions.seoPotential * WEIGHTS.seoPotential +
    dimensions.differentiation * WEIGHTS.differentiation;

  // Risk penalty: risk score reduces total
  const riskPenalty = dimensions.risk * 0.10;
  const totalScore = Math.max(0, Math.min(100, Math.round(weighted - riskPenalty)));

  const status: OpportunityStatus =
    totalScore >= 85 ? "Build Immediately"
    : totalScore >= 75 ? "Strong Opportunity"
    : totalScore >= 60 ? "Test Carefully"
    : totalScore >= 40 ? "Needs Rework"
    : "Reject";

  return { status, totalScore };
}
