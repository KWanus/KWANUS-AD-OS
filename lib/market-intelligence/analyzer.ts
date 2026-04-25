import Anthropic from "@anthropic-ai/sdk";
import { fetchPage } from "@/src/logic/ad-os/fetchPage";
import { extractSignals } from "@/src/logic/ad-os/extractSignals";
import { diagnoseLink } from "@/src/logic/ad-os/diagnoseLink";
import { classifyLink } from "@/src/logic/ad-os/classifyLink";
import type { DiscoveredProduct, WinnerProfile, ExecutionTier } from "./types";

const anthropic = new Anthropic();

// ---------------------------------------------------------------------------
// Winner Analysis — Deep-dives into a product's funnel, copy, and strategy
// ---------------------------------------------------------------------------

export async function analyzeWinner(
  product: DiscoveredProduct,
  executionTier: ExecutionTier = "elite"
): Promise<WinnerProfile> {
  let page = undefined;
  let signals = undefined;
  let diagnosis = undefined;

  if (product.url && product.url.startsWith("http")) {
    try {
      page = await fetchPage(product.url);
      if (page && !page.error) {
        signals = extractSignals(page);
        const linkType = classifyLink(product.url, page);
        diagnosis = diagnoseLink(signals, linkType);
      }
    } catch {
      // continue without page data
    }
  }

  const pageContext = page && !page.error
    ? `
SCRAPED PAGE DATA:
Title: ${page.title}
Meta: ${page.metaDescription}
Headlines: ${page.headings?.slice(0, 10).join(" | ")}
CTAs: ${page.ctas?.slice(0, 8).join(" | ")}
Body excerpt: ${page.bodyText?.slice(0, 2000)}

EXTRACTED SIGNALS:
Product: ${signals?.productName}
Price: ${signals?.price}
Headline: ${signals?.headline}
CTA: ${signals?.ctaText}
Trust: ${signals?.trustSignals?.join(", ")}
Benefits: ${signals?.benefits?.join(", ")}
Pain: ${signals?.painLanguage?.join(", ")}
Audience: ${signals?.audienceHints?.join(", ")}

DIAGNOSIS:
Selling: ${diagnosis?.whatIsBeingSold}
Audience: ${diagnosis?.likelyAudience}
Core desire: ${diagnosis?.corePainOrDesire}
Angle: ${diagnosis?.currentAngle}
Strengths: ${diagnosis?.strengths?.join(", ")}
Weaknesses: ${diagnosis?.weaknesses?.join(", ")}
`
    : `Product: ${product.name}\nNiche: ${product.niche}\nPlatform: ${product.platform}\nPrice: ${product.price}\nCommission: ${product.commission}`;

  const systemPrompt = executionTier === "elite"
    ? `You are a world-class funnel analyst and conversion rate expert. You reverse-engineer winning funnels, study why they convert, and identify exactly what makes them profitable. You think like a $100K/month affiliate marketer who studies every detail before launching.`
    : `You are a practical marketing analyst who studies what makes products sell well online.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{
      role: "user",
      content: `Analyze this product/funnel as a winning system that I want to study and potentially duplicate:

${pageContext}

Provide a detailed analysis in this exact JSON structure:
{
  "funnelStructure": [
    { "stepNumber": 1, "type": "ad|landing|bridge|vsl|checkout|upsell|downsell|thank_you|email", "purpose": "...", "keyElements": ["..."] }
  ],
  "customerAvatar": {
    "demographics": "Age, gender, income level, location",
    "painPoints": ["specific pain 1", "specific pain 2"],
    "desires": ["specific desire 1", "specific desire 2"],
    "objections": ["objection 1", "objection 2"],
    "buyingTriggers": ["trigger 1", "trigger 2"],
    "wheretheyHangOut": ["platform 1", "platform 2"]
  },
  "conversionStrategy": {
    "hookApproach": "The primary hook strategy used",
    "trustElements": ["element 1", "element 2"],
    "urgencyTactics": ["tactic 1", "tactic 2"],
    "pricingStrategy": "How they price and anchor",
    "guaranteeType": "What guarantee they offer",
    "socialProof": ["proof 1", "proof 2"],
    "emotionalTriggers": ["trigger 1", "trigger 2"]
  },
  "adIntelligence": {
    "commonHooks": ["hook 1", "hook 2", "hook 3"],
    "creativeFormats": ["UGC video", "talking head", "screenshot proof", etc.],
    "platforms": ["TikTok", "Facebook", "YouTube"],
    "estimatedSpend": "estimated daily ad spend range",
    "topPerformingAngle": "The single best angle for ads"
  },
  "strengths": ["what they do well"],
  "weaknesses": ["what they do poorly or miss"],
  "duplicableElements": ["what I can copy exactly"],
  "improvementOpportunities": ["how I can do it better"]
}

Be specific and actionable. Every item should help me launch a competing or promoting campaign. Return ONLY the JSON object.`,
    }],
  });

  const text = response.content[0]?.type === "text" ? response.content[0].text : "";

  let analysis: Partial<WinnerProfile> = {};
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      analysis = JSON.parse(jsonMatch[0]) as Partial<WinnerProfile>;
    }
  } catch {
    // use defaults
  }

  return {
    product,
    page: page && !page.error ? page : undefined,
    signals: signals ?? undefined,
    diagnosis: diagnosis ?? undefined,
    funnelStructure: analysis.funnelStructure ?? [
      { stepNumber: 1, type: "ad", purpose: "Grab attention", keyElements: ["Hook", "Problem statement"] },
      { stepNumber: 2, type: "landing", purpose: "Convert visitor", keyElements: ["Headline", "CTA", "Trust"] },
    ],
    customerAvatar: analysis.customerAvatar ?? {
      demographics: "Unknown — manual research needed",
      painPoints: [],
      desires: [],
      objections: [],
      buyingTriggers: [],
      wheretheyHangOut: [],
    },
    conversionStrategy: analysis.conversionStrategy ?? {
      hookApproach: "Unknown",
      trustElements: [],
      urgencyTactics: [],
      pricingStrategy: "Unknown",
      guaranteeType: "Unknown",
      socialProof: [],
      emotionalTriggers: [],
    },
    adIntelligence: analysis.adIntelligence ?? {
      commonHooks: [],
      creativeFormats: [],
      platforms: [],
    },
    strengths: analysis.strengths ?? [],
    weaknesses: analysis.weaknesses ?? [],
    duplicableElements: analysis.duplicableElements ?? [],
    improvementOpportunities: analysis.improvementOpportunities ?? [],
  };
}

// ---------------------------------------------------------------------------
// Batch analyze multiple products
// ---------------------------------------------------------------------------

export async function analyzeTopProducts(
  products: DiscoveredProduct[],
  executionTier: ExecutionTier = "elite",
  maxConcurrent: number = 3
): Promise<WinnerProfile[]> {
  const results: WinnerProfile[] = [];
  const batches = [];

  for (let i = 0; i < products.length; i += maxConcurrent) {
    batches.push(products.slice(i, i + maxConcurrent));
  }

  for (const batch of batches) {
    const batchResults = await Promise.allSettled(
      batch.map((p) => analyzeWinner(p, executionTier))
    );
    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      }
    }
  }

  return results;
}
