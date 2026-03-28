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

export async function GET(_req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const broadcasts = await prisma.emailBroadcast.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({
      ok: true,
      broadcasts: broadcasts.map((broadcast) => ({
        ...broadcast,
        segmentTags: visibleSegmentTags(broadcast.segmentTags),
        executionTier: parseExecutionTier(broadcast.segmentTags),
      })),
    });
  } catch (err) {
    console.error("EmailBroadcasts GET:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      name: string;
      subject: string;
      previewText?: string;
      body: string;
      fromName?: string;
      fromEmail?: string;
      segmentTags?: string[];
      scheduledAt?: string;
      executionTier?: "core" | "elite";
    };

    if (!body.name?.trim() || !body.subject?.trim()) {
      return NextResponse.json({ ok: false, error: "Name and subject are required" }, { status: 400 });
    }
    if (!body.body?.trim()) {
      return NextResponse.json({ ok: false, error: "Email body content is required" }, { status: 400 });
    }

    const broadcast = await prisma.emailBroadcast.create({
      data: {
        userId: user.id,
        name: body.name.trim(),
        subject: body.subject.trim(),
        previewText: body.previewText,
        body: body.body ?? "",
        fromName: body.fromName,
        fromEmail: body.fromEmail,
        segmentTags: withExecutionTier(body.segmentTags, body.executionTier),
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        status: "draft",
      },
    });

    return NextResponse.json({ ok: true, broadcast });
  } catch (err) {
    console.error("EmailBroadcasts POST:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
