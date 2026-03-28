import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not synced" }, { status: 400 });
    }

    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "50"), 100);
    const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
    const status = req.nextUrl.searchParams.get("status") ?? undefined;

    const where = {
      userId: user.id,
      OR: [
        { sourceUrl: { not: null } },
        { currentPhase: { gte: 1 } },
      ],
      ...(status ? { status } : {}),
    };

    const projects = await prisma.campaign.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        _count: {
          select: {
            creatives: true,
            adVariations: true,
            emailDrafts: true,
            checklistItems: true,
          },
        },
      },
    });

    const hasMore = projects.length > limit;
    if (hasMore) projects.pop();
    const nextCursor = hasMore ? projects[projects.length - 1]?.id : undefined;

    return NextResponse.json({ ok: true, projects, nextCursor, hasMore });
  } catch (error) {
    console.error("Projects GET:", error);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
