"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { toast } from "sonner";
import {
  Plus, Loader2, FileText, Eye, Users, Copy, Check,
  ExternalLink, Trash2, Search, X, ToggleLeft, ToggleRight,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface OptInForm {
  id: string;
  name: string;
  headline: string | null;
  subheadline: string | null;
  buttonText: string | null;
  tags: string[];
  redirectUrl: string | null;
  active: boolean;
  views: number;
  submissions: number;
  executionTier: "core" | "elite";
  createdAt: string;
  updatedAt: string;
}

// ─── Form Card ───────────────────────────────────────────────────────────────

function FormCard({
  form,
  onToggle,
  onDelete,
}: {
  form: OptInForm;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const convRate = form.views > 0 ? ((form.submissions / form.views) * 100).toFixed(1) : "0";
  const publicUrl = `/forms/${form.id}`;

  function copyLink() {
    void navigator.clipboard.writeText(`${window.location.origin}${publicUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 hover:border-white/[0.12] transition-all group">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-black text-white truncate">{form.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
              form.active
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                : "bg-white/[0.04] border border-white/[0.08] text-white/30"
            }`}>
              {form.active ? "Live" : "Off"}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
              form.executionTier === "elite"
                ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-300"
                : "bg-white/[0.04] border-white/[0.08] text-white/40"
            }`}>
              {form.executionTier}
            </span>
          </div>
          {form.headline && <p className="text-xs text-white/40 truncate">{form.headline}</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Views", value: form.views, icon: Eye },
          { label: "Submissions", value: form.submissions, icon: Users },
          { label: "Conv. Rate", value: `${convRate}%`, icon: FileText },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
            <div className="flex items-center gap-1 mb-1">
              <Icon className="w-3 h-3 text-white/20" />
              <p className="text-[9px] font-bold uppercase tracking-wider text-white/25">{label}</p>
            </div>
            <p className="text-base font-black text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Tags */}
      {form.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {form.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-[10px] font-bold text-white/35">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggle(form.id, !form.active)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-[11px] font-bold text-white/40 hover:text-white/70 hover:border-white/15 transition"
        >
          {form.active ? <ToggleRight className="w-3.5 h-3.5 text-emerald-400" /> : <ToggleLeft className="w-3.5 h-3.5" />}
          {form.active ? "Deactivate" : "Activate"}
        </button>
        <a
          href={publicUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-[11px] font-bold text-white/40 hover:text-white/70 hover:border-white/15 transition"
        >
          <ExternalLink className="w-3 h-3" /> Preview
        </a>
        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-[11px] font-bold text-white/40 hover:text-white/70 hover:border-white/15 transition"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy Link"}
        </button>
        <button
          onClick={() => onDelete(form.id)}
          className="ml-auto p-1.5 rounded-lg text-white/15 hover:text-red-400 hover:bg-red-500/10 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Create Form Modal ───────────────────────────────────────────────────────

function CreateFormModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (form: OptInForm) => void;
}) {
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [buttonText, setButtonText] = useState("Subscribe");
  const [tags, setTags] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [executionTier, setExecutionTier] = useState<"core" | "elite">("elite");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/opt-in-forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          headline: headline.trim() || undefined,
          subheadline: subheadline.trim() || undefined,
          buttonText: buttonText.trim() || "Subscribe",
          tags: tags.trim() ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          redirectUrl: redirectUrl.trim() || undefined,
          executionTier,
        }),
      });
      const data = await res.json() as { ok: boolean; form?: OptInForm };
      if (data.ok && data.form) {
        onCreate(data.form);
        toast.success("Form created");
        onClose();
      } else {
        toast.error("Failed to create form");
      }
    } catch {
      toast.error("Failed to create form");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-white/[0.08] bg-[#020509] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <h3 className="text-base font-black text-white">Create Opt-In Form</h3>
          <button onClick={onClose} className="p-2 rounded-xl text-white/25 hover:text-white hover:bg-white/[0.05] transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30 block mb-1.5">Form Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Free Strategy Call"
              className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/30" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30 block mb-1.5">Headline</label>
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Get your free strategy session"
              className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/30" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30 block mb-1.5">Subheadline</label>
            <input value={subheadline} onChange={(e) => setSubheadline(e.target.value)} placeholder="Join 500+ businesses growing with AI"
              className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30 block mb-1.5">Button Text</label>
              <input value={buttonText} onChange={(e) => setButtonText(e.target.value)} placeholder="Subscribe"
                className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/30" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30 block mb-1.5">Execution Tier</label>
              <div className="grid grid-cols-2 gap-2">
                {(["core", "elite"] as const).map((t) => (
                  <button key={t} onClick={() => setExecutionTier(t)}
                    className={`py-2 rounded-xl border text-xs font-bold transition ${
                      executionTier === t
                        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                        : "border-white/[0.08] text-white/35 hover:border-white/15"
                    }`}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30 block mb-1.5">Tags (comma-separated)</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="webinar, free-call"
              className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/30" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30 block mb-1.5">Redirect URL (after submit)</label>
            <input value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} placeholder="https://yoursite.com/thanks"
              className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/30" />
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-white/[0.06]">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-xs font-bold text-white/40 hover:text-white/60 transition">
            Cancel
          </button>
          <button onClick={() => void handleCreate()} disabled={creating || !name.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-sm font-black text-white hover:opacity-90 transition disabled:opacity-40">
            {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {creating ? "Creating..." : "Create Form"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function FormsManagerPage() {
  const [forms, setForms] = useState<OptInForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const fetchForms = useCallback(async () => {
    try {
      const res = await fetch("/api/opt-in-forms");
      const data = await res.json() as { ok: boolean; forms?: OptInForm[] };
      if (data.ok) setForms(data.forms ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchForms(); }, [fetchForms]);

  async function toggleForm(id: string, active: boolean) {
    try {
      const res = await fetch(`/api/opt-in-forms/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      const data = await res.json() as { ok: boolean };
      if (data.ok) {
        setForms((prev) => prev.map((f) => f.id === id ? { ...f, active } : f));
        toast.success(active ? "Form activated" : "Form deactivated");
      }
    } catch {
      toast.error("Could not update form");
    }
  }

  async function deleteForm(id: string) {
    if (!confirm("Delete this form? Submissions are kept.")) return;
    try {
      const res = await fetch(`/api/opt-in-forms/${id}`, { method: "DELETE" });
      const data = await res.json() as { ok: boolean };
      if (data.ok) {
        setForms((prev) => prev.filter((f) => f.id !== id));
        toast.success("Form deleted");
      }
    } catch {
      toast.error("Could not delete form");
    }
  }

  const filtered = search.trim()
    ? forms.filter((f) =>
        [f.name, f.headline ?? "", ...f.tags].some((s) => s.toLowerCase().includes(search.toLowerCase()))
      )
    : forms;

  const totalViews = forms.reduce((s, f) => s + f.views, 0);
  const totalSubs = forms.reduce((s, f) => s + f.submissions, 0);

  return (
    <div className="min-h-screen bg-[#020509] text-white flex flex-col">
      <div className="fixed top-0 left-1/3 w-[500px] h-[400px] bg-cyan-500/[0.04] blur-[140px] rounded-full pointer-events-none" />
      <AppNav />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-emerald-400/70">Opt-In Forms</p>
            </div>
            <h1 className="text-3xl font-black text-white">Form Manager</h1>
            <p className="text-sm text-white/35 mt-1.5 leading-relaxed max-w-lg">
              Create public opt-in forms that collect emails and auto-enroll contacts into your flows. Each form gets a shareable link.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.07] rounded-xl px-3.5 py-2.5 w-56">
              <Search className="w-3.5 h-3.5 text-white/25 shrink-0" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search forms..." className="bg-transparent text-sm text-white placeholder-white/20 focus:outline-none w-full" />
            </div>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-sm font-black text-white hover:opacity-90 transition shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <Plus className="w-4 h-4" /> New Form
            </button>
          </div>
        </div>

        {/* Stats bar */}
        {!loading && forms.length > 0 && (
          <div className="flex gap-4 flex-wrap mb-8">
            {[
              { label: "Forms", value: forms.length },
              { label: "Active", value: forms.filter((f) => f.active).length },
              { label: "Total Views", value: totalViews.toLocaleString() },
              { label: "Total Subs", value: totalSubs.toLocaleString() },
              { label: "Avg Conv", value: totalViews > 0 ? `${((totalSubs / totalViews) * 100).toFixed(1)}%` : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-2.5">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/25">{label}</p>
                <p className="text-xl font-black text-white mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/[0.08] bg-white/[0.01] p-16 text-center">
            <FileText className="w-10 h-10 text-white/15 mx-auto mb-4" />
            <p className="text-sm text-white/30 mb-4">
              {search ? `No forms match "${search}"` : "No opt-in forms yet"}
            </p>
            {!search && (
              <button onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/25 text-sm font-bold text-cyan-400 hover:bg-cyan-500/[0.15] transition">
                <Plus className="w-4 h-4" /> Create First Form
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((form) => (
              <FormCard key={form.id} form={form} onToggle={toggleForm} onDelete={deleteForm} />
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <CreateFormModal
          onClose={() => setShowCreate(false)}
          onCreate={(form) => setForms((prev) => [form, ...prev])}
        />
      )}
    </div>
  );
}
