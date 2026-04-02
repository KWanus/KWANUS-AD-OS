// ---------------------------------------------------------------------------
// Himalaya Orchestration Contracts
// ---------------------------------------------------------------------------
// These are the formal contracts between Himalaya's systems.
// Both paths (scratch + improve) must produce a HimalayaPayload before
// Strategy AI runs. Strategy AI outputs a StrategyDecision. Generation AI
// consumes the decision and produces GenerationOutput. Site/email systems
// consume specific slices of the output.
// ---------------------------------------------------------------------------

// ═══════════════════════════════════════════════════════════════════════════
// 1. ORCHESTRATION PAYLOAD — the normalized object both paths produce
// ═══════════════════════════════════════════════════════════════════════════

export type HimalayaPayload = {
  // Identity
  mode: "scratch" | "improve";
  businessType: string;           // e.g. "affiliate", "agency", "ecommerce", or detected type
  niche: string;                  // specific niche or market
  goal: string;                   // user's primary goal

  // Source inputs (where the data came from)
  sourceInputs: {
    type: "profile" | "url_scan" | "manual";
    profileId?: string;
    scanUrl?: string;
    rawDescription?: string;
  };

  // Diagnosis (what was found)
  diagnosis: {
    audience: string;
    painPoint: string;
    angle: string;
    strengths: string[];
    weaknesses: string[];
    risks: string[];
    score: number;                // 0-100, overall viability/health
    confidence: "High" | "Medium" | "Low";
  };

  // Scores (dimension-level detail, if available)
  scores: {
    overall: number;
    dimensions: { key: string; label: string; value: number }[];
  } | null;

  // Detected problems (improve path) or gaps (scratch path)
  detectedProblems: string[];

  // Recommendations from diagnosis
  recommendations: string[];
};

// ═══════════════════════════════════════════════════════════════════════════
// 2. STRATEGY AI CONTRACT — what the strategy layer outputs
// ═══════════════════════════════════════════════════════════════════════════

export type StrategyDecision = {
  // Top 3 priorities, ordered by impact
  priorities: {
    label: string;
    reason: string;
    action: string;
  }[];

  // What to generate NOW
  generationTargets: GenerationTarget[];

  // What NOT to generate yet (and why)
  deferred: {
    target: string;
    reason: string;
  }[];

  // Strategic reasoning (3-4 bullets max, no paragraphs)
  reasoning: string[];
};

export type GenerationTarget =
  | "business_profile"
  | "ideal_customer"
  | "offer_direction"
  | "website_blueprint"
  | "homepage_copy"
  | "marketing_angles"
  | "email_sequence"
  | "action_roadmap"
  | "ad_hooks"
  | "ad_scripts"
  | "landing_page"
  | "execution_checklist";

// ═══════════════════════════════════════════════════════════════════════════
// 3. GENERATION AI CONTRACT — structured deliverables, not paragraphs
// ═══════════════════════════════════════════════════════════════════════════

export type GenerationOutput = {
  businessProfile: {
    businessType: string;
    niche: string;
    targetCustomer: string;
    painPoint: string;
    uniqueAngle: string;
  } | null;

  idealCustomer: {
    who: string;
    demographics: string;
    psychographics: string;
    whereToBuy: string;
    buyingTrigger: string;
  } | null;

  offerDirection: {
    coreOffer: string;
    pricing: string;
    deliverable: string;
    transformation: string;
    guarantee: string;
  } | null;

  websiteBlueprint: {
    headline: string;
    subheadline: string;
    heroCtaText: string;
    sections: string[];
    trustElements: string[];
    urgencyLine: string;
  } | null;

  marketingAngles: {
    hook: string;
    angle: string;
    platform: string;
  }[] | null;

  emailSequence: {
    subject: string;
    purpose: string;
    timing: string;
    body?: string;
  }[] | null;

  adHooks: {
    format: string;
    hook: string;
  }[] | null;

  adScripts: {
    title: string;
    duration: string;
    sections: { timestamp: string; direction: string; copy: string }[];
  }[] | null;

  actionRoadmap: {
    phase: string;
    timeframe: string;
    tasks: string[];
  }[] | null;
};

// ═══════════════════════════════════════════════════════════════════════════
// 4. SITE BUILDER HANDOFF CONTRACT
// ═══════════════════════════════════════════════════════════════════════════

export type SiteHandoff = {
  headline: string;
  subheadline: string;
  ctaText: string;
  sections: string[];
  trustElements: string[];
  urgencyLine: string;
  // Optional enhanced fields from generation
  benefitBullets?: string[];
  socialProof?: string;
  guaranteeText?: string;
  faqItems?: { question: string; answer: string }[];
};

// ═══════════════════════════════════════════════════════════════════════════
// 5. EMAIL SYSTEM HANDOFF CONTRACT
// ═══════════════════════════════════════════════════════════════════════════

export type EmailHandoff = {
  sequenceName: string;
  emails: {
    subject: string;
    purpose: string;
    timing: string;
    body?: string;
    preview?: string;
  }[];
};

// ═══════════════════════════════════════════════════════════════════════════
// 6. STAGE STATUS — every stage carries status + warnings
// ═══════════════════════════════════════════════════════════════════════════

export type StageStatus = "success" | "partial" | "fallback" | "failed";

export type StageResult<T> = {
  status: StageStatus;
  data: T;
  warnings: string[];
  durationMs: number;
};

// ═══════════════════════════════════════════════════════════════════════════
// 7. PIPELINE TRACE — per-run observability
// ═══════════════════════════════════════════════════════════════════════════

export type PipelineStage = {
  name: string;
  status: StageStatus;
  startedAt: string;
  completedAt: string | null;
  durationMs: number;
  fallbackUsed: boolean;
  warnings: string[];
};

export type PipelineTrace = {
  runId: string;
  userId: string;
  mode: "scratch" | "improve";
  stages: PipelineStage[];
  totalDurationMs: number;
  overallStatus: StageStatus;
  savedEntityIds: {
    analysisRunId?: string;
    assetPackageId?: string;
    profileId?: string;
  };
  createdAt: string;
};

// ═══════════════════════════════════════════════════════════════════════════
// 8. USER INPUT CONTRACT — what enters the pipeline
// ═══════════════════════════════════════════════════════════════════════════

export type HimalayaUserInput = {
  mode: "scratch" | "improve";
  // Scratch fields
  profileId?: string;
  path?: string;
  // Improve fields
  url?: string;
  description?: string;
  // Shared
  niche?: string;
};

// ═══════════════════════════════════════════════════════════════════════════
// 9. PIPELINE RESULT — what runHimalaya() returns
// ═══════════════════════════════════════════════════════════════════════════

export type HimalayaPipelineResult = {
  success: boolean;
  runId: string | null;
  mode: "scratch" | "improve";
  payload: HimalayaPayload | null;
  strategy: StrategyDecision | null;
  generation: GenerationOutput | null;
  siteHandoff: SiteHandoff | null;
  emailHandoff: EmailHandoff | null;
  trace: PipelineTrace;
  // For display
  title: string;
  summary: string;
};

// ═══════════════════════════════════════════════════════════════════════════
// 10. MINIMUM VIABLE OUTPUT — what each stage MUST return at minimum
// ═══════════════════════════════════════════════════════════════════════════

// Diagnosis must always return: mode + summary fields + detected priorities
// Strategy must always return: top priorities + generation plan
// Generation must always return: at least one usable asset group
// Results must always return: user-readable summary + next actions
