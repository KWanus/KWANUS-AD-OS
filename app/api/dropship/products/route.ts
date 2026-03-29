import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

function safeNum(value: unknown, min = 0, max = 100_000_000): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!isFinite(n) || n < min || n > max) return null;
  return n;
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const niche = searchParams.get("niche") ?? undefined;
    const status = searchParams.get("status") ?? undefined;

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
    });

    return NextResponse.json({ ok: true, products });
  } catch (err) {
    console.error("DropshipProducts GET error:", err);
    return NextResponse.json({ ok: false, error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, niche, supplierUrl, supplierPrice, shippingCost } = body;

    if (!name || !niche) {
      return NextResponse.json({ ok: false, error: "name and niche are required" }, { status: 400 });
    }

    const parsedSupplierPrice = supplierPrice != null ? safeNum(supplierPrice) : null;
    const parsedShippingCost = shippingCost != null ? safeNum(shippingCost) : null;

    if (supplierPrice != null && parsedSupplierPrice === null) {
      return NextResponse.json({ ok: false, error: "Invalid supplierPrice" }, { status: 400 });
    }
    if (shippingCost != null && parsedShippingCost === null) {
      return NextResponse.json({ ok: false, error: "Invalid shippingCost" }, { status: 400 });
    }

    const product = await prisma.dropshipProduct.create({
      data: {
        userId: user.id,
        name,
        niche,
        status: "researching",
        ...(supplierUrl ? { supplierUrl } : {}),
        ...(parsedSupplierPrice !== null ? { supplierPrice: parsedSupplierPrice } : {}),
        ...(parsedShippingCost !== null ? { shippingCost: parsedShippingCost } : {}),
      },
    });

    return NextResponse.json({ ok: true, product }, { status: 201 });
  } catch (err) {
    console.error("DropshipProducts POST error:", err);
    return NextResponse.json({ ok: false, error: "Failed to create product" }, { status: 500 });
  }
}
