import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const project = await prisma.campaign.findFirst({
      where: { id, userId: user.id },
      include: {
        analysisRun: {
          include: {
            opportunityAssessments: true,
            assetPackages: true,
          },
        },
        creatives: true,
      },
    });

    if (!project) return NextResponse.json({ ok: false, message: "Project not found" }, { status: 404 });

    return NextResponse.json({ ok: true, project });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const updates = await req.json() as Record<string, unknown>;
    const existing = await prisma.campaign.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ ok: false, message: "Project not found" }, { status: 404 });
    const project = await prisma.campaign.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ ok: true, project });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
