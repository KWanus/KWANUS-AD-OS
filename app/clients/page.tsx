"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Search,
  Filter,
  Users,
  Building2,
  Mail,
  Phone,
  Tag,
  TrendingUp,
  DollarSign,
  Loader2,
  ChevronRight,
  AlertTriangle,
  ArrowUpDown,
  Trash2,
} from "lucide-react";
import DatabaseFallbackNotice from "@/components/DatabaseFallbackNotice";

type BusinessProfileSummary = {
  businessType: string;
  businessName: string | null;
  niche: string | null;
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  niche?: string;
  tags: string[];
  pipelineStage: string;
  dealValue?: number;
  healthScore: number;
  healthStatus: "green" | "yellow" | "red";
  lastContactAt?: string;
  priority: string;
  createdAt: string;
  _count: { activities: number };
  executionTier?: "core" | "elite";
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const STAGES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  lead:      { label: "Lead",      color: "text-white/40",   bg: "bg-white/[0.03]",        border: "border-white/10" },
  qualified: { label: "Qualified", color: "text-cyan-400",   bg: "bg-cyan-500/10",    border: "border-cyan-500/20" },
  proposal:  { label: "Proposal",  color: "text-blue-400",   bg: "bg-blue-500/10",    border: "border-blue-500/20" },
  active:    { label: "Active",    color: "text-green-400",  bg: "bg-green-500/10",   border: "border-green-500/20" },
  won:       { label: "Won",       color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  churned:   { label: "Churned",   color: "text-red-400",    bg: "bg-red-500/10",     border: "border-red-500/20" },
};

const HEALTH_CONFIG = {
  green:  { label: "Healthy",    dot: "bg-green-400",  text: "text-green-400",  ring: "ring-green-500/20" },
  yellow: { label: "At Risk",    dot: "bg-amber-400",  text: "text-amber-400",  ring: "ring-amber-500/20" },
  red:    { label: "Critical",   dot: "bg-red-400",    text: "text-red-400",    ring: "ring-red-500/20" },
};

function verdictTone(status?: string) {
  if (status === "healthy") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  if (status === "stale") return "border-cyan-500/20 bg-cyan-500/10 text-cyan-100";
  return "border-amber-500/20 bg-amber-500/10 text-amber-100";
}

// ---------------------------------------------------------------------------
// Health Badge
// ---------------------------------------------------------------------------

function HealthBadge({ score, status }: { score: number; status: string }) {
  const cfg = HEALTH_CONFIG[status as keyof typeof HEALTH_CONFIG] ?? HEALTH_CONFIG.yellow;
  return (
    <div
      title={`Health score: ${score}/100 — based on last contact, deal stage, and activity. ${cfg.label} (${score >= 70 ? "70+" : score >= 40 ? "40–69" : "< 40"})`}
      className={`flex items-center gap-2 ring-1 ${cfg.ring} rounded-lg px-2.5 py-1.5 cursor-help`}
    >
      <div className="relative">
        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
          <circle
            cx="16" cy="16" r="12"
            fill="none"
            stroke={status === "green" ? "#10b981" : status === "red" ? "#ef4444" : "#f59e0b"}
            strokeWidth="3"
            strokeDasharray={`${(score / 100) * 75.4} 75.4`}
            strokeLinecap="round"
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-[9px] font-black ${cfg.text}`}>
          {score}
        </span>
      </div>
      <div>
        <p className={`text-[9px] font-black uppercase tracking-wider ${cfg.text}`}>{cfg.label}</p>
        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} mt-0.5`} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Client Row
// ---------------------------------------------------------------------------

function ClientRow({ client, onDelete, onUpdate, selected, onToggle }: { client: Client; onDelete: (id: string) => void; onUpdate?: (id: string, data: Partial<Client>) => void; selected?: boolean; onToggle?: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [changingStage, setChangingStage] = useState(false);
  const stage = STAGES[client.pipelineStage] ?? STAGES.lead;

  async function handleStageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    e.preventDefault();
    e.stopPropagation();
    const newStage = e.target.value;
    if (newStage === client.pipelineStage) return;
    setChangingStage(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipelineStage: newStage }),
      });
      const data = await res.json() as { ok: boolean; client?: Client };
      if (data.ok && data.client && onUpdate) {
        onUpdate(client.id, { pipelineStage: newStage, healthScore: data.client.healthScore, healthStatus: data.client.healthStatus });
        toast.success(`Moved to ${newStage}`);
      }
    } catch {
      toast.error("Failed to change stage");
    } finally {
      setChangingStage(false);
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(true);
    try {
      await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
      onDelete(client.id);
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <Link
      href={`/clients/${client.id}`}
      className="group flex items-center gap-4 px-5 py-4 hover:bg-white/[0.025] hover:shadow-[inset_0_0_30px_rgba(6,182,212,0.02)] border-b border-white/[0.04] transition-all"
    >
      {/* Select checkbox */}
      <input
        type="checkbox"
        checked={selected ?? false}
        onChange={(e) => { e.preventDefault(); e.stopPropagation(); onToggle?.(); }}
        onClick={(e) => e.stopPropagation()}
        className="w-3.5 h-3.5 rounded accent-cyan-500 shrink-0"
      />

      {/* Avatar */}
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center text-sm font-black text-white/70 shrink-0">
        {client.name.charAt(0).toUpperCase()}
      </div>

      {/* Name + company */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
          {client.name}
        </p>
      <div className="flex items-center gap-2 mt-0.5">
          {client.company && (
            <span className="text-[11px] text-white/35 truncate flex items-center gap-1">
              <Building2 className="w-2.5 h-2.5 shrink-0" />
              {client.company}
            </span>
          )}
          {client.niche && (
            <span className="text-[10px] text-purple-400/60 font-medium">{client.niche}</span>
          )}
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
            client.executionTier === "core" ? "text-white/35" : "text-cyan-300/80"
          }`}>
            {client.executionTier ?? "elite"}
          </span>
        </div>
      </div>

      {/* Stage — click to change */}
      <select
        value={client.pipelineStage}
        onChange={handleStageChange}
        onClick={e => { e.preventDefault(); e.stopPropagation(); }}
        disabled={changingStage}
        className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 cursor-pointer outline-none appearance-none bg-transparent ${stage.border} ${stage.bg} ${stage.color} ${changingStage ? "opacity-50" : ""}`}
      >
        {Object.entries(STAGES).map(([key, { label }]) => (
          <option key={key} value={key} className="bg-[#020509] text-white">{label}</option>
        ))}
      </select>

      {/* Deal value */}
      <div className="hidden lg:block w-24 text-right shrink-0">
        {client.dealValue ? (
          <span className="text-sm font-bold text-green-400">${client.dealValue.toLocaleString()}</span>
        ) : (
          <span className="text-xs text-white/20">—</span>
        )}
      </div>

      {/* Last contact */}
      <div className="hidden xl:block w-32 text-right shrink-0">
        {client.lastContactAt ? (
          <span className="text-[11px] text-white/35">
            {formatDistanceToNow(new Date(client.lastContactAt), { addSuffix: true })}
          </span>
        ) : (
          <span className="text-[11px] text-amber-400/60 flex items-center justify-end gap-1">
            <AlertTriangle className="w-2.5 h-2.5" /> Never
          </span>
        )}
      </div>

      {/* Health */}
      <div className="shrink-0">
        <HealthBadge score={client.healthScore} status={client.healthStatus} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
        {confirmDelete ? (
          <>
            <button
              onClick={(e) => void handleDelete(e)}
              disabled={deleting}
              className="px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 text-[11px] font-black hover:bg-red-500/30 transition disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delete"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.07] text-white/40 text-[11px] font-semibold hover:text-white transition"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Skeleton Row
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-white/[0.04]">
      <div className="w-9 h-9 rounded-xl bg-white/[0.04] animate-pulse shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 bg-white/[0.04] rounded-lg animate-pulse w-40" />
        <div className="h-2.5 bg-white/[0.04] rounded animate-pulse w-24" />
      </div>
      <div className="h-5 w-16 bg-white/[0.04] rounded-md animate-pulse hidden sm:block" />
      <div className="h-5 w-14 bg-white/[0.04] rounded animate-pulse hidden lg:block" />
      <div className="h-5 w-24 bg-white/[0.04] rounded animate-pulse hidden xl:block" />
      <div className="h-10 w-20 bg-white/[0.04] rounded-lg animate-pulse" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-600/10 border border-white/[0.08] backdrop-blur-sm flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(6,182,212,0.06)]">
        <Users className="w-7 h-7 text-cyan-400/70" />
      </div>
      {filtered ? (
        <>
          <h2 className="text-lg font-black text-white mb-2">No clients match your filters</h2>
          <p className="text-sm text-white/35 max-w-xs">Try adjusting your search or filter criteria.</p>
        </>
      ) : (
        <>
          <h2 className="text-lg font-black text-white mb-2">No clients yet</h2>
          <p className="text-sm text-white/35 max-w-xs mb-6 leading-relaxed">
            Add your first client to start tracking relationships, pipeline stages, and health scores — all in one place.
          </p>
          <Link
            href="/clients/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-sm font-bold transition shadow-[0_0_15px_rgba(6,182,212,0.15)]"
          >
            Add Your First Client
          </Link>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileSummary | null>(null);
  const [osStats, setOsStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [healthFilter, setHealthFilter] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [syncingSystem, setSyncingSystem] = useState(false);
  const [refreshingRecommendations, setRefreshingRecommendations] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkStage, setBulkStage] = useState("lead");
  const [bulkTags, setBulkTags] = useState("");

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (stageFilter) params.set("stage", stageFilter);
      if (healthFilter) params.set("health", healthFilter);
      if (sortBy) params.set("sortBy", sortBy);

      const [clientRes, profileRes, statsRes] = await Promise.all([
        fetch(`/api/clients?${params}`),
        fetch("/api/business-profile"),
        fetch("/api/stats"),
      ]);
      const data = await clientRes.json() as { ok: boolean; clients?: Client[]; total?: number };
      const profileData = await profileRes.json() as { ok: boolean; profile?: BusinessProfileSummary | null };
      const statsData = await statsRes.json() as { ok: boolean; stats?: StatsSummary | null };
      if (data.ok) {
        setClients(data.clients ?? []);
        setTotal(data.total ?? 0);
      }
      if (profileData.ok) setBusinessProfile(profileData.profile ?? null);
      if (statsData.ok) setOsStats(statsData.stats ?? null);
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, [search, stageFilter, healthFilter, sortBy]);

  useEffect(() => {
    const t = setTimeout(fetchClients, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchClients, search]);

  const isFiltered = !!(search || stageFilter || healthFilter);

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === clients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(clients.map(c => c.id)));
    }
  }

  async function executeBulkAction() {
    if (!bulkAction || selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const body: Record<string, unknown> = { action: bulkAction, clientIds: [...selectedIds] };
      if (bulkAction === "stage_change") body.pipelineStage = bulkStage;
      if (bulkAction === "add_tags") {
        const tags = bulkTags.split(",").map(t => t.trim()).filter(Boolean);
        if (tags.length === 0) { toast.error("Enter at least one tag"); setBulkLoading(false); return; }
        body.tags = tags;
      }
      const res = await fetch("/api/clients/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { ok: boolean; affected?: number; error?: string };
      if (data.ok) {
        toast.success(`${bulkAction.replace("_", " ")} applied to ${data.affected ?? selectedIds.size} client(s)`);
        setSelectedIds(new Set());
        setBulkAction("");
        setBulkTags("");
        await fetchClients();
      } else {
        toast.error(data.error ?? "Bulk action failed");
      }
    } catch {
      toast.error("Something went wrong — please try again");
    } finally {
      setBulkLoading(false);
    }
  }

  // Summary stats
  const atRisk = clients.filter((c) => c.healthStatus === "red").length;
  const pipelineValue = clients.reduce((s, c) => s + (c.dealValue ?? 0), 0);
  const active = clients.filter((c) => c.pipelineStage === "active").length;

  async function syncBusinessSystem() {
    try {
      setSyncingSystem(true);
      const res = await fetch("/api/business-profile/sync", { method: "POST" });
      const data = await res.json() as { ok?: boolean };
      if (!res.ok || !data.ok) throw new Error("Failed");
      await fetchClients();
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
      await fetchClients();
    } finally {
      setRefreshingRecommendations(false);
    }
  }

  return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
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
                    "The CRM workspace now reads the same Business OS health layer as the rest of the app."}
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

          <div className="mb-6 rounded-[28px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.08] to-emerald-500/[0.03] p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-cyan-200/70">Recommended CRM Move</p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  Turn {businessProfile.niche || businessProfile.businessType.replace(/_/g, " ")} prospects into tracked relationships
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/62">
                  {businessProfile.recommendedSystems?.firstAction ||
                    businessProfile.recommendedSystems?.strategicSummary ||
                    "Your Business OS can now steer the CRM layer too, so pipeline follow-up and client management stay connected to the rest of your system."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/clients/new"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-3 text-sm font-black text-white shadow-[0_0_30px_rgba(6,182,212,0.22)]"
                >
                  Add Client
                </Link>
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
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Clients</h1>
          <p className="text-sm text-white/35 mt-0.5">
            {loading ? "Loading..." : `${total.toLocaleString()} client${total !== 1 ? "s" : ""}`}
            {atRisk > 0 && (
              <span className="ml-2 text-red-400 font-semibold">
                · {atRisk} at risk
              </span>
            )}
          </p>
        </div>

        {/* Quick stats */}
        {clients.length > 0 && !loading && (
          <div className="flex gap-3">
            {[
              { label: "Active", value: active, color: "text-green-400" },
              { label: "Pipeline", value: `$${(pipelineValue / 1000).toFixed(0)}k`, color: "text-cyan-400" },
              { label: "At Risk", value: atRisk, color: "text-red-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2 text-center">
                <p className={`text-base font-black ${color}`}>{value}</p>
                <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      {clients.length > 0 && !loading && (
        <div className="flex items-center gap-2 mb-4">
          <Link
            href="/clients/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold hover:opacity-90 transition"
          >
            <Users className="w-3.5 h-3.5" /> Add Client
          </Link>
          <a
            href="/api/clients/export"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/50 text-xs font-semibold hover:text-white hover:border-white/20 transition"
          >
            Export CSV
          </a>
        </div>
      )}

      {/* Quick filter chips */}
      {!loading && clients.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {[
            { label: "At Risk", filter: () => { setHealthFilter("red"); setStageFilter(""); }, active: healthFilter === "red" },
            { label: "Needs Attention", filter: () => { setHealthFilter("yellow"); setStageFilter(""); }, active: healthFilter === "yellow" },
            { label: "Active Deals", filter: () => { setStageFilter("active"); setHealthFilter(""); }, active: stageFilter === "active" },
            { label: "Won", filter: () => { setStageFilter("won"); setHealthFilter(""); }, active: stageFilter === "won" },
            { label: "Leads", filter: () => { setStageFilter("lead"); setHealthFilter(""); }, active: stageFilter === "lead" },
          ].map(chip => (
            <button
              key={chip.label}
              onClick={() => { if (chip.active) { setHealthFilter(""); setStageFilter(""); } else chip.filter(); }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
                chip.active
                  ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                  : "bg-white/[0.03] text-white/30 border border-white/[0.06] hover:text-white/50 hover:border-white/[0.12]"
              }`}
            >
              {chip.label}
            </button>
          ))}
          {(healthFilter || stageFilter) && (
            <button onClick={() => { setHealthFilter(""); setStageFilter(""); }} className="text-[10px] text-white/25 hover:text-white/50 transition">
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
          />
        </div>

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/60 focus:outline-none focus:border-cyan-500/50 transition appearance-none cursor-pointer"
        >
          <option value="">All Stages</option>
          {Object.entries(STAGES).map(([key, { label }]) => (
            <option key={key} value={key} className="bg-[#020509]">{label}</option>
          ))}
        </select>

        <select
          value={healthFilter}
          onChange={(e) => setHealthFilter(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/60 focus:outline-none focus:border-cyan-500/50 transition appearance-none cursor-pointer"
        >
          <option value="">All Health</option>
          <option value="green" className="bg-[#020509]">Healthy</option>
          <option value="yellow" className="bg-[#020509]">At Risk</option>
          <option value="red" className="bg-[#020509]">Critical</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/60 focus:outline-none focus:border-cyan-500/50 transition appearance-none cursor-pointer"
        >
          <option value="updatedAt" className="bg-[#020509]">Recently Updated</option>
          <option value="healthScore" className="bg-[#020509]">Health Score (worst first)</option>
          <option value="dealValue" className="bg-[#020509]">Deal Value (highest first)</option>
          <option value="lastContact" className="bg-[#020509]">Last Contact</option>
        </select>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 px-4 py-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-cyan-300">{selectedIds.size} selected</span>
            <select
              value={bulkAction}
              onChange={e => { setBulkAction(e.target.value); setBulkTags(""); }}
              className="bg-white/[0.06] border border-white/[0.1] rounded-lg px-2 py-1.5 text-xs text-white/60 outline-none"
            >
              <option value="">Choose action...</option>
              <option value="stage_change">Change stage</option>
              <option value="add_tags">Add tags</option>
              <option value="recalculate_health">Recalculate health</option>
              <option value="delete">Delete</option>
            </select>

            {/* Stage picker */}
            {bulkAction === "stage_change" && (
              <select value={bulkStage} onChange={e => setBulkStage(e.target.value)} className="bg-white/[0.06] border border-white/[0.1] rounded-lg px-2 py-1.5 text-xs text-white/60 outline-none">
                <option value="lead">Lead</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="active">Active</option>
                <option value="won">Won</option>
                <option value="churned">Churned</option>
              </select>
            )}

            {/* Tags input */}
            {bulkAction === "add_tags" && (
              <input
                type="text"
                value={bulkTags}
                onChange={e => setBulkTags(e.target.value)}
                placeholder="vip, priority, retainer"
                className="bg-white/[0.06] border border-white/[0.1] rounded-lg px-2 py-1.5 text-xs text-white placeholder-white/25 outline-none w-48"
              />
            )}

            {/* Delete warning */}
            {bulkAction === "delete" && (
              <span className="text-[10px] text-red-400 font-bold">This will permanently delete {selectedIds.size} client(s)</span>
            )}

            <button
              onClick={() => void executeBulkAction()}
              disabled={!bulkAction || bulkLoading}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-40 ${
                bulkAction === "delete"
                  ? "bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
                  : "bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30"
              }`}
            >
              {bulkLoading ? "Running..." : bulkAction === "delete" ? "Delete" : "Apply"}
            </button>
            <button
              onClick={() => { setSelectedIds(new Set()); setBulkAction(""); setBulkTags(""); }}
              className="text-xs text-white/30 hover:text-white/60 transition ml-auto"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
        {/* Header row */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-white/[0.06] bg-white/[0.015]">
          <input
            type="checkbox"
            checked={clients.length > 0 && selectedIds.size === clients.length}
            onChange={toggleSelectAll}
            className="w-3.5 h-3.5 rounded accent-cyan-500 shrink-0"
          />
          <div className="w-9 shrink-0" />
          <div className="flex-1 text-[10px] font-black uppercase tracking-widest text-white/25">Client</div>
          <div className="hidden sm:block w-20 text-[10px] font-black uppercase tracking-widest text-white/25">Stage</div>
          <div className="hidden lg:block w-24 text-right text-[10px] font-black uppercase tracking-widest text-white/25">Value</div>
          <div className="hidden xl:block w-32 text-right text-[10px] font-black uppercase tracking-widest text-white/25">Last Contact</div>
          <div className="text-[10px] font-black uppercase tracking-widest text-white/25">Health</div>
          <div className="w-16 shrink-0" />
        </div>

        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
        ) : clients.length === 0 ? (
          <EmptyState filtered={isFiltered} />
        ) : (
          clients.map((client) => (
            <ClientRow
              key={client.id}
              client={client}
              selected={selectedIds.has(client.id)}
              onToggle={() => toggleSelect(client.id)}
              onDelete={(id) => setClients((prev) => prev.filter((c) => c.id !== id))}
              onUpdate={(id, data) => setClients((prev) => prev.map(c => c.id === id ? { ...c, ...data } as Client : c))}
            />
          ))
        )}
      </div>

      {/* Load more */}
      {clients.length < total && !loading && (
        <div className="mt-4 text-center">
          <button
            onClick={async () => {
              try {
                const params = new URLSearchParams();
                if (search) params.set("search", search);
                if (stageFilter) params.set("stage", stageFilter);
                if (healthFilter) params.set("health", healthFilter);
                if (sortBy) params.set("sortBy", sortBy);
                params.set("page", String(Math.floor(clients.length / 50) + 1));
                const res = await fetch(`/api/clients?${params}`);
                const data = await res.json() as { ok: boolean; clients?: Client[] };
                if (data.ok && data.clients) {
                  setClients(prev => [...prev, ...data.clients!]);
                }
              } catch { /* non-fatal */ }
            }}
            className="px-5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/50 text-xs font-bold hover:text-white hover:border-white/[0.15] transition"
          >
            Load more ({total - clients.length} remaining)
          </button>
        </div>
      )}
    </main>
  );
}
