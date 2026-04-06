// ---------------------------------------------------------------------------
// GET /api/revenue/forecast — revenue forecast for next 30/60/90 days
// Uses linear regression on past daily revenue data
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { forecastRevenue } from "@/lib/intelligence/revenueForecasting";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const siteIds = (await prisma.site.findMany({
      where: { userId: user.id },
      select: { id: true },
    })).map((s) => s.id);

    const orders = siteIds.length > 0
      ? await prisma.siteOrder.findMany({
          where: { siteId: { in: siteIds }, status: "paid" },
          select: { amountCents: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        })
      : [];

    // Build daily revenue
    const dailyMap: Record<string, number> = {};
    for (const order of orders) {
      const date = order.createdAt.toISOString().split("T")[0];
      dailyMap[date] = (dailyMap[date] ?? 0) + order.amountCents / 100;
    }

    // Fill gaps for last 30 days
    const dailyRevenue: { date: string; revenue: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = d.toISOString().split("T")[0];
      dailyRevenue.push({ date, revenue: dailyMap[date] ?? 0 });
    }

    const forecast = forecastRevenue(dailyRevenue);

    return NextResponse.json({ ok: true, forecast, dailyRevenue });
  } catch (err) {
    console.error("Revenue forecast error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
