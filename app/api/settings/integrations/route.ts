import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET — Fetch user's connected integrations */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    // Fetch email integration
    const emailIntegration = await prisma.emailIntegration.findUnique({
      where: { userId: user.id },
      select: {
        provider: true,
        connected: true,
        dailyLimit: true,
        sentToday: true,
        createdAt: true,
      },
    });

    // Fetch calendar integration
    const calendarIntegration = await prisma.calendarIntegration.findUnique({
      where: { userId: user.id },
      select: {
        provider: true,
        connected: true,
        createdAt: true,
      },
    });

    const integrations = [];

    if (emailIntegration) {
      integrations.push({
        type: "email",
        provider: emailIntegration.provider,
        connected: emailIntegration.connected,
        connectedAt: emailIntegration.createdAt,
        email: user.email,
        dailyLimit: emailIntegration.dailyLimit,
        sentToday: emailIntegration.sentToday,
      });
    }

    if (calendarIntegration) {
      integrations.push({
        type: "calendar",
        provider: calendarIntegration.provider,
        connected: calendarIntegration.connected,
        connectedAt: calendarIntegration.createdAt,
      });
    }

    return NextResponse.json({ ok: true, integrations });
  } catch (err) {
    console.error("Settings fetch error:", err);
    return NextResponse.json({ ok: false, error: "Failed to fetch integrations" }, { status: 500 });
  }
}
