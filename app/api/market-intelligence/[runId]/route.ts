import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const user = await getOrCreateUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { runId } = await params;

    const run = await prisma.marketIntelligence.findFirst({
      where: { id: runId, userId: user.id },
    });

    if (!run) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, run });
  } catch (error) {
    console.error("[market-intelligence/run] error:", error);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
