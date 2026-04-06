// ---------------------------------------------------------------------------
// GET /api/sites/dashboard
// Multi-site overview — all sites with key metrics in one response
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

    const sites = await prisma.site.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        slug: true,
        published: true,
        totalViews: true,
        createdAt: true,
        pages: { select: { id: true }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    const siteIds = sites.map((s) => s.id);

    // Get orders per site
    const orders = siteIds.length > 0
      ? await prisma.siteOrder.groupBy({
          by: ["siteId"],
          where: { siteId: { in: siteIds }, status: "paid" },
          _count: true,
          _sum: { amountCents: true },
        })
      : [];

    // Get contacts per site
    const contactCounts = await Promise.all(
      siteIds.map(async (id) => ({
        siteId: id,
        count: await prisma.emailContact.count({
          where: { userId: user.id, source: { contains: `site:${id}` } },
        }),
      }))
    );

    // Get deployments
    const deployments = siteIds.length > 0
      ? await prisma.himalayaDeployment.findMany({
          where: { userId: user.id, siteId: { in: siteIds } },
          select: { siteId: true, qaScore: true, version: true },
          orderBy: { createdAt: "desc" },
        })
      : [];

    const dashboard = sites.map((site) => {
      const siteOrders = orders.find((o) => o.siteId === site.id);
      const siteContacts = contactCounts.find((c) => c.siteId === site.id);
      const siteDeploy = deployments.find((d) => d.siteId === site.id);

      return {
        id: site.id,
        name: site.name,
        slug: site.slug,
        published: site.published,
        views: site.totalViews,
        pages: site.pages.length,
        orders: siteOrders?._count ?? 0,
        revenue: ((siteOrders?._sum?.amountCents ?? 0) / 100),
        contacts: siteContacts?.count ?? 0,
        qaScore: siteDeploy?.qaScore ?? null,
        version: siteDeploy?.version ?? null,
        createdAt: site.createdAt,
        conversionRate: site.totalViews > 0
          ? Math.round(((siteContacts?.count ?? 0) / site.totalViews) * 100 * 10) / 10
          : 0,
      };
    });

    // Totals
    const totals = {
      sites: sites.length,
      published: sites.filter((s) => s.published).length,
      totalViews: sites.reduce((s, site) => s + site.totalViews, 0),
      totalOrders: dashboard.reduce((s, d) => s + d.orders, 0),
      totalRevenue: dashboard.reduce((s, d) => s + d.revenue, 0),
      totalContacts: dashboard.reduce((s, d) => s + d.contacts, 0),
    };

    return NextResponse.json({ ok: true, dashboard, totals });
  } catch (err) {
    console.error("Sites dashboard error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
