import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * GET /api/clients/[id]/report
 * Generate a structured client report (health, activity, pipeline progress).
 * Can be shared with the client or used for internal reviews.
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
      include: {
        activities: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: { type: true, content: true, createdAt: true },
        },
        _count: { select: { activities: true } },
      },
    });

    if (!client) {
      return NextResponse.json({ ok: false, error: "Client not found" }, { status: 404 });
    }

    // Build activity summary by type
    const activityBreakdown: Record<string, number> = {};
    for (const a of client.activities) {
      activityBreakdown[a.type] = (activityBreakdown[a.type] ?? 0) + 1;
    }

    // Days since creation
    const daysSinceCreation = Math.round(
      (Date.now() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Days since last contact
    const daysSinceContact = client.lastContactAt
      ? Math.round((Date.now() - new Date(client.lastContactAt).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const report = {
      generatedAt: new Date().toISOString(),
      client: {
        name: client.name,
        company: client.company,
        email: client.email,
        pipelineStage: client.pipelineStage,
        dealValue: client.dealValue,
        healthScore: client.healthScore,
        healthStatus: client.healthStatus,
        priority: client.priority,
        tags: client.tags,
      },
      timeline: {
        clientSince: client.createdAt,
        daysSinceCreation,
        lastContact: client.lastContactAt,
        daysSinceContact,
        totalActivities: client._count.activities,
        activityBreakdown,
      },
      recentActivity: client.activities.slice(0, 10).map(a => ({
        type: a.type,
        content: a.content,
        date: a.createdAt,
      })),
      healthInsights: {
        score: client.healthScore,
        status: client.healthStatus,
        assessment: client.healthScore >= 70
          ? "This relationship is healthy with consistent engagement."
          : client.healthScore >= 40
          ? "Moderate risk — some engagement gaps need attention."
          : "High risk — contact has gone cold or relationship has stalled.",
        recommendation: !client.lastContactAt
          ? "No contact logged yet. Reach out within 24 hours."
          : (daysSinceContact ?? 0) > 14
          ? `No contact in ${daysSinceContact} days. Schedule a check-in immediately.`
          : "Contact frequency is healthy. Maintain current cadence.",
      },
    };

    return NextResponse.json({ ok: true, report });
  } catch (err) {
    console.error("Client report error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
