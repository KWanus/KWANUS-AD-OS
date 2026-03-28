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
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { id } = await params;
    const lead = await prisma.lead.findFirst({ where: { id, userId: user.id } });
    if (!lead) return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });

    return NextResponse.json({ ok: true, lead });
  } catch (err) {
    console.error("Lead GET error:", err);
    if (isDatabaseUnavailable(err)) {
      return NextResponse.json({ ok: true, lead: null, databaseUnavailable: true });
    }
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
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

    // Verify ownership
    const existing = await prisma.lead.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });

    const body = await req.json() as Record<string, unknown>;

    // Whitelist updatable fields
    const ALLOWED = new Set(["status", "email", "notes", "emailOpened", "emailReplied", "name", "niche", "location", "phone", "website"]);
    const updates: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(body)) {
      if (ALLOWED.has(key)) updates[key] = val;
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: false, error: "No valid fields to update" }, { status: 400 });
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ ok: true, lead });
  } catch (err) {
    console.error("Lead PATCH error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
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
    const deleted = await prisma.lead.deleteMany({ where: { id, userId: user.id } });
    if (deleted.count === 0) {
      return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Lead DELETE error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
