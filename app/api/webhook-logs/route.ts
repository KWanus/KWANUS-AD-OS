import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * GET /api/webhook-logs — List recent webhook events for debugging.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    // Webhook logs are system-wide debug data — restrict to paid plans
    if (user.plan === "free") {
      return NextResponse.json({ ok: false, error: "Webhook logs require a paid plan" }, { status: 403 });
    }

    const source = req.nextUrl.searchParams.get("source") ?? "";
    const status = req.nextUrl.searchParams.get("status") ?? "";
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "50"), 100);

    const where: Record<string, string> = {};
    if (source) where.source = source;
    if (status) where.status = status;

    const logs = await prisma.webhookLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      // Exclude full payload from list view for security
      select: {
        id: true,
        source: true,
        workflow: true,
        status: true,
        error: true,
        durationMs: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, logs, total: logs.length });
  } catch (err) {
    console.error("Webhook logs error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
