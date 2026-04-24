"use client";

import { Suspense, useEffect, useState } from "react";
import AppNav from "@/components/AppNav";
import ScanSubNav from "@/components/ScanSubNav";
import DatabaseFallbackNotice from "@/components/DatabaseFallbackNotice";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search, Loader2, Globe, Megaphone, Mail, Zap, AlertTriangle,
  CheckCircle, XCircle, ChevronRight, ArrowRight, Sparkles, Building2, ShoppingBag,
} from "lucide-react";

type ScanMode = "consultant" | "operator";
type ExecutionTier = "core" | "elite";

type ScanResult = {
  ok: boolean;
  analysis: {
    id?: string;
    inputUrl: string;
    title: string;
    score: number;
    verdict: string;
    confidence: string;
    summary: string;
    decisionPacket: {
      audience: string;
      painDesire: string;
      angle: string;
      strengths: string[];
      weaknesses: string[];
      nextActions: string[];
    };
    executionTier?: ExecutionTier;
  };
  opportunityAssessment: {
    status: string;
    totalScore: number;
    topGaps: string[];
    topStrengths: string[];
    recommendedPath: string;
  } | null;
  truthEngine?: {
    totalScore: number;
    verdict: string;
    confidence: string;
    profile: string;
    diagnostics: { severity: string; dimension: string; message: string; fix?: string }[];
    actionPlan: string[];
    breakdown?: { dimension: string; grade: string; rawScore: number }[];
  } | null;
  assetPackage: {
    adHooks: { format: string; hook: string }[];
  } | null;
  error?: string;
};

type BusinessProfileSummary = {
  businessType: string;
  businessName: string | null;
  niche: string | null;
  location: string | null;
  mainGoal: string | null;
  recommendedSystems?: {
    firstAction?: string;
    strategicSummary?: string;
  } | null;
};

type StatsSummary = {
  effectiveSystemScore?: number;
  unsyncedSystems?: string[];
  databaseUnavailable?: boolean;
  osVerdict?: {
    status?: string;
    label?: string;
    reason?: string;
  };
};

const SCORE_COLOR = (s: number) =>
  s >= 70 ? "text-emerald-400" : s >= 45 ? "text-amber-400" : "text-red-400";
const SCORE_BG = (s: number) =>
  s >= 70 ? "bg-emerald-500/10 border-emerald-500/20" : s >= 45 ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20";

function verdictTone(status?: string) {
  if (status === "healthy") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  if (status === "stale") return "border-cyan-500/20 bg-cyan-500/10 text-cyan-100";
  return "border-amber-500/20 bg-amber-500/10 text-amber-100";
}

type BuildAction = {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  skillSlug: string;
  gradient: string;
};

function getActions(mode: ScanMode, _result: ScanResult): BuildAction[] {
  if (mode === "consultant") {
    return [
      {
        icon: <Globe className="w-4 h-4" />,
        label: "Build New Landing Page",
        sublabel: "AI rebuilds their site, better",
        skillSlug: "landing-page",
        gradient: "from-purple-500/20 to-blue-500/20 border-purple-500/25",
      },
      {
        icon: <Megaphone className="w-4 h-4" />,
        label: "Generate Ad Campaign",
        sublabel: "Hooks + scripts for their product",
        skillSlug: "ad-campaign",
        gradient: "from-cyan-500/20 to-teal-500/20 border-cyan-500/25",
      },
      {
        icon: <Sparkles className="w-4 h-4" />,
        label: "Full Client Package",
        sublabel: "Site + ads + CRM client in one shot",
        skillSlug: "website-builder-scout",
        gradient: "from-amber-500/20 to-orange-500/20 border-amber-500/25",
      },
      {
        icon: <Mail className="w-4 h-4" />,
        label: "Email Sequence",
        sublabel: "Nurture sequence for their leads",
        skillSlug: "email-sequence",
        gradient: "from-blue-500/20 to-indigo-500/20 border-blue-500/25",
      },
    ];
  }

  // operator / product mode
  return [
    {
      icon: <Megaphone className="w-4 h-4" />,
      label: "Launch Ad Campaign",
      sublabel: "7 hooks + scripts for this product",
      skillSlug: "ad-campaign",
      gradient: "from-cyan-500/20 to-purple-500/20 border-cyan-500/25",
    },
    {
      icon: <Globe className="w-4 h-4" />,
      label: "Build Better Landing Page",
      sublabel: "Beat their funnel with yours",
      skillSlug: "landing-page",
      gradient: "from-purple-500/20 to-blue-500/20 border-purple-500/25",
    },
    {
      icon: <Mail className="w-4 h-4" />,
      label: "Build Email Funnel",
      sublabel: "Welcome + cart + post-purchase",
      skillSlug: "email-campaign",
      gradient: "from-blue-500/20 to-teal-500/20 border-blue-500/25",
    },
    {
      icon: <Sparkles className="w-4 h-4" />,
      label: "Full Campaign System",
      sublabel: "Ads + landing page + emails — done",
      skillSlug: "ad-campaign",
      gradient: "from-amber-500/20 to-orange-500/20 border-amber-500/25",
    },
  ];
}

function ScoreGauge({ score }: { score: number }) {
  const size = 80;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
    </svg>
  );
}

function ScanConvertButton({ label, endpoint, successMessage }: { label: string; endpoint: string; successMessage: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (done) return (
    <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
      <CheckCircle className="w-3 h-3" /> {successMessage}
    </span>
  );

  return (
    <button
      onClick={async () => {
        setLoading(true);
        setError("");
        try {
          const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
          const data = await res.json() as { ok: boolean; error?: string; duplicate?: boolean };
          if (data.ok) {
            setDone(true);
          } else {
            setError(data.duplicate ? "Already exists" : data.error ?? "Failed");
          }
        } catch { setError("Failed"); } finally { setLoading(false); }
      }}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50 text-xs font-bold hover:text-white hover:border-white/[0.15] transition disabled:opacity-40"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
      {label}
      {error && <span className="text-red-400 text-[10px] ml-1">{error}</span>}
    </button>
  );
}

function BatchScanPanel({ mode }: { mode: string }) {
  const [open, setOpen] = useState(false);
  const [urls, setUrls] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<{ url: string; ok: boolean; score?: number; verdict?: string; title?: string; error?: string }[]>([]);

  async function runBatch() {
    const urlList = urls.split("\n").map(u => u.trim()).filter(Boolean);
    if (urlList.length === 0 || urlList.length > 5) return;
    setRunning(true);
    setResults([]);
    try {
      const res = await fetch("/api/analyze/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: urlList, mode }),
      });
      const data = await res.json() as { ok: boolean; results?: typeof results };
      if (data.ok) setResults(data.results ?? []);
    } catch { /* non-fatal */ } finally { setRunning(false); }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mb-4 text-xs text-white/25 hover:text-cyan-400/60 transition">
        Scan multiple URLs at once →
      </button>
    );
  }

  return (
    <div className="mb-6 bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-white/30">Batch Scan (up to 5 URLs)</h3>
        <button onClick={() => setOpen(false)} className="text-xs text-white/25 hover:text-white/50">Close</button>
      </div>
      <textarea
        value={urls}
        onChange={e => setUrls(e.target.value)}
        placeholder={"https://example1.com\nhttps://example2.com\nhttps://example3.com"}
        rows={4}
        className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/40 transition resize-none mb-3 font-mono"
      />
      <button
        onClick={() => void runBatch()}
        disabled={running || !urls.trim()}
        className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold hover:opacity-90 disabled:opacity-30 transition"
      >
        {running ? "Scanning..." : `Scan ${urls.split("\n").filter(u => u.trim()).length} URLs`}
      </button>
      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {results.map((r, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${r.ok ? "bg-white/[0.02] border-white/[0.06]" : "bg-red-500/5 border-red-500/15"}`}>
              <span className={`text-base font-black w-8 text-center ${r.ok ? ((r.score ?? 0) >= 70 ? "text-emerald-400" : (r.score ?? 0) >= 45 ? "text-amber-400" : "text-red-400") : "text-red-400"}`}>
                {r.ok ? r.score ?? "—" : "X"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white/60 truncate">{r.title ?? r.url}</p>
                <p className="text-[10px] text-white/25 truncate">{r.url}</p>
              </div>
              {r.ok && <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded border ${r.verdict === "Pursue" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : r.verdict === "Reject" ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>{r.verdict}</span>}
              {!r.ok && <span className="text-[10px] text-red-400">{r.error}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScanPageInner() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<ScanMode>("consultant");
  const [executionTier, setExecutionTier] = useState<ExecutionTier>("elite");
  const [url, setUrl] = useState(searchParams.get("prefill") ?? "");
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileSummary | null>(null);
  const [osStats, setOsStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncingSystem, setSyncingSystem] = useState(false);
  const [refreshingRecommendations, setRefreshingRecommendations] = useState(false);

  useEffect(() => {
    const initialUrl = searchParams.get("url");
    const initialMode = searchParams.get("mode");
    const initialTier = searchParams.get("execution_tier");

    if (initialUrl) setUrl(initialUrl);
    if (initialMode === "consultant" || initialMode === "operator") setMode(initialMode);
    if (initialTier === "core" || initialTier === "elite") setExecutionTier(initialTier);
  }, [searchParams]);

  useEffect(() => {
    async function fetchContext() {
      try {
        const [profileRes, statsRes] = await Promise.all([
          fetch("/api/business-profile"),
          fetch("/api/stats"),
        ]);
        const profileData = await profileRes.json() as { ok: boolean; profile?: BusinessProfileSummary | null };
        const statsData = await statsRes.json() as { ok: boolean; stats?: StatsSummary | null };
        if (profileData.ok && profileData.profile) {
          setBusinessProfile(profileData.profile);
          if (!url && profileData.profile.businessName && profileData.profile.businessType === "local_service") {
            setMode("consultant");
          }
        }
        if (statsData.ok) setOsStats(statsData.stats ?? null);
      } catch (scanError) {
        console.error(scanError);
      }
    }

    void fetchContext();
  }, [url]);

  async function runScan() {
    const trimmed = url.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, mode, executionTier }),
      });
      const data = await res.json() as ScanResult;
      if (!data.ok) {
        setError(data.error ?? "Scan failed. Check the URL and try again.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Could not reach the analysis server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const actions = result ? getActions(mode, result) : [];
  const analysis = result?.analysis;
  const opp = result?.opportunityAssessment;

  function buildSkillUrl(slug: string): string {
    if (!analysis) return `/skills?skill=${slug}`;
    const params = new URLSearchParams({ skill: slug });
    params.set("execution_tier", analysis.executionTier ?? executionTier);
    if (slug === "ad-campaign" || slug === "email-campaign") {
      params.set("prefill_url", analysis.inputUrl);
      params.set("prefill_mode", mode);
    } else if (slug === "landing-page") {
      params.set("prefill_offer", `${analysis.title || analysis.inputUrl} — ${analysis.decisionPacket.angle}`);
      params.set("prefill_audience", analysis.decisionPacket.audience);
    } else if (slug === "website-builder-scout") {
      params.set("prefill_url", analysis.inputUrl);
    } else if (slug === "email-sequence") {
      params.set("prefill_offer", `${analysis.title || analysis.inputUrl}`);
      params.set("prefill_audience", analysis.decisionPacket.audience);
    }
    return `/skills?${params.toString()}`;
  }

  async function syncBusinessSystem() {
    try {
      setSyncingSystem(true);
      const res = await fetch("/api/business-profile/sync", { method: "POST" });
      const data = await res.json() as { ok?: boolean };
      if (!res.ok || !data.ok) throw new Error("Failed");
      const [profileRes, statsRes] = await Promise.all([
        fetch("/api/business-profile"),
        fetch("/api/stats"),
      ]);
      const profileData = await profileRes.json() as { ok: boolean; profile?: BusinessProfileSummary | null };
      const statsData = await statsRes.json() as { ok: boolean; stats?: StatsSummary | null };
      if (profileData.ok) setBusinessProfile(profileData.profile ?? null);
      if (statsData.ok) setOsStats(statsData.stats ?? null);
    } finally {
      setSyncingSystem(false);
    }
  }

  async function refreshBusinessSystem() {
    if (!businessProfile?.businessType) return;
    try {
      setRefreshingRecommendations(true);
      const res = await fetch("/api/business-profile/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType: businessProfile.businessType,
          niche: businessProfile.niche,
          goal: businessProfile.mainGoal,
        }),
      });
      const data = await res.json() as { ok?: boolean };
      if (!res.ok || !data.ok) throw new Error("Failed");
      const [profileRes, statsRes] = await Promise.all([
        fetch("/api/business-profile"),
        fetch("/api/stats"),
      ]);
      const profileData = await profileRes.json() as { ok: boolean; profile?: BusinessProfileSummary | null };
      const statsData = await statsRes.json() as { ok: boolean; stats?: StatsSummary | null };
      if (profileData.ok) setBusinessProfile(profileData.profile ?? null);
      if (statsData.ok) setOsStats(statsData.stats ?? null);
    } finally {
      setRefreshingRecommendations(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#020509] text-white">
      <AppNav />
      <ScanSubNav />

      <div className="max-w-3xl mx-auto px-4 pt-10 pb-20">
        {businessProfile && (
          <>
            <div className="mb-6 rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/35">Business OS Status</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {osStats?.osVerdict?.label && (
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${verdictTone(osStats.osVerdict.status)}`}>
                        {osStats.osVerdict.label}
                      </span>
                    )}
                    <span className="text-sm font-black text-white">{osStats?.effectiveSystemScore ?? 0}/100</span>
                    {(osStats?.unsyncedSystems?.length ?? 0) > 0 && (
                      <span className="text-xs text-amber-200/80">{osStats?.unsyncedSystems?.length} unsynced systems</span>
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/58">
                    {osStats?.osVerdict?.reason ||
                      "The scan workspace now reads the same Business OS health layer as the rest of the product."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {(osStats?.unsyncedSystems?.length ?? 0) > 0 && (
                    <button
                      onClick={() => void syncBusinessSystem()}
                      disabled={syncingSystem}
                      className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-5 py-3 text-sm font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {syncingSystem ? "Syncing..." : "Sync My System"}
                    </button>
                  )}
                  {osStats?.osVerdict?.status === "stale" && (
                    <button
                      onClick={() => void refreshBusinessSystem()}
                      disabled={refreshingRecommendations}
                      className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-5 py-3 text-sm font-bold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {refreshingRecommendations ? "Refreshing..." : "Refresh Recommendations"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <DatabaseFallbackNotice visible={osStats?.databaseUnavailable} className="mb-6" />

            <div className="mb-6 rounded-[28px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.08] to-purple-600/[0.03] p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.26em] text-cyan-200/70">Recommended Scan Move</p>
                  <h2 className="mt-2 text-2xl font-black text-white">
                    {businessProfile.businessType === "local_service" || businessProfile.businessType === "agency"
                      ? "Scan a weak site and rebuild the better version"
                      : "Scan a winning offer and turn it into your next campaign system"}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-white/62">
                    {businessProfile.recommendedSystems?.firstAction ||
                      businessProfile.recommendedSystems?.strategicSummary ||
                      "The scan engine should act like the top-of-funnel intelligence layer for whatever your Business OS says to build next."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setMode(
                      businessProfile.businessType === "local_service" || businessProfile.businessType === "agency"
                        ? "consultant"
                        : "operator"
                    )}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-black text-white shadow-[0_0_30px_rgba(6,182,212,0.22)]"
                  >
                    <Sparkles className="w-4 h-4" />
                    Set Recommended Mode
                  </button>
                  <Link
                    href="/my-system"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/70"
                  >
                    Open My System
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <Search className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-black text-white">Scan & Build</h1>
          </div>
          <p className="text-sm text-white/40 max-w-lg">
            Drop any URL. We scan it, score it, find the gaps — then build a better version for you in one click.
          </p>
        </div>

        {/* Mode selector */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => { setMode("consultant"); setResult(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${
              mode === "consultant"
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                : "border-white/[0.08] text-white/35 hover:text-white/60 hover:border-white/15"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Client / Competitor Site
          </button>
          <button
            onClick={() => { setMode("operator"); setResult(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${
              mode === "operator"
                ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                : "border-white/[0.08] text-white/35 hover:text-white/60 hover:border-white/15"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Product to Sell
          </button>
        </div>

        {/* Mode context */}
        <p className="text-xs text-white/30 mb-5 -mt-1 pl-1">
          {mode === "consultant"
            ? "Found a business with a bad site? Scan it, see exactly what's broken, and use Himalaya to build them a better one — then offer it as your service."
            : "Found a dropship product, affiliate offer, or competitor? Scan it and we'll build you a better funnel for the same market."}
        </p>

        <div className="mb-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">Execution Level</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {([
              ["core", "Core", "Strong diagnosis and launch-ready next actions."],
              ["elite", "Elite", "Sharper operator analysis, stronger positioning, better follow-through assets."],
            ] as const).map(([value, label, description]) => (
              <button
                key={value}
                type="button"
                onClick={() => setExecutionTier(value)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  executionTier === value
                    ? "border-cyan-500/25 bg-cyan-500/10 text-cyan-100"
                    : "border-white/[0.08] bg-white/[0.03] text-white/60 hover:border-cyan-500/20 hover:bg-cyan-500/[0.05]"
                }`}
              >
                <p className="text-sm font-black">{label}</p>
                <p className="mt-1 text-xs leading-5 text-inherit/75">{description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* URL input */}
        <div className="flex gap-2 mb-6">
          <div className="flex-1 relative">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void runScan()}
              placeholder={mode === "consultant" ? "https://localbusiness.com" : "https://amazon.com/dp/B0..."}
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-cyan-500/40 transition"
            />
          </div>
          <button
            onClick={() => void runScan()}
            disabled={!url.trim() || loading}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-sm font-bold shadow-[0_0_15px_rgba(6,182,212,0.15)] disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? "Scanning…" : "Scan"}
          </button>
        </div>

        {/* Batch scan */}
        {!loading && !result && (
          <BatchScanPanel mode={mode} />
        )}

        {/* Scanning animation */}
        {loading && (
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 mb-6 flex flex-col items-center gap-3 text-center">
            <div className="flex gap-1 items-center">
              {[0, 150, 300, 450, 600].map((d) => (
                <div
                  key={d}
                  className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </div>
            <p className="text-sm text-white/50">Scanning site… extracting signals, scoring opportunities</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && analysis && (
          <div className="space-y-4">

            {/* Score card */}
            <div className={`border rounded-2xl p-5 flex items-start gap-5 ${SCORE_BG(analysis.score)}`}>
              <div className="relative shrink-0">
                <ScoreGauge score={analysis.score} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-lg font-black ${SCORE_COLOR(analysis.score)}`}>{analysis.score}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-base truncate">{analysis.title || analysis.inputUrl}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <p className={`text-sm font-bold ${SCORE_COLOR(analysis.score)}`}>
                    {analysis.verdict} · {analysis.confidence} confidence
                  </p>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                      (analysis.executionTier ?? executionTier) === "elite"
                        ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-100"
                        : "border-white/[0.08] bg-white/[0.05] text-white/55"
                    }`}
                  >
                    {(analysis.executionTier ?? executionTier).toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-2 leading-relaxed">{analysis.summary}</p>
              </div>
            </div>

            {/* Two-column breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Problems */}
              <div className="bg-red-500/[0.05] border border-red-500/15 rounded-xl p-4">
                <p className="text-xs font-black text-red-400 mb-3 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" /> Top Problems
                </p>
                <ul className="space-y-1.5">
                  {(opp?.topGaps?.length ? opp.topGaps : analysis.decisionPacket.weaknesses).slice(0, 4).map((w, i) => (
                    <li key={i} className="text-xs text-white/60 flex items-start gap-1.5">
                      <span className="text-red-400/60 shrink-0 mt-0.5">•</span>
                      {w}
                    </li>
                  ))}
                  {!(opp?.topGaps?.length || analysis.decisionPacket.weaknesses.length) && (
                    <li className="text-xs text-white/30 italic">None detected</li>
                  )}
                </ul>
              </div>

              {/* Strengths */}
              <div className="bg-emerald-500/[0.05] border border-emerald-500/15 rounded-xl p-4">
                <p className="text-xs font-black text-emerald-400 mb-3 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> Strengths
                </p>
                <ul className="space-y-1.5">
                  {(opp?.topStrengths?.length ? opp.topStrengths : analysis.decisionPacket.strengths).slice(0, 4).map((s, i) => (
                    <li key={i} className="text-xs text-white/60 flex items-start gap-1.5">
                      <span className="text-emerald-400/60 shrink-0 mt-0.5">•</span>
                      {s}
                    </li>
                  ))}
                  {!(opp?.topStrengths?.length || analysis.decisionPacket.strengths.length) && (
                    <li className="text-xs text-white/30 italic">None detected</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Audience + angle */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-wider mb-1">Target Audience</p>
                <p className="text-xs text-white/70">{analysis.decisionPacket.audience || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-wider mb-1">Core Pain / Desire</p>
                <p className="text-xs text-white/70">{analysis.decisionPacket.painDesire || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-wider mb-1">Best Angle</p>
                <p className="text-xs text-white/70">{analysis.decisionPacket.angle || "—"}</p>
              </div>
            </div>

            {/* Recommended path */}
            {opp?.recommendedPath && (
              <div className="bg-cyan-500/[0.06] border border-cyan-500/20 rounded-xl p-4 flex items-start gap-3">
                <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-cyan-400 mb-0.5">Recommended Path</p>
                  <p className="text-xs text-white/60">{opp.recommendedPath}</p>
                </div>
              </div>
            )}

            {/* Truth Engine grade strip */}
            {result.truthEngine?.breakdown && result.truthEngine.breakdown.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {result.truthEngine.breakdown.map((b) => {
                  const colors: Record<string, string> = {
                    A: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
                    B: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
                    C: "bg-amber-500/15 text-amber-400 border-amber-500/25",
                    D: "bg-orange-500/15 text-orange-400 border-orange-500/25",
                    F: "bg-red-500/15 text-red-400 border-red-500/25",
                  };
                  return (
                    <div key={b.dimension} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold ${colors[b.grade] ?? colors.C}`} title={`${b.dimension}: ${b.rawScore}/100`}>
                      <span className="font-black text-xs">{b.grade}</span>
                      <span className="opacity-60">{b.dimension.replace(/([A-Z])/g, " $1").trim().split(" ")[0]}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Truth Engine diagnostics */}
            {result.truthEngine?.diagnostics && result.truthEngine.diagnostics.filter(d => d.severity === "critical" || d.severity === "warning").length > 0 && (
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
                <p className="text-xs font-black text-white/50 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Diagnostics
                </p>
                <div className="space-y-2">
                  {result.truthEngine.diagnostics
                    .filter(d => d.severity === "critical" || d.severity === "warning")
                    .slice(0, 4)
                    .map((d, i) => (
                      <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg border ${
                        d.severity === "critical" ? "bg-red-500/5 border-red-500/15" : "bg-amber-500/5 border-amber-500/15"
                      }`}>
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                          d.severity === "critical" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                        }`}>{d.severity}</span>
                        <div className="flex-1">
                          <p className="text-xs text-white/60">{d.message}</p>
                          {d.fix && <p className="text-[10px] text-white/30 mt-0.5">Fix: {d.fix}</p>}
                        </div>
                      </div>
                    ))}
                </div>
                {result.truthEngine.actionPlan.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/[0.05]">
                    <p className="text-[10px] font-black text-cyan-400/60 uppercase tracking-wider mb-1.5">Action Plan</p>
                    {result.truthEngine.actionPlan.slice(0, 3).map((a, i) => (
                      <p key={i} className="text-xs text-white/50 flex items-start gap-2 mb-1">
                        <span className="text-cyan-400 font-black">{i + 1}.</span> {a}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Build actions */}
            <div>
              <p className="text-xs font-black text-white/50 uppercase tracking-wider mb-3">
                Build it now →
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {actions.map((action) => (
                  <Link
                    key={action.skillSlug + action.label}
                    href={buildSkillUrl(action.skillSlug)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r border hover:opacity-80 transition group ${action.gradient}`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-white/[0.07] flex items-center justify-center shrink-0 text-white/60 group-hover:text-white transition">
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">{action.label}</p>
                      <p className="text-xs text-white/40">{action.sublabel}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/30 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick conversion buttons */}
            {analysis.id && (
              <div className="flex gap-2">
                <ScanConvertButton
                  label="Save as Client"
                  endpoint={`/api/analyses/${analysis.id}/create-client`}
                  successMessage="Client created from scan"
                />
                <ScanConvertButton
                  label="Create Campaign"
                  endpoint={`/api/analyses/${analysis.id}/create-campaign`}
                  successMessage="Campaign created from scan"
                />
              </div>
            )}

            {/* Actions row */}
            <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
              <div className="flex items-center gap-4">
                {analysis.id && (
                  <Link
                    href={`/analyses/${analysis.id}`}
                    className="flex items-center gap-1.5 text-xs font-bold text-purple-400/70 hover:text-purple-400 transition"
                  >
                    View Full Report <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
                <Link
                  href="/analyses"
                  className="flex items-center gap-1.5 text-xs font-semibold text-white/25 hover:text-white/50 transition"
                >
                  Scan History <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <Link
                href={`/copilot?prefill=${encodeURIComponent(`I scanned ${analysis.inputUrl} and got a score of ${analysis.score}/100 (${analysis.verdict}). What should I do next?`)}`}
                className="flex items-center gap-1.5 text-xs font-bold text-cyan-400/70 hover:text-cyan-400 transition"
              >
                Ask Himalaya Copilot <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !result && !error && (
          <div className="text-center py-16 text-white/20">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Enter a URL above to get started</p>
            <p className="text-xs mt-1 opacity-60">Works on any public website — business, product, ecommerce, landing page</p>
            <Link href="/analyses" className="inline-flex items-center gap-1.5 text-xs text-white/25 hover:text-cyan-400/60 transition mt-4">
              View past scans <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#020509] text-white">
          <AppNav />
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-white/20" />
          </div>
        </div>
      }
    >
      <ScanPageInner />
    </Suspense>
  );
}
