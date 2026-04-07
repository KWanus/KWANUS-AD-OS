import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { generateLTVStrategies, deployLTVFlows } from "@/lib/wealth/ltvMaximizer";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const siteIds = (await prisma.site.findMany({ where: { userId: user.id }, select: { id: true } })).map(s => s.id);
    const orders = await prisma.siteOrder.findMany({
      where: { siteId: { in: siteIds }, status: "paid" },
      select: { amountCents: true, customerEmail: true },
    });

    const revenue = orders.reduce((s, o) => s + o.amountCents, 0) / 100;
    const uniqueCustomers = new Set(orders.map(o => o.customerEmail)).size;
    const avgOrderValue = orders.length > 0 ? revenue / orders.length : 0;
    const repeatRate = uniqueCustomers > 0 ? ((orders.length - uniqueCustomers) / uniqueCustomers) * 100 : 0;

    const strategies = generateLTVStrategies({
      avgOrderValue,
      repeatPurchaseRate: repeatRate,
      avgPurchaseFrequency: uniqueCustomers > 0 ? orders.length / uniqueCustomers : 1,
      customerCount: uniqueCustomers,
      churnRate: 10,
    });

    return NextResponse.json({ ok: true, strategies });
  } catch (err) {
    console.error("LTV error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { strategies: unknown[] };
    const result = await deployLTVFlows(user.id, body.strategies as any);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("LTV deploy error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
