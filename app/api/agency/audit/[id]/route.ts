import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { id } = await params;

    const audit = await prisma.agencyAudit.findFirst({
      where: { id, userId: user.id },
    });

    if (!audit) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true, audit });
  } catch (err) {
    console.error("AgencyAudit GET[id] error:", err);
    return NextResponse.json({ ok: false, error: "Failed to fetch audit" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { id } = await params;

    const existing = await prisma.agencyAudit.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const body = await req.json();

    // Whitelist updatable fields to prevent ownership changes
    const allowedFields = ["status", "notes", "businessUrl", "location"] as const;
    type AllowedField = typeof allowedFields[number];

    const updateData: Record<string, string | null> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field] as string | null;
      }
    }

    const updated = await prisma.agencyAudit.update({
      where: { id, userId: user.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: updateData as any,
    });

    return NextResponse.json({ ok: true, audit: updated });
  } catch (err) {
    console.error("AgencyAudit PATCH error:", err);
    return NextResponse.json({ ok: false, error: "Failed to update audit" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { id } = await params;

    const deleted = await prisma.agencyAudit.deleteMany({ where: { id, userId: user.id } });
    if (deleted.count === 0) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("AgencyAudit DELETE error:", err);
    return NextResponse.json({ ok: false, error: "Failed to delete audit" }, { status: 500 });
  }
}
