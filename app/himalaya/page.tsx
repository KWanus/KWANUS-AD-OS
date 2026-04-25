"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, Mountain, ArrowRight, ChevronRight, Settings2,
  Globe, Mail, TrendingUp, Zap, CheckCircle2, Clock,
  Target, DollarSign, Users, Sparkles, BarChart3, MessageSquare,
  Calendar, FileText, Rocket, Brain
} from "lucide-react";
import AppNav from "@/components/AppNav";
import { track } from "@/lib/himalaya/tracking";

// ── What Himalaya Does For You ──────────────────────────────────────────────

const FEATURES_WE_BUILD = [
  {
    icon: Globe,
    title: "High-Converting Website",
    description: "Landing pages, sales pages, checkout — built and deployed instantly",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: Mail,
    title: "Email Sequences",
    description: "Welcome series, nurture campaigns, sales emails — written and automated",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: TrendingUp,
    title: "Ad Campaigns",
    description: "Facebook, Google, Instagram ads — copy written, creatives designed",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Users,
    title: "Lead Generation",
    description: "Scrape leads, score prospects, send outreach — 100% automated",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: BarChart3,
    title: "Revenue Tracking",
    description: "Analytics dashboard shows exactly where money comes from",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: MessageSquare,
    title: "Client CRM",
    description: "Track every lead, automate follow-ups, never miss a sale",
    color: "from-indigo-500 to-purple-500",
  },
  {
    icon: Calendar,
    title: "Meeting Scheduler",
    description: "Auto-sync calendar, send invites, track client meetings",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: DollarSign,
    title: "Payment Collection",
    description: "Stripe invoices, payment links, subscriptions — all set up",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: FileText,
    title: "Weekly Playbook",
    description: "Daily tasks for 6 weeks — we tell you exactly what to do",
    color: "from-fuchsia-500 to-pink-500",
  },
];

const AUTOMATION_STAGES = [
  { label: "Analyzing your niche", duration: 5 },
  { label: "Choosing business model", duration: 3 },
  { label: "Generating website", duration: 8 },
  { label: "Writing ad copy", duration: 6 },
  { label: "Building email sequences", duration: 7 },
  { label: "Creating lead funnel", duration: 5 },
  { label: "Setting up CRM", duration: 4 },
  { label: "Configuring analytics", duration: 3 },
  { label: "Deploying everything", duration: 4 },
];

// ── Entry States ──────────────────────────────────────────────────────────────

const ENTRY_OPTIONS = [
  {
    id: "no_business",
    emoji: "🚀",
    label: "I don't have a business yet",
    sub: "We'll pick your path, build everything, and tell you exactly what to do",
  },
  {
    id: "has_business",
    emoji: "🔧",
    label: "I have a business",
    sub: "Paste your URL or tell us your niche — we'll find the gaps and fix them",
  },
  {
    id: "want_to_scale",
    emoji: "📈",
    label: "I want to scale",
    sub: "Already making money — we'll find what's leaking and multiply what's working",
  },
] as const;

type EntryState = typeof ENTRY_OPTIONS[number]["id"];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function HimalayaPage() {
  const router = useRouter();

  const [phase, setPhase] = useState<"intro" | "entry" | "context" | "building">("intro");
  const [entry, setEntry] = useState<EntryState | null>(null);
  const [context, setContext] = useState("");
  const [revenue, setRevenue] = useState("");
  const [building, setBuilding] = useState(false);
  const [buildStage, setBuildStage] = useState(0);
  const [hasHistory, setHasHistory] = useState(false);

  // Pick up goal from homepage
  useEffect(() => {
    track.pageView("/himalaya");

    try {
      const goal = sessionStorage.getItem("himalaya_goal");
      if (goal) {
        sessionStorage.removeItem("himalaya_goal");
        setContext(goal);
        // Auto-detect entry type
        if (/scale|grow|increase|expand|\$\d+k.*to/i.test(goal)) {
          setEntry("want_to_scale");
        } else if (/clone|competitor|https?:\/\//i.test(goal)) {
          setEntry("has_business");
        } else {
          setEntry("no_business");
        }
        setPhase("context");
      }
    } catch { /* ignore */ }

    // URL params
    const params = new URLSearchParams(window.location.search);
    const target = params.get("target");
    if (target) {
      setContext(`I want to make $${Number(target).toLocaleString()}/month`);
      setEntry("no_business");
      setPhase("context");
    }

    // Check history
    fetch("/api/analyses?limit=1")
      .then(r => r.json() as Promise<{ ok: boolean; analyses?: unknown[] }>)
      .then(d => { if (d.ok && d.analyses?.length) setHasHistory(true); })
      .catch(() => {});
  }, []);

  // ── Launch the system ─────────────────────────────────────────────────────
  async function launch() {
    if (!entry) return;
    setBuilding(true);
    setPhase("building");
    setBuildStage(0);

    // Simulate progress through stages
    const totalDuration = AUTOMATION_STAGES.reduce((sum, s) => sum + s.duration, 0);
    let elapsed = 0;

    const progressInterval = setInterval(() => {
      elapsed += 0.1;
      const cumulativeTime = AUTOMATION_STAGES.reduce((sum, s, idx) => {
        if (idx < buildStage) return sum + s.duration;
        return sum;
      }, 0);

      // Safety check: ensure buildStage is within bounds
      if (buildStage < AUTOMATION_STAGES.length) {
        if (elapsed >= cumulativeTime + AUTOMATION_STAGES[buildStage].duration) {
          if (buildStage < AUTOMATION_STAGES.length - 1) {
            setBuildStage(prev => prev + 1);
          }
        }
      }
    }, 100);

    try {
      let niche = context.trim();

      if (entry === "no_business" && !niche) {
        niche = "Start a profitable online business from scratch";
      } else if (entry === "want_to_scale" && revenue) {
        niche = `${niche || "my business"}. Currently at ${revenue}/month, want to scale`;
      }

      const isUrl = /^https?:\/\/.+\..+/.test(niche);

      const res = await fetch("/api/himalaya/express", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche,
          ...(isUrl ? { url: niche } : {}),
          entryType: entry,
          revenue: revenue || undefined,
        }),
      });

      const data = await res.json() as {
        ok: boolean; runId?: string; error?: string;
        deployed?: { site?: { url: string } | null };
        postDeploy?: { siteUrl?: string; adCreatives?: number };
        buildScore?: number;
        readyToLaunch?: boolean;
        path?: string;
        niche?: string;
        steps?: { step: string; ok: boolean }[];
      };

      clearInterval(progressInterval);

      if (data.ok && data.runId) {
        setBuildStage(AUTOMATION_STAGES.length - 1);
        setTimeout(() => router.push(`/built/${data.runId}`), 1500);
      } else {
        alert(data.error ?? "Something went wrong. Try again.");
        setBuilding(false);
        setPhase("context");
      }
    } catch {
      clearInterval(progressInterval);
      alert("Connection error. Try again.");
      setBuilding(false);
      setPhase("context");
    }
  }

  // ── Building State ─────────────────────────────────────────────────────────
  if (phase === "building") {
    const progress = ((buildStage + 1) / AUTOMATION_STAGES.length) * 100;
    const currentStage = AUTOMATION_STAGES[Math.min(buildStage, AUTOMATION_STAGES.length - 1)];

    return (
      <main className="min-h-screen bg-gradient-to-br from-[#0c0a08] via-[#0c0a08] to-violet-950/20 text-white">
        <AppNav />
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 px-4">

          {/* Animated Logo */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#f5a623] to-violet-500 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-[#f5a623] via-orange-500 to-violet-500 flex items-center justify-center shadow-[0_0_80px_rgba(245,166,35,0.4)]">
              <Mountain className="w-12 h-12 text-white animate-pulse" />
            </div>
          </div>

          {/* Current Stage */}
          <div className="text-center max-w-md space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-xs font-bold text-white/60">BUILDING YOUR BUSINESS</span>
            </div>

            <h2 className="text-2xl font-black text-white">
              {currentStage.label}
            </h2>

            <p className="text-sm text-white/40">
              Himalaya is building your entire business infrastructure. This takes about 60 seconds.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md space-y-3">
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#f5a623] via-orange-500 to-violet-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            {/* Stage Indicators */}
            <div className="flex justify-between">
              {AUTOMATION_STAGES.map((stage, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    idx <= buildStage
                      ? "bg-emerald-400 scale-125"
                      : "bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Completed Stages */}
          <div className="w-full max-w-md space-y-1.5">
            {AUTOMATION_STAGES.slice(0, buildStage + 1).map((stage, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-xs text-white/60 animate-in fade-in slide-in-from-left-4 duration-300"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>{stage.label}</span>
              </div>
            ))}
          </div>

          <Loader2 className="w-5 h-5 text-white/20 animate-spin mt-6" />
        </div>
      </main>
    );
  }

  // ── Intro Screen: What Himalaya Does ───────────────────────────────────────
  if (phase === "intro") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#0c0a08] via-[#0c0a08] to-violet-950/10 text-white">
        <AppNav />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">

          {/* Hero */}
          <div className="pt-20 pb-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 mb-6">
              <Sparkles className="w-3 h-3 text-violet-400" />
              <span className="text-xs font-bold text-violet-300">COMPLETE DONE-FOR-YOU BUSINESS</span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-black text-white mb-4 leading-tight">
              We Build Everything.<br />
              <span className="bg-gradient-to-r from-[#f5a623] via-orange-500 to-violet-500 bg-clip-text text-transparent">
                You Just Launch.
              </span>
            </h1>

            <p className="text-lg text-white/50 max-w-2xl mx-auto mb-8">
              Tell us your goal. In 60 seconds, you get a complete business: website, ads, emails,
              CRM, analytics, payment collection, and a 6-week playbook telling you exactly what to do every day.
            </p>

            <button
              onClick={() => setPhase("entry")}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#f5a623] to-orange-500 text-white font-bold text-lg shadow-[0_10px_40px_rgba(245,166,35,0.3)] hover:shadow-[0_15px_60px_rgba(245,166,35,0.5)] hover:scale-105 transition-all"
            >
              <Rocket className="w-5 h-5" />
              Start Building My Business
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* What We Build */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-2">What Himalaya Builds For You</h2>
              <p className="text-sm text-white/40">Everything you need to run a profitable business — no code, no design, no writing</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES_WE_BUILD.map((feature, idx) => (
                <div
                  key={idx}
                  className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 hover:bg-white/[0.05] hover:border-white/20 transition-all"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} bg-opacity-10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-white/50">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-2">How It Works</h2>
              <p className="text-sm text-white/40">Three simple steps to a complete business</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                {
                  step: "1",
                  icon: MessageSquare,
                  title: "Tell Us Your Goal",
                  description: "Just one sentence: 'I want to make $10k/month' or 'I sell coaching' or even 'pick for me'",
                },
                {
                  step: "2",
                  icon: Brain,
                  title: "We Build Everything",
                  description: "In 60 seconds: website, ads, emails, CRM, analytics, playbook — all done automatically",
                },
                {
                  step: "3",
                  icon: Rocket,
                  title: "You Launch & Follow",
                  description: "We give you daily tasks: 'Post this', 'Send 50 emails', 'Run this ad' — just execute",
                },
              ].map((item, idx) => (
                <div key={idx} className="relative">
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent p-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f5a623] to-violet-500 flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 border border-white/20 mb-3">
                      <span className="text-sm font-black text-white">{item.step}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-white/50">{item.description}</p>
                  </div>
                  {idx < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                      <ChevronRight className="w-6 h-6 text-white/20" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <button
              onClick={() => setPhase("entry")}
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black text-xl shadow-[0_20px_60px_rgba(139,92,246,0.4)] hover:shadow-[0_25px_80px_rgba(139,92,246,0.6)] hover:scale-105 transition-all"
            >
              <Zap className="w-6 h-6" />
              Build My Business Now
              <ArrowRight className="w-6 h-6" />
            </button>
            <p className="text-xs text-white/30 mt-4">Takes 60 seconds • No credit card • Complete business</p>
          </div>
        </div>
      </main>
    );
  }

  // ── Entry Selection ─────────────────────────────────────────────────────────
  if (phase === "entry") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#0c0a08] via-[#0c0a08] to-violet-950/10 text-white">
        <AppNav />

        <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-20">

          {/* Header */}
          <div className="pt-16 pb-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f5a623] to-violet-500 flex items-center justify-center mx-auto mb-6 shadow-[0_0_60px_rgba(245,166,35,0.3)]">
              <Mountain className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white mb-3">Where are you right now?</h1>
            <p className="text-sm text-white/40">Pick one. Himalaya handles the rest.</p>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {ENTRY_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => { setEntry(opt.id); setPhase("context"); }}
                className="w-full group text-left rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-5 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{opt.emoji}</div>
                    <div>
                      <p className="text-lg font-bold text-white group-hover:text-violet-300 transition mb-1">
                        {opt.label}
                      </p>
                      <p className="text-sm text-white/40">{opt.sub}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-violet-400 group-hover:translate-x-1 transition" />
                </div>
              </button>
            ))}
          </div>

          {/* Past Results */}
          {hasHistory && (
            <div className="text-center">
              <Link
                href="/himalaya/runs"
                className="text-sm text-white/30 hover:text-white/60 transition"
              >
                View past results →
              </Link>
            </div>
          )}

          {/* Back to Intro */}
          <div className="text-center mt-8">
            <button
              onClick={() => setPhase("intro")}
              className="text-xs text-white/20 hover:text-white/40 transition"
            >
              ← Back to overview
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Context Input ───────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0c0a08] via-[#0c0a08] to-violet-950/10 text-white">
      <AppNav />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-20">

        {/* Header */}
        <div className="pt-16 pb-8 text-center">
          <h1 className="text-3xl font-black text-white mb-3">
            {entry === "no_business" ? "What do you want to build?" :
             entry === "want_to_scale" ? "What are you scaling?" :
             "Tell us about your business"}
          </h1>
          <p className="text-sm text-white/40">
            Be specific or vague — we'll figure it out
          </p>
        </div>

        <div className="space-y-5">

          {/* Main Input */}
          <div>
            <input
              type="text"
              value={context}
              onChange={e => setContext(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") void launch(); }}
              autoFocus
              placeholder={
                entry === "no_business" ? "e.g. I want to make $10k/month, or: affiliate marketing" :
                entry === "has_business" ? "Paste your website URL or describe your business" :
                "What's your business? e.g. coaching, agency, ecommerce"
              }
              className="w-full rounded-2xl border border-white/20 bg-white/5 backdrop-blur-xl px-6 py-4 text-base text-white placeholder-white/30 outline-none focus:border-violet-500/50 focus:bg-white/10 transition"
            />
          </div>

          {/* Revenue Input for Scale Mode */}
          {entry === "want_to_scale" && (
            <div>
              <p className="text-xs font-bold text-white/40 mb-2">Current monthly revenue</p>
              <div className="flex gap-2">
                {["$1-5k", "$5-10k", "$10-25k", "$25-50k", "$50k+"].map(r => (
                  <button
                    key={r}
                    onClick={() => setRevenue(r)}
                    className={`flex-1 py-3 rounded-xl border font-bold text-sm transition ${
                      revenue === r
                        ? "border-violet-500 bg-violet-500/20 text-violet-300"
                        : "border-white/10 bg-white/5 text-white/40 hover:text-white/60 hover:border-white/20"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Suggestions */}
          {entry === "no_business" && !context && (
            <div className="flex flex-wrap gap-2">
              {["Affiliate marketing", "Start a coaching business", "Dropshipping", "Digital products", "Marketing agency", "Freelance services"].map(s => (
                <button
                  key={s}
                  onClick={() => setContext(s)}
                  className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white/40 hover:text-white/70 hover:border-white/20 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Launch Button */}
          <button
            onClick={() => void launch()}
            disabled={building}
            className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#f5a623] to-violet-500 py-4 text-base font-bold text-white shadow-[0_10px_40px_rgba(245,166,35,0.3)] hover:shadow-[0_15px_60px_rgba(245,166,35,0.5)] hover:scale-[1.02] transition-all disabled:opacity-40 disabled:scale-100"
          >
            <Zap className="w-5 h-5" />
            {entry === "no_business" ? "Build My Business" :
             entry === "want_to_scale" ? "Find My Growth Levers" :
             "Analyze & Improve"}
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Skip Option */}
          {entry === "no_business" && (
            <button
              onClick={() => { setContext(""); void launch(); }}
              className="w-full text-center text-sm text-white/30 hover:text-white/60 transition py-2"
            >
              Skip — let Himalaya pick everything for me
            </button>
          )}

          {/* Back Button */}
          <button
            onClick={() => { setPhase("entry"); setEntry(null); setContext(""); setRevenue(""); }}
            className="w-full text-center text-xs text-white/20 hover:text-white/40 transition"
          >
            ← Change selection
          </button>
        </div>

        {/* What Happens Next */}
        <div className="mt-10 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-violet-400" />
            <p className="text-xs font-bold text-white/50">WHAT HAPPENS IN THE NEXT 60 SECONDS</p>
          </div>

          <div className="space-y-3">
            {[
              "AI analyzes your market and picks the best business model",
              "Generates a high-converting website with checkout",
              "Writes proven ad copy for Facebook, Google, Instagram",
              "Creates email sequences (welcome, nurture, sales)",
              "Builds your CRM with lead scoring and automation",
              "Sets up revenue tracking and analytics dashboard",
              "Configures payment collection (Stripe invoices)",
              "Generates 6-week playbook with daily tasks",
              "Deploys everything — you get a live business instantly",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-black text-white">{i + 1}</span>
                </div>
                <p className="text-sm text-white/60">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white/50">ZERO CODING REQUIRED</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white/50">COMPLETE BUSINESS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Mode */}
        <div className="mt-6 text-center">
          <Link
            href="/himalaya/scratch"
            className="inline-flex items-center gap-1.5 text-xs text-white/20 hover:text-white/40 transition"
          >
            <Settings2 className="w-3 h-3" />
            Advanced: Full control over every setting
          </Link>
        </div>
      </div>
    </main>
  );
}
