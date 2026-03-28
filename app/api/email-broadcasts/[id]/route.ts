import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

const EXECUTION_TIER_PREFIX = "__execution_tier:";

function normalizeExecutionTier(value?: string) {
  return value === "core" ? "core" : "elite";
}

function visibleSegmentTags(tags: string[] | undefined) {
  return (tags ?? []).filter((tag) => !tag.startsWith(EXECUTION_TIER_PREFIX));
}

function parseExecutionTier(tags: string[] | undefined) {
  const raw = (tags ?? []).find((tag) => tag.startsWith(EXECUTION_TIER_PREFIX));
  return raw === `${EXECUTION_TIER_PREFIX}core` ? "core" : "elite";
}

function withExecutionTier(tags: string[] | undefined, tier?: string) {
  return [...visibleSegmentTags(tags), `${EXECUTION_TIER_PREFIX}${normalizeExecutionTier(tier)}`];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const broadcast = await prisma.emailBroadcast.findFirst({
      where: { id, userId: user.id },
    });
    if (!broadcast) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({
      ok: true,
      broadcast: {
        ...broadcast,
        segmentTags: visibleSegmentTags(broadcast.segmentTags),
        executionTier: parseExecutionTier(broadcast.segmentTags),
      },
    });
  } catch (err) {
    console.error("EmailBroadcast GET:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
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
      name?: string;
      subject?: string;
      previewText?: string;
      body?: string;
      fromName?: string;
      fromEmail?: string;
      status?: string;
      segmentTags?: string[];
      scheduledAt?: string | null;
      executionTier?: "core" | "elite";
    };
    // Validate status enum
    const VALID_STATUSES = ["draft", "scheduled", "sending", "sent", "failed"];
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ ok: false, error: `status must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
    }

    const existing = await prisma.emailBroadcast.findFirst({
      where: { id, userId: user.id },
      select: { segmentTags: true },
    });
    if (!existing) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const broadcast = await prisma.emailBroadcast.updateMany({
      where: { id, userId: user.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.subject !== undefined && { subject: body.subject }),
        ...(body.previewText !== undefined && { previewText: body.previewText }),
        ...(body.body !== undefined && { body: body.body }),
        ...(body.fromName !== undefined && { fromName: body.fromName }),
        ...(body.fromEmail !== undefined && { fromEmail: body.fromEmail }),
        ...(body.status !== undefined && { status: body.status }),
        ...((body.segmentTags !== undefined || body.executionTier !== undefined) && {
          segmentTags: withExecutionTier(
            body.segmentTags ?? visibleSegmentTags(existing.segmentTags),
            body.executionTier ?? parseExecutionTier(existing.segmentTags)
          ),
        }),
        ...(body.scheduledAt !== undefined && {
          scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        }),
      },
    });

    return NextResponse.json({ ok: true, updated: broadcast.count });
  } catch (err) {
    console.error("EmailBroadcast PATCH:", err);
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

    await prisma.emailBroadcast.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("EmailBroadcast DELETE:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
