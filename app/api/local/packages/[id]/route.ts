import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user)
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { id } = await params;

    const pkg = await prisma.servicePackage.findFirst({
      where: { id, userId: user.id },
    });

    if (!pkg)
      return NextResponse.json({ ok: false, error: "Package not found" }, { status: 404 });

    return NextResponse.json({ ok: true, package: pkg });
  } catch (err) {
    console.error("ServicePackage GET error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user)
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { id } = await params;

    const existing = await prisma.servicePackage.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing)
      return NextResponse.json({ ok: false, error: "Package not found" }, { status: 404 });

    const body = await req.json() as {
      name?: string;
      tier?: string;
      price?: number;
      billingCycle?: string;
      deliverables?: string[];
      targetNiche?: string;
      targetLocation?: string;
      active?: boolean;
      sortOrder?: number;
    };

    // Validate name
    if (body.name !== undefined && !body.name.trim()) {
      return NextResponse.json({ ok: false, error: "Package name cannot be empty" }, { status: 400 });
    }

    // Validate tier
    const validTiers = ["basic", "pro", "elite", "custom"];
    if (body.tier && !validTiers.includes(body.tier)) {
      return NextResponse.json(
        { ok: false, error: `tier must be one of: ${validTiers.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate price
    if (body.price !== undefined) {
      const p = Number(body.price);
      if (isNaN(p) || p < 0) {
        return NextResponse.json({ ok: false, error: "price must be a non-negative number" }, { status: 400 });
      }
    }

    const pkg = await prisma.servicePackage.update({
      where: { id, userId: user.id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.tier !== undefined && { tier: body.tier }),
        ...(body.price !== undefined && { price: Number(body.price) }),
        ...(body.billingCycle !== undefined && { billingCycle: body.billingCycle }),
        ...(body.deliverables !== undefined && { deliverables: body.deliverables }),
        ...(body.targetNiche !== undefined && { targetNiche: body.targetNiche || null }),
        ...(body.targetLocation !== undefined && { targetLocation: body.targetLocation || null }),
        ...(body.active !== undefined && { active: body.active }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      },
    });

    return NextResponse.json({ ok: true, package: pkg });
  } catch (err) {
    console.error("ServicePackage PATCH error:", err);
    return NextResponse.json({ ok: false, error: "Failed to update package" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user)
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { id } = await params;

    const deleted = await prisma.servicePackage.deleteMany({ where: { id, userId: user.id } });
    if (deleted.count === 0)
      return NextResponse.json({ ok: false, error: "Package not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("ServicePackage DELETE error:", err);
    return NextResponse.json({ ok: false, error: "Failed to delete package" }, { status: 500 });
  }
}
