import type { ExtractedSignals } from "./extractSignals";
import type { Diagnosis } from "./diagnoseLink";
import type { FetchedPage } from "./fetchPage";

export type ScoreResult = {
  total: number;
  breakdown: {
    clarity: number;
    offerStrength: number;
    emotionalLeverage: number;
    trustSignals: number;
    conversionReadiness: number;
    adViability: number;
    differentiation: number;
  };
  verdict: "Strong Opportunity" | "Testable" | "Weak" | "Reject";
  confidence: "High" | "Medium" | "Low";
};

export function scoreOpportunity(
  signals: ExtractedSignals,
  diagnosis: Diagnosis,
  page: FetchedPage
): ScoreResult {
  // Clarity (0–15): headline + meta + readable page
  const clarity = Math.min(
    15,
    (signals.headline ? 6 : 0) +
    (signals.subheadline ? 4 : 0) +
    (page.bodyText.length > 500 ? 5 : 2)
  );

  // Offer Strength (0–15): price + CTA + offer components
  const offerStrength = Math.min(
    15,
    (signals.price ? 5 : 0) +
    (signals.ctaText ? 4 : 0) +
    (signals.offerComponents.length >= 2 ? 6 : signals.offerComponents.length * 2)
  );

  // Emotional Leverage (0–15): pain + benefits
  const emotionalLeverage = Math.min(
    15,
    signals.painLanguage.length * 3 + signals.benefits.length * 2
  );

  // Trust Signals (0–15): reviews, guarantees, social proof
  const trustSignals = Math.min(15, signals.trustSignals.length * 4);

  // Conversion Readiness (0–15): CTA + flow clarity
  const conversionReadiness = Math.min(
    15,
    (signals.ctaText ? 5 : 0) +
    (diagnosis.strengths.length >= 3 ? 6 : diagnosis.strengths.length * 2) +
    (page.ctas.length >= 2 ? 4 : 0)
  );

  // Ad Viability (0–10): audience + angle clarity
  const adViability = Math.min(
    10,
    (signals.audienceHints.length >= 1 ? 4 : 0) +
    (!diagnosis.currentAngle.includes("Unclear") ? 6 : 2)
  );

  // Differentiation (0–10): unique language, strong benefits, clear angle
  const differentiation = Math.min(
    10,
    (signals.benefits.length >= 4 ? 5 : signals.benefits.length) +
    (signals.trustSignals.length >= 2 ? 5 : signals.trustSignals.length * 2)
  );

  // Risk penalty (0–5)
  const riskPenalty = diagnosis.weaknesses.length >= 4 ? 5 : diagnosis.weaknesses.length;

  const total = Math.max(
    0,
    clarity + offerStrength + emotionalLeverage + trustSignals +
    conversionReadiness + adViability + differentiation - riskPenalty
  );

  const verdict =
    total >= 80 ? "Strong Opportunity"
    : total >= 60 ? "Testable"
    : total >= 40 ? "Weak"
    : "Reject";

  // Confidence based on how much data we extracted
  const signalCount =
    (signals.headline ? 1 : 0) +
    (signals.price ? 1 : 0) +
    (signals.benefits.length > 0 ? 1 : 0) +
    (signals.trustSignals.length > 0 ? 1 : 0) +
    (signals.painLanguage.length > 0 ? 1 : 0);

  const confidence =
    signalCount >= 4 ? "High"
    : signalCount >= 2 ? "Medium"
    : "Low";

  return {
    total,
    breakdown: {
      clarity,
      offerStrength,
      emotionalLeverage,
      trustSignals,
      conversionReadiness,
      adViability,
      differentiation,
    },
    verdict,
    confidence,
  };
}
