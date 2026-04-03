import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { incrementUsage } from "@/lib/himalaya/access";

export type OutcomeData = {
  result: "improved" | "no_change" | "worse" | "not_done";
  note?: string;
  timestamp: string;
};

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
      select: { outcome: true },
    });

    if (!analysis) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, outcome: analysis.outcome ?? null });
  } catch (err) {
    console.error("Outcome GET:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

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

    const body = (await req.json()) as { result?: string; note?: string };

    if (!body.result || !["improved", "no_change", "worse", "not_done"].includes(body.result)) {
      return NextResponse.json({ ok: false, error: "Invalid result. Use: improved, no_change, worse, not_done" }, { status: 400 });
    }

    const analysis = await prisma.analysisRun.findFirst({
      where: { id, userId: user.id },
    });
    if (!analysis) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const outcome: OutcomeData = {
      result: body.result as OutcomeData["result"],
      note: body.note?.trim() || undefined,
      timestamp: new Date().toISOString(),
    };

    await prisma.analysisRun.update({
      where: { id },
      data: { outcome: outcome as object },
    });

    // Track usage
    await incrementUsage(user.id, "outcomesLogged").catch(() => {});

    // Feed outcome into memory patterns
    try {
      const memory = await prisma.himalayaMemory.findUnique({
        where: { userId: user.id },
      });

      const existing = (memory?.regenCounts ?? {}) as Record<string, unknown>;
      const outcomes = (existing.outcomePatterns ?? {}) as Record<string, number>;
      const mode = analysis.mode;
      const key = `${mode}_${body.result}`;
      outcomes[key] = (outcomes[key] ?? 0) + 1;

      await prisma.himalayaMemory.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          regenCounts: { ...existing, outcomePatterns: outcomes } as object,
        },
        update: {
          regenCounts: { ...existing, outcomePatterns: outcomes } as object,
        },
      });
    } catch {
      // memory update non-blocking
    }

    return NextResponse.json({ ok: true, outcome });
  } catch (err) {
    console.error("Outcome POST:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
