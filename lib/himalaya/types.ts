// ---------------------------------------------------------------------------
// Himalaya Results — View Model Types
// ---------------------------------------------------------------------------

export type ResultPriority = {
  label: string;
  reason: string;
  nextStep: string;
};

export type AssetGroupType = "text" | "list" | "kv" | "scripts";

export type AssetGroup = {
  title: string;
  type: AssetGroupType;
  regenerateTarget?: string; // maps to API regeneration target
  content:
    | string
    | string[]
    | { label: string; value: string }[]
    | { title: string; duration: string; sections: { timestamp: string; direction: string; copy: string }[] }[];
};

export type TraceStage = {
  name: string;
  status: string;
  durationMs?: number;
  fallbackUsed?: boolean;
  warnings?: string[];
};

export type HimalayaResultsViewModel = {
  modeLabel: string;
  mode: "operator" | "consultant";
  title: string;
  statusLabel: string;
  statusTone: "success" | "partial" | "fallback" | "failed";
  summary: string;
  score: number;
  verdict: string;
  confidence: string;
  inputUrl: string;
  createdAt: string;
  priorities: ResultPriority[];
  assetGroups: AssetGroup[];
  notes: string[];
  nextActions: { label: string; href: string }[];
  trace: {
    runId: string;
    mode: string;
    linkType: string;
    confidence: string;
    assetsGenerated: number;
    createdAt: string;
  } | null;
  // Strategy reasoning (from orchestration layer, if available)
  strategyReasoning: string[] | null;
  // Raw refs for advanced features
  analysisId: string;
  decisionPacket: {
    audience?: string;
    painDesire?: string;
    angle?: string;
    strengths?: string[];
    weaknesses?: string[];
    risks?: string[];
    nextActions?: string[];
  } | null;
  dimensions: {
    label: string;
    key: string;
    value: number;
    isRisk?: boolean;
  }[];
  truthEngine: {
    totalScore: number;
    verdict: string;
    confidence: string;
    profile: string;
    breakdown: { dimension: string; rawScore: number; grade: string }[];
    diagnostics: { severity: string; dimension: string; message: string; fix?: string }[];
    strengthSummary: string;
    weaknessSummary: string;
    actionPlan: string[];
  } | null;
};

// Raw API shape from /api/analyses/[id]
export interface RawAnalysis {
  id: string;
  mode: string;
  inputUrl: string;
  linkType: string | null;
  title: string | null;
  score: number | null;
  verdict: string | null;
  confidence: string | null;
  summary: string | null;
  rawSignals: Record<string, unknown> | null;
  decisionPacket: Record<string, unknown> | null;
  createdAt: string;
  opportunityAssessments: {
    id: string;
    status: string;
    totalScore: number | null;
    demandPotential: number | null;
    offerStrength: number | null;
    emotionalLeverage: number | null;
    trustCredibility: number | null;
    conversionReadiness: number | null;
    adViability: number | null;
    emailLifecyclePotential: number | null;
    seoPotential: number | null;
    differentiation: number | null;
    risk: number | null;
    topGaps: string[] | null;
    topStrengths: string[] | null;
    recommendedPath: string | null;
    opportunityPacket: Record<string, unknown> | null;
  }[];
  assetPackages: {
    id: string;
    mode: string;
    executionTier?: string;
    adHooks: { format: string; hook: string }[];
    adScripts: { title: string; duration: string; sections: { timestamp: string; direction: string; copy: string }[] }[];
    adBriefs: unknown;
    landingPage: Record<string, unknown> | null;
    emailSequences: Record<string, unknown> | null;
    executionChecklist: Record<string, unknown> | null;
  }[];
}
