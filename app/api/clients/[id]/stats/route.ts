import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * GET /api/clients/[id]/stats
 * Returns engagement stats for a specific client.
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

    const client = await prisma.client.findFirst({
      where: { id, userId: user.id },
      select: { id: true, createdAt: true, lastContactAt: true, healthScore: true },
    });

    if (!client) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const activities = await prisma.clientActivity.findMany({
      where: { clientId: id },
      select: { type: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    // Activity by type
    const byType: Record<string, number> = {};
    for (const a of activities) {
      byType[a.type] = (byType[a.type] ?? 0) + 1;
    }

    // Activity by week (last 8 weeks)
    const weeklyActivity: { week: string; count: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      const count = activities.filter(a => {
        const d = new Date(a.createdAt);
        return d >= start && d < end;
      }).length;
      weeklyActivity.push({
        week: `W-${i}`,
        count,
      });
    }

    // Days since first/last contact
    const daysSinceCreation = Math.round((Date.now() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const daysSinceContact = client.lastContactAt
      ? Math.round((Date.now() - new Date(client.lastContactAt).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Average activities per week
    const weeksActive = Math.max(1, Math.ceil(daysSinceCreation / 7));
    const avgPerWeek = Math.round((activities.length / weeksActive) * 10) / 10;

    return NextResponse.json({
      ok: true,
      stats: {
        totalActivities: activities.length,
        byType,
        weeklyActivity,
        daysSinceCreation,
        daysSinceContact,
        avgActivitiesPerWeek: avgPerWeek,
        engagementLevel: avgPerWeek >= 3 ? "high" : avgPerWeek >= 1 ? "medium" : "low",
      },
    });
  } catch (err) {
    console.error("Client stats error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
