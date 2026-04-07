// ---------------------------------------------------------------------------
// Booking System — native appointment scheduling for consultant path
// No external dependencies. Stores availability + bookings in DB.
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";

export type TimeSlot = {
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM (24h)
  endTime: string;    // HH:MM (24h)
  available: boolean;
};

export type Booking = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  notes?: string;
  status: "confirmed" | "cancelled" | "completed";
  createdAt: string;
};

/** Get available time slots for a user (next 14 days) */
export async function getAvailableSlots(userId: string): Promise<TimeSlot[]> {
  // Load user's availability settings
  const events = await prisma.himalayaFunnelEvent.findMany({
    where: { userId, event: "booking_config" },
    orderBy: { createdAt: "desc" },
    take: 1,
  });

  const config = (events[0]?.metadata as Record<string, unknown>) ?? {};
  const workDays = (config.workDays as number[]) ?? [1, 2, 3, 4, 5]; // Mon-Fri
  const startHour = (config.startHour as number) ?? 9;
  const endHour = (config.endHour as number) ?? 17;
  const slotDuration = (config.slotDuration as number) ?? 30; // minutes
  const timezone = (config.timezone as string) ?? "America/New_York";

  // Load existing bookings
  const existingBookings = await prisma.himalayaFunnelEvent.findMany({
    where: {
      userId,
      event: "booking_created",
      metadata: { path: ["status"], not: "cancelled" },
    },
    select: { metadata: true },
  });

  const bookedSlots = new Set(
    existingBookings.map((b) => {
      const meta = b.metadata as Record<string, string>;
      return `${meta.date}:${meta.startTime}`;
    })
  );

  // Generate slots for next 14 days
  const slots: TimeSlot[] = [];
  const now = new Date();

  for (let day = 1; day <= 14; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() + day);
    const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon...

    if (!workDays.includes(dayOfWeek)) continue;

    const dateStr = date.toISOString().split("T")[0];

    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += slotDuration) {
        const startTime = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
        const endMin = min + slotDuration;
        const endH = hour + Math.floor(endMin / 60);
        const endM = endMin % 60;
        const endTime = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;

        if (endH > endHour || (endH === endHour && endM > 0)) continue;

        const key = `${dateStr}:${startTime}`;
        slots.push({
          date: dateStr,
          startTime,
          endTime,
          available: !bookedSlots.has(key),
        });
      }
    }
  }

  return slots;
}

/** Create a booking */
export async function createBooking(input: {
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  notes?: string;
}): Promise<{ ok: boolean; bookingId?: string; error?: string }> {
  try {
    // Check slot is still available
    const existing = await prisma.himalayaFunnelEvent.findFirst({
      where: {
        userId: input.userId,
        event: "booking_created",
        metadata: {
          path: ["date"],
          equals: input.date,
        },
      },
    });

    if (existing) {
      const meta = existing.metadata as Record<string, string>;
      if (meta.startTime === input.startTime && meta.status !== "cancelled") {
        return { ok: false, error: "This time slot is already booked" };
      }
    }

    const event = await prisma.himalayaFunnelEvent.create({
      data: {
        userId: input.userId,
        event: "booking_created",
        metadata: {
          date: input.date,
          startTime: input.startTime,
          endTime: input.endTime,
          clientName: input.clientName,
          clientEmail: input.clientEmail,
          clientPhone: input.clientPhone ?? null,
          notes: input.notes ?? null,
          status: "confirmed",
        },
      },
    });

    // Create contact
    await prisma.emailContact.upsert({
      where: { userId_email: { userId: input.userId, email: input.clientEmail } },
      update: {},
      create: {
        userId: input.userId,
        email: input.clientEmail,
        firstName: input.clientName.split(" ")[0],
        source: "booking",
        tags: ["booking", "appointment"],
      },
    }).catch(() => {});

    // Notify owner
    const { createNotification } = await import("@/lib/notifications/notify");
    createNotification({
      userId: input.userId,
      type: "new_lead",
      title: `New booking: ${input.clientName}`,
      body: `${input.date} at ${input.startTime} — ${input.clientEmail}`,
      href: "/inbox",
    }).catch(() => {});

    return { ok: true, bookingId: event.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Booking failed" };
  }
}

/** Get upcoming bookings */
export async function getUpcomingBookings(userId: string): Promise<Booking[]> {
  const today = new Date().toISOString().split("T")[0];

  const events = await prisma.himalayaFunnelEvent.findMany({
    where: { userId, event: "booking_created" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return events
    .map((e) => {
      const meta = e.metadata as Record<string, string>;
      return {
        id: e.id,
        date: meta.date,
        startTime: meta.startTime,
        endTime: meta.endTime,
        clientName: meta.clientName,
        clientEmail: meta.clientEmail,
        clientPhone: meta.clientPhone,
        notes: meta.notes,
        status: (meta.status as Booking["status"]) ?? "confirmed",
        createdAt: e.createdAt.toISOString(),
      };
    })
    .filter((b) => b.date >= today && b.status !== "cancelled");
}
