import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

const VALID_TARGETS = [
  "adHooks",
  "adScripts",
  "adBriefs",
  "landingPage",
  "emailSequences",
  "executionChecklist",
] as const;

type EditTarget = (typeof VALID_TARGETS)[number];

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

    const body = (await req.json()) as { target?: string; content?: unknown };
    const target = body.target as EditTarget;

    if (!target || !VALID_TARGETS.includes(target)) {
      return NextResponse.json(
        { ok: false, error: `Invalid target. Valid: ${VALID_TARGETS.join(", ")}` },
        { status: 400 }
      );
    }

    if (body.content === undefined) {
      return NextResponse.json({ ok: false, error: "Content is required" }, { status: 400 });
    }

    const analysis = await prisma.analysisRun.findFirst({
      where: { id, userId: user.id },
      include: { assetPackages: true },
    });

    if (!analysis) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const existingAsset = analysis.assetPackages[0];
    if (!existingAsset) {
      return NextResponse.json({ ok: false, error: "No asset package to edit" }, { status: 400 });
    }

    await prisma.assetPackage.update({
      where: { id: existingAsset.id },
      data: { [target]: body.content },
    });

    return NextResponse.json({ ok: true, target });
  } catch (err) {
    console.error("Asset PATCH error:", err);
    return NextResponse.json({ ok: false, error: "Failed to save" }, { status: 500 });
  }
}
