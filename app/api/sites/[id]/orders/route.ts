import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * GET /api/sites/[id]/orders
 * Returns recent orders for a site's store.
 */
export async function GET(
  req: NextRequest,
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
      select: { id: true },
    });

    if (!site) {
      return NextResponse.json({ ok: false, error: "Site not found" }, { status: 404 });
    }

    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "20"), 100);

    const [orders, total] = await Promise.all([
      prisma.siteOrder.findMany({
        where: { siteId: id },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.siteOrder.count({ where: { siteId: id } }),
    ]);

    // Resolve product names separately
    const productIds = [...new Set(orders.map(o => o.productId))];
    const products = productIds.length > 0
      ? await prisma.siteProduct.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true },
        })
      : [];
    const productMap = new Map(products.map(p => [p.id, p.name]));

    return NextResponse.json({
      ok: true,
      orders: orders.map(o => ({
        id: o.id,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        productName: productMap.get(o.productId) ?? "Unknown",
        amount: o.amountCents / 100,
        currency: o.currency,
        status: o.status,
        createdAt: o.createdAt,
      })),
      total,
    });
  } catch (err) {
    console.error("Site orders error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
