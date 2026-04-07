// ---------------------------------------------------------------------------
// Proactive Alerts — monitors thresholds and pushes notifications
// Runs on cron. Checks for conditions that need immediate attention.
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/notify";

export type AlertCheck = {
  name: string;
  check: (userId: string) => Promise<string | null>; // Returns alert message or null
};

const ALERT_CHECKS: AlertCheck[] = [
  {
    name: "roas_drop",
    check: async (userId) => {
      // Check if any campaign ROAS dropped below 1.0
      const campaigns = await prisma.campaign.findMany({
        where: { userId, status: "active" },
        include: { adVariations: { select: { metrics: true, name: true } } },
      });
      for (const c of campaigns) {
        for (const v of c.adVariations) {
          const m = (v.metrics ?? {}) as Record<string, number>;
          if ((m.spend ?? 0) >= 50 && (m.roas ?? 0) < 1 && (m.roas ?? 0) > 0) {
            return `Ad "${v.name}" in "${c.name}" is losing money — ${(m.roas ?? 0).toFixed(1)}x ROAS on $${(m.spend ?? 0).toFixed(0)} spend. Consider pausing.`;
          }
        }
      }
      return null;
    },
  },
  {
    name: "email_bounce_spike",
    check: async (userId) => {
      const recentBounces = await prisma.emailContact.count({
        where: {
          userId,
          status: "bounced",
          updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });
      if (recentBounces >= 5) {
        return `${recentBounces} emails bounced in the last 24 hours. Check your sending domain or contact list quality.`;
      }
      return null;
    },
  },
  {
    name: "hot_lead_uncontacted",
    check: async (userId) => {
      const hot = await prisma.lead.count({
        where: {
          userId,
          score: { gte: 60 },
          status: "new",
          createdAt: { lte: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // 2+ hours old
        },
      });
      if (hot > 0) {
        return `${hot} hot lead${hot > 1 ? "s" : ""} waiting for contact. These scored 60+ — respond ASAP before they go cold.`;
      }
      return null;
    },
  },
  {
    name: "site_down",
    check: async (userId) => {
      const publishedSites = await prisma.site.findMany({
        where: { userId, published: true },
        select: { slug: true, name: true },
        take: 3,
      });
      for (const site of publishedSites) {
        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3005";
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 5000);
          const res = await fetch(`${appUrl}/s/${site.slug}`, { signal: controller.signal });
          if (!res.ok) {
            return `Site "${site.name}" returned ${res.status}. It may be down or misconfigured.`;
          }
        } catch {
          // Timeout or network error — might be local dev
        }
      }
      return null;
    },
  },
  {
    name: "email_flow_stuck",
    check: async (userId) => {
      const stuck = await prisma.emailFlowEnrollment.count({
        where: {
          userId,
          status: "active",
          resumeAfter: { lte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Should have sent 24h+ ago
        },
      });
      if (stuck >= 3) {
        return `${stuck} email enrollments are stuck (delayed 24+ hours). The email processor cron may not be running.`;
      }
      return null;
    },
  },
  {
    name: "revenue_milestone",
    check: async (userId) => {
      const siteIds = (await prisma.site.findMany({ where: { userId }, select: { id: true } })).map((s) => s.id);
      if (siteIds.length === 0) return null;

      const total = await prisma.siteOrder.aggregate({
        where: { siteId: { in: siteIds }, status: "paid" },
        _sum: { amountCents: true },
      });
      const revenue = (total._sum.amountCents ?? 0) / 100;

      // Check milestones
      const milestones = [100, 500, 1000, 5000, 10000, 50000, 100000];
      for (const milestone of milestones) {
        if (revenue >= milestone) {
          // Check if we already notified for this milestone
          const existing = await prisma.himalayaFunnelEvent.findFirst({
            where: {
              userId,
              event: "milestone_reached",
              metadata: { path: ["milestone"], equals: milestone },
            },
          });
          if (!existing) {
            await prisma.himalayaFunnelEvent.create({
              data: {
                userId,
                event: "milestone_reached",
                metadata: { milestone, revenue },
              },
            });
            return `You hit $${milestone.toLocaleString()} in total revenue! Keep pushing.`;
          }
        }
      }
      return null;
    },
  },
];

/** Run all alert checks for a user */
export async function runAlertChecks(userId: string): Promise<number> {
  let alertsSent = 0;

  for (const check of ALERT_CHECKS) {
    try {
      const message = await check.check(userId);
      if (message) {
        await createNotification({
          userId,
          type: "system",
          title: formatAlertTitle(check.name),
          body: message,
          href: getAlertHref(check.name),
        });
        alertsSent++;
      }
    } catch {
      // Individual check failures are non-blocking
    }
  }

  return alertsSent;
}

/** Run alerts for ALL users (called by cron) */
export async function runAlertChecksForAllUsers(): Promise<{ users: number; alerts: number }> {
  const users = await prisma.user.findMany({ select: { id: true }, take: 100 });
  let totalAlerts = 0;

  for (const user of users) {
    const alerts = await runAlertChecks(user.id);
    totalAlerts += alerts;
  }

  return { users: users.length, alerts: totalAlerts };
}

function formatAlertTitle(name: string): string {
  const titles: Record<string, string> = {
    roas_drop: "Ad performance alert",
    email_bounce_spike: "Email deliverability issue",
    hot_lead_uncontacted: "Hot lead waiting",
    site_down: "Site health check",
    email_flow_stuck: "Email flow issue",
    revenue_milestone: "Revenue milestone!",
  };
  return titles[name] ?? "Alert";
}

function getAlertHref(name: string): string {
  const hrefs: Record<string, string> = {
    roas_drop: "/ads",
    email_bounce_spike: "/emails",
    hot_lead_uncontacted: "/leads",
    site_down: "/websites",
    email_flow_stuck: "/emails",
    revenue_milestone: "/revenue",
  };
  return hrefs[name] ?? "/";
}
