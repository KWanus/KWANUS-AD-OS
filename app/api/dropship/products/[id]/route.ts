import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailable } from "@/lib/db/runtime";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { id } = await params;

    const product = await prisma.dropshipProduct.findFirst({
      where: { id, userId: user.id },
    });

    if (!product) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true, product });
  } catch (err) {
    console.error("DropshipProduct GET error:", err);
    if (isDatabaseUnavailable(err)) {
      return NextResponse.json({ ok: true, product: null, databaseUnavailable: true });
    }
    return NextResponse.json({ ok: false, error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { id } = await params;

    const body = await req.json();

    // Whitelist updatable fields — never allow ownership fields
    const ALLOWED: (keyof typeof body)[] = ["name", "niche", "supplierUrl", "supplierPrice", "shippingCost", "status", "notes", "targetPrice"];
    const data: Record<string, unknown> = {};
    for (const key of ALLOWED) {
      if (key in body) data[key] = body[key];
    }

    const result = await prisma.dropshipProduct.updateMany({
      where: { id, userId: user.id },
      data,
    });
    if (result.count === 0) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DropshipProduct PATCH error:", err);
    return NextResponse.json({ ok: false, error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { id } = await params;

    const result = await prisma.dropshipProduct.updateMany({
      where: { id, userId: user.id },
      data: { status: "dead" },
    });
    if (result.count === 0) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DropshipProduct DELETE error:", err);
    return NextResponse.json({ ok: false, error: "Failed to delete product" }, { status: 500 });
  }
}
