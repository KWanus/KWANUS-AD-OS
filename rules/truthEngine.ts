// ─────────────────────────────────────────────────────────────────────────────
// KWANUS AD OS — Phase 2: Truth Engine
// Configurable, weighted scoring system that produces diagnostic reports
// from raw scan signals. This is the "brain" that turns data into verdicts.
// ─────────────────────────────────────────────────────────────────────────────

import type { DimensionScores } from "@/src/logic/ad-os/scoreOpportunityDimensions";

// ─── Configurable Weights ────────────────────────────────────────────────────

export type ScoringProfile = {
  name: string;
  description: string;
  weights: Record<keyof DimensionScores, number>;
  thresholds: {
    pursue: number;   // score >= this → Pursue
    consider: number;  // score >= this → Consider
    // below consider → Reject
  };
};

// Default weights (balanced across all dimensions)
export const BALANCED_PROFILE: ScoringProfile = {
  name: "Balanced",
  description: "Equal weight across all dimensions — good for general opportunity assessment",
  weights: {
    demandPotential: 12,
    offerStrength: 12,
    emotionalLeverage: 10,
    trustCredibility: 12,
    conversionReadiness: 12,
    adViability: 10,
    emailLifecyclePotential: 8,
    seoPotential: 6,
    differentiation: 10,
    risk: 8, // subtracted
  },
  thresholds: { pursue: 65, consider: 40 },
};

// Aggressive growth — optimized for paid traffic operators
export const PAID_TRAFFIC_PROFILE: ScoringProfile = {
  name: "Paid Traffic",
  description: "Prioritizes ad viability, conversion readiness, and emotional hooks — for operators running ads",
  weights: {
    demandPotential: 10,
    offerStrength: 15,
    emotionalLeverage: 15,
    trustCredibility: 8,
    conversionReadiness: 15,
    adViability: 18,
    emailLifecyclePotential: 5,
    seoPotential: 2,
    differentiation: 5,
    risk: 7,
  },
  thresholds: { pursue: 60, consider: 35 },
};

// Consultant mode — for agencies evaluating client sites
export const CONSULTANT_PROFILE: ScoringProfile = {
  name: "Consultant",
  description: "Weights trust, conversion, and differentiation — for evaluating client improvement opportunities",
  weights: {
    demandPotential: 8,
    offerStrength: 10,
    emotionalLeverage: 8,
    trustCredibility: 16,
    conversionReadiness: 16,
    adViability: 6,
    emailLifecyclePotential: 10,
    seoPotential: 10,
    differentiation: 10,
    risk: 6,
  },
  thresholds: { pursue: 55, consider: 35 },
};

// SEO/Content — for organic traffic plays
export const SEO_PROFILE: ScoringProfile = {
  name: "SEO / Content",
  description: "Prioritizes SEO potential, differentiation, and demand signals — for organic growth",
  weights: {
    demandPotential: 15,
    offerStrength: 8,
    emotionalLeverage: 5,
    trustCredibility: 10,
    conversionReadiness: 8,
    adViability: 3,
    emailLifecyclePotential: 10,
    seoPotential: 22,
    differentiation: 12,
    risk: 7,
  },
  thresholds: { pursue: 60, consider: 38 },
};

export const SCORING_PROFILES: Record<string, ScoringProfile> = {
  balanced: BALANCED_PROFILE,
  paid_traffic: PAID_TRAFFIC_PROFILE,
  consultant: CONSULTANT_PROFILE,
  seo: SEO_PROFILE,
};

// ─── Scoring Engine ──────────────────────────────────────────────────────────

export type TruthEngineResult = {
  totalScore: number;
  verdict: "Pursue" | "Consider" | "Reject";
  confidence: "High" | "Medium" | "Low";
  profile: string;
  breakdown: {
    dimension: string;
    rawScore: number;
    weight: number;
    weightedScore: number;
    grade: "A" | "B" | "C" | "D" | "F";
    isRisk: boolean;
  }[];
  diagnostics: DiagnosticItem[];
  strengthSummary: string;
  weaknessSummary: string;
  actionPlan: string[];
};

export type DiagnosticItem = {
  severity: "critical" | "warning" | "info" | "positive";
  dimension: string;
  message: string;
  fix?: string;
};

function grade(score: number, isRisk: boolean): "A" | "B" | "C" | "D" | "F" {
  if (isRisk) {
    // For risk, lower is better
    if (score <= 20) return "A";
    if (score <= 40) return "B";
    if (score <= 60) return "C";
    if (score <= 80) return "D";
    return "F";
  }
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 45) return "C";
  if (score >= 25) return "D";
  return "F";
}

const DIMENSION_LABELS: Record<keyof DimensionScores, string> = {
  demandPotential: "Demand Potential",
  offerStrength: "Offer Strength",
  emotionalLeverage: "Emotional Leverage",
  trustCredibility: "Trust & Credibility",
  conversionReadiness: "Conversion Readiness",
  adViability: "Ad Viability",
  emailLifecyclePotential: "Email Lifecycle",
  seoPotential: "SEO Potential",
  differentiation: "Differentiation",
  risk: "Risk Level",
};

// ─── Diagnostic Rules ────────────────────────────────────────────────────────

type DiagnosticRule = {
  check: (d: DimensionScores) => boolean;
  severity: DiagnosticItem["severity"];
  dimension: string;
  message: string;
  fix: string;
};

const DIAGNOSTIC_RULES: DiagnosticRule[] = [
  // Critical issues
  {
    check: (d) => d.trustCredibility !== null && d.trustCredibility < 25,
    severity: "critical",
    dimension: "Trust & Credibility",
    message: "No trust signals detected — cold traffic will not convert",
    fix: "Add testimonials, reviews, guarantees, or trust badges above the fold",
  },
  {
    check: (d) => d.conversionReadiness !== null && d.conversionReadiness < 30,
    severity: "critical",
    dimension: "Conversion Readiness",
    message: "Page has no clear conversion path — missing headline, CTA, or offer structure",
    fix: "Add a clear headline, benefit-driven subheadline, and a prominent CTA button",
  },
  {
    check: (d) => d.risk !== null && d.risk > 70,
    severity: "critical",
    dimension: "Risk Level",
    message: "High risk profile — multiple foundational elements missing",
    fix: "Address trust, content depth, and audience clarity before investing in traffic",
  },
  {
    check: (d) => d.offerStrength !== null && d.offerStrength < 25,
    severity: "critical",
    dimension: "Offer Strength",
    message: "Offer is invisible or unclear — no price, no CTA, no value stack",
    fix: "Make the offer explicit: what they get, what it costs, and why now",
  },

  // Warnings
  {
    check: (d) => d.emotionalLeverage !== null && d.emotionalLeverage < 40,
    severity: "warning",
    dimension: "Emotional Leverage",
    message: "Weak emotional connection — page reads like a brochure, not a sales tool",
    fix: "Add pain-point language and desire-driven benefits in the first 3 sections",
  },
  {
    check: (d) => d.demandPotential !== null && d.demandPotential < 40,
    severity: "warning",
    dimension: "Demand Potential",
    message: "Demand signals are weak — problem being solved is not clearly communicated",
    fix: "Lead with the specific pain point and quantify the cost of inaction",
  },
  {
    check: (d) => d.differentiation !== null && d.differentiation < 35,
    severity: "warning",
    dimension: "Differentiation",
    message: "Offer looks generic — nothing distinguishes it from competitors",
    fix: "Highlight a unique mechanism, proprietary method, or specific result that competitors can't claim",
  },
  {
    check: (d) => d.adViability !== null && d.adViability < 40,
    severity: "warning",
    dimension: "Ad Viability",
    message: "Low ad viability — running paid traffic to this page will likely lose money",
    fix: "Improve emotional hooks, sharpen the audience targeting, and strengthen the offer before spending on ads",
  },
  {
    check: (d) => d.emailLifecyclePotential !== null && d.emailLifecyclePotential < 35,
    severity: "warning",
    dimension: "Email Lifecycle",
    message: "Thin content limits email nurture potential — not enough depth for a strong sequence",
    fix: "Add more benefits, use cases, and objection-handling content to feed into email flows",
  },

  // Positive signals
  {
    check: (d) => d.emotionalLeverage !== null && d.emotionalLeverage >= 70,
    severity: "positive",
    dimension: "Emotional Leverage",
    message: "Strong emotional triggers detected — high buyer motivation potential",
    fix: "",
  },
  {
    check: (d) => d.trustCredibility !== null && d.trustCredibility >= 65,
    severity: "positive",
    dimension: "Trust & Credibility",
    message: "Solid trust foundation — testimonials, guarantees, or social proof present",
    fix: "",
  },
  {
    check: (d) => d.conversionReadiness !== null && d.conversionReadiness >= 70,
    severity: "positive",
    dimension: "Conversion Readiness",
    message: "Page is well-structured for conversion — clear path from headline to CTA",
    fix: "",
  },
  {
    check: (d) => d.adViability !== null && d.adViability >= 70,
    severity: "positive",
    dimension: "Ad Viability",
    message: "Good ad viability — product and page are well-suited for paid traffic",
    fix: "",
  },
  {
    check: (d) => d.seoPotential !== null && d.seoPotential >= 70,
    severity: "positive",
    dimension: "SEO Potential",
    message: "Strong SEO signals — content depth and structure support organic ranking",
    fix: "",
  },
  {
    check: (d) => d.risk !== null && d.risk <= 20,
    severity: "positive",
    dimension: "Risk Level",
    message: "Low risk profile — foundational elements are solid",
    fix: "",
  },

  // Info
  {
    check: (d) => d.seoPotential !== null && d.seoPotential < 30,
    severity: "info",
    dimension: "SEO Potential",
    message: "Limited organic search potential — this page is better suited for paid/direct traffic",
    fix: "If organic matters, add long-form content, FAQ sections, and target question-based keywords",
  },
];

// ─── Main Scoring Function ───────────────────────────────────────────────────

export function runTruthEngine(
  dimensions: DimensionScores,
  profileKey: string = "balanced"
): TruthEngineResult {
  const profile = SCORING_PROFILES[profileKey] ?? BALANCED_PROFILE;
  const keys = Object.keys(profile.weights) as (keyof DimensionScores)[];

  // Calculate weighted score
  let weightedSum = 0;
  let totalWeight = 0;
  const breakdown: TruthEngineResult["breakdown"] = [];

  for (const key of keys) {
    const raw = dimensions[key] ?? 0;
    const weight = profile.weights[key];
    const isRisk = key === "risk";

    // Risk is subtracted (high risk = bad)
    const effectiveScore = isRisk ? Math.max(0, 100 - raw) : raw;
    const weighted = (effectiveScore / 100) * weight;

    weightedSum += weighted;
    totalWeight += weight;

    breakdown.push({
      dimension: DIMENSION_LABELS[key],
      rawScore: raw,
      weight,
      weightedScore: Math.round(weighted * 10) / 10,
      grade: grade(raw, isRisk),
      isRisk,
    });
  }

  const totalScore = Math.round((weightedSum / totalWeight) * 100);

  // Determine verdict
  const verdict: TruthEngineResult["verdict"] =
    totalScore >= profile.thresholds.pursue ? "Pursue"
    : totalScore >= profile.thresholds.consider ? "Consider"
    : "Reject";

  // Determine confidence
  const criticalCount = breakdown.filter(b => b.grade === "F").length;
  const strongCount = breakdown.filter(b => b.grade === "A" || b.grade === "B").length;
  const confidence: TruthEngineResult["confidence"] =
    criticalCount >= 3 ? "Low"
    : strongCount >= 5 ? "High"
    : "Medium";

  // Run diagnostics
  const diagnostics = DIAGNOSTIC_RULES
    .filter(rule => rule.check(dimensions))
    .map(rule => ({
      severity: rule.severity,
      dimension: rule.dimension,
      message: rule.message,
      fix: rule.fix || undefined,
    }));

  // Generate summaries
  const strengths = breakdown.filter(b => b.grade === "A" || b.grade === "B");
  const weaknesses = breakdown.filter(b => b.grade === "D" || b.grade === "F");

  const strengthSummary = strengths.length > 0
    ? `Strong in ${strengths.map(s => s.dimension.toLowerCase()).join(", ")}.`
    : "No clear strengths detected at current signal levels.";

  const weaknessSummary = weaknesses.length > 0
    ? `Weak in ${weaknesses.map(w => w.dimension.toLowerCase()).join(", ")}.`
    : "No critical weaknesses detected.";

  // Generate action plan (prioritized by impact)
  const criticalDiags = diagnostics.filter(d => d.severity === "critical" && d.fix);
  const warningDiags = diagnostics.filter(d => d.severity === "warning" && d.fix);
  const actionPlan = [
    ...criticalDiags.map(d => `[CRITICAL] ${d.fix}`),
    ...warningDiags.map(d => `[HIGH] ${d.fix}`),
  ].slice(0, 5);

  if (actionPlan.length === 0) {
    actionPlan.push("All dimensions are healthy — focus on scaling what's working.");
  }

  return {
    totalScore,
    verdict,
    confidence,
    profile: profile.name,
    breakdown,
    diagnostics,
    strengthSummary,
    weaknessSummary,
    actionPlan,
  };
}

// ─── Convenience: Run with mode auto-detection ───────────────────────────────

export function getProfileForMode(mode: string): string {
  switch (mode) {
    case "consultant": return "consultant";
    case "operator": return "paid_traffic";
    case "seo": return "seo";
    default: return "balanced";
  }
}
