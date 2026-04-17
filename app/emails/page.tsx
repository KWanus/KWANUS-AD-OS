"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import AppNav from "@/components/AppNav";
import DatabaseFallbackNotice from "@/components/DatabaseFallbackNotice";
import CampaignSubNav from "@/components/BuildSubNav";
import {
  Mail,
  Plus,
  X,
  ChevronRight,
  Users,
  TrendingUp,
  DollarSign,
  Zap,
  ShoppingCart,
  CheckCircle,
  Eye,
  RotateCcw,
  Settings,
  Trash2,
  AlertTriangle,
  Loader2,
  BarChart2,
  Activity,
  Copy,
} from "lucide-react";
import { EMAIL_FLOW_TEMPLATES, type EmailFlowTemplate } from "@/src/data/emailFlowTemplates";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TriggerType =
  | "signup"
  | "abandoned_cart"
  | "purchase"
  | "browse_abandon"
  | "win_back"
  | "custom";

type FlowStatus = "draft" | "active" | "paused";
type ExecutionTier = "core" | "elite";

interface EmailFlow {
  id: string;
  name: string;
  trigger: TriggerType;
  status: FlowStatus;
  triggerConfig?: { executionTier?: ExecutionTier };
  enrolled?: number;
  openRate?: number;
  revenue?: number;
  createdAt: string;
  updatedAt: string;
}

interface BusinessProfileSummary {
  businessType: string;
  businessName: string | null;
  niche: string | null;
  mainGoal: string | null;
  activeSystems: string[];
  recommendedSystems?: {
    firstAction?: string;
    strategicSummary?: string;
    prioritizedSystems?: Array<{ slug: string; priority: string; personalizedReason?: string }>;
  } | null;
}

interface StatsSummary {
  effectiveSystemScore?: number;
  unsyncedSystems?: string[];
  databaseUnavailable?: boolean;
  osVerdict?: {
    status?: string;
    label?: string;
    reason?: string;
  };
}

interface EmailDeliveryAlert {
  failedEnrollments: number;
  latestError: string | null;
  latestFailedAt: string | null;
}

// ---------------------------------------------------------------------------
// Trigger config
// ---------------------------------------------------------------------------

const TRIGGER_CONFIG: Record<
  TriggerType,
  {
    label: string;
    description: string;
    icon: React.ElementType;
    border: string;
    bg: string;
    text: string;
    emoji: string;
  }
> = {
  signup: {
    label: "Signup",
    description: "Someone joins your list",
    icon: Users,
    border: "border-[#f5a623]/40",
    bg: "bg-[#f5a623]/10",
    text: "text-[#f5a623]",
    emoji: "🎯",
  },
  abandoned_cart: {
    label: "Abandoned Cart",
    description: "Added to cart, didn't buy",
    icon: ShoppingCart,
    border: "border-yellow-500/40",
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    emoji: "🛒",
  },
  purchase: {
    label: "Purchase",
    description: "Completed order",
    icon: CheckCircle,
    border: "border-green-500/40",
    bg: "bg-green-500/10",
    text: "text-green-400",
    emoji: "✅",
  },
  browse_abandon: {
    label: "Browse Abandon",
    description: "Viewed product, didn't add",
    icon: Eye,
    border: "border-orange-500/40",
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    emoji: "👀",
  },
  win_back: {
    label: "Win-Back",
    description: "Inactive 30+ days",
    icon: RotateCcw,
    border: "border-purple-500/40",
    bg: "bg-purple-500/10",
    text: "text-[#e07850]",
    emoji: "🔁",
  },
  custom: {
    label: "Custom Event",
    description: "Any custom trigger",
    icon: Settings,
    border: "border-white/20",
    bg: "bg-white/5",
    text: "text-white/60",
    emoji: "⚡",
  },
};

const STATUS_CONFIG: Record<
  FlowStatus,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  active: {
    label: "Active",
    dot: "bg-green-400",
    text: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
  draft: {
    label: "Draft",
    dot: "bg-white/30",
    text: "text-white/40",
    bg: "bg-white/5",
    border: "border-white/10",
  },
  paused: {
    label: "Paused",
    dot: "bg-yellow-400",
    text: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
};

function verdictTone(status?: string) {
  if (status === "healthy") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  if (status === "stale") return "border-[#f5a623]/20 bg-[#f5a623]/10 text-[#f5f0e8]";
  return "border-amber-500/20 bg-amber-500/10 text-amber-100";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TriggerBadge({ trigger }: { trigger: TriggerType }) {
  const cfg = TRIGGER_CONFIG[trigger];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${cfg.border} ${cfg.bg} ${cfg.text}`}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: FlowStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${cfg.border} ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex-1 min-w-[140px] bg-white/[0.03] border border-white/[0.06] rounded-2xl px-5 py-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-[11px] text-white/35 font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-black text-white">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Flow Card
// ---------------------------------------------------------------------------

function FlowCard({
  flow,
  onDelete,
}: {
  flow: EmailFlow;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const executionTier: ExecutionTier = flow.triggerConfig?.executionTier === "core" ? "core" : "elite";

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    setDeleting(true);
    try {
      const res = await fetch(`/api/email-flows/${flow.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onDelete(flow.id);
      toast.success("Flow deleted");
    } catch {
      toast.error("Failed to delete flow");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const triggerCfg = TRIGGER_CONFIG[flow.trigger];

  return (
    <div className="group relative bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 hover:border-white/[0.14] hover:bg-white/[0.04] transition-all duration-200 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white truncate mb-1.5">{flow.name}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <TriggerBadge trigger={flow.trigger} />
            <StatusBadge status={flow.status} />
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] ${
              executionTier === "elite"
                ? "border-[#f5a623]/30 bg-[#f5a623]/10 text-[#f5a623]"
                : "border-white/10 bg-white/5 text-white/45"
            }`}>
              {executionTier}
            </span>
          </div>
        </div>
        {confirmDelete ? (
          <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
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
          </div>
        ) : (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const res = await fetch(`/api/email-flows/${flow.id}/clone`, { method: "POST" });
                  const data = await res.json() as { ok: boolean; flow?: { id: string } };
                  if (data.ok && data.flow) {
                    toast.success("Flow duplicated");
                    window.location.href = `/emails/flows/${data.flow.id}`;
                  } else {
                    toast.error("Failed to duplicate flow");
                  }
                } catch { toast.error("Failed to duplicate"); }
              }}
              className="p-1.5 rounded-lg hover:bg-[#f5a623]/10 text-white/20 hover:text-[#f5a623]"
              aria-label="Duplicate flow"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400"
              aria-label="Delete flow"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/[0.03] rounded-xl p-3 text-center">
          <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider mb-1">Enrolled</p>
          <p className="text-sm font-bold text-white">{(flow.enrolled ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-3 text-center">
          <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider mb-1">Open Rate</p>
          <p className={`text-sm font-bold ${triggerCfg.text}`}>
            {flow.openRate != null ? `${flow.openRate}%` : "—"}
          </p>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-3 text-center">
          <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider mb-1">Revenue</p>
          <p className="text-sm font-bold text-green-400">
            {flow.revenue != null ? `$${flow.revenue.toLocaleString()}` : "—"}
          </p>
        </div>
      </div>

      {/* Action */}
      <button
        onClick={() => router.push(`/emails/flows/${flow.id}`)}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.16] text-white/60 hover:text-white text-xs font-semibold transition-all"
      >
        Edit Flow
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-[#e07850]/20 border border-white/10 flex items-center justify-center">
          <Mail className="w-9 h-9 text-[#f5a623]/70" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-[#f5a623] to-[#e07850] flex items-center justify-center">
          <Plus className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
      <h2 className="text-xl font-black text-white mb-2">Build Your First Flow</h2>
      <p className="text-sm text-white/40 max-w-sm mb-4 leading-relaxed">
        Automate your email marketing with flows that trigger at the right moment. Create one manually or let Himalaya build it for you.
      </p>
      <div className="flex items-center justify-center gap-2 mb-6 text-[10px] text-white/20 font-bold">
        <span className="bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded">Run Himalaya</span>
        <span className="text-white/10">→</span>
        <span className="bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded">Deploy</span>
        <span className="text-white/10">→</span>
        <span className="bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded">Email flow auto-created</span>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onCreateClick}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-white text-sm font-bold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Create Your First Flow
        </button>
      </div>
      <div className="mt-12 grid grid-cols-3 gap-6 max-w-sm">
        {[
          { icon: Zap, label: "Smart triggers" },
          { icon: BarChart2, label: "Real-time analytics" },
          { icon: DollarSign, label: "Revenue tracking" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
              <Icon className="w-4.5 h-4.5 text-white/30" />
            </div>
            <span className="text-[11px] text-white/25 font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Flow Modal
// ---------------------------------------------------------------------------

function CreateFlowModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (flow: EmailFlow) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState<TriggerType>("signup");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [executionTier, setExecutionTier] = useState<ExecutionTier>("elite");

  useEffect(() => {
    if (!open) {
      setName("");
      setTrigger("signup");
      setCreating(false);
      setError(null);
      setSelectedTemplate(null);
      setExecutionTier("elite");
    }
  }, [open]);

  function handleSelectTemplate(tpl: EmailFlowTemplate) {
    setSelectedTemplate(tpl.id);
    if (!name) setName(tpl.name);
    setTrigger(tpl.trigger as TriggerType);
  }

  async function handleCreate() {
    if (!name.trim()) {
      setError("Flow name is required.");
      return;
    }
    setCreating(true);
    setError(null);

    try {
      const tpl = selectedTemplate
        ? EMAIL_FLOW_TEMPLATES.find((t) => t.id === selectedTemplate)
        : null;

      const res = await fetch("/api/email-flows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          trigger,
          executionTier,
          nodes: tpl?.nodes ?? [],
          edges: tpl?.edges ?? [],
          tags: tpl?.tags ?? [],
        }),
      });

      const data = (await res.json()) as { ok: boolean; flow?: EmailFlow; error?: string };

      if (!data.ok || !data.flow) {
        throw new Error(data.error ?? "Failed to create flow");
      }

      onCreated(data.flow);
      router.push(`/emails/flows/${data.flow.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setCreating(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#0a1628] border border-white/[0.1] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#0a1628] border-b border-white/[0.06] px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-base font-black text-white">Create Email Flow</h2>
            <p className="text-xs text-white/35 mt-0.5">Name it, pick a trigger, or start from a template</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              Flow Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Welcome Series"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 focus:bg-white/[0.06] transition"
            />
          </div>

          {/* Trigger selector */}
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              Trigger
            </label>
            <div className="grid grid-cols-1 gap-2">
              {(Object.entries(TRIGGER_CONFIG) as [TriggerType, (typeof TRIGGER_CONFIG)[TriggerType]][]).map(
                ([key, cfg]) => {
                  const Icon = cfg.icon;
                  const active = trigger === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setTrigger(key)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                        active
                          ? `${cfg.border} ${cfg.bg} ${cfg.text}`
                          : "border-white/[0.06] bg-white/[0.02] text-white/50 hover:bg-white/[0.04] hover:text-white/70"
                      }`}
                    >
                      <span className="text-base w-5 text-center select-none">{cfg.emoji}</span>
                      <Icon className={`w-4 h-4 shrink-0 ${active ? cfg.text : "text-white/30"}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${active ? cfg.text : "text-white/60"}`}>
                          {cfg.label}
                        </p>
                        <p className="text-xs text-white/30">{cfg.description}</p>
                      </div>
                      {active && (
                        <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.text.replace("text-", "bg-")}`} />
                      )}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              Execution Lane
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                {
                  id: "core" as const,
                  label: "Core",
                  description: "Fast, strong automation work that ships cleanly.",
                },
                {
                  id: "elite" as const,
                  label: "Elite",
                  description: "Sharper premium email systems with stronger persuasion and retention framing.",
                },
              ].map((tier) => {
                const active = executionTier === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setExecutionTier(tier.id)}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      active
                        ? "border-[#f5a623]/40 bg-[#f5a623]/10 shadow-[0_0_20px_rgba(245,166,35,0.12)]"
                        : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className={`text-sm font-black ${active ? "text-[#f5a623]" : "text-white"}`}>{tier.label}</span>
                      <span className={`text-[10px] font-black uppercase tracking-[0.24em] ${active ? "text-[#f5a623]" : "text-white/20"}`}>
                        {tier.id}
                      </span>
                    </div>
                    <p className={`mt-2 text-xs leading-relaxed ${active ? "text-[#f5f0e8]/80" : "text-white/45"}`}>
                      {tier.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Templates */}
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">
              Start from a Template
            </label>
            <p className="text-[11px] text-white/25 mb-3">Optional — pre-built flows you can customise</p>
            <div className="grid grid-cols-1 gap-2">
              {EMAIL_FLOW_TEMPLATES.map((tpl) => {
                const tCfg = TRIGGER_CONFIG[tpl.trigger as TriggerType];
                const isSelected = selectedTemplate === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? `${tCfg.border} ${tCfg.bg}`
                        : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border ${tCfg.border} ${tCfg.bg}`}
                    >
                      <tCfg.icon className={`w-3.5 h-3.5 ${tCfg.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-bold ${isSelected ? tCfg.text : "text-white/70"}`}>
                          {tpl.name}
                        </span>
                        <span className="text-[10px] text-white/25 font-medium">
                          {tpl.emailCount} emails
                        </span>
                        <span
                          className={`text-[10px] font-semibold border px-1.5 py-0.5 rounded-md ${tCfg.border} ${tCfg.bg} ${tCfg.text}`}
                        >
                          {tCfg.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/30 mt-0.5 leading-relaxed">{tpl.description}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${tCfg.text}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#0a1628] border-t border-white/[0.06] px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/[0.1] text-white/40 hover:text-white/60 text-sm font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Create Flow
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EmailsPageWrapper() {
  return (
    <Suspense>
      <EmailsPage />
    </Suspense>
  );
}

function EmailsPage() {
  const searchParams = useSearchParams();
  const [flows, setFlows] = useState<EmailFlow[]>([]);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileSummary | null>(null);
  const [osStats, setOsStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [recommendedTemplateId, setRecommendedTemplateId] = useState<string | null>(null);
  const [syncingSystem, setSyncingSystem] = useState(false);
  const [emailDeliveryAlert, setEmailDeliveryAlert] = useState<EmailDeliveryAlert | null>(null);

  // Auto-open create modal when redirected from templates page
  useEffect(() => {
    if (searchParams.get("createFlow") === "1") {
      setModalOpen(true);
      const templateId = searchParams.get("templateId");
      if (templateId) setRecommendedTemplateId(templateId);
    }
  }, [searchParams]);
  const [refreshingRecommendations, setRefreshingRecommendations] = useState(false);

  const fetchFlows = useCallback(async () => {
    try {
      const [flowRes, profileRes, statsRes] = await Promise.all([
        fetch("/api/email-flows"),
        fetch("/api/business-profile"),
        fetch("/api/stats"),
      ]);
      const data = (await flowRes.json()) as { ok: boolean; flows?: EmailFlow[]; emailDeliveryAlert?: EmailDeliveryAlert };
      const profileData = (await profileRes.json()) as { ok: boolean; profile?: BusinessProfileSummary | null };
      const statsData = (await statsRes.json()) as { ok: boolean; stats?: StatsSummary | null };
      if (data.ok && data.flows) setFlows(data.flows);
      if (data.ok && data.emailDeliveryAlert) setEmailDeliveryAlert(data.emailDeliveryAlert);
      if (profileData.ok && profileData.profile) {
        setBusinessProfile(profileData.profile);
        const recommendedSlug = profileData.profile.recommendedSystems?.prioritizedSystems?.find((system) =>
          ["email_sequence", "sms_followup", "abandoned_cart"].includes(system.slug)
        )?.slug;
        if (recommendedSlug === "abandoned_cart") setRecommendedTemplateId("abandoned-cart");
        else if (recommendedSlug === "sms_followup") setRecommendedTemplateId("lead-nurture");
        else setRecommendedTemplateId("welcome-sequence");
      }
      if (statsData.ok && statsData.stats) setOsStats(statsData.stats);
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  function handleFlowCreated(flow: EmailFlow) {
    setFlows((prev) => [flow, ...prev]);
    setModalOpen(false);
  }

  function handleFlowDeleted(id: string) {
    setFlows((prev) => prev.filter((f) => f.id !== id));
  }

  async function createRecommendedFlow() {
    const template = EMAIL_FLOW_TEMPLATES.find((item) => item.id === (recommendedTemplateId ?? "welcome-sequence"))
      ?? EMAIL_FLOW_TEMPLATES[0];
    const res = await fetch("/api/email-flows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: businessProfile?.businessName ? `${businessProfile.businessName} — ${template.name}` : template.name,
        trigger: template.trigger,
        executionTier: "elite",
        nodes: template.nodes ?? [],
        edges: template.edges ?? [],
        tags: template.tags ?? [],
      }),
    });
    const data = (await res.json()) as { ok: boolean; flow?: EmailFlow };
    if (data.ok && data.flow) {
      handleFlowCreated(data.flow);
    }
  }

  async function syncBusinessSystem() {
    try {
      setSyncingSystem(true);
      const res = await fetch("/api/business-profile/sync", { method: "POST" });
      const data = await res.json() as { ok?: boolean };
      if (!res.ok || !data.ok) throw new Error("Failed");
      await fetchFlows();
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
      await fetchFlows();
    } finally {
      setRefreshingRecommendations(false);
    }
  }

  // Stats
  const totalFlows = flows.length;
  const activeFlows = flows.filter((f) => f.status === "active").length;
  const totalEnrolled = flows.reduce((s, f) => s + (f.enrolled ?? 0), 0);
  const avgOpenRate =
    flows.length > 0
      ? Math.round(
          flows.filter((f) => f.openRate != null).reduce((s, f) => s + (f.openRate ?? 0), 0) /
            Math.max(flows.filter((f) => f.openRate != null).length, 1)
        )
      : 0;
  const totalRevenue = flows.reduce((s, f) => s + (f.revenue ?? 0), 0);

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <AppNav />
      <CampaignSubNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {businessProfile && (
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
                    "The email workspace is reading the same Business OS health layer as Home, Copilot, and My System."}
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
                    className="inline-flex items-center gap-2 rounded-2xl border border-[#f5a623]/20 bg-[#f5a623]/10 px-5 py-3 text-sm font-bold text-[#f5f0e8] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {refreshingRecommendations ? "Refreshing..." : "Refresh Recommendations"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <DatabaseFallbackNotice visible={osStats?.databaseUnavailable} className="mb-6" />

        {(emailDeliveryAlert?.failedEnrollments ?? 0) > 0 && (
          <div className="mb-6 flex items-start gap-3 rounded-[24px] border border-amber-500/20 bg-amber-500/10 px-5 py-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <div className="min-w-0">
              <p className="text-sm font-black text-amber-100">Email follow-up needs attention</p>
              <p className="mt-1 text-xs leading-6 text-amber-100/75">
                {emailDeliveryAlert?.failedEnrollments} enrollment{emailDeliveryAlert?.failedEnrollments === 1 ? "" : "s"} failed in the last 24 hours.
                {emailDeliveryAlert?.latestError ? ` Latest issue: ${emailDeliveryAlert.latestError}` : ""}
              </p>
              <div className="mt-2">
                <button
                  onClick={() => window.location.assign("/settings")}
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-400/20 bg-black/10 px-3 py-2 text-xs font-bold text-amber-100 hover:bg-black/20"
                >
                  Open Email Delivery Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {businessProfile && (
          <div className="mb-6 rounded-[28px] border border-[#f5a623]/20 bg-gradient-to-br from-cyan-500/[0.08] to-[#e07850]/[0.03] p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#f5a623]/70">Recommended Email System</p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  {recommendedTemplateId === "abandoned-cart"
                    ? "Abandoned Cart Recovery"
                    : recommendedTemplateId === "lead-nurture"
                      ? "Lead Follow-Up Sequence"
                      : "Welcome / Nurture Sequence"} for {businessProfile.niche || businessProfile.businessType.replace(/_/g, " ")}
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/62">
                  {businessProfile.recommendedSystems?.firstAction ||
                    businessProfile.recommendedSystems?.strategicSummary ||
                    "Your Business OS says email automation should be one of the next systems you turn on."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => void createRecommendedFlow()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#f5a623] to-[#e07850] px-5 py-3 text-sm font-black text-white shadow-[0_0_30px_rgba(245,166,35,0.22)]"
                >
                  <Zap className="w-4 h-4" />
                  Create Recommended Flow
                </button>
                <button
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/70"
                >
                  <Plus className="w-4 h-4" />
                  Create Custom Flow
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page header */}
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Email Flows</h1>
            <p className="text-sm text-white/35 mt-1">
              Automate your email marketing with behaviour-triggered sequences
            </p>
          </div>
          {flows.length > 0 && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-white text-sm font-bold hover:opacity-90 transition-opacity shrink-0"
            >
              <Plus className="w-4 h-4" />
              Create Flow
            </button>
          )}
        </div>

        {/* Stats bar */}
        {flows.length > 0 && (
          <div className="flex gap-3 flex-wrap mb-8">
            <StatCard label="Total Flows" value={totalFlows} icon={Mail} color="text-[#f5a623]" />
            <StatCard label="Active" value={activeFlows} icon={Activity} color="text-green-400" />
            <StatCard
              label="Total Enrolled"
              value={totalEnrolled.toLocaleString()}
              icon={Users}
              color="text-[#e07850]"
            />
            <StatCard
              label="Avg Open Rate"
              value={avgOpenRate > 0 ? `${avgOpenRate}%` : "—"}
              icon={TrendingUp}
              color="text-yellow-400"
            />
            <StatCard
              label="Total Revenue"
              value={totalRevenue > 0 ? `$${totalRevenue.toLocaleString()}` : "—"}
              icon={DollarSign}
              color="text-green-400"
            />
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
          </div>
        ) : flows.length === 0 ? (
          <EmptyState onCreateClick={() => setModalOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {flows.map((flow) => (
              <FlowCard key={flow.id} flow={flow} onDelete={handleFlowDeleted} />
            ))}
          </div>
        )}
      </main>

      <CreateFlowModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleFlowCreated}
      />
    </div>
  );
}
