"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import OperatorCallout from "@/components/navigation/OperatorCallout";
import OperatorStatCard from "@/components/navigation/OperatorStatCard";
import WorkflowHeader from "@/components/navigation/WorkflowHeader";
import WorkflowPanel from "@/components/navigation/WorkflowPanel";
import { CalendarDays, Check, Clock3, Copy, ExternalLink, Loader2, Phone, UserRound } from "lucide-react";

type TimeSlot = {
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
};

type Booking = {
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

type BookingResponse = {
  ok: boolean;
  userId?: string;
  slots?: TimeSlot[];
  bookings?: Booking[];
};

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function BookingsPage() {
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    fetch("/api/bookings")
      .then((r) => r.json() as Promise<BookingResponse>)
      .then((data) => {
        if (data.ok) {
          setUserId(data.userId ?? null);
          setSlots(data.slots ?? []);
          setBookings(data.bookings ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const availabilityPreview = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const slot of slots) {
      if (!slot.available) continue;
      grouped.set(slot.date, (grouped.get(slot.date) ?? 0) + 1);
    }
    return Array.from(grouped.entries()).slice(0, 7);
  }, [slots]);

  const nextOpenDay = availabilityPreview[0]?.[0] ?? null;
  const nextBooking = bookings[0] ?? null;

  const publicUrl = userId ? `${typeof window !== "undefined" ? window.location.origin : ""}/book/${userId}` : "";

  function copyLink() {
    if (!publicUrl) return;
    void navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-6 rounded-3xl border border-white/[0.06] bg-gradient-to-br from-cyan-500/[0.07] via-white/[0.02] to-purple-500/[0.04] p-5 sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <WorkflowHeader
              title="Booking Manager"
              description="Share a public booking page, track upcoming appointments, and keep your consultant path conversion-ready."
              icon={CalendarDays}
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              {userId && (
                <>
                  <Link
                    href={`/book/${userId}`}
                    target="_blank"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white/55 transition hover:text-white/80"
                  >
                    Preview Booking Page
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={copyLink}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2.5 text-sm font-bold text-cyan-300 transition hover:bg-cyan-500/20"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy Link"}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <OperatorStatCard label="Upcoming" value={bookings.length} description="Appointments currently on the calendar." valueClassName="text-2xl" />
            <OperatorStatCard label="Open Days" value={availabilityPreview.length} description="Upcoming days with at least one bookable slot." valueClassName="text-2xl" />
            <OperatorStatCard label="Public Link" value={userId ? "Live" : "Pending"} description="Share the booking page directly once the workspace user ID is loaded." />
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <OperatorStatCard
              label="Next Open Window"
              value={nextOpenDay ? formatDate(nextOpenDay) : "No future availability"}
              description={nextOpenDay ? "Your public booking page still has visible capacity." : "Add or reopen availability so visitors do not hit a dead end."}
            />
            <OperatorStatCard
              label="Next Appointment"
              value={nextBooking ? `${nextBooking.clientName} · ${formatDate(nextBooking.date)}` : "No call booked yet"}
              description={nextBooking ? `${nextBooking.startTime} to ${nextBooking.endTime}` : "Share the live link across landing pages, chat replies, and email CTAs to start filling this calendar."}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent py-20">
            <Loader2 className="h-6 w-6 animate-spin text-white/20" />
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <WorkflowPanel
                eyebrow="Availability Preview"
                title="What prospects can book next"
                description="This gives you a fast operator check on whether the public page actually has enough open capacity to convert traffic."
                className="rounded-3xl border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent"
              >
                <div className="mb-4 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-cyan-300" />
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/20">Open Windows</p>
                </div>
                {availabilityPreview.length === 0 ? (
                  <OperatorCallout
                    icon={CalendarDays}
                    eyebrow="Availability Warning"
                    title="No upcoming available slots yet."
                    description="Until availability opens up, your public booking page risks becoming a dead-end CTA."
                    tone="warning"
                  />
                ) : (
                  <div className="space-y-3">
                    {availabilityPreview.map(([date, count]) => (
                      <div key={date} className="flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-black/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white">{formatDate(date)}</p>
                          <p className="mt-1 text-[11px] text-white/30">{count} slot{count === 1 ? "" : "s"} available</p>
                        </div>
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
                          Open
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </WorkflowPanel>

              <WorkflowPanel
                eyebrow="Upcoming Appointments"
                title="Who is already on the calendar"
                description="This keeps the booking manager grounded in real scheduled demand, not just link sharing."
                className="rounded-3xl border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent"
              >
                <div className="mb-4 flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-cyan-300" />
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/20">Calendar Feed</p>
                </div>
                {bookings.length === 0 ? (
                  <OperatorCallout
                    icon={Clock3}
                    eyebrow="Calendar Feed"
                    title="No bookings yet."
                    description="Share the public booking page in sites, email sequences, and chat follow-up to convert intent faster."
                  />
                ) : (
                  <div className="space-y-3">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-black text-white">{booking.clientName}</p>
                              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
                                {booking.status}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-white/55">{formatDate(booking.date)} · {booking.startTime} to {booking.endTime}</p>
                            <p className="mt-1 text-xs text-white/30">{booking.clientEmail}</p>
                            {booking.clientPhone && (
                              <p className="mt-1 flex items-center gap-1 text-xs text-white/30">
                                <Phone className="h-3 w-3" />
                                {booking.clientPhone}
                              </p>
                            )}
                            {booking.notes && <p className="mt-3 text-xs leading-6 text-white/40">{booking.notes}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </WorkflowPanel>
            </div>

            {userId && (
              <WorkflowPanel
                eyebrow="Public Booking URL"
                title="Shareable booking surface"
                description="Use this link in generated sites, emails, chat replies, or CTA buttons so prospects can convert without leaving your system."
                className="rounded-3xl border-cyan-500/15 bg-gradient-to-br from-cyan-500/[0.08] via-transparent to-purple-500/[0.05]"
              >
                <div className="mb-2 flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-cyan-300" />
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100/70">Live Link</p>
                </div>
                <code className="block overflow-x-auto rounded-2xl border border-white/[0.08] bg-black/25 px-4 py-3 text-sm text-cyan-100/80">
                  {publicUrl}
                </code>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={copyLink}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2.5 text-sm font-bold text-cyan-300 transition hover:bg-cyan-500/20"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy Live Link"}
                  </button>
                  <Link
                    href={`/book/${userId}`}
                    target="_blank"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white/55 transition hover:text-white/80"
                  >
                    Open Public Page
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </WorkflowPanel>
            )}
          </>
        )}
      </main>
    </div>
  );
}
