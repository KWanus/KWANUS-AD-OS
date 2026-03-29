/**
 * GET   /api/sites/[id]/orders/[orderId]  — get a single order
 * PATCH /api/sites/[id]/orders/[orderId]  — update order status (fulfill, refund, etc.)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string; orderId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id: siteId, orderId } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const site = await prisma.site.findFirst({ where: { id: siteId, userId: user.id }, select: { id: true } });
    if (!site) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const order = await prisma.siteOrder.findFirst({ where: { id: orderId, siteId } });
    if (!order) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });

    return NextResponse.json({ ok: true, order });
  } catch (err) {
    console.error("SiteOrder GET:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id: siteId, orderId } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const site = await prisma.site.findFirst({ where: { id: siteId, userId: user.id }, select: { id: true } });
    if (!site) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const existing = await prisma.siteOrder.findFirst({ where: { id: orderId, siteId } });
    if (!existing) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });

    const body = await req.json() as {
      status?: "pending" | "paid" | "fulfilled" | "refunded";
      notes?: string;
    };

    const VALID_STATUSES = ["pending", "paid", "fulfilled", "refunded"];
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ ok: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
    }

    const order = await prisma.siteOrder.update({
      where: { id: orderId },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
      },
    });

    return NextResponse.json({ ok: true, order });
  } catch (err) {
    console.error("SiteOrder PATCH:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
