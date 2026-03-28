"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { WorkspaceHero, WorkspaceShell } from "@/components/ui/WorkspaceShell";
import {
  ArrowRight,
  BotMessageSquare,
  Briefcase,
  Building2,
  CheckCircle2,
  Mail,
  Globe,
  MapPin,
  Package,
  ScanSearch,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
  BarChart2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  niche: string;
  location: string;
  status: string;
  updatedAt: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
}

interface Site {
  id: string;
  name: string;
  published?: boolean;
}

interface EmailFlow {
  id: string;
  status: string;
}

interface RecentAnalysis {
  id: string;
  title: string | null;
  inputUrl: string;
  score: number | null;
  verdict: string | null;
  createdAt: string;
}

interface ClientSummary {
  id: string;
  name: string;
  healthScore: number;
  healthStatus: "green" | "yellow" | "red";
  pipelineStage: string;
  lastContactAt: string | null;
}

interface SettingsState {
  workspaceName?: string | null;
  businessType?: string | null;
  onboardingCompleted?: boolean;
}

interface BusinessProfileSummary {
  businessType: string;
  businessName?: string | null;
  niche?: string | null;
  location?: string | null;
  website?: string | null;
  mainGoal?: string | null;
  stage?: string | null;
  activeSystems: string[];
  systemScore?: number;
  recommendedAt?: string | null;
  setupCompleted?: boolean;
  recommendedSystems?: {
    strategicSummary?: string;
    firstAction?: string;
    prioritizedSystems?: Array<{
      slug: string;
      priority?: string;
      estimatedImpact?: string;
      personalizedReason?: string;
    }>;
  } | null;
}

interface StatsSummary {
  effectiveSystemScore?: number;
  liveSystems?: string[];
  unsyncedSystems?: string[];
  databaseUnavailable?: boolean;
  osVerdict?: {
    status?: string;
    label?: string;
    reason?: string;
  };
}

type Accent = "cyan" | "blue" | "emerald" | "violet" | "amber" | "pink";

const ACCENTS: Record<Accent, string> = {
  cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-300",
  blue: "from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-300",
  emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-300",
  violet: "from-violet-500/20 to-violet-500/5 border-violet-500/20 text-violet-300",
  amber: "from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-300",
  pink: "from-pink-500/20 to-pink-500/5 border-pink-500/20 text-pink-300",
};

function verdictTone(status?: string) {
  if (status === "healthy") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  if (status === "stale") return "border-cyan-500/20 bg-cyan-500/10 text-cyan-100";
  return "border-amber-500/20 bg-amber-500/10 text-amber-100";
}

const BUSINESS_HUBS = [
  {
    label: "Consultant / Coach",
    description: "Offers, packages, proposals, and onboarding flows for service businesses.",
    href: "/consult",
    icon: Briefcase,
    accent: "cyan" as Accent,
  },
  {
    label: "Local Business",
    description: "Audits, SEO, GMB posts, review requests, and local growth tools.",
    href: "/local",
    icon: MapPin,
    accent: "emerald" as Accent,
  },
  {
    label: "Affiliate Operator",
    description: "Research offers, build funnels, and generate assets for promo campaigns.",
    href: "/affiliate",
    icon: TrendingUp,
    accent: "violet" as Accent,
  },
  {
    label: "Dropship Brand",
    description: "Research products, profit math, store content, and ad systems.",
    href: "/dropship",
    icon: ShoppingCart,
    accent: "amber" as Accent,
  },
  {
    label: "Agency Workspace",
    description: "Client audits, strategy, pricing, and proposal-generation tools.",
    href: "/agency",
    icon: Building2,
    accent: "pink" as Accent,
  },
  {
    label: "CRM / Clients",
    description: "Manage pipeline, clients, and delivery work after a deal closes.",
    href: "/clients",
    icon: Users,
    accent: "blue" as Accent,
  },
];

const TOOL_HUBS = [
  { label: "AI Copilot", href: "/copilot", icon: BotMessageSquare, sub: "Ask what to build next", accent: "cyan" as Accent },
  { label: "Scan", href: "/scan", icon: ScanSearch, sub: "Analyze any URL or offer", accent: "blue" as Accent },
  { label: "Skills", href: "/skills", icon: Sparkles, sub: "Run one-click workflows", accent: "violet" as Accent },
  { label: "Campaigns", href: "/campaigns", icon: Zap, sub: "Hooks, landing copy, emails", accent: "emerald" as Accent },
  { label: "Sites", href: "/websites", icon: Globe, sub: "Funnels, stores, and public pages", accent: "pink" as Accent },
  { label: "Products", href: "/products", icon: Package, sub: "Offer library and source records", accent: "amber" as Accent },
];

export default function Dashboard() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [emailFlows, setEmailFlows] = useState<EmailFlow[]>([]);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileSummary | null>(null);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [atRiskClients, setAtRiskClients] = useState<ClientSummary[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [activityFeed, setActivityFeed] = useState<{ id: string; type: string; title: string; subtitle: string; href: string; timestamp: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingSystem, setSyncingSystem] = useState(false);
  const [refreshingRecommendations, setRefreshingRecommendations] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, leadsRes, campaignsRes, sitesRes, profileRes, emailFlowsRes, statsRes, analysesRes, clientsRes, feedRes] = await Promise.allSettled([
        fetch("/api/settings").then((r) => r.json() as Promise<{ ok: boolean; settings?: SettingsState }>),
        fetch("/api/leads").then((r) => r.json() as Promise<{ ok: boolean; leads?: Lead[] }>),
        fetch("/api/campaigns").then((r) => r.json() as Promise<{ ok: boolean; campaigns?: Campaign[] }>),
        fetch("/api/sites").then((r) => r.json() as Promise<{ ok: boolean; sites?: Site[] }>),
        fetch("/api/business-profile").then((r) => r.json() as Promise<{ ok: boolean; profile?: BusinessProfileSummary | null }>),
        fetch("/api/email-flows").then((r) => r.json() as Promise<{ ok: boolean; flows?: EmailFlow[] }>),
        fetch("/api/stats").then((r) => r.json() as Promise<{ ok: boolean; stats?: StatsSummary | null }>),
        fetch("/api/analyses?limit=5").then((r) => r.json() as Promise<{ ok: boolean; analyses?: RecentAnalysis[]; total?: number }>),
        fetch("/api/clients?sortBy=healthScore&limit=5").then((r) => r.json() as Promise<{ ok: boolean; clients?: ClientSummary[]; total?: number }>),
        fetch("/api/activity-feed?limit=8").then((r) => r.json() as Promise<{ ok: boolean; feed?: { id: string; type: string; title: string; subtitle: string; href: string; timestamp: string }[] }>),
      ]);

      if (settingsRes.status === "fulfilled" && settingsRes.value.ok) {
        setSettings(settingsRes.value.settings ?? null);
        if (settingsRes.value.settings?.onboardingCompleted === false) {
          router.replace("/setup");
          return;
        }
      }
      if (leadsRes.status === "fulfilled" && leadsRes.value.ok) {
        setLeads(leadsRes.value.leads ?? []);
      }
      if (campaignsRes.status === "fulfilled" && campaignsRes.value.ok) {
        setCampaigns(campaignsRes.value.campaigns ?? []);
      }
      if (sitesRes.status === "fulfilled" && sitesRes.value.ok) {
        setSites(sitesRes.value.sites ?? []);
      }
      if (profileRes.status === "fulfilled" && profileRes.value.ok) {
        setBusinessProfile(profileRes.value.profile ?? null);
      }
      if (emailFlowsRes.status === "fulfilled" && emailFlowsRes.value.ok) {
        setEmailFlows(emailFlowsRes.value.flows ?? []);
      }
      if (statsRes.status === "fulfilled" && statsRes.value.ok) {
        setStats(statsRes.value.stats ?? null);
      }
      if (analysesRes.status === "fulfilled" && analysesRes.value.ok) {
        setRecentAnalyses(analysesRes.value.analyses ?? []);
      }
      if (clientsRes.status === "fulfilled" && clientsRes.value.ok) {
        setAtRiskClients((clientsRes.value.clients ?? []).filter((c) => c.healthStatus === "red" || c.healthStatus === "yellow"));
        setTotalClients(clientsRes.value.total ?? 0);
      }
      if (feedRes.status === "fulfilled" && feedRes.value.ok) {
        setActivityFeed(feedRes.value.feed ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (isSignedIn) {
      void fetchData();
    }
  }, [fetchData, isSignedIn, refreshKey]);

  async function syncBusinessSystem() {
    try {
      setSyncingSystem(true);
      const res = await fetch("/api/business-profile/sync", { method: "POST" });
      const data = await res.json() as { ok?: boolean };
      if (!res.ok || !data.ok) {
        throw new Error("Failed to sync business system");
      }
      setRefreshKey((value) => value + 1);
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
          stage: businessProfile.stage,
        }),
      });
      const data = await res.json() as { ok?: boolean };
      if (!res.ok || !data.ok) {
        throw new Error("Failed to refresh recommendations");
      }
      setRefreshKey((value) => value + 1);
    } finally {
      setRefreshingRecommendations(false);
    }
  }

  const recommendationFreshness = businessProfile?.recommendedAt
    ? formatRelativeTime(businessProfile.recommendedAt)
    : "never refreshed";
  const recommendationIsStale = businessProfile?.recommendedAt
    ? Date.now() - new Date(businessProfile.recommendedAt).getTime() > 1000 * 60 * 60 * 24 * 7
    : false;

  if (!isLoaded || !isSignedIn) return null;

  const firstName = user?.firstName ?? user?.username ?? "there";
  const workspaceName = settings?.workspaceName ?? "Himalaya";
  const profileBusinessType = businessProfile?.businessType ?? settings?.businessType ?? null;
  const totalLeads = leads.length;
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === "active").length;
  const totalSites = sites.length;
  const publishedSites = sites.filter((site) => Boolean(site.published)).length;
  const totalEmailFlows = emailFlows.length;
  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);
  const prioritizedSystems = businessProfile?.recommendedSystems?.prioritizedSystems ?? [];

  const nextBestAction = getNextBestAction({
    businessProfile,
    totalCampaigns,
    totalSites,
    totalLeads,
    totalEmailFlows,
    publishedSites,
    activeCampaigns,
  });

  const actionStream = [
    nextBestAction,
    ...getSecondaryActions({
      businessProfile,
      totalCampaigns,
      totalSites,
      totalLeads,
      totalEmailFlows,
      publishedSites,
      activeCampaigns,
    }),
  ].slice(0, 3);

  const continueCards = [
    {
      label: "Campaign Engine",
      value: totalCampaigns,
      sub: totalCampaigns > 0 ? `${activeCampaigns} active right now` : "No campaigns started yet",
      href: totalCampaigns > 0 ? "/campaigns" : "/analyze",
      cta: totalCampaigns > 0 ? "Continue campaigns" : "Start first campaign",
      icon: Zap,
      accent: "cyan" as Accent,
    },
    {
      label: "Website Builder",
      value: totalSites,
      sub: totalSites > 0 ? `${publishedSites} published` : "No sites or funnels created yet",
      href: totalSites > 0 ? "/websites" : "/websites/new",
      cta: totalSites > 0 ? "Open sites" : "Create first site",
      icon: Globe,
      accent: "violet" as Accent,
    },
    {
      label: "Lead Pipeline",
      value: totalLeads,
      sub: totalLeads > 0 ? `${recentLeads.length} recently touched` : "Lead gen is available when you need it",
      href: "/leads",
      cta: totalLeads > 0 ? "Open pipeline" : "Find leads",
      icon: Building2,
      accent: "emerald" as Accent,
    },
  ];

  return (
    <main className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <WorkspaceShell>
        <WorkspaceHero
          eyebrow="Home"
          title={`${workspaceName} Command Center`}
          description={`Good to see you, ${firstName}. This home page is your main operating hub: pick the business model, jump into any tool, and keep moving the work that is already in flight.`}
          accent="from-cyan-300 via-blue-300 to-emerald-300"
          actions={(
            <>
              <Link
                href={nextBestAction.href}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-black text-white shadow-[0_0_26px_rgba(6,182,212,0.28)]"
              >
                <BotMessageSquare className="h-4 w-4" />
                {nextBestAction.cta}
              </Link>
              <Link
                href="/scan"
                className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/70"
              >
                <ScanSearch className="h-4 w-4" />
                Scan a URL
              </Link>
            </>
          )}
          stats={[
            { label: "Campaigns", value: loading ? "…" : String(totalCampaigns), tone: "text-cyan-300" },
            { label: "Sites", value: loading ? "…" : String(totalSites), tone: "text-violet-300" },
            { label: "Leads", value: loading ? "…" : String(totalLeads), tone: "text-emerald-300" },
            { label: "Business Type", value: profileBusinessType ? profileBusinessType.replaceAll("_", " ") : "Not set" },
          ]}
        />

        {stats?.databaseUnavailable && (
          <section className="mb-8 rounded-[28px] border border-amber-500/20 bg-amber-500/10 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-200/80">Production Notice</p>
            <h2 className="mt-2 text-lg font-black text-white">Workspace data is temporarily unavailable</h2>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-amber-100/85">
              The live app shell and auth flow are working, but the production database connection is currently unavailable. This command center is running in fallback mode, so signed-in workspace counts may look empty until the database URL is corrected.
            </p>
          </section>
        )}

        <section className="mb-8">
          <SectionLabel>Next Best Action</SectionLabel>
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[32px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/14 via-blue-500/10 to-transparent p-6 shadow-[0_0_40px_rgba(6,182,212,0.08)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300/80">OS Guidance</p>
                  <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">{nextBestAction.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-white/60">{nextBestAction.body}</p>
                  {businessProfile?.recommendedSystems?.firstAction && (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-cyan-100">
                      <CheckCircle2 className="h-3.5 w-3.5 text-cyan-300" />
                      {businessProfile.recommendedSystems.firstAction}
                    </div>
                  )}
                </div>

                <div className="min-w-[220px] rounded-[28px] border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">System Health</p>
                    <span className="text-[11px] font-bold text-cyan-300">{recommendationFreshness}</span>
                  </div>
                  <div className="mt-3 flex items-end gap-3">
                    <span className="text-4xl font-black text-white">{stats?.effectiveSystemScore ?? businessProfile?.systemScore ?? 0}</span>
                    <span className="pb-1 text-sm text-white/45">/100 score</span>
                  </div>
                  {stats?.osVerdict?.label && (
                    <span className={`mt-3 inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${verdictTone(stats.osVerdict.status)}`}>
                      {stats.osVerdict.label}
                    </span>
                  )}
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 transition-all"
                      style={{ width: `${Math.min(Math.max(stats?.effectiveSystemScore ?? businessProfile?.systemScore ?? 0, 6), 100)}%` }}
                    />
                  </div>
                  <p className="mt-3 text-xs leading-6 text-white/50">
                    {stats?.osVerdict?.reason ||
                    ((stats?.unsyncedSystems?.length ?? 0) > 0
                      ? "Live work has changed the system. Syncing will refresh your OS guidance and keep the score accurate."
                      : businessProfile?.recommendedSystems?.strategicSummary ||
                      "Set your business system once, then let the app keep steering the next highest-leverage move.")}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={nextBestAction.href}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-black text-white shadow-[0_0_24px_rgba(6,182,212,0.26)]"
                >
                  {nextBestAction.icon === "mail" ? <Mail className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                  {nextBestAction.cta}
                </Link>
                <Link
                  href="/my-system"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/70"
                >
                  <Sparkles className="h-4 w-4" />
                  Open My System
                </Link>
                {(stats?.unsyncedSystems?.length ?? 0) > 0 && (
                  <button
                    onClick={syncBusinessSystem}
                    disabled={syncingSystem}
                    className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-5 py-3 text-sm font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {syncingSystem ? "Syncing OS..." : `Sync ${stats?.unsyncedSystems?.length} Live System${stats?.unsyncedSystems?.length === 1 ? "" : "s"}`}
                  </button>
                )}
                {recommendationIsStale && (stats?.unsyncedSystems?.length ?? 0) === 0 && (
                  <button
                    onClick={refreshBusinessSystem}
                    disabled={refreshingRecommendations}
                    className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-5 py-3 text-sm font-bold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Sparkles className="h-4 w-4" />
                    {refreshingRecommendations ? "Refreshing Recommendations..." : "Refresh Recommendations"}
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/[0.07] bg-white/[0.03] p-5">
              <SectionLabel>Action Stream</SectionLabel>
              <div className="space-y-3">
                {actionStream.map((action, index) => (
                  <Link
                    key={`${action.title}-${index}`}
                    href={action.href}
                    className="block rounded-2xl border border-white/[0.06] bg-black/20 p-4 transition hover:border-cyan-500/20 hover:bg-cyan-500/[0.04]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
                        {index === 0 ? "Now" : `Next ${index}`}
                      </span>
                      {action.impact && <span className="text-[11px] font-bold text-cyan-300">{action.impact}</span>}
                    </div>
                    <h3 className="mt-3 text-sm font-black text-white">{action.title}</h3>
                    <p className="mt-2 text-xs leading-6 text-white/45">{action.body}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <SectionLabel>Continue Building</SectionLabel>
          <div className="grid gap-4 lg:grid-cols-3">
            {continueCards.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className={`rounded-[28px] border bg-gradient-to-br p-5 transition hover:scale-[1.01] ${ACCENTS[card.accent]}`}
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                    <card.icon className="h-5 w-5" />
                  </div>
                  <span className="text-3xl font-black text-white">{loading ? "…" : card.value}</span>
                </div>
                <h2 className="text-lg font-black text-white">{card.label}</h2>
                <p className="mt-2 text-sm leading-6 text-white/55">{card.sub}</p>
                <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-white">
                  {card.cta}
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Analyses + Client Health Row */}
        {(!loading && (recentAnalyses.length > 0 || atRiskClients.length > 0)) && (
          <section className="mb-8">
            <SectionLabel>Intelligence Feed</SectionLabel>
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Recent Analyses */}
              <div className="rounded-[28px] border border-white/[0.07] bg-white/[0.03] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-cyan-400/60" />
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Recent Scans</p>
                  </div>
                  <Link href="/analyses" className="text-[10px] text-cyan-400/50 hover:text-cyan-400 transition font-bold">
                    View all →
                  </Link>
                </div>
                {recentAnalyses.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-white/25">No scans yet</p>
                    <Link href="/scan" className="text-xs text-cyan-400/60 hover:text-cyan-400 transition mt-1 inline-block">Run first scan →</Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentAnalyses.slice(0, 4).map((a) => {
                      const scoreColor = (a.score ?? 0) >= 70 ? "text-emerald-400" : (a.score ?? 0) >= 45 ? "text-amber-400" : "text-red-400";
                      const verdictBg = a.verdict === "Pursue" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : a.verdict === "Reject" ? "bg-red-500/10 border-red-500/20 text-red-400"
                        : "bg-amber-500/10 border-amber-500/20 text-amber-400";
                      return (
                        <Link
                          key={a.id}
                          href={`/analyses/${a.id}`}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-black/20 border border-white/[0.05] hover:border-white/[0.12] transition group"
                        >
                          <span className={`text-base font-black ${scoreColor} w-8 text-center`}>{a.score ?? "—"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white/60 truncate group-hover:text-white transition">{a.title || a.inputUrl}</p>
                            <p className="text-[10px] text-white/25 truncate flex items-center gap-1">
                              <ExternalLink className="w-2 h-2 shrink-0" />{a.inputUrl}
                            </p>
                          </div>
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${verdictBg}`}>
                            {a.verdict ?? "—"}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Client Health */}
              <div className="rounded-[28px] border border-white/[0.07] bg-white/[0.03] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400/60" />
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Client Health</p>
                  </div>
                  <Link href="/clients/dashboard" className="text-[10px] text-cyan-400/50 hover:text-cyan-400 transition font-bold">
                    Dashboard →
                  </Link>
                </div>
                {totalClients === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-white/25">No clients yet</p>
                    <Link href="/clients/new" className="text-xs text-cyan-400/60 hover:text-cyan-400 transition mt-1 inline-block">Add first client →</Link>
                  </div>
                ) : atRiskClients.length === 0 ? (
                  <div className="flex items-center justify-center gap-3 py-6 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400/60" />
                    <div>
                      <p className="text-sm font-bold text-emerald-300">All {totalClients} clients healthy</p>
                      <p className="text-[10px] text-white/30">No attention needed right now</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {atRiskClients.length > 0 && (
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400/60" />
                        <p className="text-[10px] text-amber-400/60 font-bold">{atRiskClients.length} client{atRiskClients.length !== 1 ? "s" : ""} need attention</p>
                      </div>
                    )}
                    {atRiskClients.slice(0, 4).map((c) => {
                      const dot = c.healthStatus === "red" ? "bg-red-400 animate-pulse" : "bg-amber-400";
                      return (
                        <Link
                          key={c.id}
                          href={`/clients/${c.id}`}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-black/20 border border-white/[0.05] hover:border-white/[0.12] transition group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-600/20 flex items-center justify-center text-xs font-black text-white/60 shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white/60 truncate group-hover:text-white transition">{c.name}</p>
                            <p className="text-[10px] text-white/25">{c.pipelineStage} · Score: {c.healthScore}</p>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${dot} shrink-0`} />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <section className="mb-8">
          <SectionLabel>Choose Your Business Lane</SectionLabel>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {BUSINESS_HUBS.map((hub) => (
              <Link
                key={hub.label}
                href={hub.href}
                className={`rounded-3xl border bg-gradient-to-br p-5 transition hover:border-white/20 hover:bg-white/[0.05] ${ACCENTS[hub.accent]}`}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                  <hub.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-black text-white">{hub.label}</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">{hub.description}</p>
                <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-white">
                  Open workspace
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <SectionLabel>Core Tools</SectionLabel>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {TOOL_HUBS.map((tool) => (
              <Link
                key={tool.label}
                href={tool.href}
                className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-5 transition hover:border-white/[0.15] hover:bg-white/[0.05]"
              >
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border bg-gradient-to-br ${ACCENTS[tool.accent]}`}>
                  <tool.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-black text-white">{tool.label}</h3>
                <p className="mt-2 text-sm text-white/45">{tool.sub}</p>
                <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-cyan-300">
                  Open tool
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Activity Feed */}
        {!loading && activityFeed.length > 0 && (
          <section className="mb-8">
            <SectionLabel>Recent Activity</SectionLabel>
            <div className="rounded-[28px] border border-white/[0.07] bg-white/[0.03] p-5">
              <div className="space-y-2">
                {activityFeed.slice(0, 6).map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3 transition hover:border-white/[0.12] group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white/70 group-hover:text-white transition">{item.title}</p>
                      <p className="truncate text-xs text-white/30">{item.subtitle}</p>
                    </div>
                    <span className="text-[10px] text-white/20 shrink-0">{timeAgo(item.timestamp)}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <section className="rounded-[28px] border border-white/[0.07] bg-white/[0.03] p-5">
            <SectionLabel>Recent Lead Activity</SectionLabel>
            {loading ? (
              <div className="grid gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-2xl bg-white/[0.04]" />
                ))}
              </div>
            ) : recentLeads.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-6 text-center">
                <p className="text-sm font-bold text-white/45">No recent lead activity</p>
                <p className="mt-1 text-xs text-white/25">Lead generation is one engine in the OS, not the whole homepage anymore.</p>
                <Link href="/leads" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-cyan-300">
                  Open lead workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3 transition hover:border-white/[0.12]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{lead.name}</p>
                      <p className="truncate text-xs text-white/35">{lead.niche} · {lead.location}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">{lead.status.replace("_", " ")}</p>
                      <p className="text-[11px] text-white/25">{timeAgo(lead.updatedAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-white/[0.07] bg-white/[0.03] p-5">
            <SectionLabel>Suggested Next Moves</SectionLabel>
            <div className="space-y-3">
              {!settings?.businessType && (
                <SuggestionCard
                  title="Set your business type"
                  body="Tell the app whether you're running an agency, local business, affiliate offer, or product business so the OS can guide you better."
                  href="/setup"
                />
              )}
              {businessProfile?.activeSystems?.includes("website") && totalSites === 0 && (
                <SuggestionCard
                  title="Your OS says the website should be live first"
                  body="This business profile is pushing the website system as a core asset. Build the first conversion site before you spread attention thinner."
                  href="/websites/new"
                />
              )}
              {businessProfile?.activeSystems?.includes("email_sequence") && totalEmailFlows === 0 && (
                <SuggestionCard
                  title="Turn on your follow-up system"
                  body="You have a business profile but no active nurture flow yet. Build the first automated email or SMS sequence so leads do not cool off."
                  href="/emails"
                />
              )}
              {(stats?.unsyncedSystems?.length ?? 0) > 0 && (
                <SuggestionCard
                  title={`Sync ${stats?.unsyncedSystems?.length} live system${stats?.unsyncedSystems?.length === 1 ? "" : "s"} into My System`}
                  body="The workspace already has real systems running, but your Business OS has not marked them active yet. Sync them so your recommendations stay accurate."
                  href="/my-system"
                />
              )}
              {totalCampaigns === 0 && (
                <SuggestionCard
                  title="Generate your first campaign"
                  body="Use Analyze or Skills to create the first real workspace with hooks, landing copy, and email drafts."
                  href="/analyze"
                />
              )}
              {totalSites === 0 && (
                <SuggestionCard
                  title="Create a site or funnel"
                  body="You have the builders ready. Start a website so campaigns, products, and forms have somewhere to live."
                  href="/websites/new"
                />
              )}
              {totalLeads === 0 && (
                <SuggestionCard
                  title="Turn on the lead engine"
                  body="If you want outbound growth, start a lead search and feed those companies into campaigns and sites."
                  href="/leads"
                />
              )}
              {prioritizedSystems.length > 0 && (
                <SuggestionCard
                  title={`Recommended system: ${formatSystemLabel(prioritizedSystems[0]?.slug)}`}
                  body={prioritizedSystems[0]?.personalizedReason || "Your saved profile already knows which system should be installed next. Use that guidance instead of guessing."}
                  href={systemHref(prioritizedSystems[0]?.slug)}
                />
              )}
              <SuggestionCard
                title="Use Copilot as your project manager"
                body="The assistant now lives across the app. Ask it what to continue, what is blocked, or what should come next."
                href="/copilot"
              />
            </div>
          </section>
        </div>
      </WorkspaceShell>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-white/30">
      {children}
    </p>
  );
}

function SuggestionCard({
  title,
  body,
  href,
}: {
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-white/[0.06] bg-black/20 p-4 transition hover:border-cyan-500/20 hover:bg-cyan-500/[0.04]"
    >
      <h3 className="text-sm font-black text-white">{title}</h3>
      <p className="mt-2 text-xs leading-6 text-white/45">{body}</p>
      <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300">
        Go there
        <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </Link>
  );
}

type NextAction = {
  title: string;
  body: string;
  href: string;
  cta: string;
  impact?: string;
  icon?: "mail";
};

function getNextBestAction(input: {
  businessProfile: BusinessProfileSummary | null;
  totalCampaigns: number;
  totalSites: number;
  totalLeads: number;
  totalEmailFlows: number;
  publishedSites: number;
  activeCampaigns: number;
}): NextAction {
  const { businessProfile, totalCampaigns, totalSites, totalLeads, totalEmailFlows, publishedSites, activeCampaigns } = input;
  const prioritizedSlug = businessProfile?.recommendedSystems?.prioritizedSystems?.[0]?.slug;

  if (!businessProfile) {
    return {
      title: "Build your Business OS first",
      body: "Lock in your business type, niche, audience, and goals so every site, campaign, and email flow can pull from the same system brain.",
      href: "/setup",
      cta: "Set up Business OS",
      impact: "Foundation",
    };
  }

  if (totalSites === 0 && shouldPrioritizeSystem(prioritizedSlug, businessProfile.activeSystems, ["website"])) {
    return {
      title: "Build the first conversion site",
      body: "Your current system points to the website as the strongest missing asset. Get the site live so campaigns, forms, and traffic have a place to convert.",
      href: businessProfile.website ? "/websites" : "/websites/new",
      cta: businessProfile.website ? "Scan and improve site" : "Generate first site",
      impact: "High leverage",
    };
  }

  if (totalCampaigns === 0 && shouldPrioritizeSystem(prioritizedSlug, businessProfile.activeSystems, ["google_ads", "facebook_ads", "tiktok_ads"])) {
    return {
      title: "Launch the first traffic system",
      body: "The operating system is telling you traffic is the next unlocked lever. Start the first campaign with the channel that best matches this business profile.",
      href: systemHref(prioritizedSlug),
      cta: "Create recommended campaign",
      impact: "Lead flow",
    };
  }

  if (totalEmailFlows === 0 && shouldPrioritizeSystem(prioritizedSlug, businessProfile.activeSystems, ["email_sequence", "sms_followup", "abandoned_cart"])) {
    return {
      title: "Install your follow-up engine",
      body: "This profile needs nurture and follow-up so leads or buyers do not leak out after first touch. Turn on the first automated sequence now.",
      href: "/emails",
      cta: "Build follow-up flow",
      impact: "Retention",
      icon: "mail",
    };
  }

  if (totalLeads === 0 && isLeadDrivenBusiness(businessProfile.businessType)) {
    return {
      title: "Feed the OS with new opportunities",
      body: "Your business type is strongest when the lead engine stays active. Pull in fresh companies and route them into campaigns, sites, and follow-up.",
      href: "/leads",
      cta: "Find leads now",
      impact: "Pipeline",
    };
  }

  if (totalSites > 0 && publishedSites === 0) {
    return {
      title: "Publish the site you already built",
      body: "You already have a site in the workspace. Pushing it live will unlock a real destination for campaigns, forms, and offers.",
      href: "/websites",
      cta: "Review site and publish",
      impact: "Go live",
    };
  }

  if (totalCampaigns > 0 && activeCampaigns === 0) {
    return {
      title: "Push a draft campaign into motion",
      body: "You already have campaign work started. The next gain is not more drafts, it is moving one system into active testing or deployment.",
      href: "/campaigns",
      cta: "Advance campaign",
      impact: "Momentum",
    };
  }

  return {
    title: "Use Copilot to coordinate the next build",
    body: businessProfile.recommendedSystems?.firstAction ||
      "You have enough of the system in place now that the next best move depends on where you want to push harder: traffic, conversion, follow-up, or delivery.",
    href: "/copilot",
    cta: "Ask Copilot for next move",
    impact: "Guidance",
  };
}

function getSecondaryActions(input: {
  businessProfile: BusinessProfileSummary | null;
  totalCampaigns: number;
  totalSites: number;
  totalLeads: number;
  totalEmailFlows: number;
  publishedSites: number;
  activeCampaigns: number;
}): NextAction[] {
  const { businessProfile, totalCampaigns, totalSites, totalLeads, totalEmailFlows, publishedSites, activeCampaigns } = input;
  const actions: NextAction[] = [];

  if (!businessProfile) {
    actions.push({
      title: "Open My System after setup",
      body: "Once the profile is saved, the whole app starts recommending the exact systems to activate in order.",
      href: "/my-system",
      cta: "Open My System",
    });
  } else {
    actions.push({
      title: "Review your operating system",
      body: "See the active systems, score, and milestones that are driving the guidance across this workspace.",
      href: "/my-system",
      cta: "Open My System",
    });
  }

  if (totalSites === 0) {
    actions.push({
      title: "Start the site layer",
      body: businessProfile?.website
        ? "Scan your existing site and let the builder improve it."
        : "Create a conversion-first site from your saved business profile.",
      href: businessProfile?.website ? "/websites" : "/websites/new",
      cta: "Open Sites",
    });
  }

  if (totalCampaigns === 0) {
    actions.push({
      title: "Stand up your campaign engine",
      body: "The campaign workspace is where hooks, offers, and traffic systems become real execution instead of ideas.",
      href: "/campaigns/new",
      cta: "Open Campaigns",
    });
  }

  if (totalEmailFlows === 0) {
    actions.push({
      title: "Protect the follow-up layer",
      body: "Install the first automation so every new lead, buyer, or consult gets a next step after opt-in.",
      href: "/emails",
      cta: "Open Emails",
    });
  }

  if (totalLeads === 0 && businessProfile && isLeadDrivenBusiness(businessProfile.businessType)) {
    actions.push({
      title: "Refresh the lead pipeline",
      body: "Bring fresh companies into the OS so campaigns and sites have real targets to work with.",
      href: "/leads",
      cta: "Open Leads",
    });
  }

  if (publishedSites === 0 && totalSites > 0) {
    actions.push({
      title: "Publish what is already built",
      body: "A finished draft only starts compounding once it is live and connected to the rest of the stack.",
      href: "/websites",
      cta: "Review Sites",
    });
  }

  if (activeCampaigns === 0 && totalCampaigns > 0) {
    actions.push({
      title: "Move one campaign into testing",
      body: "The OS gets stronger when one lane goes live instead of everything staying in draft.",
      href: "/campaigns",
      cta: "Open Campaigns",
    });
  }

  actions.push({
    title: "Ask Copilot to map the next sprint",
    body: "Use the assistant to sequence websites, campaigns, follow-up, and ops work around your current business profile.",
    href: "/copilot",
    cta: "Open Copilot",
  });

  return actions;
}

function shouldPrioritizeSystem(prioritizedSlug: string | undefined, activeSystems: string[] | undefined, candidates: string[]) {
  const active = activeSystems ?? [];
  if (prioritizedSlug && candidates.includes(prioritizedSlug)) return true;
  return candidates.some((candidate) => active.includes(candidate));
}

function isLeadDrivenBusiness(businessType: string | undefined | null) {
  return ["local_service", "agency", "consultant_coach", "financial", "real_estate"].includes(businessType ?? "");
}

function formatSystemLabel(slug: string | undefined) {
  if (!slug) return "Next system";
  return slug.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function systemHref(slug: string | undefined) {
  switch (slug) {
    case "website":
      return "/websites/new";
    case "google_ads":
      return "/campaigns/new?type=google";
    case "facebook_ads":
      return "/campaigns/new?type=facebook";
    case "tiktok_ads":
      return "/campaigns/new?type=tiktok";
    case "email_sequence":
    case "sms_followup":
    case "abandoned_cart":
      return "/emails";
    case "crm_pipeline":
      return "/clients";
    case "review_system":
    case "gmb_optimization":
    case "citation_builder":
      return "/local";
    case "lead_magnet":
    case "booking_flow":
    case "proposal_system":
    case "case_studies":
    case "referral_system":
    case "content_calendar":
    case "upsell_flow":
    case "bridge_page":
    case "product_page":
    case "white_label_reports":
      return "/my-system";
    default:
      return "/my-system";
  }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "refreshed now";
  if (minutes < 60) return `${minutes}m old`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h old`;
  return `${Math.floor(hours / 24)}d old`;
}
