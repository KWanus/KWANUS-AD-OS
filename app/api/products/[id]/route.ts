import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

// price/compareAt stored as integer cents; inventory is a non-negative count
function safePrice(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = parseInt(String(value), 10);
  if (isNaN(n) || n < 0 || n > 100_000_000) return null; // max $1,000,000.00
  return n;
}

function safeInventory(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = parseInt(String(value), 10);
  if (isNaN(n) || n < 0 || n > 1_000_000) return null;
  return n;
}

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

    if (body.price !== undefined) {
      const p = safePrice(body.price);
      if (p === null) return NextResponse.json({ ok: false, error: "Invalid price" }, { status: 400 });
    }
    if (body.compareAt !== undefined && body.compareAt !== null && body.compareAt !== "") {
      const c = safePrice(body.compareAt);
      if (c === null) return NextResponse.json({ ok: false, error: "Invalid compareAt" }, { status: 400 });
    }
    if (body.inventory !== undefined && body.inventory !== null && body.inventory !== "") {
      const inv = safeInventory(body.inventory);
      if (inv === null) return NextResponse.json({ ok: false, error: "Invalid inventory" }, { status: 400 });
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
      where: { id, siteId: body.siteId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.price !== undefined && { price: safePrice(body.price) }),
        ...(body.compareAt !== undefined && {
          compareAt: body.compareAt === null || body.compareAt === "" ? null : safePrice(body.compareAt),
        }),
        ...(body.inventory !== undefined && {
          inventory: body.inventory === null || body.inventory === "" ? null : safeInventory(body.inventory),
        }),
        ...(body.images !== undefined && { images: body.images }),
        ...(body.status !== undefined && { status: body.status }),
      },
    });

    return NextResponse.json({ ok: true, product });
  } catch (err) {
    console.error("Product PATCH:", err);
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

    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const result = await prisma.product.updateMany({
      where: { id, userId: user.id },
      data: { status: "archived" },
    });
    if (result.count === 0) return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Product DELETE:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
