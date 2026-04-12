"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  ArrowRight,
  Sparkles,
  Rocket,
  DollarSign,
  TrendingUp,
  Users,
  Globe,
  Mail,
  Zap,
  Copy,
  ChevronRight,
  Loader2,
  BarChart2,
  Target,
  Send,
  Mountain,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface LiveStats {
  campaigns: number;
  activeCampaigns: number;
  sites: number;
  publishedSites: number;
  leads: number;
  emailFlows: number;
  activeFlows: number;
  clients: number;
}

interface QuickAction {
  id: string;
  priority: string;
  title: string;
  description: string;
  href: string;
  cta: string;
}

// ── Intent options — each leads to a DIFFERENT experience ────────────────────

const INTENTS = [
  {
    id: "make-money",
    label: "I want to make money online",
    sub: "Pick a goal — we build everything",
    icon: DollarSign,
    color: "from-emerald-500 to-cyan-500",
    glow: "shadow-[0_0_40px_rgba(16,185,129,0.2)]",
    action: "himalaya", // goes to Himalaya wizard
  },
  {
    id: "scale",
    label: "Scale my existing business",
    sub: "Tell us your revenue — we find the gaps",
    icon: TrendingUp,
    color: "from-cyan-500 to-blue-500",
    glow: "shadow-[0_0_40px_rgba(6,182,212,0.2)]",
    action: "scale", // goes to Himalaya with scale context
  },
  {
    id: "clone",
    label: "Clone a competitor's business",
    sub: "Paste a URL — we reverse-engineer & improve",
    icon: Copy,
    color: "from-violet-500 to-purple-500",
    glow: "shadow-[0_0_40px_rgba(139,92,246,0.2)]",
    action: "clone", // inline URL input
  },
  {
    id: "clients",
    label: "Get more clients",
    sub: "Ads, funnels, follow-up — all automated",
    icon: Users,
    color: "from-blue-500 to-indigo-500",
    glow: "shadow-[0_0_40px_rgba(59,130,246,0.2)]",
    action: "clients", // asks what kind of business
  },
] as const;

// ── Quick revenue targets ────────────────────────────────────────────────────

const REVENUE_TARGETS = [
  { label: "$1K/mo", value: 1000, sub: "Side income" },
  { label: "$5K/mo", value: 5000, sub: "Replace a job" },
  { label: "$10K/mo", value: 10000, sub: "Full-time income" },
  { label: "$25K/mo", value: 25000, sub: "Real business" },
  { label: "$50K/mo", value: 50000, sub: "Scale mode" },
  { label: "$100K/mo", value: 100000, sub: "Empire" },
];

// ── Business types for "Get more clients" ────────────────────────────────────

const CLIENT_BUSINESS_TYPES = [
  { label: "Coaching / Consulting", niche: "coaching and consulting services" },
  { label: "Local Service Business", niche: "local service business" },
  { label: "Agency", niche: "marketing agency" },
  { label: "Freelancer", niche: "freelance services" },
  { label: "Real Estate", niche: "real estate" },
  { label: "Health & Fitness", niche: "health and fitness" },
];

// ── Quiz questions for beginners ─────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  {
    question: "Do you have an existing business?",
    options: [
      { label: "Yes, I want to grow it", value: "scale" },
      { label: "No, I'm starting fresh", value: "fresh" },
    ],
  },
  {
    question: "What sounds most exciting?",
    options: [
      { label: "Sell other people's products (affiliate)", value: "affiliate" },
      { label: "Sell my own services (consulting/coaching)", value: "consulting" },
      { label: "Sell physical products online (dropship/ecom)", value: "dropship" },
      { label: "Build an agency and get clients", value: "agency" },
      { label: "Create and sell digital products", value: "digital" },
    ],
  },
  {
    question: "How much time can you put in?",
    options: [
      { label: "A few hours a week", value: "minimal" },
      { label: "Part-time (10-20 hrs/week)", value: "parttime" },
      { label: "Full-time — I'm all in", value: "fulltime" },
    ],
  },
];

const QUIZ_PATH_MAP: Record<string, string> = {
  affiliate: "affiliate marketing",
  consulting: "coaching and consulting",
  dropship: "dropshipping and ecommerce",
  agency: "marketing agency",
  digital: "digital products and courses",
};

// ── The homepage ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const cloneInputRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState<LiveStats | null>(null);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [freeformGoal, setFreeformGoal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [runningStage, setRunningStage] = useState("");

  // Intent-specific states
  const [expandedIntent, setExpandedIntent] = useState<string | null>(null);
  const [cloneUrl, setCloneUrl] = useState("");
  const [cloneRunning, setCloneRunning] = useState(false);

  // Quiz state (fix #3)
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, statsRes, quickActionsRes] = await Promise.allSettled([
        fetch("/api/settings").then((r) => r.json() as Promise<{ ok: boolean; settings?: { onboardingCompleted?: boolean; workspaceName?: string | null } }>),
        fetch("/api/stats").then((r) => r.json() as Promise<{ ok: boolean; stats?: Record<string, unknown> | null }>),
        fetch("/api/quick-actions").then((r) => r.json() as Promise<{ ok: boolean; actions?: QuickAction[] }>),
      ]);

      if (settingsRes.status === "fulfilled" && settingsRes.value.ok) {
        const s = settingsRes.value.settings;
        if (s?.onboardingCompleted === false) {
          router.replace("/setup");
          return;
        }
      }

      if (statsRes.status === "fulfilled" && statsRes.value.ok && statsRes.value.stats) {
        const s = statsRes.value.stats;
        setStats({
          campaigns: (s.campaigns as number) ?? 0,
          activeCampaigns: (s.activeCampaigns as number) ?? 0,
          sites: (s.sites as number) ?? 0,
          publishedSites: (s.publishedSites as number) ?? 0,
          leads: (s.leads as number) ?? 0,
          emailFlows: (s.emailFlows as number) ?? 0,
          activeFlows: (s.activeFlows as number) ?? 0, // now real from API
          clients: (s.clients as number) ?? 0,
        });
      }

      if (quickActionsRes.status === "fulfilled" && quickActionsRes.value.ok) {
        setQuickActions(quickActionsRes.value.actions ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (isSignedIn) void fetchData();
  }, [fetchData, isSignedIn]);

  // ── Fix #2: Submit freeform goal → run express directly, no redirect ───────
  async function handleFreeformSubmit() {
    const goal = freeformGoal.trim();
    if (!goal) return;
    setSubmitting(true);
    setRunningStage("Analyzing your goal...");

    const stages = ["Analyzing your goal...", "Picking your strategy...", "Building your assets...", "Deploying everything..."];
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      if (idx < stages.length) setRunningStage(stages[idx]);
    }, 2000);

    try {
      const isUrl = /^https?:\/\/.+\..+/.test(goal);
      const body = isUrl
        ? { niche: goal, url: goal }
        : { niche: goal };

      const res = await fetch("/api/himalaya/express", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json() as { ok: boolean; runId?: string; error?: string };
      clearInterval(interval);

      if (data.ok && data.runId) {
        setRunningStage("Done! Loading your results...");
        router.push(`/himalaya/run/${data.runId}`);
      } else {
        // Fallback: send to Himalaya with the goal pre-filled
        try { sessionStorage.setItem("himalaya_goal", goal); } catch { /* ignore */ }
        router.push("/himalaya");
      }
    } catch {
      clearInterval(interval);
      try { sessionStorage.setItem("himalaya_goal", goal); } catch { /* ignore */ }
      router.push("/himalaya");
    }
  }

  // ── Fix #1: Intent card handlers ───────────────────────────────────────────
  function handleIntentClick(action: string) {
    if (action === "himalaya") {
      router.push("/himalaya");
    } else if (action === "scale") {
      try { sessionStorage.setItem("himalaya_goal", "Scale my existing business to the next level"); } catch { /* ignore */ }
      router.push("/himalaya");
    } else if (action === "clone" || action === "clients") {
      setExpandedIntent(expandedIntent === action ? null : action);
      // Focus clone input after render
      if (action === "clone") {
        setTimeout(() => cloneInputRef.current?.focus(), 100);
      }
    }
  }

  // Clone handler — calls express with URL directly
  async function handleClone() {
    const url = cloneUrl.trim();
    if (!url) return;
    setCloneRunning(true);
    try {
      const res = await fetch("/api/himalaya/express", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: url, url }),
      });
      const data = await res.json() as { ok: boolean; runId?: string };
      if (data.ok && data.runId) {
        router.push(`/himalaya/run/${data.runId}`);
      } else {
        try { sessionStorage.setItem("himalaya_goal", `Clone and improve: ${url}`); } catch { /* ignore */ }
        router.push("/himalaya");
      }
    } catch {
      try { sessionStorage.setItem("himalaya_goal", `Clone and improve: ${url}`); } catch { /* ignore */ }
      router.push("/himalaya");
    }
  }

  // Client type handler — sends to express with niche
  function handleClientType(niche: string) {
    setSubmitting(true);
    setRunningStage("Building your client acquisition system...");

    fetch("/api/himalaya/express", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ niche: `Get more clients for ${niche}`, businessType: "Service Business" }),
    })
      .then((r) => r.json() as Promise<{ ok: boolean; runId?: string }>)
      .then((data) => {
        if (data.ok && data.runId) {
          router.push(`/himalaya/run/${data.runId}`);
        } else {
          try { sessionStorage.setItem("himalaya_goal", `Get more clients for ${niche}`); } catch { /* ignore */ }
          router.push("/himalaya");
        }
      })
      .catch(() => {
        try { sessionStorage.setItem("himalaya_goal", `Get more clients for ${niche}`); } catch { /* ignore */ }
        router.push("/himalaya");
      });
  }

  // ── Fix #3: Quiz handler ───────────────────────────────────────────────────
  function handleQuizAnswer(value: string) {
    const newAnswers = [...quizAnswers, value];
    setQuizAnswers(newAnswers);

    if (newAnswers[0] === "scale") {
      // Has existing business → go to scale flow
      try { sessionStorage.setItem("himalaya_goal", "Scale my existing business"); } catch { /* ignore */ }
      router.push("/himalaya");
      return;
    }

    if (quizStep + 1 < QUIZ_QUESTIONS.length) {
      setQuizStep(quizStep + 1);
    } else {
      // Quiz complete — build goal from answers
      const path = QUIZ_PATH_MAP[newAnswers[1]] ?? "online business";
      const time = newAnswers[2] === "fulltime" ? "full-time" : newAnswers[2] === "parttime" ? "part-time" : "a few hours a week";
      const goal = `Start a ${path} business, I can work ${time}`;

      setShowQuiz(false);
      setFreeformGoal(goal);
      // Auto-submit
      setSubmitting(true);
      setRunningStage("Building your personalized plan...");

      fetch("/api/himalaya/express", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: goal }),
      })
        .then((r) => r.json() as Promise<{ ok: boolean; runId?: string }>)
        .then((data) => {
          if (data.ok && data.runId) {
            router.push(`/himalaya/run/${data.runId}`);
          } else {
            try { sessionStorage.setItem("himalaya_goal", goal); } catch { /* ignore */ }
            router.push("/himalaya");
          }
        })
        .catch(() => {
          try { sessionStorage.setItem("himalaya_goal", goal); } catch { /* ignore */ }
          router.push("/himalaya");
        });
    }
  }

  if (!isLoaded || !isSignedIn) return null;

  const firstName = user?.firstName ?? user?.username ?? "there";
  const hasActivity = stats && (stats.campaigns > 0 || stats.sites > 0 || stats.leads > 0 || stats.emailFlows > 0);

  // ── Loading/running overlay ────────────────────────────────────────────────
  if (submitting) {
    return (
      <main className="min-h-screen bg-[#020509] text-white">
        <AppNav />
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_60px_rgba(6,182,212,0.3)] animate-pulse">
              <Mountain className="w-10 h-10 text-white" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white mb-2">{runningStage}</p>
            <p className="text-sm text-white/30">Usually takes 30-90 seconds. We're building your entire business.</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/20">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Himalaya is working...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020509] text-white">
      <AppNav />

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        <div className="absolute -top-20 left-[10%] h-[400px] w-[600px] rounded-full bg-cyan-500/[0.06] blur-[140px]" />
        <div className="absolute right-[5%] top-[20%] h-[350px] w-[450px] rounded-full bg-purple-500/[0.05] blur-[130px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-20">

        {/* ── HERO ── */}
        <section className="pt-12 pb-4 text-center">
          <p className="text-sm text-white/30 mb-2">
            Welcome back, <span className="text-white/60 font-bold">{firstName}</span>
          </p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
            What do you want to build?
          </h1>
          <p className="mt-3 text-base text-white/35 max-w-lg mx-auto">
            Tell Himalaya your goal. We handle everything — sites, ads, emails, follow-up, optimization.
          </p>
        </section>

        {/* ── FREEFORM INPUT — runs express directly (fix #2) ── */}
        {!showQuiz && (
          <section className="mb-10">
            <div className="max-w-2xl mx-auto">
              <div className="relative group">
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity blur-sm" />
                <div className="relative flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] backdrop-blur-xl px-4 py-3 group-focus-within:border-cyan-500/30 transition">
                  <Sparkles className="w-5 h-5 text-cyan-400/60 shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={freeformGoal}
                    onChange={(e) => setFreeformGoal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") void handleFreeformSubmit(); }}
                    placeholder="&quot;I want to make $10k/month with affiliate marketing&quot;"
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
                  />
                  <button
                    onClick={() => void handleFreeformSubmit()}
                    disabled={!freeformGoal.trim()}
                    className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-xs font-bold text-white disabled:opacity-30 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Go
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                {["Make $10k/month", "Get more clients", "Start dropshipping", "Scale to $50k/month", "Launch an agency"].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => { setFreeformGoal(suggestion); inputRef.current?.focus(); }}
                    className="px-3 py-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-[11px] text-white/30 hover:text-white/60 hover:border-white/[0.12] transition"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── QUIZ MODE (fix #3) ── */}
        {showQuiz && (
          <section className="mb-10">
            <div className="max-w-lg mx-auto">
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300/60">
                    Question {quizStep + 1} of {QUIZ_QUESTIONS.length}
                  </p>
                  <button
                    onClick={() => { setShowQuiz(false); setQuizStep(0); setQuizAnswers([]); }}
                    className="text-[10px] text-white/30 hover:text-white/60 transition"
                  >
                    Cancel
                  </button>
                </div>

                {/* Progress bar */}
                <div className="h-1 rounded-full bg-white/10 mb-6">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all"
                    style={{ width: `${((quizStep + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                  />
                </div>

                <h2 className="text-xl font-black text-white mb-5">{QUIZ_QUESTIONS[quizStep].question}</h2>
                <div className="space-y-2">
                  {QUIZ_QUESTIONS[quizStep].options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleQuizAnswer(opt.value)}
                      className="w-full text-left px-4 py-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] text-sm font-bold text-white/70 hover:border-cyan-500/30 hover:bg-cyan-500/[0.06] hover:text-white transition"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── INTENT CARDS — each has its own inline experience (fix #1) ── */}
        {!showQuiz && (
          <section className="mb-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INTENTS.map((intent) => (
                <div key={intent.id}>
                  <button
                    onClick={() => handleIntentClick(intent.action)}
                    className={`w-full text-left group relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition-all hover:border-white/[0.15] hover:bg-white/[0.04] ${intent.glow.replace("shadow", "hover:shadow")} ${expandedIntent === intent.action ? "border-white/[0.15] bg-white/[0.04]" : ""}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${intent.color} flex items-center justify-center shadow-lg`}>
                        <intent.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-white group-hover:text-cyan-100 transition">{intent.label}</h3>
                        <p className="text-xs text-white/30 mt-0.5">{intent.sub}</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-white/15 group-hover:text-white/40 transition shrink-0 mt-0.5 ${expandedIntent === intent.action ? "rotate-90" : ""}`} />
                    </div>
                  </button>

                  {/* Clone inline experience */}
                  {expandedIntent === "clone" && intent.action === "clone" && (
                    <div className="mt-2 rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-4 animate-in fade-in slide-in-from-top-2">
                      <p className="text-xs font-bold text-white/50 mb-3">Paste any business URL — we&apos;ll reverse-engineer it and build you a better version</p>
                      <div className="flex gap-2">
                        <input
                          ref={cloneInputRef}
                          type="url"
                          value={cloneUrl}
                          onChange={(e) => setCloneUrl(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") void handleClone(); }}
                          placeholder="https://competitor.com"
                          className="flex-1 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/30"
                        />
                        <button
                          onClick={() => void handleClone()}
                          disabled={!cloneUrl.trim() || cloneRunning}
                          className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-xs font-bold text-white disabled:opacity-30 transition"
                        >
                          {cloneRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
                          Clone It
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Get more clients inline experience */}
                  {expandedIntent === "clients" && intent.action === "clients" && (
                    <div className="mt-2 rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-4 animate-in fade-in slide-in-from-top-2">
                      <p className="text-xs font-bold text-white/50 mb-3">What kind of business are you?</p>
                      <div className="grid grid-cols-2 gap-2">
                        {CLIENT_BUSINESS_TYPES.map((biz) => (
                          <button
                            key={biz.label}
                            onClick={() => handleClientType(biz.niche)}
                            className="px-3 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] text-xs font-bold text-white/60 hover:border-blue-500/30 hover:bg-blue-500/[0.06] hover:text-white transition text-left"
                          >
                            {biz.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Not sure? Take the quiz (fix #3) */}
            {!hasActivity && (
              <div className="text-center mt-4">
                <button
                  onClick={() => { setShowQuiz(true); setQuizStep(0); setQuizAnswers([]); }}
                  className="inline-flex items-center gap-2 text-xs text-white/25 hover:text-white/50 transition"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Not sure where to start? Take the 60-second quiz
                </button>
              </div>
            )}
          </section>
        )}

        {/* ── QUICK REVENUE PICKER ── */}
        {!hasActivity && !showQuiz && (
          <section className="mb-10">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/20 mb-3 text-center">
              Or pick a revenue target — we build the whole business
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-w-2xl mx-auto">
              {REVENUE_TARGETS.map((target) => (
                <button
                  key={target.value}
                  onClick={() => {
                    setFreeformGoal(`I want to make $${target.value.toLocaleString()}/month`);
                    void (async () => {
                      setSubmitting(true);
                      setRunningStage("Building your path to " + target.label + "...");
                      try {
                        const res = await fetch("/api/himalaya/express", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ niche: `Make ${target.label} per month online` }),
                        });
                        const data = await res.json() as { ok: boolean; runId?: string };
                        if (data.ok && data.runId) {
                          router.push(`/himalaya/run/${data.runId}`);
                        } else {
                          router.push(`/himalaya?target=${target.value}`);
                        }
                      } catch {
                        router.push(`/himalaya?target=${target.value}`);
                      }
                    })();
                  }}
                  className="group rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-center transition hover:border-emerald-500/25 hover:bg-emerald-500/[0.04]"
                >
                  <p className="text-lg font-black text-emerald-400 group-hover:text-emerald-300 transition">{target.label}</p>
                  <p className="text-[10px] text-white/25">{target.sub}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── LIVE DASHBOARD: For returning users with activity ── */}
        {hasActivity && !loading && stats && (
          <section className="mb-8">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
              {/* Status bar */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06]">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-xs font-bold text-white/50">Your business is running</p>
              </div>

              {/* Live metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/[0.06]">
                <LiveMetric label="Campaigns" value={stats.campaigns} active={stats.activeCampaigns} href="/campaigns" icon={Zap} color="text-cyan-400" />
                <LiveMetric label="Sites" value={stats.sites} active={stats.publishedSites} href="/websites" icon={Globe} color="text-violet-400" />
                <LiveMetric label="Email Flows" value={stats.emailFlows} active={stats.activeFlows} href="/emails" icon={Mail} color="text-blue-400" />
                <LiveMetric label="Leads" value={stats.leads} active={null} href="/leads" icon={Users} color="text-emerald-400" />
              </div>

              {/* Next step */}
              {quickActions.length > 0 && (
                <div className="border-t border-white/[0.06] px-5 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-3">Your next step</p>
                  <Link
                    href={quickActions[0].href}
                    className="flex items-center justify-between gap-4 rounded-xl border border-cyan-500/15 bg-cyan-500/[0.04] px-4 py-3 transition hover:border-cyan-500/30 hover:bg-cyan-500/[0.08] group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white group-hover:text-cyan-100 transition">{quickActions[0].title}</p>
                      <p className="text-xs text-white/30 truncate">{quickActions[0].description}</p>
                    </div>
                    <span className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                      {quickActions[0].cta} <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── QUICK ACTIONS: More things to do ── */}
        {hasActivity && quickActions.length > 1 && !loading && (
          <section className="mb-8">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/20 mb-3">Also recommended</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {quickActions.slice(1, 5).map((action) => (
                <Link
                  key={action.id}
                  href={action.href}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition hover:border-white/[0.12] hover:bg-white/[0.04] group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white/70 group-hover:text-white transition truncate">{action.title}</p>
                    <p className="text-[10px] text-white/25 truncate">{action.description}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-white/15 group-hover:text-white/40 shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── POWER SHORTCUTS ── */}
        <section className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/20 mb-3">
            {hasActivity ? "Jump to" : "Or go directly to"}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { label: "Campaigns", href: "/campaigns", icon: Zap, color: "text-cyan-400", sub: "Hooks, ads, copy" },
              { label: "Websites", href: "/websites", icon: Globe, sub: "Funnels & landing pages", color: "text-violet-400" },
              { label: "Email Flows", href: "/emails", icon: Mail, sub: "Automations & sequences", color: "text-blue-400" },
              { label: "CRM", href: "/clients", icon: Users, sub: "Pipeline & clients", color: "text-emerald-400" },
              { label: "Analytics", href: "/analytics", icon: BarChart2, sub: "Performance & health", color: "text-amber-400" },
              { label: "Tools", href: "/tools", icon: Target, sub: "Generators & audits", color: "text-pink-400" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition hover:border-white/[0.12] hover:bg-white/[0.04] group"
              >
                <item.icon className={`w-4 h-4 ${item.color} shrink-0`} />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white/60 group-hover:text-white transition">{item.label}</p>
                  <p className="text-[10px] text-white/20">{item.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── BOTTOM CTA ── */}
        <section className="text-center pb-10">
          <Link
            href="/himalaya"
            className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-white/[0.08] px-6 py-3.5 text-sm font-bold text-white/50 hover:text-white hover:border-white/[0.15] hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all"
          >
            <Rocket className="w-4 h-4" />
            Open Himalaya Full System
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}

// ── Live Metric component ────────────────────────────────────────────────────

function LiveMetric({
  label,
  value,
  active,
  href,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  active: number | null;
  href: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Link href={href} className="px-5 py-4 hover:bg-white/[0.02] transition group">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">{label}</p>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      {active !== null && (
        <p className="text-[10px] text-white/25">{active} active</p>
      )}
    </Link>
  );
}
