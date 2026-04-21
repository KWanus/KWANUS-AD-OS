import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    // Get site with pages
    const site = await prisma.site.findFirst({
      where: { id, userId: user.id },
      include: { pages: { select: { id: true, title: true, views: true, slug: true } } },
    });
    if (!site) return NextResponse.json({ ok: false, error: "Site not found" }, { status: 404 });

    // Get leads from this site
    const leads = await prisma.lead.findMany({
      where: { userId: user.id },
      select: { id: true, email: true, name: true, status: true, score: true, createdAt: true, profileJson: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Filter leads from this site
    const siteLeads = leads.filter(l => {
      const profile = l.profileJson as Record<string, unknown> | null;
      return profile?.siteId === id;
    });

    // Get orders from this site
    const orders = await prisma.siteOrder.findMany({
      where: { siteId: id },
      select: { id: true, amountCents: true, status: true, customerEmail: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const completedOrders = orders.filter(o => o.status === "completed" || o.status === "paid");
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.amountCents, 0) / 100;

    // Calculate daily views (last 30 days) from funnel events
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const viewEvents = await prisma.himalayaFunnelEvent.findMany({
      where: {
        userId: user.id,
        event: "page_view",
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true, metadata: true },
      orderBy: { createdAt: "asc" },
    });

    // Group views by day
    const dailyViews: { date: string; views: number }[] = [];
    const viewMap = new Map<string, number>();
    for (const ev of viewEvents) {
      const meta = ev.metadata as Record<string, unknown> | null;
      if (meta?.siteId !== id) continue;
      const day = ev.createdAt.toISOString().split("T")[0];
      viewMap.set(day, (viewMap.get(day) ?? 0) + 1);
    }
    // Fill in missing days
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const day = d.toISOString().split("T")[0];
      dailyViews.push({ date: day, views: viewMap.get(day) ?? 0 });
    }

    // Conversion rate
    const conversionRate = site.totalViews > 0 ? ((siteLeads.length / site.totalViews) * 100) : 0;

    // Top pages
    const topPages = (site.pages ?? [])
      .map(p => ({ title: p.title, slug: p.slug, views: p.views }))
      .sort((a, b) => b.views - a.views);

    // Lead sources
    const sources: Record<string, number> = {};
    for (const l of siteLeads) {
      const profile = l.profileJson as Record<string, unknown> | null;
      const src = (profile?.source as string) ?? "direct";
      sources[src] = (sources[src] ?? 0) + 1;
    }

    return NextResponse.json({
      ok: true,
      analytics: {
        totalViews: site.totalViews,
        totalLeads: siteLeads.length,
        totalOrders: completedOrders.length,
        totalRevenue,
        conversionRate: Math.round(conversionRate * 100) / 100,
        published: site.published,
        dailyViews,
        topPages,
        recentLeads: siteLeads.slice(0, 10).map(l => ({
          name: l.name,
          email: l.email,
          score: l.score,
          status: l.status,
          date: l.createdAt.toISOString(),
        })),
        recentOrders: completedOrders.slice(0, 10).map(o => ({
          email: o.customerEmail,
          amount: o.amountCents / 100,
          date: o.createdAt.toISOString(),
        })),
        sources,
      },
    });
  } catch (err) {
    console.error("Site analytics error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
