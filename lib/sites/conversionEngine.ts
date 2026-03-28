import Anthropic from "@anthropic-ai/sdk";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeInput } from "@/src/logic/ad-os/normalizeInput";
import { fetchPage } from "@/src/logic/ad-os/fetchPage";
import { extractSignals } from "@/src/logic/ad-os/extractSignals";
import type { Block } from "@/components/site-builder/BlockRenderer";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type GenerationEntryMode = "scan_improve" | "from_scratch";
export type ExecutionTier = "core" | "elite";
export type PageTemplateId =
  | "local-service-v1"
  | "booking-v1"
  | "high-ticket-service-v1"
  | "emergency-service-v1"
  | "medical-aesthetic-v1"
  | "brand-landing-v1";

type SectionType = "problem" | "solution" | "benefits" | "trust" | "process" | "faq" | "cta";

type TemplateSection = {
  type: SectionType;
  variant: string;
  maxItems?: number;
};

export type SiteInput = {
  mode: GenerationEntryMode;
  executionTier: ExecutionTier;
  businessName: string;
  niche: string;
  location: string;
  tone?: string;
  notes?: string;
  currentSite?: {
    url: string;
    title: string;
    metaDescription: string;
    headings: string[];
    ctas: string[];
    images: string[];
    bodyText: string;
    trustSignals: string[];
    extractedBenefits: string[];
    sectionOrder: string[];
  };
};

export type ConversionAnalysis = {
  issues: {
    conversion: string[];
    trust: string[];
    copy: string[];
    layout: string[];
  };
  quickWins: string[];
  recommendedPageType: string;
  scores: {
    offerClarity: number;
    trust: number;
    ctaStrength: number;
    localRelevance: number;
    emotionalClarity: number;
    sectionCompleteness: number;
  };
};

export type BusinessProfile = {
  primaryAudience: string;
  pains: string[];
  desires: string[];
  objections: string[];
  urgencyTriggers: string[];
  trustTriggers: string[];
  positioningAngle: string;
  offerAngle: string;
  primaryCta: string;
  secondaryCta: string;
};

export type SiteBlueprintSection = {
  type: SectionType;
  variant: string;
  headline: string;
  body?: string;
  items?: string[] | { question: string; answer: string }[];
  steps?: string[];
  primary_cta?: string;
};

export type SiteBlueprint = {
  page_type: string;
  template_id: PageTemplateId;
  seo: {
    title: string;
    meta_description: string;
  };
  brand: {
    business_name: string;
    tone: string;
    color_direction: string;
    style_direction: string;
  };
  hero: {
    headline: string;
    subheadline: string;
    primary_cta: string;
    secondary_cta: string;
  };
  sections: SiteBlueprintSection[];
  conversion_notes: {
    primary_goal: string;
    trust_elements_used: string[];
    objections_addressed: string[];
  };
  generation_trace: {
    mode: GenerationEntryMode;
    template_reason: string;
    analysis_summary: string[];
  };
  score: {
    clarity: number;
    trust: number;
    urgency: number;
    localRelevance: number;
    ctaStrength: number;
    sectionCompleteness: number;
    overall: number;
  };
};

export type SiteCreationResult = {
  site: {
    id: string;
    name: string;
    slug: string;
    published: boolean;
  };
  blueprint: SiteBlueprint;
};

export type SiteGenerationMetadata = {
  sourceMode: GenerationEntryMode | "scan_clone";
  executionTier: ExecutionTier;
  sourceUrl?: string;
  sourceTitle?: string;
  sourceHeadings?: string[];
  sourceCtas?: string[];
  sourceImages?: string[];
  businessName: string;
  niche: string;
  location: string;
  templateId: PageTemplateId;
  pageType: string;
  createdPages?: { title: string; slug: string }[];
  blueprintScore: SiteBlueprint["score"];
  conversionNotes: SiteBlueprint["conversion_notes"];
  generationTrace: SiteBlueprint["generation_trace"];
};

type SectionContext = {
  input: SiteInput;
  analysis: ConversionAnalysis;
  businessProfile: BusinessProfile;
  templateId: PageTemplateId;
  pageType: string;
};

type RenderBlock = {
  id: string;
  type: string;
  props: Record<string, unknown>;
};

type GeneratedPageDefinition = {
  title: string;
  slug: string;
  order: number;
  seoTitle: string;
  seoDesc: string;
  blocks: RenderBlock[];
};

const TEMPLATE_LIBRARY: Record<PageTemplateId, { pageType: string; reason: string; sections: TemplateSection[] }> = {
  "local-service-v1": {
    pageType: "local_service_lead_gen",
    reason: "Best for local service businesses that need a clear call/quote funnel with proof, process, and local trust.",
    sections: [
      { type: "problem", variant: "pain_points" },
      { type: "benefits", variant: "three_column", maxItems: 3 },
      { type: "trust", variant: "badges_testimonials", maxItems: 4 },
      { type: "process", variant: "three_steps", maxItems: 3 },
      { type: "faq", variant: "accordion", maxItems: 4 },
      { type: "cta", variant: "form_split" },
    ],
  },
  "booking-v1": {
    pageType: "appointment_booking",
    reason: "Best for consultative businesses where the primary goal is booking a consultation or appointment.",
    sections: [
      { type: "solution", variant: "authority_intro" },
      { type: "benefits", variant: "three_column", maxItems: 3 },
      { type: "trust", variant: "proof_bar", maxItems: 4 },
      { type: "process", variant: "booking_steps", maxItems: 3 },
      { type: "faq", variant: "accordion", maxItems: 4 },
      { type: "cta", variant: "calendar_split" },
    ],
  },
  "high-ticket-service-v1": {
    pageType: "high_ticket_service",
    reason: "Best for expert-led service offers that need stronger positioning, authority, and objection handling.",
    sections: [
      { type: "problem", variant: "stakes_and_cost" },
      { type: "solution", variant: "positioning" },
      { type: "trust", variant: "authority_proof", maxItems: 4 },
      { type: "benefits", variant: "three_column", maxItems: 3 },
      { type: "faq", variant: "objection_handling", maxItems: 5 },
      { type: "cta", variant: "consultation_offer" },
    ],
  },
  "emergency-service-v1": {
    pageType: "emergency_service",
    reason: "Best for urgent-response service businesses where speed, reassurance, and direct CTA matter most.",
    sections: [
      { type: "problem", variant: "urgent_pain" },
      { type: "trust", variant: "fast_response", maxItems: 4 },
      { type: "benefits", variant: "rapid_relief", maxItems: 3 },
      { type: "process", variant: "rapid_dispatch", maxItems: 3 },
      { type: "faq", variant: "emergency_questions", maxItems: 4 },
      { type: "cta", variant: "call_now" },
    ],
  },
  "medical-aesthetic-v1": {
    pageType: "medical_aesthetic_lead_gen",
    reason: "Best for clinics, med spas, and aesthetic offers that need trust, outcomes, and appointment flow.",
    sections: [
      { type: "solution", variant: "outcome_led" },
      { type: "trust", variant: "credibility_bar", maxItems: 4 },
      { type: "benefits", variant: "results_grid", maxItems: 3 },
      { type: "process", variant: "client_journey", maxItems: 3 },
      { type: "faq", variant: "treatment_objections", maxItems: 5 },
      { type: "cta", variant: "booking_split" },
    ],
  },
  "brand-landing-v1": {
    pageType: "brand_landing_page",
    reason: "Best for general brand and product-style pages that need a clean story, benefit stack, and CTA rhythm.",
    sections: [
      { type: "problem", variant: "market_gap" },
      { type: "solution", variant: "brand_solution" },
      { type: "benefits", variant: "feature_benefit_grid", maxItems: 3 },
      { type: "trust", variant: "logos_reviews", maxItems: 4 },
      { type: "faq", variant: "accordion", maxItems: 4 },
      { type: "cta", variant: "offer_close" },
    ],
  },
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function parseJsonObject<T>(text: string): T | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export async function buildSiteInputFromScan(input: {
  businessName?: string;
  niche?: string;
  location?: string;
  url: string;
  executionTier?: ExecutionTier;
  notes?: string;
}): Promise<SiteInput> {
  const normalized = normalizeInput(input.url, "consultant");
  if (!normalized.valid) {
    throw new Error(normalized.error ?? "Invalid URL");
  }

  const page = await fetchPage(normalized.url);
  const signals = extractSignals(page);
  const parsedUrl = new URL(normalized.url);
  const businessName =
    input.businessName?.trim() ||
    page.title.split(/[-|]/)[0].trim() ||
    signals.productName ||
    titleCase(parsedUrl.hostname.replace(/^www\./, "").split(".")[0].replace(/[-_]/g, " "));
  const niche = input.niche?.trim() || titleCase(signals.audienceHints[0] || "Local Service");
  const location = input.location?.trim() || "Local Market";

  return {
    mode: "scan_improve",
    executionTier: input.executionTier ?? "core",
    businessName,
    niche,
    location,
    notes: input.notes,
    currentSite: {
      url: normalized.url,
      title: page.title,
      metaDescription: page.metaDescription,
      headings: page.headings,
      ctas: page.ctas,
      images: page.images,
      bodyText: page.bodyText,
      trustSignals: signals.trustSignals,
      extractedBenefits: signals.benefits,
      sectionOrder: page.headings.map((heading) => heading.toLowerCase()),
    },
  };
}

export function buildSiteInputFromScratch(input: {
  businessName: string;
  niche: string;
  location: string;
  executionTier?: ExecutionTier;
  tone?: string;
  notes?: string;
}): SiteInput {
  if (!input.businessName.trim()) throw new Error("Business name is required");
  if (!input.niche.trim()) throw new Error("Niche is required");
  if (!input.location.trim()) throw new Error("Location is required");

  return {
    mode: "from_scratch",
    executionTier: input.executionTier ?? "core",
    businessName: input.businessName.trim(),
    niche: input.niche.trim(),
    location: input.location.trim(),
    tone: input.tone?.trim(),
    notes: input.notes?.trim(),
  };
}

export function inferSiteInputFromPageContext(input: {
  siteName: string;
  pageTitle: string;
  blocks: Block[];
  notes?: string;
}): SiteInput {
  const textChunks = input.blocks.flatMap((block) => {
    if (block.type === "hero") {
      return [
        String(block.props.headline ?? ""),
        String(block.props.subheadline ?? ""),
        String(block.props.buttonText ?? ""),
      ];
    }
    if (block.type === "cta") {
      return [
        String(block.props.headline ?? ""),
        String(block.props.subheadline ?? ""),
        String(block.props.buttonText ?? ""),
      ];
    }
    if (block.type === "features") {
      return [
        String(block.props.title ?? ""),
        ...(Array.isArray(block.props.items)
          ? block.props.items.flatMap((item) => [
              String((item as { title?: string }).title ?? ""),
              String((item as { body?: string }).body ?? ""),
            ])
          : []),
      ];
    }
    if (block.type === "faq") {
      return [
        String(block.props.title ?? ""),
        ...(Array.isArray(block.props.items)
          ? block.props.items.flatMap((item) => [
              String((item as { q?: string }).q ?? ""),
              String((item as { a?: string }).a ?? ""),
            ])
          : []),
      ];
    }
    if (block.type === "testimonials") {
      return [
        String(block.props.title ?? ""),
        ...(Array.isArray(block.props.items)
          ? block.props.items.flatMap((item) => [
              String((item as { quote?: string }).quote ?? ""),
              String((item as { role?: string }).role ?? ""),
            ])
          : []),
      ];
    }
    if (block.type === "trust_badges") {
      return [
        String(block.props.title ?? ""),
        ...(Array.isArray(block.props.badges)
          ? block.props.badges.map((badge) => String((badge as { label?: string }).label ?? ""))
          : []),
      ];
    }
    if (block.type === "text") {
      return [String(block.props.content ?? "")];
    }
    return [];
  }).filter(Boolean);

  const combined = textChunks.join(" ");
  const title = input.pageTitle === "Home" ? input.siteName : `${input.siteName} ${input.pageTitle}`;
  const lower = combined.toLowerCase();
  const locationMatch =
    combined.match(/\b([A-Z][a-z]+(?:,\s?[A-Z]{2})?)\b/) ||
    combined.match(/\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/);
  const location = locationMatch?.[1] ?? "Local Market";
  const niche = /dent|dental/i.test(combined)
    ? "Dental"
    : /roof/i.test(combined)
      ? "Roofing"
      : /spa|med spa|aesthetic/i.test(combined)
        ? "Medical Aesthetic"
        : /law|attorney/i.test(combined)
          ? "Law Firm"
          : /book|consultation|appointment/i.test(lower)
            ? "Consultation Service"
            : "Local Service";

  const signals = extractSignals({
    ok: true,
    title,
    metaDescription: "",
    headings: textChunks.slice(0, 12),
    bodyText: combined,
    ctas: input.blocks.flatMap((block) => {
      if (block.type === "hero" || block.type === "cta") {
        return [String(block.props.buttonText ?? ""), String(block.props.secondaryButtonText ?? "")]
          .filter(Boolean);
      }
      return [];
    }),
    images: [],
  });

  return {
    mode: "from_scratch",
    executionTier: "core",
    businessName: input.siteName,
    niche,
    location,
    notes: input.notes,
    currentSite: {
      url: "",
      title,
      metaDescription: "",
      headings: textChunks.slice(0, 12),
      ctas: [signals.ctaText, ...input.blocks.flatMap((block) => {
        if (block.type === "cta") return [String(block.props.buttonText ?? "")];
        return [];
      })].filter(Boolean),
      images: [],
      bodyText: combined,
      trustSignals: signals.trustSignals,
      extractedBenefits: signals.benefits,
      sectionOrder: input.blocks.map((block) => block.type),
    },
  };
}

export function analyzeConversionInput(input: SiteInput): ConversionAnalysis {
  const headings = input.currentSite?.headings ?? [];
  const ctas = input.currentSite?.ctas ?? [];
  const trustSignals = input.currentSite?.trustSignals ?? [];
  const bodyText = input.currentSite?.bodyText ?? "";
  const lowerBody = bodyText.toLowerCase();

  const offerClarity = input.currentSite ? Math.min(100, 35 + headings.length * 8 + (ctas.length > 0 ? 10 : 0)) : 72;
  const trust = input.currentSite ? Math.min(100, 30 + trustSignals.length * 12) : 68;
  const ctaStrength = input.currentSite ? Math.min(100, 30 + ctas.length * 14) : 74;
  const localRelevance = (lowerBody.includes(input.location.toLowerCase()) || headings.some((heading) => heading.toLowerCase().includes(input.location.toLowerCase())))
    ? 78
    : input.mode === "scan_improve"
      ? 46
      : 72;
  const emotionalClarity = input.currentSite
    ? (/(fast|trusted|same day|free|book|call|quote|results|relief|confidence)/i.test(bodyText) ? 62 : 42)
    : 75;
  const sectionCompleteness = input.currentSite ? Math.min(100, 30 + headings.length * 6 + trustSignals.length * 5) : 80;

  const issues = {
    conversion: [] as string[],
    trust: [] as string[],
    copy: [] as string[],
    layout: [] as string[],
  };

  if (offerClarity < 65) issues.conversion.push("The offer is not clear enough in the first screen.");
  if (ctaStrength < 65) issues.conversion.push("Calls to action are weak, sparse, or too generic.");
  if (trust < 65) issues.trust.push("The page lacks enough proof, authority, or reassurance to reduce doubt.");
  if (localRelevance < 65) issues.copy.push("The messaging is not locally anchored enough for the market being served.");
  if (emotionalClarity < 65) issues.copy.push("The copy is not naming pains and outcomes clearly enough.");
  if (sectionCompleteness < 65) issues.layout.push("The page structure is missing key conversion sections or flow.");
  if (input.mode === "scan_improve" && !(headings.some((heading) => /faq/i.test(heading)))) {
    issues.layout.push("The current site is missing FAQ or objection handling.");
  }
  if (input.mode === "scan_improve" && !trustSignals.length) {
    issues.trust.push("The current site shows little to no visible trust language.");
  }

  const recommendedPageType = selectTemplateId(input).pageType;

  return {
    issues,
    quickWins: [
      "Strengthen the hero outcome and CTA above the fold.",
      "Add visible trust proof earlier in the page.",
      "Make the page more specific to the niche and location.",
      "Use a tighter section sequence with fewer generic paragraphs.",
    ],
    recommendedPageType,
    scores: {
      offerClarity,
      trust,
      ctaStrength,
      localRelevance,
      emotionalClarity,
      sectionCompleteness,
    },
  };
}

export function buildBusinessProfile(input: SiteInput, analysis: ConversionAnalysis): BusinessProfile {
  const niche = input.niche.toLowerCase();
  const isEmergency = /emergency|locksmith|restoration|hvac|plumbing/.test(niche);
  const isMedical = /med spa|spa|clinic|aesthetic|medical|dental|dentist/.test(niche);
  const isConsultative = /consult|agency|law|coach|advisor|therapy/.test(niche);

  const primaryAudience = isMedical
    ? `People in ${input.location} who want expert care and visible outcomes`
    : isConsultative
      ? `Buyers in ${input.location} who want expert help and a low-risk next step`
      : `People in ${input.location} who need a reliable ${input.niche} provider`;

  const pains = isEmergency
    ? ["They need help fast", "They are stressed and want clarity", "They do not want to call the wrong company"]
    : isMedical
      ? ["They want reassurance before booking", "They worry about quality and safety", "They need to trust the provider before committing"]
      : ["They want the job done right", "They do not want delays or surprises", "They need confidence before reaching out"];

  const desires = isMedical
    ? ["Feel safe booking", "See clear outcomes", "Trust the process before they inquire"]
    : isConsultative
      ? ["Understand the value fast", "Trust the expertise", "Take an easy first step"]
      : ["Get quick help", "Work with a trusted local expert", "Know exactly what happens next"];

  const objections = [
    "How do I know you are trustworthy?",
    "What happens after I contact you?",
    "Is this worth the time and money?",
  ];

  const urgencyTriggers = isEmergency
    ? ["Fast response", "Same-day help", "Immediate relief"]
    : ["Limited availability", "Quick response", "Avoid waiting longer than necessary"];

  const trustTriggers = [
    `Local relevance in ${input.location}`,
    "Clear process",
    "Visible proof and testimonials",
    "Professional credibility markers",
  ];

  return {
    primaryAudience,
    pains,
    desires,
    objections,
    urgencyTriggers,
    trustTriggers,
    positioningAngle: isConsultative
      ? `The trusted ${input.niche} expert in ${input.location} with a clearer path to results`
      : `The reliable ${input.niche} choice in ${input.location}`,
    offerAngle: isEmergency
      ? `Fast, reassuring, action-first help for ${input.location}`
      : `A lower-friction way to choose the right ${input.niche} provider in ${input.location}`,
    primaryCta: isConsultative || isMedical ? "Book Your Consultation" : isEmergency ? "Call Now" : "Request a Quote",
    secondaryCta: "See How It Works",
  };
}

function selectTemplateId(input: SiteInput): { id: PageTemplateId; pageType: string; reason: string; sections: TemplateSection[] } {
  const niche = input.niche.toLowerCase();

  if (/emergency|locksmith|restoration|hvac|plumbing/.test(niche)) {
    const template = TEMPLATE_LIBRARY["emergency-service-v1"];
    return { id: "emergency-service-v1", ...template };
  }
  if (/med spa|spa|clinic|aesthetic|medical|dental|dentist/.test(niche)) {
    const template = TEMPLATE_LIBRARY["medical-aesthetic-v1"];
    return { id: "medical-aesthetic-v1", ...template };
  }
  if (/consult|agency|law|coach|advisor|therapy/.test(niche)) {
    const template = TEMPLATE_LIBRARY["high-ticket-service-v1"];
    return { id: "high-ticket-service-v1", ...template };
  }
  if (/book|appointment|consultation/.test((input.notes || "").toLowerCase())) {
    const template = TEMPLATE_LIBRARY["booking-v1"];
    return { id: "booking-v1", ...template };
  }
  if (/brand|product|ecommerce|store/.test(niche)) {
    const template = TEMPLATE_LIBRARY["brand-landing-v1"];
    return { id: "brand-landing-v1", ...template };
  }

  const template = TEMPLATE_LIBRARY["local-service-v1"];
  return { id: "local-service-v1", ...template };
}

function fallbackHero(context: SectionContext) {
  const benefit = context.businessProfile.desires[0] || `Get better ${context.input.niche} results`;
  const audience = context.businessProfile.primaryAudience;
  return {
    headline: context.input.mode === "scan_improve"
      ? `${context.input.businessName}, rebuilt to convert better in ${context.input.location}`
      : `${titleCase(context.input.businessName)} for ${audience}`,
    subheadline: context.input.mode === "scan_improve"
      ? `A clearer, more trustworthy ${context.input.niche} site built from the existing business and improved around stronger CTA, trust, and local relevance.`
      : `A conversion-first ${context.input.niche} site built from scratch for ${context.input.location}, focused on ${benefit.toLowerCase()}.`,
    primary_cta: context.businessProfile.primaryCta,
    secondary_cta: context.businessProfile.secondaryCta,
  };
}

function fallbackSection(section: TemplateSection, context: SectionContext): SiteBlueprintSection {
  switch (section.type) {
    case "problem":
      return {
        type: "problem",
        variant: section.variant,
        headline: `Why most ${context.input.niche} sites in ${context.input.location} lose conversions`,
        body: `Visitors leave when the offer is vague, the proof is thin, and the next step is unclear. This version fixes that by making the value, trust, and action path obvious from the start.`,
      };
    case "solution":
      return {
        type: "solution",
        variant: section.variant,
        headline: `A clearer way to choose ${context.input.businessName}`,
        body: `${context.businessProfile.positioningAngle}. This page is designed to answer doubts quickly, make the offer feel specific, and guide people to the next step without friction.`,
      };
    case "benefits":
      return {
        type: "benefits",
        variant: section.variant,
        headline: `Why people in ${context.input.location} choose ${context.input.businessName}`,
        items: [
          context.businessProfile.desires[0] || "Clearer outcomes",
          context.businessProfile.desires[1] || "More confidence before reaching out",
          context.businessProfile.desires[2] || "A simpler next step",
        ].slice(0, section.maxItems ?? 3),
      };
    case "trust":
      return {
        type: "trust",
        variant: section.variant,
        headline: "Proof that reduces doubt fast",
        items: [
          ...context.businessProfile.trustTriggers,
          ...(context.input.currentSite?.trustSignals ?? []),
        ].slice(0, section.maxItems ?? 4),
      };
    case "process":
      return {
        type: "process",
        variant: section.variant,
        headline: "What happens next",
        steps: [
          `Reach out to ${context.input.businessName}`,
          "Get a clear recommendation and next-step plan",
          "Move forward with confidence",
        ].slice(0, section.maxItems ?? 3),
      };
    case "faq":
      return {
        type: "faq",
        variant: section.variant,
        headline: "Questions people ask before they contact you",
        items: context.businessProfile.objections.slice(0, section.maxItems ?? 4).map((question) => ({
          question,
          answer: `This page is structured to answer that clearly and reduce hesitation before the visitor takes action.`,
        })),
      };
    case "cta":
      return {
        type: "cta",
        variant: section.variant,
        headline: `Ready to take the next step with ${context.input.businessName}?`,
        body: `Use the call to action below to get a faster answer, clearer direction, and a lower-friction start.`,
        primary_cta: context.businessProfile.primaryCta,
      };
  }
}

async function generateHero(context: SectionContext) {
  if (!process.env.ANTHROPIC_API_KEY) return fallbackHero(context);

  const prompt = `You are writing only the hero section for a conversion-first website.
Business: ${context.input.businessName}
Niche: ${context.input.niche}
Location: ${context.input.location}
Mode: ${context.input.mode}
Audience: ${context.businessProfile.primaryAudience}
Pains: ${context.businessProfile.pains.join(", ")}
Desires: ${context.businessProfile.desires.join(", ")}
Primary CTA: ${context.businessProfile.primaryCta}
Secondary CTA: ${context.businessProfile.secondaryCta}
Current issues: ${Object.values(context.analysis.issues).flat().join(" | ") || "none"}
Reference images: ${context.input.currentSite?.images.join(" | ") || "none"}

Rules:
- Clear outcome
- Clear audience
- No vague fluff
- Local relevance where helpful
- Execution tier: ${context.input.executionTier}
- ${context.input.executionTier === "elite" ? "Write like the top-performing operator in this niche. Be sharper, more specific, more credible, and more expensive-feeling without sounding fake." : "Keep the hero clean, strong, and launch-ready."}
- ${context.input.mode === "scan_improve" ? "Elevate the source site. The result should feel more premium, clearer, and more conversion-focused than the original." : "Make the result feel premium and high-converting from scratch."}
- Return JSON only

Return:
{
  "headline": "",
  "subheadline": "",
  "primary_cta": "",
  "secondary_cta": ""
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 280,
    temperature: 0.6,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content.filter((item) => item.type === "text").map((item) => item.text).join("\n");
  return parseJsonObject<SiteBlueprint["hero"]>(text) ?? fallbackHero(context);
}

async function generateSection(section: TemplateSection, context: SectionContext): Promise<SiteBlueprintSection> {
  if (!process.env.ANTHROPIC_API_KEY) return fallbackSection(section, context);

  const sectionRules: Record<SectionType, string> = {
    problem: "Name the pain clearly, make it feel real, and connect it to the cost of not acting.",
    solution: "Position the business as the clear, trustworthy solution without sounding generic.",
    benefits: "List specific benefits tied to outcomes, not vague features.",
    trust: "Use reviews, guarantees, local proof, process clarity, or certifications to reduce doubt.",
    process: "Make the next steps feel simple, low-friction, and reassuring.",
    faq: "Answer objections that block conversion in a direct, useful way.",
    cta: "Create a strong final push with a visible next step and low-friction action.",
  };

  const prompt = `You are writing one section of a conversion-first website.
Business: ${context.input.businessName}
Niche: ${context.input.niche}
Location: ${context.input.location}
Template: ${context.templateId}
Page type: ${context.pageType}
Section type: ${section.type}
Variant: ${section.variant}
Mode: ${context.input.mode}
Audience: ${context.businessProfile.primaryAudience}
Pains: ${context.businessProfile.pains.join(", ")}
Desires: ${context.businessProfile.desires.join(", ")}
Objections: ${context.businessProfile.objections.join(", ")}
Trust triggers: ${context.businessProfile.trustTriggers.join(", ")}
Current site issues: ${Object.values(context.analysis.issues).flat().join(" | ") || "none"}
Current site headings: ${context.input.currentSite?.headings.join(" | ") || "none"}
Current site CTAs: ${context.input.currentSite?.ctas.join(" | ") || "none"}
Notes: ${context.input.notes || "none"}
Reference images: ${context.input.currentSite?.images.join(" | ") || "none"}

Rules for this section:
${sectionRules[section.type]}
${context.input.executionTier === "elite" ? "Push for top-1% execution: stronger specificity, tighter objection handling, more believable proof framing, and a more forceful CTA rhythm." : "Keep the section strong, clean, and conversion-oriented."}
${context.input.mode === "scan_improve" ? "You are improving an existing site. Do not merely paraphrase the source. Elevate it with stronger positioning, clearer CTA rhythm, better trust placement, and a more premium, top-1% feel for the niche." : ""}
Return JSON only.

Return one of these shapes:
Problem/Solution/CTA:
{ "headline": "", "body": "", "primary_cta": "" }
Benefits/Trust:
{ "headline": "", "items": ["", "", ""] }
Process:
{ "headline": "", "steps": ["", "", ""] }
FAQ:
{ "headline": "", "items": [{ "question": "", "answer": "" }] }`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 480,
    temperature: 0.65,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content.filter((item) => item.type === "text").map((item) => item.text).join("\n");
  const parsed = parseJsonObject<{
    headline?: string;
    body?: string;
    primary_cta?: string;
    items?: string[] | { question: string; answer: string }[];
    steps?: string[];
  }>(text);

  if (!parsed) return fallbackSection(section, context);

  return {
    type: section.type,
    variant: section.variant,
    headline: parsed.headline ?? fallbackSection(section, context).headline,
    body: parsed.body,
    primary_cta: parsed.primary_cta,
    items: parsed.items,
    steps: parsed.steps,
  };
}

function scoreBlueprint(blueprint: SiteBlueprint, input: SiteInput) {
  const heroText = `${blueprint.hero.headline} ${blueprint.hero.subheadline}`.toLowerCase();
  const trustSection = blueprint.sections.find((section) => section.type === "trust");
  const ctaSection = blueprint.sections.find((section) => section.type === "cta");
  const faqSection = blueprint.sections.find((section) => section.type === "faq");
  const processSection = blueprint.sections.find((section) => section.type === "process");
  const hasLocation = heroText.includes(input.location.toLowerCase()) || blueprint.sections.some((section) => section.headline.toLowerCase().includes(input.location.toLowerCase()));
  const trustDepth = trustSection && Array.isArray(trustSection.items) ? trustSection.items.length : 0;
  const faqDepth = faqSection && Array.isArray(faqSection.items) ? faqSection.items.length : 0;
  const processDepth = processSection?.steps?.length ?? 0;

  const clarity = /help|quote|book|call|get|trusted|results|expert|fast|clear/.test(heroText) ? 84 : 68;
  const trust = trustDepth >= (input.executionTier === "elite" ? 4 : 3) ? 84 : 62;
  const urgency = /now|today|fast|same-day|quick/.test(`${blueprint.hero.headline} ${ctaSection?.headline ?? ""}`.toLowerCase()) ? 80 : 64;
  const localRelevance = hasLocation ? 85 : 66;
  const ctaStrength = blueprint.hero.primary_cta && ctaSection?.primary_cta ? 86 : 60;
  const baseCompleteness = blueprint.sections.length >= TEMPLATE_LIBRARY[blueprint.template_id].sections.length ? 88 : 70;
  const depthBonus = input.executionTier === "elite" && faqDepth >= 4 && processDepth >= 3 ? 6 : 0;
  const sectionCompleteness = Math.min(96, baseCompleteness + depthBonus);

  return {
    clarity,
    trust,
    urgency,
    localRelevance,
    ctaStrength,
    sectionCompleteness,
    overall: average([
      clarity,
      trust,
      urgency,
      localRelevance,
      ctaStrength,
      sectionCompleteness,
      ...(input.executionTier === "elite" ? [faqDepth >= 4 ? 88 : 64] : []),
    ]),
  };
}

function improveWeakSections(blueprint: SiteBlueprint, input: SiteInput, businessProfile: BusinessProfile): SiteBlueprint {
  const next = structuredClone(blueprint);

  if (next.score.clarity < 72) {
    next.hero.headline = `${titleCase(input.businessName)} for people in ${input.location} who want a clearer next step`;
    next.hero.subheadline = `Built to make ${input.niche} feel more trustworthy, more specific, and easier to act on from the first screen.`;
  }

  if (next.score.trust < 72) {
    const trustSection = next.sections.find((section) => section.type === "trust");
    if (trustSection) {
      trustSection.items = [
        ...businessProfile.trustTriggers,
        "Clear local proof",
        "Stronger objection handling",
      ].slice(0, 4);
    }
  }

  if (next.score.ctaStrength < 72) {
    next.hero.primary_cta = businessProfile.primaryCta;
    const ctaSection = next.sections.find((section) => section.type === "cta");
    if (ctaSection) ctaSection.primary_cta = businessProfile.primaryCta;
  }

  next.score = scoreBlueprint(next, input);
  return next;
}

function ensureEliteDepth(blueprint: SiteBlueprint, input: SiteInput, businessProfile: BusinessProfile): SiteBlueprint {
  if (input.executionTier !== "elite") return blueprint;

  const next = structuredClone(blueprint);
  const trustSection = next.sections.find((section) => section.type === "trust");
  if (trustSection) {
    const current = Array.isArray(trustSection.items) ? trustSection.items.map((item) => String(item)) : [];
    trustSection.items = Array.from(new Set([
      ...current,
      ...businessProfile.trustTriggers,
      `${input.location} relevance`,
      "Clear process and expectations",
      "Low-friction next step",
    ])).slice(0, 6);
  }

  const faqSection = next.sections.find((section) => section.type === "faq");
  if (faqSection) {
    const current = Array.isArray(faqSection.items)
      ? faqSection.items.filter((item): item is { question: string; answer: string } => typeof item !== "string")
      : [];
    faqSection.items = [
      ...current,
      {
        question: `Why choose ${input.businessName} instead of another ${input.niche} option?`,
        answer: `Because the page positions ${input.businessName} around clearer proof, a simpler process, and a more obvious next step for people in ${input.location}.`,
      },
      {
        question: "What happens after I reach out?",
        answer: "The next step should feel simple, fast, and low-friction, with clear expectations instead of guesswork.",
      },
    ].slice(0, 5);
  }

  const processSection = next.sections.find((section) => section.type === "process");
  if (processSection) {
    const steps = processSection.steps ?? [];
    processSection.steps = Array.from(new Set([
      ...steps,
      "Get a clear recommendation and next-step plan",
    ])).slice(0, 4);
  }

  next.conversion_notes.trust_elements_used = Array.from(new Set([
    ...next.conversion_notes.trust_elements_used,
    "Stronger objection handling",
    "Higher-trust reassurance",
  ])).slice(0, 5);
  next.generation_trace.analysis_summary = Array.from(new Set([
    ...next.generation_trace.analysis_summary,
    "Elite execution tier added extra trust, objection handling, and depth.",
  ])).slice(0, 5);
  next.score = scoreBlueprint(next, input);
  return next;
}

export async function generateConversionSiteBlueprint(input: SiteInput): Promise<{
  input: SiteInput;
  analysis: ConversionAnalysis;
  businessProfile: BusinessProfile;
  blueprint: SiteBlueprint;
}> {
  const analysis = analyzeConversionInput(input);
  const businessProfile = buildBusinessProfile(input, analysis);
  const template = selectTemplateId(input);

  const context: SectionContext = {
    input,
    analysis,
    businessProfile,
    templateId: template.id,
    pageType: template.pageType,
  };

  const hero = await generateHero(context).catch(() => fallbackHero(context));
  const sections: SiteBlueprintSection[] = [];
  for (const section of template.sections) {
    sections.push(await generateSection(section, context).catch(() => fallbackSection(section, context)));
  }

  let blueprint: SiteBlueprint = {
    page_type: template.pageType,
    template_id: template.id,
    seo: {
      title: `${input.businessName} | ${input.niche} in ${input.location}`,
      meta_description: `${input.businessName} helps people in ${input.location} with ${input.niche}. Clear offer, stronger trust, and a focused next step.`,
    },
    brand: {
      business_name: input.businessName,
      tone: input.tone || "Clear, confident, trustworthy",
      color_direction: template.id === "medical-aesthetic-v1" ? "clean clinical neutrals with refined contrast" : "modern high-contrast trust-first palette",
      style_direction: template.id === "brand-landing-v1" ? "modern brand landing page" : "conversion-focused service page",
    },
    hero,
    sections,
    conversion_notes: {
      primary_goal: businessProfile.primaryCta,
      trust_elements_used: businessProfile.trustTriggers.slice(0, 3),
      objections_addressed: businessProfile.objections.slice(0, 3),
    },
    generation_trace: {
      mode: input.mode,
      template_reason: template.reason,
      analysis_summary: [
        ...analysis.quickWins.slice(0, 2),
        ...Object.values(analysis.issues).flat().slice(0, 2),
      ],
    },
    score: {
      clarity: 0,
      trust: 0,
      urgency: 0,
      localRelevance: 0,
      ctaStrength: 0,
      sectionCompleteness: 0,
      overall: 0,
    },
  };

  blueprint.score = scoreBlueprint(blueprint, input);

  if (blueprint.score.overall < 75) {
    blueprint = improveWeakSections(blueprint, input, businessProfile);
  }

  if (input.executionTier === "elite") {
    blueprint = ensureEliteDepth(blueprint, input, businessProfile);
  }

  return { input, analysis, businessProfile, blueprint };
}

export function renderBlueprintToBlocks(blueprint: SiteBlueprint, options?: { referenceImages?: string[]; elevateVisuals?: boolean }): RenderBlock[] {
  const blocks: RenderBlock[] = [];
  const referenceImages = options?.referenceImages ?? [];

  blocks.push({
    id: crypto.randomUUID(),
    type: "urgency",
    props: {
      text: `Conversion Blueprint | ${blueprint.page_type.replace(/_/g, " ")} | Score ${blueprint.score.overall}/100`,
    },
  });

  blocks.push({
    id: crypto.randomUUID(),
    type: "hero",
    props: {
      eyebrow: blueprint.brand.tone,
      headline: blueprint.hero.headline,
      subheadline: blueprint.hero.subheadline,
      buttonText: blueprint.hero.primary_cta,
      secondaryButtonText: blueprint.hero.secondary_cta,
      textAlign: "center",
      socialProofText: blueprint.conversion_notes.trust_elements_used.join(" • "),
      trustItems: blueprint.conversion_notes.objections_addressed,
      bgColor: "#020509",
    },
  });

  if (options?.elevateVisuals) {
    blocks.push({
      id: crypto.randomUUID(),
      type: "before_after",
      props: {
        title: "How this draft elevates the source site",
        beforeLabel: "Source Site",
        afterLabel: "Improved Draft",
        beforeItems: [
          "Generic positioning or weak first impression",
          "Less obvious trust and CTA rhythm",
          "Visual direction that may not feel premium enough",
        ],
        afterItems: [
          "Clearer promise and stronger first-screen story",
          "More visible trust, process, and action flow",
          "A more elevated, conversion-focused visual direction",
        ],
        bgColor: "#050a14",
      },
    });
  }

  if (referenceImages.length) {
    blocks.push({
      id: crypto.randomUUID(),
      type: "image",
      props: {
        src: referenceImages[0],
        alt: `${blueprint.brand.business_name} reference visual`,
        caption: options?.elevateVisuals
          ? "Source visual carried into the improved draft as creative direction."
          : "Reference image from the scanned site.",
        rounded: true,
        fullWidth: true,
      },
    });
  }

  if (options?.elevateVisuals && referenceImages.length > 1) {
    blocks.push({
      id: crypto.randomUUID(),
      type: "features",
      props: {
        eyebrow: "Visual Direction",
        title: "Source-inspired cues used in the upgraded build",
        subtitle: "These visuals help keep niche fit while the rest of the page gets sharper, cleaner, and more premium.",
        columns: Math.min(3, referenceImages.slice(0, 3).length),
        items: referenceImages.slice(0, 3).map((imageUrl, index) => ({
          icon: String(index + 1),
          title: index === 0 ? "Hero inspiration" : index === 1 ? "Supporting visual" : "Trust-building visual",
          body: imageUrl,
        })),
        layout: "list",
        bgColor: "#07101f",
      },
    });
  }

  for (const section of blueprint.sections) {
    switch (section.type) {
      case "problem":
      case "solution":
        blocks.push({
          id: crypto.randomUUID(),
          type: "text",
          props: {
            content: `## ${section.headline}\n\n${section.body ?? ""}`,
            bgColor: section.type === "problem" ? "#07101f" : "#050a14",
          },
        });
        break;
      case "benefits":
        blocks.push({
          id: crypto.randomUUID(),
          type: "features",
          props: {
            title: section.headline,
            columns: 3,
            layout: "grid",
            items: (Array.isArray(section.items) ? section.items : []).map((item) => ({ icon: "✓", title: String(item), body: "" })),
            bgColor: "#050a14",
          },
        });
        break;
      case "trust":
        blocks.push({
          id: crypto.randomUUID(),
          type: "trust_badges",
          props: {
            title: section.headline,
            badges: (Array.isArray(section.items) ? section.items : []).map((item) => ({ icon: "✅", label: String(item) })),
          },
        });
        break;
      case "process":
        blocks.push({
          id: crypto.randomUUID(),
          type: "process",
          props: {
            title: section.headline,
            steps: (section.steps ?? []).map((step, index) => ({
              icon: String(index + 1),
              title: step,
              body: "",
            })),
          },
        });
        break;
      case "faq":
        blocks.push({
          id: crypto.randomUUID(),
          type: "faq",
          props: {
            title: section.headline,
            items: (Array.isArray(section.items) ? section.items : []).map((item) =>
              typeof item === "string"
                ? { q: item, a: "" }
                : { q: item.question, a: item.answer }
            ),
            bgColor: "#050a14",
          },
        });
        break;
      case "cta":
        blocks.push({
          id: crypto.randomUUID(),
          type: "cta",
          props: {
            headline: section.headline,
            subheadline: section.body ?? "",
            buttonText: section.primary_cta ?? blueprint.hero.primary_cta,
            bgColor: "#020509",
          },
        });
        break;
    }
  }

  blocks.push({
    id: crypto.randomUUID(),
    type: "footer",
    props: {
      copyright: `© ${new Date().getFullYear()} ${blueprint.brand.business_name}. All rights reserved.`,
      links: [
        { label: "Privacy Policy", url: "#" },
        { label: "Terms", url: "#" },
      ],
      showPoweredBy: true,
    },
  });

  return blocks;
}

function extractStringItems(section?: SiteBlueprintSection) {
  if (!section || !Array.isArray(section.items)) return [];
  return section.items.filter((item): item is string => typeof item === "string");
}

function extractFaqItems(section?: SiteBlueprintSection) {
  if (!section || !Array.isArray(section.items)) return [];
  return section.items.filter((item): item is { question: string; answer: string } => typeof item !== "string");
}

function buildServicesPageBlocks(blueprint: SiteBlueprint): RenderBlock[] {
  const benefitsSection = blueprint.sections.find((section) => section.type === "benefits");
  const processSection = blueprint.sections.find((section) => section.type === "process");
  const trustSection = blueprint.sections.find((section) => section.type === "trust");
  const benefitItems = extractStringItems(benefitsSection);
  const trustItems = extractStringItems(trustSection);

  const blocks: RenderBlock[] = [
    {
      id: crypto.randomUUID(),
      type: "hero",
      props: {
        eyebrow: "Services",
        headline: `${blueprint.brand.business_name} services built to convert`,
        subheadline: `A clearer look at what ${blueprint.brand.business_name} helps with, how the process works, and why people feel confident taking the next step.`,
        buttonText: blueprint.hero.primary_cta,
        secondaryButtonText: "See FAQ",
        secondaryButtonUrl: "#faq",
        textAlign: "center",
        bgColor: "#020509",
      },
    },
  ];

  if (benefitItems.length) {
    blocks.push({
      id: crypto.randomUUID(),
      type: "features",
      props: {
        eyebrow: "What You Get",
        title: benefitsSection?.headline ?? `What ${blueprint.brand.business_name} helps you do`,
        subtitle: "Every service is positioned around outcomes, confidence, and a simpler path to action.",
        columns: Math.min(3, Math.max(1, benefitItems.length)),
        layout: "grid",
        items: benefitItems.slice(0, 6).map((item) => ({ icon: "✓", title: item, body: "" })),
        bgColor: "#050a14",
      },
    });
  }

  if (processSection?.steps?.length) {
    blocks.push({
      id: crypto.randomUUID(),
      type: "process",
      props: {
        title: processSection.headline || "How it works",
        steps: processSection.steps.slice(0, 5).map((step, index) => ({
          icon: String(index + 1),
          title: step,
          body: "",
        })),
      },
    });
  }

  if (trustItems.length) {
    blocks.push({
      id: crypto.randomUUID(),
      type: "trust_badges",
      props: {
        title: trustSection?.headline ?? "Why people trust this service",
        badges: trustItems.slice(0, 6).map((item) => ({ icon: "✅", label: item })),
      },
    });
  }

  blocks.push({
    id: crypto.randomUUID(),
    type: "cta",
    props: {
      headline: `Ready to move forward with ${blueprint.brand.business_name}?`,
      subheadline: "Use the next step below to get clarity, momentum, and a stronger path to results.",
      buttonText: blueprint.hero.primary_cta,
      bgColor: "#020509",
    },
  });

  blocks.push({
    id: crypto.randomUUID(),
    type: "footer",
    props: {
      copyright: `© ${new Date().getFullYear()} ${blueprint.brand.business_name}. All rights reserved.`,
      links: [
        { label: "Home", url: "#" },
        { label: "FAQ", url: "#faq" },
      ],
      showPoweredBy: true,
    },
  });

  return blocks;
}

function buildFaqPageBlocks(blueprint: SiteBlueprint): RenderBlock[] {
  const faqSection = blueprint.sections.find((section) => section.type === "faq");
  const trustSection = blueprint.sections.find((section) => section.type === "trust");
  const faqItems = extractFaqItems(faqSection);
  const trustItems = extractStringItems(trustSection);

  const blocks: RenderBlock[] = [
    {
      id: crypto.randomUUID(),
      type: "hero",
      props: {
        eyebrow: "FAQ",
        headline: `Questions people ask before choosing ${blueprint.brand.business_name}`,
        subheadline: "These answers are here to remove hesitation, explain the process, and make the next step feel easier.",
        buttonText: blueprint.hero.primary_cta,
        textAlign: "center",
        bgColor: "#020509",
      },
    },
  ];

  if (trustItems.length) {
    blocks.push({
      id: crypto.randomUUID(),
      type: "trust_badges",
      props: {
        title: "Confidence signals",
        badges: trustItems.slice(0, 5).map((item) => ({ icon: "✅", label: item })),
      },
    });
  }

  blocks.push({
    id: crypto.randomUUID(),
    type: "faq",
    props: {
      title: faqSection?.headline ?? "Frequently asked questions",
      items: faqItems.length
        ? faqItems.map((item) => ({ q: item.question, a: item.answer }))
        : [
            {
              q: `How do I get started with ${blueprint.brand.business_name}?`,
              a: "Use the call to action on this page and you will be guided into the best next step.",
            },
          ],
      bgColor: "#050a14",
    },
  });

  blocks.push({
    id: crypto.randomUUID(),
    type: "cta",
    props: {
      headline: `Still have a question before you ${blueprint.hero.primary_cta.toLowerCase()}?`,
      subheadline: "Reach out directly and get a clear answer without the usual friction.",
      buttonText: blueprint.hero.primary_cta,
      bgColor: "#020509",
    },
  });

  blocks.push({
    id: crypto.randomUUID(),
    type: "footer",
    props: {
      copyright: `© ${new Date().getFullYear()} ${blueprint.brand.business_name}. All rights reserved.`,
      links: [
        { label: "Home", url: "#" },
        { label: "Services", url: "#services" },
      ],
      showPoweredBy: true,
    },
  });

  return blocks;
}

function buildProofPageBlocks(blueprint: SiteBlueprint): RenderBlock[] {
  const trustSection = blueprint.sections.find((section) => section.type === "trust");
  const benefitSection = blueprint.sections.find((section) => section.type === "benefits");
  const trustItems = extractStringItems(trustSection);
  const benefitItems = extractStringItems(benefitSection);

  const blocks: RenderBlock[] = [
    {
      id: crypto.randomUUID(),
      type: "hero",
      props: {
        eyebrow: "Proof",
        headline: `Why buyers feel safer choosing ${blueprint.brand.business_name}`,
        subheadline: "This page collects the trust, reassurance, and value signals that help higher-intent visitors move forward with more confidence.",
        buttonText: blueprint.hero.primary_cta,
        secondaryButtonText: "See Services",
        secondaryButtonUrl: "#services",
        textAlign: "center",
        bgColor: "#020509",
      },
    },
  ];

  if (trustItems.length) {
    blocks.push({
      id: crypto.randomUUID(),
      type: "trust_badges",
      props: {
        title: trustSection?.headline ?? "Trust signals",
        badges: trustItems.slice(0, 6).map((item) => ({ icon: "✅", label: item })),
      },
    });
  }

  if (benefitItems.length) {
    blocks.push({
      id: crypto.randomUUID(),
      type: "features",
      props: {
        eyebrow: "Why it wins",
        title: `What makes ${blueprint.brand.business_name} the stronger choice`,
        subtitle: "Use this page to make the proof and advantages more explicit before the final ask.",
        columns: Math.min(3, Math.max(1, benefitItems.length)),
        layout: "grid",
        items: benefitItems.slice(0, 6).map((item) => ({ icon: "✓", title: item, body: "" })),
        bgColor: "#050a14",
      },
    });
  }

  blocks.push({
    id: crypto.randomUUID(),
    type: "guarantee",
    props: {
      title: "Reduce hesitation before the decision",
      body: "A stronger proof page makes the offer feel safer, more credible, and easier to act on.",
      badges: ["Visible trust", "Clearer credibility", "Lower-friction next step"],
    },
  });

  blocks.push({
    id: crypto.randomUUID(),
    type: "cta",
    props: {
      headline: `Ready to move forward with ${blueprint.brand.business_name}?`,
      subheadline: "Use the next step below to turn confidence into action.",
      buttonText: blueprint.hero.primary_cta,
      bgColor: "#020509",
    },
  });

  blocks.push({
    id: crypto.randomUUID(),
    type: "footer",
    props: {
      copyright: `© ${new Date().getFullYear()} ${blueprint.brand.business_name}. All rights reserved.`,
      links: [
        { label: "Home", url: "#" },
        { label: "Services", url: "#services" },
      ],
      showPoweredBy: true,
    },
  });

  return blocks;
}

function buildGeneratedPages(input: {
  blueprint: SiteBlueprint;
  executionTier?: ExecutionTier;
  referenceImages?: string[];
  elevateVisuals?: boolean;
}): GeneratedPageDefinition[] {
  const homeBlocks = renderBlueprintToBlocks(input.blueprint, {
    referenceImages: input.referenceImages,
    elevateVisuals: input.elevateVisuals,
  });

  const pages: GeneratedPageDefinition[] = [
    {
      title: "Home",
      slug: "home",
      order: 0,
      seoTitle: input.blueprint.seo.title,
      seoDesc: input.blueprint.seo.meta_description,
      blocks: homeBlocks,
    },
  ];

  const hasServiceContent = input.blueprint.sections.some((section) => section.type === "benefits" || section.type === "process" || section.type === "solution");
  if (hasServiceContent) {
    pages.push({
      title: "Services",
      slug: "services",
      order: 1,
      seoTitle: `${input.blueprint.brand.business_name} Services`,
      seoDesc: `Explore the services, process, and outcomes offered by ${input.blueprint.brand.business_name}.`,
      blocks: buildServicesPageBlocks(input.blueprint),
    });
  }

  const hasFaqContent = input.blueprint.sections.some((section) => section.type === "faq");
  if (hasFaqContent) {
    pages.push({
      title: "FAQ",
      slug: "faq",
      order: pages.length,
      seoTitle: `${input.blueprint.brand.business_name} FAQ`,
      seoDesc: `Answers to common questions about ${input.blueprint.brand.business_name}, the process, and the next step.`,
      blocks: buildFaqPageBlocks(input.blueprint),
    });
  }

  if (input.executionTier === "elite") {
    pages.push({
      title: "Proof",
      slug: "proof",
      order: pages.length,
      seoTitle: `${input.blueprint.brand.business_name} Proof`,
      seoDesc: `Trust, proof, and reassurance that help people choose ${input.blueprint.brand.business_name} with more confidence.`,
      blocks: buildProofPageBlocks(input.blueprint),
    });
  }

  return pages;
}

export async function createSiteFromBlueprint(input: {
  userId: string;
  siteName: string;
  description?: string;
  blueprint: SiteBlueprint;
  referenceImages?: string[];
  elevateVisuals?: boolean;
  generationMetadata?: SiteGenerationMetadata;
}): Promise<SiteCreationResult> {
  const baseSlug = slugify(input.siteName);
  let slug = baseSlug;
  let attempt = 1;
  while (await prisma.site.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  const pages = buildGeneratedPages({
    blueprint: input.blueprint,
    executionTier: input.generationMetadata?.executionTier ?? "core",
    referenceImages: input.referenceImages,
    elevateVisuals: input.elevateVisuals,
  });
  const generation = {
    ...(input.generationMetadata ?? null),
    createdPages: pages.map((page) => ({ title: page.title, slug: page.slug })),
  } as Prisma.InputJsonValue;
  const site = await prisma.site.create({
    data: {
      userId: input.userId,
      name: input.siteName,
      slug,
      description: input.description ?? null,
      theme: {
        primaryColor: input.blueprint.template_id === "medical-aesthetic-v1" ? "#14b8a6" : "#06b6d4",
        font: "outfit",
        mode: "dark",
        generation,
      } as Prisma.InputJsonValue,
      pages: {
        create: pages.map((page) => ({
          title: page.title,
          slug: page.slug,
          order: page.order,
          published: true,
          seoTitle: page.seoTitle,
          seoDesc: page.seoDesc,
          blocks: page.blocks as Prisma.InputJsonValue,
        })),
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      published: true,
    },
  });

  return { site, blueprint: input.blueprint };
}
