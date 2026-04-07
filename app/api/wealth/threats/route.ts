import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { assessThreats } from "@/lib/wealth/profitProtection";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const siteIds = (await prisma.site.findMany({ where: { userId: user.id }, select: { id: true, totalViews: true } }));
    const orders = await prisma.siteOrder.findMany({
      where: { siteId: { in: siteIds.map(s => s.id) }, status: "paid" },
      select: { amountCents: true },
    });
    const contacts = await prisma.emailContact.count({ where: { userId: user.id, status: "subscribed" } });
    const flows = await prisma.emailFlow.findMany({ where: { userId: user.id }, select: { sent: true, opens: true } });
    const totalSent = flows.reduce((s, f) => s + f.sent, 0);
    const totalOpens = flows.reduce((s, f) => s + f.opens, 0);
    const revenue = orders.reduce((s, o) => s + o.amountCents, 0) / 100;
    const firstSite = await prisma.site.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "asc" }, select: { createdAt: true } });
    const daysInBusiness = firstSite ? Math.round((Date.now() - new Date(firstSite.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;

    const report = assessThreats({
      monthlyRevenue: revenue,
      revenueGrowthRate: 0,
      customerCount: orders.length,
      churnRate: 0,
      competitorCount: 5,
      adSpend: 0,
      adROAS: 0,
      emailOpenRate: totalSent > 0 ? (totalOpens / totalSent) * 100 : 0,
      siteConversionRate: 0,
      hasRecurringRevenue: false,
      hasDiversifiedChannels: false,
      hasEmailList: contacts >= 10,
      daysInBusiness,
    });

    return NextResponse.json({ ok: true, report });
  } catch (err) {
    console.error("Threats error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
