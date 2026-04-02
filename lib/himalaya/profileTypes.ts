// ---------------------------------------------------------------------------
// Himalaya Decision Engine — Profile & Path Types
// ---------------------------------------------------------------------------

export type BudgetTier = "none" | "micro" | "moderate" | "serious";
export type TimeAvailability = "minimal" | "parttime" | "fulltime";
export type SkillSet = "none" | "communication" | "technical" | "creative" | "sales" | "operations";
export type RiskTolerance = "low" | "medium" | "high";
export type PrimaryGoal = "quick_cash" | "side_income" | "full_business" | "scale_existing" | "fix_existing";
export type BusinessStage = "no_business" | "idea_only" | "early_stage" | "has_revenue" | "scaling";

export type HimalayaProfileInput = {
  budget: BudgetTier;
  timeAvailable: TimeAvailability;
  skills: SkillSet[];
  riskTolerance: RiskTolerance;
  primaryGoal: PrimaryGoal;
  businessStage: BusinessStage;
  existingUrl?: string;
  niche?: string;
  description?: string;
};

export type BusinessPath =
  | "affiliate"
  | "dropshipping"
  | "agency"
  | "freelance"
  | "coaching"
  | "local_service"
  | "ecommerce_brand"
  | "digital_product"
  | "improve_existing"
  | "scale_systems";

export type PathRecommendation = {
  path: BusinessPath;
  label: string;
  confidence: number; // 0-100
  reasoning: string[];
  nextSteps: string[];
  estimatedTimeToFirstRevenue: string;
  startingInvestment: string;
  riskLevel: "Low" | "Medium" | "High";
};

export type DecisionResult = {
  primary: PathRecommendation;
  alternatives: PathRecommendation[];
  profileSummary: string;
  stage: BusinessStage;
};

export const BUDGET_OPTIONS: { value: BudgetTier; label: string; detail: string }[] = [
  { value: "none", label: "No budget", detail: "I need to start with $0" },
  { value: "micro", label: "Under $100", detail: "I can invest a small amount" },
  { value: "moderate", label: "$100–$1,000", detail: "I have some capital ready" },
  { value: "serious", label: "$1,000+", detail: "I'm ready to invest properly" },
];

export const TIME_OPTIONS: { value: TimeAvailability; label: string; detail: string }[] = [
  { value: "minimal", label: "1–2 hours/day", detail: "Side project alongside my job" },
  { value: "parttime", label: "4–6 hours/day", detail: "Serious part-time commitment" },
  { value: "fulltime", label: "Full-time", detail: "This is my main focus" },
];

export const SKILL_OPTIONS: { value: SkillSet; label: string }[] = [
  { value: "none", label: "No specific skills yet" },
  { value: "communication", label: "Communication & writing" },
  { value: "technical", label: "Technical / web / coding" },
  { value: "creative", label: "Design / video / creative" },
  { value: "sales", label: "Sales & negotiation" },
  { value: "operations", label: "Organization & operations" },
];

export const RISK_OPTIONS: { value: RiskTolerance; label: string; detail: string }[] = [
  { value: "low", label: "Low risk", detail: "I want the safest path possible" },
  { value: "medium", label: "Medium risk", detail: "I can handle some uncertainty" },
  { value: "high", label: "High risk", detail: "I'll bet big for bigger returns" },
];

export const GOAL_OPTIONS: { value: PrimaryGoal; label: string; detail: string }[] = [
  { value: "quick_cash", label: "Make money fast", detail: "I need income as soon as possible" },
  { value: "side_income", label: "Build side income", detail: "I want a reliable second income stream" },
  { value: "full_business", label: "Build a real business", detail: "I want something I own and grow" },
  { value: "scale_existing", label: "Scale what I have", detail: "I already make money, I need systems" },
  { value: "fix_existing", label: "Fix what's broken", detail: "My business exists but something isn't working" },
];

export const STAGE_OPTIONS: { value: BusinessStage; label: string; detail: string }[] = [
  { value: "no_business", label: "Starting from zero", detail: "I don't have a business yet" },
  { value: "idea_only", label: "I have an idea", detail: "I know what I want to do but haven't started" },
  { value: "early_stage", label: "Just getting started", detail: "I've started but haven't made real money" },
  { value: "has_revenue", label: "Making some money", detail: "I have sales but need more structure" },
  { value: "scaling", label: "Ready to scale", detail: "I need systems to grow beyond where I am" },
];

export const PATH_INFO: Record<BusinessPath, { label: string; icon: string; color: string; description: string }> = {
  affiliate: {
    label: "Affiliate Marketing",
    icon: "Link",
    color: "cyan",
    description: "Promote other people's products and earn commissions. Low startup cost, fast testing, scalable with paid traffic.",
  },
  dropshipping: {
    label: "Dropshipping / E-commerce",
    icon: "Package",
    color: "purple",
    description: "Sell physical products online without holding inventory. Requires ad spend and product testing.",
  },
  agency: {
    label: "Agency / Service Business",
    icon: "Briefcase",
    color: "amber",
    description: "Offer a service to businesses. High margins, relationship-driven, scales with team and systems.",
  },
  freelance: {
    label: "Freelancing",
    icon: "User",
    color: "blue",
    description: "Sell your skills directly. Fast start with zero investment, builds into agency or productized service.",
  },
  coaching: {
    label: "Coaching / Consulting",
    icon: "GraduationCap",
    color: "emerald",
    description: "Package your expertise into 1-on-1 or group programs. High ticket, authority-driven.",
  },
  local_service: {
    label: "Local Service Business",
    icon: "MapPin",
    color: "orange",
    description: "Serve your local area with a specific service. Steady demand, repeat clients, referral-driven.",
  },
  ecommerce_brand: {
    label: "E-commerce Brand",
    icon: "ShoppingBag",
    color: "pink",
    description: "Build a branded product line. Higher investment, stronger moat, long-term equity.",
  },
  digital_product: {
    label: "Digital Products",
    icon: "FileText",
    color: "teal",
    description: "Create and sell templates, courses, tools, or downloads. Build once, sell infinitely.",
  },
  improve_existing: {
    label: "Fix & Improve Your Business",
    icon: "Wrench",
    color: "amber",
    description: "Diagnose what's broken, fix the leaks, and rebuild the parts killing your growth.",
  },
  scale_systems: {
    label: "Scale with Systems",
    icon: "Zap",
    color: "cyan",
    description: "Add automations, funnels, CRM, email systems, and SOPs to scale beyond manual work.",
  },
};
