// ---------------------------------------------------------------------------
// Testing & Optimization Engine — makes everything better automatically
//
// Handles gaps 75-78:
// 75. Landing page split testing
// 76. Email subject line testing
// 77. Dynamic pricing
// 78. Waitlist/pre-launch system
//
// Also 84-85:
// 84. Market trend detection
// 85. Customer lifetime value tracking
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import { generateAI } from "@/lib/integrations/aiInference";

// ── 75. Landing Page Split Testing ───────────────────────────────────────────

export type SplitTest = {
  id: string;
  siteId: string;
  pageId: string;
  element: "headline" | "cta" | "hero_image" | "price" | "layout";
  variantA: string;
  variantB: string;
  impressionsA: number;
  impressionsB: number;
  conversionsA: number;
  conversionsB: number;
  winner: "a" | "b" | "undecided";
  confidence: number; // 0-100
  status: "running" | "completed";
};

export async function createSplitTest(input: {
  userId: string;
  siteId: string;
  pageId: string;
  element: SplitTest["element"];
  variantA: string;
  variantB: string;
}): Promise<string> {
  const event = await prisma.himalayaFunnelEvent.create({
    data: {
      userId: input.userId,
      event: "split_test_created",
      metadata: JSON.parse(JSON.stringify({
        siteId: input.siteId,
        pageId: input.pageId,
        element: input.element,
        variantA: input.variantA,
        variantB: input.variantB,
        impressionsA: 0, impressionsB: 0,
        conversionsA: 0, conversionsB: 0,
        status: "running",
        createdAt: new Date().toISOString(),
      })),
    },
  });
  return event.id;
}

export function determineSplitTestWinner(test: {
  impressionsA: number; impressionsB: number;
  conversionsA: number; conversionsB: number;
}): { winner: "a" | "b" | "undecided"; confidence: number } {
  const minImpressions = 100;
  if (test.impressionsA < minImpressions || test.impressionsB < minImpressions) {
    return { winner: "undecided", confidence: 0 };
  }

  const rateA = test.conversionsA / test.impressionsA;
  const rateB = test.conversionsB / test.impressionsB;

  // Simple Z-test approximation
  const pooledRate = (test.conversionsA + test.conversionsB) / (test.impressionsA + test.impressionsB);
  const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1/test.impressionsA + 1/test.impressionsB));
  const z = se > 0 ? Math.abs(rateA - rateB) / se : 0;

  // Z > 1.96 = 95% confidence
  const confidence = Math.min(Math.round((z / 1.96) * 95), 99);

  if (confidence >= 90) {
    return { winner: rateA > rateB ? "a" : "b", confidence };
  }
  return { winner: "undecided", confidence };
}

// ── Auto-generate B variant for headlines ──

export async function generateVariantB(input: {
  element: string;
  currentValue: string;
  niche: string;
}): Promise<string> {
  const result = await generateAI({
    prompt: `The current ${input.element} is: "${input.currentValue}"
Niche: ${input.niche}

Write ONE alternative version that might convert better.
Rules:
- Same meaning, different angle
- If headline: try a different hook type (question vs statement vs number)
- If CTA: try a different urgency level
- If price: suggest a different anchor/frame
Return ONLY the alternative text, nothing else.`,
    systemPrompt: "You are a conversion optimization expert.",
    maxTokens: 100,
  });
  return result.content.trim() || input.currentValue;
}

// ── 76. Email Subject Line Testing ───────────────────────────────────────────

export async function generateSubjectLineVariants(input: {
  originalSubject: string;
  niche: string;
}): Promise<string[]> {
  const result = await generateAI({
    prompt: `Original email subject: "${input.originalSubject}"
Niche: ${input.niche}

Write 3 alternative subject lines using different approaches:
1. Curiosity gap
2. Number/stat
3. Personal/direct

Return as JSON array: ["subject1","subject2","subject3"]`,
    systemPrompt: "You write high-open-rate email subjects. Return only JSON array.",
    maxTokens: 200,
  });
  try { return JSON.parse(result.content); } catch { return [input.originalSubject]; }
}

// ── 77. Dynamic Pricing ──────────────────────────────────────────────────────

export type DynamicPriceRule = {
  condition: "first_visit" | "returning" | "high_intent" | "cart_abandon" | "seasonal" | "bulk";
  adjustment: number; // percentage: -20 = 20% off, +10 = 10% markup
  label: string;
  expiresIn?: number; // hours
};

export function getDynamicPriceRules(input: {
  basePrice: number;
  niche: string;
  isHighCompetition: boolean;
}): DynamicPriceRule[] {
  const rules: DynamicPriceRule[] = [
    { condition: "first_visit", adjustment: -10, label: "New visitor discount", expiresIn: 24 },
    { condition: "cart_abandon", adjustment: -15, label: "Complete your order and save", expiresIn: 48 },
    { condition: "returning", adjustment: -5, label: "Welcome back discount" },
  ];

  if (input.isHighCompetition) {
    rules.push({ condition: "high_intent", adjustment: 0, label: "Popular — selling fast" });
  } else {
    rules.push({ condition: "high_intent", adjustment: 5, label: "High demand pricing" });
  }

  // Seasonal
  const month = new Date().getMonth();
  if (month === 10) { // November — Black Friday
    rules.push({ condition: "seasonal", adjustment: -30, label: "Black Friday Special", expiresIn: 96 });
  } else if (month === 0) { // January — New Year
    rules.push({ condition: "seasonal", adjustment: -20, label: "New Year Sale", expiresIn: 168 });
  }

  return rules;
}

export function calculateDynamicPrice(basePrice: number, rule: DynamicPriceRule): number {
  return Math.round(basePrice * (1 + rule.adjustment / 100));
}

// ── 78. Waitlist/Pre-Launch System ───────────────────────────────────────────

export function generateWaitlistPage(input: {
  productName: string;
  launchDate?: string;
  description: string;
  primaryColor: string;
}): object[] {
  return [
    {
      id: "waitlist-hero",
      type: "hero",
      props: {
        title: `${input.productName} is Coming Soon`,
        subtitle: input.description,
        layout: "centered",
      },
    },
    {
      id: "waitlist-countdown",
      type: "text",
      props: {
        title: input.launchDate ? `Launching ${input.launchDate}` : "Launching Soon",
        body: "Be the first to know. Join the waitlist and get early access + a special launch discount.",
      },
    },
    {
      id: "waitlist-form",
      type: "form",
      props: {
        title: "Join the Waitlist",
        fields: ["name", "email"],
        buttonText: "Get Early Access",
        submitUrl: "/api/forms/submit",
        enrollInFlow: true,
      },
    },
    {
      id: "waitlist-proof",
      type: "stats",
      props: {
        items: [
          { value: "0", label: "People on the waitlist" },
          { value: "Free", label: "To join" },
          { value: "50%", label: "Launch discount for waitlist" },
        ],
      },
    },
  ];
}

// ── 84. Market Trend Detection ───────────────────────────────────────────────

export async function detectMarketTrends(niche: string): Promise<{
  trending: string[];
  declining: string[];
  opportunities: string[];
  recommendation: string;
}> {
  const result = await generateAI({
    prompt: `Analyze current market trends for "${niche}" as of 2026.

Return JSON:
{
  "trending": ["3 things growing in demand"],
  "declining": ["3 things losing demand"],
  "opportunities": ["3 gaps or underserved areas"],
  "recommendation": "One sentence: what to focus on right now"
}`,
    systemPrompt: "You are a market analyst with real-time trend awareness. Return only JSON.",
    maxTokens: 400,
  });
  try { return JSON.parse(result.content); }
  catch { return { trending: [], declining: [], opportunities: [], recommendation: "Focus on what's working and double down." }; }
}

// ── 85. Customer Lifetime Value Tracking ─────────────────────────────────────

export async function calculateCustomerLTV(input: {
  userId: string;
  siteIds: string[];
}): Promise<{
  avgOrderValue: number;
  avgOrdersPerCustomer: number;
  estimatedLTV: number;
  topCustomers: { email: string; totalSpent: number; orders: number }[];
  bestLeadSource: string;
}> {
  if (input.siteIds.length === 0) {
    return { avgOrderValue: 0, avgOrdersPerCustomer: 0, estimatedLTV: 0, topCustomers: [], bestLeadSource: "none" };
  }

  const orders = await prisma.siteOrder.findMany({
    where: { siteId: { in: input.siteIds }, status: { in: ["paid", "fulfilled"] } },
    select: { customerEmail: true, amountCents: true },
  });

  if (orders.length === 0) {
    return { avgOrderValue: 0, avgOrdersPerCustomer: 0, estimatedLTV: 0, topCustomers: [], bestLeadSource: "none" };
  }

  // Group by customer
  const customerMap = new Map<string, { total: number; count: number }>();
  for (const o of orders) {
    const existing = customerMap.get(o.customerEmail) ?? { total: 0, count: 0 };
    existing.total += o.amountCents;
    existing.count++;
    customerMap.set(o.customerEmail, existing);
  }

  const customers = [...customerMap.entries()].map(([email, data]) => ({
    email,
    totalSpent: data.total / 100,
    orders: data.count,
  }));

  const totalRevenue = orders.reduce((sum, o) => sum + o.amountCents, 0) / 100;
  const avgOrderValue = totalRevenue / orders.length;
  const avgOrdersPerCustomer = orders.length / customerMap.size;
  const estimatedLTV = avgOrderValue * avgOrdersPerCustomer * 12; // annualized

  const topCustomers = customers.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

  // Find best lead source
  const contacts = await prisma.emailContact.findMany({
    where: {
      userId: input.userId,
      email: { in: customers.slice(0, 20).map(c => c.email) },
    },
    select: { email: true, source: true },
  });

  const sourceCount = new Map<string, number>();
  for (const c of contacts) {
    const src = c.source ?? "direct";
    sourceCount.set(src, (sourceCount.get(src) ?? 0) + 1);
  }
  const bestLeadSource = [...sourceCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "direct";

  return { avgOrderValue, avgOrdersPerCustomer, estimatedLTV, topCustomers, bestLeadSource };
}
