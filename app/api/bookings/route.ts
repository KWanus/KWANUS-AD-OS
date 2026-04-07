// ---------------------------------------------------------------------------
// GET /api/bookings — get available slots + upcoming bookings
// POST /api/bookings — create a new booking (public — from booking page)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { getAvailableSlots, createBooking, getUpcomingBookings } from "@/lib/integrations/bookingSystem";

export async function GET(req: NextRequest) {
  // Public mode: get slots for a specific user (for booking page)
  const forUser = req.nextUrl.searchParams.get("userId");
  if (forUser) {
    const slots = await getAvailableSlots(forUser);
    return NextResponse.json({ ok: true, slots });
  }

  // Authenticated mode: get own bookings
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [slots, bookings] = await Promise.all([
    getAvailableSlots(user.id),
    getUpcomingBookings(user.id),
  ]);

  return NextResponse.json({ ok: true, slots, bookings });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      userId: string; // The consultant's user ID (from booking page URL)
      date: string;
      startTime: string;
      endTime: string;
      clientName: string;
      clientEmail: string;
      clientPhone?: string;
      notes?: string;
    };

    if (!body.userId || !body.date || !body.startTime || !body.clientName || !body.clientEmail) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    const result = await createBooking(body);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Booking error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
