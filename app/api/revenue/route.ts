// ---------------------------------------------------------------------------
// GET /api/revenue — aggregated revenue dashboard data
// Returns: total revenue, revenue by site, revenue by day, email ROI
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get all sites for this user
    const sites = await prisma.site.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, slug: true, published: true, totalViews: true },
    });
    const siteIds = sites.map((s) => s.id);

    // Get all orders
    const orders = siteIds.length > 0
      ? await prisma.siteOrder.findMany({
          where: { siteId: { in: siteIds } },
          select: { siteId: true, amountCents: true, status: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        })
      : [];

    const paidOrders = orders.filter((o) => o.status === "paid");
    const totalRevenue = paidOrders.reduce((s, o) => s + o.amountCents, 0) / 100;
    const totalOrders = paidOrders.length;

    // Revenue by site
    const revenueBySite = sites.map((site) => {
      const siteOrders = paidOrders.filter((o) => o.siteId === site.id);
      return {
        siteId: site.id,
        name: site.name,
        slug: site.slug,
        published: site.published,
        views: site.totalViews,
        orders: siteOrders.length,
        revenue: siteOrders.reduce((s, o) => s + o.amountCents, 0) / 100,
      };
    }).filter((s) => s.orders > 0 || s.views > 0);

    // Revenue by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOrders = paidOrders.filter((o) => new Date(o.createdAt) >= thirtyDaysAgo);

    const dailyRevenue: { date: string; orders: number; revenue: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayOrders = recentOrders.filter(
        (o) => new Date(o.createdAt).toISOString().split("T")[0] === dateStr
      );
      dailyRevenue.push({
        date: dateStr,
        orders: dayOrders.length,
        revenue: dayOrders.reduce((s, o) => s + o.amountCents, 0) / 100,
      });
    }

    // Email flow metrics
    const flows = await prisma.emailFlow.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, enrolled: true, sent: true, opens: true, clicks: true, conversions: true, revenue: true },
    });
    const emailRevenue = flows.reduce((s, f) => s + f.revenue, 0);
    const totalEnrolled = flows.reduce((s, f) => s + f.enrolled, 0);
    const totalSent = flows.reduce((s, f) => s + f.sent, 0);
    const totalOpens = flows.reduce((s, f) => s + f.opens, 0);
    const totalClicks = flows.reduce((s, f) => s + f.clicks, 0);

    // Contacts + leads
    const contactCount = await prisma.emailContact.count({ where: { userId: user.id } });
    const leadCount = await prisma.lead.count({ where: { userId: user.id } });

    return NextResponse.json({
      ok: true,
      revenue: {
        total: totalRevenue,
        orders: totalOrders,
        avgOrderValue: totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0,
        last30Days: recentOrders.reduce((s, o) => s + o.amountCents, 0) / 100,
        dailyRevenue,
        bySite: revenueBySite,
      },
      email: {
        revenue: emailRevenue,
        enrolled: totalEnrolled,
        sent: totalSent,
        opens: totalOpens,
        clicks: totalClicks,
        openRate: totalSent > 0 ? Math.round((totalOpens / totalSent) * 100) : 0,
        clickRate: totalSent > 0 ? Math.round((totalClicks / totalSent) * 100) : 0,
        flows: flows.map((f) => ({
          id: f.id,
          name: f.name,
          enrolled: f.enrolled,
          sent: f.sent,
          revenue: f.revenue,
        })),
      },
      contacts: contactCount,
      leads: leadCount,
    });
  } catch (err) {
    console.error("Revenue API error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
