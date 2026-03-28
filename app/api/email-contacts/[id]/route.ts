import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

const EXECUTION_TIER_PREFIX = "__execution_tier:";

function normalizeExecutionTier(value?: string) {
  return value === "core" ? "core" : "elite";
}

function visibleTags(tags: string[] | undefined) {
  return (tags ?? []).filter((tag) => !tag.startsWith(EXECUTION_TIER_PREFIX));
}

function parseExecutionTier(tags: string[] | undefined) {
  const raw = (tags ?? []).find((tag) => tag.startsWith(EXECUTION_TIER_PREFIX));
  return raw === `${EXECUTION_TIER_PREFIX}core` ? "core" : "elite";
}

function withExecutionTier(tags: string[] | undefined, tier?: string) {
  return [...visibleTags(tags), `${EXECUTION_TIER_PREFIX}${normalizeExecutionTier(tier)}`];
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const body = await req.json() as {
      firstName?: string;
      lastName?: string;
      tags?: string[];
      properties?: object;
      status?: string;
      executionTier?: "core" | "elite";
    };
    const existing = await prisma.emailContact.findFirst({
      where: { id, userId: user.id },
      select: { tags: true },
    });
    if (!existing) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    const result = await prisma.emailContact.updateMany({
      where: { id, userId: user.id },
      data: {
        ...(body.firstName !== undefined && { firstName: body.firstName }),
        ...(body.lastName !== undefined && { lastName: body.lastName }),
        ...((body.tags !== undefined || body.executionTier !== undefined) && {
          tags: withExecutionTier(body.tags ?? visibleTags(existing.tags), body.executionTier ?? parseExecutionTier(existing.tags)),
        }),
        ...(body.properties !== undefined && { properties: body.properties }),
        ...(body.status !== undefined && { status: body.status }),
      },
    });
    if (result.count === 0) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact PATCH:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    await prisma.emailContact.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact DELETE:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
