import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

// Types
export interface MIInput {
  niche: string;
  subNiche?: string;
  vertical: "affiliate" | "dropship" | "ecommerce" | "digital" | "local_service";
  executionTier?: "starter" | "pro" | "elite";
}

export interface DiscoveredProduct {
  name: string;
  url: string;
  platform: string;
  niche: string;
  subNiche?: string;
  commission?: string;
  price?: string;
  gravity?: number;
  avgEarningsPerSale?: string;
  recurring?: boolean;
  competitionLevel?: string;
  demandSignals?: string[];
}

export interface WinnerProfile {
  product: DiscoveredProduct;
  strengths: string[];
  weaknesses: string[];
  audienceMatch: string;
  marketingAngle: string;
  estimatedPotential: string;
  competitorGaps: string[];
}

export interface MarketSynthesis {
  overallScore: number;
  bestProduct: {
    name: string;
    url: string;
    whyBest: string;
  };
  targetAudience: {
    demographics: string;
    painPoints: string[];
    desires: string[];
    buyingTriggers: string[];
    objections: string[];
  };
  winningStrategy: {
    primaryAngle: string;
    differentiator: string;
    pricingStrategy: string;
    trafficSources: string[];
    contentStrategy: string;
  };
  funnelBlueprint: {
    type: string;
    stages: string[];
    conversionGoals: string[];
  };
  dayOnePlan: {
    steps: string[];
    budget: string;
    timeline: string;
  };
}

export interface GeneratedAssets {
  hooks: string[];
  adScripts: Array<{
    title: string;
    platform: string;
    duration: string;
    script: string;
  }>;
  emailSequence: Array<{
    subject: string;
    body: string;
    timing: string;
  }>;
  landingPageOutline: {
    headline: string;
    subheadline: string;
    sections: string[];
    cta: string;
  };
}

export interface MIResult {
  discoveredProducts: DiscoveredProduct[];
  winnerProfiles: WinnerProfile[];
  synthesis: MarketSynthesis;
  generatedAssets: GeneratedAssets;
  score: number;
}

async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  const block = response.content[0];
  return block.type === "text" ? block.text : "";
}

function parseJSON<T>(text: string): T {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = match ? match[1].trim() : text.trim();
  return JSON.parse(raw) as T;
}

// Stage 1: Discovery
async function discoverProducts(input: MIInput): Promise<DiscoveredProduct[]> {
  const system = `You are an expert market researcher specializing in ${input.vertical} products and niches. Return ONLY valid JSON.`;
  const prompt = `Find the top 8-12 products/offers in the "${input.niche}"${input.subNiche ? ` (sub-niche: ${input.subNiche})` : ""} market for ${input.vertical}.

For each product, provide:
- name, url (real or likely URL), platform (ClickBank, Amazon, Shopify, JVZoo, etc.)
- niche, subNiche
- commission (if affiliate), price, gravity (if ClickBank)
- avgEarningsPerSale, recurring (boolean)
- competitionLevel (low/medium/high)
- demandSignals (array of evidence strings)

Return a JSON array of products. Focus on REAL products that exist in this market.

\`\`\`json
[{ "name": "...", ... }]
\`\`\``;

  const result = await callClaude(system, prompt);
  return parseJSON<DiscoveredProduct[]>(result);
}

// Stage 2: Winner Analysis
async function analyzeWinners(products: DiscoveredProduct[], input: MIInput): Promise<WinnerProfile[]> {
  const top = products.slice(0, 3);
  const system = `You are an elite marketing strategist analyzing winning products. Return ONLY valid JSON.`;
  const prompt = `Analyze these top 3 products in the "${input.niche}" ${input.vertical} market:

${JSON.stringify(top, null, 2)}

For each product, provide a winner profile with:
- product (the original product object)
- strengths (array of 3-5 strings)
- weaknesses (array of 2-3 strings)
- audienceMatch (string describing ideal customer)
- marketingAngle (the best angle to sell this)
- estimatedPotential (earning potential description)
- competitorGaps (what competitors miss that you can exploit)

\`\`\`json
[{ "product": {...}, "strengths": [...], ... }]
\`\`\``;

  const result = await callClaude(system, prompt);
  return parseJSON<WinnerProfile[]>(result);
}

// Stage 3: Market Synthesis
async function synthesizeMarket(
  products: DiscoveredProduct[],
  winners: WinnerProfile[],
  input: MIInput
): Promise<MarketSynthesis> {
  const system = `You are a market intelligence analyst creating actionable business strategies. Return ONLY valid JSON.`;
  const prompt = `Based on this market research for "${input.niche}" (${input.vertical}):

Discovered Products: ${JSON.stringify(products.slice(0, 5), null, 2)}

Winner Analysis: ${JSON.stringify(winners, null, 2)}

Create a comprehensive market synthesis with:
- overallScore (0-100, how viable this niche is)
- bestProduct: { name, url, whyBest }
- targetAudience: { demographics, painPoints[], desires[], buyingTriggers[], objections[] }
- winningStrategy: { primaryAngle, differentiator, pricingStrategy, trafficSources[], contentStrategy }
- funnelBlueprint: { type, stages[], conversionGoals[] }
- dayOnePlan: { steps[] (5-7 actionable steps), budget, timeline }

Execution tier: ${input.executionTier ?? "elite"}

\`\`\`json
{ "overallScore": ..., "bestProduct": {...}, ... }
\`\`\``;

  const result = await callClaude(system, prompt);
  return parseJSON<MarketSynthesis>(result);
}

// Stage 4: Asset Generation
async function generateAssets(
  synthesis: MarketSynthesis,
  winners: WinnerProfile[],
  input: MIInput
): Promise<GeneratedAssets> {
  const system = `You are an elite direct-response copywriter and marketing asset creator. Return ONLY valid JSON.`;
  const prompt = `Generate complete marketing assets for a ${input.vertical} business in "${input.niche}".

Strategy: ${JSON.stringify(synthesis.winningStrategy)}
Best Product: ${JSON.stringify(synthesis.bestProduct)}
Target Audience: ${JSON.stringify(synthesis.targetAudience)}

Create:
1. hooks: 8 scroll-stopping ad hooks (short, punchy)
2. adScripts: 3 ad scripts with { title, platform (Facebook/TikTok/YouTube), duration, script }
3. emailSequence: 5-email nurture sequence with { subject, body (full email), timing (e.g. "Day 1") }
4. landingPageOutline: { headline, subheadline, sections[] (section names), cta }

\`\`\`json
{ "hooks": [...], "adScripts": [...], "emailSequence": [...], "landingPageOutline": {...} }
\`\`\``;

  const result = await callClaude(system, prompt);
  return parseJSON<GeneratedAssets>(result);
}

// Main pipeline
export async function runMarketIntelligence(input: MIInput): Promise<MIResult> {
  const products = await discoverProducts(input);
  const winnerProfiles = await analyzeWinners(products, input);
  const synthesis = await synthesizeMarket(products, winnerProfiles, input);
  const generatedAssets = await generateAssets(synthesis, winnerProfiles, input);

  return {
    discoveredProducts: products,
    winnerProfiles,
    synthesis,
    generatedAssets,
    score: synthesis.overallScore,
  };
}
