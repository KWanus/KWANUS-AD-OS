import { NicheIntelligence } from "./competitorResearch";

export function enrichPromptWithResearch(
  basePrompt: string,
  intelligence: NicheIntelligence
): string {
  const sections: string[] = [basePrompt];

  sections.push(`\n\n--- COMPETITOR INTELLIGENCE (${intelligence.competitorsScanned} sites analyzed) ---`);

  if (intelligence.messagingPatterns) {
    const mp = intelligence.messagingPatterns;
    sections.push(`
MESSAGING PATTERNS:
- Headlines used by competitors: ${mp.headlines.join("; ")}
- Common angles: ${mp.commonAngles.join(", ")}
- Tone: ${mp.toneDescriptor}
INSTRUCTION: Beat their messaging. Be more specific, more benefit-driven, more unique.`);
  }

  if (intelligence.audienceInsights) {
    const ai = intelligence.audienceInsights;
    sections.push(`
AUDIENCE INTELLIGENCE:
- Primary audience: ${ai.primaryAudience}
- Pain points they address: ${ai.painPoints.join("; ")}
- Desires they promise: ${ai.desires.join("; ")}
- Buying triggers: ${ai.buyingTriggers.join("; ")}
- Common objections: ${ai.commonObjections.join("; ")}
INSTRUCTION: Address ALL these pains and desires. Overcome ALL these objections pre-emptively.`);
  }

  if (intelligence.conversionPatterns) {
    const cp = intelligence.conversionPatterns;
    sections.push(`
CONVERSION PATTERNS:
- CTA approaches: ${cp.ctaStyles.join("; ")}
- Urgency used: ${cp.urgencyTactics.join("; ")}
- Offer structures: ${cp.offerStructures.join("; ")}
INSTRUCTION: Use stronger CTAs with more urgency and better offers than competitors.`);
  }

  if (intelligence.sectionStructure) {
    const ss = intelligence.sectionStructure;
    sections.push(`
SECTION STRUCTURE:
- Competitors use this order: ${ss.commonOrder.join(" → ")}
- Must-have sections: ${ss.mustHaveSections.join(", ")}
- Differentiator sections (stand out with these): ${ss.differentiators.join(", ")}
INSTRUCTION: Include all must-have sections. Add differentiator sections to stand out.`);
  }

  if (intelligence.trustApproaches) {
    const ta = intelligence.trustApproaches;
    sections.push(`
TRUST ELEMENTS:
- Common: ${ta.commonElements.join("; ")}
- Social proof types: ${ta.socialProofTypes.join("; ")}
- Guarantee types: ${ta.guaranteeTypes.join("; ")}
INSTRUCTION: Include MORE trust signals than competitors. Layer social proof + guarantees.`);
  }

  if (intelligence.opportunities) {
    const opp = intelligence.opportunities;
    sections.push(`
COMPETITIVE GAPS (exploit these):
- Gaps nobody fills: ${opp.gaps.join("; ")}
- Common weaknesses: ${opp.weaknesses.join("; ")}
- Differentiation angles: ${opp.differentiationAngles.join("; ")}
INSTRUCTION: Fill these gaps. Avoid their weaknesses. Use these differentiation angles.`);
  }

  if (intelligence.pricingIntel) {
    const pi = intelligence.pricingIntel;
    if (pi.pricePoints.length > 0) {
      sections.push(`
PRICING CONTEXT:
- Market prices: ${pi.pricePoints.join(", ")}
- Models: ${pi.pricingModels.join(", ")}
- Anchoring: ${pi.anchoringTactics.join("; ")}`);
    }
  }

  sections.push(`\n--- END COMPETITOR INTELLIGENCE ---`);

  return sections.join("\n");
}

export function deriveTemplateFromResearch(intelligence: NicheIntelligence): string {
  const niche = intelligence.niche.toLowerCase();
  const sections = intelligence.sectionStructure?.mustHaveSections ?? [];
  const hasEcommerce = sections.some(s => s.toLowerCase().includes("product") || s.toLowerCase().includes("shop"));
  const hasPricing = sections.some(s => s.toLowerCase().includes("pricing") || s.toLowerCase().includes("plan"));

  if (hasEcommerce || niche.includes("shop") || niche.includes("store") || niche.includes("ecommerce")) {
    return "ecommerce";
  }
  if (hasPricing || niche.includes("saas") || niche.includes("software") || niche.includes("app")) {
    return "saas";
  }
  if (niche.includes("coach") || niche.includes("consult") || niche.includes("agency")) {
    return "service";
  }
  if (niche.includes("course") || niche.includes("training") || niche.includes("education")) {
    return "course";
  }
  if (niche.includes("restaurant") || niche.includes("food") || niche.includes("cafe")) {
    return "local";
  }
  return "conversion";
}

export function buildResearchEnrichedSections(intelligence: NicheIntelligence): string[] {
  const base = ["hero", "trust_badges"];
  const structure = intelligence.sectionStructure;

  if (structure?.mustHaveSections) {
    const mapped = structure.mustHaveSections.map(s => {
      const lower = s.toLowerCase();
      if (lower.includes("hero")) return "hero";
      if (lower.includes("feature") || lower.includes("benefit")) return "features";
      if (lower.includes("testimonial") || lower.includes("review")) return "testimonials";
      if (lower.includes("pricing") || lower.includes("plan")) return "pricing";
      if (lower.includes("faq") || lower.includes("question")) return "faq";
      if (lower.includes("process") || lower.includes("how it works") || lower.includes("step")) return "process";
      if (lower.includes("guarantee")) return "guarantee";
      if (lower.includes("cta") || lower.includes("call to action")) return "cta";
      if (lower.includes("stat") || lower.includes("number")) return "stats";
      if (lower.includes("before") || lower.includes("after") || lower.includes("comparison")) return "before_after";
      return null;
    }).filter((s) => s !== null) as string[];

    const unique = [...new Set([...base, ...mapped])];
    if (!unique.includes("cta")) unique.push("cta");
    if (!unique.includes("footer")) unique.push("footer");
    return unique;
  }

  return [...base, "features", "stats", "testimonials", "process", "pricing", "faq", "guarantee", "cta", "footer"];
}
