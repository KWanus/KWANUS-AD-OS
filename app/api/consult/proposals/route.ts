import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;

    const proposals = await prisma.proposal.findMany({
      where: {
        userId: user.id,
        ...(status ? { status } : {}),
        NOT: { status: "deleted" },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true, title: true, status: true, totalValue: true,
        viewCount: true, viewedAt: true, sentAt: true, expiresAt: true,
        respondedAt: true, createdAt: true, updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, proposals });
  } catch (err) {
    console.error("Proposals fetch error:", err);
    return NextResponse.json({ ok: false, error: "Failed to fetch proposals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { leadId, clientId, title, packages } = body;

    const proposal = await prisma.proposal.create({
      data: {
        userId: user.id,
        leadId: leadId ?? null,
        clientId: clientId ?? null,
        title: title ?? "New Proposal",
        packages: packages ?? [],
      },
    });

    return NextResponse.json({ ok: true, proposal }, { status: 201 });
  } catch (err) {
    console.error("Proposal create error:", err);
    return NextResponse.json({ ok: false, error: "Failed to create proposal" }, { status: 500 });
  }
}
