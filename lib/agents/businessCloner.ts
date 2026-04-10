// ---------------------------------------------------------------------------
// Business Cloner — paste a competitor URL → reverse-engineer → improve → deploy
// Not copying. Competitive leap-frogging.
//
// Flow:
// 1. Scrape the competitor deeply (our scraper engine)
// 2. Analyze their Creative DNA (what's working)
// 3. Detect their weaknesses (what's broken)
// 4. Generate an IMPROVED version using their winning patterns + our fixes
// 5. Deploy it through the standard Himalaya pipeline
// ---------------------------------------------------------------------------

import { analyzeCompetitor, scrapeSEOData } from "@/lib/scraper/scrapers";
import { analyzeDNA } from "@/lib/agents/creativeDNA";
import { analyzeMarket } from "@/lib/intelligence/marketResearch";

export type CloneAnalysis = {
  original: {
    url: string;
    title: string;
    headline: string;
    pricing: string[];
    techStack: string[];
    strengths: string[];
    weaknesses: string[];
    dnaFormula: string;
  };
  improvements: CloneImprovement[];
  improvedBlueprint: {
    headline: string;
    subheadline: string;
    ctaText: string;
    trustElements: string[];
    benefitBullets: string[];
    faqItems: { question: string; answer: string }[];
    guaranteeText: string;
    urgencyLine: string;
    pricingSuggestion: string;
  };
  competitiveEdge: string;
  readyToDeploy: boolean;
};

export type CloneImprovement = {
  area: string;
  theirApproach: string;
  ourImprovement: string;
  impact: "high" | "medium" | "low";
};

/** Analyze a competitor and generate an improved version */
export async function cloneBusiness(url: string): Promise<CloneAnalysis | null> {
  // Step 1: Deep scrape
  const competitor = await analyzeCompetitor(url);
  if (!competitor) return null;

  const seo = await scrapeSEOData(url);

  // Step 2: Analyze their Creative DNA
  const headlineDNA = competitor.headline ? analyzeDNA(competitor.headline) : null;

  // Step 3: Identify improvements
  const improvements: CloneImprovement[] = [];

  // Headline improvements
  if (headlineDNA && headlineDNA.score < 70) {
    improvements.push({
      area: "Headline",
      theirApproach: competitor.headline || "No clear headline",
      ourImprovement: `Add: ${headlineDNA.weaknesses.slice(0, 2).join(", ")}. Their formula: ${headlineDNA.winningFormula}`,
      impact: "high",
    });
  }

  // Trust signal gaps
  if (competitor.trustSignals.length < 3) {
    improvements.push({
      area: "Trust & Social Proof",
      theirApproach: competitor.trustSignals.length > 0 ? `Only ${competitor.trustSignals.length} trust signals` : "No trust signals",
      ourImprovement: "Add: customer count, star rating, guarantee badge, security badges, media mentions",
      impact: "high",
    });
  }

  // CTA improvements
  if (competitor.ctas.length <= 1) {
    improvements.push({
      area: "Calls to Action",
      theirApproach: competitor.ctas[0] ?? "No clear CTA",
      ourImprovement: "Add: hero CTA, mid-page CTA, bottom CTA. Use first-person format ('Get My Results')",
      impact: "high",
    });
  }

  // FAQ/objection handling
  if (!competitor.hasFAQ) {
    improvements.push({
      area: "Objection Handling",
      theirApproach: "No FAQ section",
      ourImprovement: "Add 5-question FAQ addressing top objections: price, results, trust, timing, uniqueness",
      impact: "medium",
    });
  }

  // Guarantee
  if (!competitor.weaknesses.some((w) => w.includes("guarantee"))) {
    // They have a guarantee — we need a BETTER one
  } else {
    improvements.push({
      area: "Risk Reversal",
      theirApproach: "No guarantee visible",
      ourImprovement: "Add bold guarantee: '60-day money-back, no questions asked' — removes #1 buying objection",
      impact: "high",
    });
  }

  // Chat/booking
  if (!competitor.hasChat) {
    improvements.push({
      area: "Live Engagement",
      theirApproach: "No chat widget",
      ourImprovement: "Add live chat — captures leads who won't fill out forms",
      impact: "medium",
    });
  }
  if (!competitor.hasBooking) {
    improvements.push({
      area: "Booking System",
      theirApproach: "No online booking",
      ourImprovement: "Add embedded booking calendar — reduces friction from 'contact us' to 'book now'",
      impact: "medium",
    });
  }

  // Video
  if (!competitor.hasVideo) {
    improvements.push({
      area: "Video Content",
      theirApproach: "No video on page",
      ourImprovement: "Add AI video spokesperson — pages with video convert 80% higher",
      impact: "medium",
    });
  }

  // SEO improvements
  if (seo && seo.score < 70) {
    improvements.push({
      area: "SEO",
      theirApproach: `SEO score: ${seo.score}/100`,
      ourImprovement: `Fix: ${!seo.hasSchema ? "Add schema markup. " : ""}${seo.imagesWithoutAlt > 0 ? "Add image alt text. " : ""}${seo.descLength < 120 ? "Expand meta description. " : ""}Better on-page SEO = free organic traffic.`,
      impact: "medium",
    });
  }

  // Step 4: Generate improved blueprint
  const improvedHeadline = competitor.headline
    ? improveHeadline(competitor.headline, competitor.benefits, headlineDNA)
    : "Get [Outcome] — Without the Guesswork";

  const blueprint = {
    headline: improvedHeadline,
    subheadline: `Everything ${competitor.title.split("|")[0]?.trim() ?? "they"} offer, plus ${improvements.filter((i) => i.impact === "high").map((i) => i.area.toLowerCase()).join(", ")}. Proven results.`,
    ctaText: `Get My ${competitor.benefits[0]?.split(" ").slice(0, 3).join(" ") ?? "Results"} →`,
    trustElements: [
      "100% Money-Back Guarantee",
      "Trusted by 500+ customers",
      "4.9/5 star rating",
      ...competitor.trustSignals.slice(0, 2),
    ],
    benefitBullets: competitor.benefits.length > 0
      ? competitor.benefits.map((b) => `✓ ${b}`)
      : ["✓ Proven system", "✓ Fast results", "✓ Full support", "✓ Risk-free guarantee"],
    faqItems: [
      { question: "How is this different from competitors?", answer: `We address the gaps others miss: ${improvements.slice(0, 2).map((i) => i.area.toLowerCase()).join(", ")}. Plus a stronger guarantee.` },
      { question: "Will this work for my situation?", answer: "Yes — our system adapts to your specific needs. And if it doesn't work, you get a full refund." },
      { question: "How quickly will I see results?", answer: "Most customers see initial results within 2 weeks. Significant improvement within 30-60 days." },
      { question: "What if I need help?", answer: "Full support included. Chat, email, and booking available 24/7." },
      { question: "Is there a guarantee?", answer: "60-day money-back guarantee. No questions, no hoops, no hassle." },
    ],
    guaranteeText: "60-Day Money-Back Guarantee. Try it completely risk-free. If you don't see results, we refund every penny — no questions asked.",
    urgencyLine: "Limited availability — spots filling up this week",
    pricingSuggestion: competitor.pricing.length > 0
      ? `Competitor charges ${competitor.pricing[0]}. Position at similar or slightly lower with more value.`
      : "No competitor pricing visible — opportunity to set the anchor.",
  };

  const competitiveEdge = improvements.length >= 3
    ? `${improvements.length} improvements over ${competitor.title.split("|")[0]?.trim() ?? "competitor"}: ${improvements.filter((i) => i.impact === "high").map((i) => i.area).join(", ")}`
    : "Marginal improvements — consider differentiating on service, speed, or guarantee.";

  return {
    original: {
      url: competitor.url,
      title: competitor.title,
      headline: competitor.headline,
      pricing: competitor.pricing,
      techStack: competitor.techStack,
      strengths: competitor.trustSignals.slice(0, 5),
      weaknesses: competitor.weaknesses,
      dnaFormula: headlineDNA?.winningFormula ?? "unknown",
    },
    improvements: improvements.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.impact] - order[b.impact];
    }),
    improvedBlueprint: blueprint,
    competitiveEdge,
    readyToDeploy: improvements.length >= 2,
  };
}

function improveHeadline(original: string, benefits: string[], dna: ReturnType<typeof analyzeDNA> | null): string {
  // If original is weak, rebuild
  if (!dna || dna.score < 50) {
    const benefit = benefits[0] ?? "Real Results";
    return `Get ${benefit} — Guaranteed or Your Money Back`;
  }

  // If original is decent, strengthen it
  if (dna.score < 75) {
    if (!dna.dna.usesNumber) return original.replace(/\.$/, "") + " (Proven by 500+ Customers)";
    if (!dna.dna.mentionsGuarantee) return original.replace(/\.$/, "") + " — Risk Free";
    if (!dna.dna.usesSpecificResult) return original.replace(/\.$/, "") + " in 30 Days or Less";
  }

  // Original is strong — keep it and add one improvement
  return original;
}
