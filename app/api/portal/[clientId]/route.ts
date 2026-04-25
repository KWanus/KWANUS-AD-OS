import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET — Public client portal (no auth required)
 * Client can access their portal with just the clientId
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;

  try {
    // Fetch client data
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        healthScore: true,
        healthStatus: true,
        dealValue: true,
        nextMeetingAt: true,
      },
    });

    if (!client) {
      return NextResponse.json({ ok: false, error: "Client not found" }, { status: 404 });
    }

    // Fetch recent activities (notes, meetings, tasks)
    const activities = await prisma.clientActivity.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        createdAt: true,
        status: true,
      },
    });

    // Calculate metrics
    const allActivities = await prisma.clientActivity.findMany({
      where: { clientId },
      select: {
        type: true,
        status: true,
        createdAt: true,
      },
    });

    const now = new Date();
    const metrics = {
      totalSpent: client.dealValue || 0,
      activeProjects: allActivities.filter(
        (a) => a.type === "project" && a.status === "active"
      ).length,
      completedTasks: allActivities.filter(
        (a) => a.type === "task" && a.status === "completed"
      ).length,
      upcomingMeetings: allActivities.filter(
        (a) => a.type === "meeting" && new Date(a.createdAt) > now
      ).length,
    };

    // Mock invoices (in production, fetch from Stripe or your billing system)
    const invoices = [
      // Placeholder - integrate with Stripe or your billing system
    ];

    return NextResponse.json({
      ok: true,
      portal: {
        client: {
          id: client.id,
          name: client.name,
          healthScore: client.healthScore,
          healthStatus: client.healthStatus,
          dealValue: client.dealValue || 0,
          nextMeeting: client.nextMeetingAt,
        },
        activities: activities.map((a) => ({
          id: a.id,
          type: a.type,
          title: a.title,
          description: a.description || "",
          createdAt: a.createdAt,
          status: a.status,
        })),
        invoices,
        metrics,
      },
    });
  } catch (err) {
    console.error("Client portal error:", err);
    return NextResponse.json({ ok: false, error: "Failed to load portal" }, { status: 500 });
  }
}
