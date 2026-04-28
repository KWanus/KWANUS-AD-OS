"use client";

import { useState } from "react";
import SimplifiedNav from "@/components/SimplifiedNav";
import {
  Loader2, Copy, Check, Instagram, Music, Twitter, Linkedin, Facebook,
  Send, Clock,
} from "lucide-react";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-400" },
  { id: "tiktok", label: "TikTok", icon: Music, color: "text-[#f5a623]" },
  { id: "twitter", label: "Twitter/X", icon: Twitter, color: "text-blue-400" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-300" },
  { id: "facebook", label: "Facebook", icon: Facebook, color: "text-indigo-400" },
];

const CONTENT_TYPES = [
  { id: "post", label: "Post" },
  { id: "caption", label: "Caption" },
  { id: "thread", label: "Thread" },
  { id: "story", label: "Story" },
  { id: "carousel", label: "Carousel" },
];

export default function SocialContentPage() {
  const [platform, setPlatform] = useState("instagram");
  const [contentType, setContentType] = useState("post");
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [scheduleStatus, setScheduleStatus] = useState<string | null>(null);

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, contentType, topic: topic || undefined }),
      });
      const data = await res.json() as { ok: boolean; content?: string };
      if (data.ok && data.content) setResult(data.content);
    } catch {
      // Silent
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <SimplifiedNav />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-black text-white tracking-tight mb-2">Social Content</h1>
        <p className="text-sm text-white/35 mb-8">Generate ready-to-post content for any platform</p>

        <div className="space-y-5">
          {/* Platform picker */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Platform</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border ${
                      platform === p.id
                        ? "border-[#f5a623]/40 bg-[#f5a623]/10 text-[#f5a623]"
                        : "border-white/10 bg-white/[0.03] text-white/40 hover:border-white/20"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content type */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Format</p>
            <div className="flex flex-wrap gap-2">
              {CONTENT_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setContentType(t.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition border ${
                    contentType === t.id
                      ? "border-[#f5a623]/40 bg-[#f5a623]/10 text-[#f5a623]"
                      : "border-white/10 bg-white/[0.03] text-white/40 hover:border-white/20"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Topic (optional)</p>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. 3 mistakes beginners make in fitness coaching"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 transition"
            />
          </div>

          {/* Generate */}
          <button
            onClick={generate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-40"
          >
            {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : "Generate Content"}
          </button>

          {/* Result */}
          {result && (
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <p className="text-xs font-bold text-white/60">
                  {PLATFORMS.find((p) => p.id === platform)?.label} {contentType}
                </p>
                <button
                  onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f5a623]/10 border border-[#f5a623]/20 text-[#f5a623] text-[10px] font-bold hover:bg-[#f5a623]/20 transition"
                >
                  {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                </button>
              </div>
              <div className="p-5">
                <pre className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap font-sans">{result}</pre>
              </div>
            </div>
          )}

          {/* Schedule Post */}
          {result && (
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Schedule Post</p>

              {/* Platform checkboxes */}
              <div>
                <p className="text-[10px] font-bold text-white/40 mb-2">Post to</p>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => {
                    const Icon = p.icon;
                    const selected = selectedPlatforms.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() =>
                          setSelectedPlatforms((prev) =>
                            selected ? prev.filter((x) => x !== p.id) : [...prev, p.id]
                          )
                        }
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border ${
                          selected
                            ? "border-[#f5a623]/40 bg-[#f5a623]/10 text-[#f5a623]"
                            : "border-white/10 bg-white/[0.03] text-white/40 hover:border-white/20"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date/time picker */}
              <div>
                <p className="text-[10px] font-bold text-white/40 mb-2">Schedule for (optional)</p>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f5a623]/50 transition"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  disabled={selectedPlatforms.length === 0 || scheduling}
                  onClick={async () => {
                    setScheduling(true);
                    setScheduleStatus(null);
                    try {
                      const res = await fetch("/api/himalaya/tools", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          tool: "social_post",
                          params: { platforms: selectedPlatforms, content: result, scheduledAt: null },
                        }),
                      });
                      const data = await res.json();
                      setScheduleStatus(data.ok ? "Posted!" : "Failed to post");
                    } catch {
                      setScheduleStatus("Failed to post");
                    } finally {
                      setScheduling(false);
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-sm font-bold text-white hover:opacity-90 transition disabled:opacity-40"
                >
                  {scheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Post Now
                </button>
                <button
                  disabled={selectedPlatforms.length === 0 || !scheduleDate || scheduling}
                  onClick={async () => {
                    setScheduling(true);
                    setScheduleStatus(null);
                    try {
                      const res = await fetch("/api/himalaya/tools", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          tool: "social_post",
                          params: { platforms: selectedPlatforms, content: result, scheduledAt: scheduleDate },
                        }),
                      });
                      const data = await res.json();
                      setScheduleStatus(data.ok ? `Scheduled for ${new Date(scheduleDate).toLocaleString()}` : "Failed to schedule");
                    } catch {
                      setScheduleStatus("Failed to schedule");
                    } finally {
                      setScheduling(false);
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-sm font-bold text-white/60 hover:text-white hover:border-white/20 transition disabled:opacity-40"
                >
                  <Clock className="w-4 h-4" />
                  Schedule
                </button>
              </div>

              {/* Status message */}
              {scheduleStatus && (
                <p className={`text-xs font-bold ${scheduleStatus.startsWith("Failed") ? "text-red-400" : "text-emerald-400"}`}>
                  {scheduleStatus}
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
