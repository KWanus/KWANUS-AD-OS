import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user)
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const tier = searchParams.get("tier") ?? undefined;
    const activeParam = searchParams.get("active");
    const active = activeParam === null ? undefined : activeParam === "true";

    const packages = await prisma.servicePackage.findMany({
      where: {
        userId: user.id,
        ...(tier ? { tier } : {}),
        ...(active !== undefined ? { active } : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ ok: true, packages });
  } catch (err) {
    console.error("Packages GET error:", err);
    return NextResponse.json({ ok: false, error: "Failed to fetch packages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user)
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const body = await req.json();
    const {
      name,
      tier,
      price,
      billingCycle,
      deliverables,
      targetNiche,
      targetLocation,
      active,
      sortOrder,
    } = body as {
      name: string;
      tier: string;
      price: number;
      billingCycle?: string;
      deliverables?: string[];
      targetNiche?: string;
      targetLocation?: string;
      active?: boolean;
      sortOrder?: number;
    };

    if (!name || !tier || price === undefined) {
      return NextResponse.json(
        { ok: false, error: "name, tier, and price are required" },
        { status: 400 }
      );
    }

    const validTiers = ["basic", "pro", "elite", "custom"];
    if (!validTiers.includes(tier)) {
      return NextResponse.json(
        { ok: false, error: `Invalid tier. Must be one of: ${validTiers.join(", ")}` },
        { status: 400 }
      );
    }

    const pkg = await prisma.servicePackage.create({
      data: {
        userId: user.id,
        name,
        tier,
        price,
        billingCycle: billingCycle ?? "monthly",
        deliverables: deliverables ?? ([] as string[]),
        targetNiche: targetNiche ?? null,
        targetLocation: targetLocation ?? null,
        active: active ?? true,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json({ ok: true, package: pkg }, { status: 201 });
  } catch (err) {
    console.error("Packages POST error:", err);
    return NextResponse.json({ ok: false, error: "Failed to create package" }, { status: 500 });
  }
}
