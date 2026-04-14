// ---------------------------------------------------------------------------
// Expansion Systems (226-250) — grow beyond the first business
//
// 226. Multi-product launcher
// 227. New market expansion planner
// 228. Pricing A/B test framework
// 229. Affiliate program manager
// 230. Wholesale/B2B pricing generator
// 231. Franchise model planner
// 232. Licensing/white-label kit
// 233. International expansion checklist
// 234. Partnership deal structurer
// 235. M&A target identifier
// 236. IP protection checklist
// 237. Brand style guide generator
// 238. Customer persona deep-dive
// 239. Competitive moat analyzer
// 240. Market sizing calculator
// 241. Unit economics calculator
// 242. CAC:LTV ratio tracker
// 243. Cohort analysis framework
// 244. Retention curve projector
// 245. Revenue per employee estimator
// 246. Burn rate calculator
// 247. Fundraising pitch generator
// 248. Investor update template
// 249. Board meeting prep
// 250. Exit multiple estimator
// ---------------------------------------------------------------------------

import { generateAI } from "@/lib/integrations/aiInference";

// ── 226. Multi-Product Launcher ──────────────────────────────────────────────

export async function planNewProduct(input: {
  existingProduct: string;
  niche: string;
  customerBase: number;
  avgOrderValue: number;
}): Promise<{
  recommendations: { product: string; price: string; reason: string; difficulty: "easy" | "medium" | "hard" }[];
  launchOrder: string[];
  revenueProjection: string;
}> {
  const result = await generateAI({
    prompt: `Current product: "${input.existingProduct}" in ${input.niche}
Customer base: ${input.customerBase} customers
Average order: $${input.avgOrderValue}

Recommend 3 new products to launch. For each:
- What is it specifically?
- Price point?
- Why will existing customers buy it?
- How hard to create?

Return JSON:
{
  "recommendations": [{"product":"...","price":"$X","reason":"...","difficulty":"easy|medium|hard"}],
  "launchOrder": ["Launch this first","Then this","Then this"],
  "revenueProjection": "Expected additional monthly revenue"
}`,
    systemPrompt: "You are a product strategist. Recommend products that cross-sell to existing customers. Return only JSON.",
    maxTokens: 600,
  });
  try { return JSON.parse(result.content); }
  catch {
    return {
      recommendations: [
        { product: `${input.niche} Templates Pack`, price: `$${Math.round(input.avgOrderValue * 0.3)}`, reason: "Low effort to create, high perceived value", difficulty: "easy" },
        { product: `Premium ${input.niche} Course`, price: `$${Math.round(input.avgOrderValue * 2)}`, reason: "Deepens relationship, higher ticket", difficulty: "medium" },
        { product: `Done-For-You ${input.niche} Service`, price: `$${Math.round(input.avgOrderValue * 5)}`, reason: "Highest margin, serves busy customers", difficulty: "hard" },
      ],
      launchOrder: ["Templates (quick win)", "Course (builds authority)", "Service (maximizes revenue)"],
      revenueProjection: `$${Math.round(input.customerBase * input.avgOrderValue * 0.15)}/month from cross-sells`,
    };
  }
}

// ── 237. Brand Style Guide ───────────────────────────────────────────────────

export async function generateBrandGuide(input: {
  businessName: string;
  niche: string;
  primaryColor: string;
  tone: string;
}): Promise<{
  logo: { usage: string; spacing: string; donts: string[] };
  colors: { primary: string; secondary: string; accent: string; background: string; text: string };
  typography: { headingFont: string; bodyFont: string; sizes: Record<string, string> };
  voice: { personality: string; toneWords: string[]; avoidWords: string[]; examples: { good: string; bad: string }[] };
  imagery: { style: string; subjects: string[]; avoid: string[] };
}> {
  return {
    logo: {
      usage: `Always use the ${input.businessName} logo with adequate spacing. Minimum size: 40px height.`,
      spacing: "Maintain padding equal to the height of the logo mark on all sides.",
      donts: ["Don't stretch or distort", "Don't change colors", "Don't add effects/shadows", "Don't place on busy backgrounds"],
    },
    colors: {
      primary: input.primaryColor,
      secondary: adjustColor(input.primaryColor, -30),
      accent: "#f59e0b",
      background: "#050a14",
      text: "#ffffff",
    },
    typography: {
      headingFont: "Inter",
      bodyFont: "Inter",
      sizes: { h1: "36px/900", h2: "28px/800", h3: "22px/700", body: "16px/400", small: "14px/400", caption: "12px/500" },
    },
    voice: {
      personality: input.tone,
      toneWords: ["direct", "honest", "confident", "helpful", "results-focused"],
      avoidWords: ["maybe", "try", "hope", "guru", "hack", "secret", "amazing"],
      examples: [
        { good: "Here's what works. No theory — just results.", bad: "We hope you'll find our amazing secrets helpful!" },
        { good: "This costs $97. Here's exactly what you get.", bad: "For a limited time, unlock this incredible deal!" },
      ],
    },
    imagery: {
      style: "Clean, professional, minimal. Real people over stock photos. Dark backgrounds with high contrast.",
      subjects: ["People using the product", "Results/outcomes", "Before/after", "Clean data visualizations"],
      avoid: ["Cheesy stock photos", "Overcrowded designs", "Clip art", "Overly filtered images"],
    },
  };
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// ── 240. Market Sizing ───────────────────────────────────────────────────────

export async function calculateMarketSize(niche: string): Promise<{
  tam: string; sam: string; som: string;
  reasoning: string;
  competitorCount: string;
  growthRate: string;
}> {
  const result = await generateAI({
    prompt: `Estimate the market size for "${niche}" online business:
TAM (Total Addressable Market): The entire market globally
SAM (Serviceable Addressable Market): The portion you could realistically reach online
SOM (Serviceable Obtainable Market): What a single operator could capture in year 1

Return JSON:
{"tam":"$X billion","sam":"$X million","som":"$X thousand-million","reasoning":"2 sentences","competitorCount":"estimate","growthRate":"X% per year"}`,
    systemPrompt: "You are a market analyst. Give realistic estimates. Return only JSON.",
    maxTokens: 300,
  });
  try { return JSON.parse(result.content); }
  catch {
    return { tam: "Unknown", sam: "Unknown", som: "$50K-500K/year achievable", reasoning: "Market data unavailable. Focus on getting your first 100 customers.", competitorCount: "Many", growthRate: "Growing" };
  }
}

// ── 241. Unit Economics Calculator ────────────────────────────────────────────

export function calculateUnitEconomics(input: {
  pricePerUnit: number;
  costPerUnit: number;
  customerAcquisitionCost: number;
  avgOrdersPerCustomer: number;
  monthlyChurnRate: number;
}): {
  grossMarginPerUnit: number;
  grossMarginPercent: number;
  ltv: number;
  cacLtvRatio: number;
  paybackPeriodMonths: number;
  healthy: boolean;
  advice: string;
} {
  const grossMargin = input.pricePerUnit - input.costPerUnit;
  const grossMarginPercent = input.pricePerUnit > 0 ? (grossMargin / input.pricePerUnit) * 100 : 0;
  const avgLifetimeMonths = input.monthlyChurnRate > 0 ? 1 / input.monthlyChurnRate : 24;
  const ltv = grossMargin * input.avgOrdersPerCustomer * avgLifetimeMonths;
  const cacLtvRatio = input.customerAcquisitionCost > 0 ? ltv / input.customerAcquisitionCost : 0;
  const paybackPeriodMonths = grossMargin > 0 ? input.customerAcquisitionCost / grossMargin : Infinity;

  const healthy = cacLtvRatio >= 3;
  const advice = cacLtvRatio >= 5
    ? "Excellent unit economics. Scale aggressively."
    : cacLtvRatio >= 3
    ? "Healthy unit economics. Room to increase ad spend."
    : cacLtvRatio >= 1
    ? "Marginal — you're barely breaking even per customer. Reduce CAC or increase prices."
    : "Unsustainable — you're losing money on each customer. Fix pricing or reduce acquisition costs immediately.";

  return {
    grossMarginPerUnit: Math.round(grossMargin * 100) / 100,
    grossMarginPercent: Math.round(grossMarginPercent),
    ltv: Math.round(ltv),
    cacLtvRatio: Math.round(cacLtvRatio * 10) / 10,
    paybackPeriodMonths: Math.round(paybackPeriodMonths * 10) / 10,
    healthy,
    advice,
  };
}

// ── 247. Fundraising Pitch Generator ─────────────────────────────────────────

export async function generatePitchDeck(input: {
  businessName: string;
  niche: string;
  revenue: string;
  growth: string;
  askAmount: string;
  useOfFunds: string;
}): Promise<{
  slides: { title: string; content: string }[];
}> {
  return {
    slides: [
      { title: "The Problem", content: `${input.niche} is broken. Most people waste time and money on solutions that don't work.` },
      { title: "The Solution", content: `${input.businessName} automates the entire ${input.niche} process — from strategy to execution to optimization.` },
      { title: "Traction", content: `Current revenue: ${input.revenue}. Growth: ${input.growth}. Users are seeing real results.` },
      { title: "Market Size", content: `The ${input.niche} market is massive and growing. We're targeting the segment that values automation and results.` },
      { title: "Business Model", content: `SaaS subscription + transaction fees. Multiple revenue streams: subscriptions, marketplace commission, premium services.` },
      { title: "Competitive Advantage", content: `Full automation. Others give you tools — we build the business. 200+ integrated systems vs. point solutions.` },
      { title: "The Team", content: `Founder-led with deep expertise in ${input.niche}, AI, and growth systems.` },
      { title: "The Ask", content: `Raising ${input.askAmount}. Use of funds: ${input.useOfFunds}. 18-month runway to reach profitability.` },
      { title: "Vision", content: `${input.businessName} becomes THE operating system for ${input.niche}. Every entrepreneur uses it. Every business runs on it.` },
    ],
  };
}

// ── 248. Investor Update Template ────────────────────────────────────────────

export function generateInvestorUpdate(input: {
  businessName: string;
  month: string;
  mrr: number;
  growth: number;
  customers: number;
  highlights: string[];
  challenges: string[];
  askFromInvestors: string;
}): string {
  return `# ${input.businessName} — ${input.month} Update

## Key Metrics
| Metric | Value | Change |
|--------|-------|--------|
| MRR | $${input.mrr.toLocaleString()} | ${input.growth > 0 ? "+" : ""}${input.growth}% |
| Customers | ${input.customers} | — |

## Highlights
${input.highlights.map(h => `- ${h}`).join("\n")}

## Challenges
${input.challenges.map(c => `- ${c}`).join("\n")}

## Ask
${input.askFromInvestors || "No specific ask this month."}

---
Thank you for your continued support.
— ${input.businessName} Team`;
}

// ── 250. Exit Multiple Estimator ─────────────────────────────────────────────

export function estimateExitMultiple(input: {
  annualRevenue: number;
  annualProfit: number;
  growthRate: number;
  recurringRevenuePercent: number;
  customerCount: number;
  monthsOfHistory: number;
  hasIP: boolean;
  niche: string;
}): {
  revenueMultiple: number;
  profitMultiple: number;
  estimatedValue: number;
  factors: string[];
  buyerTypes: string[];
} {
  let revMultiple = 2.0;
  let profitMultiple = 3.0;
  const factors: string[] = [];

  if (input.growthRate > 50) { revMultiple += 1.5; profitMultiple += 2.0; factors.push("High growth (50%+) adds premium"); }
  else if (input.growthRate > 20) { revMultiple += 0.5; profitMultiple += 1.0; factors.push("Moderate growth adds value"); }

  if (input.recurringRevenuePercent > 70) { revMultiple += 1.0; profitMultiple += 1.5; factors.push("70%+ recurring revenue — very attractive"); }
  else if (input.recurringRevenuePercent > 40) { revMultiple += 0.5; factors.push("Some recurring revenue helps"); }

  if (input.monthsOfHistory >= 24) { revMultiple += 0.5; factors.push("2+ years of history adds credibility"); }
  if (input.hasIP) { revMultiple += 0.5; factors.push("Intellectual property adds defensibility"); }
  if (input.customerCount > 1000) { revMultiple += 0.5; factors.push("1000+ customers shows product-market fit"); }

  const estimatedValue = Math.max(
    Math.round(input.annualRevenue * revMultiple),
    Math.round(input.annualProfit * profitMultiple),
  );

  const buyerTypes = [];
  if (input.annualRevenue > 1000000) buyerTypes.push("Private equity firms");
  if (input.annualRevenue > 100000) buyerTypes.push("Strategic acquirers in your industry");
  buyerTypes.push("Individual buyers on marketplaces (Empire Flippers, Flippa, Acquire.com)");
  if (input.hasIP) buyerTypes.push("Tech companies wanting your technology");

  return {
    revenueMultiple: Math.round(revMultiple * 10) / 10,
    profitMultiple: Math.round(profitMultiple * 10) / 10,
    estimatedValue,
    factors,
    buyerTypes,
  };
}
