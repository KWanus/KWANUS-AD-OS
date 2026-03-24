"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
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
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const STAGES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  lead:      { label: "Lead",      color: "text-white/40",   bg: "bg-white/5",        border: "border-white/10" },
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

function ClientRow({ client, onDelete }: { client: Client; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const stage = STAGES[client.pipelineStage] ?? STAGES.lead;

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
      className="group flex items-center gap-4 px-5 py-4 hover:bg-white/[0.025] border-b border-white/[0.04] transition-colors"
    >
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
        </div>
      </div>

      {/* Stage */}
      <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${stage.border} ${stage.bg} ${stage.color}`}>
        {stage.label}
      </span>

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
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center mb-5">
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition-opacity"
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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [healthFilter, setHealthFilter] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (stageFilter) params.set("stage", stageFilter);
      if (healthFilter) params.set("health", healthFilter);
      if (sortBy) params.set("sortBy", sortBy);

      const res = await fetch(`/api/clients?${params}`);
      const data = await res.json() as { ok: boolean; clients?: Client[]; total?: number };
      if (data.ok) {
        setClients(data.clients ?? []);
        setTotal(data.total ?? 0);
      }
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

  // Summary stats
  const atRisk = clients.filter((c) => c.healthStatus === "red").length;
  const pipelineValue = clients.reduce((s, c) => s + (c.dealValue ?? 0), 0);
  const active = clients.filter((c) => c.pipelineStage === "active").length;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
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
            <option key={key} value={key} className="bg-[#0d1525]">{label}</option>
          ))}
        </select>

        <select
          value={healthFilter}
          onChange={(e) => setHealthFilter(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/60 focus:outline-none focus:border-cyan-500/50 transition appearance-none cursor-pointer"
        >
          <option value="">All Health</option>
          <option value="green" className="bg-[#0d1525]">Healthy</option>
          <option value="yellow" className="bg-[#0d1525]">At Risk</option>
          <option value="red" className="bg-[#0d1525]">Critical</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/60 focus:outline-none focus:border-cyan-500/50 transition appearance-none cursor-pointer"
        >
          <option value="updatedAt" className="bg-[#0d1525]">Recently Updated</option>
          <option value="healthScore" className="bg-[#0d1525]">Health Score (worst first)</option>
          <option value="dealValue" className="bg-[#0d1525]">Deal Value (highest first)</option>
          <option value="lastContact" className="bg-[#0d1525]">Last Contact</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
        {/* Header row */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-white/[0.06] bg-white/[0.015]">
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
              onDelete={(id) => setClients((prev) => prev.filter((c) => c.id !== id))}
            />
          ))
        )}
      </div>
    </main>
  );
}
