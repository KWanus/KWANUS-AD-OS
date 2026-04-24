"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  BarChart3, TrendingUp, Users, Globe, Mail, Zap,
  Loader2, ArrowRight, Activity, DollarSign,
  Target, Package, Sparkles, FileText,
  CheckCircle, AlertTriangle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SystemStats {
  effectiveSystemScore?: number;
  databaseUnavailable?: boolean;
  osVerdict?: { status?: string; label?: string; reason?: string };
  unsyncedSystems?: string[];
}

interface AnalysisSummary {
  total: number;
  avgScore: number;
  pursue: number;
  consider: number;
  reject: number;
}

interface CampaignSummary {
  total: number;
  active: number;
  paused: number;
}

interface ClientSummary {
  total: number;
  active: number;
  pipelineValue: number;
  wonRevenue: number;
  avgHealth: number;
  atRisk: number;
}

interface SiteSummary {
  total: number;
  published: number;
}

interface EmailSummary {
  contacts: number;
  subscribed: number;
  flows: number;
  activeFlows: number;
  sentEmails: number;
  avgOpenRate: number | null;
}

interface LeadSummary {
  total: number;
  outreached: number;
  converted: number;
}

interface DashboardData {
  stats: SystemStats | null;
  analyses: AnalysisSummary;
  campaigns: CampaignSummary;
  clients: ClientSummary;
  sites: SiteSummary;
  emails: EmailSummary;
  leads: LeadSummary;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function verdictTone(status?: string) {
  if (status === "healthy") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  if (status === "stale") return "border-[#f5a623]/20 bg-[#f5a623]/10 text-[#f5f0e8]";
  return "border-amber-500/20 bg-amber-500/10 text-amber-100";
}

function scoreRing(score: number) {
  if (score >= 70) return "text-green-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, icon: Icon, color, href, accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  href?: string;
  accent?: string;
}) {
  const inner = (
    <div className={`bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 transition-all ${href ? "hover:border-white/[0.14] hover:bg-white/[0.04] hover:scale-[1.02] cursor-pointer group" : "hover:border-white/[0.1]"}`}>
      <div className={`w-9 h-9 rounded-xl ${accent ?? "bg-white/[0.06]"} border border-white/[0.07] flex items-center justify-center mb-4`}>
        <Icon className={`w-4.5 h-4.5 ${color}`} style={{ width: 18, height: 18 }} />
      </div>
      <p className="text-2xl font-black text-white mb-1">{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wider text-white/30">{label}</p>
      {sub && <p className="text-[10px] text-white/20 mt-1">{sub}</p>}
      {href && (
        <div className="flex items-center gap-1 mt-3 text-[11px] text-white/25 group-hover:text-[#f5a623]/60 transition">
          View <ArrowRight className="w-3 h-3" />
        </div>
      )}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, href, count }: { title: string; href?: string; count?: number }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-black uppercase tracking-[0.22em] text-white/40">{title}</h2>
        {count !== undefined && (
          <span className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[10px] font-black text-white/40">
            {count}
          </span>
        )}
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-[11px] text-[#f5a623]/50 hover:text-[#f5a623] transition">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

// ─── Empty fetch stub helpers ─────────────────────────────────────────────────

async function safeJson<T>(promise: Promise<Response>): Promise<T | null> {
  try {
    const res = await promise;
    return await res.json() as T;
  } catch {
    return null;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState<DashboardData>({
    stats: null,
    analyses: { total: 0, avgScore: 0, pursue: 0, consider: 0, reject: 0 },
    campaigns: { total: 0, active: 0, paused: 0 },
    clients: { total: 0, active: 0, pipelineValue: 0, wonRevenue: 0, avgHealth: 0, atRisk: 0 },
    sites: { total: 0, published: 0 },
    emails: { contacts: 0, subscribed: 0, flows: 0, activeFlows: 0, sentEmails: 0, avgOpenRate: null },
    leads: { total: 0, outreached: 0, converted: 0 },
  });
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);

    type StatsResp = { ok: boolean; stats?: SystemStats | null };
    type AnalysesResp = { ok: boolean; analyses?: Array<{ score: number; verdict?: string }> };
    type CampsResp = { ok: boolean; campaigns?: Array<{ status: string }> };
    type ClientsResp = { ok: boolean; clients?: Array<{ pipelineStage: string; dealValue?: number; healthStatus: string; healthScore: number }> };
    type SitesResp = { ok: boolean; sites?: Array<{ published?: boolean }> };
    type FlowsResp = { ok: boolean; flows?: Array<{ status: string; sent?: number; opens?: number }> };
    type ContactsResp = { ok: boolean; contacts?: Array<{ status: string }>; total?: number };
    type LeadsResp = { ok: boolean; leads?: Array<{ outreachSentAt?: string | null; status: string }> };

    const [statsData, analysesData, campsData, clientsData, sitesData, flowsData, contactsData, leadsData] = await Promise.all([
      safeJson<StatsResp>(fetch("/api/stats")),
      safeJson<AnalysesResp>(fetch("/api/analyses?limit=200")),
      safeJson<CampsResp>(fetch("/api/campaigns?limit=200")),
      safeJson<ClientsResp>(fetch("/api/clients?limit=200")),
      safeJson<SitesResp>(fetch("/api/sites?limit=200")),
      safeJson<FlowsResp>(fetch("/api/email-flows")),
      safeJson<ContactsResp>(fetch("/api/email-contacts?limit=200")),
      safeJson<LeadsResp>(fetch("/api/leads?limit=200")),
    ]);

    // Analyses
    const analyses = analysesData?.analyses ?? [];
    const analysisSummary: AnalysisSummary = {
      total: analyses.length,
      avgScore: analyses.length > 0
        ? Math.round(analyses.reduce((s, a) => s + (a.score ?? 0), 0) / analyses.length)
        : 0,
      pursue: analyses.filter((a) => a.verdict === "pursue").length,
      consider: analyses.filter((a) => a.verdict === "consider").length,
      reject: analyses.filter((a) => a.verdict === "reject").length,
    };

    // Campaigns
    const camps = campsData?.campaigns ?? [];
    const campaignSummary: CampaignSummary = {
      total: camps.length,
      active: camps.filter((c) => c.status === "active").length,
      paused: camps.filter((c) => c.status === "paused").length,
    };

    // Clients
    const clients = clientsData?.clients ?? [];
    const clientSummary: ClientSummary = {
      total: clients.length,
      active: clients.filter((c) => c.pipelineStage === "active").length,
      pipelineValue: clients
        .filter((c) => !["won", "churned"].includes(c.pipelineStage))
        .reduce((s, c) => s + (c.dealValue ?? 0), 0),
      wonRevenue: clients
        .filter((c) => c.pipelineStage === "won")
        .reduce((s, c) => s + (c.dealValue ?? 0), 0),
      avgHealth: clients.length > 0
        ? Math.round(clients.reduce((s, c) => s + c.healthScore, 0) / clients.length)
        : 0,
      atRisk: clients.filter((c) => c.healthStatus === "red").length,
    };

    // Sites
    const sites = sitesData?.sites ?? [];
    const siteSummary: SiteSummary = {
      total: sites.length,
      published: sites.filter((s) => Boolean(s.published)).length,
    };

    // Emails
    const flows = flowsData?.flows ?? [];
    const contacts = contactsData?.contacts ?? [];
    const sentEmails = flows.reduce((s, f) => s + (f.sent ?? 0), 0);
    const totalOpens = flows.reduce((s, f) => s + (f.opens ?? 0), 0);
    const emailSummary: EmailSummary = {
      contacts: contactsData?.total ?? contacts.length,
      subscribed: contacts.filter((c) => c.status === "subscribed").length,
      flows: flows.length,
      activeFlows: flows.filter((f) => f.status === "active").length,
      sentEmails,
      avgOpenRate: sentEmails > 0 ? Math.round((totalOpens / sentEmails) * 100) : null,
    };

    // Leads
    const leads = leadsData?.leads ?? [];
    const leadSummary: LeadSummary = {
      total: leads.length,
      outreached: leads.filter((l) => Boolean(l.outreachSentAt)).length,
      converted: leads.filter((l) => l.status === "converted").length,
    };

    setData({
      stats: statsData?.stats ?? null,
      analyses: analysisSummary,
      campaigns: campaignSummary,
      clients: clientSummary,
      sites: siteSummary,
      emails: emailSummary,
      leads: leadSummary,
    });
    setLoading(false);
  }, []);

  useEffect(() => { void loadAll(); }, [loadAll]);

  const { stats, analyses, campaigns, clients, sites, emails, leads } = data;

  return (
    <main className="min-h-screen bg-t-bg text-white">
      {/* Glows */}
      <div className="fixed top-0 left-1/3 w-[600px] h-[400px] bg-[#f5a623]/[0.05] blur-[140px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-[#e07850]/[0.05] blur-[120px] rounded-full pointer-events-none" />

      <AppNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-[#f5a623]/15 border border-[#f5a623]/20 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-[#f5a623]" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-[#f5a623]/70">Analytics</p>
          </div>
          <h1 className="text-3xl font-black text-white">Platform Overview</h1>
          <p className="text-sm text-white/40 mt-1">All systems at a glance — analyses, campaigns, clients, email, sites, and leads.</p>
        </div>

        {loading ? (
          <div className="space-y-10">
            {/* Skeleton loaders */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 animate-pulse">
              <div className="h-6 w-48 bg-white/[0.05] rounded mb-2"></div>
              <div className="h-4 w-96 bg-white/[0.03] rounded"></div>
            </div>
            <div>
              <div className="h-4 w-32 bg-white/[0.05] rounded mb-4"></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 animate-pulse">
                    <div className="h-8 w-16 bg-white/[0.05] rounded mb-2"></div>
                    <div className="h-3 w-20 bg-white/[0.03] rounded"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-white/20">
              <Loader2 className="w-8 h-8 animate-spin text-[#f5a623]/40" />
              <p className="text-sm font-semibold">Loading your analytics…</p>
            </div>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in duration-500">

            {/* OS Health */}
            {stats?.osVerdict && (
              <div className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all hover:scale-[1.01] ${verdictTone(stats.osVerdict.status)}`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4" />
                    <p className="text-xs font-black uppercase tracking-widest">{stats.osVerdict.label ?? "System Status"}</p>
                    {stats.effectiveSystemScore !== undefined && (
                      <span className={`text-sm font-black ${scoreRing(stats.effectiveSystemScore)}`}>
                        {stats.effectiveSystemScore}/100
                      </span>
                    )}
                  </div>
                  <p className="text-xs opacity-70 leading-relaxed max-w-xl">
                    {stats.osVerdict.reason ?? "Your Business OS is loaded."}
                  </p>
                </div>
                {(stats.unsyncedSystems?.length ?? 0) > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-bold shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {stats.unsyncedSystems?.length} unsynced systems
                  </div>
                )}
              </div>
            )}

            {/* Top metrics — key numbers from every system */}
            <div>
              <SectionHeader title="Platform Totals" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                <MetricCard
                  label="Analyses" value={analyses.total}
                  icon={Target} color="text-[#f5a623]" accent="bg-[#f5a623]/10"
                  href="/analyses"
                  sub={analyses.total > 0 ? `Avg ${analyses.avgScore}/100` : undefined}
                />
                <MetricCard
                  label="Campaigns" value={campaigns.total}
                  icon={Sparkles} color="text-[#e07850]" accent="bg-[#e07850]/10"
                  href="/campaigns"
                  sub={campaigns.active > 0 ? `${campaigns.active} active` : undefined}
                />
                <MetricCard
                  label="Clients" value={clients.total}
                  icon={Users} color="text-green-400" accent="bg-green-500/10"
                  href="/clients"
                  sub={clients.active > 0 ? `${clients.active} active` : undefined}
                />
                <MetricCard
                  label="Sites" value={sites.total}
                  icon={Globe} color="text-blue-400" accent="bg-blue-500/10"
                  href="/websites"
                  sub={sites.published > 0 ? `${sites.published} published` : undefined}
                />
                <MetricCard
                  label="Contacts" value={emails.contacts.toLocaleString()}
                  icon={Mail} color="text-amber-400" accent="bg-amber-500/10"
                  href="/emails/contacts"
                  sub={emails.subscribed > 0 ? `${emails.subscribed} subscribed` : undefined}
                />
                <MetricCard
                  label="Leads" value={leads.total}
                  icon={TrendingUp} color="text-rose-400" accent="bg-rose-500/10"
                  href="/leads"
                  sub={leads.outreached > 0 ? `${leads.outreached} outreached` : undefined}
                />
              </div>
            </div>

            {/* Analysis breakdown */}
            <div>
              <SectionHeader title="Analysis Performance" href="/analyses" count={analyses.total} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 hover:bg-white/[0.04] transition-all hover:scale-[1.02] hover:border-white/[0.12]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Avg Score</p>
                  <p className={`text-4xl font-black transition-colors ${scoreRing(analyses.avgScore)}`}>{analyses.avgScore}</p>
                  <p className="text-xs text-white/30 mt-1">out of 100</p>
                </div>
                {[
                  { label: "Pursue", value: analyses.pursue, color: "text-green-400 border-green-500/20 bg-green-500/[0.06]" },
                  { label: "Consider", value: analyses.consider, color: "text-amber-400 border-amber-500/20 bg-amber-500/[0.06]" },
                  { label: "Reject", value: analyses.reject, color: "text-red-400 border-red-500/20 bg-red-500/[0.06]" },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`rounded-2xl border p-5 transition-all hover:scale-[1.02] ${color}`}>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{label}</p>
                    <p className="text-4xl font-black transition-transform hover:scale-110">{value}</p>
                    <p className="text-xs opacity-50 mt-1">
                      {analyses.total > 0 ? `${Math.round((value / analyses.total) * 100)}% of total` : "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Client + Revenue */}
            <div>
              <SectionHeader title="Client Revenue" href="/clients" count={clients.total} />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <MetricCard label="Active Clients" value={clients.active} icon={CheckCircle} color="text-green-400" />
                <MetricCard label="Pipeline Value" value={clients.pipelineValue > 0 ? `$${(clients.pipelineValue / 1000).toFixed(0)}k` : "—"} icon={DollarSign} color="text-amber-400" href="/clients/pipeline" />
                <MetricCard label="Won Revenue" value={clients.wonRevenue > 0 ? `$${(clients.wonRevenue / 1000).toFixed(0)}k` : "—"} icon={TrendingUp} color="text-emerald-400" />
                <MetricCard label="Avg Health" value={`${clients.avgHealth}/100`} icon={Activity} color="text-[#f5a623]" sub={clients.atRisk > 0 ? `${clients.atRisk} at risk` : undefined} />
              </div>
            </div>

            {/* Email stats */}
            <div>
              <SectionHeader title="Email Performance" href="/emails" count={emails.contacts} />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <MetricCard label="Subscribed" value={emails.subscribed.toLocaleString()} icon={Mail} color="text-[#f5a623]" />
                <MetricCard label="Active Flows" value={`${emails.activeFlows} / ${emails.flows}`} icon={Zap} color="text-[#e07850]" href="/emails/flows/new" />
                <MetricCard label="Emails Sent" value={emails.sentEmails.toLocaleString()} icon={FileText} color="text-white/50" />
                <MetricCard
                  label="Avg Open Rate"
                  value={emails.avgOpenRate != null ? `${emails.avgOpenRate}%` : "—"}
                  icon={BarChart3}
                  color="text-green-400"
                  href="/emails/analytics"
                />
                <MetricCard label="Leads Converted" value={leads.converted} icon={CheckCircle} color="text-emerald-400" href="/leads" />
              </div>
            </div>

            {/* Sites */}
            <div>
              <SectionHeader title="Sites & Builds" href="/websites" count={sites.total} />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MetricCard label="Total Sites" value={sites.total} icon={Globe} color="text-blue-400" href="/websites" />
                <MetricCard label="Published" value={sites.published} icon={CheckCircle} color="text-green-400" />
                <MetricCard label="In Draft" value={sites.total - sites.published} icon={FileText} color="text-white/40" />
                <MetricCard label="Publish Rate" value={sites.total > 0 ? `${Math.round((sites.published / sites.total) * 100)}%` : "—"} icon={TrendingUp} color="text-[#f5a623]" />
              </div>
            </div>

            {/* Quick links */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/30 mb-4">Detailed Analytics</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  { label: "Email Analytics", href: "/emails/analytics", icon: BarChart3, color: "text-[#f5a623]" },
                  { label: "Client Dashboard", href: "/clients/dashboard", icon: Users, color: "text-green-400" },
                  { label: "Pipeline View", href: "/clients/pipeline", icon: TrendingUp, color: "text-amber-400" },
                  { label: "All Analyses", href: "/analyses", icon: Target, color: "text-[#e07850]" },
                  { label: "Winner Finder", href: "/winners", icon: Sparkles, color: "text-rose-400" },
                  { label: "Products", href: "/products", icon: Package, color: "text-blue-400" },
                  { label: "Leads", href: "/leads", icon: Activity, color: "text-white/50" },
                  { label: "Campaigns", href: "/campaigns", icon: FileText, color: "text-[#e07850]" },
                ].map(({ label, href, icon: Icon, color }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04] transition group"
                  >
                    <Icon className={`w-3.5 h-3.5 ${color} shrink-0`} />
                    <span className="text-xs font-bold text-white/50 group-hover:text-white/75 transition">{label}</span>
                    <ArrowRight className="w-3 h-3 text-white/20 group-hover:text-white/40 ml-auto transition group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
