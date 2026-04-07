// ---------------------------------------------------------------------------
// Weekly Performance Digest — auto-generated and emailed every Monday
// Shows: revenue, leads, email performance, top campaigns, action items
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import { sendEmail, getFromAddress } from "@/lib/integrations/resendClient";
import { detectRevenueLeaks } from "./revenueLeakDetector";
import { forecastRevenue } from "./revenueForecasting";

export type WeeklyDigest = {
  period: { start: string; end: string };
  revenue: { total: number; change: number; orders: number };
  leads: { total: number; new: number; hot: number };
  email: { sent: number; openRate: number; clickRate: number; revenue: number };
  sites: { views: number; formSubmissions: number; conversionRate: number };
  topAction: string | null;
  forecast: { next30: number; trend: string };
  score: number; // 0-100 overall health
};

export async function generateWeeklyDigest(userId: string): Promise<WeeklyDigest> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  // Revenue this week vs last week
  const siteIds = (await prisma.site.findMany({ where: { userId }, select: { id: true } })).map((s) => s.id);

  const [thisWeekOrders, lastWeekOrders] = await Promise.all([
    prisma.siteOrder.findMany({
      where: { siteId: { in: siteIds }, status: "paid", createdAt: { gte: weekAgo } },
      select: { amountCents: true },
    }),
    prisma.siteOrder.findMany({
      where: { siteId: { in: siteIds }, status: "paid", createdAt: { gte: twoWeeksAgo, lt: weekAgo } },
      select: { amountCents: true },
    }),
  ]);

  const thisWeekRev = thisWeekOrders.reduce((s, o) => s + o.amountCents, 0) / 100;
  const lastWeekRev = lastWeekOrders.reduce((s, o) => s + o.amountCents, 0) / 100;
  const revChange = lastWeekRev > 0 ? ((thisWeekRev - lastWeekRev) / lastWeekRev) * 100 : thisWeekRev > 0 ? 100 : 0;

  // Leads
  const [totalLeads, newLeads, hotLeads] = await Promise.all([
    prisma.lead.count({ where: { userId } }),
    prisma.lead.count({ where: { userId, createdAt: { gte: weekAgo } } }),
    prisma.lead.count({ where: { userId, score: { gte: 60 }, createdAt: { gte: weekAgo } } }),
  ]);

  // Email
  const flows = await prisma.emailFlow.findMany({
    where: { userId },
    select: { sent: true, opens: true, clicks: true, revenue: true },
  });
  const totalSent = flows.reduce((s, f) => s + f.sent, 0);
  const totalOpens = flows.reduce((s, f) => s + f.opens, 0);
  const totalClicks = flows.reduce((s, f) => s + f.clicks, 0);
  const emailRevenue = flows.reduce((s, f) => s + f.revenue, 0);

  // Sites
  const sites = await prisma.site.findMany({
    where: { userId },
    select: { totalViews: true },
  });
  const totalViews = sites.reduce((s, site) => s + site.totalViews, 0);
  const formSubmissions = await prisma.emailContact.count({
    where: { userId, createdAt: { gte: weekAgo } },
  });
  const convRate = totalViews > 0 ? (formSubmissions / totalViews) * 100 : 0;

  // Top action from leak detector
  const leaks = await detectRevenueLeaks(userId).catch(() => null);
  const topAction = leaks?.topFix ?? null;

  // Forecast
  const dailyRevenue = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const dayOrders = thisWeekOrders.filter(
      (o) => new Date().toISOString().split("T")[0] === dateStr // Simplified
    );
    dailyRevenue.push({ date: dateStr, revenue: dayOrders.reduce((s, o) => s + o.amountCents, 0) / 100 });
  }
  const forecast = forecastRevenue(dailyRevenue);

  // Health score
  let score = 50;
  if (thisWeekRev > 0) score += 15;
  if (newLeads > 0) score += 10;
  if (totalSent > 0 && (totalOpens / Math.max(totalSent, 1)) * 100 >= 20) score += 10;
  if (convRate >= 2) score += 10;
  if (revChange > 0) score += 5;
  score = Math.min(100, score);

  return {
    period: { start: weekAgo.toISOString().split("T")[0], end: new Date().toISOString().split("T")[0] },
    revenue: { total: thisWeekRev, change: Math.round(revChange), orders: thisWeekOrders.length },
    leads: { total: totalLeads, new: newLeads, hot: hotLeads },
    email: {
      sent: totalSent,
      openRate: totalSent > 0 ? Math.round((totalOpens / totalSent) * 100) : 0,
      clickRate: totalSent > 0 ? Math.round((totalClicks / totalSent) * 100) : 0,
      revenue: emailRevenue,
    },
    sites: { views: totalViews, formSubmissions, conversionRate: Math.round(convRate * 10) / 10 },
    topAction,
    forecast: { next30: forecast.next30Days, trend: forecast.trend },
    score,
  };
}

/** Send the weekly digest email to a user */
export async function sendWeeklyDigest(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, sendingFromName: true, sendingFromEmail: true, sendingDomain: true },
    });
    if (!user?.email) return false;

    const digest = await generateWeeklyDigest(userId);
    const firstName = user.name?.split(" ")[0] ?? "there";

    const trendEmoji = digest.revenue.change > 0 ? "📈" : digest.revenue.change < 0 ? "📉" : "➡️";
    const scoreEmoji = digest.score >= 70 ? "🟢" : digest.score >= 40 ? "🟡" : "🔴";

    const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <h1 style="font-size:20px;margin:0 0 4px;">Your Week in Himalaya</h1>
  <p style="color:#666;font-size:13px;margin:0 0 24px;">${digest.period.start} — ${digest.period.end}</p>

  <div style="background:#f8f9fa;border-radius:12px;padding:20px;margin-bottom:16px;">
    <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;">Revenue This Week</p>
    <p style="margin:0;font-size:28px;font-weight:900;">$${digest.revenue.total.toLocaleString()} ${trendEmoji}</p>
    <p style="margin:4px 0 0;font-size:13px;color:${digest.revenue.change >= 0 ? "#16a34a" : "#dc2626"};">${digest.revenue.change >= 0 ? "+" : ""}${digest.revenue.change}% vs last week · ${digest.revenue.orders} orders</p>
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
    <tr>
      <td style="padding:12px;background:#f0f9ff;border-radius:8px;text-align:center;width:33%;">
        <p style="margin:0;font-size:20px;font-weight:900;">${digest.leads.new}</p>
        <p style="margin:2px 0 0;font-size:11px;color:#666;">New Leads</p>
      </td>
      <td style="width:8px;"></td>
      <td style="padding:12px;background:#f0fdf4;border-radius:8px;text-align:center;width:33%;">
        <p style="margin:0;font-size:20px;font-weight:900;">${digest.email.openRate}%</p>
        <p style="margin:2px 0 0;font-size:11px;color:#666;">Email Opens</p>
      </td>
      <td style="width:8px;"></td>
      <td style="padding:12px;background:#fef3c7;border-radius:8px;text-align:center;width:33%;">
        <p style="margin:0;font-size:20px;font-weight:900;">${digest.sites.conversionRate}%</p>
        <p style="margin:2px 0 0;font-size:11px;color:#666;">Site Conv.</p>
      </td>
    </tr>
  </table>

  <div style="background:#f8f9fa;border-radius:12px;padding:16px;margin-bottom:16px;">
    <p style="margin:0 0 4px;font-size:12px;color:#999;">Health Score</p>
    <p style="margin:0;font-size:16px;font-weight:700;">${scoreEmoji} ${digest.score}/100</p>
  </div>

  ${digest.topAction ? `
  <div style="background:#fef3c7;border-radius:12px;padding:16px;margin-bottom:16px;">
    <p style="margin:0 0 4px;font-size:12px;color:#92400e;text-transform:uppercase;font-weight:700;">Top Action This Week</p>
    <p style="margin:0;font-size:14px;color:#451a03;">${digest.topAction}</p>
  </div>
  ` : ""}

  <div style="background:#f0f9ff;border-radius:12px;padding:16px;margin-bottom:24px;">
    <p style="margin:0 0 4px;font-size:12px;color:#999;">30-Day Forecast</p>
    <p style="margin:0;font-size:16px;font-weight:700;">$${Math.round(digest.forecast.next30).toLocaleString()} projected · ${digest.forecast.trend}</p>
  </div>

  <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://himalaya.app"}/" style="display:inline-block;background:#0891b2;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Open Himalaya</a>

  <p style="margin:24px 0 0;font-size:11px;color:#ccc;">Himalaya Marketing OS — Weekly Digest</p>
</div>`;

    const result = await sendEmail({
      from: getFromAddress(user),
      to: user.email,
      subject: `${trendEmoji} Your week: $${digest.revenue.total.toLocaleString()} revenue, ${digest.leads.new} leads`,
      html,
    });

    return result.ok;
  } catch {
    return false;
  }
}
