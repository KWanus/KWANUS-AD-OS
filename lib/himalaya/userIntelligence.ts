// ---------------------------------------------------------------------------
// User Intelligence — understands WHO the user is before building anything
//
// Solves: no-idea users, language detection, age filtering, existing platforms,
// failure history, personality matching, demand validation, cold start
//
// This runs BEFORE smartDecide() to enrich the context
// ---------------------------------------------------------------------------

import { generateAI } from "@/lib/integrations/aiInference";

export type UserContext = {
  // Detected from input
  language: string;                    // "en" | "es" | "fr" etc.
  isMinor: boolean;                    // Under 18 indicators
  hasExistingPlatform: boolean;        // Already on Shopify, WordPress, etc.
  existingPlatform?: string;           // "shopify" | "wordpress" | "wix" etc.
  existingUrl?: string;
  hasPastFailure: boolean;             // Mentions failing before
  pastFailureReason?: string;
  hasNoIdea: boolean;                  // Truly doesn't know what to do
  experienceLevel: "beginner" | "intermediate" | "advanced";
  urgency: "low" | "medium" | "high";

  // Personality traits for path matching
  personality: {
    isCreative: boolean;
    isTechnical: boolean;
    isPeoplePerson: boolean;
    isAnalytical: boolean;
    prefersStructure: boolean;
    comfortWithSelling: "low" | "medium" | "high";
  };

  // Enriched niche context
  nicheSignals: {
    isSpecific: boolean;               // "dog training" vs "make money"
    hasMarketDemand: boolean;          // Known profitable niche
    competitiveness: "low" | "medium" | "high";
    suggestedNiche?: string;           // If we need to suggest one
  };
};

// ── Known profitable niches (validated demand) ───────────────────────────────

const PROFITABLE_NICHES = new Set([
  // Health
  "weight loss", "fitness", "yoga", "keto", "mental health", "meditation", "supplements",
  // Wealth
  "real estate", "investing", "crypto", "forex", "affiliate marketing", "dropshipping",
  "coaching", "consulting", "agency", "freelancing", "ecommerce",
  // Relationships
  "dating", "marriage", "parenting", "dog training", "pet care",
  // Skills
  "photography", "coding", "design", "writing", "music", "cooking", "language learning",
  // Business services
  "seo", "social media marketing", "email marketing", "web design", "bookkeeping",
  "legal services", "accounting", "hr", "recruiting",
  // Local
  "hvac", "plumbing", "roofing", "cleaning", "landscaping", "pest control",
  "electrical", "painting", "moving", "auto repair", "dental", "chiropractic",
  // Software
  "saas", "ai tools", "productivity", "crm", "project management",
]);

const LOW_DEMAND_INDICATORS = [
  "sock puppet", "underwater basket", "artisanal", "bespoke", "niche hobby",
];

const PLATFORM_PATTERNS: [RegExp, string][] = [
  [/shopify\.com|myshopify/, "shopify"],
  [/wordpress|\.wp\.com|wp-content/, "wordpress"],
  [/wix\.com/, "wix"],
  [/squarespace/, "squarespace"],
  [/webflow/, "webflow"],
  [/etsy\.com/, "etsy"],
  [/amazon\.com\/dp|amazon\.com\/sp/, "amazon"],
  [/gumroad/, "gumroad"],
  [/teachable|thinkific|kajabi/, "course_platform"],
  [/substack|beehiiv|convertkit/, "newsletter"],
];

// ── Main analysis ────────────────────────────────────────────────────────────

export function analyzeUserContext(input: {
  text: string;
  entryType: "no_business" | "has_business" | "want_to_scale";
  revenue?: string;
}): UserContext {
  const text = input.text;
  const lower = text.toLowerCase();

  // ── Language detection (simple heuristic) ──
  let language = "en";
  if (/[àâéèêëïîôùûüÿç]/.test(text)) language = "fr";
  if (/[áéíóúñ¿¡]/.test(text)) language = "es";
  if (/[äöüßÄÖÜ]/.test(text)) language = "de";
  if (/[ãõçÇ]/.test(text) && !/[éèê]/.test(text)) language = "pt";
  if (/[\u3000-\u9fff]/.test(text)) language = "zh";
  if (/[\u0600-\u06FF]/.test(text)) language = "ar";

  // ── Age indicators ──
  const isMinor = /\b(1[0-7])\s*(years?\s*old|yr|yo)\b/i.test(text) ||
    /\bi'?m\s*(1[0-7])\b/i.test(text) ||
    /\bteen(ager)?\b/i.test(text) ||
    /\bstudent\b.*\b(high school|middle school)\b/i.test(text);

  // ── Existing platform ──
  let hasExistingPlatform = false;
  let existingPlatform: string | undefined;
  let existingUrl: string | undefined;

  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  if (urlMatch) {
    existingUrl = urlMatch[0];
    for (const [pattern, platform] of PLATFORM_PATTERNS) {
      if (pattern.test(existingUrl)) {
        hasExistingPlatform = true;
        existingPlatform = platform;
        break;
      }
    }
  }

  if (/my (shopify|etsy|amazon|wordpress|wix) (store|shop|site)/i.test(lower)) {
    hasExistingPlatform = true;
    if (/shopify/i.test(lower)) existingPlatform = "shopify";
    if (/etsy/i.test(lower)) existingPlatform = "etsy";
    if (/amazon/i.test(lower)) existingPlatform = "amazon";
    if (/wordpress/i.test(lower)) existingPlatform = "wordpress";
  }

  // ── Past failure ──
  const hasPastFailure = /tried|failed|didn.?t work|lost money|gave up|quit|scam/i.test(lower);
  let pastFailureReason: string | undefined;
  if (hasPastFailure) {
    if (/no traffic|no visitors|no one came/.test(lower)) pastFailureReason = "no_traffic";
    else if (/no sales|didn.?t sell|zero sales/.test(lower)) pastFailureReason = "no_conversions";
    else if (/too complicated|confus|overwhelm/.test(lower)) pastFailureReason = "too_complex";
    else if (/ran out of money|too expensive|cost too much/.test(lower)) pastFailureReason = "budget";
    else if (/scam|fake|didn.?t deliver/.test(lower)) pastFailureReason = "bad_product";
    else pastFailureReason = "unknown";
  }

  // ── No idea ──
  const hasNoIdea = lower.length < 10 ||
    /don.?t know|no idea|not sure|no clue|help me|what should i|idk|anything/i.test(lower) ||
    (input.entryType === "no_business" && !lower.trim());

  // ── Experience level ──
  let experienceLevel: "beginner" | "intermediate" | "advanced" = "beginner";
  if (/year|experience|been doing|running for|already making/.test(lower)) experienceLevel = "intermediate";
  if (/scale|7.?figure|multiple|portfolio|exit|acquisition/.test(lower)) experienceLevel = "advanced";
  if (input.entryType === "want_to_scale") experienceLevel = "intermediate";

  // ── Urgency ──
  let urgency: "low" | "medium" | "high" = "medium";
  if (/asap|urgent|now|today|immediately|desperate|need money/.test(lower)) urgency = "high";
  if (/eventually|someday|explore|curious|thinking about/.test(lower)) urgency = "low";

  // ── Personality ──
  const personality = {
    isCreative: /design|art|creative|content|video|photo|music|write/.test(lower),
    isTechnical: /code|develop|tech|engineer|data|analytic|software/.test(lower),
    isPeoplePerson: /people|help|teach|coach|talk|communit|social/.test(lower),
    isAnalytical: /data|numbers|analytic|metric|optimize|test/.test(lower),
    prefersStructure: /step.?by.?step|guided|plan|structure|system|tell me what/.test(lower),
    comfortWithSelling: (/sell|sales|close|pitch|hustle/.test(lower) ? "high" :
      /shy|introvert|don.?t like sell|hate sell/.test(lower) ? "low" : "medium") as "low" | "medium" | "high",
  };

  // ── Niche validation ──
  const words = lower.split(/\s+/);
  const isSpecificNiche = words.length >= 2 && !hasNoIdea;
  const hasMarketDemand = [...PROFITABLE_NICHES].some(n => lower.includes(n));
  const isLowDemand = LOW_DEMAND_INDICATORS.some(n => lower.includes(n));

  let competitiveness: "low" | "medium" | "high" = "medium";
  if (/weight loss|real estate|crypto|forex|insurance/.test(lower)) competitiveness = "high";
  if (/niche|micro|local|specific/.test(lower)) competitiveness = "low";

  let suggestedNiche: string | undefined;
  if (hasNoIdea || (!isSpecificNiche && !hasMarketDemand)) {
    // Suggest based on personality
    if (personality.isCreative) suggestedNiche = "digital products and content creation";
    else if (personality.isTechnical) suggestedNiche = "SaaS tools or technical freelancing";
    else if (personality.isPeoplePerson) suggestedNiche = "coaching or consulting";
    else if (personality.comfortWithSelling === "high") suggestedNiche = "agency or sales consulting";
    else suggestedNiche = "affiliate marketing in health and wellness";
  }

  return {
    language,
    isMinor,
    hasExistingPlatform,
    existingPlatform,
    existingUrl,
    hasPastFailure,
    pastFailureReason,
    hasNoIdea,
    experienceLevel,
    urgency,
    personality,
    nicheSignals: {
      isSpecific: isSpecificNiche,
      hasMarketDemand: hasMarketDemand && !isLowDemand,
      competitiveness,
      suggestedNiche,
    },
  };
}

// ── Discovery questions for "no idea" users ──────────────────────────────────

export const DISCOVERY_QUESTIONS = [
  {
    question: "Which sounds most like you?",
    options: [
      { label: "I like creating things (writing, design, videos)", value: "creative", path: "digital_product" },
      { label: "I'm good with people (teaching, coaching, selling)", value: "people", path: "coaching" },
      { label: "I like finding deals and opportunities", value: "deals", path: "affiliate" },
      { label: "I want to build something I can sell later", value: "builder", path: "ecommerce_brand" },
      { label: "I just want money, I don't care how", value: "money", path: "affiliate" },
    ],
  },
  {
    question: "How much time do you have?",
    options: [
      { label: "1-2 hours a day", value: "minimal" },
      { label: "Half my day", value: "parttime" },
      { label: "All day — I'm going all in", value: "fulltime" },
    ],
  },
  {
    question: "How do you feel about selling?",
    options: [
      { label: "Love it — I can sell anything", value: "high" },
      { label: "I can do it if the product is good", value: "medium" },
      { label: "I'd rather not talk to people", value: "low" },
    ],
  },
];

// ── Demand validation ────────────────────────────────────────────────────────

export async function validateNicheDemand(niche: string): Promise<{
  isViable: boolean;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  suggestedPivot?: string;
}> {
  // Check against known profitable niches first
  const lower = niche.toLowerCase();
  const knownProfitable = [...PROFITABLE_NICHES].some(n => lower.includes(n));
  if (knownProfitable) {
    return { isViable: true, confidence: "high", reasoning: "This is a proven profitable niche with established demand." };
  }

  const knownBad = LOW_DEMAND_INDICATORS.some(n => lower.includes(n));
  if (knownBad) {
    return {
      isViable: false,
      confidence: "high",
      reasoning: "This niche has very low market demand. Most people in this space struggle to find buyers.",
      suggestedPivot: "Consider a broader market: health, wealth, relationships, or business services.",
    };
  }

  // Use AI for ambiguous niches
  const result = await generateAI({
    prompt: `Is "${niche}" a viable business niche? Consider:
1. Is there proven demand (people spending money)?
2. Are there successful businesses in this space?
3. Can someone make $5k+/month here?

Return JSON: {"viable":true/false,"reasoning":"one sentence","suggestedPivot":"if not viable, suggest a better niche"}`,
    systemPrompt: "You are a market researcher. Be honest about niche viability. Return only JSON.",
    maxTokens: 150,
  });

  try {
    const parsed = JSON.parse(result.content);
    return {
      isViable: parsed.viable ?? true,
      confidence: "medium",
      reasoning: parsed.reasoning ?? "Niche viability is uncertain.",
      suggestedPivot: parsed.suggestedPivot,
    };
  } catch {
    return { isViable: true, confidence: "low", reasoning: "Could not validate demand. Proceeding with caution." };
  }
}

// ── Cold start traffic plan ──────────────────────────────────────────────────

export function getColdStartPlan(context: UserContext): {
  day1: string[];
  week1: string[];
  noAudienceStrategy: string;
} {
  const { personality, nicheSignals } = context;

  if (personality.comfortWithSelling === "high") {
    return {
      day1: [
        "DM 20 people in your target market on Instagram (not pitching — asking questions)",
        "Post your first piece of content on LinkedIn",
        "Join 3 Facebook groups where your audience hangs out",
      ],
      week1: [
        "Send 50 personalized DMs across Instagram and LinkedIn",
        "Post content every day (alternate value posts and personal stories)",
        "Comment on 30 posts from potential customers daily",
        "Offer free help to 5 people in exchange for testimonials",
      ],
      noAudienceStrategy: "Direct outreach. Your first 10 customers come from conversations, not content.",
    };
  }

  if (personality.isCreative) {
    return {
      day1: [
        "Create 3 short-form videos (TikTok/Reels) about your niche",
        "Write your first blog post or thread",
        "Set up your content calendar for the week",
      ],
      week1: [
        "Post 2 short videos per day on TikTok and Instagram Reels",
        "Write 2 long-form posts (LinkedIn articles or blog posts)",
        "Engage with 20 comments per day on similar content",
        "Collaborate with one other creator in your space",
      ],
      noAudienceStrategy: "Content-first approach. Create 21 pieces of content in 7 days. Algorithm finds your audience.",
    };
  }

  // Default: balanced approach
  return {
    day1: [
      "Post your first piece of content on your strongest platform",
      "Join 3 communities where your target audience gathers",
      "Tell 10 people you know about what you're building",
    ],
    week1: [
      "Post content daily (use the 7-day calendar Himalaya generated)",
      "Spend $5-10/day on ads to test your best hook",
      "Engage with 15 potential customers daily on social media",
      "Collect email addresses from everyone who shows interest",
    ],
    noAudienceStrategy: "Hybrid approach: organic content builds long-term, small ad spend gets immediate feedback.",
  };
}

// ── Re-engagement for returning users ────────────────────────────────────────

export function getReengagementPlan(daysSinceLastActive: number): {
  greeting: string;
  firstAction: string;
  recoverySteps: string[];
} {
  if (daysSinceLastActive < 3) {
    return {
      greeting: "Welcome back. Let's keep the momentum going.",
      firstAction: "Check your latest results and complete today's commands.",
      recoverySteps: [],
    };
  }

  if (daysSinceLastActive < 14) {
    return {
      greeting: `It's been ${daysSinceLastActive} days. Your business kept running — let's catch up.`,
      firstAction: "Review what happened while you were away.",
      recoverySteps: [
        "Check if any leads came in (forms, emails)",
        "Review ad performance if ads were running",
        "Post fresh content today to restart momentum",
      ],
    };
  }

  if (daysSinceLastActive < 60) {
    return {
      greeting: `${daysSinceLastActive} days away. No judgment — let's restart.`,
      firstAction: "Your assets are still live. Let's see what's working.",
      recoverySteps: [
        "Check your site analytics — any traffic?",
        "Review your email list — anyone new?",
        "Start fresh with today's daily commands",
        "Consider refreshing your ad creatives (audiences might have fatigued)",
      ],
    };
  }

  return {
    greeting: "It's been a while. Want to start fresh or pick up where you left off?",
    firstAction: "Run Himalaya again with updated goals — we'll rebuild what's needed.",
    recoverySteps: [
      "Your old assets are still saved — nothing is lost",
      "Run a fresh build with your current situation",
      "We'll keep what's working and replace what's not",
    ],
  };
}
