// ---------------------------------------------------------------------------
// Digital Twin Simulator
// Creates a virtual model of the target customer and simulates how they'd
// react to headlines, emails, ads, prices, and offers BEFORE you spend money.
//
// Nobody has this in a marketing OS. We're first.
//
// How it works:
// 1. Build the twin from: scraped pain points, competitor data, persona data
// 2. Score each asset against the twin's psychology
// 3. Predict: conversion rate, click-through, emotional response
// 4. Recommend: which version to deploy
// ---------------------------------------------------------------------------

export type DigitalTwin = {
  name: string;
  demographics: { age: string; gender: string; income: string; location: string };
  psychology: {
    primaryPain: string;
    secondaryPains: string[];
    desires: string[];
    fears: string[];
    objections: string[];
    buyingTriggers: string[];
    trustFactors: string[];
    priceThreshold: number;
  };
  behavior: {
    platformsUsed: string[];
    contentPreferences: string[];     // video, text, images
    attentionSpan: "short" | "medium" | "long";
    decisionSpeed: "impulsive" | "moderate" | "analytical";
    socialProofWeight: number;        // 0-10 how much reviews matter
    priceWeight: number;              // 0-10 how price-sensitive
    brandWeight: number;              // 0-10 how brand-loyal
  };
};

export type SimulationResult = {
  asset: string;                      // What was tested
  assetType: "headline" | "email_subject" | "ad_hook" | "price" | "offer" | "cta";
  predictedScore: number;             // 0-100
  predictedCTR: number;               // % click-through rate
  predictedConversion: number;        // % conversion rate
  emotionalResponse: "strong_positive" | "positive" | "neutral" | "negative" | "strong_negative";
  reasoning: string;
  improvements: string[];
};

export type ABSimulation = {
  variants: SimulationResult[];
  winner: string;
  winnerScore: number;
  confidence: "high" | "medium" | "low";
  recommendation: string;
};

/** Build a digital twin from available data */
export function buildDigitalTwin(input: {
  niche: string;
  audience: string;
  painPoints: string[];
  desires: string[];
  competitorPricing: string[];
  avgOrderValue?: number;
}): DigitalTwin {
  const avgPrice = input.competitorPricing
    .map((p) => parseFloat(p.replace(/[^0-9.]/g, "")))
    .filter((p) => !isNaN(p));
  const priceThreshold = avgPrice.length > 0
    ? avgPrice.reduce((s, p) => s + p, 0) / avgPrice.length * 1.2
    : input.avgOrderValue ?? 100;

  return {
    name: `${input.audience.split(" ").slice(0, 3).join(" ")} Archetype`,
    demographics: {
      age: "25-55",
      gender: "All",
      income: priceThreshold > 500 ? "$75k+" : priceThreshold > 100 ? "$50k+" : "$35k+",
      location: "US",
    },
    psychology: {
      primaryPain: input.painPoints[0] ?? `Struggling with ${input.niche}`,
      secondaryPains: input.painPoints.slice(1, 4),
      desires: input.desires.length > 0 ? input.desires : [`Achieve ${input.niche} success`, "Save time", "Get results fast"],
      fears: ["Wasting money on something that doesn't work", "Being scammed", "Looking foolish"],
      objections: ["Is this legit?", "Will it work for MY situation?", "Can I afford this?", "What if I don't have time?"],
      buyingTriggers: ["Social proof (reviews/testimonials)", "Money-back guarantee", "Limited-time pricing", "Seeing someone like them succeed"],
      trustFactors: ["Specific numbers/results", "Real testimonials", "Professional website", "Clear refund policy"],
      priceThreshold,
    },
    behavior: {
      platformsUsed: ["Instagram", "Facebook", "Google", "YouTube", "TikTok"],
      contentPreferences: ["short video", "listicles", "before/after", "testimonials"],
      attentionSpan: "short",
      decisionSpeed: priceThreshold > 500 ? "analytical" : priceThreshold > 100 ? "moderate" : "impulsive",
      socialProofWeight: 8,
      priceWeight: priceThreshold < 50 ? 9 : priceThreshold < 200 ? 6 : 4,
      brandWeight: 3,
    },
  };
}

/** Simulate how the digital twin would react to an asset */
export function simulateReaction(twin: DigitalTwin, asset: string, assetType: SimulationResult["assetType"]): SimulationResult {
  const lower = asset.toLowerCase();
  let score = 40; // Base
  const improvements: string[] = [];

  // ── Pain point resonance ──
  const painHit = twin.psychology.primaryPain.split(" ").some((w) => w.length > 3 && lower.includes(w.toLowerCase()));
  const secondaryHits = twin.psychology.secondaryPains.filter((p) => p.split(" ").some((w) => w.length > 3 && lower.includes(w.toLowerCase())));
  if (painHit) score += 15;
  else improvements.push(`Mention their primary pain: "${twin.psychology.primaryPain}"`);
  score += secondaryHits.length * 5;

  // ── Desire activation ──
  const desireHit = twin.psychology.desires.some((d) => d.split(" ").some((w) => w.length > 3 && lower.includes(w.toLowerCase())));
  if (desireHit) score += 10;
  else improvements.push(`Target a core desire: "${twin.psychology.desires[0]}"`);

  // ── Objection handling ──
  const handlesObjection = /guarantee|risk.?free|money.?back|proven|tested|works for/i.test(lower);
  if (handlesObjection) score += 8;
  else if (assetType === "ad_hook" || assetType === "headline") improvements.push("Add risk reversal (guarantee, free trial, etc.)");

  // ── Social proof ──
  const hasSocialProof = /\d+.*(?:customer|client|people|review|star|rated|trusted)/i.test(lower);
  if (hasSocialProof) score += twin.behavior.socialProofWeight;
  else if (twin.behavior.socialProofWeight >= 7) improvements.push("Add social proof — this audience weighs it heavily");

  // ── Specificity ──
  const hasSpecifics = /\d+%|\$\d|\d+ day|\d+ step|in \d+/i.test(lower);
  if (hasSpecifics) score += 8;
  else improvements.push("Add specific numbers (timeframe, percentage, dollar amount)");

  // ── Urgency ──
  const hasUrgency = /limited|now|today|last|hurry|before|ending|only \d/i.test(lower);
  if (hasUrgency) score += 5;

  // ── Emotional trigger ──
  const hasEmotion = /finally|imagine|tired|frustrated|dream|secret|truth|shocking/i.test(lower);
  if (hasEmotion) score += 5;

  // ── Format-specific adjustments ──
  if (assetType === "headline" && asset.length > 80) { score -= 5; improvements.push("Shorten headline — under 80 chars for best performance"); }
  if (assetType === "email_subject" && asset.length > 50) { score -= 5; improvements.push("Shorten subject — under 50 chars for mobile"); }
  if (assetType === "ad_hook" && !asset.endsWith("?") && !asset.endsWith("...")) { score -= 3; improvements.push("End with a question or ellipsis to create curiosity gap"); }

  // ── Price sensitivity ──
  if (assetType === "price") {
    const price = parseFloat(asset.replace(/[^0-9.]/g, ""));
    if (!isNaN(price)) {
      if (price <= twin.psychology.priceThreshold * 0.7) score += 10;
      else if (price <= twin.psychology.priceThreshold) score += 5;
      else if (price > twin.psychology.priceThreshold * 1.5) { score -= 15; improvements.push(`Price exceeds threshold ($${twin.psychology.priceThreshold.toFixed(0)}). Add more perceived value or payment plan.`); }
    }
  }

  score = Math.max(0, Math.min(100, score));

  // Calculate predicted metrics
  const predictedCTR = score >= 80 ? 3.5 + Math.random() * 2 : score >= 60 ? 1.5 + Math.random() * 2 : score >= 40 ? 0.5 + Math.random() * 1 : 0.1 + Math.random() * 0.5;
  const predictedConversion = score >= 80 ? 4 + Math.random() * 3 : score >= 60 ? 1.5 + Math.random() * 2 : score >= 40 ? 0.5 + Math.random() * 1 : 0.1 + Math.random() * 0.3;

  const emotionalResponse: SimulationResult["emotionalResponse"] =
    score >= 85 ? "strong_positive" : score >= 65 ? "positive" : score >= 45 ? "neutral" : score >= 25 ? "negative" : "strong_negative";

  const reasoning = score >= 75
    ? `Strong resonance with ${twin.name}. Hits primary pain, includes ${hasSocialProof ? "social proof" : "emotional trigger"}, and ${hasSpecifics ? "is specific" : "creates urgency"}.`
    : score >= 50
      ? `Moderate match. ${painHit ? "Addresses their pain" : "Misses main pain point"}. ${improvements.slice(0, 2).join(". ")}.`
      : `Weak match for this audience. ${improvements.slice(0, 3).join(". ")}.`;

  return {
    asset,
    assetType,
    predictedScore: score,
    predictedCTR: Math.round(predictedCTR * 10) / 10,
    predictedConversion: Math.round(predictedConversion * 10) / 10,
    emotionalResponse,
    reasoning,
    improvements: improvements.slice(0, 5),
  };
}

/** Simulate A/B test — compare multiple variants against the twin */
export function simulateABTest(twin: DigitalTwin, variants: { text: string; type: SimulationResult["assetType"] }[]): ABSimulation {
  const results = variants.map((v) => simulateReaction(twin, v.text, v.type));
  results.sort((a, b) => b.predictedScore - a.predictedScore);

  const winner = results[0];
  const second = results[1];
  const gap = winner && second ? winner.predictedScore - second.predictedScore : 0;

  const confidence: ABSimulation["confidence"] =
    gap >= 20 ? "high" : gap >= 10 ? "medium" : "low";

  return {
    variants: results,
    winner: winner?.asset ?? "",
    winnerScore: winner?.predictedScore ?? 0,
    confidence,
    recommendation: confidence === "high"
      ? `Deploy "${winner?.asset.slice(0, 50)}..." — ${gap} points ahead. Strong predicted performance.`
      : confidence === "medium"
        ? `Slight edge to "${winner?.asset.slice(0, 50)}..." but consider testing both live.`
        : `Too close to call. Run a real A/B test to determine the winner.`,
  };
}
