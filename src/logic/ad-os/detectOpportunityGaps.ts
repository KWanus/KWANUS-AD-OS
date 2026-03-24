import type { DimensionScores } from "./scoreOpportunityDimensions";
import type { ExtractedSignals } from "./extractSignals";

export type GapDetectionResult = {
  topGaps: string[];
  topStrengths: string[];
};

type GapRule = {
  condition: (d: DimensionScores, s: ExtractedSignals) => boolean;
  gap: string;
};

type StrengthRule = {
  condition: (d: DimensionScores, s: ExtractedSignals) => boolean;
  strength: string;
};

const GAP_RULES: GapRule[] = [
  {
    condition: (d) => d.trustCredibility < 40,
    gap: "No trust proof — reviews, guarantees, or social validation are missing",
  },
  {
    condition: (d) => d.emotionalLeverage < 40,
    gap: "Weak emotional connection — offer does not clearly speak to pain or desire",
  },
  {
    condition: (d) => d.conversionReadiness < 50,
    gap: "Poor conversion structure — headline or CTA is unclear or missing",
  },
  {
    condition: (d) => d.differentiation < 40,
    gap: "Low differentiation — offer looks similar to generic competitors",
  },
  {
    condition: (d) => d.demandPotential < 40,
    gap: "Demand signals are weak — problem being solved is not clearly communicated",
  },
  {
    condition: (d) => d.adViability < 40,
    gap: "Low ad viability — product or page is not well-suited for paid traffic",
  },
  {
    condition: (d) => d.offerStrength < 40,
    gap: "Offer framing is weak — price, bonuses, or value stack not clearly visible",
  },
  {
    condition: (_, s) => s.audienceHints.length === 0,
    gap: "Audience is undefined — targeting this would be wasteful without a clear buyer",
  },
  {
    condition: (d) => d.risk > 60,
    gap: "High risk profile — multiple red flags detected (thin content, no trust, unclear offer)",
  },
  {
    condition: (d) => d.emailLifecyclePotential < 35,
    gap: "Retention potential is low — not enough depth for a strong email flow",
  },
];

const STRENGTH_RULES: StrengthRule[] = [
  {
    condition: (d) => d.emotionalLeverage >= 70,
    strength: "Strong emotional problem — high buyer motivation potential",
  },
  {
    condition: (d) => d.demandPotential >= 70,
    strength: "Clear market demand signals present",
  },
  {
    condition: (d) => d.adViability >= 70,
    strength: "Good ad viability — product fits paid traffic well",
  },
  {
    condition: (d) => d.trustCredibility >= 60,
    strength: "Trust signals are solid — lowers cold-traffic friction",
  },
  {
    condition: (d) => d.conversionReadiness >= 70,
    strength: "Page is well-structured for conversion",
  },
  {
    condition: (d) => d.offerStrength >= 65,
    strength: "Strong offer framing — clear value is communicated",
  },
  {
    condition: (d) => d.differentiation >= 65,
    strength: "Differentiated positioning — stands out from generic competitors",
  },
  {
    condition: (_, s) => s.audienceHints.length >= 2,
    strength: "Target audience is clearly defined",
  },
];

export function detectOpportunityGaps(
  dimensions: DimensionScores,
  signals: ExtractedSignals
): GapDetectionResult {
  const topGaps = GAP_RULES
    .filter((r) => r.condition(dimensions, signals))
    .map((r) => r.gap)
    .slice(0, 5);

  const topStrengths = STRENGTH_RULES
    .filter((r) => r.condition(dimensions, signals))
    .map((r) => r.strength)
    .slice(0, 4);

  return {
    topGaps: topGaps.length > 0 ? topGaps : ["No critical gaps detected at current signal level"],
    topStrengths: topStrengths.length > 0 ? topStrengths : ["Insufficient signals to identify clear strengths"],
  };
}
