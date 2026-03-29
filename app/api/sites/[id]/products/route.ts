/**
 * GET  /api/sites/[id]/products  — list products for a site
 * POST /api/sites/[id]/products  — create a product
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const site = await prisma.site.findFirst({ where: { id: siteId, userId: user.id }, select: { id: true } });
    if (!site) return NextResponse.json({ ok: false, error: "Site not found" }, { status: 404 });

    const products = await prisma.siteProduct.findMany({
      where: { siteId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, products });
  } catch (err) {
    console.error("Site products GET:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const site = await prisma.site.findFirst({ where: { id: siteId, userId: user.id }, select: { id: true } });
    if (!site) return NextResponse.json({ ok: false, error: "Site not found" }, { status: 404 });

    const body = await req.json() as {
      name: string;
      description?: string;
      price: number;          // cents
      compareAt?: number;     // cents
      images?: string[];
      slug?: string;
      inventory?: number;
      status?: string;
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ ok: false, error: "Product name is required" }, { status: 400 });
    }
    if (!body.price || body.price < 0) {
      return NextResponse.json({ ok: false, error: "Valid price in cents is required" }, { status: 400 });
    }

    const slug = body.slug?.trim() || generateSlug(body.name);

    // Ensure slug is unique within site
    const existing = await prisma.siteProduct.findFirst({ where: { siteId, slug } });
    const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;

    const product = await prisma.siteProduct.create({
      data: {
        siteId,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        price: Math.round(body.price),
        compareAt: body.compareAt ? Math.round(body.compareAt) : null,
        images: body.images ?? [],
        slug: finalSlug,
        inventory: body.inventory ?? null,
        status: body.status === "draft" ? "draft" : "active",
      },
    });

    return NextResponse.json({ ok: true, product });
  } catch (err) {
    console.error("Site products POST:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
