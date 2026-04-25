"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft, Calendar, Loader2, Clock, Users, Video,
  MapPin, FileText, Check,
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  email?: string;
}

export default function ScheduleMeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [location, setLocation] = useState("");
  const [meetingType, setMeetingType] = useState<"in-person" | "video" | "phone">("video");
  const [notes, setNotes] = useState("");
  const [attendees, setAttendees] = useState("");

  useEffect(() => {
    void fetchClient();
    void checkCalendarConnection();
  }, [id]);

  async function fetchClient() {
    try {
      const res = await fetch(`/api/clients/${id}`);
      const data = await res.json() as { ok: boolean; client?: Client };
      if (data.ok && data.client) {
        setClient(data.client);
        setTitle(`Meeting with ${data.client.name}`);
        if (data.client.email) {
          setAttendees(data.client.email);
        }
      }
    } catch (err) {
      console.error("Failed to fetch client:", err);
    } finally {
      setLoading(false);
    }
  }

  async function checkCalendarConnection() {
    try {
      const res = await fetch("/api/settings/integrations");
      const data = await res.json() as { ok: boolean; integrations?: Array<{ type: string; connected: boolean }> };
      if (data.ok && data.integrations) {
        const calendar = data.integrations.find(i => i.type === "calendar");
        setCalendarConnected(calendar?.connected || false);
      }
    } catch (err) {
      console.error("Failed to check calendar:", err);
    }
  }

  async function handleSchedule() {
    if (!title || !date || !time) {
      toast.error("Please fill in required fields");
      return;
    }

    if (!calendarConnected) {
      toast.error("Please connect Google Calendar first");
      return;
    }

    setScheduling(true);
    try {
      // Combine date and time
      const startDateTime = new Date(`${date}T${time}`);
      const endDateTime = new Date(startDateTime.getTime() + parseInt(duration) * 60000);

      const res = await fetch("/api/integrations/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_event",
          summary: title,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          attendees: attendees.split(",").map(e => e.trim()).filter(Boolean),
          location: location || (meetingType === "video" ? "Google Meet" : undefined),
          description: notes,
        }),
      });

      const data = await res.json() as { ok: boolean; eventId?: string; eventLink?: string };

      if (data.ok) {
        // Log activity in CRM
        await fetch(`/api/clients/${id}/activities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "meeting",
            title,
            description: `Scheduled ${meetingType} meeting for ${startDateTime.toLocaleString()}`,
            status: "scheduled",
          }),
        });

        toast.success("Meeting scheduled successfully!");
        router.push(`/clients/${id}`);
      } else {
        toast.error("Failed to schedule meeting");
      }
    } catch (err) {
      console.error("Schedule error:", err);
      toast.error("Failed to schedule meeting");
    } finally {
      setScheduling(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-t-bg text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-t-bg text-white flex items-center justify-center">
        <p className="text-white/40">Client not found</p>
      </div>
    );
  }

  // Generate time slots (9 AM - 6 PM in 30-minute intervals)
  const timeSlots = [];
  for (let hour = 9; hour <= 18; hour++) {
    for (let min of [0, 30]) {
      if (hour === 18 && min === 30) break;
      const h = hour.toString().padStart(2, "0");
      const m = min.toString().padStart(2, "0");
      timeSlots.push(`${h}:${m}`);
    }
  }

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back */}
        <Link
          href={`/clients/${id}`}
          className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to {client.name}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white mb-2">Schedule Meeting</h1>
          <p className="text-sm text-white/40">Create a calendar event with {client.name}</p>
        </div>

        {/* Calendar Connection Warning */}
        {!calendarConnected && (
          <div className="mb-6 rounded-2xl border border-amber-500/15 bg-amber-500/[0.03] p-5">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-400 mb-1">Google Calendar Not Connected</p>
                <p className="text-xs text-white/60 mb-3">
                  Connect your Google Calendar to sync meetings automatically
                </p>
                <Link
                  href="/settings/integrations"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition"
                >
                  Connect Calendar
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-white/60 mb-2">
              Meeting Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Project kickoff meeting"
              className="w-full px-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.02] text-white placeholder-white/30 outline-none focus:border-[#f5a623]/50 transition"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/60 mb-2">
                Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.02] text-white outline-none focus:border-[#f5a623]/50 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/60 mb-2">
                Time <span className="text-red-400">*</span>
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.02] text-white outline-none focus:border-[#f5a623]/50 transition"
              >
                <option value="">Select time</option>
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-bold text-white/60 mb-2">
              Duration
            </label>
            <div className="flex gap-2">
              {[30, 60, 90, 120].map((min) => (
                <button
                  key={min}
                  onClick={() => setDuration(String(min))}
                  className={`flex-1 px-4 py-2 rounded-xl border text-sm font-bold transition ${
                    duration === String(min)
                      ? "border-[#f5a623]/50 bg-[#f5a623]/10 text-[#f5a623]"
                      : "border-white/[0.07] bg-white/[0.02] text-white/60 hover:border-white/[0.14]"
                  }`}
                >
                  {min} min
                </button>
              ))}
            </div>
          </div>

          {/* Meeting Type */}
          <div>
            <label className="block text-xs font-bold text-white/60 mb-2">
              Meeting Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setMeetingType("video")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold transition ${
                  meetingType === "video"
                    ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                    : "border-white/[0.07] bg-white/[0.02] text-white/60 hover:border-white/[0.14]"
                }`}
              >
                <Video className="w-4 h-4" />
                Video Call
              </button>
              <button
                onClick={() => setMeetingType("in-person")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold transition ${
                  meetingType === "in-person"
                    ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                    : "border-white/[0.07] bg-white/[0.02] text-white/60 hover:border-white/[0.14]"
                }`}
              >
                <MapPin className="w-4 h-4" />
                In Person
              </button>
              <button
                onClick={() => setMeetingType("phone")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold transition ${
                  meetingType === "phone"
                    ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                    : "border-white/[0.07] bg-white/[0.02] text-white/60 hover:border-white/[0.14]"
                }`}
              >
                <Users className="w-4 h-4" />
                Phone
              </button>
            </div>
          </div>

          {/* Location (for in-person) */}
          {meetingType === "in-person" && (
            <div>
              <label className="block text-xs font-bold text-white/60 mb-2">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Coffee shop, Office"
                className="w-full px-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.02] text-white placeholder-white/30 outline-none focus:border-[#f5a623]/50 transition"
              />
            </div>
          )}

          {/* Attendees */}
          <div>
            <label className="block text-xs font-bold text-white/60 mb-2">
              Attendees (comma-separated emails)
            </label>
            <input
              type="text"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              placeholder="email1@example.com, email2@example.com"
              className="w-full px-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.02] text-white placeholder-white/30 outline-none focus:border-[#f5a623]/50 transition"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-white/60 mb-2">
              Meeting Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add agenda, talking points, or other notes..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.02] text-white placeholder-white/30 outline-none focus:border-[#f5a623]/50 transition resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={() => void handleSchedule()}
              disabled={scheduling || !calendarConnected || !title || !date || !time}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-white font-bold hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {scheduling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Schedule Meeting
                </>
              )}
            </button>
            <Link
              href={`/clients/${id}`}
              className="px-6 py-3 rounded-xl border border-white/[0.07] bg-white/[0.02] text-white font-bold hover:bg-white/[0.04] transition text-center"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
