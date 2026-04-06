import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * GET /api/sites/[id]/analytics
 * Returns site performance metrics: pages, products, orders, revenue.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const site = await prisma.site.findFirst({
      where: { id, userId: user.id },
      select: {
        id: true,
        name: true,
        slug: true,
        published: true,
        totalViews: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!site) {
      return NextResponse.json({ ok: false, error: "Site not found" }, { status: 404 });
    }

    const [pageCount, productCount, orders, totalRevenue] = await Promise.all([
      prisma.sitePage.count({ where: { siteId: id } }),
      prisma.siteProduct.count({ where: { siteId: id } }),
      prisma.siteOrder.findMany({
        where: { siteId: id },
        select: { amountCents: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.siteOrder.aggregate({
        where: { siteId: id, status: "paid" },
        _sum: { amountCents: true },
        _count: true,
      }),
    ]);

    const paidOrders = orders.filter(o => o.status === "paid");
    const revenue = (totalRevenue._sum.amountCents ?? 0) / 100;
    const avgOrderValue = paidOrders.length > 0 ? Math.round(revenue / paidOrders.length * 100) / 100 : 0;

    // Orders by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOrders = paidOrders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo);
    const last30Revenue = recentOrders.reduce((s, o) => s + o.amountCents, 0) / 100;

    // Daily breakdown
    const dailyRevenue: { date: string; orders: number; revenue: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayOrders = recentOrders.filter(o => new Date(o.createdAt).toISOString().split("T")[0] === dateStr);
      dailyRevenue.push({
        date: dateStr,
        orders: dayOrders.length,
        revenue: dayOrders.reduce((s, o) => s + o.amountCents, 0) / 100,
      });
    }

    // ── Himalaya deployment metrics (email flow, campaign, form submissions) ──
    const deployment = await prisma.himalayaDeployment.findFirst({
      where: { siteId: id, userId: user.id },
      orderBy: { createdAt: "desc" },
    }).catch(() => null);

    let emailMetrics = null;
    if (deployment?.emailFlowId) {
      const flow = await prisma.emailFlow.findUnique({ where: { id: deployment.emailFlowId } });
      if (flow) {
        emailMetrics = {
          flowId: flow.id,
          name: flow.name,
          status: flow.status,
          enrolled: flow.enrolled,
          sent: flow.sent,
          opens: flow.opens,
          clicks: flow.clicks,
          conversions: flow.conversions,
          revenue: flow.revenue,
          openRate: flow.sent > 0 ? Math.round((flow.opens / flow.sent) * 100) : 0,
          clickRate: flow.sent > 0 ? Math.round((flow.clicks / flow.sent) * 100) : 0,
          conversionRate: flow.enrolled > 0 ? Math.round((flow.conversions / flow.enrolled) * 100) : 0,
        };
      }
    }

    let campaignMetrics = null;
    if (deployment?.campaignId) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: deployment.campaignId },
        include: { adVariations: { select: { id: true, name: true, type: true, platform: true, status: true, metrics: true } } },
      });
      if (campaign) {
        campaignMetrics = {
          campaignId: campaign.id,
          name: campaign.name,
          status: campaign.status,
          variationCount: campaign.adVariations.length,
          variations: campaign.adVariations,
        };
      }
    }

    const formSubmissions = await prisma.emailContact.count({
      where: { userId: user.id, source: { contains: `site:${id}` } },
    }).catch(() => 0);

    // Generate benchmarks
    const { calculateBenchmarks } = await import("@/lib/intelligence/benchmarks");
    const benchmarks = calculateBenchmarks({
      totalViews: site.totalViews,
      formSubmissions,
      purchases: paidOrders.length,
      revenue,
      emailSent: emailMetrics?.sent ?? 0,
      emailOpens: emailMetrics?.opens ?? 0,
      emailClicks: emailMetrics?.clicks ?? 0,
      leads: formSubmissions,
    });

    // Generate optimization suggestions
    const { analyzeConversionRate } = await import("@/lib/intelligence/conversionOptimizer");
    const suggestions = analyzeConversionRate({
      totalViews: site.totalViews,
      formSubmissions,
      purchases: paidOrders.length,
      emailEnrolled: emailMetrics?.enrolled ?? 0,
      emailSent: emailMetrics?.sent ?? 0,
      emailOpens: emailMetrics?.opens ?? 0,
      emailClicks: emailMetrics?.clicks ?? 0,
      hasPaymentLink: !!deployment?.qaReport,
      hasTracking: !!(await prisma.user.findUnique({ where: { id: user.id }, select: { metaPixelId: true } }))?.metaPixelId,
      sitePublished: site.published,
    });

    return NextResponse.json({
      ok: true,
      analytics: {
        site: { name: site.name, slug: site.slug, published: site.published },
        pages: pageCount,
        products: productCount,
        orders: {
          total: orders.length,
          paid: paidOrders.length,
          revenue,
          avgOrderValue,
          last30Days: {
            orders: recentOrders.length,
            revenue: last30Revenue,
          },
        },
        dailyRevenue,
        daysSinceLaunch: Math.round((Date.now() - new Date(site.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
        email: emailMetrics,
        campaign: campaignMetrics,
        formSubmissions,
        deployment: deployment ? { version: deployment.version, qaScore: deployment.qaScore } : null,
        suggestions,
        benchmarks,
      },
    });
  } catch (err) {
    console.error("Site analytics error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
