/**
 * Himalaya Payload Contracts
 *
 * These types define the exact shape of data flowing between engines.
 * Every engine reads from and writes to these contracts.
 *
 * Flow:
 *   UserInput → DiagnosisPayload → StrategyPayload → GenerationPayload → ResultsPayload
 */

// ─── Pipeline Status (every stage carries this) ─────────────────────────────

export type StageStatus = "success" | "partial" | "fallback" | "failed";

export interface StageResult {
  status: StageStatus;
  warnings: string[];
}

// ─── Run Trace (observability log for each pipeline execution) ───────────────

export interface RunTrace {
  runId: string;
  userId: string | null;
  mode: "scratch" | "improve";
  startedAt: string;
  completedAt: string | null;
  stages: {
    diagnosis: StageTrace;
    strategy: StageTrace;
    generation: StageTrace;
    save: StageTrace;
  };
  createdResources: CreatedResources;
}

export interface StageTrace {
  status: StageStatus;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  fallbackUsed: boolean;
  warnings: string[];
  error: string | null;
}

// ─── User Input ──────────────────────────────────────────────────────────────

export interface ScratchInput {
  mode: "scratch";
  businessType: string;
  niche: string;
  goal: string;
  description?: string;
}

export interface ImproveInput {
  mode: "improve";
  url?: string;
  businessDescription?: string;
  challenge?: string;
}

export type HimalayaInput = ScratchInput | ImproveInput;

// ─── Diagnosis Payload (output of Diagnosis Engine) ──────────────────────────

export interface DiagnosisBase {
  mode: "scratch" | "improve";
  businessType: string | null;
  niche: string | null;
  goal: string | null;
}

export interface ScratchDiagnosis extends DiagnosisBase {
  mode: "scratch";
  archetype: ArchetypeSnapshot | null;
  description: string | null;
}

export interface ArchetypeSnapshot {
  label: string;
  acquisitionModel: string;
  salesProcess: string;
  funnelType: string;
  conversionTriggers: string[];
  topObjections: string[];
  winningAngles: string[];
  systems: Array<{
    slug: string;
    name: string;
    priority: string;
    estimatedImpact: string;
    why: string;
  }>;
}

export interface ImproveDiagnosis extends DiagnosisBase {
  mode: "improve";
  url: string | null;
  title: string | null;
  score: number | null;
  verdict: string | null;
  confidence: string | null;
  summary: string | null;
  strengths: string | null;
  weaknesses: string | null;
  breakdown: DimensionScore[];
  diagnostics: Diagnostic[];
  gaps: string[];
  decisionPacket: DecisionPacket | null;
  challenge: string | null;
  businessDescription: string | null;
  scanFailed?: boolean;
  descriptionOnly?: boolean;
}

export interface DimensionScore {
  dimension: string;
  rawScore: number;
  weight: number;
  weightedScore: number;
  grade: string;
  isRisk: boolean;
}

export interface Diagnostic {
  severity: "critical" | "warning" | "positive" | "info";
  dimension: string;
  message: string;
  fix?: string;
}

export interface DecisionPacket {
  audience: string;
  painDesire: string;
  strengths: string[];
  weaknesses: string[];
  nextActions: string[];
}

export type DiagnosisPayload = (ScratchDiagnosis | ImproveDiagnosis) & StageResult;

// ─── Strategy Payload (output of Strategy Engine) ────────────────────────────

export interface StrategyAction {
  priority: number;
  action: string;
  why: string;
  impact: "high" | "medium" | "low";
  engine: "profile" | "site" | "email" | "ads" | "operations";
}

export interface StrategyPayload extends StageResult {
  summary: string;
  actions: StrategyAction[];
  generateQueue: string[];
  defer: string[];
}

// ─── Generation Payload (output of Generation Engine) ────────────────────────

/** Scratch mode generation */
export interface ScratchGeneration {
  profile: BusinessProfile;
  idealCustomer: IdealCustomer;
  homepage: HomepagePayload;
  marketingAngles: MarketingAngle[];
  emails: EmailSequencePayload;
  roadmap: RoadmapPayload;
}

/** Improve mode generation */
export interface ImproveGeneration {
  audit: AuditPayload;
  fixes: Fix[];
  homepage: HomepagePayload;
  marketingAngles: MarketingAngle[];
  emails: EmailSequencePayload;
  roadmap: RoadmapPayload;
}

export interface BusinessProfile {
  businessName: string;
  positioning: string;
  targetAudience: string;
  offer: string;
  differentiator: string;
  priceRange: string;
}

export interface IdealCustomer {
  demographics: string;
  painPoints: string[];
  desires: string[];
  buyingTriggers: string[];
}

export interface HomepagePayload {
  headline: string;
  subheadline: string;
  heroButtonText: string;
  sections: HomepageSection[];
  seoTitle: string;
  seoDesc: string;
}

export interface HomepageSection {
  type: "features" | "testimonials" | "faq" | "cta" | "stats" | "process";
  title?: string;
  headline?: string;
  buttonText?: string;
  items?: Array<Record<string, unknown>>;
}

export interface MarketingAngle {
  angle: string;
  hook: string;
  platform: string;
}

export interface EmailSequencePayload {
  sequence: EmailPayload[];
}

export interface EmailPayload {
  name: string;
  subject: string;
  preview: string;
  body: string;
  delayDays: number;
}

export interface RoadmapPayload {
  thisWeek: string[];
  thisMonth: string[];
  thisQuarter: string[];
}

export interface AuditPayload {
  overallScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
}

export interface Fix {
  priority: number;
  area: "site" | "offer" | "trust" | "conversion" | "followup" | "brand";
  problem: string;
  fix: string;
  impact: "high" | "medium" | "low";
}

export type GenerationPayload = (ScratchGeneration | ImproveGeneration) & StageResult;

// ─── Results Payload (final output to UI) ────────────────────────────────────

export interface ResultsPayload {
  mode: "scratch" | "improve";
  diagnosis: DiagnosisPayload;
  strategy: StrategyPayload;
  generated: GenerationPayload;
  created: CreatedResources;
  trace: RunTrace;
}

export interface CreatedResources {
  siteId: string | null;
  emailFlowId: string | null;
}

// ─── Site Builder Handoff ────────────────────────────────────────────────────

export interface SiteHandoff {
  name: string;
  slug: string;
  theme: {
    primaryColor: string;
    font: string;
    mode: "dark" | "light";
  };
  page: {
    title: string;
    slug: string;
    blocks: SiteBlock[];
    seoTitle: string | null;
    seoDesc: string | null;
  };
}

export interface SiteBlock {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

// ─── Email System Handoff ────────────────────────────────────────────────────

export interface EmailFlowHandoff {
  name: string;
  trigger: string;
  status: "draft";
  nodes: EmailPayload[];
}
