"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import WorkflowHeader from "@/components/navigation/WorkflowHeader";
import WorkflowPanel from "@/components/navigation/WorkflowPanel";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  DollarSign,
  Loader2,
  RefreshCw,
  Target,
  Trophy,
  TrendingUp,
} from "lucide-react";

type PlatformCampaign = {
  id: string;
  name: string;
  status: "active" | "paused" | "completed" | "unknown";
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cpc: number;
  roas: number;
  cpa: number;
};

type PlatformMetrics = {
  platform: "meta" | "google" | "tiktok";
  campaigns: PlatformCampaign[];
  totals: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    ctr: number;
    roas: number;
  };
  lastSynced: string;
};

type BudgetPlan = {
  totalBudget: number;
  expectedROAS: number;
  strategy: string;
  allocations: {
    platform: string;
    currentSpend: number;
    suggestedSpend: number;
    change: number;
    changePercent: number;
    reason: string;
    roas: number;
    confidence: "high" | "medium" | "low";
  }[];
};

type AdsResponse = {
  ok: boolean;
  platforms?: PlatformMetrics[];
  budgetPlan?: BudgetPlan;
  connected?: { meta: boolean; google: boolean; tiktok: boolean };
};

type OptimizationAction = {
  type: string;
  reason: string;
  suggestedChange: string;
  expectedImpact: string;
  priority: "critical" | "high" | "medium" | "low";
};

type OptimizeResponse = {
  ok: boolean;
  report?: {
    issuesFound: number;
    actionsProposed: OptimizationAction[];
  };
};

type Leak = {
  location: string;
  stage: string;
  leakRate: number;
  estimatedLoss: number;
  fix: string;
  priority: "critical" | "high" | "medium";
};

type LeakResponse = {
  ok: boolean;
  report?: {
    totalMonthlyLoss: number;
    funnelHealth: "healthy" | "leaking" | "broken";
    leaks: Leak[];
  };
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default function AdsPage() {
  const [budget, setBudget] = useState("1000");
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState<AdsResponse | null>(null);
  const [optimizer, setOptimizer] = useState<OptimizeResponse | null>(null);
  const [leaks, setLeaks] = useState<LeakResponse | null>(null);

  async function loadAll(currentBudget: string) {
    setLoading(true);
    try {
      const [adsRes, optRes, leakRes] = await Promise.all([
        fetch(`/api/ads/metrics?budget=${encodeURIComponent(currentBudget)}`).then((r) => r.json() as Promise<AdsResponse>),
        fetch("/api/intelligence/optimize").then((r) => r.json() as Promise<OptimizeResponse>),
        fetch("/api/intelligence/leaks").then((r) => r.json() as Promise<LeakResponse>),
      ]);
      setAds(adsRes);
      setOptimizer(optRes);
      setLeaks(leakRes);
    } catch {
      setAds(null);
      setOptimizer(null);
      setLeaks(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll(budget);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totals = useMemo(() => {
    const platforms = ads?.platforms ?? [];
    return platforms.reduce(
      (acc, platform) => {
        acc.spend += platform.totals.spend;
        acc.revenue += platform.totals.revenue;
        acc.conversions += platform.totals.conversions;
        return acc;
      },
      { spend: 0, revenue: 0, conversions: 0 }
    );
  }, [ads]);

  const topPlatform = useMemo(() => {
    return [...(ads?.platforms ?? [])].sort((a, b) => b.totals.roas - a.totals.roas)[0] ?? null;
  }, [ads]);

  const topCampaigns = useMemo(() => {
    return (ads?.platforms ?? [])
      .flatMap((platform) =>
        platform.campaigns.map((campaign) => ({
          ...campaign,
          platform: platform.platform,
        }))
      )
      .sort((a, b) => {
        if (b.roas !== a.roas) return b.roas - a.roas;
        return b.revenue - a.revenue;
      })
      .slice(0, 5);
  }, [ads]);

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6 rounded-3xl border border-white/[0.06] bg-gradient-to-br from-cyan-500/[0.07] via-white/[0.02] to-purple-500/[0.04] p-5 sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <WorkflowHeader
              title="Ad Manager"
              description="Unified spend, ROAS, optimizer actions, and funnel leak visibility across Meta, Google, and TikTok."
              icon={TrendingUp}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-cyan-500/40 focus:outline-none"
                placeholder="Monthly budget"
              />
              <button
                onClick={() => void loadAll(budget)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2.5 text-sm font-bold text-cyan-300 transition hover:bg-cyan-500/20"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/25">Best Current Channel</p>
              <p className="mt-2 text-lg font-black capitalize text-white">{topPlatform?.platform ?? "No data yet"}</p>
              <p className="mt-1 text-xs text-white/35">
                {topPlatform ? `${topPlatform.totals.roas.toFixed(1)}x ROAS from ${topPlatform.campaigns.length} tracked campaign${topPlatform.campaigns.length === 1 ? "" : "s"}.` : "Connect ad accounts to see where your spend is actually working."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/25">Budget Mode</p>
              <p className="mt-2 text-lg font-black text-white">{money(Number(budget || 0))}</p>
              <p className="mt-1 text-xs text-white/35">Current planning budget used for allocation and ROAS guidance.</p>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/25">Connection Readiness</p>
              <p className="mt-2 text-lg font-black text-white">
                {Object.values(ads?.connected ?? {}).filter(Boolean).length}/3 connected
              </p>
              <p className="mt-1 text-xs text-white/35">Meta, Google, and TikTok are staged here as one operating surface.</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent py-20">
            <Loader2 className="h-6 w-6 animate-spin text-white/20" />
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Spend</p>
                <p className="mt-2 text-2xl font-black text-white">{money(totals.spend)}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Revenue</p>
                <p className="mt-2 text-2xl font-black text-white">{money(totals.revenue)}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">ROAS</p>
                <p className="mt-2 text-2xl font-black text-cyan-300">{ads?.budgetPlan?.expectedROAS?.toFixed(1) ?? "0.0"}x</p>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Conversions</p>
                <p className="mt-2 text-2xl font-black text-white">{totals.conversions}</p>
              </div>
            </div>

            <div className="mb-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <WorkflowPanel
                eyebrow="Platform Status"
                title="Connected accounts and current performance"
                description="This is your cross-platform control room. See what is connected, what is spending, and where the strongest ROAS is showing up."
                className="rounded-3xl border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 text-xs text-white/30">
                    <Target className="h-3.5 w-3.5 text-cyan-300" />
                    Unified platform view
                  </div>
                  <Link href="/settings" className="inline-flex items-center gap-1 text-xs text-cyan-400/60 transition hover:text-cyan-400">
                    Manage Connections
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="space-y-3">
                  {(["meta", "google", "tiktok"] as const).map((platform) => {
                    const data = ads?.platforms?.find((item) => item.platform === platform);
                    const connected = ads?.connected?.[platform] ?? false;
                    return (
                      <div key={platform} className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                        <div className="flex flex-col gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-black capitalize text-white">{platform}</p>
                              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${connected ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-white/[0.08] bg-white/[0.04] text-white/35"}`}>
                                {connected ? "Connected" : "Not Connected"}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-white/30">
                              {data ? `${data.campaigns.length} campaign${data.campaigns.length === 1 ? "" : "s"} tracked` : "No live campaign data yet"}
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-2 sm:px-3">
                              <p className="text-[10px] text-white/20">Spend</p>
                              <p className="text-xs font-black text-white">{money(data?.totals.spend ?? 0)}</p>
                            </div>
                            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-2 sm:px-3">
                              <p className="text-[10px] text-white/20">ROAS</p>
                              <p className="text-xs font-black text-cyan-300">{(data?.totals.roas ?? 0).toFixed(1)}x</p>
                            </div>
                            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-2 sm:px-3">
                              <p className="text-[10px] text-white/20">Conv.</p>
                              <p className="text-xs font-black text-white">{data?.totals.conversions ?? 0}</p>
                            </div>
                          </div>

                          <p className="text-[11px] leading-5 text-white/35">
                            {connected
                              ? `Current operator read: ${data?.totals.roas ? `${data.totals.roas.toFixed(1)}x ROAS with ${data.totals.clicks} clicks.` : "connected but still light on performance data."}`
                              : "Connect this platform to turn it from a placeholder card into a live decision surface."}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </WorkflowPanel>

              <div className="space-y-6">
                <WorkflowPanel
                  eyebrow="Budget Plan"
                  title="AI allocation guidance"
                  description="Budget suggestions stay visible even when your live spend is still thin, so the operator can decide where to push next."
                  className="rounded-3xl border-cyan-500/15 bg-gradient-to-br from-cyan-500/[0.08] via-transparent to-purple-500/[0.05]"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-cyan-300" />
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100/70">Recommended Allocation</p>
                  </div>
                  <p className="text-sm leading-6 text-white/65">{ads?.budgetPlan?.strategy ?? "Connect ad platforms to get allocation guidance."}</p>
                  <div className="mt-4 space-y-2">
                    {(ads?.budgetPlan?.allocations ?? []).slice(0, 3).map((allocation) => (
                      <div key={allocation.platform} className="rounded-2xl border border-white/[0.07] bg-black/20 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-bold capitalize text-white">{allocation.platform}</p>
                          <p className={`text-xs font-black ${allocation.change >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                            {allocation.change >= 0 ? "+" : ""}{money(allocation.change)}
                          </p>
                        </div>
                        <p className="mt-1 text-[11px] text-white/35">{allocation.reason}</p>
                      </div>
                    ))}
                  </div>
                </WorkflowPanel>

                <WorkflowPanel
                  eyebrow="Revenue Leaks"
                  title="Where the funnel is losing money"
                  description="This is the operator view of what to fix first, expressed in lost revenue instead of vague conversion anxiety."
                  className="rounded-3xl border-amber-500/15 bg-gradient-to-br from-amber-500/[0.08] via-transparent to-red-500/[0.04]"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-300" />
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-100/70">Leak Summary</p>
                  </div>
                  <p className="text-2xl font-black text-white">{money(leaks?.report?.totalMonthlyLoss ?? 0)}</p>
                  <p className="mt-1 text-xs text-white/35">Estimated monthly revenue currently leaking from the funnel.</p>
                  <div className="mt-4 space-y-2">
                    {(leaks?.report?.leaks ?? []).slice(0, 3).map((leak) => (
                      <div key={`${leak.location}-${leak.stage}`} className="rounded-2xl border border-white/[0.07] bg-black/20 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-bold text-white">{leak.location}</p>
                          <p className="text-xs font-black text-amber-300">{money(leak.estimatedLoss)}</p>
                        </div>
                        <p className="mt-1 text-[11px] text-white/35">{leak.fix}</p>
                      </div>
                    ))}
                  </div>
                </WorkflowPanel>
              </div>
            </div>

            <WorkflowPanel
              eyebrow="Campaign Spotlight"
              title="What is actually winning right now"
              description="This keeps the page grounded in campaigns instead of staying purely abstract at the platform level."
              className="mb-6 rounded-3xl border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent"
            >
              {topCampaigns.length === 0 ? (
                <p className="text-sm text-white/35">No campaign-level data yet. Once live pulls are available, your strongest campaigns will surface here automatically.</p>
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {topCampaigns.map((campaign, index) => (
                    <div key={`${campaign.platform}-${campaign.id}`} className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {index === 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
                                <Trophy className="h-3 w-3" />
                                Leader
                              </span>
                            )}
                            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                              {campaign.platform}
                            </span>
                          </div>
                          <p className="mt-2 truncate text-sm font-black text-white">{campaign.name}</p>
                          <p className="mt-1 text-xs text-white/30 capitalize">{campaign.status}</p>
                        </div>
                        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-right">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200/60">ROAS</p>
                          <p className="text-sm font-black text-cyan-300">{campaign.roas.toFixed(1)}x</p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-2">
                          <p className="text-[10px] text-white/20">Spend</p>
                          <p className="mt-1 text-xs font-black text-white">{money(campaign.spend)}</p>
                        </div>
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-2">
                          <p className="text-[10px] text-white/20">Rev.</p>
                          <p className="mt-1 text-xs font-black text-white">{money(campaign.revenue)}</p>
                        </div>
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-2">
                          <p className="text-[10px] text-white/20">CTR</p>
                          <p className="mt-1 text-xs font-black text-white">{campaign.ctr.toFixed(1)}%</p>
                        </div>
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-2">
                          <p className="text-[10px] text-white/20">Conv.</p>
                          <p className="mt-1 text-xs font-black text-white">{campaign.conversions}</p>
                        </div>
                      </div>

                      <div className="mt-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/20">Operator Take</p>
                        <p className="mt-1 text-[11px] leading-5 text-white/40">
                          {campaign.roas >= 3
                            ? "This is a scale candidate. Keep the winning angle intact and consider moving more budget here."
                            : campaign.roas >= 1
                              ? "This is viable but not dominant yet. Monitor creative fatigue and landing page quality before scaling."
                              : "This is under pressure. Compare hook, audience, and landing-page alignment before feeding it more spend."}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </WorkflowPanel>

            <WorkflowPanel
              eyebrow="Autonomous Optimizer"
              title="Recommended fixes from the intelligence layer"
              description="These actions turn raw performance signals into operator-ready next steps, so the page feels like a business cockpit instead of a pile of charts."
              className="rounded-3xl border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent"
            >
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-white/50" />
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/20">Action Queue</p>
              </div>
              {(optimizer?.report?.actionsProposed ?? []).length === 0 ? (
                <p className="text-sm text-white/35">No optimization actions yet. More live data will unlock recommendations.</p>
              ) : (
                <div className="space-y-3">
                  {(optimizer?.report?.actionsProposed ?? []).slice(0, 6).map((action, index) => (
                    <div key={`${action.type}-${index}`} className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                              action.priority === "critical" ? "border-red-500/20 bg-red-500/10 text-red-300" :
                              action.priority === "high" ? "border-amber-500/20 bg-amber-500/10 text-amber-300" :
                              "border-white/[0.08] bg-white/[0.04] text-white/35"
                            }`}>
                              {action.priority}
                            </span>
                            <p className="text-sm font-bold text-white capitalize">{action.type.replace(/_/g, " ")}</p>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-white/55">{action.reason}</p>
                          <p className="mt-2 text-xs text-cyan-200/70">{action.suggestedChange}</p>
                        </div>
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-white/40 sm:max-w-[220px]">
                          {action.expectedImpact}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </WorkflowPanel>
          </>
        )}
      </main>
    </div>
  );
}
