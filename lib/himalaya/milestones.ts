// ---------------------------------------------------------------------------
// Milestone & Progress System — celebrates wins, tracks journey, shows growth
//
// Handles gaps 46-48:
// - Onboarding tutorial (what just happened + what to do now)
// - Progress milestones ($1, $100, $1K, first lead, first sale, etc.)
// - Before/after comparison (when they started vs now)
//
// Also handles 49-50:
// - Tax guidance per revenue tier
// - Data export for backup
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/notify";

// ── Milestones ───────────────────────────────────────────────────────────────

export type Milestone = {
  id: string;
  title: string;
  description: string;
  achieved: boolean;
  achievedAt?: string;
  category: "revenue" | "traffic" | "engagement" | "system" | "growth";
  celebrationMessage: string;
};

const MILESTONE_DEFINITIONS = [
  // Revenue
  { id: "first_sale", title: "First Sale", description: "Someone paid you real money", category: "revenue" as const, check: (d: DashboardData) => d.totalRevenue > 0, celebration: "YOU MADE YOUR FIRST SALE. This is where it all starts. Most people never get here." },
  { id: "revenue_100", title: "$100 Earned", description: "Triple digits", category: "revenue" as const, check: (d: DashboardData) => d.totalRevenue >= 100, celebration: "$100 earned. Not luck — a system working. Keep going." },
  { id: "revenue_500", title: "$500 Earned", description: "Real money", category: "revenue" as const, check: (d: DashboardData) => d.totalRevenue >= 500, celebration: "$500. This is more than most side hustles make in a month." },
  { id: "revenue_1000", title: "$1,000 Earned", description: "Four figures", category: "revenue" as const, check: (d: DashboardData) => d.totalRevenue >= 1000, celebration: "$1,000. You have a real business. Not a project — a business." },
  { id: "revenue_5000", title: "$5,000 Earned", description: "Serious income", category: "revenue" as const, check: (d: DashboardData) => d.totalRevenue >= 5000, celebration: "$5,000. You're outearning most people's side jobs. Time to think about scaling." },
  { id: "revenue_10000", title: "$10,000 Earned", description: "Five figures", category: "revenue" as const, check: (d: DashboardData) => d.totalRevenue >= 10000, celebration: "$10,000. You've crossed the threshold. This is no longer experimental." },

  // Traffic
  { id: "first_visitor", title: "First Visitor", description: "Someone found your site", category: "traffic" as const, check: (d: DashboardData) => d.totalViews > 0, celebration: "Your first visitor just landed on your site. The funnel is open." },
  { id: "views_100", title: "100 Site Views", description: "Real traffic", category: "traffic" as const, check: (d: DashboardData) => d.totalViews >= 100, celebration: "100 people have seen your business. That's 100 chances to convert." },
  { id: "views_1000", title: "1,000 Site Views", description: "Significant traffic", category: "traffic" as const, check: (d: DashboardData) => d.totalViews >= 1000, celebration: "1,000 views. Your site is getting real attention. Focus on conversion now." },

  // Engagement
  { id: "first_lead", title: "First Lead", description: "Someone gave you their info", category: "engagement" as const, check: (d: DashboardData) => d.totalLeads > 0, celebration: "First lead captured. Someone trusts you enough to share their info." },
  { id: "leads_10", title: "10 Leads", description: "Pipeline building", category: "engagement" as const, check: (d: DashboardData) => d.totalLeads >= 10, celebration: "10 leads. Your funnel is working. Now optimize and scale." },
  { id: "leads_50", title: "50 Leads", description: "Real pipeline", category: "engagement" as const, check: (d: DashboardData) => d.totalLeads >= 50, celebration: "50 leads. You have a real pipeline. This is where businesses take off." },
  { id: "first_email_sent", title: "First Email Sent", description: "Automation is working", category: "system" as const, check: (d: DashboardData) => d.emailsSent > 0, celebration: "Your first automated email went out. The system is working while you sleep." },

  // System
  { id: "site_published", title: "Site Live", description: "You're on the internet", category: "system" as const, check: (d: DashboardData) => d.publishedSites > 0, celebration: "Your site is LIVE. You're now a real business on the internet." },
  { id: "ads_running", title: "Ads Running", description: "Paid traffic flowing", category: "system" as const, check: (d: DashboardData) => d.activeCampaigns > 0, celebration: "Your ads are running. Money in → leads out. This is the machine." },
  { id: "streak_7", title: "7-Day Streak", description: "Consistency is key", category: "growth" as const, check: (d: DashboardData) => d.streak >= 7, celebration: "7 days in a row. Consistency beats talent. You're proving it." },
  { id: "streak_30", title: "30-Day Streak", description: "Unstoppable", category: "growth" as const, check: (d: DashboardData) => d.streak >= 30, celebration: "30-day streak. You are in the top 1% of people who actually follow through." },
];

type DashboardData = {
  totalRevenue: number;
  totalViews: number;
  totalLeads: number;
  emailsSent: number;
  publishedSites: number;
  activeCampaigns: number;
  streak: number;
};

/** Check and award new milestones */
export async function checkMilestones(userId: string): Promise<Milestone[]> {
  // Get current data
  const [sites, leads, flows, campaigns, orderData, events, emailFlows] = await Promise.all([
    prisma.site.aggregate({ where: { userId }, _sum: { totalViews: true }, _count: true }),
    prisma.lead.count({ where: { userId } }),
    prisma.emailFlow.aggregate({ where: { userId }, _sum: { sent: true } }),
    prisma.campaign.count({ where: { userId, status: { in: ["active", "testing", "scaling"] } } }),
    prisma.site.findMany({ where: { userId }, select: { id: true } }).then(async (s) => {
      if (s.length === 0) return [];
      return prisma.siteOrder.findMany({ where: { siteId: { in: s.map(x => x.id) }, status: { in: ["paid", "fulfilled"] } }, select: { amountCents: true } });
    }),
    prisma.himalayaFunnelEvent.count({ where: { userId, event: "command_completed", createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    prisma.site.count({ where: { userId, published: true } }),
  ]);

  const data: DashboardData = {
    totalRevenue: orderData.reduce((sum, o) => sum + o.amountCents, 0) / 100,
    totalViews: sites._sum.totalViews ?? 0,
    totalLeads: leads,
    emailsSent: flows._sum.sent ?? 0,
    publishedSites: emailFlows,
    activeCampaigns: campaigns,
    streak: events,
  };

  // Get already achieved milestones
  const achievedEvents = await prisma.himalayaFunnelEvent.findMany({
    where: { userId, event: "milestone_achieved" },
    select: { metadata: true },
  });
  const achievedIds = new Set(achievedEvents.map(e => (e.metadata as Record<string, string>)?.milestoneId));

  const milestones: Milestone[] = [];

  for (const def of MILESTONE_DEFINITIONS) {
    const achieved = def.check(data);
    const wasAlreadyAchieved = achievedIds.has(def.id);

    milestones.push({
      id: def.id,
      title: def.title,
      description: def.description,
      achieved,
      category: def.category,
      celebrationMessage: def.celebration,
    });

    // New milestone achieved — celebrate!
    if (achieved && !wasAlreadyAchieved) {
      await prisma.himalayaFunnelEvent.create({
        data: {
          userId,
          event: "milestone_achieved",
          metadata: JSON.parse(JSON.stringify({ milestoneId: def.id, title: def.title, achievedAt: new Date().toISOString() })),
        },
      }).catch(() => {});

      await createNotification({
        userId,
        type: "system",
        title: `🏔 Milestone: ${def.title}`,
        body: def.celebration,
        href: "/",
      }).catch(() => {});
    }
  }

  return milestones;
}

// ── Tax Guidance (#49) ───────────────────────────────────────────────────────

export function getTaxGuidance(totalRevenue: number): {
  tier: string;
  guidance: string[];
  urgency: "info" | "warning" | "action";
} {
  if (totalRevenue < 600) {
    return {
      tier: "Under $600",
      guidance: [
        "Under $600 in income typically doesn't require 1099 reporting from platforms.",
        "You may still need to report this as self-employment income on your taxes.",
        "Keep records of all income and expenses from day one.",
      ],
      urgency: "info",
    };
  }

  if (totalRevenue < 5000) {
    return {
      tier: "$600 - $5,000",
      guidance: [
        "You will likely receive 1099 forms from Stripe and other platforms.",
        "Start tracking ALL business expenses (ads, tools, subscriptions, home office).",
        "Consider opening a separate bank account for business income.",
        "Set aside ~25-30% of profit for taxes (income + self-employment tax).",
        "Look into quarterly estimated tax payments to avoid penalties.",
      ],
      urgency: "warning",
    };
  }

  if (totalRevenue < 50000) {
    return {
      tier: "$5,000 - $50,000",
      guidance: [
        "You should be making quarterly estimated tax payments.",
        "Consider forming an LLC for liability protection.",
        "Hire a CPA or use accounting software (QuickBooks, Wave, FreshBooks).",
        "Deductible expenses: ads, software, home office, internet, phone, equipment.",
        "Look into SEP-IRA or Solo 401(k) for tax-advantaged retirement savings.",
        "Keep receipts for EVERYTHING. Digital storage counts.",
      ],
      urgency: "action",
    };
  }

  return {
    tier: "$50,000+",
    guidance: [
      "You need a CPA. Not optional.",
      "Consider S-Corp election to reduce self-employment tax.",
      "Maximize business deductions: travel, meals (50%), education, equipment.",
      "Set up payroll if you're an S-Corp (pay yourself a reasonable salary).",
      "Consider business insurance (general liability, professional liability).",
      "Look into hiring: first hire should be someone who handles what you're worst at.",
      "Start thinking about asset protection and estate planning.",
    ],
    urgency: "action",
  };
}

// ── Data Export (#50) ────────────────────────────────────────────────────────

export async function exportUserData(userId: string): Promise<{
  profile: unknown;
  sites: unknown[];
  campaigns: unknown[];
  leads: unknown[];
  emailFlows: unknown[];
  contacts: unknown[];
  orders: unknown[];
  events: unknown[];
}> {
  const [profile, sites, campaigns, leads, emailFlows, contacts, events] = await Promise.all([
    prisma.businessProfile.findUnique({ where: { userId } }),
    prisma.site.findMany({ where: { userId }, include: { pages: true, products: true } }),
    prisma.campaign.findMany({ where: { userId }, include: { adVariations: true, emailDrafts: true } }),
    prisma.lead.findMany({ where: { userId } }),
    prisma.emailFlow.findMany({ where: { userId } }),
    prisma.emailContact.findMany({ where: { userId } }),
    prisma.himalayaFunnelEvent.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 500 }),
  ]);

  // Get orders through sites
  const siteIds = sites.map(s => s.id);
  const orders = siteIds.length > 0
    ? await prisma.siteOrder.findMany({ where: { siteId: { in: siteIds } } })
    : [];

  return { profile, sites, campaigns, leads, emailFlows, contacts, orders, events };
}

// ── Before/After Comparison (#48) ────────────────────────────────────────────

export async function getProgressComparison(userId: string): Promise<{
  startDate: string;
  daysSinceStart: number;
  then: Record<string, number>;
  now: Record<string, number>;
  improvements: string[];
}> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } });
  const startDate = user?.createdAt ?? new Date();
  const daysSinceStart = Math.round((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const [sites, leads, campaigns, orders, views] = await Promise.all([
    prisma.site.count({ where: { userId } }),
    prisma.lead.count({ where: { userId } }),
    prisma.campaign.count({ where: { userId } }),
    prisma.site.findMany({ where: { userId }, select: { id: true } }).then(async (s) => {
      if (s.length === 0) return 0;
      return prisma.siteOrder.count({ where: { siteId: { in: s.map(x => x.id) }, status: { in: ["paid", "fulfilled"] } } });
    }),
    prisma.site.aggregate({ where: { userId }, _sum: { totalViews: true } }),
  ]);

  const now = { sites, leads, campaigns, orders, views: views._sum.totalViews ?? 0 };
  const then = { sites: 0, leads: 0, campaigns: 0, orders: 0, views: 0 };

  const improvements: string[] = [];
  if (now.sites > 0) improvements.push(`Built ${now.sites} site${now.sites > 1 ? "s" : ""} from nothing`);
  if (now.leads > 0) improvements.push(`Captured ${now.leads} lead${now.leads > 1 ? "s" : ""}`);
  if (now.campaigns > 0) improvements.push(`Created ${now.campaigns} campaign${now.campaigns > 1 ? "s" : ""}`);
  if (now.orders > 0) improvements.push(`Made ${now.orders} sale${now.orders > 1 ? "s" : ""}`);
  if (now.views > 100) improvements.push(`${now.views.toLocaleString()} people saw your business`);
  if (daysSinceStart > 7 && improvements.length === 0) improvements.push("Time to take action — your first step is waiting");

  return { startDate: startDate.toISOString(), daysSinceStart, then, now, improvements };
}

// ── Onboarding Tutorial (#46) ────────────────────────────────────────────────

export function getPostBuildTutorial(deployed: {
  hasSite: boolean;
  hasCampaign: boolean;
  hasEmails: boolean;
}): { steps: { title: string; description: string; completed: boolean; action?: string }[] } {
  return {
    steps: [
      { title: "Your business was just built", description: "Himalaya created your site, ads, emails, and funnel. Everything is connected.", completed: true },
      { title: "Your site is live", description: "People can find you right now. Share your link.", completed: deployed.hasSite, action: deployed.hasSite ? undefined : "Publish your site" },
      { title: "Email automation is running", description: "When someone fills out your form, they automatically get your email sequence.", completed: deployed.hasEmails },
      { title: "Ad creatives are ready", description: "Your ads are generated with images and copy. Connect your ad account to launch them.", completed: deployed.hasCampaign, action: deployed.hasCampaign ? "Review your ads" : undefined },
      { title: "Follow today's commands", description: "Open your homepage to see exactly what to do next. Don't think — just execute.", completed: false, action: "Go to homepage" },
    ],
  };
}

// ── White-label (#51) ────────────────────────────────────────────────────────

export type WhiteLabelConfig = {
  agencyName: string;
  agencyLogo?: string;
  primaryColor: string;
  domain?: string;
  hideHimalayaBranding: boolean;
};

export function generateWhiteLabelSiteTheme(config: WhiteLabelConfig): Record<string, unknown> {
  return {
    font: "Inter",
    primaryColor: config.primaryColor,
    backgroundColor: "#0c0a08",
    textColor: "#ffffff",
    brandName: config.agencyName,
    brandLogo: config.agencyLogo,
    hideHimalayaBranding: config.hideHimalayaBranding,
    poweredBy: config.hideHimalayaBranding ? null : "Powered by Himalaya",
  };
}
