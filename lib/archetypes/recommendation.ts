import { ARCHETYPES, type BusinessType, type SystemBlueprint } from "@/lib/archetypes";

export type Recommendation = {
  strategicSummary: string;
  firstAction: string;
  milestones: {
    day30: string;
    day60: string;
    day90: string;
  };
  prioritizedSystems: Array<{
    slug: string;
    personalizedReason: string;
    priority: string;
    estimatedImpact: string;
  }>;
};

function rankWeight(system: SystemBlueprint, goal: string, stage: string): number {
  let score = system.priority === "essential" ? 100 : system.priority === "recommended" ? 60 : 30;

  if (goal === "more_leads" && ["website", "google_ads", "facebook_ads", "lead_magnet", "booking_flow"].includes(system.slug)) score += 40;
  if (goal === "more_sales" && ["email_sequence", "upsell_flow", "product_page", "proposal_system"].includes(system.slug)) score += 35;
  if (goal === "automate" && ["sms_followup", "crm_pipeline", "review_system", "white_label_reports"].includes(system.slug)) score += 35;
  if (goal === "build_brand" && ["content_calendar", "website", "case_studies", "youtube_channel", "podcast_system"].includes(system.slug)) score += 30;
  if (goal === "launch" && ["website", "facebook_ads", "lead_magnet", "product_page", "bridge_page"].includes(system.slug)) score += 28;
  if (goal === "scale" && ["google_ads", "facebook_ads", "email_sequence", "crm_pipeline", "upsell_flow"].includes(system.slug)) score += 32;

  if (stage === "starting" && system.priority === "essential") score += 20;
  if (stage === "early" && system.priority !== "optional") score += 15;
  if (stage === "scaling" && ["upsell_flow", "content_calendar", "referral_system", "white_label_reports"].includes(system.slug)) score += 20;

  return score;
}

export function buildFallbackRecommendation(type: BusinessType, niche: string, goal: string, stage: string): Recommendation {
  const archetype = ARCHETYPES[type];
  const prioritized = [...archetype.systems]
    .sort((a, b) => rankWeight(b, goal, stage) - rankWeight(a, goal, stage))
    .map((system) => ({
      slug: system.slug,
      personalizedReason: `${system.name} matters for a ${niche || archetype.label.toLowerCase()} business because ${system.why.toLowerCase()}`,
      priority: system.priority,
      estimatedImpact: system.estimatedImpact,
    }));

  return {
    strategicSummary: `For a ${niche || archetype.label} business in the ${stage} stage, the fastest path is to activate the trust and acquisition systems that match your ${goal || "growth"} goal, then layer retention and optimization on top.`,
    firstAction: `Activate ${prioritized[0]?.slug?.replace(/_/g, " ") || "your website"} today and make it your main conversion path for ${niche || archetype.label.toLowerCase()}.`,
    milestones: {
      day30: "Launch the core acquisition and conversion systems with niche-specific messaging and at least one live offer.",
      day60: "Have follow-up, trust, and conversion systems running together so leads are being captured and nurtured consistently.",
      day90: "Be optimizing the top channels, tracking conversions clearly, and scaling the highest-performing workflow with confidence.",
    },
    prioritizedSystems: prioritized,
  };
}
