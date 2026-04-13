// ---------------------------------------------------------------------------
// Automation Systems (151-175) — the invisible workforce
//
// 151. Smart scheduling (best time to post per platform)
// 152. Auto-reply to common questions (FAQ bot)
// 153. Lead assignment rules (if team > 1)
// 154. Pipeline automation (auto-move stages)
// 155. Payment plan/installment generator
// 156. Dunning management (failed payment recovery)
// 157. Subscription lifecycle (trial → paid → renewal → cancel)
// 158. Affiliate payout calculator
// 159. Tax collection rules per state/country
// 160. Multi-language content generator
// 161. Timezone-aware delivery
// 162. Smart segmentation (auto-tag contacts)
// 163. Engagement scoring (beyond lead scoring)
// 164. Predictive revenue forecasting
// 165. Automated competitor response (when they launch something)
// 166. Brand mention monitoring
// 167. Review response automation
// 168. Refund prevention system (intervene before refund)
// 169. Customer health score
// 170. Product recommendation engine
// 171. Dynamic email content (personalized per segment)
// 172. Behavioral trigger emails
// 173. Win/loss analysis automation
// 174. Price elasticity testing
// 175. Auto-generated monthly investor/stakeholder update
// ---------------------------------------------------------------------------

import { generateAI } from "@/lib/integrations/aiInference";
import { prisma } from "@/lib/prisma";

// ── 151. Smart Scheduling ────────────────────────────────────────────────────

export const BEST_POST_TIMES: Record<string, { day: string; time: string; timezone: string }[]> = {
  instagram: [
    { day: "Monday", time: "11:00 AM", timezone: "EST" },
    { day: "Wednesday", time: "11:00 AM", timezone: "EST" },
    { day: "Friday", time: "10:00 AM", timezone: "EST" },
    { day: "Saturday", time: "9:00 AM", timezone: "EST" },
  ],
  tiktok: [
    { day: "Tuesday", time: "9:00 AM", timezone: "EST" },
    { day: "Thursday", time: "12:00 PM", timezone: "EST" },
    { day: "Friday", time: "5:00 PM", timezone: "EST" },
    { day: "Saturday", time: "11:00 AM", timezone: "EST" },
  ],
  linkedin: [
    { day: "Tuesday", time: "8:00 AM", timezone: "EST" },
    { day: "Wednesday", time: "10:00 AM", timezone: "EST" },
    { day: "Thursday", time: "8:00 AM", timezone: "EST" },
  ],
  twitter: [
    { day: "Monday", time: "8:00 AM", timezone: "EST" },
    { day: "Wednesday", time: "12:00 PM", timezone: "EST" },
    { day: "Friday", time: "9:00 AM", timezone: "EST" },
  ],
  facebook: [
    { day: "Wednesday", time: "11:00 AM", timezone: "EST" },
    { day: "Thursday", time: "1:00 PM", timezone: "EST" },
    { day: "Friday", time: "10:00 AM", timezone: "EST" },
  ],
};

// ── 152. Auto-Reply FAQ Bot ──────────────────────────────────────────────────

export async function generateAutoReplies(input: {
  niche: string;
  offer: string;
  price: string;
  businessName: string;
}): Promise<{ question: string; answer: string; category: string }[]> {
  const result = await generateAI({
    prompt: `Generate 15 FAQ auto-replies for ${input.businessName} (${input.niche}).
Offer: ${input.offer} at ${input.price}

Return JSON array:
[{"question":"Common question","answer":"Helpful answer (under 100 words)","category":"pricing|shipping|support|product|refund"}]

Cover: pricing, how it works, guarantee, timeline, who it's for, what's included, support, refund policy, results expectations, getting started.`,
    systemPrompt: "You write helpful FAQ answers that convert skeptics into buyers. Return only JSON array.",
    maxTokens: 2000,
  });
  try { return JSON.parse(result.content); }
  catch {
    return [
      { question: "How much does it cost?", answer: `${input.offer} is ${input.price}. That includes everything listed on the page.`, category: "pricing" },
      { question: "Is there a guarantee?", answer: "Yes — 30-day money-back guarantee. No questions asked.", category: "refund" },
      { question: "How quickly will I see results?", answer: "Most people see initial results within the first 1-2 weeks.", category: "product" },
      { question: "Do I need any experience?", answer: "No. The system is designed for complete beginners.", category: "product" },
      { question: "How do I get support?", answer: "Reply to any email or use the chat widget on our site.", category: "support" },
    ];
  }
}

// ── 155. Payment Plan Generator ──────────────────────────────────────────────

export function generatePaymentPlans(price: number): {
  plans: { name: string; payments: number; amount: number; total: number; savings: string }[];
} {
  return {
    plans: [
      { name: "Pay in Full", payments: 1, amount: price, total: price, savings: "Best value" },
      { name: "2 Payments", payments: 2, amount: Math.ceil(price * 0.55), total: Math.ceil(price * 0.55) * 2, savings: "" },
      { name: "3 Payments", payments: 3, amount: Math.ceil(price * 0.38), total: Math.ceil(price * 0.38) * 3, savings: "" },
      ...(price > 500 ? [{ name: "6 Payments", payments: 6, amount: Math.ceil(price * 0.20), total: Math.ceil(price * 0.20) * 6, savings: "" }] : []),
    ],
  };
}

// ── 156. Dunning Management ──────────────────────────────────────────────────

export function getDunningSequence(): {
  attempts: { day: number; action: string; emailSubject: string; emailBody: string }[];
} {
  return {
    attempts: [
      { day: 0, action: "First retry + email", emailSubject: "Payment issue — action needed", emailBody: "Hey {{first_name}},\n\nYour recent payment didn't go through. This usually happens when a card expires or has insufficient funds.\n\nPlease update your payment method here: {{update_link}}\n\nIf you need help, just reply." },
      { day: 3, action: "Second retry + email", emailSubject: "Your account is at risk", emailBody: "{{first_name}}, we tried charging your card again but it failed.\n\nTo keep your access active, update your payment here: {{update_link}}\n\nThis takes 30 seconds." },
      { day: 7, action: "Final retry + warning", emailSubject: "Final notice — access ending soon", emailBody: "{{first_name}}, this is the last attempt.\n\nIf payment isn't updated by {{deadline}}, your access will be paused.\n\nUpdate now: {{update_link}}\n\nIf you meant to cancel, just reply and we'll handle it. No hard feelings." },
      { day: 10, action: "Cancel + win-back", emailSubject: "Your access has been paused", emailBody: "Hey {{first_name}},\n\nWe've paused your account due to payment issues.\n\nIf you'd like to reactivate, just update your card: {{update_link}}\n\nIf you've moved on, we understand. Thanks for being a customer." },
    ],
  };
}

// ── 160. Multi-Language Content ───────────────────────────────────────────────

export async function translateContent(input: {
  content: string;
  targetLanguage: string;
  contentType: "ad" | "email" | "landing" | "social";
}): Promise<string> {
  const result = await generateAI({
    prompt: `Translate this ${input.contentType} content to ${input.targetLanguage}.
Don't just translate literally — adapt it for the culture and market.
Keep the persuasive intent and emotional impact.

Content:
${input.content}

Return ONLY the translated text.`,
    systemPrompt: `You are a native ${input.targetLanguage} copywriter who adapts marketing content for local markets.`,
    maxTokens: 1500,
  });
  return result.content || input.content;
}

// ── 162. Smart Segmentation ──────────────────────────────────────────────────

export function autoSegmentContact(contact: {
  email: string;
  source: string;
  tags: string[];
  purchaseCount: number;
  lastActive: Date;
  emailOpens: number;
}): string[] {
  const segments: string[] = [];

  // Engagement
  const daysSinceActive = (Date.now() - contact.lastActive.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceActive < 7) segments.push("active");
  else if (daysSinceActive < 30) segments.push("cooling");
  else segments.push("cold");

  // Purchase behavior
  if (contact.purchaseCount === 0) segments.push("prospect");
  else if (contact.purchaseCount === 1) segments.push("first-buyer");
  else segments.push("repeat-buyer");

  // Email engagement
  if (contact.emailOpens > 5) segments.push("engaged-reader");
  else if (contact.emailOpens === 0) segments.push("never-opened");

  // Source
  if (contact.source?.includes("ad")) segments.push("paid-acquisition");
  if (contact.source?.includes("organic")) segments.push("organic");
  if (contact.source?.includes("referral")) segments.push("referred");

  return segments;
}

// ── 164. Predictive Revenue Forecasting ──────────────────────────────────────

export function forecastRevenue(input: {
  last30DaysRevenue: number;
  last60DaysRevenue: number;
  last90DaysRevenue: number;
  activeSubscribers: number;
  avgSubscriptionPrice: number;
  leadCount: number;
  conversionRate: number;
}): {
  next30Days: number;
  next90Days: number;
  next12Months: number;
  confidence: "high" | "medium" | "low";
  assumptions: string[];
} {
  // MRR from subscriptions
  const mrr = input.activeSubscribers * input.avgSubscriptionPrice;

  // Growth rate from trend
  const growthRate30 = input.last60DaysRevenue > 0
    ? (input.last30DaysRevenue - (input.last60DaysRevenue - input.last30DaysRevenue)) / input.last30DaysRevenue
    : 0;

  // Pipeline revenue
  const pipelineRevenue = input.leadCount * input.conversionRate * input.avgSubscriptionPrice;

  const next30 = Math.round(mrr + pipelineRevenue * 0.3 + input.last30DaysRevenue * (1 + Math.max(growthRate30, 0)));
  const next90 = Math.round(next30 * 3 * (1 + Math.max(growthRate30 * 0.5, 0)));
  const next12 = Math.round(next30 * 12 * (1 + Math.max(growthRate30 * 0.3, 0)));

  const hasEnoughData = input.last90DaysRevenue > 0;

  return {
    next30Days: next30,
    next90Days: next90,
    next12Months: next12,
    confidence: hasEnoughData ? (input.last90DaysRevenue > 1000 ? "high" : "medium") : "low",
    assumptions: [
      `Based on ${mrr > 0 ? `$${mrr}/mo recurring` : "no recurring revenue"}`,
      `${input.leadCount} leads in pipeline at ${(input.conversionRate * 100).toFixed(1)}% conversion`,
      growthRate30 > 0 ? `${(growthRate30 * 100).toFixed(0)}% month-over-month growth detected` : "No growth trend detected yet",
      hasEnoughData ? "3 months of data available" : "Limited data — forecast is rough estimate",
    ],
  };
}

// ── 168. Refund Prevention System ────────────────────────────────────────────

export function getRefundPreventionTriggers(): {
  triggers: { condition: string; action: string; emailSubject: string; timing: string }[];
} {
  return {
    triggers: [
      {
        condition: "Customer hasn't logged in within 3 days of purchase",
        action: "Send check-in email with quick-start guide",
        emailSubject: "Need help getting started?",
        timing: "Day 3 post-purchase",
      },
      {
        condition: "Customer opened refund policy page",
        action: "Send proactive support email",
        emailSubject: "Everything okay? I'm here to help",
        timing: "Within 1 hour",
      },
      {
        condition: "Customer replied with frustration",
        action: "Escalate to personal outreach — call or personalized video",
        emailSubject: "(Internal alert to owner)",
        timing: "Immediate",
      },
      {
        condition: "Day 20 of 30-day guarantee (no engagement)",
        action: "Last-chance value delivery email",
        emailSubject: "Before your guarantee expires — let's make this work",
        timing: "Day 20",
      },
    ],
  };
}

// ── 169. Customer Health Score ────────────────────────────────────────────────

export function calculateCustomerHealth(input: {
  daysSinceLastLogin: number;
  daysSinceLastPurchase: number;
  emailOpensLast30Days: number;
  supportTickets: number;
  npsScore?: number;
}): {
  score: number;
  status: "healthy" | "at_risk" | "churning";
  interventions: string[];
} {
  let score = 100;

  // Login recency
  if (input.daysSinceLastLogin > 30) score -= 30;
  else if (input.daysSinceLastLogin > 14) score -= 15;
  else if (input.daysSinceLastLogin > 7) score -= 5;

  // Purchase recency
  if (input.daysSinceLastPurchase > 90) score -= 20;
  else if (input.daysSinceLastPurchase > 60) score -= 10;

  // Email engagement
  if (input.emailOpensLast30Days === 0) score -= 20;
  else if (input.emailOpensLast30Days < 3) score -= 10;

  // Support tickets (high = frustrated)
  if (input.supportTickets > 3) score -= 15;
  else if (input.supportTickets > 1) score -= 5;

  // NPS
  if (input.npsScore !== undefined) {
    if (input.npsScore <= 6) score -= 20; // Detractor
    else if (input.npsScore >= 9) score += 10; // Promoter
  }

  score = Math.max(0, Math.min(100, score));

  const status = score >= 70 ? "healthy" : score >= 40 ? "at_risk" : "churning";
  const interventions: string[] = [];

  if (input.daysSinceLastLogin > 14) interventions.push("Send re-engagement email with new content");
  if (input.emailOpensLast30Days === 0) interventions.push("Try SMS or different email subject lines");
  if (input.supportTickets > 2) interventions.push("Personal outreach from founder/manager");
  if (score < 40) interventions.push("Offer exclusive discount or bonus to retain");
  if (input.npsScore !== undefined && input.npsScore <= 6) interventions.push("Schedule feedback call — understand what's wrong");

  return { score, status, interventions };
}

// ── 171. Dynamic Email Content ───────────────────────────────────────────────

export function personalizeEmailContent(input: {
  template: string;
  contact: {
    firstName?: string;
    segments: string[];
    purchaseCount: number;
    lastProduct?: string;
  };
}): string {
  let content = input.template;

  // Basic personalization
  content = content.replace(/\{\{first_name\}\}/g, input.contact.firstName ?? "there");

  // Segment-based content blocks
  if (input.contact.segments.includes("repeat-buyer")) {
    content = content.replace(/\{\{loyalty_message\}\}/g, "As one of our best customers, you get first access.");
  } else if (input.contact.segments.includes("first-buyer")) {
    content = content.replace(/\{\{loyalty_message\}\}/g, "Welcome to the family. Here's something special for you.");
  } else {
    content = content.replace(/\{\{loyalty_message\}\}/g, "");
  }

  // Purchase-based
  if (input.contact.lastProduct) {
    content = content.replace(/\{\{last_product\}\}/g, input.contact.lastProduct);
  }

  return content;
}

// ── 173. Win/Loss Analysis ───────────────────────────────────────────────────

export async function generateWinLossAnalysis(input: {
  niche: string;
  totalLeads: number;
  convertedLeads: number;
  commonObjections: string[];
  topTrafficSources: string[];
}): Promise<{
  conversionRate: number;
  analysis: string;
  improvements: string[];
  priorityFix: string;
}> {
  const conversionRate = input.totalLeads > 0 ? (input.convertedLeads / input.totalLeads) * 100 : 0;

  const result = await generateAI({
    prompt: `Analyze this business performance for ${input.niche}:
- ${input.totalLeads} total leads, ${input.convertedLeads} converted (${conversionRate.toFixed(1)}%)
- Common objections: ${input.commonObjections.join(", ") || "unknown"}
- Top traffic sources: ${input.topTrafficSources.join(", ") || "unknown"}

Return JSON:
{
  "analysis": "2-3 sentence assessment",
  "improvements": ["5 specific things to improve"],
  "priorityFix": "The ONE thing to fix first"
}`,
    systemPrompt: "You analyze business performance and give actionable fixes. Return only JSON.",
    maxTokens: 400,
  });

  try {
    const parsed = JSON.parse(result.content);
    return { conversionRate, ...parsed };
  } catch {
    return {
      conversionRate,
      analysis: conversionRate < 2 ? "Conversion rate is below average. Focus on offer and trust." : "Conversion rate is acceptable. Focus on scaling traffic.",
      improvements: ["Improve headline clarity", "Add more social proof", "Simplify checkout", "Add urgency", "Test different ad angles"],
      priorityFix: conversionRate < 1 ? "Your offer needs work — it's not compelling enough" : "Scale what's working — add more traffic",
    };
  }
}
