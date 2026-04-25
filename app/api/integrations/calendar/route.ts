import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGoogleCalendarAuthUrl, disconnectGoogleCalendar, createCalendarEvent, checkAvailability } from "@/lib/integrations/calendar/googleCalendar";

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

/** POST — Connect calendar integration, disconnect, or create event */
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      action?: "connect" | "disconnect" | "create_event" | "check_availability";
      provider?: "google" | "outlook";
      summary?: string;
      startTime?: string;
      endTime?: string;
      attendees?: string[];
      location?: string;
      description?: string;
    };

    const { action } = body;

    if (action === "disconnect") {
      await disconnectGoogleCalendar(user.id);
      return NextResponse.json({ ok: true });
    }

    if (action === "connect" && body.provider === "google") {
      const authUrl = getGoogleCalendarAuthUrl(user.id);
      return NextResponse.json({ ok: true, authUrl });
    }

    if (action === "create_event") {
      if (!body.summary || !body.startTime || !body.endTime) {
        return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
      }

      const result = await createCalendarEvent({
        userId: user.id,
        summary: body.summary,
        startTime: body.startTime,
        endTime: body.endTime,
        attendees: body.attendees,
        location: body.location,
        description: body.description,
      });

      return NextResponse.json(result);
    }

    if (action === "check_availability") {
      if (!body.startTime || !body.endTime) {
        return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
      }

      const result = await checkAvailability({
        userId: user.id,
        startTime: body.startTime,
        endTime: body.endTime,
      });

      return NextResponse.json(result);
    }

    return NextResponse.json({ ok: false, error: "Invalid action or provider" }, { status: 400 });
  } catch (err) {
    console.error("Calendar integration POST error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
