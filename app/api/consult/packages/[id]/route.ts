import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

function safePrice(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  if (!isFinite(n) || n < 0 || n > 1_000_000) return null;
  return n;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

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

    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

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

    if (price !== undefined) {
      if (safePrice(price) === null) {
        return NextResponse.json({ ok: false, error: "Invalid price" }, { status: 400 });
      }
    }

    const result = await prisma.consultPackage.updateMany({
      where: { id, userId: user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(price !== undefined && { price: safePrice(price) as number }),
        ...(billingCycle !== undefined && { billingCycle }),
        ...(duration !== undefined && { duration }),
        ...(deliverables !== undefined && { deliverables }),
        ...(isHighTicket !== undefined && { isHighTicket }),
        ...(targetNiche !== undefined && { targetNiche }),
        ...(active !== undefined && { active }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ ok: false, error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Package update error:", err);
    return NextResponse.json({ ok: false, error: "Failed to update package" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const result = await prisma.consultPackage.updateMany({
      where: { id, userId: user.id },
      data: { active: false },
    });

    if (result.count === 0) {
      return NextResponse.json({ ok: false, error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: "Package deactivated" });
  } catch (err) {
    console.error("Package delete error:", err);
    return NextResponse.json({ ok: false, error: "Failed to delete package" }, { status: 500 });
  }
}
