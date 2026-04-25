import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGoogleCalendarAuthUrl, disconnectGoogleCalendar } from "@/lib/integrations/calendar/googleCalendar";

/** GET — Get calendar integration status */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.calendarIntegration.findUnique({
      where: { userId: user.id },
      select: {
        provider: true,
        connected: true,
        timeZone: true,
      },
    });

    return NextResponse.json({
      ok: true,
      integration: integration ?? null,
    });
  } catch (err) {
    console.error("Calendar integration GET error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

/** POST — Connect calendar integration or disconnect */
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { action: "connect" | "disconnect"; provider: "google" | "outlook" };
    const { action, provider } = body;

    if (action === "disconnect") {
      await disconnectGoogleCalendar(user.id);
      return NextResponse.json({ ok: true });
    }

    if (action === "connect" && provider === "google") {
      const authUrl = getGoogleCalendarAuthUrl(user.id);
      return NextResponse.json({ ok: true, authUrl });
    }

    return NextResponse.json({ ok: false, error: "Invalid action or provider" }, { status: 400 });
  } catch (err) {
    console.error("Calendar integration POST error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
