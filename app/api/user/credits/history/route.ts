import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * GET /api/user/credits/history
 * Returns the user's credit transaction history.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "50"), 100);

    const [logs, currentCredits] = await Promise.all([
      prisma.creditLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { credits: true },
      }),
    ]);

    // Summary stats
    const totalSpent = logs.filter(l => l.amount < 0).reduce((s, l) => s + Math.abs(l.amount), 0);
    const totalAdded = logs.filter(l => l.amount > 0).reduce((s, l) => s + l.amount, 0);

    return NextResponse.json({
      ok: true,
      currentBalance: currentCredits?.credits ?? 0,
      totalSpent,
      totalAdded,
      history: logs,
    });
  } catch (err) {
    console.error("Credit history error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
