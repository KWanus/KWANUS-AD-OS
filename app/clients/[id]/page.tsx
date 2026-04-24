"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  Building2,
  Tag,
  Edit2,
  Check,
  X,
  MessageSquare,
  Phone as PhoneIcon,
  Calendar,
  FileText,
  Zap,
  Sparkles,
  ChevronDown,
  DollarSign,
  Loader2,
  Send,
  AlertTriangle,
  Layers,
} from "lucide-react";
import DatabaseFallbackNotice from "@/components/DatabaseFallbackNotice";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Activity {
  id: string;
  type: string;
  content?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  createdBy?: string;
}

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  website?: string;
  niche?: string;
  tags: string[];
  pipelineStage: string;
  dealValue?: number;
  healthScore: number;
  healthStatus: "green" | "yellow" | "red";
  lastContactAt?: string;
  priority: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  activities: Activity[];
  executionTier?: ExecutionTier;
}

type ExecutionTier = "core" | "elite";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const STAGES = ["lead", "qualified", "proposal", "active", "won", "churned"];

const STAGE_COLORS: Record<string, string> = {
  lead: "text-white/40",
  qualified: "text-[#f5a623]",
  proposal: "text-blue-400",
  active: "text-green-400",
  won: "text-emerald-400",
  churned: "text-red-400",
};

const ACTIVITY_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  email:        { icon: Mail,         color: "text-[#e07850]",  label: "Email" },
  call:         { icon: PhoneIcon,    color: "text-green-400",   label: "Call" },
  meeting:      { icon: Calendar,     color: "text-blue-400",    label: "Meeting" },
  note:         { icon: FileText,     color: "text-white/50",    label: "Note" },
  stage_change: { icon: Layers,       color: "text-[#f5a623]",    label: "Stage Change" },
  task:         { icon: Check,        color: "text-amber-400",   label: "Task" },
  sms:          { icon: MessageSquare, color: "text-pink-400",   label: "SMS" },
};

// ---------------------------------------------------------------------------
// Health Ring
// ---------------------------------------------------------------------------

function HealthRing({ score, status }: { score: number; status: string }) {
  const color = status === "green" ? "#10b981" : status === "red" ? "#ef4444" : "#f59e0b";
  return (
    <div className="relative w-16 h-16">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle
          cx="32" cy="32" r="26"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={`${(score / 100) * 163.4} 163.4`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-black text-white">{score}</span>
        <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">health</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Activity Item
// ---------------------------------------------------------------------------

function ActivityItem({ activity }: { activity: Activity }) {
  const cfg = ACTIVITY_CONFIG[activity.type] ?? ACTIVITY_CONFIG.note;
  const Icon = cfg.icon;
  const meta = activity.metadata as Record<string, string> | undefined;

  return (
    <div className="flex gap-3 group">
      <div className={`w-7 h-7 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center shrink-0 mt-0.5`}>
        <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0 pb-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[11px] font-bold ${cfg.color}`}>{cfg.label}</span>
          <span className="text-[10px] text-white/25">
            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
          </span>
        </div>
        {activity.content && (
          <p className="text-xs text-white/60 leading-relaxed">{activity.content}</p>
        )}
        {activity.type === "stage_change" && meta?.from && meta?.to && (
          <p className="text-xs text-white/40">
            <span className="text-white/30">{meta.from}</span>
            <span className="mx-2 text-[#f5a623]/50">→</span>
            <span className={STAGE_COLORS[meta.to] ?? "text-white/60"}>{meta.to}</span>
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI Assist Panel
// ---------------------------------------------------------------------------

function TagAdder({ onAdd }: { onAdd: (tag: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[10px] font-bold text-white/20 bg-white/[0.03] border border-dashed border-white/[0.1] px-2 py-0.5 rounded-md hover:text-white/40 hover:border-white/20 transition"
      >
        + tag
      </button>
    );
  }

  return (
    <input
      autoFocus
      value={value}
      onChange={e => setValue(e.target.value)}
      onKeyDown={e => {
        if (e.key === "Enter" && value.trim()) {
          onAdd(value.trim().toLowerCase());
          setValue("");
          setOpen(false);
        }
        if (e.key === "Escape") { setValue(""); setOpen(false); }
      }}
      onBlur={() => { if (!value.trim()) setOpen(false); }}
      placeholder="tag name"
      className="text-[10px] font-bold text-[#f5a623] bg-[#f5a623]/10 border border-[#f5a623]/30 px-2 py-0.5 rounded-md outline-none w-20 placeholder-[#f5a623]/30"
    />
  );
}

function AIAssistPanel({ client }: { client: Client }) {
  const [action, setAction] = useState<"draft_followup" | "summarize" | "next_action" | "score_explain">("next_action");
  const [executionTier, setExecutionTier] = useState<ExecutionTier>(client.executionTier === "core" ? "core" : "elite");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setExecutionTier(client.executionTier === "core" ? "core" : "elite");
  }, [client.executionTier]);

  // Auto-run "next action" on first load
  useEffect(() => {
    if (!result && !loading) {
      void run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run() {
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/ai/client-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id, action, executionTier }),
      });
      const data = await res.json() as { ok: boolean; result?: string; error?: string };
      if (data.ok && data.result) setResult(data.result);
      else setError(data.error ?? "Failed");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const ACTIONS = [
    { value: "next_action", label: "Next Action" },
    { value: "summarize", label: "Summarize" },
    { value: "draft_followup", label: "Draft Follow-up" },
    { value: "score_explain", label: "Explain Score" },
  ] as const;

  return (
    <div className="bg-gradient-to-br from-[#0c0a08]/20 to-[#0c0a08]/20 border border-[#e07850]/20 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-[#e07850]" />
        <h3 className="text-xs font-black text-white uppercase tracking-wider">AI Copilot</h3>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {([
          ["core", "Core", "Strong practical guidance"],
          ["elite", "Elite", "Sharper premium client strategy"],
        ] as const).map(([value, label, note]) => {
          const active = executionTier === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setExecutionTier(value)}
              className={`rounded-xl border p-3 text-left transition ${
                active
                  ? "border-[#e07850]/40 bg-[#e07850]/10"
                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[11px] font-black uppercase tracking-[0.18em] ${active ? "text-[#f5a623]" : "text-white/70"}`}>{label}</span>
                <span className={`text-[9px] uppercase tracking-[0.2em] ${active ? "text-[#f5a623]" : "text-white/20"}`}>{value}</span>
              </div>
              <p className={`mt-1 text-[10px] leading-relaxed ${active ? "text-[#f5a623]/80" : "text-white/35"}`}>{note}</p>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 mb-3">
        <select
          value={action}
          onChange={(e) => setAction(e.target.value as typeof action)}
          className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#e07850]/50 transition appearance-none cursor-pointer"
        >
          {ACTIONS.map((a) => (
            <option key={a.value} value={a.value} className="bg-[#0d1525]">{a.label}</option>
          ))}
        </select>
        <button
          onClick={() => void run()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#e07850]/40 to-[#e07850]/40 border border-[#e07850]/30 hover:border-[#e07850]/50 text-xs font-bold text-white hover:text-white transition disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
          Run
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-400/80 mb-2">{error}</p>
      )}

      {result && (
        <div className="bg-black/20 rounded-xl p-3 text-xs text-white/70 leading-relaxed whitespace-pre-wrap">
          {result}
        </div>
      )}

      {!result && !loading && (
        <p className="text-[11px] text-white/20 text-center py-2">
          Select an action, choose the lane, and click Run
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Log Activity
// ---------------------------------------------------------------------------

function LogActivity({ clientId, onLogged }: { clientId: string; onLogged: (activity: Activity) => void }) {
  const [type, setType] = useState("note");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleLog() {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content: content.trim() }),
      });
      const data = await res.json() as { ok: boolean; activity?: Activity };
      if (data.ok && data.activity) {
        onLogged(data.activity);
        setContent("");
      }
    } catch {
      // non-fatal
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-4">
      <div className="flex gap-2 mb-3">
        {[
          { type: "note", icon: FileText, label: "Note" },
          { type: "email", icon: Mail, label: "Email" },
          { type: "call", icon: PhoneIcon, label: "Call" },
          { type: "meeting", icon: Calendar, label: "Meeting" },
        ].map(({ type: t, icon: Icon, label }) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
              type === t
                ? "bg-white/10 text-white border border-white/20"
                : "text-white/30 hover:text-white/50"
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Log a ${type}...`}
          rows={2}
          className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 transition resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.metaKey) void handleLog();
          }}
        />
        <button
          onClick={() => void handleLog()}
          disabled={saving || !content.trim()}
          className="px-3 rounded-xl bg-[#f5a623]/20 hover:bg-[#f5a623]/30 border border-[#f5a623]/30 text-[#f5a623] transition disabled:opacity-30 flex items-center"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [client, setClient] = useState<Client | null>(null);
  const [databaseUnavailable, setDatabaseUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showStageMenu, setShowStageMenu] = useState(false);

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then((r) => r.json() as Promise<{ ok: boolean; client?: Client | null; databaseUnavailable?: boolean }>)
      .then((data) => {
        setDatabaseUnavailable(Boolean(data.databaseUnavailable));
        if (data.ok && data.client) setClient(data.client);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function patchClient(field: string, value: unknown) {
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json() as { ok: boolean; client?: Client; error?: string };
      if (data.ok && data.client) {
        setClient(data.client);
      } else {
        toast.error(data.error ?? `Failed to update ${field}`);
      }
    } catch {
      toast.error("Network error — changes not saved");
    }
  }

  function startEdit(field: string, current: string) {
    setEditingField(field);
    setEditValue(current);
  }

  async function commitEdit(field: string) {
    await patchClient(field, editValue);
    setEditingField(null);
  }

  function handleActivityLogged(activity: Activity) {
    setClient((prev) =>
      prev ? { ...prev, activities: [activity, ...(prev.activities ?? [])] } : prev
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-3xl flex-col justify-center gap-4 px-4">
        <DatabaseFallbackNotice visible={databaseUnavailable} />
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-8">
          <AlertTriangle className="w-8 h-8 text-red-400/50" />
          <p className="text-white/40">{databaseUnavailable ? "Client data is temporarily unavailable" : "Client not found"}</p>
          <Link href="/clients" className="text-sm text-[#f5a623] hover:text-[#f5a623]">← Back to Clients</Link>
        </div>
      </div>
    );
  }

  const stageColor = STAGE_COLORS[client.pipelineStage] ?? "text-white/40";

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <Link href="/clients" className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition mb-6">
        <ArrowLeft className="w-3.5 h-3.5" />
        All Clients
      </Link>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        {/* ── LEFT: Profile + Timeline ─────────────────────────────────── */}
        <div className="space-y-6">
          {/* Client header card */}
          <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6">
            <div className="flex items-start gap-5 mb-5">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f5a623]/20 to-[#e07850]/20 border border-white/10 flex items-center justify-center text-xl font-black text-white/70 shrink-0">
                {client.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                {/* Name */}
                {editingField === "name" ? (
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => void commitEdit("name")}
                      onKeyDown={(e) => e.key === "Enter" && void commitEdit("name")}
                      className="text-xl font-black text-white bg-transparent border-b border-[#f5a623] outline-none"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit("name", client.name)}
                    className="flex items-center gap-2 group mb-1"
                  >
                    <h1 className="text-xl font-black text-white group-hover:text-[#f5a623] transition-colors">{client.name}</h1>
                    <Edit2 className="w-3.5 h-3.5 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}

                {client.company && (
                  <p className="text-sm text-white/40 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> {client.company}
                  </p>
                )}
              </div>

              {/* Health ring */}
              <HealthRing score={client.healthScore} status={client.healthStatus} />
            </div>

            {/* Stage selector */}
            <div className="relative mb-5">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowStageMenu((v) => !v)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] text-xs font-bold transition ${stageColor}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${stageColor.replace("text-", "bg-")}`} />
                  {client.pipelineStage.charAt(0).toUpperCase() + client.pipelineStage.slice(1)}
                  <ChevronDown className="w-3 h-3 ml-1" />
                </button>
                <span className={`inline-flex items-center rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] ${
                  client.executionTier === "core"
                    ? "border-white/10 bg-white/[0.03] text-white/45"
                    : "border-[#f5a623]/30 bg-[#f5a623]/10 text-[#f5a623]"
                }`}>
                  {client.executionTier ?? "elite"} lane
                </span>
              </div>
              {showStageMenu && (
                <div className="absolute top-full left-0 mt-1 rounded-xl border border-white/10 bg-[#0d1525] overflow-hidden z-50 shadow-2xl min-w-[140px]">
                  {STAGES.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        void patchClient("pipelineStage", s);
                        setShowStageMenu(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-white/5 transition ${STAGE_COLORS[s] ?? "text-white/40"} ${client.pipelineStage === s ? "bg-white/[0.04]" : ""}`}
                    >
                      {client.pipelineStage === s && <Check className="w-3 h-3" />}
                      {!client.pipelineStage.includes(s) && <div className="w-3" />}
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Contact info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { field: "email", icon: Mail, label: "Email", value: client.email, placeholder: "add@email.com" },
                { field: "phone", icon: Phone, label: "Phone", value: client.phone, placeholder: "+1 (555) 000-0000" },
                { field: "company", icon: Building2, label: "Company", value: client.company, placeholder: "Company name" },
                { field: "website", icon: Globe, label: "Website", value: client.website, placeholder: "https://" },
                { field: "niche", icon: Tag, label: "Niche", value: client.niche, placeholder: "e.g. e-commerce" },
                { field: "dealValue", icon: DollarSign, label: "Deal Value", value: client.dealValue?.toString() ?? "", placeholder: "0" },
              ].map(({ field, icon: Icon, label, value, placeholder }) => (
                <div key={field} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] group">
                  <Icon className="w-3.5 h-3.5 text-white/25 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-white/25 font-black uppercase tracking-widest mb-0.5">{label}</p>
                    {editingField === field ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => void commitEdit(field)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void commitEdit(field);
                          if (e.key === "Escape") setEditingField(null);
                        }}
                        className="text-xs text-white bg-transparent border-b border-[#f5a623]/50 outline-none w-full"
                        placeholder={placeholder}
                      />
                    ) : (
                      <button
                        onClick={() => startEdit(field, value ?? "")}
                        className="text-xs text-left text-white/60 hover:text-white transition-colors truncate w-full"
                      >
                        {value ? (
                          field === "dealValue" ? `$${Number(value).toLocaleString()}` : value
                        ) : (
                          <span className="text-white/20 italic">{placeholder}</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Tags */}
            {/* Tags — inline add/remove */}
            <div className="flex flex-wrap gap-1.5 mt-3 items-center">
              {client.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    const newTags = client.tags.filter(t => t !== tag);
                    void patchClient("tags", newTags);
                  }}
                  className="text-[10px] font-bold text-[#f5a623] bg-[#f5a623]/10 border border-[#f5a623]/20 px-2 py-0.5 rounded-md hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition group"
                  title="Click to remove"
                >
                  {tag} <span className="opacity-0 group-hover:opacity-100 ml-0.5">×</span>
                </button>
              ))}
              <TagAdder
                onAdd={(tag) => {
                  if (!client.tags.includes(tag)) {
                    void patchClient("tags", [...client.tags, tag]);
                  }
                }}
              />
            </div>
          </div>

          {/* Log activity */}
          <LogActivity clientId={client.id} onLogged={handleActivityLogged} />

          {/* Activity Timeline */}
          <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
            <h2 className="text-xs font-black uppercase tracking-widest text-white/30 mb-5">Activity Timeline</h2>
            {client.activities.length === 0 ? (
              <p className="text-xs text-white/20 text-center py-6">No activity yet — log your first touchpoint above.</p>
            ) : (
              <div className="space-y-1">
                {client.activities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: AI + Notes ────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* AI Copilot */}
          <AIAssistPanel client={client} />

          {/* Notes */}
          <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">Notes</h3>
            <textarea
              value={client.notes ?? ""}
              onChange={(e) => setClient((prev) => prev ? { ...prev, notes: e.target.value } : prev)}
              onBlur={(e) => void patchClient("notes", e.target.value)}
              placeholder="Add notes about this client..."
              rows={6}
              className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2.5 text-xs text-white/70 placeholder-white/20 focus:outline-none focus:border-[#f5a623]/40 transition resize-none"
            />
          </div>

          {/* Meta */}
          <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-4 space-y-2.5">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">Details</h3>
            {[
              { label: "Created", value: format(new Date(client.createdAt), "MMM d, yyyy") },
              { label: "Last Updated", value: formatDistanceToNow(new Date(client.updatedAt), { addSuffix: true }) },
              { label: "Last Contact", value: client.lastContactAt ? formatDistanceToNow(new Date(client.lastContactAt), { addSuffix: true }) : "Never" },
              { label: "Activities", value: `${client.activities.length} logged` },
              { label: "Priority", value: client.priority.charAt(0).toUpperCase() + client.priority.slice(1) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className="text-white/30">{label}</span>
                <span className="text-white/60 font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
