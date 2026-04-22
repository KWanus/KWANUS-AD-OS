import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEventCounts, getFunnelData } from "@/lib/analytics/eventTracker";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const siteId = req.nextUrl.searchParams.get("siteId");
    const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30");

    if (siteId) {
      // Single site analytics
      const [counts, funnel] = await Promise.all([
        getEventCounts(siteId, days),
        getFunnelData(siteId, days),
      ]);
      return NextResponse.json({ ok: true, counts, funnel });
    }

    // All sites overview
    const sites = await prisma.site.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, slug: true, totalViews: true, published: true },
    });

    const siteSummaries = await Promise.all(
      sites.map(async (site) => {
        const counts = await getEventCounts(site.id, days);
        return { ...site, ...counts };
      })
    );

    const totals = siteSummaries.reduce((acc, s) => ({
      pageViews: acc.pageViews + s.pageViews,
      uniqueVisitors: acc.uniqueVisitors + s.uniqueVisitors,
      formSubmits: acc.formSubmits + s.formSubmits,
      ctaClicks: acc.ctaClicks + s.ctaClicks,
      checkoutCompletes: acc.checkoutCompletes + s.checkoutCompletes,
    }), { pageViews: 0, uniqueVisitors: 0, formSubmits: 0, ctaClicks: 0, checkoutCompletes: 0 });

    return NextResponse.json({ ok: true, sites: siteSummaries, totals });
  } catch (err) {
    console.error("Analytics dashboard error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
