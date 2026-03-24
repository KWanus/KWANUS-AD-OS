"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  BarChart3,
  Building2,
  Globe,
  Plus,
  ArrowRight,
  Clock,
  TrendingUp,
  ScanSearch,
  Sparkles,
  ChevronRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Lead {
  id: string;
  name: string;
  niche: string;
  location: string;
  score: number | null;
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
  status: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PIPELINE_STAGES: { key: string; label: string }[] = [
  { key: "new", label: "New" },
  { key: "analyzing", label: "Analyzing" },
  { key: "analyzed", label: "Analyzed" },
  { key: "generating", label: "Generating" },
  { key: "ready", label: "Ready" },
  { key: "outreach_sent", label: "Outreach Sent" },
  { key: "replied", label: "Replied" },
  { key: "converted", label: "Converted" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getScoreColor(score: number | null) {
  if (score === null) return "text-white/30 bg-white/5 border-white/10";
  if (score >= 75) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  if (score >= 50) return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
  return "text-red-400 bg-red-500/10 border-red-500/20";
}

function getStatusPill(status: string) {
  const map: Record<string, string> = {
    new: "bg-white/5 border-white/10 text-white/40",
    analyzing: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    analyzed: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    generating: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    ready: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    outreach_sent: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    replied: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
    converted: "bg-pink-500/10 border-pink-500/20 text-pink-400",
    rejected: "bg-red-500/10 border-red-500/20 text-red-400",
  };
  return map[status] ?? "bg-white/5 border-white/10 text-white/30";
}

function getActionLabel(status: string) {
  if (status === "new") return "Analyze";
  if (status === "analyzed") return "Generate";
  return "View";
}

function getActivityDesc(lead: Lead) {
  const map: Record<string, string> = {
    analyzing: "analysis started",
    analyzed: "analyzed",
    generating: "assets generating",
    ready: "assets generated",
    outreach_sent: "outreach sent",
    replied: "replied to outreach",
    converted: "converted to client",
  };
  return map[lead.status] ?? "updated";
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-white/[0.04] ${className ?? ""}`}
    />
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect unauthenticated to sign-in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  // Onboarding redirect
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetch("/api/settings")
      .then((r) => r.json() as Promise<{ ok: boolean; settings?: { onboardingCompleted?: boolean } }>)
      .then((data) => {
        if (data.ok && data.settings?.onboardingCompleted === false) {
          router.replace("/onboarding");
        }
      })
      .catch(() => {});
  }, [isLoaded, isSignedIn, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, campaignsRes, sitesRes] = await Promise.allSettled([
        fetch("/api/leads").then((r) => r.json() as Promise<{ ok: boolean; leads: Lead[] }>),
        fetch("/api/campaigns").then((r) => r.json() as Promise<{ ok: boolean; campaigns: Campaign[] }>),
        fetch("/api/sites").then((r) => r.json() as Promise<{ ok: boolean; sites: Site[] }>),
      ]);

      if (leadsRes.status === "fulfilled" && leadsRes.value.ok) {
        setLeads(leadsRes.value.leads ?? []);
      }
      if (campaignsRes.status === "fulfilled" && campaignsRes.value.ok) {
        setCampaigns(campaignsRes.value.campaigns ?? []);
      }
      if (sitesRes.status === "fulfilled" && sitesRes.value.ok) {
        setSites(sitesRes.value.sites ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSignedIn) fetchData();
  }, [isSignedIn, fetchData]);

  if (!isLoaded || !isSignedIn) return null;

  // Derived stats
  const firstName = user?.firstName ?? user?.username ?? "there";
  const totalLeads = leads.length;
  const readyLeads = leads.filter((l) => l.status === "ready").length;
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const sitesBuilt = sites.length;

  // New this week
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = leads.filter(
    (l) => new Date(l.updatedAt).getTime() > oneWeekAgo
  ).length;

  // Pipeline counts
  const pipelineCounts: Record<string, number> = {};
  for (const stage of PIPELINE_STAGES) {
    pipelineCounts[stage.key] = leads.filter((l) => l.status === stage.key).length;
  }

  const leadsByRecentUpdate = [...leads]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  ;

  // Recent leads (last 6)
  const recentLeads = leadsByRecentUpdate.slice(0, 6);

  // Recent activity (last 5, sorted by updatedAt)
  const recentActivity = leadsByRecentUpdate.slice(0, 5);

  return (
    <main className="min-h-screen bg-[#050a14] text-white">
      <AppNav />

      <div className="max-w-5xl mx-auto px-4 pt-8 pb-20 space-y-8">

        {/* ---------------------------------------------------------------- */}
        {/* Header row                                                        */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {getGreeting()}, {firstName}
            </h1>
            <p className="text-sm text-white/35 mt-0.5">{formatDate()}</p>
          </div>
          <Link
            href="/leads"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-black shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:scale-[1.02] transition-all duration-200"
          >
            <Plus className="w-3.5 h-3.5" />
            New Lead Search
          </Link>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Stats bar                                                         */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))
          ) : (
            <>
              <StatCard
                icon={Building2}
                label="Total Leads"
                value={totalLeads}
                sub={`+${newThisWeek} this week`}
                accent="cyan"
              />
              <StatCard
                icon={TrendingUp}
                label="Ready to Outreach"
                value={readyLeads}
                sub="awaiting send"
                accent="emerald"
              />
              <StatCard
                icon={BarChart3}
                label="Active Campaigns"
                value={activeCampaigns}
                sub={`${campaigns.length} total`}
                accent="purple"
              />
              <StatCard
                icon={Globe}
                label="Sites Built"
                value={sitesBuilt}
                sub="published"
                accent="pink"
              />
            </>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Lead Pipeline funnel                                              */}
        {/* ---------------------------------------------------------------- */}
        <section>
          <SectionLabel>Lead Pipeline</SectionLabel>
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 overflow-x-auto">
            {loading ? (
              <Skeleton className="h-12 w-full rounded-xl" />
            ) : (
              <div className="flex items-center gap-1 min-w-max">
                {PIPELINE_STAGES.map((stage, idx) => {
                  const count = pipelineCounts[stage.key] ?? 0;
                  const isLast = idx === PIPELINE_STAGES.length - 1;
                  return (
                    <div key={stage.key} className="flex items-center gap-1">
                      <Link
                        href={`/leads?status=${stage.key}`}
                        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all hover:scale-105 ${
                          count > 0
                            ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-300"
                            : "bg-white/[0.02] border-white/[0.07] text-white/25"
                        }`}
                      >
                        <span className="text-base font-black leading-none">{count}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                          {stage.label}
                        </span>
                      </Link>
                      {!isLast && (
                        <ChevronRight className="w-3.5 h-3.5 text-white/15 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Recent Leads + Quick Actions (side by side on md+)               */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Recent Leads — takes 2 cols */}
          <section className="md:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Recent Leads</SectionLabel>
              <Link href="/leads" className="text-xs text-white/35 hover:text-cyan-400 transition flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : recentLeads.length === 0 ? (
              <EmptyState
                label="No leads yet"
                sub="Run a lead search to get started"
                href="/leads"
                cta="Find Leads"
              />
            ) : (
              <div className="space-y-2">
                {recentLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/[0.07] rounded-xl hover:border-white/[0.14] hover:bg-white/[0.05] transition-all group"
                  >
                    {/* Score badge */}
                    <div
                      className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 text-sm font-black ${getScoreColor(lead.score)}`}
                    >
                      {lead.score ?? "—"}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{lead.name}</p>
                      <p className="text-xs text-white/35 truncate">
                        {lead.niche} · {lead.location}
                      </p>
                    </div>

                    {/* Status pill */}
                    <span
                      className={`hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusPill(lead.status)}`}
                    >
                      {lead.status.replace("_", " ")}
                    </span>

                    {/* Action button */}
                    <span className="text-xs font-bold text-cyan-400/70 group-hover:text-cyan-400 transition whitespace-nowrap">
                      {getActionLabel(lead.status)} →
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Quick Actions — takes 1 col */}
          <section>
            <SectionLabel className="mb-3">Quick Actions</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              <QuickAction icon={ScanSearch} label="Scan a URL" href="/scan" accent="cyan" />
              <QuickAction icon={Building2} label="Find Leads" href="/leads" accent="purple" />
              <QuickAction icon={Globe} label="Build a Site" href="/websites" accent="pink" />
              <QuickAction icon={Sparkles} label="Run a Skill" href="/skills" accent="orange" />
            </div>
          </section>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Recent Activity                                                   */}
        {/* ---------------------------------------------------------------- */}
        <section>
          <SectionLabel>Recent Activity</SectionLabel>
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl divide-y divide-white/[0.05]">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4">
                  <Skeleton className="h-4 w-2/3 mb-1" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))
            ) : recentActivity.length === 0 ? (
              <div className="p-6 text-center text-xs text-white/25">No activity yet</div>
            ) : (
              recentActivity.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition group"
                >
                  <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center shrink-0">
                    <Clock className="w-3.5 h-3.5 text-white/30" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate">
                      <span className="font-bold text-white">{lead.name}</span>
                      {" — "}
                      <span className="text-white/50">{getActivityDesc(lead)}</span>
                    </p>
                  </div>
                  <span className="text-[11px] text-white/25 shrink-0">{timeAgo(lead.updatedAt)}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 transition shrink-0" />
                </Link>
              ))
            )}
          </div>
        </section>

      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type Accent = "cyan" | "purple" | "emerald" | "pink" | "orange";

const ACCENT_MAP: Record<Accent, { icon: string; value: string }> = {
  cyan:    { icon: "text-cyan-400",    value: "text-cyan-300" },
  purple:  { icon: "text-purple-400",  value: "text-purple-300" },
  emerald: { icon: "text-emerald-400", value: "text-emerald-300" },
  pink:    { icon: "text-pink-400",    value: "text-pink-300" },
  orange:  { icon: "text-orange-400",  value: "text-orange-300" },
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  sub: string;
  accent: Accent;
}) {
  const { icon, value: valColor } = ACCENT_MAP[accent];
  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-white/35">{label}</span>
        <Icon className={`w-3.5 h-3.5 ${icon}`} />
      </div>
      <div className={`text-3xl font-black leading-none ${valColor}`}>{value}</div>
      <div className="flex items-center gap-1 text-[11px] text-white/25">
        <TrendingUp className="w-3 h-3" />
        {sub}
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  href,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  accent: Accent;
}) {
  const { icon } = ACCENT_MAP[accent];
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 p-4 bg-white/[0.03] border border-white/[0.07] rounded-2xl hover:border-white/[0.14] hover:bg-white/[0.05] transition-all group text-center"
    >
      <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
        <Icon className={`w-4 h-4 ${icon} group-hover:scale-110 transition-transform`} />
      </div>
      <span className="text-[11px] font-bold text-white/50 group-hover:text-white/80 transition leading-tight">
        {label}
      </span>
    </Link>
  );
}

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[10px] font-black uppercase tracking-widest text-white/30 mb-3 ${className ?? ""}`}>
      {children}
    </p>
  );
}

function EmptyState({
  label,
  sub,
  href,
  cta,
}: {
  label: string;
  sub: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 bg-white/[0.02] border border-white/[0.06] rounded-2xl text-center">
      <p className="text-sm font-bold text-white/40">{label}</p>
      <p className="text-xs text-white/25">{sub}</p>
      <Link
        href={href}
        className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition"
      >
        {cta} <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
