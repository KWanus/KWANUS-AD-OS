import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { generateGoalPlan } from "@/lib/agents/goalEngine";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { targetMonthlyRevenue: number; timeline?: string };
    if (!body.targetMonthlyRevenue) return NextResponse.json({ ok: false, error: "targetMonthlyRevenue required" }, { status: 400 });

    // Get current state from DB
    const siteIds = (await prisma.site.findMany({ where: { userId: user.id }, select: { id: true, totalViews: true } }));
    const totalViews = siteIds.reduce((s, site) => s + site.totalViews, 0);
    const orders = await prisma.siteOrder.aggregate({
      where: { siteId: { in: siteIds.map(s => s.id) }, status: "paid" },
      _sum: { amountCents: true },
      _count: true,
    });
    const contacts = await prisma.emailContact.count({ where: { userId: user.id } });
    const revenue = (orders._sum.amountCents ?? 0) / 100;
    const orderCount = orders._count ?? 0;

    const plan = generateGoalPlan({
      userId: user.id,
      targetMonthlyRevenue: body.targetMonthlyRevenue,
      timeline: (body.timeline as "30days" | "60days" | "90days") ?? "90days",
      currentState: {
        monthlyRevenue: revenue,
        monthlyViews: totalViews,
        conversionRate: totalViews > 0 ? (contacts / totalViews) * 100 : 0,
        avgOrderValue: orderCount > 0 ? revenue / orderCount : 0,
        adSpend: 0,
        emailListSize: contacts,
      },
    });

    return NextResponse.json({ ok: true, plan });
  } catch (err) {
    console.error("Goal engine error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
