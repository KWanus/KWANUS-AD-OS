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

    const existing = await prisma.dropshipProduct.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const body = await req.json();

    // Prevent changing ownership
    const { userId: _uid, id: _id, ...safeFields } = body;

    const updated = await prisma.dropshipProduct.update({
      where: { id },
      data: safeFields,
    });

    return NextResponse.json({ ok: true, product: updated });
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

    const existing = await prisma.dropshipProduct.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const updated = await prisma.dropshipProduct.update({
      where: { id },
      data: { status: "dead" },
    });

    return NextResponse.json({ ok: true, product: updated });
  } catch (err) {
    console.error("DropshipProduct DELETE error:", err);
    return NextResponse.json({ ok: false, error: "Failed to delete product" }, { status: 500 });
  }
}
