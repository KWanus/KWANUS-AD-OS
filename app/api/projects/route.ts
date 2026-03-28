import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ ok: false, message: "User not synced" }, { status: 400 });
    }

    const projects = await prisma.campaign.findMany({
      where: {
        userId: user.id,
        OR: [
          { sourceUrl: { not: null } },
          { currentPhase: { gte: 1 } },
        ],
      },
      orderBy: { updatedAt: "desc" },
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

    return NextResponse.json({ ok: true, projects });
  } catch (error) {
    console.error("Projects GET error:", error);
    return NextResponse.json({ ok: false, message: "Failed to load projects" }, { status: 500 });
  }
}
