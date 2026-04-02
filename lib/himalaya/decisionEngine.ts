import type {
  HimalayaProfileInput,
  BusinessPath,
  PathRecommendation,
  DecisionResult,
} from "./profileTypes";

// ---------------------------------------------------------------------------
// Scoring weights per path
// ---------------------------------------------------------------------------

type PathScore = {
  path: BusinessPath;
  score: number;
  reasons: string[];
};

function scorePath(
  path: BusinessPath,
  p: HimalayaProfileInput
): PathScore {
  let score = 0;
  const reasons: string[] = [];

  switch (path) {
    case "affiliate": {
      // Best for: low budget, no skills, quick cash, low risk
      if (p.budget === "none" || p.budget === "micro") { score += 25; reasons.push("Low startup cost matches your budget"); }
      if (p.riskTolerance === "low") { score += 15; reasons.push("Low risk — you don't create products, just promote them"); }
      if (p.primaryGoal === "quick_cash") { score += 20; reasons.push("Fastest path to first commission"); }
      if (p.primaryGoal === "side_income") { score += 15; reasons.push("Works well as a side income stream"); }
      if (p.businessStage === "no_business") { score += 15; reasons.push("No existing business needed to start"); }
      if (p.skills.includes("creative")) { score += 10; reasons.push("Creative skills help with content and ads"); }
      if (p.timeAvailable === "minimal") { score += 10; reasons.push("Can start with limited time"); }
      if (p.budget === "serious") score -= 10; // overqualified
      if (p.primaryGoal === "full_business") score -= 10; // not the best for building equity
      break;
    }

    case "dropshipping": {
      // Best for: moderate budget, medium risk, willing to test
      if (p.budget === "moderate" || p.budget === "serious") { score += 25; reasons.push("You have budget for product testing and ads"); }
      if (p.riskTolerance === "medium" || p.riskTolerance === "high") { score += 15; reasons.push("Comfortable with testing and iteration"); }
      if (p.primaryGoal === "full_business" || p.primaryGoal === "side_income") { score += 15; reasons.push("Can grow into a real e-commerce business"); }
      if (p.timeAvailable === "parttime" || p.timeAvailable === "fulltime") { score += 15; reasons.push("Product research and testing need consistent time"); }
      if (p.skills.includes("creative")) { score += 10; reasons.push("Creative skills accelerate ad testing"); }
      if (p.skills.includes("sales")) { score += 10; reasons.push("Sales instinct helps with offer positioning"); }
      if (p.budget === "none") score -= 20; // can't test products without budget
      if (p.riskTolerance === "low") score -= 10;
      break;
    }

    case "agency": {
      // Best for: communication skills, no/low budget, willing to hustle
      if (p.skills.includes("communication")) { score += 25; reasons.push("Communication skills are the core agency asset"); }
      if (p.skills.includes("sales")) { score += 20; reasons.push("Sales ability drives client acquisition"); }
      if (p.budget === "none" || p.budget === "micro") { score += 15; reasons.push("Can start with zero capital — your skill is the product"); }
      if (p.primaryGoal === "full_business") { score += 15; reasons.push("Agencies build real equity and recurring revenue"); }
      if (p.timeAvailable === "fulltime") { score += 10; reasons.push("Full-time commitment accelerates client acquisition"); }
      if (p.riskTolerance === "medium") { score += 5; }
      if (p.skills.includes("none")) score -= 15; // need at least one skill
      if (p.timeAvailable === "minimal") score -= 10; // agencies need availability
      break;
    }

    case "freelance": {
      // Best for: has a skill, no budget, wants fast income
      const hasSkill = !p.skills.includes("none") && p.skills.length > 0;
      if (hasSkill) { score += 25; reasons.push("You have a marketable skill to sell directly"); }
      if (p.budget === "none" || p.budget === "micro") { score += 20; reasons.push("Zero startup cost — sell what you know"); }
      if (p.primaryGoal === "quick_cash") { score += 15; reasons.push("Fastest path to paid work"); }
      if (p.primaryGoal === "side_income") { score += 10; reasons.push("Flexible schedule fits side income goals"); }
      if (p.businessStage === "no_business") { score += 10; reasons.push("No business infrastructure needed"); }
      if (p.timeAvailable === "minimal") { score += 5; reasons.push("Can work on your own schedule"); }
      if (p.skills.includes("none")) score -= 25; // no skill = no freelancing
      if (p.primaryGoal === "full_business") score -= 5; // freelancing alone doesn't scale easily
      break;
    }

    case "coaching": {
      // Best for: expertise, communication, wants high ticket
      if (p.skills.includes("communication")) { score += 20; reasons.push("Coaching requires strong communication"); }
      if (p.skills.includes("sales")) { score += 15; reasons.push("Sales skills drive high-ticket conversions"); }
      if (p.primaryGoal === "full_business") { score += 15; reasons.push("Coaching builds into a scalable authority business"); }
      if (p.businessStage === "has_revenue" || p.businessStage === "early_stage") { score += 10; reasons.push("Your experience becomes the product"); }
      if (p.budget === "none" || p.budget === "micro") { score += 10; reasons.push("Low startup cost — your expertise is the asset"); }
      if (p.timeAvailable === "fulltime") { score += 10; reasons.push("Full-time commitment builds authority faster"); }
      if (p.skills.includes("none")) score -= 20;
      if (p.businessStage === "no_business" && p.skills.includes("none")) score -= 15;
      break;
    }

    case "local_service": {
      // Best for: willing to hustle locally, moderate skills, steady growth
      if (p.skills.includes("communication") || p.skills.includes("sales")) { score += 20; reasons.push("People skills drive local service businesses"); }
      if (p.skills.includes("operations")) { score += 15; reasons.push("Operational skills keep service businesses running smoothly"); }
      if (p.riskTolerance === "low" || p.riskTolerance === "medium") { score += 15; reasons.push("Local services have steady, predictable demand"); }
      if (p.primaryGoal === "full_business") { score += 15; reasons.push("Local services build real community-rooted businesses"); }
      if (p.timeAvailable === "fulltime") { score += 10; reasons.push("Full-time availability serves more clients"); }
      if (p.budget === "micro" || p.budget === "moderate") { score += 10; reasons.push("Low startup cost with basic tools and marketing"); }
      if (p.primaryGoal === "quick_cash") score -= 5; // takes time to build clientele
      break;
    }

    case "ecommerce_brand": {
      // Best for: serious budget, creative, wants to build equity
      if (p.budget === "serious") { score += 25; reasons.push("Brand building requires investment in product and marketing"); }
      if (p.budget === "moderate") { score += 10; reasons.push("Moderate budget can get started with a focused product line"); }
      if (p.skills.includes("creative")) { score += 20; reasons.push("Creative skills drive brand identity and content"); }
      if (p.primaryGoal === "full_business") { score += 20; reasons.push("Brands build the strongest long-term equity"); }
      if (p.riskTolerance === "high") { score += 10; reasons.push("Higher risk tolerance supports the investment phase"); }
      if (p.timeAvailable === "fulltime") { score += 10; reasons.push("Full-time focus accelerates product-market fit"); }
      if (p.budget === "none") score -= 25; // can't brand with no money
      if (p.primaryGoal === "quick_cash") score -= 15; // brands take time
      break;
    }

    case "digital_product": {
      // Best for: technical/creative skills, wants passive income
      if (p.skills.includes("technical")) { score += 20; reasons.push("Technical skills help build tools and templates"); }
      if (p.skills.includes("creative")) { score += 20; reasons.push("Creative skills produce sellable digital assets"); }
      if (p.primaryGoal === "side_income") { score += 15; reasons.push("Digital products generate passive recurring income"); }
      if (p.primaryGoal === "full_business") { score += 10; reasons.push("Digital products scale without inventory or fulfillment"); }
      if (p.budget === "none" || p.budget === "micro") { score += 15; reasons.push("Can create with just your skills and time"); }
      if (p.riskTolerance === "low") { score += 10; reasons.push("Low risk — no inventory, no shipping, no returns"); }
      if (p.skills.includes("none")) score -= 20;
      break;
    }

    case "improve_existing": {
      if (p.primaryGoal === "fix_existing") { score += 40; reasons.push("You've identified something broken — this path fixes it"); }
      if (p.businessStage === "has_revenue" || p.businessStage === "early_stage") { score += 25; reasons.push("You already have a business to improve"); }
      if (p.existingUrl) { score += 15; reasons.push("We can scan your current assets and find the gaps"); }
      if (p.businessStage === "no_business") score -= 30; // nothing to improve
      break;
    }

    case "scale_systems": {
      if (p.primaryGoal === "scale_existing") { score += 40; reasons.push("You need systems to grow beyond manual work"); }
      if (p.businessStage === "has_revenue" || p.businessStage === "scaling") { score += 25; reasons.push("Revenue exists — now it's about efficiency and systems"); }
      if (p.skills.includes("operations")) { score += 10; reasons.push("Operational mindset accelerates system implementation"); }
      if (p.businessStage === "no_business") score -= 30;
      if (p.businessStage === "idea_only") score -= 20;
      break;
    }
  }

  return { path, score: Math.max(0, Math.min(100, score)), reasons };
}

// ---------------------------------------------------------------------------
// Path metadata
// ---------------------------------------------------------------------------

function getPathMeta(path: BusinessPath): Omit<PathRecommendation, "confidence" | "reasoning"> {
  const meta: Record<BusinessPath, Omit<PathRecommendation, "confidence" | "reasoning">> = {
    affiliate: {
      path: "affiliate",
      label: "Affiliate Marketing",
      nextSteps: [
        "Choose a niche with proven demand",
        "Find 3-5 high-converting affiliate offers",
        "Build a simple landing page or content funnel",
        "Drive traffic through content or paid ads",
        "Test and optimize for conversions",
      ],
      estimatedTimeToFirstRevenue: "1-4 weeks",
      startingInvestment: "$0-$100",
      riskLevel: "Low",
    },
    dropshipping: {
      path: "dropshipping",
      label: "Dropshipping / E-commerce",
      nextSteps: [
        "Research winning products in your niche",
        "Set up a Shopify or equivalent store",
        "Create product pages with strong copy and visuals",
        "Launch test ads on Facebook/TikTok",
        "Scale winners and kill losers fast",
      ],
      estimatedTimeToFirstRevenue: "2-6 weeks",
      startingInvestment: "$200-$1,000",
      riskLevel: "Medium",
    },
    agency: {
      path: "agency",
      label: "Agency / Service Business",
      nextSteps: [
        "Define your core service offer",
        "Build a portfolio or case study (even hypothetical)",
        "Create a simple website and booking flow",
        "Reach out to 10 potential clients this week",
        "Close your first client and deliver results",
      ],
      estimatedTimeToFirstRevenue: "1-3 weeks",
      startingInvestment: "$0-$50",
      riskLevel: "Low",
    },
    freelance: {
      path: "freelance",
      label: "Freelancing",
      nextSteps: [
        "Package your strongest skill as a service",
        "Create profiles on freelance platforms",
        "Build a simple portfolio page",
        "Send 5 proposals or pitches daily",
        "Deliver exceptional work and get testimonials",
      ],
      estimatedTimeToFirstRevenue: "1-2 weeks",
      startingInvestment: "$0",
      riskLevel: "Low",
    },
    coaching: {
      path: "coaching",
      label: "Coaching / Consulting",
      nextSteps: [
        "Define your transformation promise",
        "Create a simple offer structure (1-on-1 or group)",
        "Build an authority page with your story",
        "Start creating content in your expertise area",
        "Get your first 3 clients through direct outreach",
      ],
      estimatedTimeToFirstRevenue: "2-4 weeks",
      startingInvestment: "$0-$100",
      riskLevel: "Low",
    },
    local_service: {
      path: "local_service",
      label: "Local Service Business",
      nextSteps: [
        "Choose your service and define your area",
        "Set up Google Business Profile",
        "Build a lead-gen website with booking",
        "Get your first 5 reviews",
        "Launch local ads and referral system",
      ],
      estimatedTimeToFirstRevenue: "1-4 weeks",
      startingInvestment: "$50-$300",
      riskLevel: "Low",
    },
    ecommerce_brand: {
      path: "ecommerce_brand",
      label: "E-commerce Brand",
      nextSteps: [
        "Define your brand identity and positioning",
        "Source or create your initial product line",
        "Build a branded Shopify store",
        "Create content and brand storytelling",
        "Launch with a pre-sale or founding customer strategy",
      ],
      estimatedTimeToFirstRevenue: "4-12 weeks",
      startingInvestment: "$1,000+",
      riskLevel: "High",
    },
    digital_product: {
      path: "digital_product",
      label: "Digital Products",
      nextSteps: [
        "Identify a problem your audience pays to solve",
        "Create your first digital product (template, guide, tool)",
        "Build a simple sales page",
        "Launch to an initial audience or marketplace",
        "Automate delivery and build email nurture",
      ],
      estimatedTimeToFirstRevenue: "2-6 weeks",
      startingInvestment: "$0-$50",
      riskLevel: "Low",
    },
    improve_existing: {
      path: "improve_existing",
      label: "Fix & Improve Your Business",
      nextSteps: [
        "Run a full scan of your current assets",
        "Identify the top 3 conversion killers",
        "Rebuild your weakest asset first",
        "Test the improvements with real traffic",
        "Measure impact and iterate",
      ],
      estimatedTimeToFirstRevenue: "1-2 weeks (improved revenue)",
      startingInvestment: "$0 (uses existing business)",
      riskLevel: "Low",
    },
    scale_systems: {
      path: "scale_systems",
      label: "Scale with Systems",
      nextSteps: [
        "Audit your current manual processes",
        "Identify the 3 biggest time drains",
        "Build email automations and CRM pipelines",
        "Create SOPs for repeatable tasks",
        "Set up reporting and tracking dashboards",
      ],
      estimatedTimeToFirstRevenue: "2-4 weeks (efficiency gains)",
      startingInvestment: "$100-$500 (tools)",
      riskLevel: "Low",
    },
  };
  return meta[path];
}

// ---------------------------------------------------------------------------
// Main decision function
// ---------------------------------------------------------------------------

const ALL_PATHS: BusinessPath[] = [
  "affiliate", "dropshipping", "agency", "freelance", "coaching",
  "local_service", "ecommerce_brand", "digital_product",
  "improve_existing", "scale_systems",
];

export function decide(profile: HimalayaProfileInput): DecisionResult {
  // Score all paths
  const scored = ALL_PATHS
    .map((path) => scorePath(path, profile))
    .sort((a, b) => b.score - a.score);

  // Build recommendations
  const toRecommendation = (s: PathScore): PathRecommendation => {
    const meta = getPathMeta(s.path);
    return {
      ...meta,
      confidence: s.score,
      reasoning: s.reasons.filter(Boolean),
    };
  };

  const primary = toRecommendation(scored[0]);
  const alternatives = scored
    .slice(1, 4)
    .filter((s) => s.score > 15)
    .map(toRecommendation);

  // Build profile summary
  const budgetLabel = { none: "no budget", micro: "under $100", moderate: "$100-$1,000", serious: "$1,000+" }[profile.budget];
  const timeLabel = { minimal: "1-2 hours/day", parttime: "4-6 hours/day", fulltime: "full-time" }[profile.timeAvailable];
  const stageLabel = {
    no_business: "starting from zero",
    idea_only: "has an idea",
    early_stage: "early stage",
    has_revenue: "making money",
    scaling: "ready to scale",
  }[profile.businessStage];

  const profileSummary = `${stageLabel}, ${budgetLabel}, ${timeLabel} available, ${profile.riskTolerance} risk tolerance`;

  return {
    primary,
    alternatives,
    profileSummary,
    stage: profile.businessStage,
  };
}
