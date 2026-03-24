import type { ExtractedSignals } from "./extractSignals";
import type { FetchedPage } from "./fetchPage";

export type DimensionScores = {
  demandPotential: number;
  offerStrength: number;
  emotionalLeverage: number;
  trustCredibility: number;
  conversionReadiness: number;
  adViability: number;
  emailLifecyclePotential: number;
  seoPotential: number;
  differentiation: number;
  risk: number;
};

const SEO_KEYWORDS = [
  "how to", "best", "top", "guide", "tips", "what is",
  "review", "vs", "compare", "alternatives",
];

function clamp(value: number, max: number): number {
  return Math.min(max, Math.max(0, Math.round(value)));
}

export function scoreOpportunityDimensions(
  signals: ExtractedSignals,
  page: FetchedPage
): DimensionScores {
  // Demand Potential (0–100): pain language + benefit language + audience clarity
  const demandPotential = clamp(
    signals.painLanguage.length * 14 +
    signals.benefits.length * 8 +
    (signals.audienceHints.length >= 1 ? 15 : 0),
    100
  );

  // Offer Strength (0–100): price visibility + CTA + offer components + headline clarity
  const offerStrength = clamp(
    (signals.price ? 25 : 0) +
    (signals.ctaText ? 20 : 0) +
    signals.offerComponents.length * 10 +
    (signals.headline.length > 10 ? 15 : 0),
    100
  );

  // Emotional Leverage (0–100): pain depth + benefit depth + desire signals
  const emotionalLeverage = clamp(
    signals.painLanguage.length * 16 +
    signals.benefits.length * 10 +
    (signals.offerComponents.some((o) => ["limited", "exclusive", "free"].includes(o)) ? 10 : 0),
    100
  );

  // Trust & Credibility (0–100): trust signals + reviews + guarantees
  const trustCredibility = clamp(
    signals.trustSignals.length * 20 +
    (signals.trustSignals.some((t) => ["guarantee", "money back", "no risk"].includes(t)) ? 20 : 0),
    100
  );

  // Conversion Readiness (0–100): headline + CTA + subheadline + ctas on page
  const conversionReadiness = clamp(
    (signals.headline ? 20 : 0) +
    (signals.subheadline ? 15 : 0) +
    (signals.ctaText ? 20 : 0) +
    (page.ctas.length >= 2 ? 15 : 0) +
    (signals.benefits.length >= 3 ? 15 : 0) +
    (page.bodyText.length > 800 ? 15 : 5),
    100
  );

  // Ad Viability (0–100): emotional leverage + audience clarity + offer strength
  const adViability = clamp(
    Math.round((emotionalLeverage * 0.4 + offerStrength * 0.3 + (signals.audienceHints.length >= 1 ? 30 : 0))),
    100
  );

  // Email Lifecycle Potential (0–100): offer depth + retention signals
  const emailLifecyclePotential = clamp(
    (signals.offerComponents.length >= 2 ? 30 : signals.offerComponents.length * 10) +
    (signals.benefits.length >= 3 ? 25 : signals.benefits.length * 8) +
    (signals.painLanguage.length >= 2 ? 20 : 0) +
    (page.bodyText.length > 1000 ? 15 : 0),
    100
  );

  // SEO Potential (0–100): informational content, question language, topic breadth
  const seoText = page.bodyText.toLowerCase();
  const seoSignals = SEO_KEYWORDS.filter((k) => seoText.includes(k));
  const seoPotential = clamp(
    seoSignals.length * 15 +
    (page.headings.length >= 4 ? 20 : page.headings.length * 5) +
    (page.bodyText.length > 1500 ? 20 : 0),
    100
  );

  // Differentiation (0–100): unique benefits + non-generic angle
  const genericTerms = ["best", "quality", "great", "amazing", "top"];
  const hasGenericOnly = genericTerms.every((t) => page.bodyText.toLowerCase().includes(t)) &&
    signals.benefits.length < 2;
  const differentiation = clamp(
    signals.benefits.length * 14 +
    signals.trustSignals.length * 8 +
    (hasGenericOnly ? -20 : 10) +
    (signals.offerComponents.length >= 2 ? 15 : 0),
    100
  );

  // Risk (0–100, lower is better — will be subtracted): weak trust + missing audience + thin content
  const risk = clamp(
    (signals.trustSignals.length === 0 ? 30 : 0) +
    (signals.audienceHints.length === 0 ? 20 : 0) +
    (page.bodyText.length < 200 ? 30 : 0) +
    (!signals.headline ? 20 : 0),
    100
  );

  return {
    demandPotential,
    offerStrength,
    emotionalLeverage,
    trustCredibility,
    conversionReadiness,
    adViability,
    emailLifecyclePotential,
    seoPotential,
    differentiation,
    risk,
  };
}
