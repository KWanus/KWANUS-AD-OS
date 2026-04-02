import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as { pinned?: boolean };

    const analysis = await prisma.analysisRun.findFirst({
      where: { id, userId: user.id },
    });

    if (!analysis) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    await prisma.analysisRun.update({
      where: { id },
      data: { pinned: body.pinned ?? !analysis.pinned },
    });

    return NextResponse.json({ ok: true, pinned: body.pinned ?? !analysis.pinned });
  } catch (err) {
    console.error("Pin error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
