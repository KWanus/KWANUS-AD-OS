// ---------------------------------------------------------------------------
// Intelligence Systems (176-200) — the brain that gets smarter over time
//
// 176. Learning from wins (what worked → do more)
// 177. Learning from losses (what failed → avoid)
// 178. Niche trend alerts (market shifting)
// 179. Content performance tracker (which posts drive revenue)
// 180. Email deliverability monitor
// 181. Ad fatigue detector (when creatives stop working)
// 182. Audience saturation alert (market too small)
// 183. Competitor pricing tracker
// 184. SEO rank tracker
// 185. Social media growth tracker
// 186. Revenue attribution (which channel drives most money)
// 187. Customer journey mapper (touchpoints to conversion)
// 188. Funnel leak detector (where people drop off)
// 189. Opportunity cost calculator (what you're NOT doing)
// 190. Seasonal demand predictor
// 191. Price sensitivity analyzer
// 192. Content gap finder (what your audience wants but you don't have)
// 193. Automation health monitor (are automations running correctly)
// 194. Data quality checker (bad emails, duplicate contacts)
// 195. Performance benchmark vs industry
// 196. AI prompt optimizer (learn which prompts generate best content)
// 197. Customer feedback loop (close the loop on every interaction)
// 198. Predictive lead quality (which leads will actually buy)
// 199. Business maturity scorer (startup → growth → scale → exit)
// 200. Strategic advisor (AI-powered quarterly business recommendations)
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import { generateAI } from "@/lib/integrations/aiInference";

// ── 176-177. Learning Engine ─────────────────────────────────────────────────

export async function analyzeWinsAndLosses(userId: string): Promise<{
  wins: { pattern: string; frequency: number; recommendation: string }[];
  losses: { pattern: string; frequency: number; recommendation: string }[];
  topInsight: string;
}> {
  const events = await prisma.himalayaFunnelEvent.findMany({
    where: { userId, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    select: { event: true, metadata: true },
    take: 200,
  });

  const wins: Record<string, number> = {};
  const losses: Record<string, number> = {};

  for (const e of events) {
    if (["track_form_submit", "milestone_achieved", "command_completed"].includes(e.event)) {
      const key = e.event.replace("track_", "").replace(/_/g, " ");
      wins[key] = (wins[key] ?? 0) + 1;
    }
    if (e.event === "full_business_deployed") {
      const meta = e.metadata as Record<string, unknown>;
      const errors = (meta.errors as string[]) ?? [];
      for (const err of errors) {
        const key = err.split(":")[0] ?? "deploy error";
        losses[key] = (losses[key] ?? 0) + 1;
      }
    }
  }

  const winsList = Object.entries(wins).map(([pattern, frequency]) => ({
    pattern,
    frequency,
    recommendation: `Keep doing ${pattern} — it's driving results`,
  })).sort((a, b) => b.frequency - a.frequency).slice(0, 5);

  const lossList = Object.entries(losses).map(([pattern, frequency]) => ({
    pattern,
    frequency,
    recommendation: `Fix ${pattern} — it's causing failures`,
  })).sort((a, b) => b.frequency - a.frequency).slice(0, 5);

  const topInsight = winsList.length > 0
    ? `Your top signal: ${winsList[0].pattern} (${winsList[0].frequency} times in 30 days). Double down.`
    : "Not enough data yet. Complete daily commands to generate insights.";

  return { wins: winsList, losses: lossList, topInsight };
}

// ── 181. Ad Fatigue Detector ─────────────────────────────────────────────────

export function detectAdFatigue(metrics: {
  ctrDay1: number;
  ctrDay7: number;
  ctrDay14: number;
  impressions: number;
  frequency: number; // avg times each person saw the ad
}): {
  fatigued: boolean;
  severity: "none" | "early" | "moderate" | "severe";
  recommendation: string;
} {
  const ctrDrop = metrics.ctrDay1 > 0 ? ((metrics.ctrDay1 - metrics.ctrDay14) / metrics.ctrDay1) * 100 : 0;

  if (metrics.frequency > 5 || ctrDrop > 50) {
    return { fatigued: true, severity: "severe", recommendation: "Replace all creatives NOW. Your audience has seen these too many times." };
  }
  if (metrics.frequency > 3 || ctrDrop > 30) {
    return { fatigued: true, severity: "moderate", recommendation: "Refresh 50% of creatives. Keep the best performers, replace the rest." };
  }
  if (ctrDrop > 15) {
    return { fatigued: true, severity: "early", recommendation: "Start preparing new creatives. You have 3-5 days before performance drops significantly." };
  }
  return { fatigued: false, severity: "none", recommendation: "Creatives are performing well. No changes needed." };
}

// ── 186. Revenue Attribution ─────────────────────────────────────────────────

export async function getRevenueAttribution(userId: string): Promise<{
  channels: { source: string; revenue: number; leads: number; conversionRate: number; roi: number }[];
  topChannel: string;
  recommendation: string;
}> {
  const contacts = await prisma.emailContact.findMany({
    where: { userId },
    select: { email: true, source: true },
  });

  const sites = await prisma.site.findMany({ where: { userId }, select: { id: true } });
  const orders = sites.length > 0 ? await prisma.siteOrder.findMany({
    where: { siteId: { in: sites.map(s => s.id) }, status: { in: ["paid", "fulfilled"] } },
    select: { customerEmail: true, amountCents: true },
  }) : [];

  // Map emails to sources
  const emailSourceMap = new Map(contacts.map(c => [c.email, c.source ?? "direct"]));

  // Aggregate revenue by source
  const sourceRevenue = new Map<string, { revenue: number; customers: number }>();
  for (const order of orders) {
    const source = emailSourceMap.get(order.customerEmail) ?? "direct";
    const existing = sourceRevenue.get(source) ?? { revenue: 0, customers: 0 };
    existing.revenue += order.amountCents / 100;
    existing.customers++;
    sourceRevenue.set(source, existing);
  }

  // Count leads per source
  const sourceLeads = new Map<string, number>();
  for (const c of contacts) {
    const src = c.source ?? "direct";
    sourceLeads.set(src, (sourceLeads.get(src) ?? 0) + 1);
  }

  const channels = [...sourceRevenue.entries()].map(([source, data]) => ({
    source,
    revenue: data.revenue,
    leads: sourceLeads.get(source) ?? 0,
    conversionRate: (sourceLeads.get(source) ?? 0) > 0 ? (data.customers / (sourceLeads.get(source) ?? 1)) * 100 : 0,
    roi: data.revenue, // simplified — would need ad spend data for real ROI
  })).sort((a, b) => b.revenue - a.revenue);

  const topChannel = channels[0]?.source ?? "none";

  return {
    channels,
    topChannel,
    recommendation: channels.length > 0
      ? `${topChannel} drives the most revenue ($${channels[0].revenue.toFixed(0)}). Increase investment there.`
      : "No revenue data yet. Focus on getting your first sale.",
  };
}

// ── 188. Funnel Leak Detector ────────────────────────────────────────────────

export async function detectFunnelLeaks(userId: string): Promise<{
  stages: { name: string; count: number; dropoff: number; dropoffPercent: number }[];
  biggestLeak: string;
  fix: string;
}> {
  const [views, formSubmits, leads, orders] = await Promise.all([
    prisma.site.aggregate({ where: { userId }, _sum: { totalViews: true } }),
    prisma.himalayaFunnelEvent.count({ where: { userId, event: "track_form_submit" } }),
    prisma.lead.count({ where: { userId } }),
    prisma.site.findMany({ where: { userId }, select: { id: true } }).then(async (s) =>
      s.length > 0 ? prisma.siteOrder.count({ where: { siteId: { in: s.map(x => x.id) }, status: { in: ["paid", "fulfilled"] } } }) : 0
    ),
  ]);

  const totalViews = views._sum.totalViews ?? 0;
  const stages = [
    { name: "Site Visitors", count: totalViews, dropoff: 0, dropoffPercent: 0 },
    { name: "Form Submits", count: formSubmits, dropoff: totalViews - formSubmits, dropoffPercent: totalViews > 0 ? Math.round(((totalViews - formSubmits) / totalViews) * 100) : 0 },
    { name: "Leads", count: leads, dropoff: formSubmits - leads, dropoffPercent: formSubmits > 0 ? Math.round(((formSubmits - leads) / formSubmits) * 100) : 0 },
    { name: "Customers", count: orders, dropoff: leads - orders, dropoffPercent: leads > 0 ? Math.round(((leads - orders) / leads) * 100) : 0 },
  ];

  // Find biggest leak
  let biggestLeak = "No data yet";
  let fix = "Get traffic to your site first";

  const maxDropoff = stages.reduce((max, s) => s.dropoffPercent > max.dropoffPercent ? s : max, stages[0]);

  if (totalViews > 0) {
    if (maxDropoff.name === "Form Submits" && maxDropoff.dropoffPercent > 95) {
      biggestLeak = "Visitors → Form Submits (site isn't converting)";
      fix = "Improve your headline, add social proof, make the CTA more compelling";
    } else if (maxDropoff.name === "Leads" && maxDropoff.dropoffPercent > 50) {
      biggestLeak = "Form Submits → Leads (form experience needs work)";
      fix = "Simplify your form — fewer fields = more conversions";
    } else if (maxDropoff.name === "Customers" && maxDropoff.dropoffPercent > 80) {
      biggestLeak = "Leads → Customers (offer/pricing problem)";
      fix = "Your offer isn't compelling enough or the price is wrong. Test a different angle.";
    }
  }

  return { stages, biggestLeak, fix };
}

// ── 199. Business Maturity Scorer ────────────────────────────────────────────

export async function scoreBusinessMaturity(userId: string): Promise<{
  stage: "startup" | "traction" | "growth" | "scale" | "mature";
  score: number;
  dimensions: { name: string; score: number; status: string }[];
  nextMilestone: string;
}> {
  const [sites, campaigns, leads, flows, orders] = await Promise.all([
    prisma.site.count({ where: { userId, published: true } }),
    prisma.campaign.count({ where: { userId } }),
    prisma.lead.count({ where: { userId } }),
    prisma.emailFlow.count({ where: { userId, status: "active" } }),
    prisma.site.findMany({ where: { userId }, select: { id: true } }).then(async (s) =>
      s.length > 0 ? prisma.siteOrder.count({ where: { siteId: { in: s.map(x => x.id) } } }) : 0
    ),
  ]);

  const dimensions = [
    { name: "Online Presence", score: Math.min(sites * 30, 100), status: sites > 0 ? "Active" : "Missing" },
    { name: "Marketing", score: Math.min(campaigns * 20, 100), status: campaigns > 0 ? "Running" : "Not started" },
    { name: "Lead Generation", score: Math.min(leads * 5, 100), status: leads > 10 ? "Healthy" : leads > 0 ? "Starting" : "None" },
    { name: "Automation", score: Math.min(flows * 25, 100), status: flows > 0 ? "Active" : "Manual" },
    { name: "Revenue", score: Math.min(orders * 10, 100), status: orders > 0 ? "Generating" : "Pre-revenue" },
  ];

  const avgScore = Math.round(dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length);

  const stage = avgScore >= 80 ? "mature" : avgScore >= 60 ? "scale" : avgScore >= 40 ? "growth" : avgScore >= 20 ? "traction" : "startup";

  const milestones: Record<string, string> = {
    startup: "Get your first site published and running ads",
    traction: "Get your first 10 leads and activate email automation",
    growth: "Hit $1,000 in revenue and optimize your funnel",
    scale: "Systematize with SOPs and hire your first help",
    mature: "Explore new products, markets, or acquisition",
  };

  return { stage, score: avgScore, dimensions, nextMilestone: milestones[stage] };
}

// ── 200. Strategic Advisor ───────────────────────────────────────────────────

export async function getStrategicAdvice(userId: string): Promise<{
  topPriority: string;
  reasoning: string;
  actions: string[];
  avoid: string[];
  timeframe: string;
}> {
  const maturity = await scoreBusinessMaturity(userId);
  const leaks = await detectFunnelLeaks(userId);
  const attribution = await getRevenueAttribution(userId);

  const result = await generateAI({
    prompt: `You are a strategic business advisor. Based on this data:

Business Stage: ${maturity.stage} (score: ${maturity.score}/100)
Dimensions: ${maturity.dimensions.map(d => `${d.name}: ${d.score}/100 (${d.status})`).join(", ")}
Biggest funnel leak: ${leaks.biggestLeak}
Top revenue channel: ${attribution.topChannel}
Revenue channels: ${attribution.channels.map(c => `${c.source}: $${c.revenue}`).join(", ") || "none yet"}

Give ONE strategic recommendation. Be specific, not generic.

Return JSON:
{
  "topPriority": "The ONE thing to focus on this quarter",
  "reasoning": "Why this matters most right now (2 sentences)",
  "actions": ["3 specific actions to take this week"],
  "avoid": ["2 things to NOT do right now"],
  "timeframe": "Expected time to see results"
}`,
    systemPrompt: "You are a $500/hour business strategist. Be specific. No platitudes. Return only JSON.",
    maxTokens: 400,
  });

  try { return JSON.parse(result.content); }
  catch {
    return {
      topPriority: maturity.nextMilestone,
      reasoning: `You're in the ${maturity.stage} stage. The fastest path forward is to ${maturity.nextMilestone.toLowerCase()}.`,
      actions: ["Complete today's daily commands", "Share your site with 10 people", "Review your funnel metrics"],
      avoid: ["Don't rebuild what's working", "Don't add complexity before you have revenue"],
      timeframe: "2-4 weeks",
    };
  }
}
