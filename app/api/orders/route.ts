import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    // Get all sites for this user
    const sites = await prisma.site.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
    });

    if (sites.length === 0) return NextResponse.json({ ok: true, orders: [] });

    const siteIds = sites.map(s => s.id);
    const siteNameMap = Object.fromEntries(sites.map(s => [s.id, s.name]));

    // Get all orders
    const orders = await prisma.siteOrder.findMany({
      where: { siteId: { in: siteIds } },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    // Get product names
    const productIds = [...new Set(orders.map(o => o.productId))];
    const products = await prisma.siteProduct.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    }).catch(() => []);
    const productNameMap = Object.fromEntries(products.map(p => [p.id, p.name]));

    return NextResponse.json({
      ok: true,
      orders: orders.map(o => ({
        id: o.id,
        siteId: o.siteId,
        siteName: siteNameMap[o.siteId] ?? "Unknown Site",
        productName: productNameMap[o.productId] ?? o.productId,
        customerEmail: o.customerEmail,
        customerName: o.customerName,
        amountCents: o.amountCents,
        currency: o.currency,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("Orders error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
