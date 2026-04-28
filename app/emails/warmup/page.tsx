"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import SimplifiedNav from "@/components/SimplifiedNav";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Heart,
  Mail,
  TrendingUp,
  Users,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HealthData {
  healthScore?: number;
  bounceRate?: number;
  activeContacts?: number;
  engagementRate?: number;
  error?: string;
}

interface WarmupProgress {
  day1: boolean;
  day3: boolean;
  day5: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreColor(score: number) {
  if (score > 80) return "text-green-400";
  if (score > 50) return "text-yellow-400";
  return "text-red-400";
}

function scoreBg(score: number) {
  if (score > 80) return "bg-green-500/10 border-green-500/20";
  if (score > 50) return "bg-yellow-500/10 border-yellow-500/20";
  return "bg-red-500/10 border-red-500/20";
}

const WARMUP_KEY = "himalaya_email_warmup_progress";

function loadProgress(): WarmupProgress {
  if (typeof window === "undefined") return { day1: false, day3: false, day5: false };
  try {
    const raw = localStorage.getItem(WARMUP_KEY);
    if (raw) return JSON.parse(raw) as WarmupProgress;
  } catch {}
  return { day1: false, day3: false, day5: false };
}

function saveProgress(p: WarmupProgress) {
  try {
    localStorage.setItem(WARMUP_KEY, JSON.stringify(p));
  } catch {}
}

// ---------------------------------------------------------------------------
// Tips
// ---------------------------------------------------------------------------

const TIPS = [
  "Start with your most engaged contacts (people who've opened before)",
  "Avoid purchased email lists \u2014 they destroy deliverability",
  "Keep unsubscribe links in every email (Himalaya does this automatically)",
  "Monitor your bounce rate \u2014 anything above 5% is a red flag",
  "Use a custom domain (not gmail.com) for professional sending",
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EmailWarmupPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<WarmupProgress>({ day1: false, day3: false, day5: false });

  // Load localStorage progress on mount
  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/email-deliverability?action=list_health");
      const data = (await res.json()) as HealthData;
      setHealth(data);
    } catch {
      setHealth({ error: "Failed to fetch health data" });
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    void fetchHealth();
  }, [fetchHealth]);

  function toggleStep(key: keyof WarmupProgress) {
    const next = { ...progress, [key]: !progress[key] };
    setProgress(next);
    saveProgress(next);
  }

  const completedSteps = [progress.day1, progress.day3, progress.day5].filter(Boolean).length;
  const allDone = completedSteps === 3;

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <SimplifiedNav />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* Back link */}
        <Link
          href="/emails"
          className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Email Flows
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 text-[#f5a623]" />
            <h1 className="text-2xl font-black tracking-tight">Email Warmup Guide</h1>
          </div>
          <p className="text-sm text-white/40">
            Warm up your sending domain for best deliverability
          </p>
        </div>

        {/* Health Score Card */}
        <div className={`rounded-2xl border p-5 mb-6 ${health?.healthScore != null ? scoreBg(health.healthScore) : "bg-white/[0.03] border-white/[0.06]"}`}>
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/35 mb-3">
            Current Deliverability Status
          </p>

          {loading && !health ? (
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading health data...
            </div>
          ) : health?.error ? (
            <div className="flex items-center gap-2 text-yellow-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              {health.error}
            </div>
          ) : health ? (
            <>
              <div className="flex items-baseline gap-2 mb-4">
                <span className={`text-4xl font-black ${scoreColor(health.healthScore ?? 0)}`}>
                  {health.healthScore ?? 0}
                </span>
                <span className="text-sm text-white/40">/100 health score</span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3 h-3 text-white/30" />
                    <span className="text-[10px] text-white/35 uppercase tracking-wider">Bounce Rate</span>
                  </div>
                  <p className="text-lg font-bold">{health.bounceRate ?? 0}%</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Users className="w-3 h-3 text-white/30" />
                    <span className="text-[10px] text-white/35 uppercase tracking-wider">Active Contacts</span>
                  </div>
                  <p className="text-lg font-bold">{(health.activeContacts ?? 0).toLocaleString()}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="w-3 h-3 text-white/30" />
                    <span className="text-[10px] text-white/35 uppercase tracking-wider">Engagement</span>
                  </div>
                  <p className="text-lg font-bold">{health.engagementRate ?? 0}%</p>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* 7-Day Warmup Checklist */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#f5a623]/70 mb-1">
                7-Day Warmup Checklist
              </p>
              <p className="text-xs text-white/35">{completedSteps}/3 steps completed</p>
            </div>
            {allDone && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[11px] font-bold">
                <CheckCircle className="w-3 h-3" />
                Warmup Complete
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-white/[0.06] mb-5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#f5a623] to-[#e07850] transition-all duration-500"
              style={{ width: `${(completedSteps / 3) * 100}%` }}
            />
          </div>

          <div className="space-y-3">
            {/* Day 1-2 */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={progress.day1}
                onChange={() => toggleStep("day1")}
                className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-[#f5a623] focus:ring-[#f5a623]/30 accent-[#f5a623]"
              />
              <div>
                <p className={`text-sm font-bold ${progress.day1 ? "text-white/40 line-through" : "text-white"}`}>
                  Day 1-2: Send 10-20 emails to engaged contacts
                </p>
                <p className="text-[11px] text-white/30 mt-0.5">
                  Start small with people who already know you
                </p>
              </div>
            </label>

            {/* Day 3-4 */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={progress.day3}
                onChange={() => toggleStep("day3")}
                className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-[#f5a623] focus:ring-[#f5a623]/30 accent-[#f5a623]"
              />
              <div>
                <p className={`text-sm font-bold ${progress.day3 ? "text-white/40 line-through" : "text-white"}`}>
                  Day 3-4: Send 50-100 emails, maintain &gt;15% open rate
                </p>
                <p className="text-[11px] text-white/30 mt-0.5">
                  Gradually increase volume while watching engagement
                </p>
              </div>
            </label>

            {/* Day 5-7 */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={progress.day5}
                onChange={() => toggleStep("day5")}
                className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-[#f5a623] focus:ring-[#f5a623]/30 accent-[#f5a623]"
              />
              <div>
                <p className={`text-sm font-bold ${progress.day5 ? "text-white/40 line-through" : "text-white"}`}>
                  Day 5-7: Send 200-500 emails, maintain &gt;10% open rate
                </p>
                <p className="text-[11px] text-white/30 mt-0.5">
                  If engagement holds, you are ready for full volume
                </p>
              </div>
            </label>

            {/* Day 7+ (always visible, not a checkbox) */}
            <div className="flex items-start gap-3 pl-7 pt-1 border-t border-white/[0.04]">
              <div>
                <p className="text-sm font-bold text-white/50">
                  Day 7+: Full volume unlocked
                </p>
                <p className="text-[11px] text-white/30 mt-0.5">
                  Monitor bounce rate weekly and keep it below 5%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/35 mb-4">
            Deliverability Tips
          </p>
          <ul className="space-y-3">
            {TIPS.map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <Heart className="w-3.5 h-3.5 text-[#f5a623]/60 mt-0.5 shrink-0" />
                <span className="text-sm text-white/60 leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded-2xl border border-[#f5a623]/20 bg-[#f5a623]/[0.06] px-5 py-3 text-sm font-bold text-[#f5a623] hover:bg-[#f5a623]/[0.12] transition"
          >
            <Mail className="w-4 h-4" />
            Configure Domain (Resend)
          </Link>

          <button
            onClick={() => void fetchHealth()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/70 hover:bg-white/[0.08] transition disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Check My Score
          </button>
        </div>
      </main>
    </div>
  );
}
