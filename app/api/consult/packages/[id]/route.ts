import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { id } = await params;

    const pkg = await prisma.consultPackage.findFirst({
      where: { id, userId: user.id },
    });

    if (!pkg) {
      return NextResponse.json({ ok: false, error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, package: pkg });
  } catch (err) {
    console.error("Package fetch error:", err);
    return NextResponse.json({ ok: false, error: "Failed to fetch package" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { id } = await params;

    const existing = await prisma.consultPackage.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Package not found" }, { status: 404 });
    }

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
      active,
      sortOrder,
    } = body;

    // Validate price if provided
    if (price !== undefined) {
      const p = Number(price);
      if (isNaN(p) || p < 0) {
        return NextResponse.json({ ok: false, error: "price must be a non-negative number" }, { status: 400 });
      }
    }

    // Validate name not empty
    if (name !== undefined && !String(name).trim()) {
      return NextResponse.json({ ok: false, error: "Package name cannot be empty" }, { status: 400 });
    }

    const updated = await prisma.consultPackage.update({
      where: { id, userId: user.id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(type !== undefined && { type }),
        ...(price !== undefined && { price: Number(price) }),
        ...(billingCycle !== undefined && { billingCycle }),
        ...(duration !== undefined && { duration }),
        ...(deliverables !== undefined && { deliverables }),
        ...(isHighTicket !== undefined && { isHighTicket }),
        ...(targetNiche !== undefined && { targetNiche }),
        ...(active !== undefined && { active }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json({ ok: true, package: updated });
  } catch (err) {
    console.error("Package update error:", err);
    return NextResponse.json({ ok: false, error: "Failed to update package" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { id } = await params;

    const existing = await prisma.consultPackage.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Package not found" }, { status: 404 });
    }

    await prisma.consultPackage.update({
      where: { id, userId: user.id },
      data: { active: false },
    });

    return NextResponse.json({ ok: true, message: "Package deactivated" });
  } catch (err) {
    console.error("Package delete error:", err);
    return NextResponse.json({ ok: false, error: "Failed to delete package" }, { status: 500 });
  }
}
