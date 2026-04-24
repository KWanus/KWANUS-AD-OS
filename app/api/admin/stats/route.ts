import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAILS = ["kwanus@gmail.com"];

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );

    const user = await getOrCreateUser();
    if (!user || !ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json(
        { ok: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    // Total users
    const totalUsers = await prisma.user.count();

    // Active users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsers = await prisma.himalayaFunnelEvent.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { userId: true },
      distinct: ["userId"],
    });

    // Published sites
    const publishedSites = await prisma.site.count({
      where: { published: true },
    });

    // Total revenue from credit logs
    const creditRevenue = await prisma.creditLog.aggregate({
      where: { action: "purchase" },
      _count: true,
    });

    // Subscription count by plan
    const proUsers = await prisma.user.count({ where: { plan: "pro" } });
    const businessUsers = await prisma.user.count({
      where: { plan: "business" },
    });
    const mrr = proUsers * 29 + businessUsers * 79;

    // Recent signups
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        createdAt: true,
        credits: true,
      },
    });

    // Weekly signup counts (last 8 weeks)
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    const allUsers = await prisma.user.findMany({
      where: { createdAt: { gte: eightWeeksAgo } },
      select: { createdAt: true },
    });
    const weeklySignups: { week: string; count: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const count = allUsers.filter(
        (u) => u.createdAt >= weekStart && u.createdAt < weekEnd,
      ).length;
      weeklySignups.push({
        week: weekStart.toISOString().split("T")[0],
        count,
      });
    }

    // Total orders + GMV
    const orders = await prisma.siteOrder.aggregate({
      where: { status: { in: ["paid", "fulfilled"] } },
      _sum: { amountCents: true },
      _count: true,
    });

    // Top users by site views
    const topSites = await prisma.site.findMany({
      orderBy: { totalViews: "desc" },
      take: 10,
      select: {
        name: true,
        totalViews: true,
        userId: true,
        published: true,
      },
    });

    // Email flow stats
    const totalFlows = await prisma.emailFlow.count({
      where: { status: "active" },
    });
    const totalEmailsSent = await prisma.emailFlow.aggregate({
      _sum: { sent: true },
    });

    return NextResponse.json({
      ok: true,
      stats: {
        totalUsers,
        activeUsers: activeUsers.length,
        publishedSites,
        proUsers,
        businessUsers,
        mrr,
        creditPurchases: creditRevenue._count,
        totalOrders: orders._count,
        gmv: (orders._sum.amountCents ?? 0) / 100,
        weeklySignups,
        recentUsers: recentUsers.map((u) => ({
          email: u.email,
          name: u.name,
          plan: u.plan,
          credits: u.credits,
          joinedAt: u.createdAt.toISOString(),
        })),
        topSites: topSites.map((s) => ({
          name: s.name,
          views: s.totalViews,
          published: s.published,
        })),
        totalActiveFlows: totalFlows,
        totalEmailsSent: totalEmailsSent._sum.sent ?? 0,
      },
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed" },
      { status: 500 },
    );
  }
}
