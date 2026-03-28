import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json() as {
      siteId?: string;
      name?: string;
      description?: string;
      price?: string | number;
      compareAt?: string | number | null;
      inventory?: string | number | null;
      images?: string[];
      status?: string;
    };

    if (!body.siteId) {
      return NextResponse.json({ ok: false, error: "siteId is required" }, { status: 400 });
    }

    // Validate price is a positive number if provided
    if (body.price !== undefined) {
      const p = parseInt(String(body.price), 10);
      if (isNaN(p) || p < 0) {
        return NextResponse.json({ ok: false, error: "price must be a non-negative integer (cents)" }, { status: 400 });
      }
    }

    // Validate status enum
    const VALID_STATUSES = ["active", "draft", "archived"];
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ ok: false, error: `status must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
    }

    // Validate name not empty
    if (body.name !== undefined && !body.name.trim()) {
      return NextResponse.json({ ok: false, error: "Product name cannot be empty" }, { status: 400 });
    }

    const existing = await prisma.siteProduct.findFirst({
      where: {
        id,
        siteId: body.siteId,
        site: { userId: user.id },
      },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    }

    const product = await prisma.siteProduct.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.price !== undefined && { price: parseInt(String(body.price), 10) }),
        ...(body.compareAt !== undefined && {
          compareAt: body.compareAt === null || body.compareAt === "" ? null : parseInt(String(body.compareAt), 10),
        }),
        ...(body.inventory !== undefined && {
          inventory: body.inventory === null || body.inventory === "" ? null : parseInt(String(body.inventory), 10),
        }),
        ...(body.images !== undefined && { images: body.images }),
        ...(body.status !== undefined && { status: body.status }),
      },
    });

    return NextResponse.json({ ok: true, product });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const siteId = req.nextUrl.searchParams.get("siteId");
    if (siteId) {
      const user = await getOrCreateUser();
      if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

      const deleted = await prisma.siteProduct.deleteMany({
        where: {
          id,
          siteId,
          site: { userId: user.id },
        },
      });

      if (deleted.count === 0) {
        return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
      }

      return NextResponse.json({ ok: true });
    }

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    await prisma.product.update({ where: { id }, data: { status: "archived" } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
