import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

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

    const analysis = await prisma.analysisRun.findFirst({
      where: { id, userId: user.id },
      select: { executionState: true },
    });

    if (!analysis) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true, executionState: analysis.executionState ?? null });
  } catch (err) {
    console.error("Execute GET:", err);
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

    const body = (await req.json()) as { executionState: unknown };

    const analysis = await prisma.analysisRun.findFirst({
      where: { id, userId: user.id },
    });

    if (!analysis) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    await prisma.analysisRun.update({
      where: { id },
      data: { executionState: body.executionState as object },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Execute PATCH:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
