import type { ExtractedSignals } from "./extractSignals";
import type { Diagnosis } from "./diagnoseLink";
import type { ScoreResult } from "./scoreOpportunity";
import type { LinkType } from "./classifyLink";
import type { AnalysisMode } from "./normalizeInput";

export type DecisionPacket = {
  summary: string;
  verdict: string;
  confidence: string;
  score: number;
  linkType: string;
  audience: string;
  painDesire: string;
  angle: string;
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  nextActions: string[];
};

function buildRisks(signals: ExtractedSignals, scoreResult: ScoreResult): string[] {
  const risks: string[] = [];
  if (signals.trustSignals.length === 0) risks.push("No trust signals — high friction for cold traffic");
  if (signals.audienceHints.length === 0) risks.push("Undefined audience — targeting will be inefficient");
  if (!signals.price && signals.ctaText) risks.push("Price hidden — may signal weak offer confidence");
  if (scoreResult.breakdown.emotionalLeverage < 5) risks.push("Weak emotional connection — ad performance will suffer");
  if (scoreResult.breakdown.differentiation < 4) risks.push("Low differentiation — competing on crowded ground");
  return risks.length > 0 ? risks : ["No major risks identified at this stage"];
}

function buildNextActions(
  verdict: string,
  mode: AnalysisMode,
  signals: ExtractedSignals
): string[] {
  if (verdict === "Reject") {
    return [
      "Do not invest ad spend on this product/page as-is",
      "If you own this product: rewrite the headline and rebuild the offer stack",
      "Consider finding an alternative product with stronger emotional leverage",
    ];
  }

  const actions: string[] = [];

  if (mode === "operator") {
    if (verdict === "Strong Opportunity") {
      actions.push("Launch 3 ad creatives immediately using the identified angle");
      actions.push("Test $30–50/day with broad audience first");
      actions.push("Set up abandoned cart email within 48 hours");
    } else {
      actions.push("Fix headline to lead with core pain before testing ads");
      actions.push("Add at least one trust signal (review, guarantee, or testimonial)");
      actions.push("Test with small budget ($20/day) before scaling");
    }
    if (signals.offerComponents.length === 0) {
      actions.push("Add a bonus or limited-time element to strengthen the offer");
    }
  }

  if (mode === "consultant") {
    actions.push("Present these findings to the client as a conversion audit");
    actions.push("Prioritize fixing: " + (signals.trustSignals.length === 0 ? "trust signals" : "headline clarity"));
    actions.push("Recommend full funnel rebuild if weaknesses exceed 4 items");
    actions.push("Quote a project based on identified gaps");
  }

  if (mode === "saas") {
    actions.push("Start by improving your headline — make it about the customer's problem");
    actions.push("Add a review or guarantee to build trust");
    actions.push("Make your CTA specific: replace generic buttons with benefit-driven text");
  }

  return actions.length > 0 ? actions : ["Review findings and decide on next move"];
}

function buildSummary(diagnosis: Diagnosis, scoreResult: ScoreResult): string {
  const { verdict, confidence } = scoreResult;
  const strengthCount = diagnosis.strengths.length;
  const weaknessCount = diagnosis.weaknesses.length;

  return `${verdict} (${confidence} confidence). This page shows ${strengthCount} strength${strengthCount !== 1 ? "s" : ""} and ${weaknessCount} weakness${weaknessCount !== 1 ? "es" : ""}. Current angle: ${diagnosis.currentAngle}. ${verdict === "Strong Opportunity" ? "Worth pursuing immediately." : verdict === "Testable" ? "Worth a small test before scaling." : "Needs work before ad spend."}`;
}

export function buildDecisionPacket(
  signals: ExtractedSignals,
  diagnosis: Diagnosis,
  scoreResult: ScoreResult,
  linkType: LinkType,
  mode: AnalysisMode
): DecisionPacket {
  const risks = buildRisks(signals, scoreResult);
  const nextActions = buildNextActions(scoreResult.verdict, mode, signals);
  const summary = buildSummary(diagnosis, scoreResult);

  return {
    summary,
    verdict: scoreResult.verdict,
    confidence: scoreResult.confidence,
    score: scoreResult.total,
    linkType,
    audience: diagnosis.likelyAudience,
    painDesire: diagnosis.corePainOrDesire,
    angle: diagnosis.currentAngle,
    strengths: diagnosis.strengths,
    weaknesses: diagnosis.weaknesses,
    risks,
    nextActions,
  };
}
