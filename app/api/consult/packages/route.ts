import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const packages = await prisma.consultPackage.findMany({
      where: { userId: user.id, active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ ok: true, packages });
  } catch (err) {
    console.error("Packages fetch error:", err);
    return NextResponse.json({ ok: false, error: "Failed to fetch packages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const body = await req.json();
    const {
      name,
      type,
      price,
      billingCycle,
      duration,
      deliverables,
      isHighTicket,
      targetNiche,
    } = body;

    if (!name?.trim() || !type?.trim() || price == null || !billingCycle?.trim()) {
      return NextResponse.json(
        { ok: false, error: "name, type, price, and billingCycle are required" },
        { status: 400 }
      );
    }

    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json(
        { ok: false, error: "price must be a non-negative number" },
        { status: 400 }
      );
    }

    const VALID_TYPES = ["hourly", "retainer", "project", "productized", "vip_day"];
    if (!VALID_TYPES.includes(type.trim())) {
      return NextResponse.json(
        { ok: false, error: `type must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const VALID_CYCLES = ["one_time", "monthly", "quarterly", "yearly"];
    if (!VALID_CYCLES.includes(billingCycle.trim())) {
      return NextResponse.json(
        { ok: false, error: `billingCycle must be one of: ${VALID_CYCLES.join(", ")}` },
        { status: 400 }
      );
    }

    const pkg = await prisma.consultPackage.create({
      data: {
        userId: user.id,
        name: name.trim().slice(0, 200),
        type: type.trim(),
        price: parsedPrice,
        billingCycle: billingCycle.trim(),
        duration: duration?.trim()?.slice(0, 100) ?? null,
        deliverables: deliverables ?? [],
        isHighTicket: isHighTicket ?? false,
        targetNiche: targetNiche?.trim()?.slice(0, 200) ?? null,
      },
    });

    return NextResponse.json({ ok: true, package: pkg }, { status: 201 });
  } catch (err) {
    console.error("Package create error:", err);
    return NextResponse.json({ ok: false, error: "Failed to create package" }, { status: 500 });
  }
}
