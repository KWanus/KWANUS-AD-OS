import type { OpportunityStatus } from "./classifyOpportunity";
import type { DimensionScores } from "./scoreOpportunityDimensions";
import type { AnalysisMode } from "./normalizeInput";

export type RecommendedPath =
  | "build now"
  | "test ad angle first"
  | "improve page first"
  | "reposition offer"
  | "reject and move on";

export type PathRecommendation = {
  path: RecommendedPath;
  priorityActions: string[];
};

export function recommendOpportunityPath(
  status: OpportunityStatus,
  dimensions: DimensionScores,
  mode: AnalysisMode
): PathRecommendation {
  // Determine path
  let path: RecommendedPath;

  if (status === "Build Immediately") {
    path = "build now";
  } else if (status === "Strong Opportunity") {
    path = dimensions.conversionReadiness < 60 ? "improve page first" : "test ad angle first";
  } else if (status === "Test Carefully") {
    path = dimensions.trustCredibility < 40 ? "improve page first" : "test ad angle first";
  } else if (status === "Needs Rework") {
    path = dimensions.demandPotential < 40 ? "reposition offer" : "improve page first";
  } else {
    path = "reject and move on";
  }

  // Priority actions per mode + path
  const actions = buildPriorityActions(path, dimensions, mode);

  return { path, priorityActions: actions };
}

function buildPriorityActions(
  path: RecommendedPath,
  dimensions: DimensionScores,
  mode: AnalysisMode
): string[] {
  if (path === "reject and move on") {
    return [
      "Do not spend ad budget on this product/page",
      mode === "consultant"
        ? "If this is a client — recommend a full strategy reset before any spend"
        : "Find a product with stronger emotional leverage and clearer offer",
    ];
  }

  const actions: string[] = [];

  // Fix the biggest gap first
  const lowestDimension = Object.entries({
    trustCredibility: dimensions.trustCredibility,
    emotionalLeverage: dimensions.emotionalLeverage,
    conversionReadiness: dimensions.conversionReadiness,
    differentiation: dimensions.differentiation,
    offerStrength: dimensions.offerStrength,
  }).sort(([, a], [, b]) => a - b)[0];

  const GAP_FIXES: Record<string, string> = {
    trustCredibility: "Add reviews, a money-back guarantee, or customer testimonials",
    emotionalLeverage: "Rewrite the headline to lead with the core pain or transformation",
    conversionReadiness: "Clarify the CTA — make it specific and benefit-driven",
    differentiation: "Identify one unique mechanism or claim that competitors do not use",
    offerStrength: "Strengthen the offer — add a bonus, remove friction, or make pricing clearer",
  };

  if (lowestDimension && lowestDimension[1] < 55) {
    actions.push(GAP_FIXES[lowestDimension[0]] ?? "Address the biggest identified weakness first");
  }

  if (mode === "operator") {
    if (path === "build now") {
      actions.push("Launch 3–5 ad creatives using the identified angle");
      actions.push("Start with $30–50/day broad audience test");
      actions.push("Set up abandoned cart email before scaling");
    } else if (path === "test ad angle first") {
      actions.push("Test 2–3 hooks without scaling — confirm CPA before committing budget");
      actions.push("Use UGC-style creatives to reduce production cost during test");
    } else if (path === "improve page first") {
      actions.push("Fix the page before running any paid traffic");
      actions.push("Minimum: strong headline + one trust signal + clear CTA");
    } else {
      actions.push("Rethink the positioning before spending money");
      actions.push("Interview 2–3 potential buyers to find the real pain angle");
    }
  }

  if (mode === "consultant") {
    if (path === "build now") {
      actions.push("Present this as a high-confidence opportunity to the client");
      actions.push("Recommend immediate campaign launch with full tracking");
    } else if (path === "improve page first") {
      actions.push("Present a CRO audit — this is a billable project");
      actions.push("Prioritize: headline, trust signals, offer clarity");
    } else if (path === "reposition offer") {
      actions.push("Propose a positioning workshop — charge for strategy before execution");
    } else {
      actions.push("Be honest with the client — the current setup is not ready for paid traffic");
    }
  }

  if (mode === "saas") {
    if (path === "build now" || path === "test ad angle first") {
      actions.push("Your product looks promising — start with a small ad test");
      actions.push("Make sure your checkout is working before running traffic");
    } else {
      actions.push("Improve your page first — focus on your headline and adding reviews");
      actions.push("Do not spend on ads until the page clearly explains who this is for");
    }
  }

  return actions.slice(0, 5);
}
