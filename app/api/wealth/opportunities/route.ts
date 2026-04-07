import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { scanOpportunities } from "@/lib/wealth/opportunityScanner";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.businessProfile.findUnique({ where: { userId: user.id } });
    const siteIds = (await prisma.site.findMany({ where: { userId: user.id }, select: { id: true } })).map(s => s.id);
    const orders = siteIds.length > 0 ? await prisma.siteOrder.aggregate({
      where: { siteId: { in: siteIds }, status: "paid" },
      _sum: { amountCents: true },
    }) : { _sum: { amountCents: 0 } };

    const scan = scanOpportunities({
      niche: profile?.niche ?? "general",
      audience: profile?.targetAudience ?? "customers",
      monthlyRevenue: ((orders._sum.amountCents ?? 0) / 100),
      topProducts: [],
      currentChannels: ["paid_ads"],
    });

    return NextResponse.json({ ok: true, scan });
  } catch (err) {
    console.error("Opportunities error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
