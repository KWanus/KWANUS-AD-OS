import Anthropic from "@anthropic-ai/sdk";
import type { WinnerProfile, MarketSynthesis, ExecutionTier } from "./types";

const anthropic = new Anthropic();

// ---------------------------------------------------------------------------
// Market Synthesis — Combines all winner data into an actionable strategy
// ---------------------------------------------------------------------------

export async function synthesizeMarket(
  niche: string,
  winners: WinnerProfile[],
  executionTier: ExecutionTier = "elite"
): Promise<MarketSynthesis> {
  const winnersData = winners.map((w, i) => `
--- PRODUCT ${i + 1}: ${w.product.name} ---
Platform: ${w.product.platform}
Price: ${w.product.price ?? "unknown"}
Commission: ${w.product.commission ?? "unknown"}
Competition: ${w.product.competitionLevel ?? "unknown"}
Gravity: ${w.product.gravity ?? "unknown"}

Customer Avatar:
- Demographics: ${w.customerAvatar.demographics}
- Pain points: ${w.customerAvatar.painPoints.join(", ")}
- Desires: ${w.customerAvatar.desires.join(", ")}
- Objections: ${w.customerAvatar.objections.join(", ")}
- Buying triggers: ${w.customerAvatar.buyingTriggers.join(", ")}
- Where they are: ${w.customerAvatar.wheretheyHangOut.join(", ")}

Conversion Strategy:
- Hook: ${w.conversionStrategy.hookApproach}
- Trust: ${w.conversionStrategy.trustElements.join(", ")}
- Urgency: ${w.conversionStrategy.urgencyTactics.join(", ")}
- Pricing: ${w.conversionStrategy.pricingStrategy}
- Guarantee: ${w.conversionStrategy.guaranteeType}
- Emotional triggers: ${w.conversionStrategy.emotionalTriggers.join(", ")}

Ad Intel:
- Hooks: ${w.adIntelligence.commonHooks.join(" | ")}
- Formats: ${w.adIntelligence.creativeFormats.join(", ")}
- Platforms: ${w.adIntelligence.platforms.join(", ")}
- Best angle: ${w.adIntelligence.topPerformingAngle ?? "unknown"}

Funnel: ${w.funnelStructure.map((s) => `${s.stepNumber}. ${s.type}: ${s.purpose}`).join(" → ")}

Strengths: ${w.strengths.join(", ")}
Weaknesses: ${w.weaknesses.join(", ")}
What to copy: ${w.duplicableElements.join(", ")}
How to improve: ${w.improvementOpportunities.join(", ")}
`).join("\n");

  const systemPrompt = executionTier === "elite"
    ? `You are an elite marketing strategist who has generated over $10M in affiliate revenue. You synthesize market research into precise, actionable launch plans. You know exactly what works because you've tested thousands of campaigns. Your recommendations are specific, not generic. You think in terms of "what will make money THIS WEEK" not "someday."`
    : `You are a practical marketing strategist who helps beginners launch profitable campaigns with minimal risk.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 6000,
    system: systemPrompt,
    messages: [{
      role: "user",
      content: `I've analyzed ${winners.length} winning products in the "${niche}" niche. Here's all the intelligence:

${winnersData}

Now synthesize this into ONE actionable launch strategy. Pick the BEST product to promote and build a complete plan around it.

Return this exact JSON structure:
{
  "bestProduct": {
    "name": "The exact product name",
    "url": "Product URL",
    "platform": "clickbank|digistore24|jvzoo|warriorplus|amazon|shopify|direct",
    "reasoning": "Why this is the best pick (3-4 sentences, specific)",
    "estimatedEarningsPerDay": "$X at Y sales/day",
    "confidenceLevel": "high|medium|low"
  },
  "targetAudience": {
    "primary": "One sentence describing the ideal buyer",
    "demographics": "Age, gender, income, location specifics",
    "psychographics": "What they believe, fear, and want",
    "platformPresence": ["Where to find them online"]
  },
  "winningStrategy": {
    "primaryAngle": "The ONE angle to lead with",
    "hookFormula": "The hook structure that works (fill-in template)",
    "contentStyle": "UGC/talking head/screenshot/story — what format",
    "adFormat": "Video/image/carousel — what to create",
    "trafficSource": "Primary platform to run on",
    "budgetRecommendation": "Exact daily budget to start with and scaling plan"
  },
  "funnelBlueprint": {
    "steps": [
      { "stepNumber": 1, "type": "ad", "purpose": "...", "keyElements": ["..."] }
    ],
    "estimatedConversionRate": "X% based on market data",
    "keyDifferentiator": "What makes YOUR funnel better than existing ones"
  },
  "emailStrategy": {
    "sequenceType": "welcome|nurture|abandoned_cart|launch",
    "emailCount": 5,
    "keyMessages": ["Email 1 focus", "Email 2 focus", ...]
  },
  "dayOnePlan": {
    "tasks": [
      { "order": 1, "task": "Specific action", "timeEstimate": "30 min", "deliverable": "What you'll have after" }
    ]
  },
  "competitiveEdge": "Your specific advantage over other affiliates in this niche",
  "riskAssessment": "What could go wrong and how to mitigate",
  "scalePlaybook": "How to go from $50/day to $500/day"
}

Be SPECIFIC. No generic advice. Every recommendation should be based on the actual data from the winners analysis. Return ONLY the JSON.`,
    }],
  });

  const text = response.content[0]?.type === "text" ? response.content[0].text : "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as MarketSynthesis;
    }
  } catch {
    // fall through to default
  }

  return buildFallbackSynthesis(niche, winners);
}

// ---------------------------------------------------------------------------
// Generate launch assets from synthesis
// ---------------------------------------------------------------------------

export async function generateLaunchAssets(
  niche: string,
  synthesis: MarketSynthesis,
  executionTier: ExecutionTier = "elite"
): Promise<{
  hooks: string[];
  adScripts: Array<{ title: string; script: string; platform: string }>;
  emailSequence: Array<{ subject: string; body: string; sendDay: number }>;
}> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 6000,
    system: executionTier === "elite"
      ? "You are an elite direct-response copywriter. You write hooks that stop the scroll, ads that convert, and emails that sell. Every word earns its place."
      : "You are a practical copywriter who writes clear, converting marketing content.",
    messages: [{
      role: "user",
      content: `Based on this market strategy, generate ready-to-use launch assets:

PRODUCT: ${synthesis.bestProduct.name}
ANGLE: ${synthesis.winningStrategy.primaryAngle}
HOOK FORMULA: ${synthesis.winningStrategy.hookFormula}
AUDIENCE: ${synthesis.targetAudience.primary}
PLATFORM: ${synthesis.winningStrategy.trafficSource}
FORMAT: ${synthesis.winningStrategy.adFormat}

Generate:

1. HOOKS (10 scroll-stopping hooks for ${synthesis.winningStrategy.trafficSource}):
- Each under 15 words
- Mix of curiosity, pain, transformation, and proof angles
- Designed for ${synthesis.winningStrategy.contentStyle} content

2. AD SCRIPTS (3 complete ad scripts):
- Each 30-60 seconds
- Include: hook, problem, agitate, solution, proof, CTA
- Tailored for ${synthesis.winningStrategy.trafficSource}

3. EMAIL SEQUENCE (${synthesis.emailStrategy.emailCount} emails):
- Day number, subject line, and full email body
- Focus: ${synthesis.emailStrategy.keyMessages.join(", ")}

Return as JSON:
{
  "hooks": ["hook1", "hook2", ...],
  "adScripts": [{ "title": "...", "script": "...", "platform": "..." }],
  "emailSequence": [{ "subject": "...", "body": "...", "sendDay": 1 }]
}

Return ONLY the JSON.`,
    }],
  });

  const text = response.content[0]?.type === "text" ? response.content[0].text : "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as {
        hooks: string[];
        adScripts: Array<{ title: string; script: string; platform: string }>;
        emailSequence: Array<{ subject: string; body: string; sendDay: number }>;
      };
    }
  } catch {
    // fall through
  }

  return { hooks: [], adScripts: [], emailSequence: [] };
}

// ---------------------------------------------------------------------------
// Fallback
// ---------------------------------------------------------------------------

function buildFallbackSynthesis(niche: string, winners: WinnerProfile[]): MarketSynthesis {
  const best = winners[0];
  return {
    bestProduct: {
      name: best?.product.name ?? `Top ${niche} product`,
      url: best?.product.url ?? "",
      platform: best?.product.platform ?? "clickbank",
      reasoning: "Selected as the top candidate based on available market data. Manual verification recommended.",
      estimatedEarningsPerDay: "Unknown — testing required",
      confidenceLevel: "low",
    },
    targetAudience: {
      primary: best?.customerAvatar.demographics ?? "Unknown",
      demographics: best?.customerAvatar.demographics ?? "Requires research",
      psychographics: "Requires deeper audience research",
      platformPresence: best?.customerAvatar.wheretheyHangOut ?? ["Facebook", "TikTok"],
    },
    winningStrategy: {
      primaryAngle: best?.conversionStrategy.hookApproach ?? "Problem-solution",
      hookFormula: "What if [pain point] wasn't your fault?",
      contentStyle: "UGC video",
      adFormat: "Short-form video (15-30s)",
      trafficSource: "TikTok",
      budgetRecommendation: "$10-20/day to start",
    },
    funnelBlueprint: {
      steps: best?.funnelStructure ?? [],
      estimatedConversionRate: "1-3% (testing needed)",
      keyDifferentiator: "Requires competitive analysis",
    },
    emailStrategy: {
      sequenceType: "welcome",
      emailCount: 5,
      keyMessages: ["Welcome + value", "Pain agitation", "Social proof", "Objection handling", "Final CTA"],
    },
    dayOnePlan: {
      tasks: [
        { order: 1, task: "Sign up for affiliate program", timeEstimate: "15 min", deliverable: "Affiliate link" },
        { order: 2, task: "Create bridge page", timeEstimate: "1 hour", deliverable: "Landing page live" },
        { order: 3, task: "Record first ad creative", timeEstimate: "30 min", deliverable: "1 video ad" },
        { order: 4, task: "Launch first ad campaign", timeEstimate: "30 min", deliverable: "Campaign live" },
      ],
    },
    competitiveEdge: "Requires market positioning research",
    riskAssessment: "Low-data situation — budget conservatively and test before scaling",
    scalePlaybook: "Not enough data for scale recommendations yet",
  };
}
