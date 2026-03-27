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

    if (!name || !type || price == null || !billingCycle) {
      return NextResponse.json(
        { ok: false, error: "name, type, price, and billingCycle are required" },
        { status: 400 }
      );
    }

    const pkg = await prisma.consultPackage.create({
      data: {
        userId: user.id,
        name,
        type,
        price: Number(price),
        billingCycle,
        duration: duration ?? null,
        deliverables: deliverables ?? [],
        isHighTicket: isHighTicket ?? false,
        targetNiche: targetNiche ?? null,
      },
    });

    return NextResponse.json({ ok: true, package: pkg }, { status: 201 });
  } catch (err) {
    console.error("Package create error:", err);
    return NextResponse.json({ ok: false, error: "Failed to create package" }, { status: 500 });
  }
}
