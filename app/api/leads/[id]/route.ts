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
    const body = await req.json() as Partial<{
      status: string;
      email: string;
      notes: string;
      emailOpened: boolean;
      emailReplied: boolean;
    }>;

    // Whitelist: only allow these fields to be updated
    const ALLOWED_FIELDS = ["status", "email", "notes", "emailOpened", "emailReplied"] as const;
    type AllowedKey = (typeof ALLOWED_FIELDS)[number];
    const data: Partial<Record<AllowedKey, unknown>> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in body) data[key] = body[key as keyof typeof body];
    }

    // Include userId in WHERE so users can only update their own leads
    const lead = await prisma.lead.update({
      where: { id, userId: user.id },
      data,
    });
    if (!lead) return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });

    return NextResponse.json({ ok: true, lead });
  } catch (err) {
    console.error("Lead PATCH error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
