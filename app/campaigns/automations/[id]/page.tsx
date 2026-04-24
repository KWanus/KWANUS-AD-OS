"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft, Loader2, Play, Pause, Activity, CheckCircle,
  XCircle, Clock, Mail, Users, AlertTriangle, ChevronDown,
  BarChart3, Zap, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AutomationStats {
  id: string;
  name: string;
  status: string;
  trigger: string;
  runsTotal: number;
  runsSuccess: number;
  runsFailed: number;
  lastRunAt: string | null;
  createdAt: string;
  recentRuns: {
    id: string;
    status: string;
    contactsCount: number;
    emailsSent: number;
    errorCount: number;
    createdAt: string;
    completedAt: string | null;
  }[];
  totalContacts: number;
  totalEmailsSent: number;
  avgEmailsPerRun: number;
  pausedRuns: number;
}

interface AutomationRun {
  id: string;
  status: string;
  trigger: string | null;
  contactsCount: number;
  emailsSent: number;
  errorCount: number;
  stoppedAtNode: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  steps: {
    id: string;
    nodeId: string;
    nodeType: string;
    status: string;
    output: unknown;
    error: string | null;
    startedAt: string | null;
    endedAt: string | null;
  }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  completed: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  running: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  failed: "bg-red-500/10 border-red-500/20 text-red-400",
  paused: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  pending: "bg-white/[0.04] border-white/[0.08] text-white/40",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function duration(start: string | null, end: string | null) {
  if (!start) return "—";
  const endMs = end ? new Date(end).getTime() : Date.now();
  const diff = endMs - new Date(start).getTime();
  if (diff < 1000) return "<1s";
  if (diff < 60000) return `${Math.round(diff / 1000)}s`;
  return `${Math.round(diff / 60000)}m`;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AutomationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [totalRuns, setTotalRuns] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, runsRes] = await Promise.all([
          fetch(`/api/automations/${id}/stats`),
          fetch(`/api/automations/${id}/runs?limit=20`),
        ]);
        const statsData = await statsRes.json() as { ok: boolean; stats?: AutomationStats };
        const runsData = await runsRes.json() as { ok: boolean; runs?: AutomationRun[]; total?: number };
        if (statsData.ok && statsData.stats) setStats(statsData.stats);
        if (runsData.ok) {
          setRuns(runsData.runs ?? []);
          setTotalRuns(runsData.total ?? 0);
        }
      } catch {
        toast.error("Failed to load automation data");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  async function triggerManually() {
    setTriggering(true);
    try {
      const res = await fetch(`/api/automations/${id}/trigger`, { method: "POST" });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) {
        toast.success("Automation triggered");
        // Reload runs
        const runsRes = await fetch(`/api/automations/${id}/runs?limit=20`);
        const runsData = await runsRes.json() as { ok: boolean; runs?: AutomationRun[]; total?: number };
        if (runsData.ok) {
          setRuns(runsData.runs ?? []);
          setTotalRuns(runsData.total ?? 0);
        }
      } else {
        toast.error(data.error ?? "Trigger failed");
      }
    } catch {
      toast.error("Failed to trigger");
    } finally {
      setTriggering(false);
    }
  }

  const filteredRuns = statusFilter === "all" ? runs : runs.filter((r) => r.status === statusFilter);
  const successRate = stats && stats.runsTotal > 0
    ? Math.round((stats.runsSuccess / stats.runsTotal) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-t-bg flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#f5a623] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-t-bg text-white">
      {/* Header */}
      <header className="h-14 bg-t-bg border-b border-white/[0.08] flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link href="/campaigns/automations" className="flex items-center gap-1.5 text-white/40 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-bold">Automations</span>
          </Link>
          <div className="h-4 w-[1px] bg-white/10" />
          <h1 className="text-base font-black text-white">{stats?.name ?? "Automation"}</h1>
          {stats && (
            <span className={`px-2.5 py-1 rounded-md border text-[10px] font-black uppercase tracking-wider ${
              stats.status === "active"
                ? "bg-green-500/10 border-green-500/20 text-green-400"
                : "bg-white/5 border-white/10 text-white/50"
            }`}>
              {stats.status}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={triggerManually} disabled={triggering}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#f5a623] to-[#e07850] text-white hover:opacity-90 transition disabled:opacity-40">
            {triggering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Trigger Now
          </button>
          <Link href={`/campaigns/automations?load=${id}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/[0.08] text-xs font-bold text-white/60 hover:text-white hover:bg-white/[0.05] transition">
            Edit Flow
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { label: "Total Runs", value: stats.runsTotal, icon: Activity, color: "text-[#f5a623]" },
              { label: "Successful", value: stats.runsSuccess, icon: CheckCircle, color: "text-emerald-400" },
              { label: "Failed", value: stats.runsFailed, icon: XCircle, color: "text-red-400" },
              { label: "Success Rate", value: `${successRate}%`, icon: BarChart3, color: "text-blue-400" },
              { label: "Emails Sent", value: stats.totalEmailsSent, icon: Mail, color: "text-[#e07850]" },
              { label: "Contacts", value: stats.totalContacts, icon: Users, color: "text-amber-400" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 hover:border-white/[0.12] transition-all">
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/25">{label}</p>
                </div>
                <p className="text-2xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Last run */}
        {stats?.lastRunAt && (
          <div className="flex items-center gap-2 mb-6 text-xs text-white/30">
            <Clock className="w-3.5 h-3.5" />
            Last triggered {timeAgo(stats.lastRunAt)}
            {stats.pausedRuns > 0 && (
              <span className="flex items-center gap-1 ml-3 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold">
                <Pause className="w-3 h-3" /> {stats.pausedRuns} paused
              </span>
            )}
          </div>
        )}

        {/* Runs Table */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-black uppercase tracking-[0.22em] text-white/40">
            Run History ({totalRuns})
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/50 outline-none"
            >
              <option value="all" className="bg-[#0d1525]">All</option>
              <option value="completed" className="bg-[#0d1525]">Completed</option>
              <option value="running" className="bg-[#0d1525]">Running</option>
              <option value="failed" className="bg-[#0d1525]">Failed</option>
              <option value="paused" className="bg-[#0d1525]">Paused</option>
            </select>
          </div>
        </div>

        {filteredRuns.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/[0.08] bg-white/[0.01] p-16 text-center">
            <Activity className="w-10 h-10 text-white/10 mx-auto mb-4" />
            <p className="text-sm text-white/25">No runs yet</p>
            <p className="text-xs text-white/15 mt-1">Trigger the automation or wait for an incoming webhook</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRuns.map((run) => (
              <div key={run.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden">
                <button
                  onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition text-left"
                >
                  <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${STATUS_STYLE[run.status] ?? STATUS_STYLE.pending}`}>
                    {run.status}
                  </span>
                  <div className="flex-1 min-w-0 flex items-center gap-4">
                    <span className="text-xs text-white/40">{timeAgo(run.createdAt)}</span>
                    <span className="text-xs text-white/25 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {run.contactsCount}
                    </span>
                    <span className="text-xs text-white/25 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {run.emailsSent} sent
                    </span>
                    {run.errorCount > 0 && (
                      <span className="text-xs text-red-400/60 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {run.errorCount} errors
                      </span>
                    )}
                    <span className="text-xs text-white/20 ml-auto">
                      {duration(run.startedAt, run.completedAt)}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-white/20 transition-transform ${expandedRun === run.id ? "rotate-180" : ""}`} />
                </button>

                {/* Expanded: show steps */}
                {expandedRun === run.id && run.steps.length > 0 && (
                  <div className="border-t border-white/[0.05] px-5 py-4 bg-white/[0.01]">
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/20 mb-3">Execution Steps</p>
                    <div className="space-y-1.5">
                      {run.steps.map((step) => {
                        const stepColor =
                          step.status === "completed" ? "text-emerald-400" :
                          step.status === "failed" ? "text-red-400" :
                          step.status === "running" ? "text-blue-400" :
                          "text-white/30";
                        return (
                          <div key={step.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs ${
                              step.status === "completed" ? "bg-emerald-500/15" :
                              step.status === "failed" ? "bg-red-500/15" :
                              "bg-white/[0.04]"
                            }`}>
                              {step.status === "completed" ? <CheckCircle className={`w-3 h-3 ${stepColor}`} /> :
                               step.status === "failed" ? <XCircle className={`w-3 h-3 ${stepColor}`} /> :
                               <Clock className={`w-3 h-3 ${stepColor}`} />}
                            </div>
                            <span className="text-[10px] font-bold text-white/30 uppercase w-16 shrink-0">{step.nodeType}</span>
                            <span className="text-xs text-white/50 flex-1 truncate">{step.nodeId}</span>
                            {step.error && <span className="text-[10px] text-red-400/60 truncate max-w-[200px]">{step.error}</span>}
                            <span className="text-[10px] text-white/15 shrink-0">{duration(step.startedAt, step.endedAt)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {expandedRun === run.id && run.steps.length === 0 && (
                  <div className="border-t border-white/[0.05] px-5 py-3 bg-white/[0.01] text-xs text-white/20 text-center">
                    No step details recorded for this run
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
