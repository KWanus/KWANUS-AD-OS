"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import DatabaseFallbackNotice from "@/components/DatabaseFallbackNotice";
import { toast } from "sonner";
import {
  ArrowLeft, Eye, Calendar, Copy, Check, ChevronDown, Loader2,
  Shield, Clock, Send, RotateCcw, DollarSign, Sparkles,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AiPackage {
  name: string;
  price: string;
  billing: string;
  deliverables: string[];
  bestFor: string;
}

interface AiJson {
  problemStatement?: string;
  solution?: string;
  socialProof?: string;
  packages?: AiPackage[];
  totalValue?: string;
  guarantee?: string;
  urgency?: string;
  closingStatement?: string;
  cta?: string;
}

interface StatusEvent {
  status: string;
  at: string;
}

interface Proposal {
  id: string;
  title: string;
  status: "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired";
  totalValue: number | null;
  viewCount: number;
  createdAt: string;
  sentAt: string | null;
  viewedAt: string | null;
  respondedAt: string | null;
  expiresAt: string | null;
  notes: string | null;
  leadId: string | null;
  niche: string | null;
  guarantee: string | null;
  urgency: string | null;
  aiJson: AiJson | null;
  statusHistory?: StatusEvent[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  draft:    "text-white/40 bg-white/[0.04] border-white/10",
  sent:     "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  viewed:   "text-blue-400 bg-blue-500/10 border-blue-500/20",
  accepted: "text-green-400 bg-green-500/10 border-green-500/20",
  rejected: "text-red-400 bg-red-500/10 border-red-500/20",
  expired:  "text-orange-400 bg-orange-500/10 border-orange-500/20",
};

const STATUSES = ["draft", "sent", "viewed", "accepted", "rejected", "expired"] as const;

const TABS = ["Proposal Content", "Edit Details", "Send & Track", "Generate New"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtTime(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

// ---------------------------------------------------------------------------
// Small shared atoms
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">{children}</p>;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] transition">
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-white/40" />}
    </button>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-500/40 transition"
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 4 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-500/40 transition resize-none"
    />
  );
}

// ---------------------------------------------------------------------------
// Tab 1 — Proposal Content
// ---------------------------------------------------------------------------

function ProposalContentTab({ proposal }: { proposal: Proposal }) {
  const ai = proposal.aiJson;

  if (!ai) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Sparkles className="w-10 h-10 text-white/10 mb-3" />
        <p className="text-sm font-bold text-white/30">No AI content yet</p>
        <p className="text-xs text-white/20 mt-1">Go to "Generate New" to create proposal content</p>
      </div>
    );
  }

  const packages = ai.packages ?? [];

  return (
    <div className="space-y-8">
      {/* Problem Statement */}
      {ai.problemStatement && (
        <div>
          <SectionLabel>Problem Statement</SectionLabel>
          <p className="text-white/70 leading-relaxed text-sm">{ai.problemStatement}</p>
        </div>
      )}

      {/* Solution */}
      {ai.solution && (
        <div>
          <SectionLabel>Our Solution</SectionLabel>
          <p className="text-white/70 leading-relaxed text-sm">{ai.solution}</p>
        </div>
      )}

      {/* Social Proof */}
      {ai.socialProof && (
        <div className="border-l-2 border-cyan-500/30 pl-4">
          <SectionLabel>Social Proof</SectionLabel>
          <p className="text-white/50 italic text-sm leading-relaxed">"{ai.socialProof}"</p>
        </div>
      )}

      {/* Packages */}
      {packages.length > 0 && (
        <div>
          <SectionLabel>Packages</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {packages.map((pkg, i) => {
              const isRecommended = i === 1 || packages.length === 1;
              return (
                <div
                  key={i}
                  className={`rounded-2xl p-5 flex flex-col gap-3 border ${
                    isRecommended
                      ? "border-cyan-500/40 bg-cyan-500/[0.04]"
                      : "border-white/[0.06] bg-white/[0.02]"
                  }`}
                >
                  {isRecommended && (
                    <span className="self-start text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-lg">
                      Recommended
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-black text-white">{pkg.name}</p>
                    <p className="text-xl font-black text-cyan-400 mt-1">{pkg.price}</p>
                    {pkg.billing && <p className="text-xs text-white/35 mt-0.5">{pkg.billing}</p>}
                  </div>
                  {pkg.deliverables?.length > 0 && (
                    <ul className="space-y-1.5 flex-1">
                      {pkg.deliverables.map((d, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-white/55">
                          <Check className="w-3 h-3 text-cyan-400/60 mt-0.5 shrink-0" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  )}
                  {pkg.bestFor && (
                    <p className="text-[11px] text-white/35 border-t border-white/[0.06] pt-2">
                      Best for: {pkg.bestFor}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Total value */}
      {(ai.totalValue || proposal.totalValue) && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl px-5 py-4 flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Total Value</p>
            <p className="text-xl font-black text-white">
              {ai.totalValue ?? (proposal.totalValue ? `$${proposal.totalValue.toLocaleString()}` : "")}
            </p>
          </div>
        </div>
      )}

      {/* Guarantee */}
      {(ai.guarantee || proposal.guarantee) && (
        <div className="bg-green-500/[0.04] border border-green-500/20 rounded-2xl px-5 py-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
          <div>
            <SectionLabel>Guarantee</SectionLabel>
            <p className="text-white/60 text-sm">{ai.guarantee ?? proposal.guarantee}</p>
          </div>
        </div>
      )}

      {/* Urgency */}
      {(ai.urgency || proposal.urgency) && (
        <div className="bg-orange-500/[0.04] border border-orange-500/20 rounded-2xl px-5 py-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
          <p className="text-white/60 text-sm">{ai.urgency ?? proposal.urgency}</p>
        </div>
      )}

      {/* Closing */}
      {ai.closingStatement && (
        <div>
          <SectionLabel>Closing</SectionLabel>
          <p className="text-white/60 text-sm leading-relaxed">{ai.closingStatement}</p>
        </div>
      )}

      {/* CTA */}
      {ai.cta && (
        <div className="bg-gradient-to-r from-cyan-500/10 to-purple-600/10 border border-cyan-500/20 rounded-2xl p-6 text-center">
          <p className="text-sm text-white/50 mb-3">Call to Action</p>
          <div className="inline-block bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-black text-sm px-8 py-3 rounded-xl opacity-70 cursor-default">
            {ai.cta}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2 — Edit Details
// ---------------------------------------------------------------------------

function EditDetailsTab({ proposal, onSaved }: { proposal: Proposal; onSaved: () => void }) {
  const [title, setTitle] = useState(proposal.title);
  const [problemStatement, setProblemStatement] = useState(proposal.aiJson?.problemStatement ?? "");
  const [solution, setSolution] = useState(proposal.aiJson?.solution ?? "");
  const [guarantee, setGuarantee] = useState(proposal.guarantee ?? "");
  const [urgency, setUrgency] = useState(proposal.urgency ?? "");
  const [notes, setNotes] = useState(proposal.notes ?? "");
  const [expiresAt, setExpiresAt] = useState(
    proposal.expiresAt ? proposal.expiresAt.slice(0, 10) : ""
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/consult/proposals/${proposal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          guarantee: guarantee || null,
          urgency: urgency || null,
          notes: notes || null,
          expiresAt: expiresAt || null,
          aiJson: {
            ...proposal.aiJson,
            problemStatement: problemStatement || undefined,
            solution: solution || undefined,
          },
        }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) {
        toast.success("Changes saved");
        onSaved();
      } else {
        toast.error(data.error ?? "Save failed");
      }
    } catch {
      toast.error("Could not connect to server");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <FieldRow label="Title">
        <TextInput value={title} onChange={setTitle} placeholder="Proposal title" />
      </FieldRow>
      <FieldRow label="Problem Statement">
        <TextArea value={problemStatement} onChange={setProblemStatement} placeholder="Describe the client's core problem..." rows={4} />
      </FieldRow>
      <FieldRow label="Solution">
        <TextArea value={solution} onChange={setSolution} placeholder="How you solve it..." rows={4} />
      </FieldRow>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldRow label="Guarantee">
          <TextInput value={guarantee} onChange={setGuarantee} placeholder="e.g. 30-day money back" />
        </FieldRow>
        <FieldRow label="Urgency">
          <TextInput value={urgency} onChange={setUrgency} placeholder="e.g. Only 2 spots left" />
        </FieldRow>
      </div>
      <FieldRow label="Expiry Date">
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/40 transition"
        />
      </FieldRow>
      <FieldRow label="Internal Notes">
        <TextArea value={notes} onChange={setNotes} placeholder="Private notes (not shown to client)..." rows={3} />
      </FieldRow>
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-sm font-black px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-30 transition"
      >
        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        Save Changes
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3 — Send & Track
// ---------------------------------------------------------------------------

function SendTrackTab({ proposal, onRefresh }: { proposal: Proposal; onRefresh: () => void }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  async function handleSend() {
    if (!email.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/consult/proposals/${proposal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "sent", recipientEmail: email, customMessage: message }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) {
        toast.success("Marked as sent");
        setEmail(""); setMessage("");
        onRefresh();
      } else {
        toast.error(data.error ?? "Failed");
      }
    } catch {
      toast.error("Could not connect");
    } finally {
      setSending(false);
    }
  }

  async function updateStatus(status: string) {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/consult/proposals/${proposal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) {
        toast.success(`Status updated to ${status}`);
        onRefresh();
      } else {
        toast.error(data.error ?? "Failed");
      }
    } catch {
      toast.error("Could not connect");
    } finally {
      setUpdatingStatus(false);
    }
  }

  const isSent = proposal.status !== "draft";

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Timeline */}
      {isSent && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <SectionLabel>Delivery Timeline</SectionLabel>
          <div className="space-y-3 mt-2">
            {[
              { label: "Sent", value: proposal.sentAt, icon: Send, color: "text-cyan-400" },
              { label: "Viewed", value: proposal.viewedAt, icon: Eye, color: "text-blue-400" },
              { label: "Responded", value: proposal.respondedAt, icon: Check, color: "text-green-400" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 ${value ? color : "text-white/15"}`} />
                <span className="text-sm text-white/50 w-24">{label}</span>
                <span className={`text-sm ${value ? "text-white/70" : "text-white/20"}`}>
                  {value ? fmtTime(value) : "Not yet"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View tracking */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 flex items-center gap-4">
        <Eye className="w-6 h-6 text-white/20 shrink-0" />
        <div>
          <p className="text-2xl font-black text-white">{proposal.viewCount}</p>
          <p className="text-xs text-white/35">Total views</p>
        </div>
        {proposal.viewedAt && (
          <div className="ml-auto text-right">
            <p className="text-xs text-white/25">Last viewed</p>
            <p className="text-sm text-white/50">{fmtTime(proposal.viewedAt)}</p>
          </div>
        )}
      </div>

      {/* Send form (if not yet sent) */}
      {!isSent && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-3">
          <SectionLabel>Send to Recipient</SectionLabel>
          <TextInput value={email} onChange={setEmail} placeholder="recipient@company.com" />
          <TextArea value={message} onChange={setMessage} placeholder="Optional personal message..." rows={2} />
          <button
            onClick={handleSend}
            disabled={!email.trim() || sending}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-sm font-black px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-30 transition"
          >
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Mark as Sent
          </button>
        </div>
      )}

      {/* Status actions */}
      <div>
        <SectionLabel>Update Status</SectionLabel>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void updateStatus("accepted")}
            disabled={updatingStatus || proposal.status === "accepted"}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 disabled:opacity-30 transition"
          >
            Accept
          </button>
          <button
            onClick={() => void updateStatus("rejected")}
            disabled={updatingStatus || proposal.status === "rejected"}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 disabled:opacity-30 transition"
          >
            Reject
          </button>
          <button
            onClick={() => void updateStatus("expired")}
            disabled={updatingStatus || proposal.status === "expired"}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 disabled:opacity-30 transition"
          >
            Mark Expired
          </button>
        </div>
      </div>

      {/* Activity log */}
      {proposal.statusHistory && proposal.statusHistory.length > 0 && (
        <div>
          <SectionLabel>Activity Log</SectionLabel>
          <div className="space-y-2">
            {proposal.statusHistory.map((evt, i) => (
              <div key={i} className="flex items-center gap-3 text-xs text-white/40">
                <span className={`px-2 py-0.5 rounded-lg border capitalize ${STATUS_COLORS[evt.status] ?? STATUS_COLORS.draft}`}>
                  {evt.status}
                </span>
                <span>{fmtTime(evt.at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 4 — Generate New
// ---------------------------------------------------------------------------

function GenerateNewTab({ proposal, onRefresh }: { proposal: Proposal; onRefresh: () => void }) {
  const [regenerating, setRegenerating] = useState(false);

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const res = await fetch("/api/consult/proposals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: proposal.leadId,
          niche: proposal.niche,
          proposalId: proposal.id,
        }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) {
        toast.success("Proposal regenerated");
        onRefresh();
      } else {
        toast.error(data.error ?? "Generation failed");
      }
    } catch {
      toast.error("Could not connect");
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-white/[0.08] flex items-center justify-center mb-4">
          <RotateCcw className="w-5 h-5 text-cyan-400" />
        </div>
        <p className="text-sm font-black text-white mb-1">Regenerate Proposal</p>
        <p className="text-xs text-white/40 leading-relaxed mb-5">
          Uses the same lead and niche data to generate a fresh proposal with new AI content. This will replace the current aiJson.
        </p>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-sm font-black px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-30 transition"
        >
          {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Regenerate Proposal
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [databaseUnavailable, setDatabaseUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // Title editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  // Status dropdown
  const [showStatusDrop, setShowStatusDrop] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Copy share link
  const [copiedLink, setCopiedLink] = useState(false);

  async function fetchProposal() {
    try {
      const res = await fetch(`/api/consult/proposals/${id}`);
      const data = await res.json() as { ok: boolean; proposal: Proposal | null; error?: string; databaseUnavailable?: boolean };
      setDatabaseUnavailable(Boolean(data.databaseUnavailable));
      if (data.ok) {
        setProposal(data.proposal);
        setTitleDraft(data.proposal?.title ?? "");
      } else {
        toast.error(data.error ?? "Failed to load proposal");
      }
    } catch {
      toast.error("Could not connect");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void fetchProposal(); }, [id]);

  useEffect(() => {
    if (editingTitle && titleRef.current) titleRef.current.focus();
  }, [editingTitle]);

  async function saveTitle() {
    if (!proposal || titleDraft === proposal.title) { setEditingTitle(false); return; }
    try {
      const res = await fetch(`/api/consult/proposals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleDraft }),
      });
      const data = await res.json() as { ok: boolean };
      if (data.ok) {
        toast.success("Title updated");
        void fetchProposal();
      }
    } catch { /* silent */ }
    setEditingTitle(false);
  }

  async function updateStatus(status: string) {
    if (!proposal) return;
    setUpdatingStatus(true);
    setShowStatusDrop(false);
    try {
      const res = await fetch(`/api/consult/proposals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json() as { ok: boolean };
      if (data.ok) { toast.success(`Status: ${status}`); void fetchProposal(); }
    } catch { toast.error("Failed"); }
    setUpdatingStatus(false);
  }

  function copyShareLink() {
    void navigator.clipboard.writeText(`${window.location.origin}/s/proposals/${id}`);
    setCopiedLink(true);
    toast.success("Share link copied");
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function downloadAsText() {
    if (!proposal) return;
    const ai = proposal.aiJson;
    const lines: string[] = [
      proposal.title,
      "=".repeat(proposal.title.length),
      "",
      ai?.problemStatement ? `PROBLEM\n${ai.problemStatement}\n` : "",
      ai?.solution ? `SOLUTION\n${ai.solution}\n` : "",
      ai?.guarantee ? `GUARANTEE\n${ai.guarantee}\n` : "",
      ai?.urgency ? `URGENCY\n${ai.urgency}\n` : "",
      ai?.closingStatement ? `CLOSING\n${ai.closingStatement}\n` : "",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${proposal.title.replace(/\s+/g, "-")}.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020509] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-white/20" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-[#020509] flex items-center justify-center px-4">
        <div className="w-full max-w-3xl space-y-4">
          <DatabaseFallbackNotice visible={databaseUnavailable} />
          <div className="flex flex-col items-center justify-center text-center rounded-2xl border border-white/[0.07] bg-white/[0.03] p-8">
            <p className="text-sm font-bold text-white/30 mb-4">{databaseUnavailable ? "Proposal data is temporarily unavailable" : "Proposal not found"}</p>
            <button onClick={() => router.push("/consult")} className="text-cyan-400 text-sm hover:underline">
              Back to Consult
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020509] text-white">
      <AppNav />
      <div className="max-w-5xl mx-auto px-4 pt-8 pb-24">

        {/* Back */}
        <button
          onClick={() => router.push("/consult")}
          className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/70 transition mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Consult
        </button>

        {/* Header */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-wrap items-start gap-3">
            {/* Editable title */}
            {editingTitle ? (
              <input
                ref={titleRef}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => { if (e.key === "Enter") void saveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
                className="text-xl font-black text-white bg-white/[0.04] border border-white/[0.12] rounded-xl px-3 py-1 outline-none focus:border-cyan-500/50 transition flex-1 min-w-0"
              />
            ) : (
              <h1
                onClick={() => setEditingTitle(true)}
                className="text-xl font-black text-white cursor-text hover:text-white/80 transition flex-1 min-w-0"
                title="Click to edit"
              >
                {proposal.title}
              </h1>
            )}

            {/* Status badge + dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowStatusDrop((p) => !p)}
                disabled={updatingStatus}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold capitalize transition ${STATUS_COLORS[proposal.status] ?? STATUS_COLORS.draft}`}
              >
                {updatingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : proposal.status}
                <ChevronDown className="w-3 h-3 opacity-50" />
              </button>
              {showStatusDrop && (
                <div className="absolute right-0 top-full mt-1 z-30 bg-[#020509] border border-white/[0.1] rounded-xl overflow-hidden shadow-xl">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => void updateStatus(s)}
                      className={`block w-full text-left px-4 py-2 text-xs font-bold capitalize hover:bg-white/[0.05] transition ${
                        s === proposal.status ? "text-white" : "text-white/50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-white/30">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> {proposal.viewCount} views
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Created {fmt(proposal.createdAt)}
            </span>
            {proposal.expiresAt && (
              <span className="flex items-center gap-1.5 text-orange-400/60">
                <Clock className="w-3.5 h-3.5" /> Expires {fmt(proposal.expiresAt)}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void updateStatus("sent")}
              disabled={proposal.status !== "draft" || updatingStatus}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold hover:bg-cyan-500/20 disabled:opacity-30 transition"
            >
              <Send className="w-3 h-3" /> Mark as Sent
            </button>
            <button
              onClick={copyShareLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50 text-xs font-bold hover:text-white hover:border-white/[0.15] transition"
            >
              {copiedLink ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              Copy Share Link
            </button>
            <button
              onClick={downloadAsText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50 text-xs font-bold hover:text-white hover:border-white/[0.15] transition"
            >
              Download as Text
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl flex gap-1 p-1 mb-6 overflow-x-auto">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`whitespace-nowrap px-4 py-2 text-sm rounded-xl transition ${
                activeTab === i
                  ? "bg-white/[0.06] text-white font-black"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 0 && <ProposalContentTab proposal={proposal} />}
        {activeTab === 1 && <EditDetailsTab proposal={proposal} onSaved={() => void fetchProposal()} />}
        {activeTab === 2 && <SendTrackTab proposal={proposal} onRefresh={() => void fetchProposal()} />}
        {activeTab === 3 && <GenerateNewTab proposal={proposal} onRefresh={() => void fetchProposal()} />}
      </div>

      {/* Close status dropdown on outside click */}
      {showStatusDrop && (
        <div className="fixed inset-0 z-20" onClick={() => setShowStatusDrop(false)} />
      )}
    </div>
  );
}
