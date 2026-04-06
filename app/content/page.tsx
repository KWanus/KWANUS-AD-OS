"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import {
  Calendar, Loader2, Copy, Check, Instagram, Music, Twitter,
  Linkedin, Facebook, RefreshCw,
} from "lucide-react";

type CalendarEntry = {
  day: string;
  platform: string;
  type: string;
  topic: string;
  content: string;
  bestTime: string;
  hashtags: string;
};

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: Instagram,
  tiktok: Music,
  twitter: Twitter,
  linkedin: Linkedin,
  facebook: Facebook,
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  tiktok: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  twitter: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  linkedin: "text-blue-300 bg-blue-400/10 border-blue-400/20",
  facebook: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
};

export default function ContentCalendarPage() {
  const [calendar, setCalendar] = useState<CalendarEntry[]>([]);
  const [generating, setGenerating] = useState(false);
  const [niche, setNiche] = useState("");
  const [copiedDay, setCopiedDay] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  async function generateCalendar() {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/content-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: niche || undefined,
          platforms: ["instagram", "tiktok", "twitter", "linkedin"],
        }),
      });
      const data = await res.json() as { ok: boolean; calendar?: CalendarEntry[] };
      if (data.ok && data.calendar) {
        setCalendar(data.calendar);
        setGenerated(true);
      }
    } catch {
      // Silent
    } finally {
      setGenerating(false);
    }
  }

  function copyContent(day: string, content: string) {
    navigator.clipboard.writeText(content);
    setCopiedDay(day);
    setTimeout(() => setCopiedDay(null), 2000);
  }

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Content Calendar</h1>
            <p className="text-sm text-white/35 mt-1">7 days of ready-to-post social media content</p>
          </div>
          {generated && (
            <button
              onClick={generateCalendar}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-bold text-white/40 hover:text-white/70 transition disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
              Regenerate
            </button>
          )}
        </div>

        {!generated ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center mb-6">
              <Calendar className="w-9 h-9 text-cyan-400/70" />
            </div>
            <h2 className="text-xl font-black text-white mb-2">Generate Your Content Calendar</h2>
            <p className="text-sm text-white/40 max-w-sm mb-8 leading-relaxed">
              AI creates 7 days of ready-to-post content across Instagram, TikTok, Twitter/X, and LinkedIn.
              Each post is unique, platform-optimized, and built from your niche.
            </p>
            <div className="w-full max-w-sm mb-4">
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="Your niche (optional — e.g. fitness coaching)"
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
              />
            </div>
            <button
              onClick={generateCalendar}
              disabled={generating}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-40"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating 7 days...</>
              ) : (
                <><Calendar className="w-4 h-4" /> Generate Calendar</>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {calendar.map((entry, i) => {
              const Icon = PLATFORM_ICONS[entry.platform.toLowerCase()] ?? Calendar;
              const colorClass = PLATFORM_COLORS[entry.platform.toLowerCase()] ?? "text-white/40 bg-white/5 border-white/10";
              const isCopied = copiedDay === entry.day;

              return (
                <div key={i} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                  {/* Header */}
                  <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-white">{entry.day}</span>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${colorClass}`}>
                        <Icon className="w-3 h-3" />
                        {entry.platform}
                      </span>
                      <span className="text-[10px] text-white/25 border border-white/10 px-2 py-0.5 rounded">{entry.type}</span>
                      {entry.bestTime && (
                        <span className="text-[10px] text-white/20">{entry.bestTime}</span>
                      )}
                    </div>
                    <button
                      onClick={() => copyContent(entry.day, entry.content + (entry.hashtags ? "\n\n" + entry.hashtags : ""))}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-bold hover:bg-cyan-500/20 transition"
                    >
                      {isCopied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {entry.topic && (
                      <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">{entry.topic}</p>
                    )}
                    <pre className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap font-sans">
                      {entry.content}
                    </pre>
                    {entry.hashtags && (
                      <p className="text-xs text-cyan-400/40 mt-3">{entry.hashtags}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
