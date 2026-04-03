import Anthropic from "@anthropic-ai/sdk";
import { fetchPage } from "@/src/logic/ad-os/fetchPage";
import { extractSignals } from "@/src/logic/ad-os/extractSignals";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CompetitorScan = {
  url: string;
  title: string;
  headline: string;
  ctas: string[];
  trustSignals: string[];
  benefits: string[];
  pricing: string | null;
  weaknesses: string[];
};

export type NicheIntelligence = {
  niche: string;
  businessType: string;
  competitors: CompetitorScan[];
  marketInsights: {
    commonPricing: string;
    commonPromises: string[];
    commonWeaknesses: string[];
    underservedAngles: string[];
    winningPatterns: string[];
  };
  differentiators: string[];
  recommendedPositioning: string;
  recommendedPricing: string;
  targetAudience: string;
  topPainPoints: string[];
};

// ---------------------------------------------------------------------------
// Step 1: Find competitors via SerpAPI
// ---------------------------------------------------------------------------

async function findCompetitors(niche: string, businessType: string): Promise<string[]> {
  const serpKey = process.env.SERPAPI_KEY;
  if (!serpKey) {
    console.warn("[NicheIntel] No SERPAPI_KEY — using fallback search");
    return [];
  }

  const queries = [
    `best ${businessType} for ${niche}`,
    `${niche} ${businessType} services`,
    `top ${niche} agencies`,
  ];

  const urls = new Set<string>();

  for (const q of queries.slice(0, 2)) {
    try {
      const params = new URLSearchParams({
        q,
        api_key: serpKey,
        engine: "google",
        num: "5",
      });
      const res = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
      if (!res.ok) continue;
      const data = (await res.json()) as { organic_results?: { link: string }[] };
      for (const r of (data.organic_results ?? []).slice(0, 3)) {
        if (r.link && !r.link.includes("youtube.com") && !r.link.includes("yelp.com") && !r.link.includes("facebook.com")) {
          urls.add(r.link);
        }
      }
    } catch {
      // search failed, continue
    }
  }

  return [...urls].slice(0, 5);
}

// ---------------------------------------------------------------------------
// Step 2: Scan each competitor
// ---------------------------------------------------------------------------

async function scanCompetitor(url: string): Promise<CompetitorScan | null> {
  try {
    const page = await fetchPage(url);
    if (!page.ok) return null;

    const signals = extractSignals(page);

    return {
      url,
      title: page.title,
      headline: signals.headline || page.headings[0] || "",
      ctas: signals.ctaText ? [signals.ctaText] : page.ctas.slice(0, 3),
      trustSignals: signals.trustSignals.slice(0, 5),
      benefits: signals.benefits.slice(0, 5),
      pricing: signals.price || null,
      weaknesses: detectWeaknesses(page, signals),
    };
  } catch {
    return null;
  }
}

function detectWeaknesses(
  page: { ctas: string[]; bodyText: string; title: string },
  signals: { trustSignals: string[]; price: string | null; benefits: string[]; headline: string }
): string[] {
  const weaknesses: string[] = [];
  if (signals.trustSignals.length === 0) weaknesses.push("No visible social proof or trust signals");
  if (!signals.price) weaknesses.push("No pricing transparency");
  if (signals.benefits.length < 2) weaknesses.push("Weak value proposition — benefits unclear");
  if (!signals.headline || signals.headline.length < 10) weaknesses.push("Weak or missing headline");
  if (page.ctas.length === 0) weaknesses.push("No clear call to action");
  if (page.bodyText.length < 500) weaknesses.push("Thin content — not enough information to convert");
  return weaknesses;
}

// ---------------------------------------------------------------------------
// Step 3: Analyze with Claude
// ---------------------------------------------------------------------------

async function analyzeWithClaude(
  niche: string,
  businessType: string,
  competitors: CompetitorScan[],
): Promise<Omit<NicheIntelligence, "niche" | "businessType" | "competitors">> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return buildFallbackAnalysis(niche, businessType, competitors);
  }

  const anthropic = new Anthropic({ apiKey });

  const competitorSummary = competitors.map((c, i) =>
    `Competitor ${i + 1}: ${c.url}\n  Headline: ${c.headline}\n  Benefits: ${c.benefits.join(", ") || "unclear"}\n  Trust: ${c.trustSignals.join(", ") || "none visible"}\n  Pricing: ${c.pricing || "hidden"}\n  Weaknesses: ${c.weaknesses.join(", ")}`
  ).join("\n\n");

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: `You are a business strategist. Analyze this competitive landscape and provide strategic recommendations.

Niche: ${niche}
Business type: ${businessType}
Number of competitors scanned: ${competitors.length}

${competitorSummary || "No competitors could be scanned."}

Respond in this exact JSON format (no markdown, just raw JSON):
{
  "marketInsights": {
    "commonPricing": "what competitors typically charge",
    "commonPromises": ["promise 1", "promise 2", "promise 3"],
    "commonWeaknesses": ["weakness 1", "weakness 2", "weakness 3"],
    "underservedAngles": ["angle 1", "angle 2"],
    "winningPatterns": ["pattern 1", "pattern 2"]
  },
  "differentiators": ["how to stand out 1", "how to stand out 2", "how to stand out 3"],
  "recommendedPositioning": "one sentence positioning statement",
  "recommendedPricing": "specific pricing recommendation",
  "targetAudience": "specific target audience description",
  "topPainPoints": ["pain 1", "pain 2", "pain 3"]
}`
      }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.error("[NicheIntel] Claude analysis failed:", err);
  }

  return buildFallbackAnalysis(niche, businessType, competitors);
}

function buildFallbackAnalysis(
  niche: string,
  businessType: string,
  competitors: CompetitorScan[],
): Omit<NicheIntelligence, "niche" | "businessType" | "competitors"> {
  const allWeaknesses = competitors.flatMap(c => c.weaknesses);
  const commonWeaknesses = [...new Set(allWeaknesses)].slice(0, 3);
  const allBenefits = competitors.flatMap(c => c.benefits);

  return {
    marketInsights: {
      commonPricing: competitors.find(c => c.pricing)?.pricing ?? "Not publicly listed by most competitors",
      commonPromises: [...new Set(allBenefits)].slice(0, 3),
      commonWeaknesses,
      underservedAngles: [
        `Transparent pricing for ${niche}`,
        `Results-first guarantee for ${niche}`,
      ],
      winningPatterns: [
        "Strong social proof on homepage",
        "Clear before/after case studies",
      ],
    },
    differentiators: [
      `Specialized exclusively in ${niche} — not a generalist`,
      "Transparent pricing and clear ROI metrics",
      "Done-for-you execution, not just strategy",
    ],
    recommendedPositioning: `The only ${businessType} built exclusively for ${niche} — with transparent pricing and guaranteed results.`,
    recommendedPricing: "Start at $1,500/mo for core package, $3,000-5,000/mo for full-service",
    targetAudience: `${niche} owners doing $10k-100k/month who are frustrated with generic marketing agencies`,
    topPainPoints: [
      "Wasted money on agencies that don't understand their industry",
      "No clear ROI from current marketing spend",
      `Competitors in ${niche} are winning online while they fall behind`,
    ],
  };
}

// ---------------------------------------------------------------------------
// Main: Run full niche intelligence pipeline
// ---------------------------------------------------------------------------

export async function runNicheIntelligence(
  niche: string,
  businessType: string,
): Promise<NicheIntelligence> {
  // Step 1: Find competitors
  const competitorUrls = await findCompetitors(niche, businessType);

  // Step 2: Scan them (parallel, with timeout)
  const scanPromises = competitorUrls.map(url =>
    Promise.race([
      scanCompetitor(url),
      new Promise<null>(resolve => setTimeout(() => resolve(null), 8000)),
    ])
  );
  const scannedRaw = await Promise.all(scanPromises);
  const competitors = scannedRaw.filter((c): c is CompetitorScan => c !== null);

  // Step 3: Analyze with Claude
  const analysis = await analyzeWithClaude(niche, businessType, competitors);

  return {
    niche,
    businessType,
    competitors,
    ...analysis,
  };
}
