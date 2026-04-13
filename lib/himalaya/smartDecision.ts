// ---------------------------------------------------------------------------
// Smart Decision Engine — infers the best path from a single sentence
//
// Old way: User fills 7-step form → score paths → pick highest
// New way: User types "I want to make $10k/month" → AI infers everything
//
// This analyzes the user's input and determines:
// 1. Business stage (starting, has business, scaling)
// 2. Budget level (from context clues)
// 3. Time availability
// 4. Skills (from what they mention)
// 5. Risk tolerance
// 6. Primary goal
// 7. Best path + niche
//
// Uses keyword detection first (instant), AI second (if ambiguous)
// ---------------------------------------------------------------------------

import { generateAI } from "@/lib/integrations/aiInference";
import { getPlaybook } from "@/lib/himalaya/nichePlaybooks";
import type { HimalayaProfileInput, BusinessPath } from "./profileTypes";

export type SmartDecisionResult = {
  profile: HimalayaProfileInput;
  path: BusinessPath;
  niche: string;
  confidence: "high" | "medium" | "low";
  reasoning: string;
};

/** Infer the complete profile from a single user input */
export async function smartDecide(input: {
  text: string;
  entryType: "no_business" | "has_business" | "want_to_scale";
  revenue?: string;
}): Promise<SmartDecisionResult> {
  const text = input.text.toLowerCase();

  // ── Step 1: Keyword detection (instant) ────────────────────────────────

  // Detect business stage
  let stage: HimalayaProfileInput["businessStage"] = "no_business";
  if (input.entryType === "want_to_scale") stage = "has_revenue";
  else if (input.entryType === "has_business") stage = "early_stage";
  else if (/scaling|scale|grow|expand|increase/.test(text)) stage = "has_revenue";
  else if (/already|existing|current|my business|my company/.test(text)) stage = "early_stage";

  // Detect budget from revenue/context
  let budget: HimalayaProfileInput["budget"] = "micro";
  if (input.revenue) {
    if (/\$50k|\$100k|50000|100000/.test(input.revenue)) budget = "serious";
    else if (/\$25k|\$10k|25000|10000/.test(input.revenue)) budget = "moderate";
    else if (/\$5k|5000/.test(input.revenue)) budget = "moderate";
  }
  if (/no money|broke|free|zero budget|no budget/.test(text)) budget = "none";
  if (/invest|funded|capital|budget of/.test(text)) budget = "moderate";

  // Detect time
  let time: HimalayaProfileInput["timeAvailable"] = "parttime";
  if (/full.?time|all.?in|quit.?my.?job|dedicated/.test(text)) time = "fulltime";
  if (/side|spare|few hours|after work|weekends/.test(text)) time = "minimal";

  // Detect skills
  const skills: HimalayaProfileInput["skills"] = [];
  if (/design|creative|art|photo|video|content/.test(text)) skills.push("creative");
  if (/code|develop|tech|software|programm/.test(text)) skills.push("technical");
  if (/sell|sales|close|negotiate/.test(text)) skills.push("sales");
  if (/write|copy|blog|newsletter/.test(text)) skills.push("creative");
  if (/manage|operations|process|system/.test(text)) skills.push("operations");
  if (/talk|present|teach|coach|communicate/.test(text)) skills.push("communication");
  if (skills.length === 0) skills.push("communication"); // default

  // Detect risk
  let risk: HimalayaProfileInput["riskTolerance"] = "medium";
  if (/safe|low risk|guaranteed|no risk|sure thing/.test(text)) risk = "low";
  if (/aggressive|all.?in|high risk|yolo|big bet/.test(text)) risk = "high";

  // Detect goal
  let goal: HimalayaProfileInput["primaryGoal"] = "full_business";
  if (/\$\d+k?.*month|make money|income|revenue|earn/.test(text)) goal = "full_business";
  if (/side income|extra|passive|part.?time income/.test(text)) goal = "side_income";
  if (/quick|fast|asap|immediately|this week/.test(text)) goal = "quick_cash";
  if (/scale|grow|expand|increase|double|triple/.test(text)) goal = "scale_existing";
  if (/fix|improve|better|optimize|not working/.test(text)) goal = "fix_existing";

  // ── Step 2: Detect best path from keywords ─────────────────────────────

  let path: BusinessPath = "affiliate"; // default for new users
  let niche = input.text.trim();
  let confidence = "medium" as string;

  // Direct path mentions
  const pathPatterns: [RegExp, BusinessPath, string][] = [
    [/affiliate|commission|promote products|clickbank|digistore/, "affiliate", "affiliate marketing"],
    [/coach|consult|mentor|advisor|transform|help people/, "coaching", "coaching and consulting"],
    [/dropship|ecommerce|store|shopify|sell products|physical product/, "dropshipping", "ecommerce and dropshipping"],
    [/agency|client|marketing for|ads for|seo for|service other/, "agency", "marketing agency"],
    [/freelanc|design|develop|write for|virtual assistant/, "freelance", "freelancing"],
    [/local|plumb|hvac|roof|clean|lawn|contractor|near me/, "local_service", "local service business"],
    [/course|ebook|digital product|membership|community|teach/, "digital_product", "digital products"],
    [/brand|fashion|beauty|supplement|apparel|own product/, "ecommerce_brand", "ecommerce brand"],
    [/saas|software|app|platform|tool/, "digital_product", "software product"],
    [/real estate|property|agent|broker/, "local_service", "real estate"],
  ];

  for (const [pattern, p, n] of pathPatterns) {
    if (pattern.test(text)) {
      path = p;
      niche = n;
      confidence = "high";
      break;
    }
  }

  // Revenue-based path selection for "no_business" without clear path
  if (confidence !== "high" && input.entryType === "no_business") {
    const revenueMatch = text.match(/\$(\d[\d,]*)\s*k?\s*\/?\s*(?:month|mo)/i);
    if (revenueMatch) {
      const target = parseInt(revenueMatch[1].replace(/,/g, ""), 10);
      const actual = text.includes("k") ? target * 1000 : target;

      if (actual <= 3000) {
        path = "affiliate"; // Low target = affiliate is fastest
        niche = "affiliate marketing";
      } else if (actual <= 10000) {
        path = "coaching"; // Medium target = coaching/services
        niche = "coaching and consulting";
      } else if (actual <= 25000) {
        path = "agency"; // Higher target = agency
        niche = "marketing agency";
      } else {
        path = "ecommerce_brand"; // Big target = brand
        niche = "ecommerce brand";
      }
      confidence = "medium";
    }
  }

  // Scaling users → improve or scale path
  if (input.entryType === "want_to_scale") {
    path = "scale_systems";
    goal = "scale_existing";
    confidence = "high";
  }

  if (input.entryType === "has_business" && /https?:\/\//.test(text)) {
    path = "improve_existing";
    goal = "fix_existing";
    confidence = "high";
  }

  // ── Step 3: If still low confidence, use AI ────────────────────────────

  if (confidence === "low" || (confidence === "medium" && !niche)) {
    try {
      const aiResult = await generateAI({
        prompt: `A user said: "${input.text}"
They are: ${input.entryType === "no_business" ? "starting from scratch" : input.entryType === "has_business" ? "have an existing business" : "want to scale"}.
${input.revenue ? `Current revenue: ${input.revenue}/month.` : ""}

Pick the BEST business path for them from this list:
- affiliate (promote other people's products)
- coaching (sell expertise/coaching/consulting)
- dropshipping (sell physical products online)
- agency (offer marketing services to businesses)
- freelance (sell a skill as a service)
- local_service (local trades/services)
- digital_product (courses, ebooks, templates)
- ecommerce_brand (build a product brand)

Return JSON only: {"path":"...","niche":"specific niche description","reasoning":"one sentence why"}`,
        systemPrompt: "You are a business strategist. Pick the highest-probability path for this person. Return only JSON.",
        maxTokens: 200,
      });

      try {
        const parsed = JSON.parse(aiResult.content);
        if (parsed.path) path = parsed.path as BusinessPath;
        if (parsed.niche) niche = parsed.niche;
        confidence = "high";
      } catch { /* keep keyword detection result */ }
    } catch { /* keep keyword detection result */ }
  }

  // ── Step 4: Build the full profile ─────────────────────────────────────

  const profile: HimalayaProfileInput = {
    businessStage: stage,
    primaryGoal: goal,
    budget,
    timeAvailable: time,
    skills,
    riskTolerance: risk,
    niche,
    description: input.text,
  };

  // Get playbook reasoning
  const playbook = getPlaybook(path);
  const reasoning = playbook
    ? `Matched to ${playbook.niche} path (studied: ${playbook.topPerformers.slice(0, 3).join(", ")}). ${playbook.benchmarks.monthsToProfit} to profit. Starting investment: ${playbook.offer.pricePoints[0]?.price ?? "varies"}.`
    : `Selected ${path} based on your situation: ${stage}, ${budget} budget, ${time} time.`;

  return { profile, path, niche, confidence: confidence as "high" | "medium" | "low", reasoning };
}
