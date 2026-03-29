import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailable } from "@/lib/db/runtime";

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

    const audit = await prisma.localAudit.findFirst({
      where: { id, userId: user.id },
    });

    if (!audit)
      return NextResponse.json({ ok: false, error: "Audit not found" }, { status: 404 });

    return NextResponse.json({ ok: true, audit });
  } catch (err) {
    console.error("Local audit GET [id] error:", err);
    if (isDatabaseUnavailable(err)) {
      return NextResponse.json({ ok: true, audit: null, databaseUnavailable: true });
    }
    return NextResponse.json({ ok: false, error: "Failed to fetch audit" }, { status: 500 });
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

    // Confirm ownership
    const existing = await prisma.localAudit.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing)
      return NextResponse.json({ ok: false, error: "Audit not found" }, { status: 404 });

    const body = await req.json();
    const { status, notes } = body as { status?: string; notes?: string };

    const validStatuses = ["pending", "scanning", "complete", "error"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { ok: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const audit = await prisma.localAudit.update({
      where: { id, userId: user.id },
      data: {
        ...(status ? { status } : {}),
        // notes is not a schema field — stored implicitly via auditJson if needed
        // Only patch fields that exist on the model
      },
    });

    // Suppress unused variable warning — notes is intentionally accepted but not yet persisted
    void notes;

    return NextResponse.json({ ok: true, audit });
  } catch (err) {
    console.error("Local audit PATCH error:", err);
    return NextResponse.json({ ok: false, error: "Failed to update audit" }, { status: 500 });
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

    const deleted = await prisma.localAudit.deleteMany({ where: { id, userId: user.id } });
    if (deleted.count === 0)
      return NextResponse.json({ ok: false, error: "Audit not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Local audit DELETE error:", err);
    return NextResponse.json({ ok: false, error: "Failed to delete audit" }, { status: 500 });
  }
}
