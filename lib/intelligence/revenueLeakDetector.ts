// ---------------------------------------------------------------------------
// Revenue Leak Detector — finds where money is being lost in the funnel
// Calculates dollar value of each leak and prioritizes fixes
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";

export type RevenueLeak = {
  location: string;
  stage: string;
  leakRate: number;        // percentage lost at this stage
  estimatedLoss: number;   // dollar value lost per month
  fix: string;
  priority: "critical" | "high" | "medium";
  dataPoints: number;      // how much data this is based on
};

export type LeakReport = {
  totalMonthlyLoss: number;
  leaks: RevenueLeak[];
  funnelHealth: "healthy" | "leaking" | "broken";
  topFix: string | null;
};

export async function detectRevenueLeaks(userId: string): Promise<LeakReport> {
  const leaks: RevenueLeak[] = [];

  // Get all metrics
  const [sites, contacts, leads, flows, orders] = await Promise.all([
    prisma.site.findMany({
      where: { userId },
      select: { id: true, name: true, totalViews: true, published: true },
    }),
    prisma.emailContact.count({ where: { userId, status: "subscribed" } }),
    prisma.lead.findMany({
      where: { userId },
      select: { score: true, status: true },
    }),
    prisma.emailFlow.findMany({
      where: { userId, status: "active" },
      select: { enrolled: true, sent: true, opens: true, clicks: true, conversions: true, revenue: true },
    }),
    prisma.siteOrder.findMany({
      where: {
        siteId: { in: (await prisma.site.findMany({ where: { userId }, select: { id: true } })).map((s) => s.id) },
        status: "paid",
      },
      select: { amountCents: true },
    }),
  ]);

  const totalViews = sites.reduce((s, site) => s + site.totalViews, 0);
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((s, o) => s + o.amountCents, 0) / 100;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalEnrolled = flows.reduce((s, f) => s + f.enrolled, 0);
  const totalSent = flows.reduce((s, f) => s + f.sent, 0);
  const totalOpens = flows.reduce((s, f) => s + f.opens, 0);
  const totalClicks = flows.reduce((s, f) => s + f.clicks, 0);

  // ── Leak 1: Traffic → Form submission ────────────────────────────────
  if (totalViews >= 100) {
    const formRate = contacts > 0 ? (contacts / totalViews) * 100 : 0;
    if (formRate < 2) {
      const benchmarkRate = 3; // 3% is good
      const missedLeads = Math.round((totalViews * (benchmarkRate / 100)) - contacts);
      const missedRevenue = missedLeads * (avgOrderValue > 0 ? avgOrderValue * 0.05 : 10); // 5% of leads convert

      leaks.push({
        location: "Landing Page",
        stage: "Visitor → Lead",
        leakRate: 100 - formRate,
        estimatedLoss: missedRevenue,
        fix: "Improve headline clarity, add social proof near form, reduce form fields, make CTA more specific",
        priority: formRate < 0.5 ? "critical" : "high",
        dataPoints: totalViews,
      });
    }
  }

  // ── Leak 2: Lead → Email enrolled ───────────────────────────────────
  if (contacts >= 10) {
    const enrollRate = totalEnrolled > 0 ? (totalEnrolled / contacts) * 100 : 0;
    if (enrollRate < 70) {
      const missedEnrollments = Math.round(contacts * 0.9 - totalEnrolled);

      leaks.push({
        location: "Email Flow",
        stage: "Lead → Enrolled",
        leakRate: 100 - enrollRate,
        estimatedLoss: missedEnrollments * (avgOrderValue * 0.03),
        fix: "Ensure all forms auto-enroll contacts into email flows. Check that flows are set to 'active' status.",
        priority: enrollRate < 30 ? "critical" : "medium",
        dataPoints: contacts,
      });
    }
  }

  // ── Leak 3: Email sent → Opened ─────────────────────────────────────
  if (totalSent >= 50) {
    const openRate = (totalOpens / totalSent) * 100;
    if (openRate < 20) {
      const missedOpens = Math.round(totalSent * 0.25 - totalOpens);
      leaks.push({
        location: "Email Subject Lines",
        stage: "Sent → Opened",
        leakRate: 100 - openRate,
        estimatedLoss: missedOpens * (avgOrderValue * 0.01),
        fix: "Rewrite subject lines: under 40 chars, curiosity-driven, personalized with first name. Verify sending domain.",
        priority: openRate < 10 ? "critical" : "high",
        dataPoints: totalSent,
      });
    }
  }

  // ── Leak 4: Opened → Clicked ────────────────────────────────────────
  if (totalOpens >= 30) {
    const clickRate = (totalClicks / totalOpens) * 100;
    if (clickRate < 5) {
      leaks.push({
        location: "Email Content",
        stage: "Opened → Clicked",
        leakRate: 100 - clickRate,
        estimatedLoss: Math.round(totalOpens * 0.08 - totalClicks) * (avgOrderValue * 0.02),
        fix: "Move CTA above the fold, make it a button, add specific benefit statement next to CTA",
        priority: "medium",
        dataPoints: totalOpens,
      });
    }
  }

  // ── Leak 5: No payment option ───────────────────────────────────────
  const unpublished = sites.filter((s) => !s.published);
  if (unpublished.length > 0 && sites.length > 0) {
    leaks.push({
      location: "Site Publishing",
      stage: "Site → Live",
      leakRate: (unpublished.length / sites.length) * 100,
      estimatedLoss: unpublished.length * 500, // Estimated lost opportunity
      fix: `${unpublished.length} site${unpublished.length > 1 ? "s" : ""} not published. Publish to start receiving traffic.`,
      priority: "critical",
      dataPoints: sites.length,
    });
  }

  // ── Leak 6: Leads going cold ────────────────────────────────────────
  const coldLeads = leads.filter((l) => l.status === "new" && (l.score ?? 0) >= 40);
  if (coldLeads.length >= 3) {
    leaks.push({
      location: "Lead Follow-up",
      stage: "Lead → Contacted",
      leakRate: (coldLeads.length / Math.max(leads.length, 1)) * 100,
      estimatedLoss: coldLeads.length * (avgOrderValue * 0.1),
      fix: `${coldLeads.length} warm/hot leads with no follow-up. Enable auto-followup or reach out manually.`,
      priority: "high",
      dataPoints: leads.length,
    });
  }

  // Sort by estimated loss
  leaks.sort((a, b) => b.estimatedLoss - a.estimatedLoss);

  const totalMonthlyLoss = leaks.reduce((s, l) => s + l.estimatedLoss, 0);
  const funnelHealth: LeakReport["funnelHealth"] =
    leaks.filter((l) => l.priority === "critical").length >= 2 ? "broken" :
    leaks.length >= 3 ? "leaking" : "healthy";

  return {
    totalMonthlyLoss: Math.round(totalMonthlyLoss),
    leaks,
    funnelHealth,
    topFix: leaks[0]?.fix ?? null,
  };
}
