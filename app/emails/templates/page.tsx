"use client";

import { useState, useEffect } from "react";
import AppNav from "@/components/AppNav";
import CampaignSubNav from "@/components/BuildSubNav";
import {
  LayoutTemplate, Loader2, Zap, Search, ChevronRight,
  Mail, Clock, Eye, Copy, Check, X, ArrowRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmailStep {
  subject: string;
  previewText: string;
  body: string;
  delayDays: number;
  purpose: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  trigger: string;
  emails: EmailStep[];
}

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  welcome:       { label: "Welcome",       color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/20" },
  nurture:       { label: "Nurture",       color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20" },
  sales:         { label: "Sales",         color: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/20" },
  cart:          { label: "Cart Recovery", color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20" },
  onboarding:    { label: "Onboarding",    color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  reengagement:  { label: "Re-engagement", color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20" },
};

function categoryMeta(cat: string) {
  return CATEGORY_META[cat] ?? { label: cat, color: "text-white/40", bg: "bg-white/[0.04]", border: "border-white/[0.08]" };
}

// ─── Preview Modal ────────────────────────────────────────────────────────────

function PreviewModal({
  template,
  onClose,
  onUse,
}: {
  template: EmailTemplate;
  onClose: () => void;
  onUse: (t: EmailTemplate) => void;
}) {
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const meta = categoryMeta(template.category);
  const current = template.emails[step];

  function copyBody() {
    void navigator.clipboard.writeText(current?.body ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-white/[0.08] bg-[#020509] shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{template.thumbnail}</span>
            <div>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] mb-1 ${meta.color} ${meta.bg} ${meta.border}`}>
                {meta.label}
              </span>
              <h3 className="text-base font-black text-white">{template.name}</h3>
              <p className="text-xs text-white/35 mt-0.5">{template.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-white/25 hover:text-white hover:bg-white/[0.05] transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Email step nav */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-white/[0.04] overflow-x-auto scrollbar-none">
          {template.emails.map((e, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${
                step === i
                  ? "bg-cyan-500/15 border border-cyan-500/25 text-cyan-400"
                  : "text-white/30 hover:text-white/55 hover:bg-white/[0.04]"
              }`}
            >
              <Mail className="w-3 h-3 shrink-0" />
              Email {i + 1}
              {i > 0 && (
                <span className="text-[9px] text-white/20">
                  +{e.delayDays}d
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Email body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {current && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/25 mb-1">Subject Line</p>
                  <p className="text-sm font-bold text-white">{current.subject}</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/25 mb-1">Preview Text</p>
                  <p className="text-sm text-white/60">{current.previewText}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.22em] text-white/25">Purpose</span>
                <span className="text-xs text-white/45 italic">{current.purpose}</span>
              </div>

              <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <button
                  onClick={copyBody}
                  className="absolute top-3 right-3 p-1.5 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.05] transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <p className="text-xs text-white/55 whitespace-pre-line leading-relaxed pr-6">{current.body}</p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 text-xs text-white/30">
            <Clock className="w-3.5 h-3.5" />
            {template.emails.length} emails ·{" "}
            {template.emails.reduce((s, e) => s + e.delayDays, 0)}d sequence ·{" "}
            Trigger: {template.trigger}
          </div>
          <button
            onClick={() => { onUse(template); onClose(); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-sm font-black text-white hover:opacity-90 transition shadow-[0_0_20px_rgba(6,182,212,0.2)]"
          >
            Use Template
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Template Card ────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onPreview,
  onUse,
}: {
  template: EmailTemplate;
  onPreview: (t: EmailTemplate) => void;
  onUse: (t: EmailTemplate) => void;
}) {
  const meta = categoryMeta(template.category);
  const totalDays = template.emails.reduce((s, e) => s + e.delayDays, 0);

  return (
    <div className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] hover:border-cyan-500/20 hover:bg-cyan-500/[0.025] transition-all p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-xl shrink-0">
            {template.thumbnail}
          </div>
          <div>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] ${meta.color} ${meta.bg} ${meta.border}`}>
              {meta.label}
            </span>
            <h3 className="text-sm font-black text-white mt-1 group-hover:text-cyan-100 transition">{template.name}</h3>
          </div>
        </div>
      </div>

      <p className="text-xs text-white/40 leading-relaxed">{template.description}</p>

      <div className="flex items-center gap-3 text-[10px] text-white/25 font-bold">
        <span className="flex items-center gap-1">
          <Mail className="w-3 h-3" /> {template.emails.length} emails
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {totalDays}d sequence
        </span>
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3" /> {template.trigger}
        </span>
      </div>

      {/* Subjects preview */}
      <div className="space-y-1.5">
        {template.emails.slice(0, 3).map((e, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            <span className="w-4 h-4 rounded-md bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-[9px] font-black text-white/30 shrink-0">
              {i + 1}
            </span>
            <span className="text-white/45 truncate">{e.subject}</span>
          </div>
        ))}
        {template.emails.length > 3 && (
          <p className="text-[10px] text-white/20 pl-6">+ {template.emails.length - 3} more emails</p>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onPreview(template)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.08] text-[11px] font-bold text-white/45 hover:text-white/70 hover:border-white/15 transition"
        >
          <Eye className="w-3 h-3" /> Preview
        </button>
        <button
          onClick={() => onUse(template)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] text-[11px] font-black text-cyan-400 hover:bg-cyan-500/[0.1] transition"
        >
          Use Template <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [preview, setPreview] = useState<EmailTemplate | null>(null);
  const [usedId, setUsedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/templates?type=email");
        const data = (await res.json()) as { ok: boolean; emailTemplates?: EmailTemplate[] };
        if (data.ok && data.emailTemplates) setTemplates(data.emailTemplates);
      } catch {
        // fallback to empty
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  function handleUse(t: EmailTemplate) {
    setUsedId(t.id);
    // Route user to create a new flow pre-seeded with this template
    window.location.href = `/emails?createFlow=1&templateId=${t.id}`;
  }

  const categories = ["all", ...Array.from(new Set(templates.map((t) => t.category)))];

  const filtered = templates.filter((t) => {
    const matchCat = activeCategory === "all" || t.category === activeCategory;
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.emails.some((e) => e.subject.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#020509] text-white flex flex-col">
      {/* Background glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/[0.05] blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/[0.04] blur-[120px] rounded-full pointer-events-none" />

      <AppNav />
      <CampaignSubNav />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
                <LayoutTemplate className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-purple-400/70">Email Templates</p>
            </div>
            <h1 className="text-3xl font-black text-white">Proven Sequences</h1>
            <p className="text-sm text-white/35 mt-1.5 leading-relaxed max-w-lg">
              Pre-built email flows engineered for conversion. Pick a template, launch a flow, and start generating revenue — no copywriting required.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.07] rounded-xl px-3.5 py-2.5 w-64">
              <Search className="w-3.5 h-3.5 text-white/25 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="bg-transparent text-sm text-white placeholder-white/20 focus:outline-none w-full"
              />
            </div>
          </div>
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto scrollbar-none pb-1">
          {categories.map((cat) => {
            const meta = cat === "all" ? null : categoryMeta(cat);
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                  active
                    ? meta
                      ? `${meta.color} ${meta.bg} ${meta.border}`
                      : "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                    : "border-white/[0.07] text-white/35 hover:text-white/60 hover:border-white/15"
                }`}
              >
                {cat === "all" ? "All Templates" : (meta?.label ?? cat)}
              </button>
            );
          })}
        </div>

        {/* Stats bar */}
        {!loading && templates.length > 0 && (
          <div className="flex gap-4 flex-wrap mb-8">
            {[
              { label: "Templates", value: templates.length },
              { label: "Categories", value: categories.length - 1 },
              { label: "Avg Emails", value: Math.round(templates.reduce((s, t) => s + t.emails.length, 0) / templates.length) },
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
            <LayoutTemplate className="w-10 h-10 text-white/15 mx-auto mb-4" />
            <p className="text-sm text-white/30">
              {search ? `No templates match "${search}"` : "No templates in this category yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onPreview={(tmpl) => setPreview(tmpl)}
                onUse={handleUse}
              />
            ))}
          </div>
        )}

        {/* Callout */}
        {!loading && filtered.length > 0 && (
          <div className="mt-10 rounded-2xl border border-purple-500/15 bg-purple-500/[0.04] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-purple-400/70 mb-1">How it works</p>
              <p className="text-sm text-white/55 leading-relaxed max-w-lg">
                Clicking <strong className="text-white/70">Use Template</strong> creates a new flow pre-loaded with this sequence. You can edit any step before activating. Variables like <code className="text-purple-300/70 text-[11px]">{"{{firstName}}"}</code> are auto-filled from your contact list.
              </p>
            </div>
            <a
              href="/emails"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-purple-500/25 bg-purple-500/10 text-sm font-black text-purple-400 hover:bg-purple-500/15 transition shrink-0"
            >
              Go to Flows <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </main>

      {preview && (
        <PreviewModal
          template={preview}
          onClose={() => setPreview(null)}
          onUse={handleUse}
        />
      )}
    </div>
  );
}
