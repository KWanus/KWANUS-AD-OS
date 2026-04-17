"use client";

import { useEffect, useMemo, useState, use } from "react";
import Link from "next/link";
import WorkflowHeader from "@/components/navigation/WorkflowHeader";
import WorkflowPanel from "@/components/navigation/WorkflowPanel";
import { CalendarDays, CheckCircle, Clock3, Loader2, ShieldCheck, Sparkles } from "lucide-react";

type TimeSlot = {
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
};

type SlotsResponse = {
  ok: boolean;
  slots?: TimeSlot[];
};

type CreateResponse = {
  ok: boolean;
  bookingId?: string;
  error?: string;
};

function prettyDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function PublicBookingPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [form, setForm] = useState({ clientName: "", clientEmail: "", clientPhone: "", notes: "" });

  useEffect(() => {
    fetch(`/api/bookings?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.json() as Promise<SlotsResponse>)
      .then((data) => {
        if (data.ok && data.slots) setSlots(data.slots.filter((slot) => slot.available));
      })
      .catch(() => setError("Failed to load booking slots"))
      .finally(() => setLoading(false));
  }, [userId]);

  const grouped = useMemo(() => {
    const map = new Map<string, TimeSlot[]>();
    for (const slot of slots) {
      const current = map.get(slot.date) ?? [];
      current.push(slot);
      map.set(slot.date, current);
    }
    return Array.from(map.entries()).slice(0, 10);
  }, [slots]);

  const selectedSlotLabel = useMemo(() => {
    const [date, startTime, endTime] = selectedKey.split("|");
    if (!date || !startTime || !endTime) return null;
    return `${prettyDate(date)} · ${startTime} to ${endTime}`;
  }, [selectedKey]);

  async function submit() {
    const [date, startTime, endTime] = selectedKey.split("|");
    if (!date || !startTime || !endTime || !form.clientName.trim() || !form.clientEmail.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          date,
          startTime,
          endTime,
          clientName: form.clientName.trim(),
          clientEmail: form.clientEmail.trim(),
          clientPhone: form.clientPhone.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });
      const data = await res.json() as CreateResponse;
      if (data.ok) {
        setBooked(true);
      } else {
        setError(data.error ?? "Booking failed");
      }
    } catch {
      setError("Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-6 rounded-3xl border border-[#f5a623]/12 bg-gradient-to-br from-cyan-500/[0.06] via-transparent to-purple-500/[0.05] p-6 sm:p-8">
          <WorkflowHeader
            title="Book a Call"
            description="Choose a time that works for you and lock it in directly. No extra scheduling tool needed."
            icon={CalendarDays}
          />

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/25">Fast Booking</p>
              <p className="mt-2 text-sm font-black text-white">Pick a slot in one step</p>
              <p className="mt-1 text-xs text-white/35">Available windows are shown directly so there is no back-and-forth scheduling.</p>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/25">Selected Time</p>
              <p className="mt-2 text-sm font-black text-white">{selectedSlotLabel ?? "Choose a slot"}</p>
              <p className="mt-1 text-xs text-white/35">Once you select a time, your details panel becomes the confirmation step.</p>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/25">Follow-Up</p>
              <p className="mt-2 text-sm font-black text-white">Confirmation in-system</p>
              <p className="mt-1 text-xs text-white/35">Your booking is captured directly into the operator workspace instead of a separate scheduler.</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent py-20">
            <Loader2 className="h-6 w-6 animate-spin text-white/20" />
          </div>
        ) : booked ? (
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center sm:p-8">
            <CheckCircle className="mx-auto h-12 w-12 text-emerald-300" />
            <h2 className="mt-4 text-2xl font-black text-white">Booked</h2>
            <p className="mt-2 text-sm text-white/45">Your appointment is confirmed. Watch your inbox for follow-up details.</p>

            <div className="mx-auto mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/20">Status</p>
                <p className="mt-2 text-sm font-black text-white">Confirmed</p>
                <p className="mt-1 text-[11px] text-white/40">Saved directly into the operator workspace.</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/20">Time</p>
                <p className="mt-2 text-sm font-black text-white">{selectedSlotLabel ?? "Chosen slot"}</p>
                <p className="mt-1 text-[11px] text-white/40">Your selected window is locked in.</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/20">Next</p>
                <p className="mt-2 text-sm font-black text-white">Watch your email</p>
                <p className="mt-1 text-[11px] text-white/40">Follow-up details and prep should arrive shortly.</p>
              </div>
            </div>

            <Link href="/" className="mt-6 inline-flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white/60 transition hover:text-white/85">
              Close
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <WorkflowPanel
              eyebrow="Choose a Time"
              title="Open slots"
              description="Pick the window that fits best. Only currently available slots are shown here."
              className="rounded-3xl border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent"
            >
              <div className="mb-4 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[#f5a623]" />
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/20">Availability</p>
              </div>
              {grouped.length === 0 ? (
                <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.06] p-4">
                  <p className="text-sm font-semibold text-white/80">No open slots are available right now.</p>
                  <p className="mt-1 text-xs leading-5 text-white/45">Try again soon or reach out directly if this page was shared with you personally.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {grouped.map(([date, daySlots]) => (
                    <div key={date}>
                      <p className="mb-2 text-sm font-bold text-white/70">{prettyDate(date)}</p>
                      <div className="flex flex-wrap gap-2">
                        {daySlots.map((slot) => {
                          const key = `${slot.date}|${slot.startTime}|${slot.endTime}`;
                          const active = selectedKey === key;
                          return (
                            <button
                              key={key}
                              onClick={() => setSelectedKey(key)}
                              className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                                active
                                  ? "border-[#f5a623]/30 bg-[#f5a623]/10 text-[#f5a623]"
                                  : "border-white/[0.07] bg-black/20 text-white/50 hover:border-white/[0.12] hover:text-white/70"
                              }`}
                            >
                              {slot.startTime}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </WorkflowPanel>

            <WorkflowPanel
              eyebrow="Your Details"
              title="Lock in the appointment"
              description="Tell us who you are and what you want help with so the call starts with context."
              className="rounded-3xl border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent"
            >
              <div className="rounded-2xl border border-[#f5a623]/15 bg-[#f5a623]/[0.06] p-4">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-[#f5a623]" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f5a623]/70">Current Selection</p>
                </div>
                <p className="mt-2 text-sm font-black text-white">{selectedSlotLabel ?? "Choose a slot on the left to continue"}</p>
                <p className="mt-1 text-[11px] leading-5 text-white/40">
                  {selectedSlotLabel ? "Once your details are submitted, this slot is sent straight into the booking workspace." : "The form becomes your confirmation step after you choose a time."}
                </p>
              </div>

              <div className="mt-4 space-y-3">
                <input
                  value={form.clientName}
                  onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/20 focus:border-[#f5a623]/40 focus:outline-none"
                />
                <input
                  value={form.clientEmail}
                  onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))}
                  placeholder="Email"
                  type="email"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/20 focus:border-[#f5a623]/40 focus:outline-none"
                />
                <input
                  value={form.clientPhone}
                  onChange={(e) => setForm((f) => ({ ...f, clientPhone: e.target.value }))}
                  placeholder="Phone (optional)"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/20 focus:border-[#f5a623]/40 focus:outline-none"
                />
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="What do you want help with?"
                  rows={4}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/20 focus:border-[#f5a623]/40 focus:outline-none"
                />
                {error && <p className="text-sm text-red-300">{error}</p>}
                <button
                  onClick={() => void submit()}
                  disabled={submitting || !selectedKey || !form.clientName.trim() || !form.clientEmail.trim()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Confirm Booking
                </button>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-white/70">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#f5a623]" />
                      Direct booking
                    </div>
                    <p className="mt-1 text-[11px] leading-5 text-white/35">This appointment is captured directly in the operator workspace, not bounced into a third-party scheduler.</p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-white/70">
                      <Sparkles className="h-3.5 w-3.5 text-[#f5a623]" />
                      Better context
                    </div>
                    <p className="mt-1 text-[11px] leading-5 text-white/35">Use the notes field to describe goals, blockers, or the outcome you want from the call.</p>
                  </div>
                </div>
              </div>
            </WorkflowPanel>
          </div>
        )}
      </main>
    </div>
  );
}
