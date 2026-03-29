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
    console.error("Project GET error:", error);
    return NextResponse.json({ ok: false, message: "Failed to load project" }, { status: 500 });
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
    const body = await req.json() as Record<string, unknown>;

    // Whitelist updatable fields — never allow userId, id, or internal state fields
    const ALLOWED_FIELDS = [
      "name", "status", "notes", "currentPhase", "workflowState",
      "productName", "productUrl", "sourceUrl", "sourceType",
    ] as const;
    type AllowedKey = (typeof ALLOWED_FIELDS)[number];
    const data: Partial<Record<AllowedKey, unknown>> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in body) data[key] = body[key];
    }

    const result = await prisma.campaign.updateMany({
      where: { id, userId: user.id },
      data,
    });
    if (result.count === 0) return NextResponse.json({ ok: false, message: "Project not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Project PATCH error:", error);
    return NextResponse.json({ ok: false, message: "Failed to update project" }, { status: 500 });
  }
}
