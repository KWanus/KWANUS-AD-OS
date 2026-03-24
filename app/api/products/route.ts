import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

// GET /api/products
// - With ?siteId= → returns SiteProducts for the website builder
// - Without siteId → returns Product library items (affiliate products)
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const siteId = searchParams.get("siteId");

    // Website builder: fetch SiteProducts
    if (siteId) {
      const user = await getOrCreateUser();
      if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

      const site = await prisma.site.findFirst({
        where: { id: siteId, userId: user.id },
      });
      if (!site) return NextResponse.json({ ok: false, error: "Site not found" }, { status: 404 });

      const products = await prisma.siteProduct.findMany({
        where: { siteId },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ ok: true, products });
    }

    // Product library: fetch affiliate Product records
    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    const products = await prisma.product.findMany({
      where: { userId: user.id, status: "active" },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ ok: true, products });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

// POST /api/products
// - With body.siteId → creates a SiteProduct (website builder)
// - Without siteId → creates a Product library item (affiliate)
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      // Website builder fields
      siteId?: string;
      name?: string;
      description?: string;
      price?: string | number;
      compareAt?: string | number;
      slug?: string;
      inventory?: string | number;
      images?: string[];
      status?: string;
      // Product library fields
      productUrl?: string;
      platform?: string;
      affiliateUrl?: string;
      commission?: string;
      niche?: string;
      imageUrl?: string;
      scanData?: object;
    };

    // Website builder flow
    if (body.siteId) {
      const user = await getOrCreateUser();
      if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

      const { siteId, name, description, price, compareAt, slug, inventory, images } = body;
      if (!siteId || !name || price === undefined) {
        return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
      }
      const site = await prisma.site.findFirst({ where: { id: siteId, userId: user.id } });
      if (!site) return NextResponse.json({ ok: false, error: "Site not found" }, { status: 404 });

      let finalSlug = slug || (name as string).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      let count = 0;
      while (await prisma.siteProduct.findUnique({ where: { siteId_slug: { siteId, slug: finalSlug } } })) {
        count++;
        finalSlug = `${slug || (name as string).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${count}`;
      }

      const product = await prisma.siteProduct.create({
        data: {
          siteId,
          name: name as string,
          description,
          price: parseInt(String(price), 10),
          compareAt: compareAt ? parseInt(String(compareAt), 10) : null,
          slug: finalSlug,
          inventory: inventory !== undefined ? parseInt(String(inventory), 10) : null,
          images: images ?? [],
          status: body.status ?? "active",
        },
      });
      return NextResponse.json({ ok: true, product });
    }

    // Product library flow
    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    if (!body.name || !body.productUrl || !body.platform) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        userId: user.id,
        name: body.name,
        productUrl: body.productUrl,
        platform: body.platform,
        affiliateUrl: body.affiliateUrl ?? null,
        price: typeof body.price === "string" ? body.price : null,
        commission: body.commission ?? null,
        niche: body.niche ?? null,
        description: body.description ?? null,
        imageUrl: body.imageUrl ?? null,
        scanData: body.scanData as object ?? null,
      },
    });
    return NextResponse.json({ ok: true, product });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
