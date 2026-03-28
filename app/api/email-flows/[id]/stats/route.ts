import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * GET /api/email-flows/[id]/stats
 * Returns performance stats for an email flow.
 */
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

    const flow = await prisma.emailFlow.findFirst({
      where: { id, userId: user.id },
      select: {
        id: true,
        name: true,
        status: true,
        enrolled: true,
        sent: true,
        opens: true,
        clicks: true,
        conversions: true,
        revenue: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!flow) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const openRate = flow.sent > 0 ? Math.round((flow.opens / flow.sent) * 1000) / 10 : 0;
    const clickRate = flow.opens > 0 ? Math.round((flow.clicks / flow.opens) * 1000) / 10 : 0;
    const conversionRate = flow.clicks > 0 ? Math.round((flow.conversions / flow.clicks) * 1000) / 10 : 0;
    const revenuePerEnrolled = flow.enrolled > 0 ? Math.round((flow.revenue / flow.enrolled) * 100) / 100 : 0;

    return NextResponse.json({
      ok: true,
      stats: {
        enrolled: flow.enrolled,
        sent: flow.sent,
        opens: flow.opens,
        clicks: flow.clicks,
        conversions: flow.conversions,
        revenue: flow.revenue,
        openRate,
        clickRate,
        conversionRate,
        revenuePerEnrolled,
        status: flow.status,
        daysSinceCreation: Math.round((Date.now() - new Date(flow.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      },
    });
  } catch (err) {
    console.error("Flow stats error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
