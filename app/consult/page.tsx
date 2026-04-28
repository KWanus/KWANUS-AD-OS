"use client";

import { useState, useEffect, useCallback } from "react";
import SimplifiedNav from "@/components/SimplifiedNav";
import { toast } from "sonner";
import {
  Loader2, Briefcase, FileText, BarChart2, Zap, Plus, ChevronDown,
  ChevronUp, X, Eye, DollarSign, Calendar, MessageSquare, Package,
  ClipboardList, Sparkles, Users,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConsultPackage {
  id: string;
  name: string;
  type: "hourly" | "retainer" | "project" | "productized" | "vip_day";
  price: number;
  billingCycle: string | null;
  deliverables: string[];
  duration: string | null;
  createdAt: string;
}

interface Proposal {
  id: string;
  title: string;
  status: "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired";
  totalValue: number | null;
  viewCount: number;
  createdAt: string;
  aiJson: Record<string, unknown> | null;
}

interface OnboardingSection {
  section: string;
  questions: string[];
}

type ExecutionTier = "core" | "elite";

// ---------------------------------------------------------------------------
// Config maps
// ---------------------------------------------------------------------------

const TYPE_COLORS: Record<string, string> = {
  hourly:       "text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20",
  retainer:     "text-[#e07850] bg-[#e07850]/10 border-[#e07850]/20",
  project:      "text-green-400 bg-green-500/10 border-green-500/20",
  productized:  "text-blue-400 bg-blue-500/10 border-blue-500/20",
  vip_day:      "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
};

const PROPOSAL_STATUS_COLORS: Record<string, string> = {
  draft:    "text-white/40 border-white/10",
  sent:     "text-[#f5a623] border-[#f5a623]/20",
  viewed:   "text-blue-400 border-blue-500/20",
  accepted: "text-green-400 border-green-500/20",
  rejected: "text-red-400 border-red-500/20",
  expired:  "text-orange-400 border-orange-500/20",
};

const TABS = [
  { id: "packages",  label: "Packages",      icon: Package },
  { id: "proposals", label: "Proposals",     icon: FileText },
  { id: "audits",    label: "Audit Reports", icon: BarChart2 },
  { id: "generate",  label: "Generate",      icon: Sparkles },
];

// ---------------------------------------------------------------------------
// Small shared components
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">
      {children}
    </p>
  );
}

function InputField({
  placeholder, value, onChange, type = "text",
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#f5a623]/40 transition w-full"
    />
  );
}

function PrimaryButton({
  onClick, disabled, loading, children,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="flex items-center gap-2 bg-gradient-to-r from-[#f5a623] to-[#e07850] text-white text-sm font-black px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-30 transition"
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
}

function EmptyState({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="w-10 h-10 text-white/10 mb-3" />
      <p className="text-sm font-bold text-white/30">{title}</p>
      <p className="text-xs text-white/20 mt-1">{subtitle}</p>
    </div>
  );
}

function ExecutionTierPicker({
  value,
  onChange,
  options,
}: {
  value: ExecutionTier;
  onChange: (tier: ExecutionTier) => void;
  options: Record<ExecutionTier, string>;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {([
        ["core", "Core"],
        ["elite", "Elite"],
      ] as const).map(([tier, label]) => (
        <button
          key={tier}
          type="button"
          onClick={() => onChange(tier)}
          className={`rounded-2xl border px-4 py-3 text-left transition ${
            value === tier
              ? "border-[#f5a623]/25 bg-[#f5a623]/10 text-[#f5f0e8]"
              : "border-white/[0.08] bg-white/[0.03] text-white/60 hover:border-[#f5a623]/20 hover:bg-[#f5a623]/[0.05]"
          }`}
        >
          <p className="text-sm font-black">{label}</p>
          <p className="mt-1 text-xs leading-5 text-inherit/75">{options[tier]}</p>
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Proposal modal
// ---------------------------------------------------------------------------

function ProposalModal({ proposal, onClose }: { proposal: Proposal; onClose: () => void }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
const ai = proposal.aiJson as Record<string, any> | null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#0b1120] border border-white/[0.08] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-base font-black text-white">{proposal.title}</h2>
            <p className="text-xs text-white/30 mt-0.5">
              {new Date(proposal.createdAt).toLocaleDateString()} · {proposal.viewCount} views
            </p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {ai ? (
          <div className="space-y-5">
            {ai.problemStatement && (
              <div>
                <SectionLabel>Problem Statement</SectionLabel>
                <p className="text-sm text-white/60 leading-relaxed">{String(ai.problemStatement)}</p>
              </div>
            )}
            {ai.solution && (
              <div>
                <SectionLabel>Our Solution</SectionLabel>
                <p className="text-sm text-white/60 leading-relaxed">{String(ai.solution)}</p>
              </div>
            )}
            {Array.isArray(ai.packages) && ai.packages.length > 0 && (
              <div>
                <SectionLabel>Packages</SectionLabel>
                <div className="space-y-2">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(ai.packages as Array<any>).map((pkg: any, i: number) => (
                    <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-white">{String(pkg.name ?? "")}</span>
                        <span className="text-sm font-black text-[#f5a623]">{String(pkg.price ?? "")}</span>
                      </div>
                      {pkg.description && (
                        <p className="text-xs text-white/40">{String(pkg.description)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {ai.guarantee && (
              <div>
                <SectionLabel>Guarantee</SectionLabel>
                <p className="text-sm text-white/60 leading-relaxed">{String(ai.guarantee)}</p>
              </div>
            )}
            {ai.closingStatement && (
              <div>
                <SectionLabel>Closing</SectionLabel>
                <p className="text-sm text-white/60 leading-relaxed">{String(ai.closingStatement)}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-white/30">No AI content available for this proposal.</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Packages
// ---------------------------------------------------------------------------

function PackagesTab() {
  const [executionTier, setExecutionTier] = useState<"core" | "elite">("elite");
  const [packages, setPackages] = useState<ConsultPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenForm, setShowGenForm] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [adding, setAdding] = useState(false);

  const [genNiche, setGenNiche] = useState("");
  const [genBusinessType, setGenBusinessType] = useState("");
  const [genTargetClient, setGenTargetClient] = useState("");

  const [addName, setAddName] = useState("");
  const [addType, setAddType] = useState("retainer");
  const [addPrice, setAddPrice] = useState("");
  const [addBilling, setAddBilling] = useState("");
  const [addDuration, setAddDuration] = useState("");
  const [addDeliverables, setAddDeliverables] = useState("");

  const fetchPackages = useCallback(async () => {
    try {
      const res = await fetch("/api/consult/packages");
      const data = await res.json() as { ok: boolean; packages: ConsultPackage[] };
      if (data.ok) setPackages(data.packages);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchPackages(); }, [fetchPackages]);

  async function handleGenerate() {
    if (!genNiche.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/consult/packages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: genNiche,
          businessType: genBusinessType,
          targetClient: genTargetClient,
          executionTier,
        }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) {
        toast.success("Packages generated successfully");
        setShowGenForm(false);
        setGenNiche(""); setGenBusinessType(""); setGenTargetClient("");
        await fetchPackages();
      } else {
        toast.error(data.error ?? "Generation failed");
      }
    } catch {
      toast.error("Could not connect to server");
    } finally {
      setGenerating(false);
    }
  }

  async function handleAdd() {
    if (!addName.trim() || !addPrice.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/consult/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addName,
          type: addType,
          price: parseFloat(addPrice),
          billingCycle: addBilling || null,
          duration: addDuration || null,
          deliverables: addDeliverables.split("\n").map((d) => d.trim()).filter(Boolean),
        }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) {
        toast.success("Package added");
        setShowAddForm(false);
        setAddName(""); setAddPrice(""); setAddBilling(""); setAddDuration(""); setAddDeliverables("");
        await fetchPackages();
      } else {
        toast.error(data.error ?? "Failed to add package");
      }
    } catch {
      toast.error("Could not connect to server");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <PrimaryButton onClick={() => { setShowGenForm((p) => !p); setShowAddForm(false); }} loading={false}>
          <Sparkles className="w-3.5 h-3.5" /> Generate Packages
        </PrimaryButton>
        <button
          onClick={() => { setShowAddForm((p) => !p); setShowGenForm(false); }}
          className="flex items-center gap-2 border border-white/[0.08] text-white/50 hover:text-white text-sm font-bold px-4 py-2 rounded-xl transition"
        >
          <Plus className="w-3.5 h-3.5" /> Add Package
        </button>
      </div>

      {showGenForm && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 mb-4 space-y-3">
          <SectionLabel>Generate with AI</SectionLabel>
          <ExecutionTierPicker
            value={executionTier}
            onChange={setExecutionTier}
            options={{
              core: "Strong pricing tiers and clear package separation.",
              elite: "Sharper premium positioning, better value ladders, stronger close logic.",
            }}
          />
          <InputField placeholder="Your niche (e.g. marketing agency, life coach)" value={genNiche} onChange={setGenNiche} />
          <InputField placeholder="Business type (e.g. solo consultant, boutique agency)" value={genBusinessType} onChange={setGenBusinessType} />
          <InputField placeholder="Target client (e.g. B2B SaaS founders)" value={genTargetClient} onChange={setGenTargetClient} />
          <PrimaryButton onClick={handleGenerate} disabled={!genNiche.trim()} loading={generating}>
            Generate Packages
          </PrimaryButton>
        </div>
      )}

      {showAddForm && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 mb-4 space-y-3">
          <SectionLabel>New Package</SectionLabel>
          <InputField placeholder="Package name" value={addName} onChange={setAddName} />
          <div className="flex gap-3">
            <InputField placeholder="Price (USD)" value={addPrice} onChange={setAddPrice} type="number" />
            <select
              value={addType}
              onChange={(e) => setAddType(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#f5a623]/40 transition flex-1"
            >
              {["hourly", "retainer", "project", "productized", "vip_day"].map((t) => (
                <option key={t} value={t} className="bg-[#0b1120]">{t.replace("_", " ")}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <InputField placeholder="Billing cycle (e.g. monthly)" value={addBilling} onChange={setAddBilling} />
            <InputField placeholder="Duration (e.g. 3 months)" value={addDuration} onChange={setAddDuration} />
          </div>
          <textarea
            placeholder={"Deliverables (one per line)"}
            value={addDeliverables}
            onChange={(e) => setAddDeliverables(e.target.value)}
            rows={3}
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#f5a623]/40 transition w-full resize-none"
          />
          <PrimaryButton onClick={handleAdd} disabled={!addName.trim() || !addPrice.trim()} loading={adding}>
            Add Package
          </PrimaryButton>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-white/20" /></div>
      ) : packages.length === 0 ? (
        <EmptyState icon={Package} title="No packages yet" subtitle="Generate with AI or add one manually" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 hover:border-white/[0.1] transition">
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-sm font-black text-white">{pkg.name}</h3>
                <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold capitalize ${TYPE_COLORS[pkg.type] ?? TYPE_COLORS.project}`}>
                  {pkg.type.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-lg font-black text-[#f5a623]">${pkg.price.toLocaleString()}</span>
                {pkg.billingCycle && <span className="text-xs text-white/30">/ {pkg.billingCycle}</span>}
                {pkg.duration && <span className="text-xs text-white/30">{pkg.duration}</span>}
              </div>
              {pkg.deliverables.length > 0 && (
                <div>
                  <SectionLabel>Deliverables</SectionLabel>
                  <ul className="space-y-1">
                    {pkg.deliverables.slice(0, 4).map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-white/50">
                        <span className="w-1 h-1 rounded-full bg-[#f5a623]/50 mt-1.5 shrink-0" />
                        {d}
                      </li>
                    ))}
                    {pkg.deliverables.length > 4 && (
                      <li className="text-xs text-white/25">+{pkg.deliverables.length - 4} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Proposals
// ---------------------------------------------------------------------------

function ProposalsTab() {
  const [executionTier, setExecutionTier] = useState<"core" | "elite">("elite");
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  const [bizName, setBizName] = useState("");
  const [niche, setNiche] = useState("");
  const [budget, setBudget] = useState("");

  const fetchProposals = useCallback(async () => {
    try {
      const res = await fetch("/api/consult/proposals");
      const data = await res.json() as { ok: boolean; proposals: Proposal[] };
      if (data.ok) setProposals(data.proposals);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchProposals(); }, [fetchProposals]);

  async function handleGenerate() {
    if (!bizName.trim() || !niche.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/consult/proposals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: bizName,
          niche,
          budget: budget || undefined,
          executionTier,
        }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) {
        toast.success("Proposal generated");
        setShowForm(false);
        setBizName(""); setNiche(""); setBudget("");
        await fetchProposals();
      } else {
        toast.error(data.error ?? "Generation failed");
      }
    } catch {
      toast.error("Could not connect to server");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <PrimaryButton onClick={() => setShowForm((p) => !p)}>
          <Sparkles className="w-3.5 h-3.5" /> Generate Proposal
        </PrimaryButton>
      </div>

      {showForm && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 mb-4 space-y-3">
          <SectionLabel>New Proposal</SectionLabel>
          <ExecutionTierPicker
            value={executionTier}
            onChange={setExecutionTier}
            options={{
              core: "Strong proposal structure and clear offer framing.",
              elite: "Sharper diagnosis, premium positioning, and stronger close-rate logic.",
            }}
          />
          <InputField placeholder="Business name" value={bizName} onChange={setBizName} />
          <InputField placeholder="Niche / industry" value={niche} onChange={setNiche} />
          <InputField placeholder="Budget (optional, e.g. $3,000/mo)" value={budget} onChange={setBudget} />
          <PrimaryButton onClick={handleGenerate} disabled={!bizName.trim() || !niche.trim()} loading={generating}>
            Generate
          </PrimaryButton>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-white/20" /></div>
      ) : proposals.length === 0 ? (
        <EmptyState icon={FileText} title="No proposals yet" subtitle="Generate a proposal for your next prospect" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {proposals.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedProposal(p)}
              className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 hover:border-white/[0.1] transition cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-black text-white leading-snug">{p.title}</h3>
                <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold capitalize whitespace-nowrap ${PROPOSAL_STATUS_COLORS[p.status] ?? PROPOSAL_STATUS_COLORS.draft}`}>
                  {p.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-white/35">
                {p.totalValue && (
                  <span className="flex items-center gap-1 text-[#f5a623]/80 font-bold">
                    <DollarSign className="w-3 h-3" />${p.totalValue.toLocaleString()}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(p.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />{p.viewCount} views
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProposal && (
        <ProposalModal proposal={selectedProposal} onClose={() => setSelectedProposal(null)} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Audit Reports
// ---------------------------------------------------------------------------

function AuditsTab() {
  const [executionTier, setExecutionTier] = useState<ExecutionTier>("elite");
  const [reports, setReports] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [bizName, setBizName] = useState("");
  const [niche, setNiche] = useState("");
  const [score, setScore] = useState("");

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch("/api/consult/proposals?type=audit_report");
      const data = await res.json() as { ok: boolean; proposals: Proposal[] };
      if (data.ok) {
        setReports(data.proposals.filter((p) => {
          const ai = p.aiJson as Record<string, unknown> | null;
          return ai?.type === "audit_report";
        }));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchReports(); }, [fetchReports]);

  async function handleGenerate() {
    if (!bizName.trim() || !niche.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/consult/audit-report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: bizName,
          niche,
          score: score ? parseInt(score) : undefined,
          executionTier,
        }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) {
        toast.success("Audit report generated");
        setShowForm(false);
        setBizName(""); setNiche(""); setScore("");
        await fetchReports();
      } else {
        toast.error(data.error ?? "Generation failed");
      }
    } catch {
      toast.error("Could not connect to server");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <PrimaryButton onClick={() => setShowForm((p) => !p)}>
          <Sparkles className="w-3.5 h-3.5" /> Generate Audit Report
        </PrimaryButton>
      </div>

      {showForm && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 mb-4 space-y-3">
          <SectionLabel>New Audit Report</SectionLabel>
          <ExecutionTierPicker
            value={executionTier}
            onChange={setExecutionTier}
            options={{
              core: "Strong audit structure with clear gaps, wins, and next steps.",
              elite: "Sharper diagnosis, stronger value framing, and more premium consultant positioning.",
            }}
          />
          <InputField placeholder="Business name" value={bizName} onChange={setBizName} />
          <InputField placeholder="Niche / industry" value={niche} onChange={setNiche} />
          <InputField placeholder="Overall score 0-100 (optional)" value={score} onChange={setScore} type="number" />
          <PrimaryButton onClick={handleGenerate} disabled={!bizName.trim() || !niche.trim()} loading={generating}>
            Generate Report
          </PrimaryButton>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-white/20" /></div>
      ) : reports.length === 0 ? (
        <EmptyState icon={BarChart2} title="No audit reports yet" subtitle="Generate a full audit report for a prospect or client" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {reports.map((r) => {
            const ai = r.aiJson as Record<string, unknown> | null;
            const scorecard = ai?.scorecard as Record<string, number> | undefined;
            return (
              <div key={r.id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 hover:border-white/[0.1] transition">
                <h3 className="text-sm font-black text-white mb-2">{r.title}</h3>
                {scorecard && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {Object.entries(scorecard).map(([key, val]) => (
                      <span key={key} className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        val >= 70 ? "bg-green-500/10 text-green-400" :
                        val >= 50 ? "bg-yellow-500/10 text-yellow-400" :
                        "bg-red-500/10 text-red-400"
                      }`}>
                        {key}: {val}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-white/30">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Generate (AI Tools hub)
// ---------------------------------------------------------------------------

function GenerateTab({ setActiveTab }: { setActiveTab: (t: string) => void }) {
  const [executionTier, setExecutionTier] = useState<ExecutionTier>("elite");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [onbNiche, setOnbNiche] = useState("");
  const [onbClientName, setOnbClientName] = useState("");
  const [onbBizType, setOnbBizType] = useState("");
  const [onboardingSections, setOnboardingSections] = useState<OnboardingSection[]>([]);
  const [openSection, setOpenSection] = useState<number | null>(0);

  async function handleOnboarding() {
    if (!onbNiche.trim() || !onbClientName.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/consult/onboarding/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: onbNiche,
          clientName: onbClientName,
          businessType: onbBizType,
          executionTier,
        }),
      });
      const data = await res.json() as {
        ok: boolean;
        questionnaire?: {
          sections?: Array<{
            title: string;
            questions: Array<{ question: string }>;
          }>;
        };
        error?: string;
      };
      if (data.ok) {
        toast.success("Onboarding questionnaire generated");
        setOnboardingSections(
          (data.questionnaire?.sections ?? []).map((section) => ({
            section: section.title,
            questions: section.questions.map((q) => q.question),
          }))
        );
        setOpenSection(0);
      } else {
        toast.error(data.error ?? "Generation failed");
      }
    } catch {
      toast.error("Could not connect to server");
    } finally {
      setGenerating(false);
    }
  }

  const quickActions = [
    {
      title: "Generate Service Packages",
      desc: "AI-crafted pricing tiers tailored to your niche",
      icon: Package,
      color: "from-[#f5a623]/20 to-[#f5a623]/5 border-[#f5a623]/20",
      iconColor: "text-[#f5a623]",
      action: () => setActiveTab("packages"),
    },
    {
      title: "Write a Proposal",
      desc: "Full client proposal with problem, solution & pricing",
      icon: FileText,
      color: "from-[#e07850]/20 to-[#e07850]/5 border-[#e07850]/20",
      iconColor: "text-[#e07850]",
      action: () => setActiveTab("proposals"),
    },
    {
      title: "Run Audit Report",
      desc: "Scorecard-style business audit with actionable fixes",
      icon: BarChart2,
      color: "from-green-500/20 to-green-500/5 border-green-500/20",
      iconColor: "text-green-400",
      action: () => setActiveTab("audits"),
    },
    {
      title: "Client Onboarding Q's",
      desc: "Custom intake questionnaire for a new client",
      icon: ClipboardList,
      color: "from-blue-500/20 to-blue-500/5 border-blue-500/20",
      iconColor: "text-blue-400",
      action: () => setShowOnboarding((p) => !p),
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {quickActions.map((qa) => (
          <button
            key={qa.title}
            onClick={qa.action}
            className={`bg-gradient-to-br ${qa.color} border rounded-2xl p-4 text-left hover:opacity-80 transition`}
          >
            <qa.icon className={`w-5 h-5 ${qa.iconColor} mb-3`} />
            <p className="text-sm font-black text-white">{qa.title}</p>
            <p className="text-xs text-white/40 mt-1 leading-relaxed">{qa.desc}</p>
          </button>
        ))}
      </div>

      {showOnboarding && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-3">
          <SectionLabel>Client Onboarding Questionnaire</SectionLabel>
          <ExecutionTierPicker
            value={executionTier}
            onChange={setExecutionTier}
            options={{
              core: "Strong discovery questions that cover goals, blockers, and scope clearly.",
              elite: "Deeper consultant-grade discovery with stronger diagnostic and strategic questions.",
            }}
          />
          <InputField placeholder="Your niche (e.g. social media marketing)" value={onbNiche} onChange={setOnbNiche} />
          <InputField placeholder="Client name or company" value={onbClientName} onChange={setOnbClientName} />
          <InputField placeholder="Client business type (e.g. e-commerce brand)" value={onbBizType} onChange={setOnbBizType} />
          <PrimaryButton onClick={handleOnboarding} disabled={!onbNiche.trim() || !onbClientName.trim()} loading={generating}>
            Generate Questions
          </PrimaryButton>

          {onboardingSections.length > 0 && (
            <div className="space-y-2 pt-2">
              {onboardingSections.map((sec, i) => (
                <div key={i} className="border border-white/[0.07] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenSection(openSection === i ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition"
                  >
                    <span className="text-sm font-bold text-white">{sec.section}</span>
                    {openSection === i ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                  </button>
                  {openSection === i && (
                    <div className="px-4 pb-4 space-y-2">
                      {sec.questions.map((q, j) => (
                        <div key={j} className="flex items-start gap-2 text-sm text-white/60">
                          <span className="text-white/20 font-bold text-xs mt-0.5 shrink-0">{j + 1}.</span>
                          {q}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ConsultPage() {
  const [activeTab, setActiveTab] = useState("packages");

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <SimplifiedNav />
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-20">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#f5a623] to-[#e07850] flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-black text-white">Consult OS</h1>
          </div>
          <p className="text-sm text-white/35">Packages, proposals, audits, and onboarding — all AI-powered</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/[0.06] mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 transition -mb-px ${
                activeTab === tab.id
                  ? "border-[#f5a623] text-white"
                  : "border-transparent text-white/35 hover:text-white/60"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "packages"  && <PackagesTab />}
        {activeTab === "proposals" && <ProposalsTab />}
        {activeTab === "audits"    && <AuditsTab />}
        {activeTab === "generate"  && <GenerateTab setActiveTab={setActiveTab} />}
      </div>
    </div>
  );
}
