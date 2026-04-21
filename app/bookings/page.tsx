"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  CalendarDays, Check, Clock, Copy, ExternalLink, Loader2,
  Phone, Mail, ChevronLeft, ChevronRight, Settings, X,
} from "lucide-react";

type TimeSlot = { date: string; startTime: string; endTime: string; available: boolean };
type Booking = {
  id: string; date: string; startTime: string; endTime: string;
  clientName: string; clientEmail: string; clientPhone?: string;
  notes?: string; status: "confirmed" | "cancelled" | "completed"; createdAt: string;
};
type Config = { workDays: number[]; startHour: number; endHour: number; slotDuration: number; timezone: string; blockedDates: string[] };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DEFAULT_CONFIG: Config = { workDays: [1, 2, 3, 4, 5], startHour: 9, endHour: 17, slotDuration: 30, timezone: "America/New_York", blockedDates: [] };

function formatDate(d: string) { return new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }); }
function isSameMonth(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth(); }

export default function BookingsPage() {
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    Promise.allSettled([
      fetch("/api/bookings").then(r => r.json()),
    ]).then(([res]) => {
      if (res.status === "fulfilled" && res.value.ok) {
        setUserId(res.value.userId ?? null);
        setSlots(res.value.slots ?? []);
        setBookings(res.value.bookings ?? []);
      }
    }).finally(() => setLoading(false));
  }, []);

  const publicUrl = userId ? `${typeof window !== "undefined" ? window.location.origin : ""}/book/${userId}` : "";

  // Calendar data
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const calDays = useMemo(() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (string | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      days.push(date.toISOString().split("T")[0]);
    }
    return days;
  }, [calMonth]);

  // Slots and bookings per date
  const slotsByDate = useMemo(() => {
    const m = new Map<string, TimeSlot[]>();
    for (const s of slots) { m.set(s.date, [...(m.get(s.date) ?? []), s]); }
    return m;
  }, [slots]);

  const bookingsByDate = useMemo(() => {
    const m = new Map<string, Booking[]>();
    for (const b of bookings) { m.set(b.date, [...(m.get(b.date) ?? []), b]); }
    return m;
  }, [bookings]);

  const selectedSlots = selectedDate ? (slotsByDate.get(selectedDate) ?? []) : [];
  const selectedBookings = selectedDate ? (bookingsByDate.get(selectedDate) ?? []) : [];

  async function saveConfig() {
    setSaving(true);
    try {
      await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      // Reload slots
      const res = await fetch("/api/bookings").then(r => r.json());
      if (res.ok) { setSlots(res.slots ?? []); setBookings(res.bookings ?? []); }
    } catch { /* ignore */ }
    setSaving(false);
    setShowSettings(false);
  }

  function toggleWorkDay(day: number) {
    setConfig(prev => ({
      ...prev,
      workDays: prev.workDays.includes(day) ? prev.workDays.filter(d => d !== day) : [...prev.workDays, day].sort(),
    }));
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-t-bg text-t-text">
        <AppNav />
        <div className="flex items-center justify-center min-h-[70vh]">
          <Loader2 className="w-6 h-6 text-[#f5a623] animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-t-bg text-t-text">
      <AppNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">

        {/* Header */}
        <div className="pt-6 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black">Booking Calendar</h1>
            <p className="text-xs text-t-text-faint">Manage your availability and view appointments.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-t-border text-xs font-bold text-t-text-muted hover:text-t-text transition">
              <Settings className="w-3 h-3" /> Settings
            </button>
            {publicUrl && (
              <button onClick={() => { navigator.clipboard.writeText(publicUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f5a623]/10 border border-[#f5a623]/20 text-xs font-bold text-[#f5a623] hover:bg-[#f5a623]/20 transition">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? "Copied" : "Copy Booking Link"}
              </button>
            )}
            {publicUrl && (
              <a href={publicUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-t-border text-xs font-bold text-t-text-muted hover:text-t-text transition">
                <ExternalLink className="w-3 h-3" /> Preview
              </a>
            )}
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="rounded-xl border border-[#f5a623]/15 bg-[#f5a623]/[0.03] p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-black">Availability Settings</p>
              <button onClick={() => setShowSettings(false)} className="text-t-text-faint hover:text-t-text transition"><X className="w-4 h-4" /></button>
            </div>

            {/* Work days */}
            <div className="mb-4">
              <p className="text-[10px] font-black text-t-text-faint tracking-widest mb-2">WORK DAYS</p>
              <div className="flex gap-1.5">
                {DAYS.map((d, i) => (
                  <button key={d} onClick={() => toggleWorkDay(i)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition ${
                      config.workDays.includes(i) ? "bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20" : "border border-t-border text-t-text-faint hover:text-t-text-muted"
                    }`}>{d}</button>
                ))}
              </div>
            </div>

            {/* Hours + duration */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <p className="text-[10px] font-black text-t-text-faint tracking-widest mb-1">START HOUR</p>
                <select value={config.startHour} onChange={e => setConfig(p => ({ ...p, startHour: +e.target.value }))}
                  className="w-full rounded-lg border border-t-border bg-t-bg-card px-3 py-2 text-xs outline-none">
                  {Array.from({ length: 14 }, (_, i) => i + 6).map(h => <option key={h} value={h}>{h}:00</option>)}
                </select>
              </div>
              <div>
                <p className="text-[10px] font-black text-t-text-faint tracking-widest mb-1">END HOUR</p>
                <select value={config.endHour} onChange={e => setConfig(p => ({ ...p, endHour: +e.target.value }))}
                  className="w-full rounded-lg border border-t-border bg-t-bg-card px-3 py-2 text-xs outline-none">
                  {Array.from({ length: 14 }, (_, i) => i + 10).map(h => <option key={h} value={h}>{h}:00</option>)}
                </select>
              </div>
              <div>
                <p className="text-[10px] font-black text-t-text-faint tracking-widest mb-1">SLOT LENGTH</p>
                <select value={config.slotDuration} onChange={e => setConfig(p => ({ ...p, slotDuration: +e.target.value }))}
                  className="w-full rounded-lg border border-t-border bg-t-bg-card px-3 py-2 text-xs outline-none">
                  {[15, 30, 45, 60, 90].map(m => <option key={m} value={m}>{m} min</option>)}
                </select>
              </div>
            </div>

            <button onClick={() => void saveConfig()} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#f5a623] text-sm font-bold text-[#0c0a08] hover:opacity-90 transition disabled:opacity-50">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save Settings
            </button>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Upcoming", val: bookings.length, color: "text-[#f5a623]" },
            { label: "Open Days", val: new Set(slots.filter(s => s.available).map(s => s.date)).size, color: "text-emerald-400" },
            { label: "Total Slots", val: slots.filter(s => s.available).length, color: "text-blue-400" },
            { label: "Booked", val: bookings.filter(b => b.status === "confirmed").length, color: "text-[#e07850]" },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-t-bg-card border border-t-border p-4 text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
              <p className="text-[9px] text-t-text-faint mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* ═══ CALENDAR ═══ */}
          <div className="rounded-2xl border border-t-border bg-t-bg-raised p-5">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}
                className="p-2 rounded-lg hover:bg-t-bg-card transition"><ChevronLeft className="w-4 h-4 text-t-text-faint" /></button>
              <h2 className="text-sm font-black">
                {calMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </h2>
              <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}
                className="p-2 rounded-lg hover:bg-t-bg-card transition"><ChevronRight className="w-4 h-4 text-t-text-faint" /></button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAYS.map(d => <div key={d} className="text-center text-[9px] font-black text-t-text-faint tracking-widest py-1">{d}</div>)}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calDays.map((date, i) => {
                if (!date) return <div key={`e-${i}`} />;
                const daySlots = slotsByDate.get(date) ?? [];
                const dayBookings = bookingsByDate.get(date) ?? [];
                const hasAvailable = daySlots.some(s => s.available);
                const hasBookings = dayBookings.length > 0;
                const isPast = date < todayStr;
                const isSelected = date === selectedDate;
                const isToday = date === todayStr;
                const dayNum = parseInt(date.split("-")[2]);

                return (
                  <button key={date} onClick={() => setSelectedDate(isSelected ? null : date)} disabled={isPast}
                    className={`relative rounded-xl p-2 min-h-[56px] text-left transition ${
                      isSelected ? "bg-[#f5a623]/10 border-2 border-[#f5a623]/30" :
                      isPast ? "opacity-30 cursor-not-allowed" :
                      hasBookings ? "bg-emerald-500/[0.06] border border-emerald-500/15 hover:border-emerald-500/30" :
                      hasAvailable ? "border border-t-border hover:border-[#f5a623]/20 hover:bg-[#f5a623]/[0.03]" :
                      "border border-t-border/50 opacity-50"
                    }`}>
                    <span className={`text-xs font-bold ${isToday ? "text-[#f5a623]" : isSelected ? "text-[#f5a623]" : ""}`}>{dayNum}</span>
                    <div className="flex gap-0.5 mt-1">
                      {hasBookings && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                      {hasAvailable && !hasBookings && <div className="w-1.5 h-1.5 rounded-full bg-[#f5a623]/50" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-t-border">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-[9px] text-t-text-faint">Booked</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#f5a623]/50" /><span className="text-[9px] text-t-text-faint">Available</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-t-text-faint/20" /><span className="text-[9px] text-t-text-faint">No slots</span></div>
            </div>
          </div>

          {/* ═══ SIDE PANEL — Selected Day / Upcoming ═══ */}
          <div className="space-y-4">
            {/* Selected day detail */}
            {selectedDate ? (
              <div className="rounded-2xl border border-t-border bg-t-bg-raised p-5">
                <p className="text-[10px] font-black text-t-text-faint tracking-widest mb-1">{formatDate(selectedDate).toUpperCase()}</p>

                {/* Bookings for this day */}
                {selectedBookings.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[9px] font-black text-emerald-400 tracking-widest mb-2">BOOKED</p>
                    {selectedBookings.map(b => (
                      <div key={b.id} className="rounded-lg bg-emerald-500/[0.06] border border-emerald-500/15 p-3 mb-2">
                        <p className="text-sm font-bold">{b.clientName}</p>
                        <p className="text-[10px] text-t-text-faint mt-0.5">{b.startTime} – {b.endTime}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <a href={`mailto:${b.clientEmail}`} className="text-[9px] text-blue-400 hover:text-blue-300 transition flex items-center gap-1"><Mail className="w-3 h-3" /> {b.clientEmail}</a>
                          {b.clientPhone && <a href={`tel:${b.clientPhone}`} className="text-[9px] text-t-text-faint hover:text-t-text-muted flex items-center gap-1"><Phone className="w-3 h-3" /> {b.clientPhone}</a>}
                        </div>
                        {b.notes && <p className="text-[10px] text-t-text-faint mt-2 italic">{b.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Available slots */}
                {selectedSlots.filter(s => s.available).length > 0 ? (
                  <div>
                    <p className="text-[9px] font-black text-[#f5a623] tracking-widest mb-2">OPEN SLOTS</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {selectedSlots.filter(s => s.available).map(s => (
                        <div key={s.startTime} className="rounded-lg border border-t-border bg-t-bg-card px-3 py-2 text-center">
                          <p className="text-xs font-bold">{s.startTime}</p>
                          <p className="text-[8px] text-t-text-faint">{s.endTime}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-t-text-faint">No available slots on this day.</p>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-t-border bg-t-bg-raised p-5 text-center">
                <CalendarDays className="w-6 h-6 text-t-text-faint mx-auto mb-2" />
                <p className="text-xs text-t-text-muted">Click a day to see slots and bookings.</p>
              </div>
            )}

            {/* Upcoming appointments */}
            <div className="rounded-2xl border border-t-border bg-t-bg-raised p-5">
              <p className="text-[10px] font-black text-t-text-faint tracking-widest mb-3">UPCOMING</p>
              {bookings.length === 0 ? (
                <div className="text-center py-4">
                  <Clock className="w-5 h-5 text-t-text-faint mx-auto mb-2" />
                  <p className="text-xs text-t-text-muted">No upcoming bookings.</p>
                  <p className="text-[10px] text-t-text-faint mt-1">Share your booking link to start filling the calendar.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bookings.slice(0, 5).map(b => (
                    <div key={b.id} className="rounded-lg border border-t-border bg-t-bg-card p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold">{b.clientName}</p>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                          b.status === "confirmed" ? "bg-emerald-500/10 text-emerald-400" : "bg-t-bg-card text-t-text-faint"
                        }`}>{b.status}</span>
                      </div>
                      <p className="text-[10px] text-t-text-faint mt-0.5">{formatDate(b.date)} · {b.startTime}–{b.endTime}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
