"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  Search,
  Loader2,
  ArrowRight,
  TrendingUp,
  Target,
  Zap,
  BarChart2,
  Globe,
  ShoppingCart,
  Briefcase,
  MapPin,
  Package,
  Eye,
  Sparkles,
  ChevronRight,
  Clock,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MarketVertical =
  | "affiliate"
  | "dropship"
  | "local_service"
  | "saas"
  | "coaching"
  | "ecommerce"
  | "info_product";

type ExecutionTier = "core" | "elite";

interface PastRun {
  id: string;
  niche: string;
  subNiche?: string;
  vertical?: string;
  status: string;
  score?: number;
  topProductName?: string;
  estimatedEarnings?: string;
  executionTier?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VERTICALS: { id: MarketVertical; label: string; icon: React.ElementType; sub: string }[] = [
  { id: "affiliate", label: "Affiliate", icon: TrendingUp, sub: "Promote products, earn commissions" },
  { id: "dropship", label: "Dropship", icon: ShoppingCart, sub: "Sell physical products, no inventory" },
  { id: "local_service", label: "Local Service", icon: MapPin, sub: "Service businesses in your area" },
  { id: "coaching", label: "Coaching", icon: Briefcase, sub: "Sell knowledge and expertise" },
  { id: "ecommerce", label: "E-commerce", icon: Package, sub: "Build and sell your own brand" },
  { id: "info_product", label: "Info Product", icon: Globe, sub: "Digital courses, ebooks, templates" },
];

const SUGGESTED_NICHES = [
  "weight loss",
  "make money online",
  "dog training",
  "back pain relief",
  "dating advice",
  "personal finance",
  "keto diet",
  "golf improvement",
  "survival prepping",
  "manifestation",
  "crypto trading",
  "diabetes management",
];

const STAGES = [
  { key: "discovering", label: "Discovery", sub: "Scanning markets for winning products..." },
  { key: "analyzing", label: "Analysis", sub: "Deep-diving into winner funnels and strategies..." },
  { key: "synthesizing", label: "Synthesis", sub: "Building your personalized launch strategy..." },
  { key: "generating", label: "Generation", sub: "Creating hooks, ads, and email sequences..." },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MarketIntelligencePage() {
  const router = useRouter();
  const [niche, setNiche] = useState("");
  const [subNiche, setSubNiche] = useState("");
  const [vertical, setVertical] = useState<MarketVertical>("affiliate");
  const [executionTier, setExecutionTier] = useState<ExecutionTier>("elite");
  const [running, setRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [stageDetail, setStageDetail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pastRuns, setPastRuns] = useState<PastRun[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(true);

  const fetchPastRuns = useCallback(async () => {
    try {
      const res = await fetch("/api/market-intelligence");
      const data = (await res.json()) as { ok: boolean; runs?: PastRun[] };
      if (data.ok && data.runs) setPastRuns(data.runs);
    } catch { /* non-fatal */ }
    finally { setLoadingRuns(false); }
  }, []);

  useEffect(() => { fetchPastRuns(); }, [fetchPastRuns]);

  async function handleRun() {
    if (!niche.trim() || running) return;
    setRunning(true);
    setError(null);
    setCurrentStage("discovering");
    setStageDetail("Scanning markets for winning products...");

    const stageTimers = [
      setTimeout(() => { setCurrentStage("analyzing"); setStageDetail("Deep-diving into winner funnels and strategies..."); }, 8000),
      setTimeout(() => { setCurrentStage("synthesizing"); setStageDetail("Building your personalized launch strategy..."); }, 25000),
      setTimeout(() => { setCurrentStage("generating"); setStageDetail("Creating hooks, ads, and email sequences..."); }, 45000),
    ];

    try {
      const res = await fetch("/api/market-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: niche.trim(),
          subNiche: subNiche.trim() || undefined,
          vertical,
          executionTier,
          maxProducts: 5,
          includeAdIntelligence: true,
          generateAssets: true,
        }),
      });

      stageTimers.forEach(clearTimeout);

      const data = (await res.json()) as {
        ok: boolean;
        runId?: string;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Failed to run market intelligence");
      }

      setCurrentStage("complete");
      setStageDetail("Market intelligence complete!");

      if (data.runId) {
        router.push(`/market-intelligence/${data.runId}`);
      }
    } catch (err) {
      stageTimers.forEach(clearTimeout);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setCurrentStage(null);
    } finally {
      setRunning(false);
    }
  }

  function scoreColor(score: number) {
    if (score >= 75) return "text-emerald-400";
    if (score >= 50) return "text-cyan-400";
    if (score >= 30) return "text-amber-400";
    return "text-red-400";
  }

  return (
    <div className="min-h-screen bg-[#020509] text-white">
      <AppNav />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 mb-4">
            <Target className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Market Intelligence</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-emerald-300 bg-clip-text text-transparent">
              Find Winners. Study Them. Beat Them.
            </span>
          </h1>
          <p className="mt-3 text-sm text-white/40 max-w-xl mx-auto leading-relaxed">
            Enter any niche. The engine discovers top-performing products, reverse-engineers their funnels, studies their ads, and builds you a complete launch system.
          </p>
        </div>

        {/* Running state */}
        {running && (
          <div className="mb-10 rounded-[28px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.06] to-blue-600/[0.03] p-8">
            <div className="flex flex-col items-center text-center">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
              <h2 className="text-xl font-black text-white mb-2">Running Market Intelligence</h2>
              <p className="text-sm text-white/40 mb-6">This takes 60-90 seconds. Scanning markets, analyzing winners, building your strategy...</p>

              <div className="w-full max-w-md space-y-2">
                {STAGES.map((stage, i) => {
                  const stageIndex = STAGES.findIndex((s) => s.key === currentStage);
                  const isComplete = i < stageIndex;
                  const isActive = stage.key === currentStage;
                  const isWaiting = i > stageIndex;

                  return (
                    <div
                      key={stage.key}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all ${
                        isActive
                          ? "border-cyan-500/30 bg-cyan-500/10"
                          : isComplete
                            ? "border-emerald-500/20 bg-emerald-500/[0.05]"
                            : "border-white/[0.06] bg-white/[0.02]"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        isActive ? "bg-cyan-500/20" : isComplete ? "bg-emerald-500/20" : "bg-white/[0.04]"
                      }`}>
                        {isActive ? (
                          <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
                        ) : isComplete ? (
                          <Zap className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <span className="text-[9px] font-bold text-white/20">{i + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold ${isActive ? "text-cyan-300" : isComplete ? "text-emerald-300" : "text-white/25"}`}>
                          {stage.label}
                        </p>
                        <p className={`text-[10px] ${isActive ? "text-white/40" : isComplete ? "text-white/25" : "text-white/15"}`}>
                          {isActive && stageDetail ? stageDetail : stage.sub}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Input form */}
        {!running && (
          <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-6 mb-8 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

            <div className="space-y-5">
              {/* Niche input */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/30 mb-2">
                  What niche do you want to dominate?
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRun()}
                    placeholder="e.g. weight loss, make money online, dog training..."
                    className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
                  />
                  <button
                    onClick={handleRun}
                    disabled={!niche.trim()}
                    className="shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-sm font-black transition shadow-[0_0_20px_rgba(6,182,212,0.2)] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Search className="w-4 h-4" />
                    Scan Market
                  </button>
                </div>

                {/* Quick niche pills */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {SUGGESTED_NICHES.map((n) => (
                    <button
                      key={n}
                      onClick={() => setNiche(n)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        niche === n
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                          : "bg-white/[0.03] text-white/30 border border-white/[0.06] hover:text-white/50 hover:border-white/[0.12]"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-niche */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/30 mb-2">
                  Sub-niche (optional)
                </label>
                <input
                  type="text"
                  value={subNiche}
                  onChange={(e) => setSubNiche(e.target.value)}
                  placeholder="e.g. keto for women over 40, TikTok side hustles..."
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
                />
              </div>

              {/* Vertical picker */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/30 mb-3">
                  Business Model
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {VERTICALS.map((v) => {
                    const active = vertical === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setVertical(v.id)}
                        className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border text-left transition-all ${
                          active
                            ? "border-cyan-500/30 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.08)]"
                            : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                        }`}
                      >
                        <v.icon className={`w-4 h-4 shrink-0 ${active ? "text-cyan-400" : "text-white/25"}`} />
                        <div className="min-w-0">
                          <p className={`text-xs font-bold ${active ? "text-cyan-300" : "text-white/60"}`}>{v.label}</p>
                          <p className="text-[9px] text-white/25 truncate">{v.sub}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Execution tier */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.24em] text-white/30 mb-3">
                  Execution Lane
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: "core" as const, label: "Core", desc: "Fast practical analysis — finds products, builds basic strategy." },
                    { id: "elite" as const, label: "Elite", desc: "Deep market research — studies funnels, ads, customers, generates assets." },
                  ]).map((tier) => {
                    const active = executionTier === tier.id;
                    return (
                      <button
                        key={tier.id}
                        onClick={() => setExecutionTier(tier.id)}
                        className={`rounded-xl border p-4 text-left transition-all ${
                          active
                            ? "border-cyan-500/40 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.12)]"
                            : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className={`text-sm font-black ${active ? "text-cyan-300" : "text-white"}`}>{tier.label}</span>
                          <span className={`text-[10px] font-black uppercase tracking-[0.24em] ${active ? "text-cyan-300" : "text-white/20"}`}>
                            {tier.id}
                          </span>
                        </div>
                        <p className={`mt-2 text-xs leading-relaxed ${active ? "text-cyan-100/80" : "text-white/45"}`}>
                          {tier.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* What it does */}
        {!running && pastRuns.length === 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { icon: Search, label: "Find Products", sub: "Discovers winners across ClickBank, Digistore24, JVZoo" },
              { icon: Eye, label: "Study Funnels", sub: "Reverse-engineers landing pages, hooks, and conversion paths" },
              { icon: BarChart2, label: "Analyze Ads", sub: "Studies what creative and angles perform best" },
              { icon: Sparkles, label: "Generate Assets", sub: "Creates hooks, ad scripts, emails — ready to launch" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-4 h-4 text-cyan-400/60" />
                </div>
                <p className="text-xs font-bold text-white/70 mb-1">{label}</p>
                <p className="text-[10px] text-white/30 leading-relaxed">{sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Past runs */}
        {!running && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Past Research</p>
              {pastRuns.length > 0 && (
                <span className="text-[10px] text-white/20">{pastRuns.length} run{pastRuns.length !== 1 ? "s" : ""}</span>
              )}
            </div>

            {loadingRuns ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
              </div>
            ) : pastRuns.length === 0 ? (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
                <p className="text-xs text-white/25">No market research yet. Enter a niche above to start.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pastRuns.map((run) => (
                  <Link
                    key={run.id}
                    href={`/market-intelligence/${run.id}`}
                    className="flex items-center gap-4 px-5 py-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-cyan-500/20 hover:bg-cyan-500/[0.03] transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                      <Target className="w-4 h-4 text-cyan-400/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-white/70 group-hover:text-white transition truncate">{run.niche}</p>
                        {run.subNiche && <span className="text-[10px] text-white/25">/ {run.subNiche}</span>}
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${
                          run.status === "complete"
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                            : run.status === "failed"
                              ? "border-red-500/20 bg-red-500/10 text-red-400"
                              : "border-cyan-500/20 bg-cyan-500/10 text-cyan-400"
                        }`}>
                          {run.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {run.topProductName && (
                          <span className="text-[10px] text-white/30 truncate">Top: {run.topProductName}</span>
                        )}
                        {run.estimatedEarnings && (
                          <span className="text-[10px] text-emerald-400/60">{run.estimatedEarnings}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {run.score != null && (
                        <span className={`text-lg font-black ${scoreColor(run.score)}`}>{run.score}</span>
                      )}
                      <div className="flex items-center gap-1 text-[10px] text-white/20">
                        <Clock className="w-3 h-3" />
                        {new Date(run.createdAt).toLocaleDateString()}
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-cyan-400 transition" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
