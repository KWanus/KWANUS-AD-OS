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

    const source = req.nextUrl.searchParams.get("source") ?? "";
    const status = req.nextUrl.searchParams.get("status") ?? "";
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "50"), 100);

    const where = {
      ...(source && { source }),
      ...(status && { status }),
    };

    const logs = await prisma.webhookLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ ok: true, logs, total: logs.length });
  } catch (err) {
    console.error("Webhook logs error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
