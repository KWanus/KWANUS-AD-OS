import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailable } from "@/lib/db/runtime";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { id } = await params;

    const proposal = await prisma.proposal.findFirst({
      where: { id, userId: user.id, NOT: { status: "deleted" } },
    });

    if (!proposal) {
      return NextResponse.json({ ok: false, error: "Proposal not found" }, { status: 404 });
    }

    // Increment view count
    await prisma.proposal.updateMany({
      where: { id, userId: user.id },
      data: {
        viewCount: { increment: 1 },
        viewedAt: proposal.viewedAt ?? new Date(),
        status: proposal.status === "sent" ? "viewed" : proposal.status,
      },
    });

    return NextResponse.json({ ok: true, proposal: { ...proposal, viewCount: proposal.viewCount + 1 } });
  } catch (err) {
    console.error("Proposal fetch error:", err);
    if (isDatabaseUnavailable(err)) {
      return NextResponse.json({ ok: true, proposal: null, databaseUnavailable: true });
    }
    return NextResponse.json({ ok: false, error: "Failed to fetch proposal" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { id } = await params;

    const existing = await prisma.proposal.findFirst({
      where: { id, userId: user.id, NOT: { status: "deleted" } },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Proposal not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      title,
      problemStatement,
      solution,
      socialProof,
      guarantee,
      urgency,
      packages,
      totalValue,
      status,
      notes,
      sentAt,
      expiresAt,
      respondedAt,
    } = body;

    const patch = await prisma.proposal.updateMany({
      where: { id, userId: user.id },
      data: {
        ...(title !== undefined && { title }),
        ...(problemStatement !== undefined && { problemStatement }),
        ...(solution !== undefined && { solution }),
        ...(socialProof !== undefined && { socialProof }),
        ...(guarantee !== undefined && { guarantee }),
        ...(urgency !== undefined && { urgency }),
        ...(packages !== undefined && { packages: packages as object }),
        ...(totalValue !== undefined && { totalValue: Number(totalValue) }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(sentAt !== undefined && { sentAt: new Date(sentAt) }),
        ...(expiresAt !== undefined && { expiresAt: new Date(expiresAt) }),
        ...(respondedAt !== undefined && { respondedAt: new Date(respondedAt) }),
      },
    });
    if (patch.count === 0) return NextResponse.json({ ok: false, error: "Proposal not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Proposal update error:", err);
    return NextResponse.json({ ok: false, error: "Failed to update proposal" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { id } = await params;

    const existing = await prisma.proposal.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Proposal not found" }, { status: 404 });
    }

    await prisma.proposal.updateMany({
      where: { id, userId: user.id },
      data: { status: "deleted" },
    });

    return NextResponse.json({ ok: true, message: "Proposal deleted" });
  } catch (err) {
    console.error("Proposal delete error:", err);
    return NextResponse.json({ ok: false, error: "Failed to delete proposal" }, { status: 500 });
  }
}
