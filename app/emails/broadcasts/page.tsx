"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import AppNav from "@/components/AppNav";
import CampaignSubNav from "@/components/BuildSubNav";
import {
  Send,
  Plus,
  X,
  Trash2,
  Loader2,
  AlertTriangle,
  Clock,
  CheckCircle,
  Users,
  Eye,
  MousePointer,
  Sparkles,
  Calendar,
  ChevronRight,
  Edit2,
  BarChart2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BroadcastStatus = "draft" | "scheduled" | "sending" | "sent" | "cancelled";
type ExecutionTier = "core" | "elite";

interface EmailBroadcast {
  id: string;
  name: string;
  subject: string;
  previewText?: string;
  body: string;
  fromName?: string;
  fromEmail?: string;
  status: BroadcastStatus;
  segmentTags: string[];
  executionTier?: ExecutionTier;
  scheduledAt?: string;
  sentAt?: string;
  recipients: number;
  opens: number;
  clicks: number;
  bounces: number;
  unsubscribes: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<BroadcastStatus, { label: string; dot: string; text: string; bg: string; border: string }> = {
  draft: { label: "Draft", dot: "bg-white/30", text: "text-white/40", bg: "bg-white/[0.03]", border: "border-white/10" },
  scheduled: { label: "Scheduled", dot: "bg-blue-400", text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  sending: { label: "Sending", dot: "bg-yellow-400 animate-pulse", text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  sent: { label: "Sent", dot: "bg-green-400", text: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
  cancelled: { label: "Cancelled", dot: "bg-red-400", text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
};

// ---------------------------------------------------------------------------
// Broadcast Card
// ---------------------------------------------------------------------------

function BroadcastCard({
  broadcast,
  onDelete,
  onEdit,
  onSent,
}: {
  broadcast: EmailBroadcast;
  onDelete: (id: string) => void;
  onEdit: (broadcast: EmailBroadcast) => void;
  onSent: (updated: EmailBroadcast) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [sending, setSending] = useState(false);
  const sc = STATUS_CONFIG[broadcast.status];
  const executionTier: ExecutionTier = broadcast.executionTier === "core" ? "core" : "elite";

  const openRate =
    broadcast.recipients > 0
      ? Math.round((broadcast.opens / broadcast.recipients) * 100)
      : null;
  const clickRate =
    broadcast.opens > 0
      ? Math.round((broadcast.clicks / broadcast.opens) * 100)
      : null;

  async function handleSend(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Send "${broadcast.name}" now? This will send to all matching contacts.`)) return;
    setSending(true);
    try {
      const res = await fetch(`/api/email-broadcasts/${broadcast.id}/send`, { method: "POST" });
      const data = await res.json() as { ok: boolean; broadcast?: EmailBroadcast; error?: string };
      if (data.ok && data.broadcast) {
        toast.success(`"${broadcast.name}" sent successfully`);
        onSent(data.broadcast);
      } else {
        toast.error(data.error ?? "Failed to send broadcast");
      }
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Delete "${broadcast.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/email-broadcasts/${broadcast.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onDelete(broadcast.id);
      toast.success("Broadcast deleted");
    } catch {
      toast.error("Failed to delete broadcast");
      setDeleting(false);
    }
  }

  return (
    <div className="group bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5 hover:border-white/[0.14] hover:bg-white/[0.04] transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ${sc.border} ${sc.bg} ${sc.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              {sc.label}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] ${
              executionTier === "elite"
                ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                : "border-white/10 bg-white/[0.03] text-white/45"
            }`}>
              {executionTier}
            </span>
            {broadcast.scheduledAt && broadcast.status === "scheduled" && (
              <span className="text-[10px] text-blue-400/70 flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5" />
                {new Date(broadcast.scheduledAt).toLocaleString()}
              </span>
            )}
            {broadcast.sentAt && broadcast.status === "sent" && (
              <span className="text-[10px] text-white/25 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {new Date(broadcast.sentAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-white truncate">{broadcast.name}</h3>
          <p className="text-xs text-white/40 truncate mt-0.5">{broadcast.subject}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {broadcast.status === "draft" && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(broadcast); }}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/25 hover:text-white/60 transition"
                title="Edit"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => void handleSend(e)}
                disabled={sending}
                className="p-1.5 rounded-lg hover:bg-cyan-500/10 text-white/25 hover:text-cyan-400 transition"
                title="Send Now"
              >
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Stats */}
      {broadcast.status === "sent" || broadcast.status === "sending" ? (
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Users, label: "Sent", value: broadcast.recipients.toLocaleString(), color: "text-white/60" },
            { icon: Eye, label: "Opens", value: openRate != null ? `${openRate}%` : "—", color: "text-cyan-400" },
            { icon: MousePointer, label: "Clicks", value: clickRate != null ? `${clickRate}%` : "—", color: "text-purple-400" },
            { icon: BarChart2, label: "Bounces", value: broadcast.bounces > 0 ? broadcast.bounces : "—", color: "text-red-400/70" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white/[0.03] rounded-xl p-2.5 text-center">
              <Icon className={`w-3 h-3 mx-auto mb-1 ${color}`} />
              <p className="text-[9px] text-white/25 font-medium uppercase">{label}</p>
              <p className={`text-xs font-black ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-4 text-[11px] text-white/30">
          {broadcast.segmentTags.length > 0 ? (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              Tags: {broadcast.segmentTags.join(", ")}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              All contacts
            </span>
          )}
          {broadcast.fromEmail && (
            <span className="truncate">From: {broadcast.fromName ?? broadcast.fromEmail}</span>
          )}
        </div>
      )}

      {/* Draft CTAs */}
      {broadcast.status === "draft" && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onEdit(broadcast)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.16] text-white/50 hover:text-white text-[11px] font-semibold transition-all"
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
          <button
            onClick={(e) => void handleSend(e)}
            disabled={sending}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-purple-600/30 border border-cyan-500/30 hover:border-cyan-400/50 text-cyan-300 hover:text-white text-[11px] font-bold transition-all disabled:opacity-40"
          >
            {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            {sending ? "Sending..." : "Send Now"}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compose / Edit Modal
// ---------------------------------------------------------------------------

function ComposeModal({
  open,
  onClose,
  onSaved,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (broadcast: EmailBroadcast) => void;
  editing: EmailBroadcast | null;
}) {
  const [executionTier, setExecutionTier] = useState<"core" | "elite">("elite");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [body, setBody] = useState("");
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [segmentTags, setSegmentTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (editing) {
        setName(editing.name);
        setSubject(editing.subject);
        setPreviewText(editing.previewText ?? "");
        setBody(editing.body);
        setFromName(editing.fromName ?? "");
        setFromEmail(editing.fromEmail ?? "");
        setSegmentTags(editing.segmentTags.join(", "));
        setExecutionTier(editing.executionTier === "core" ? "core" : "elite");
      } else {
        setName("");
        setSubject("");
        setPreviewText("");
        setBody("");
        setFromName("");
        setFromEmail("");
        setSegmentTags("");
        setExecutionTier("elite");
      }
      setError(null);
      setSaving(false);
    }
  }, [open, editing]);

  async function handleAIGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trigger: "custom",
          flowName: name || "Broadcast",
          executionTier,
        }),
      });
      const data = await res.json() as { ok: boolean; subject?: string; previewText?: string; body?: string };
      if (data.ok) {
        if (data.subject && !subject) setSubject(data.subject);
        if (data.previewText && !previewText) setPreviewText(data.previewText);
        if (data.body && !body) setBody(data.body);
      }
    } catch {
      setError("AI generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!name.trim() || !subject.trim()) {
      setError("Name and subject are required.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      subject: subject.trim(),
      previewText: previewText.trim() || undefined,
      body: body.trim(),
      fromName: fromName.trim() || undefined,
      fromEmail: fromEmail.trim() || undefined,
      executionTier,
      segmentTags: segmentTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      let res: Response;
      if (editing) {
        res = await fetch(`/api/email-broadcasts/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/email-broadcasts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json() as { ok: boolean; broadcast?: EmailBroadcast; error?: string };
      if (!data.ok) throw new Error(data.error ?? "Failed");
      if (data.broadcast) onSaved(data.broadcast);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#020509] border border-white/[0.1] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#020509] border-b border-white/[0.06] px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-base font-black text-white">
              {editing ? "Edit Broadcast" : "New Broadcast"}
            </h2>
            <p className="text-xs text-white/35 mt-0.5">Compose a one-time email send to your contacts</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">
              Execution Level
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "core" as const, label: "Core", note: "Clean, strong, launch-ready email copy" },
                { value: "elite" as const, label: "Elite", note: "Sharper angles, tighter objections, premium framing" },
              ].map((option) => {
                const active = executionTier === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setExecutionTier(option.value)}
                    className={`rounded-xl border px-4 py-3 text-left transition-all ${
                      active
                        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-100 shadow-[0_0_24px_rgba(6,182,212,0.12)]"
                        : "border-white/[0.08] bg-white/[0.03] text-white/55 hover:bg-white/[0.05]"
                    }`}
                  >
                    <p className="text-sm font-black">{option.label}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-white/35">{option.note}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Generate */}
          <button
            onClick={() => void handleAIGenerate()}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-600/20 to-cyan-600/20 border border-purple-500/30 hover:border-purple-400/50 text-sm font-bold text-purple-300 hover:text-white transition disabled:opacity-40"
          >
            <Sparkles className="w-4 h-4" />
            {generating ? "Generating content..." : `AI Generate ${executionTier === "elite" ? "Elite" : "Core"} Content`}
          </button>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Broadcast Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Spring Sale Announcement"
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Subject Line</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Your subject line..."
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Preview Text</label>
              <input
                type="text"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="Shown in inbox preview..."
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">From Name</label>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Your Name"
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">From Email</label>
              <input
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">
                Segment Tags{" "}
                <span className="normal-case text-white/20 font-normal">(comma separated — blank = all contacts)</span>
              </label>
              <input
                type="text"
                value={segmentTags}
                onChange={(e) => setSegmentTags(e.target.value)}
                placeholder="e.g. buyer, vip, newsletter"
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Email Body</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your email content here..."
                rows={10}
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition resize-none"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#020509] border-t border-white/[0.06] px-6 py-4 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/[0.1] text-white/40 hover:text-white/60 text-sm font-semibold transition">
            Cancel
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={saving || !name.trim() || !subject.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-sm font-bold shadow-[0_0_15px_rgba(6,182,212,0.15)] disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <><CheckCircle className="w-4 h-4" /> Save Broadcast</>
            )}
          </button>
        </div>
      </div>
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
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500/20 to-cyan-600/20 border border-white/10 flex items-center justify-center">
          <Send className="w-9 h-9 text-purple-400/70" />
        </div>
      </div>
      <h2 className="text-xl font-black text-white mb-2">No Broadcasts Yet</h2>
      <p className="text-sm text-white/40 max-w-sm mb-8 leading-relaxed">
        Broadcasts are one-time emails sent to your entire list or a specific segment. Perfect for announcements, launches, and promotions.
      </p>
      <button
        onClick={onCreateClick}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-sm font-bold shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-opacity"
      >
        <Plus className="w-4 h-4" />
        Create First Broadcast
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<EmailBroadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EmailBroadcast | null>(null);

  const fetchBroadcasts = useCallback(async () => {
    try {
      const res = await fetch("/api/email-broadcasts");
      const data = await res.json() as { ok: boolean; broadcasts?: EmailBroadcast[] };
      if (data.ok && data.broadcasts) setBroadcasts(data.broadcasts);
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBroadcasts();
  }, [fetchBroadcasts]);

  function handleSaved(broadcast: EmailBroadcast) {
    setBroadcasts((prev) => {
      const idx = prev.findIndex((b) => b.id === broadcast.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = broadcast;
        return next;
      }
      return [broadcast, ...prev];
    });
    setEditing(null);
  }

  function handleDelete(id: string) {
    setBroadcasts((prev) => prev.filter((b) => b.id !== id));
  }

  function handleSent(updated: EmailBroadcast) {
    setBroadcasts((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }

  function handleEdit(broadcast: EmailBroadcast) {
    setEditing(broadcast);
    setModalOpen(true);
  }

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  // Stats
  const sentBroadcasts = broadcasts.filter((b) => b.status === "sent");
  const totalSent = sentBroadcasts.reduce((s, b) => s + b.recipients, 0);
  const avgOpenRate =
    sentBroadcasts.length > 0
      ? Math.round(
          sentBroadcasts.reduce((s, b) => s + (b.recipients > 0 ? (b.opens / b.recipients) * 100 : 0), 0) /
            sentBroadcasts.length
        )
      : null;

  return (
    <div className="min-h-screen bg-[#020509] text-white">
      <AppNav />
      <CampaignSubNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Broadcasts</h1>
            <p className="text-sm text-white/35 mt-1">One-time emails sent to your list or a segment</p>
          </div>
          {broadcasts.length > 0 && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-sm font-bold shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-opacity"
            >
              <Plus className="w-4 h-4" />
              New Broadcast
            </button>
          )}
        </div>

        {/* Stats bar */}
        {sentBroadcasts.length > 0 && (
          <div className="flex gap-3 flex-wrap mb-8">
            {[
              { label: "Total Sent", value: totalSent.toLocaleString(), icon: Send, color: "text-cyan-400" },
              { label: "Avg Open Rate", value: avgOpenRate != null ? `${avgOpenRate}%` : "—", icon: Eye, color: "text-purple-400" },
              { label: "Sent Campaigns", value: sentBroadcasts.length, icon: CheckCircle, color: "text-green-400" },
              { label: "Scheduled", value: broadcasts.filter((b) => b.status === "scheduled").length, icon: Clock, color: "text-blue-400" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex-1 min-w-[140px] bg-white/[0.03] border border-white/[0.06] rounded-2xl px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                  <span className="text-[11px] text-white/35 font-medium uppercase tracking-wider">{label}</span>
                </div>
                <p className="text-xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
          </div>
        ) : broadcasts.length === 0 ? (
          <EmptyState onCreateClick={openCreate} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {broadcasts.map((broadcast) => (
              <BroadcastCard
                key={broadcast.id}
                broadcast={broadcast}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onSent={handleSent}
              />
            ))}
          </div>
        )}
      </main>

      <ComposeModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSaved={handleSaved}
        editing={editing}
      />
    </div>
  );
}
