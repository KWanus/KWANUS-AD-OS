import { fetchPage, type FetchedPage } from "@/src/logic/ad-os/fetchPage";
import { extractSignals, type ExtractedSignals } from "@/src/logic/ad-os/extractSignals";
import { diagnoseLink, type Diagnosis } from "@/src/logic/ad-os/diagnoseLink";
import { classifyLink } from "@/src/logic/ad-os/classifyLink";
import Anthropic from "@anthropic-ai/sdk";
import { extractJson } from "@/lib/himalaya/utils";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.HIMALAYA_MODEL || "claude-sonnet-4-6-20250514";

export interface CompetitorScan {
  url: string;
  fetchedPage: FetchedPage;
  signals: ExtractedSignals;
  diagnosis: Diagnosis;
  scannedAt: string;
}

export interface NicheIntelligence {
  niche: string;
  competitorsScanned: number;
  messagingPatterns: {
    headlines: string[];
    subheadlines: string[];
    commonAngles: string[];
    toneDescriptor: string;
  };
  trustApproaches: {
    commonElements: string[];
    socialProofTypes: string[];
    guaranteeTypes: string[];
  };
  conversionPatterns: {
    ctaStyles: string[];
    urgencyTactics: string[];
    offerStructures: string[];
  };
  sectionStructure: {
    commonOrder: string[];
    mustHaveSections: string[];
    differentiators: string[];
  };
  audienceInsights: {
    primaryAudience: string;
    painPoints: string[];
    desires: string[];
    buyingTriggers: string[];
    commonObjections: string[];
  };
  visualDirection: {
    colorTrends: string[];
    layoutStyle: string;
    imageUsage: string;
  };
  pricingIntel: {
    pricePoints: string[];
    pricingModels: string[];
    anchoringTactics: string[];
  };
  opportunities: {
    gaps: string[];
    weaknesses: string[];
    differentiationAngles: string[];
  };
}

const MAX_CONCURRENT = 5;

export async function scanCompetitors(urls: string[]): Promise<CompetitorScan[]> {
  const batched = urls.slice(0, MAX_CONCURRENT);
  const results = await Promise.allSettled(
    batched.map(async (url): Promise<CompetitorScan> => {
      const fetchedPage = await fetchPage(url);
      const signals = extractSignals(fetchedPage);
      const linkType = classifyLink(url, fetchedPage);
      const diagnosis = diagnoseLink(signals, linkType);
      return { url, fetchedPage, signals, diagnosis, scannedAt: new Date().toISOString() };
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<CompetitorScan> => r.status === "fulfilled")
    .map((r) => r.value);
}

export async function suggestCompetitorUrls(
  niche: string,
  location?: string
): Promise<string[]> {
  if (!process.env.ANTHROPIC_API_KEY) return [];

  const prompt = `You are a market research expert. Given a business niche${location ? ` in ${location}` : ""}, suggest 5 real competitor website URLs that a business in this space should study.

NICHE: ${niche}${location ? `\nLOCATION: ${location}` : ""}

Return ONLY a JSON array of URLs, no markdown:
["https://example1.com", "https://example2.com", ...]

Rules:
- Only suggest real, well-known businesses in this niche
- Prefer sites with strong marketing/conversion (not just big brands)
- Include a mix: market leader, direct competitor, aspirational brand, niche specialist, newcomer doing well`;

  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
    const match = raw.match(/\[[\s\S]*?\]/);
    if (match) {
      const parsed = JSON.parse(match[0]) as string[];
      return parsed.filter((u) => u.startsWith("http")).slice(0, 5);
    }
  } catch (e) {
    console.error("suggestCompetitorUrls failed:", e);
  }
  return [];
}

export async function synthesizeNicheIntelligence(
  scans: CompetitorScan[],
  niche: string
): Promise<NicheIntelligence> {
  if (!process.env.ANTHROPIC_API_KEY || scans.length === 0) {
    return buildFallbackIntelligence(niche, scans);
  }

  const scanSummaries = scans.map((s) => ({
    url: s.url,
    title: s.fetchedPage.title,
    headline: s.signals.headline,
    subheadline: s.signals.subheadline,
    ctas: s.fetchedPage.ctas,
    trustSignals: s.signals.trustSignals,
    benefits: s.signals.benefits,
    painLanguage: s.signals.painLanguage,
    offerComponents: s.signals.offerComponents,
    audienceHints: s.signals.audienceHints,
    angle: s.diagnosis.currentAngle,
    audience: s.diagnosis.likelyAudience,
    strengths: s.diagnosis.strengths,
    weaknesses: s.diagnosis.weaknesses,
  }));

  const systemPrompt = `You are an elite conversion strategist analyzing competitor websites in a niche. Synthesize patterns across all competitors into actionable intelligence for building a BETTER site.

Return ONLY a JSON object (no markdown fences) matching this exact structure:
{
  "messagingPatterns": {
    "headlines": ["top 3-5 headline approaches used"],
    "subheadlines": ["supporting message patterns"],
    "commonAngles": ["marketing angles used (pain, transformation, authority, etc.)"],
    "toneDescriptor": "one-line description of the overall tone"
  },
  "trustApproaches": {
    "commonElements": ["what trust elements are standard"],
    "socialProofTypes": ["reviews, case studies, logos, etc."],
    "guaranteeTypes": ["money-back, results guarantee, etc."]
  },
  "conversionPatterns": {
    "ctaStyles": ["button text patterns and placement strategies"],
    "urgencyTactics": ["scarcity/deadline tactics used"],
    "offerStructures": ["how offers are packaged"]
  },
  "sectionStructure": {
    "commonOrder": ["typical section ordering on pages"],
    "mustHaveSections": ["sections every competitor has"],
    "differentiators": ["unique sections that stand out"]
  },
  "audienceInsights": {
    "primaryAudience": "who these sites target",
    "painPoints": ["top 3-5 pains addressed"],
    "desires": ["top 3-5 desires promised"],
    "buyingTriggers": ["what makes this audience buy"],
    "commonObjections": ["objections being addressed"]
  },
  "visualDirection": {
    "colorTrends": ["common color approaches"],
    "layoutStyle": "layout pattern description",
    "imageUsage": "how images are used"
  },
  "pricingIntel": {
    "pricePoints": ["price ranges seen"],
    "pricingModels": ["subscription, one-time, tiered, etc."],
    "anchoringTactics": ["how price is justified/anchored"]
  },
  "opportunities": {
    "gaps": ["what NO competitor is doing well"],
    "weaknesses": ["common weaknesses across competitors"],
    "differentiationAngles": ["how to stand out from all of them"]
  }
}

Be specific and actionable. No generic advice.`;

  const userPrompt = `NICHE: ${niche}

COMPETITOR DATA (${scans.length} sites scanned):
${JSON.stringify(scanSummaries, null, 2)}

Analyze all competitors and synthesize intelligence.`;

  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
    const jsonStr = extractJson(raw);
    if (jsonStr) {
      const parsed = JSON.parse(jsonStr);
      return {
        niche,
        competitorsScanned: scans.length,
        ...parsed,
      } as NicheIntelligence;
    }
  } catch (e) {
    console.error("synthesizeNicheIntelligence failed:", e);
  }

  return buildFallbackIntelligence(niche, scans);
}

function buildFallbackIntelligence(niche: string, scans: CompetitorScan[]): NicheIntelligence {
  const allHeadlines = scans.map((s) => s.signals.headline).filter(Boolean);
  const allTrust = scans.flatMap((s) => s.signals.trustSignals);
  const allBenefits = scans.flatMap((s) => s.signals.benefits);
  const allPain = scans.flatMap((s) => s.signals.painLanguage);
  const allCtas = scans.flatMap((s) => s.fetchedPage.ctas);

  return {
    niche,
    competitorsScanned: scans.length,
    messagingPatterns: {
      headlines: allHeadlines.slice(0, 5),
      subheadlines: [],
      commonAngles: [...new Set(scans.map((s) => s.diagnosis.currentAngle))],
      toneDescriptor: "Professional, benefit-focused",
    },
    trustApproaches: {
      commonElements: [...new Set(allTrust)].slice(0, 5),
      socialProofTypes: [],
      guaranteeTypes: [],
    },
    conversionPatterns: {
      ctaStyles: [...new Set(allCtas)].slice(0, 5),
      urgencyTactics: [],
      offerStructures: [],
    },
    sectionStructure: {
      commonOrder: ["hero", "features", "testimonials", "pricing", "faq", "cta"],
      mustHaveSections: ["hero", "cta"],
      differentiators: [],
    },
    audienceInsights: {
      primaryAudience: scans[0]?.diagnosis.likelyAudience || niche,
      painPoints: [...new Set(allPain)].slice(0, 5),
      desires: [...new Set(allBenefits)].slice(0, 5),
      buyingTriggers: [],
      commonObjections: [],
    },
    visualDirection: {
      colorTrends: [],
      layoutStyle: "Standard conversion-focused layout",
      imageUsage: "Hero images, trust logos, product shots",
    },
    pricingIntel: {
      pricePoints: [],
      pricingModels: [],
      anchoringTactics: [],
    },
    opportunities: {
      gaps: scans.flatMap((s) => s.diagnosis.weaknesses).slice(0, 3),
      weaknesses: [],
      differentiationAngles: [],
    },
  };
}

export async function runFullResearch(
  niche: string,
  urls?: string[],
  location?: string
): Promise<{ scans: CompetitorScan[]; intelligence: NicheIntelligence }> {
  const competitorUrls = urls?.length ? urls : await suggestCompetitorUrls(niche, location);
  const scans = await scanCompetitors(competitorUrls);
  const intelligence = await synthesizeNicheIntelligence(scans, niche);
  return { scans, intelligence };
}
