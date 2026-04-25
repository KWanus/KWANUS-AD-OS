import type { FetchedPage } from "@/src/logic/ad-os/fetchPage";
import type { ExtractedSignals } from "@/src/logic/ad-os/extractSignals";
import type { Diagnosis } from "@/src/logic/ad-os/diagnoseLink";

// ---------------------------------------------------------------------------
// Market Intelligence Types
// ---------------------------------------------------------------------------

export type ExecutionTier = "core" | "elite";

export type MarketVertical =
  | "affiliate"
  | "dropship"
  | "local_service"
  | "saas"
  | "coaching"
  | "ecommerce"
  | "info_product";

export type Platform =
  | "clickbank"
  | "digistore24"
  | "amazon"
  | "jvzoo"
  | "warriorplus"
  | "shopify"
  | "direct";

// ---------------------------------------------------------------------------
// Product Discovery
// ---------------------------------------------------------------------------

export interface DiscoveredProduct {
  name: string;
  url: string;
  platform: Platform;
  niche: string;
  subNiche?: string;
  commission?: string;
  price?: string;
  gravity?: number;
  avgEarningsPerSale?: string;
  recurringCommission?: boolean;
  competitionLevel?: "low" | "medium" | "high" | "saturated";
  demandSignals?: string[];
  whySelected?: string;
}

// ---------------------------------------------------------------------------
// Winner Analysis
// ---------------------------------------------------------------------------

export interface FunnelStep {
  stepNumber: number;
  type: "ad" | "landing" | "bridge" | "vsl" | "checkout" | "upsell" | "downsell" | "thank_you" | "email";
  url?: string;
  purpose: string;
  keyElements: string[];
}

export interface WinnerProfile {
  product: DiscoveredProduct;
  page?: FetchedPage;
  signals?: ExtractedSignals;
  diagnosis?: Diagnosis;
  funnelStructure: FunnelStep[];
  customerAvatar: {
    demographics: string;
    painPoints: string[];
    desires: string[];
    objections: string[];
    buyingTriggers: string[];
    wheretheyHangOut: string[];
  };
  conversionStrategy: {
    hookApproach: string;
    trustElements: string[];
    urgencyTactics: string[];
    pricingStrategy: string;
    guaranteeType: string;
    socialProof: string[];
    emotionalTriggers: string[];
  };
  adIntelligence: {
    commonHooks: string[];
    creativeFormats: string[];
    platforms: string[];
    estimatedSpend?: string;
    topPerformingAngle?: string;
  };
  strengths: string[];
  weaknesses: string[];
  duplicableElements: string[];
  improvementOpportunities: string[];
}

// ---------------------------------------------------------------------------
// Market Synthesis
// ---------------------------------------------------------------------------

export interface MarketSynthesis {
  bestProduct: {
    name: string;
    url: string;
    platform: Platform;
    reasoning: string;
    estimatedEarningsPerDay: string;
    confidenceLevel: "high" | "medium" | "low";
  };
  targetAudience: {
    primary: string;
    demographics: string;
    psychographics: string;
    platformPresence: string[];
  };
  winningStrategy: {
    primaryAngle: string;
    hookFormula: string;
    contentStyle: string;
    adFormat: string;
    trafficSource: string;
    budgetRecommendation: string;
  };
  funnelBlueprint: {
    steps: FunnelStep[];
    estimatedConversionRate: string;
    keyDifferentiator: string;
  };
  emailStrategy: {
    sequenceType: string;
    emailCount: number;
    keyMessages: string[];
  };
  dayOnePlan: {
    tasks: Array<{
      order: number;
      task: string;
      timeEstimate: string;
      deliverable: string;
    }>;
  };
  competitiveEdge: string;
  riskAssessment: string;
  scalePlaybook: string;
}

// ---------------------------------------------------------------------------
// Full Market Intelligence Result
// ---------------------------------------------------------------------------

export interface MarketIntelligenceResult {
  id?: string;
  niche: string;
  subNiche?: string;
  vertical: MarketVertical;
  executionTier: ExecutionTier;
  status: "pending" | "discovering" | "analyzing" | "synthesizing" | "generating" | "complete" | "failed";
  discoveredProducts: DiscoveredProduct[];
  winnerProfiles: WinnerProfile[];
  synthesis: MarketSynthesis | null;
  generatedAssets: {
    hooks?: string[];
    adScripts?: Array<{ title: string; script: string; platform: string }>;
    landingPageBlocks?: unknown[];
    emailSequence?: Array<{ subject: string; body: string; sendDay: number }>;
  };
  score: number;
  createdAt?: string;
}

// ---------------------------------------------------------------------------
// Engine Input
// ---------------------------------------------------------------------------

export interface MarketIntelligenceInput {
  niche: string;
  subNiche?: string;
  vertical?: MarketVertical;
  executionTier?: ExecutionTier;
  maxProducts?: number;
  includeAdIntelligence?: boolean;
  generateAssets?: boolean;
  specificUrls?: string[];
}
