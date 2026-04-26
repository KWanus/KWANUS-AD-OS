"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import OperatorCallout from "@/components/navigation/OperatorCallout";
import WorkflowHeader from "@/components/navigation/WorkflowHeader";
import OperatorStatCard from "@/components/navigation/OperatorStatCard";
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

  const connectedPlatforms = Object.values(ads?.connected ?? {}).filter(Boolean).length;
  const hasCampaignData = topCampaigns.length > 0;
  const hasPlatformData = (ads?.platforms ?? []).some((platform) => platform.campaigns.length > 0 || platform.totals.spend > 0);

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <AppNav />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6 rounded-3xl border border-white/[0.06] bg-gradient-to-br from-[#f5a623]/[0.07] via-white/[0.02] to-[#e07850]/[0.04] p-5 sm:p-6">
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
                className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-[#f5a623]/40 focus:outline-none"
                placeholder="Monthly budget"
              />
              <button
                onClick={() => void loadAll(budget)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold text-[#f5a623] transition-all duration-300"
                style={{
                  background: "rgba(245,166,35,0.1)",
                  backdropFilter: "blur(8px)",
                  borderColor: "rgba(245,166,35,0.2)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(245,166,35,0.2)";
                  e.currentTarget.style.borderColor = "rgba(245,166,35,0.35)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(245,166,35,0.1)";
                  e.currentTarget.style.borderColor = "rgba(245,166,35,0.2)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <OperatorStatCard
              label="Best Current Channel"
              value={<span className="capitalize">{topPlatform?.platform ?? "No data yet"}</span>}
              description={topPlatform ? `${topPlatform.totals.roas.toFixed(1)}x ROAS from ${topPlatform.campaigns.length} tracked campaign${topPlatform.campaigns.length === 1 ? "" : "s"}.` : "Connect ad accounts to see where your spend is actually working."}
            />
            <OperatorStatCard
              label="Budget Mode"
              value={money(Number(budget || 0))}
              description="Current planning budget used for allocation and ROAS guidance."
            />
            <OperatorStatCard
              label="Connection Readiness"
              value={`${Object.values(ads?.connected ?? {}).filter(Boolean).length}/3 connected`}
              description="Meta, Google, and TikTok are staged here as one operating surface."
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                  <div className="h-3 w-20 animate-pulse rounded bg-white/[0.08]" />
                  <div className="mt-3 h-7 w-24 animate-pulse rounded bg-white/[0.08]" />
                </div>
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent p-5">
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                      <div className="h-4 w-28 animate-pulse rounded bg-white/[0.08]" />
                      <div className="mt-3 h-16 animate-pulse rounded bg-white/[0.06]" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent p-5">
                    <div className="h-4 w-32 animate-pulse rounded bg-white/[0.08]" />
                    <div className="mt-3 h-24 animate-pulse rounded bg-white/[0.06]" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent py-8 text-sm text-white/35">
              <Loader2 className="h-5 w-5 animate-spin text-white/20" />
              Building your ads control room
            </div>
          </div>
        ) : (
          <>
            {!hasPlatformData && (
              <div className="mb-6 rounded-3xl border border-amber-500/15 bg-gradient-to-br from-amber-500/[0.08] via-transparent to-red-500/[0.04] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="max-w-2xl">
                    <OperatorCallout
                      icon={AlertTriangle}
                      eyebrow="Control Room Not Wired Yet"
                      title={connectedPlatforms > 0 ? "Connections exist, but no live campaign data is flowing yet." : "Connect at least one ad platform to turn this into a live dashboard."}
                      description={connectedPlatforms > 0
                        ? "This page is staged correctly, but the system is still waiting for token-backed sync and real campaign data to populate the control surfaces below."
                        : "The page structure is ready for Meta, Google, and TikTok. Once those are connected, Himalaya can start behaving like a real media operating system instead of a static reporting shell."}
                      tone="warning"
                      className="border-0 bg-transparent p-0"
                    />
                  </div>
                  <Link
                    href="/settings#ad-connections"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold text-amber-200 transition-all duration-300"
                    style={{
                      background: "rgba(245,158,11,0.1)",
                      backdropFilter: "blur(8px)",
                      borderColor: "rgba(245,158,11,0.2)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(245,158,11,0.2)";
                      e.currentTarget.style.borderColor = "rgba(245,158,11,0.35)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(245,158,11,0.1)";
                      e.currentTarget.style.borderColor = "rgba(245,158,11,0.2)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    Open Connections
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}

            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <OperatorStatCard label="Spend" value={money(totals.spend)} description="Tracked spend across connected platforms." valueClassName="text-2xl" />
              <OperatorStatCard label="Revenue" value={money(totals.revenue)} description="Attributed revenue from current campaign data." valueClassName="text-2xl" />
              <OperatorStatCard label="ROAS" value={`${ads?.budgetPlan?.expectedROAS?.toFixed(1) ?? "0.0"}x`} description="Expected blended return from current allocation guidance." tone="accent" valueClassName="text-2xl text-[#f5a623]" />
              <OperatorStatCard label="Conversions" value={totals.conversions} description="Recorded conversions flowing through the dashboard." valueClassName="text-2xl" />
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
                    <Target className="h-3.5 w-3.5 text-[#f5a623]" />
                    Unified platform view
                  </div>
                  <Link href="/settings" className="inline-flex items-center gap-1 text-xs text-[#f5a623]/60 transition hover:text-[#f5a623]">
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
                              <p className="text-xs font-black text-[#f5a623]">{(data?.totals.roas ?? 0).toFixed(1)}x</p>
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

                          {!connected && (
                            <button
                              onClick={() => {
                                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
                                const redirectUri = `${baseUrl}/api/oauth/${platform}/callback`;

                                if (platform === "meta") {
                                  const scopes = ["ads_management", "ads_read", "read_insights"].join(",");
                                  const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${process.env.NEXT_PUBLIC_META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code`;
                                  window.location.href = authUrl;
                                } else if (platform === "google") {
                                  // TODO: Implement Google OAuth
                                  alert("Google Ads integration coming soon!");
                                } else if (platform === "tiktok") {
                                  // TODO: Implement TikTok OAuth
                                  alert("TikTok Ads integration coming soon!");
                                }
                              }}
                              className="w-full rounded-xl border px-4 py-2.5 text-xs font-bold transition-all duration-300"
                              style={{
                                background: "rgba(245,166,35,0.1)",
                                backdropFilter: "blur(8px)",
                                borderColor: "rgba(245,166,35,0.2)",
                                color: "#f5a623",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(245,166,35,0.2)";
                                e.currentTarget.style.borderColor = "rgba(245,166,35,0.35)";
                                e.currentTarget.style.transform = "translateY(-1px)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "rgba(245,166,35,0.1)";
                                e.currentTarget.style.borderColor = "rgba(245,166,35,0.2)";
                                e.currentTarget.style.transform = "translateY(0)";
                              }}
                            >
                              Connect {platform === "meta" ? "Meta" : platform === "google" ? "Google" : "TikTok"} Ads
                            </button>
                          )}
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
                  className="rounded-3xl border-[#f5a623]/15 bg-gradient-to-br from-[#f5a623]/[0.08] via-transparent to-[#e07850]/[0.05]"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-[#f5a623]" />
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f5f0e8]/70">Recommended Allocation</p>
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
              {!hasCampaignData ? (
                <OperatorCallout
                  icon={Trophy}
                  eyebrow="Campaign Spotlight"
                  title="No campaign-level winners yet."
                  description="As soon as campaigns begin reporting real spend and outcomes, this area becomes your 'what is working right now' layer instead of just a placeholder section."
                />
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
                        <div className="rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/10 px-3 py-2 text-right">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-[#f5a623]/60">ROAS</p>
                          <p className="text-sm font-black text-[#f5a623]">{campaign.roas.toFixed(1)}x</p>
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
                          <p className="mt-2 text-xs text-[#f5a623]/70">{action.suggestedChange}</p>
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
