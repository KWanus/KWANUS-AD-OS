import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { event: string; sessionId?: string; metadata?: Record<string, unknown> };

    if (!body.event) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    let userId: string | null = null;
    try {
      const { userId: clerkId } = await auth();
      if (clerkId) {
        const user = await getOrCreateUser();
        userId = user?.id ?? null;
      }
    } catch {
      // tracking works without auth
    }

    await prisma.himalayaFunnelEvent.create({
      data: {
        userId,
        sessionId: body.sessionId ?? null,
        event: body.event,
        metadata: body.metadata ? (body.metadata as object) : undefined,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    // tracking never fails the user
    return NextResponse.json({ ok: true });
  }
}

// GET — funnel stats for admin/operator view
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    // Get event counts for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const events = await prisma.himalayaFunnelEvent.groupBy({
      by: ["event"],
      _count: { id: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { _count: { id: "desc" } },
    });

    const funnel: Record<string, number> = {};
    for (const e of events) {
      funnel[e.event] = e._count.id;
    }

    // Calculate conversion rates
    const rates: Record<string, string> = {};
    const steps = ["page_view", "run_start", "run_complete", "results_view", "upgrade_click", "purchase", "deploy", "execute_start", "execute_complete", "outcome_submit"];
    for (let i = 1; i < steps.length; i++) {
      const prev = funnel[steps[i - 1]] ?? 0;
      const curr = funnel[steps[i]] ?? 0;
      rates[`${steps[i - 1]}_to_${steps[i]}`] = prev > 0 ? `${Math.round((curr / prev) * 100)}%` : "0%";
    }

    return NextResponse.json({ ok: true, funnel, rates, period: "30d" });
  } catch (err) {
    console.error("Funnel stats error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
