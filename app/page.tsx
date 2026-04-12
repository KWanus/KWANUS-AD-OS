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
  CheckCircle2,
  BarChart2,
  Target,
  Send,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface ActiveMission {
  id: string;
  goal: string;
  targetRevenue: number;
  path: string;
  progress: number; // 0-100
  nextStep: { title: string; href: string; cta: string };
  deployed: { sites: number; campaigns: number; emails: number; leads: number };
  status: "planning" | "deploying" | "running" | "optimizing";
}

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

// ── Intent options — what the user wants ─────────────────────────────────────

const INTENTS = [
  {
    id: "make-money",
    label: "I want to make money online",
    sub: "Pick a goal — we build everything",
    icon: DollarSign,
    color: "from-emerald-500 to-cyan-500",
    glow: "shadow-[0_0_40px_rgba(16,185,129,0.2)]",
    href: "/himalaya",
  },
  {
    id: "scale",
    label: "Scale my existing business",
    sub: "Tell us your revenue — we find the gaps",
    icon: TrendingUp,
    color: "from-cyan-500 to-blue-500",
    glow: "shadow-[0_0_40px_rgba(6,182,212,0.2)]",
    href: "/himalaya",
  },
  {
    id: "clone",
    label: "Clone a competitor's business",
    sub: "Paste a URL — we reverse-engineer & improve",
    icon: Copy,
    color: "from-violet-500 to-purple-500",
    glow: "shadow-[0_0_40px_rgba(139,92,246,0.2)]",
    href: "/himalaya",
  },
  {
    id: "clients",
    label: "Get more clients",
    sub: "Ads, funnels, follow-up — all automated",
    icon: Users,
    color: "from-blue-500 to-indigo-500",
    glow: "shadow-[0_0_40px_rgba(59,130,246,0.2)]",
    href: "/himalaya",
  },
] as const;

// ── Quick revenue targets for "make money" intent ────────────────────────────

const REVENUE_TARGETS = [
  { label: "$1K/mo", value: 1000, sub: "Side income" },
  { label: "$5K/mo", value: 5000, sub: "Replace a job" },
  { label: "$10K/mo", value: 10000, sub: "Full-time income" },
  { label: "$25K/mo", value: 25000, sub: "Real business" },
  { label: "$50K/mo", value: 50000, sub: "Scale mode" },
  { label: "$100K/mo", value: 100000, sub: "Empire" },
];

// ── The homepage ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState<LiveStats | null>(null);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [freeformGoal, setFreeformGoal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

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
        setHasOnboarded(s?.onboardingCompleted ?? null);
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
          activeFlows: (s.activeCampaigns as number) ?? 0, // no separate activeFlows field
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

  // Submit freeform goal to orchestrator
  async function handleFreeformSubmit() {
    if (!freeformGoal.trim()) return;
    setSubmitting(true);
    // Store the goal and route to Himalaya with it
    try {
      sessionStorage.setItem("himalaya_goal", freeformGoal.trim());
    } catch { /* ignore */ }
    router.push("/himalaya");
  }

  if (!isLoaded || !isSignedIn) return null;

  const firstName = user?.firstName ?? user?.username ?? "there";
  const hasActivity = stats && (stats.campaigns > 0 || stats.sites > 0 || stats.leads > 0 || stats.emailFlows > 0);

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

        {/* ── HERO: The only question that matters ── */}
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

        {/* ── FREEFORM INPUT: Type anything ── */}
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
                  onKeyDown={(e) => { if (e.key === "Enter") handleFreeformSubmit(); }}
                  placeholder="&quot;I want to make $10k/month with affiliate marketing&quot;"
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
                />
                <button
                  onClick={handleFreeformSubmit}
                  disabled={!freeformGoal.trim() || submitting}
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-xs font-bold text-white disabled:opacity-30 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
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

        {/* ── INTENT CARDS: If they don't want to type ── */}
        <section className="mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {INTENTS.map((intent) => (
              <Link
                key={intent.id}
                href={intent.href}
                className={`group relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition-all hover:border-white/[0.15] hover:bg-white/[0.04] ${intent.glow.replace("shadow", "hover:shadow")}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${intent.color} flex items-center justify-center shadow-lg`}>
                    <intent.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-100 transition">{intent.label}</h3>
                    <p className="text-xs text-white/30 mt-0.5">{intent.sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-white/40 transition shrink-0 mt-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── QUICK REVENUE PICKER: Most common intent ── */}
        {!hasActivity && (
          <section className="mb-10">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/20 mb-3 text-center">
              Or pick a revenue target — we build the whole business
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-w-2xl mx-auto">
              {REVENUE_TARGETS.map((target) => (
                <Link
                  key={target.value}
                  href={`/himalaya?target=${target.value}`}
                  className="group rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-center transition hover:border-emerald-500/25 hover:bg-emerald-500/[0.04]"
                >
                  <p className="text-lg font-black text-emerald-400 group-hover:text-emerald-300 transition">{target.label}</p>
                  <p className="text-[10px] text-white/25">{target.sub}</p>
                </Link>
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

        {/* ── QUICK ACTIONS: For returning users — more things to do ── */}
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

        {/* ── POWER SHORTCUTS: 6 core areas, always visible ── */}
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

        {/* ── BOTTOM CTA: Himalaya always accessible ── */}
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
