import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const niche = searchParams.get("niche") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const cursor = searchParams.get("cursor") ?? undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 100);

    const products = await prisma.dropshipProduct.findMany({
      where: {
        userId: user.id,
        ...(niche ? { niche } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: [
        { winnerScore: "desc" },
        { createdAt: "desc" },
      ],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = products.length > limit;
    if (hasMore) products.pop();
    const nextCursor = hasMore ? products[products.length - 1]?.id : undefined;

    return NextResponse.json({ ok: true, products, nextCursor });
  } catch (err) {
    console.error("DropshipProducts GET error:", err);
    return NextResponse.json({ ok: false, error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { name, niche, supplierUrl, supplierPrice, shippingCost } = body;

    if (!name || !niche) {
      return NextResponse.json({ ok: false, error: "name and niche are required" }, { status: 400 });
    }

    const product = await prisma.dropshipProduct.create({
      data: {
        userId: user.id,
        name: name.trim(),
        niche: niche.trim(),
        status: "researching",
        ...(supplierUrl ? { supplierUrl } : {}),
        ...(supplierPrice != null ? { supplierPrice: Number(supplierPrice) } : {}),
        ...(shippingCost != null ? { shippingCost: Number(shippingCost) } : {}),
      },
    });

    return NextResponse.json({ ok: true, product }, { status: 201 });
  } catch (err) {
    console.error("DropshipProducts POST error:", err);
    return NextResponse.json({ ok: false, error: "Failed to create product" }, { status: 500 });
  }
}
