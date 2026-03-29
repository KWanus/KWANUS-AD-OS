/**
 * GET    /api/sites/[id]/products/[productId]
 * PATCH  /api/sites/[id]/products/[productId]
 * DELETE /api/sites/[id]/products/[productId]
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string; productId: string }> };

async function getSiteAndProduct(siteId: string, productId: string, userId: string) {
  const site = await prisma.site.findFirst({ where: { id: siteId, userId }, select: { id: true } });
  if (!site) return { site: null, product: null };
  const product = await prisma.siteProduct.findFirst({ where: { id: productId, siteId } });
  return { site, product };
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id: siteId, productId } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { product } = await getSiteAndProduct(siteId, productId, user.id);
    if (!product) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true, product });
  } catch (err) {
    console.error("SiteProduct GET:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id: siteId, productId } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { product: existing } = await getSiteAndProduct(siteId, productId, user.id);
    if (!existing) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const body = await req.json() as {
      name?: string;
      description?: string;
      price?: number;
      compareAt?: number | null;
      images?: string[];
      inventory?: number | null;
      status?: string;
    };

    const product = await prisma.siteProduct.update({
      where: { id: productId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.price !== undefined && { price: Math.round(body.price) }),
        ...(body.compareAt !== undefined && { compareAt: body.compareAt ? Math.round(body.compareAt) : null }),
        ...(body.images !== undefined && { images: body.images }),
        ...(body.inventory !== undefined && { inventory: body.inventory }),
        ...(body.status !== undefined && { status: body.status }),
      },
    });

    return NextResponse.json({ ok: true, product });
  } catch (err) {
    console.error("SiteProduct PATCH:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id: siteId, productId } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { product } = await getSiteAndProduct(siteId, productId, user.id);
    if (!product) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    await prisma.siteProduct.delete({ where: { id: productId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("SiteProduct DELETE:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
