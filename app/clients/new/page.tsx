"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Users,
  Building2,
  DollarSign,
  Tag,
  Zap,
  Loader2,
  Upload,
} from "lucide-react";
import Papa from "papaparse";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  niche: string;
  pipelineStage: string;
  dealValue: string;
  tags: string;
  notes: string;
  priority: string;
  executionTier: "core" | "elite";
}

// ---------------------------------------------------------------------------
// Step config
// ---------------------------------------------------------------------------

const STEPS = [
  { label: "Identity", icon: Users },
  { label: "Business", icon: Building2 },
  { label: "Pipeline", icon: DollarSign },
  { label: "Tags", icon: Tag },
];

// ---------------------------------------------------------------------------
// Step 1: Identity
// ---------------------------------------------------------------------------

function StepIdentity({ form, setForm }: { form: FormData; setForm: (f: FormData) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-white/30 -mt-1 mb-2">Enter the client&apos;s contact info. You&apos;ll add business details next.</p>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Full Name *</label>
        <input
          autoFocus
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Sarah Johnson"
          className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="sarah@example.com"
            className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+1 (555) 000-0000"
            className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Business
// ---------------------------------------------------------------------------

function StepBusiness({ form, setForm }: { form: FormData; setForm: (f: FormData) => void }) {
  const NICHES = [
    "E-commerce", "SaaS", "Real Estate", "Health & Wellness",
    "Restaurant / Food", "Local Services", "Coaching / Consulting",
    "Agency", "Education", "Finance", "Other",
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Company Name</label>
        <input
          type="text"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
          placeholder="e.g. Acme Corp"
          className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
        />
      </div>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Website</label>
        <input
          type="url"
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
          placeholder="https://"
          className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
        />
      </div>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Niche / Industry</label>
        <div className="grid grid-cols-3 gap-2">
          {NICHES.map((n) => (
            <button
              key={n}
              onClick={() => setForm({ ...form, niche: n })}
              className={`text-xs py-2 px-3 rounded-xl border font-semibold transition ${
                form.niche === n
                  ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                  : "border-white/[0.08] bg-white/[0.02] text-white/40 hover:text-white/60 hover:border-white/20"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Pipeline
// ---------------------------------------------------------------------------

function StepPipeline({ form, setForm }: { form: FormData; setForm: (f: FormData) => void }) {
  const STAGES = [
    { value: "lead", label: "Lead", desc: "Just discovered or referred" },
    { value: "qualified", label: "Qualified", desc: "Budget and fit confirmed" },
    { value: "proposal", label: "Proposal", desc: "Sent proposal or contract" },
    { value: "active", label: "Active", desc: "Paying client" },
  ];

  const PRIORITIES = [
    { value: "low", label: "Low", color: "text-white/40" },
    { value: "normal", label: "Normal", color: "text-white/60" },
    { value: "high", label: "High", color: "text-red-400" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Execution Lane</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              id: "core" as const,
              label: "Core",
              desc: "Fast CRM setup with clean operator execution.",
            },
            {
              id: "elite" as const,
              label: "Elite",
              desc: "Higher-touch lane for premium follow-up and strategic handling.",
            },
          ].map((lane) => (
            <button
              key={lane.id}
              onClick={() => setForm({ ...form, executionTier: lane.id })}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                form.executionTier === lane.id
                  ? "border-cyan-500/40 bg-cyan-500/10"
                  : "border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04]"
              }`}
            >
              <p className={`text-sm font-bold ${form.executionTier === lane.id ? "text-cyan-300" : "text-white/70"}`}>{lane.label}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/30">{lane.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Pipeline Stage</label>
        <div className="space-y-2">
          {STAGES.map((s) => (
            <button
              key={s.value}
              onClick={() => setForm({ ...form, pipelineStage: s.value })}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                form.pipelineStage === s.value
                  ? "border-cyan-500/40 bg-cyan-500/10"
                  : "border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04]"
              }`}
            >
              <div className={`w-2 h-2 rounded-full shrink-0 ${form.pipelineStage === s.value ? "bg-cyan-400" : "bg-white/20"}`} />
              <div>
                <p className={`text-sm font-bold ${form.pipelineStage === s.value ? "text-cyan-300" : "text-white/60"}`}>{s.label}</p>
                <p className="text-[11px] text-white/25">{s.desc}</p>
              </div>
              {form.pipelineStage === s.value && <Check className="w-4 h-4 text-cyan-400 ml-auto" />}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Deal Value ($)</label>
          <input
            type="number"
            value={form.dealValue}
            onChange={(e) => setForm({ ...form, dealValue: e.target.value })}
            placeholder="e.g. 2500"
            className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Priority</label>
          <div className="flex gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                onClick={() => setForm({ ...form, priority: p.value })}
                className={`flex-1 py-3 rounded-xl border text-xs font-bold transition ${
                  form.priority === p.value
                    ? "border-white/30 bg-white/10 text-white"
                    : "border-white/[0.07] bg-white/[0.02] text-white/30 hover:text-white/50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Tags + Notes
// ---------------------------------------------------------------------------

function StepTags({ form, setForm }: { form: FormData; setForm: (f: FormData) => void }) {
  const SUGGESTED_TAGS = ["vip", "referral", "inbound", "outbound", "agency", "e-commerce", "retainer", "project"];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">
          Tags <span className="normal-case font-normal text-white/20">(comma separated)</span>
        </label>
        <input
          type="text"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          placeholder="vip, referral, e-commerce"
          className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {SUGGESTED_TAGS.map((t) => {
            const active = form.tags.split(",").map((x) => x.trim()).includes(t);
            return (
              <button
                key={t}
                onClick={() => {
                  const current = form.tags.split(",").map((x) => x.trim()).filter(Boolean);
                  const updated = active ? current.filter((x) => x !== t) : [...current, t];
                  setForm({ ...form, tags: updated.join(", ") });
                }}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition ${
                  active
                    ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
                    : "border-white/[0.08] text-white/30 hover:text-white/50"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Initial Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Context about this client, where they came from, specific goals..."
          rows={4}
          className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition resize-none"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CSV Import
// ---------------------------------------------------------------------------

function CSVImport({ onImported }: { onImported: (count: number) => void }) {
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<Array<Record<string, string>>>([]);
  const [error, setError] = useState("");
  const [executionTier, setExecutionTier] = useState<"core" | "elite">("elite");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreview(results.data.slice(0, 3));
      },
      error: () => setError("Could not parse CSV"),
    });
  }

  async function handleImport() {
    if (preview.length === 0) return;
    setImporting(true);
    setError("");

    const clients = preview.map((row) => ({
      name: row.name || row.Name || row.full_name || "Unknown",
      email: row.email || row.Email || "",
      phone: row.phone || row.Phone || "",
      company: row.company || row.Company || "",
      tags: [],
      pipelineStage: "lead",
      executionTier,
    }));

    try {
      let count = 0;
      for (const c of clients) {
        if (!c.name || c.name === "Unknown") continue;
        const res = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(c),
        });
        const data = await res.json() as { ok: boolean };
        if (data.ok) count++;
      }
      onImported(count);
    } catch {
      setError("Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="bg-white/[0.02] border border-dashed border-white/[0.15] rounded-2xl p-6 text-center">
      <Upload className="w-6 h-6 text-white/30 mx-auto mb-3" />
      <p className="text-sm font-bold text-white/50 mb-1">Import from CSV</p>
      <p className="text-[11px] text-white/25 mb-4">Columns: name, email, phone, company</p>
      <div className="mb-4 grid grid-cols-2 gap-2">
        {(["core", "elite"] as const).map((lane) => (
          <button
            key={lane}
            type="button"
            onClick={() => setExecutionTier(lane)}
            className={`rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] transition ${
              executionTier === lane
                ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                : "border-white/[0.08] bg-white/[0.03] text-white/35"
            }`}
          >
            {lane}
          </button>
        ))}
      </div>
      <input type="file" accept=".csv" onChange={handleFile} className="hidden" id="csv-upload" />
      <label
        htmlFor="csv-upload"
        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-sm text-white/50 hover:text-white/70 transition font-semibold"
      >
        <Upload className="w-3.5 h-3.5" /> Choose File
      </label>
      {preview.length > 0 && (
        <div className="mt-4 text-left">
          <p className="text-[11px] text-white/40 mb-2">{preview.length} rows detected (showing first 3)</p>
          {preview.map((row, i) => (
            <p key={i} className="text-[11px] text-white/30">{row.name || row.Name || "—"} · {row.email || row.Email || "—"}</p>
          ))}
          <button
            onClick={() => void handleImport()}
            disabled={importing}
            className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold hover:bg-cyan-500/30 transition disabled:opacity-40"
          >
            {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Import {preview.length} Clients
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const DEFAULT_FORM: FormData = {
  name: "", email: "", phone: "", company: "", website: "",
  niche: "", pipelineStage: "lead", dealValue: "", tags: "",
  notes: "", priority: "normal", executionTier: "elite",
};

export default function NewClientPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [showImport, setShowImport] = useState(false);

  async function handleCreate() {
    if (!form.name.trim()) {
      setError("Client name is required");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          company: form.company.trim() || undefined,
          website: form.website.trim() || undefined,
          niche: form.niche || undefined,
          pipelineStage: form.pipelineStage,
          dealValue: form.dealValue ? parseFloat(form.dealValue) : undefined,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          notes: form.notes.trim() || undefined,
          priority: form.priority,
          executionTier: form.executionTier,
        }),
      });
      const data = await res.json() as { ok: boolean; client?: { id: string }; error?: string; duplicate?: boolean; existingClientId?: string };
      if (!data.ok) {
        if (data.duplicate && data.existingClientId) {
          toast.error("A client with this name or email already exists", {
            action: { label: "View Existing", onClick: () => router.push(`/clients/${data.existingClientId}`) },
            duration: 8000,
          });
          setCreating(false);
          return;
        }
        throw new Error(data.error ?? "Failed");
      }
      toast.success("Client added! View their profile or start a campaign for them.");
      router.push(`/clients/${data.client?.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setCreating(false);
    }
  }

  const stepComponents = [
    <StepIdentity key={0} form={form} setForm={setForm} />,
    <StepBusiness key={1} form={form} setForm={setForm} />,
    <StepPipeline key={2} form={form} setForm={setForm} />,
    <StepTags key={3} form={form} setForm={setForm} />,
  ];

  const isLastStep = step === STEPS.length - 1;

  return (
    <main className="max-w-xl mx-auto px-4 py-12">
      <Link href="/clients" className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition mb-8">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Clients
      </Link>

      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-black text-white">Add Client</h1>
        <button
          onClick={() => setShowImport((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition"
        >
          <Upload className="w-3.5 h-3.5" />
          {showImport ? "Manual" : "Import CSV"}
        </button>
      </div>
      <p className="text-sm text-white/35 mb-8">
        Step {step + 1} of {STEPS.length} — {STEPS[step].label}
      </p>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-all ${
                  i < step
                    ? "bg-cyan-500 border-cyan-500"
                    : i === step
                    ? "bg-cyan-500/20 border-cyan-500/50"
                    : "bg-white/[0.03] border-white/[0.08]"
                }`}
              >
                {i < step ? (
                  <Check className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Icon className={`w-3.5 h-3.5 ${i === step ? "text-cyan-400" : "text-white/20"}`} />
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 rounded-full ${i < step ? "bg-cyan-500/50" : "bg-white/[0.06]"}`} />
              )}
            </div>
          );
        })}
      </div>

      {showImport ? (
        <CSVImport onImported={(count) => {
          router.push(`/clients?imported=${count}`);
        }} />
      ) : (
        <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6">
          {stepComponents[step]}

          {error && (
            <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 py-3 rounded-xl border border-white/[0.1] text-white/40 hover:text-white/60 text-sm font-semibold transition"
              >
                Back
              </button>
            )}
            {isLastStep ? (
              <button
                onClick={() => void handleCreate()}
                disabled={creating || !form.name.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {creating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                ) : (
                  <><Zap className="w-4 h-4" /> Create Client</>
                )}
              </button>
            ) : (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 0 && !form.name.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white text-sm font-bold transition disabled:opacity-40"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
