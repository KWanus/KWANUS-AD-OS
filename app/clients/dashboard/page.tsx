"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Users,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Activity,
  ArrowRight,
  Loader2,
  Clock,
  Zap,
  BarChart2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Client {
  id: string;
  name: string;
  company?: string;
  pipelineStage: string;
  dealValue?: number;
  healthScore: number;
  healthStatus: "green" | "yellow" | "red";
  lastContactAt?: string;
  createdAt: string;
  executionTier?: "core" | "elite";
}

// ---------------------------------------------------------------------------
// Metric Card
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  href?: string;
}) {
  const inner = (
    <div className={`bg-white/[0.025] border border-white/[0.06] rounded-2xl p-5 transition-all ${href ? "hover:border-white/[0.14] hover:bg-white/[0.04] cursor-pointer" : ""}`}>
      <div className={`w-8 h-8 rounded-xl ${color.replace("text-", "bg-").replace("400", "500/15")} flex items-center justify-center mb-3`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className="text-2xl font-black text-white mb-1">{value}</p>
      <p className="text-[11px] font-medium uppercase tracking-wider text-white/30">{label}</p>
      {sub && <p className="text-[10px] text-white/20 mt-1">{sub}</p>}
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ---------------------------------------------------------------------------
// At-Risk Card
// ---------------------------------------------------------------------------

function AtRiskCard({ client }: { client: Client }) {
  return (
    <Link
      href={`/clients/${client.id}`}
      className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/15 hover:bg-red-500/10 hover:border-red-500/25 transition group"
    >
      <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center text-sm font-black text-red-400 shrink-0">
        {client.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white/70 group-hover:text-white transition truncate">{client.name}</p>
        <p className="text-[10px] text-red-400/60">
          {client.lastContactAt
            ? `Last contact: ${formatDistanceToNow(new Date(client.lastContactAt), { addSuffix: true })}`
            : "Never contacted"
          }
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-xs font-black text-red-400">{client.healthScore}</span>
        <ArrowRight className="w-3.5 h-3.5 text-red-400/50" />
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Stage Funnel
// ---------------------------------------------------------------------------

function StageFunnel({ clients }: { clients: Client[] }) {
  const STAGES = ["lead", "qualified", "proposal", "active", "won", "churned"];
  const STAGE_COLORS: Record<string, string> = {
    lead: "bg-white/20",
    qualified: "bg-[#f5a623]",
    proposal: "bg-blue-500",
    active: "bg-green-500",
    won: "bg-emerald-500",
    churned: "bg-red-500/60",
  };

  const totals = STAGES.reduce<Record<string, { count: number; value: number }>>((acc, s) => {
    const stageClients = clients.filter((c) => c.pipelineStage === s);
    acc[s] = {
      count: stageClients.length,
      value: stageClients.reduce((sum, c) => sum + (c.dealValue ?? 0), 0),
    };
    return acc;
  }, {});

  const maxCount = Math.max(...STAGES.map((s) => totals[s].count), 1);

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
      <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-5">Pipeline Funnel</h3>
      <div className="space-y-2.5">
        {STAGES.map((stage) => {
          const { count, value } = totals[stage];
          const pct = (count / maxCount) * 100;
          return (
            <div key={stage} className="flex items-center gap-3">
              <div className="w-20 text-[10px] font-bold text-white/40 uppercase tracking-wider text-right">{stage}</div>
              <div className="flex-1 h-6 bg-white/[0.03] rounded-lg overflow-hidden">
                <div
                  className={`h-full rounded-lg transition-all duration-700 ${STAGE_COLORS[stage] ?? "bg-white/20"}`}
                  style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
                />
              </div>
              <div className="w-16 text-right">
                <span className="text-xs font-bold text-white/60">{count}</span>
                {value > 0 && (
                  <span className="text-[10px] text-green-400/60 ml-1">${(value / 1000).toFixed(0)}k</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recent Activity
// ---------------------------------------------------------------------------

function RecentlyAdded({ clients }: { clients: Client[] }) {
  const recent = [...clients]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-white/30">Recently Added</h3>
        <Link href="/clients" className="text-[10px] text-[#f5a623]/60 hover:text-[#f5a623] transition">View all →</Link>
      </div>
      <div className="space-y-2">
        {recent.length === 0 && (
          <p className="text-xs text-white/20 text-center py-4">No clients yet</p>
        )}
        {recent.map((client) => {
          const STAGE_COLORS_MAP: Record<string, string> = {
            lead: "text-white/30",
            qualified: "text-[#f5a623]",
            proposal: "text-blue-400",
            active: "text-green-400",
            won: "text-emerald-400",
            churned: "text-red-400",
          };
          return (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition group"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/20 to-[#e07850]/20 flex items-center justify-center text-xs font-black text-white/60 shrink-0">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white/70 group-hover:text-white transition truncate">{client.name}</p>
                {client.company && <p className="text-[10px] text-white/25 truncate">{client.company}</p>}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                client.executionTier === "core" ? "text-white/25" : "text-[#f5a623]/70"
              }`}>
                {client.executionTier ?? "elite"}
              </span>
              <span className={`text-[10px] font-bold ${STAGE_COLORS_MAP[client.pipelineStage] ?? "text-white/30"}`}>
                {client.pipelineStage}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ClientDashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [pipelineStats, setPipelineStats] = useState<{
    weightedPipeline: number;
    winRate: number;
    avgDealSize: number;
  } | null>(null);
  const [growth, setGrowth] = useState<{ clients: { thisMonth: number; growth: number } } | null>(null);
  const [quickActions, setQuickActions] = useState<{ id: string; priority: string; title: string; href: string; description: string }[]>([]);

  const fetchClients = useCallback(async () => {
    try {
      const [clientRes, pipelineRes, growthRes, actionsRes] = await Promise.all([
        fetch("/api/clients?limit=100"),
        fetch("/api/stats/pipeline"),
        fetch("/api/stats/growth"),
        fetch("/api/quick-actions"),
      ]);
      const data = await clientRes.json() as { ok: boolean; clients?: Client[] };
      const pData = await pipelineRes.json() as { ok: boolean; pipeline?: { weightedPipeline: number; winRate: number; avgDealSize: number } };
      const gData = await growthRes.json() as { ok: boolean; metrics?: { clients: { thisMonth: number; growth: number } } };
      const aData = await actionsRes.json() as { ok: boolean; actions?: typeof quickActions };
      if (data.ok) setClients(data.clients ?? []);
      if (pData.ok && pData.pipeline) setPipelineStats(pData.pipeline);
      if (gData.ok && gData.metrics) setGrowth(gData.metrics);
      if (aData.ok && aData.actions) setQuickActions(aData.actions.filter(a => a.priority === "critical" || a.priority === "high").slice(0, 3));
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Stats
  const total = clients.length;
  const active = clients.filter((c) => c.pipelineStage === "active").length;
  const won = clients.filter((c) => c.pipelineStage === "won").length;
  const atRisk = clients.filter((c) => c.healthStatus === "red");
  const neverContacted = clients.filter((c) => !c.lastContactAt);
  const pipelineValue = clients
    .filter((c) => !["won", "churned"].includes(c.pipelineStage))
    .reduce((s, c) => s + (c.dealValue ?? 0), 0);
  const wonRevenue = clients
    .filter((c) => c.pipelineStage === "won")
    .reduce((s, c) => s + (c.dealValue ?? 0), 0);
  const avgHealth = total > 0 ? Math.round(clients.reduce((s, c) => s + c.healthScore, 0) / total) : 0;
  const eliteClients = clients.filter((c) => (c.executionTier ?? "elite") === "elite").length;

  // Overdue follow-ups (last contact > 14 days or never)
  const overdueFollowUps = clients.filter((c) => {
    if (!c.lastContactAt) return true;
    const days = (Date.now() - new Date(c.lastContactAt).getTime()) / (1000 * 60 * 60 * 24);
    return days > 14;
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white tracking-tight">Dashboard</h1>
        <p className="text-sm text-white/35 mt-0.5">Your client workspace at a glance</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <MetricCard label="Total Clients" value={total} icon={Users} color="text-[#f5a623]" href="/clients" />
            <MetricCard label="Active" value={active} icon={Zap} color="text-green-400" />
            <MetricCard label="Won" value={won} icon={CheckCircle} color="text-emerald-400" />
            <MetricCard label="At Risk" value={atRisk.length} icon={AlertTriangle} color="text-red-400" />
            <MetricCard
              label="Pipeline"
              value={pipelineValue >= 1000 ? `$${(pipelineValue / 1000).toFixed(0)}k` : `$${pipelineValue}`}
              icon={TrendingUp}
              color="text-amber-400"
              href="/clients/pipeline"
            />
            <MetricCard
              label="Closed Revenue"
              value={wonRevenue >= 1000 ? `$${(wonRevenue / 1000).toFixed(0)}k` : `$${wonRevenue}`}
              icon={DollarSign}
              color="text-green-400"
            />
          </div>

          {/* Second row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Avg Health" value={`${avgHealth}/100`} icon={Activity} color="text-[#f5a623]" />
            <MetricCard label="Need Follow-up" value={overdueFollowUps.length} icon={Clock} color="text-amber-400" sub="No contact in 14+ days" />
            <MetricCard
              label="Win Rate"
              value={pipelineStats ? `${pipelineStats.winRate}%` : "—"}
              icon={CheckCircle}
              color="text-emerald-400"
              sub={pipelineStats?.avgDealSize ? `Avg deal: $${pipelineStats.avgDealSize.toLocaleString()}` : undefined}
            />
            <MetricCard
              label="This Month"
              value={growth?.clients.thisMonth ?? 0}
              icon={TrendingUp}
              color="text-green-400"
              sub={growth?.clients.growth !== undefined ? `${growth.clients.growth >= 0 ? "+" : ""}${growth.clients.growth}% vs last month` : undefined}
            />
          </div>

          {/* Weighted pipeline */}
          {pipelineStats && pipelineStats.weightedPipeline > 0 && (
            <div className="bg-[#f5a623]/5 border border-[#f5a623]/15 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#f5a623]/50">Weighted Pipeline</p>
                <p className="text-lg font-black text-white mt-1">${pipelineStats.weightedPipeline.toLocaleString()}</p>
                <p className="text-[10px] text-white/30 mt-0.5">Probability-adjusted value across all active stages</p>
              </div>
              <Link href="/clients/pipeline" className="text-xs font-bold text-[#f5a623]/60 hover:text-[#f5a623] transition">View pipeline →</Link>
            </div>
          )}

          {/* AI Insight panel */}
          {(atRisk.length > 0 || overdueFollowUps.length > 0) && (
            <div className="bg-gradient-to-r from-amber-900/20 to-red-900/20 border border-amber-500/20 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-black text-amber-300 mb-2">Action Required</h3>
                  <div className="space-y-1.5 text-xs text-amber-200/60">
                    {atRisk.length > 0 && (
                      <p>
                        <span className="font-bold text-red-400">{atRisk.length} client{atRisk.length !== 1 ? "s" : ""}</span> have a critical health score below 40. Immediate outreach recommended.
                      </p>
                    )}
                    {overdueFollowUps.length > 0 && (
                      <p>
                        <span className="font-bold text-amber-400">{overdueFollowUps.length} client{overdueFollowUps.length !== 1 ? "s" : ""}</span> haven't been contacted in 14+ days.
                      </p>
                    )}
                    {neverContacted.length > 0 && (
                      <p>
                        <span className="font-bold text-orange-400">{neverContacted.length} client{neverContacted.length !== 1 ? "s" : ""}</span> have never been contacted since being added.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick actions */}
          {quickActions.length > 0 && (
            <div className="bg-gradient-to-r from-amber-900/15 to-cyan-900/15 border border-amber-500/20 rounded-2xl p-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">Priority Actions</h3>
              <div className="space-y-2">
                {quickActions.map(a => (
                  <Link key={a.id} href={a.href} className="flex items-start gap-3 p-3 rounded-xl bg-black/20 border border-white/[0.06] hover:border-white/[0.12] transition group">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.priority === "critical" ? "bg-red-400 animate-pulse" : "bg-amber-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white/70 group-hover:text-white transition">{a.title}</p>
                      <p className="text-[10px] text-white/30 mt-0.5 line-clamp-1">{a.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Bottom grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Funnel */}
            <StageFunnel clients={clients} />

            {/* At Risk */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-white/30">At Risk Clients</h3>
                <span className="text-[10px] text-red-400/60">Score &lt; 40</span>
              </div>
              <div className="space-y-2">
                {atRisk.length === 0 ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-green-400/50">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">All clients healthy</span>
                  </div>
                ) : (
                  atRisk.slice(0, 5).map((client) => (
                    <AtRiskCard key={client.id} client={client} />
                  ))
                )}
              </div>
            </div>

            {/* Recently Added */}
            <RecentlyAdded clients={clients} />
          </div>

          {/* Empty state */}
          {total === 0 && (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-white/10 mx-auto mb-4" />
              <p className="text-sm text-white/30 font-medium mb-4">Add your first client to see dashboard data.</p>
              <Link
                href="/clients/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-white text-sm font-bold hover:opacity-90 transition-opacity"
              >
                Add First Client
              </Link>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
