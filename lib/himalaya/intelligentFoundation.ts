import Anthropic from "@anthropic-ai/sdk";
import type { BusinessPath, HimalayaProfileInput } from "./profileTypes";
import type { BusinessFoundation } from "./foundationGenerator";
import type { NicheIntelligence } from "./nicheIntelligence";

/**
 * Generates a business foundation using real niche intelligence + Claude.
 * This replaces the template-based generator when intelligence data is available.
 */
export async function generateIntelligentFoundation(
  profile: HimalayaProfileInput,
  path: BusinessPath,
  intel: NicheIntelligence,
): Promise<BusinessFoundation> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fall back to template generator
    const { generateFoundation } = await import("./foundationGenerator");
    return generateFoundation(profile, path);
  }

  const anthropic = new Anthropic({ apiKey });

  const competitorContext = intel.competitors.length > 0
    ? intel.competitors.map((c, i) =>
        `Competitor ${i + 1} (${c.url}):\n  Headline: ${c.headline}\n  Benefits: ${c.benefits.join(", ") || "unclear"}\n  Weaknesses: ${c.weaknesses.join(", ")}`
      ).join("\n")
    : "No competitors scanned.";

  const prompt = `You are a top-tier business strategist. Generate a complete business foundation that is SPECIFICALLY designed to beat the competition in this exact market.

NICHE: ${intel.niche}
BUSINESS TYPE: ${path}
USER BUDGET: ${profile.budget}
USER TIME: ${profile.timeAvailable}
USER SKILLS: ${profile.skills.join(", ")}
USER GOAL: ${profile.primaryGoal}

COMPETITIVE INTELLIGENCE:
${competitorContext}

MARKET ANALYSIS:
- Common pricing: ${intel.marketInsights.commonPricing}
- Competitor promises: ${intel.marketInsights.commonPromises.join(", ")}
- Competitor weaknesses: ${intel.marketInsights.commonWeaknesses.join(", ")}
- Underserved angles: ${intel.marketInsights.underservedAngles.join(", ")}
- Recommended positioning: ${intel.recommendedPositioning}
- Target pain points: ${intel.topPainPoints.join(", ")}

Generate a COMPLETE business foundation. Every piece must be specific to this exact niche — no generic advice. Reference competitors' weaknesses and position against them directly.

Respond in this exact JSON format (raw JSON only, no markdown):
{
  "businessProfile": {
    "businessType": "specific type",
    "niche": "exact niche",
    "targetCustomer": "specific description of who this serves",
    "painPoint": "the #1 pain point based on market research",
    "uniqueAngle": "how this business is positioned to win against current competitors"
  },
  "idealCustomer": {
    "who": "specific person description",
    "demographics": "age, income, role, situation",
    "psychographics": "what they value, fear, want",
    "whereToBuy": "where they search for solutions",
    "buyingTrigger": "what makes them pull the trigger"
  },
  "offerDirection": {
    "coreOffer": "what you sell — be specific",
    "pricing": "specific pricing based on market analysis",
    "deliverable": "exactly what the customer gets",
    "transformation": "the before/after result",
    "guarantee": "specific risk-reversal based on competitor gaps"
  },
  "websiteBlueprint": {
    "headline": "headline that directly addresses the #1 pain point",
    "subheadline": "supporting line that differentiates from competitors",
    "heroCtaText": "specific CTA text",
    "sections": ["section1", "section2", "section3", "section4", "section5", "section6"],
    "trustElements": ["trust1", "trust2", "trust3", "trust4"],
    "urgencyLine": "urgency that feels real, not fake"
  },
  "marketingAngles": [
    {"hook": "hook text", "angle": "angle name", "platform": "best platform for this"},
    {"hook": "hook text", "angle": "angle name", "platform": "platform"},
    {"hook": "hook text", "angle": "angle name", "platform": "platform"},
    {"hook": "hook text that directly attacks competitor weakness", "angle": "competitor attack", "platform": "platform"},
    {"hook": "hook text", "angle": "angle name", "platform": "platform"}
  ],
  "emailSequence": [
    {"subject": "subject line", "purpose": "what this email does", "timing": "when sent"},
    {"subject": "subject line", "purpose": "purpose", "timing": "timing"},
    {"subject": "subject line", "purpose": "purpose", "timing": "timing"},
    {"subject": "subject line", "purpose": "purpose", "timing": "timing"},
    {"subject": "subject line", "purpose": "purpose", "timing": "timing"}
  ],
  "actionRoadmap": [
    {"phase": "Week 1", "timeframe": "Week 1", "tasks": ["task1", "task2", "task3", "task4", "task5"]},
    {"phase": "Week 2-3", "timeframe": "Week 2-3", "tasks": ["task1", "task2", "task3", "task4", "task5"]},
    {"phase": "Month 2+", "timeframe": "Month 2+", "tasks": ["task1", "task2", "task3", "task4", "task5"]}
  ]
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Omit<BusinessFoundation, "path" | "pathLabel">;
      const pathLabels: Record<string, string> = {
        affiliate: "Affiliate Marketing",
        dropshipping: "Dropshipping / E-commerce",
        agency: "Agency / Service Business",
        freelance: "Freelancing",
        coaching: "Coaching / Consulting",
        local_service: "Local Service Business",
        ecommerce_brand: "E-commerce Brand",
        digital_product: "Digital Products",
        improve_existing: "Business Improvement",
        scale_systems: "Scale with Systems",
      };

      return {
        path,
        pathLabel: pathLabels[path] ?? path,
        ...parsed,
      };
    }
  } catch (err) {
    console.error("[IntelligentFoundation] Claude generation failed:", err);
  }

  // Fallback to template
  const { generateFoundation } = await import("./foundationGenerator");
  return generateFoundation(profile, path);
}
