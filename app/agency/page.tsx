"use client";

import { useState, useEffect, useCallback } from "react";
import AppNav from "@/components/AppNav";
import { toast } from "sonner";
import {
  X,
  ChevronRight,
  Loader2,
  Building,
  TrendingUp,
  FileText,
  DollarSign,
  Copy,
  Check,
  ArrowRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BusinessType = "consultant" | "local" | "ecommerce" | "saas" | "affiliate" | "agency";
type ExecutionTier = "core" | "elite";

interface ScoreBreakdown {
  Traffic: number;
  Conversion: number;
  Offer: number;
  Trust: number;
  Automation: number;
}

interface AuditPoint {
  category: string;
  grade: "A" | "B" | "C" | "D" | "F";
  finding: string;
  recommendation: string;
  priority: "high" | "medium" | "low";
}

interface Opportunity {
  title: string;
  description: string;
  estimatedRevenueLift: string;
}

interface Audit {
  id: string;
  businessName: string;
  businessUrl?: string;
  businessType: BusinessType;
  niche: string;
  location?: string;
  overallScore: number;
  scoreBreakdown: ScoreBreakdown;
  status: "pending" | "complete" | "error";
  auditPoints?: AuditPoint[];
  topOpportunities?: Opportunity[];
  strategyJson?: Strategy | null;
  proposalJson?: Proposal | null;
  createdAt: string;
}

interface PhaseTask {
  task: string;
  owner: "agency" | "client";
  timeline: string;
  tool?: string;
}

interface Phase {
  name: string;
  focus: string;
  tasks: PhaseTask[];
  kpis: string[];
  expectedOutcome: string;
}

interface Strategy {
  summary: string;
  phases: Phase[];
  totalProjectedRevenueLift: string;
}

interface EngagementTier {
  name: string;
  price: number;
  billingCycle: string;
  deliverables: string[];
}

interface Proposal {
  title: string;
  problemStatement: string;
  ourApproach: string;
  engagementOptions: EngagementTier[];
  socialProof: string;
  guarantee: string;
}

interface PricingResult {
  marketRates: { low: number; mid: number; premium: number };
  recommendedPosition: "mid" | "premium";
  reasoning: string;
  packages: Array<{
    name: string;
    price: number;
    billingCycle: string;
    deliverables: string[];
    profitMargin: number;
  }>;
  valueAnchors: string[];
  pricingPsychologyTips: string[];
  upsellOpportunities: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABS = ["Audits", "Strategy", "Proposals", "Pricing"] as const;
type Tab = (typeof TABS)[number];

const BUSINESS_TYPE_COLORS: Record<BusinessType, string> = {
  consultant: "text-[#e07850] bg-purple-500/10 border-purple-500/20",
  local:      "text-green-400 bg-green-500/10 border-green-500/20",
  ecommerce:  "text-orange-400 bg-orange-500/10 border-orange-500/20",
  saas:       "text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20",
  affiliate:  "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  agency:     "text-blue-400 bg-blue-500/10 border-blue-500/20",
};

const GRADE_COLORS: Record<string, string> = {
  A: "text-green-400 bg-green-500/10 border-green-500/20",
  B: "text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20",
  C: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  D: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  F: "text-red-400 bg-red-500/10 border-red-500/20",
};

const PRIORITY_COLORS: Record<string, string> = {
  high:   "text-red-400 bg-red-500/10 border-red-500/20",
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  low:    "text-white/40 bg-white/[0.04] border-white/[0.08]",
};

function scoreColor(score: number) {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-[#f5a623]";
  if (score >= 40) return "text-yellow-400";
  if (score >= 20) return "text-orange-400";
  return "text-red-400";
}

function scoreRingColor(score: number) {
  if (score >= 80) return "#4ade80";
  if (score >= 60) return "#22d3ee";
  if (score >= 40) return "#facc15";
  if (score >= 20) return "#fb923c";
  return "#f87171";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ScoreRing({ score }: { score: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreRingColor(score);
  return (
    <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
      <svg className="absolute inset-0 -rotate-90" width="56" height="56">
        <circle cx="28" cy="28" r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" fill="none" />
        <circle
          cx="28" cy="28" r={r}
          stroke={color} strokeWidth="3.5" fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span className={`text-sm font-black ${scoreColor(score)}`}>{score}</span>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{label}</span>
        <span className={`text-xs font-black ${scoreColor(value)}`}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: scoreRingColor(value) }}
        />
      </div>
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#06090f] border border-white/[0.08] rounded-2xl p-6 space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

function ExecutionTierPicker({
  value,
  onChange,
}: {
  value: ExecutionTier;
  onChange: (tier: ExecutionTier) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[
        {
          id: "core" as const,
          label: "Core",
          description: "Strong operator-ready output with practical structure and clean delivery.",
        },
        {
          id: "elite" as const,
          label: "Elite",
          description: "Sharper premium positioning, stronger proof logic, and top-agency execution.",
        },
      ].map((tier) => {
        const active = value === tier.id;
        return (
          <button
            key={tier.id}
            type="button"
            onClick={() => onChange(tier.id)}
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
  );
}

// ---------------------------------------------------------------------------
// Tab: Audits
// ---------------------------------------------------------------------------

function AuditsTab() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [executionTier, setExecutionTier] = useState<ExecutionTier>("elite");

  const [form, setForm] = useState({
    businessName: "",
    businessUrl: "",
    niche: "",
    location: "",
    businessType: "local" as BusinessType,
  });

  const fetchAudits = useCallback(async () => {
    try {
      const res = await fetch("/api/agency/audit");
      if (res.ok) {
        const data = await res.json() as { audits?: Audit[] };
        setAudits(data.audits ?? []);
      }
    } catch {
      toast.error("Failed to load audits");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAudits(); }, [fetchAudits]);

  async function runAudit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.businessName.trim() || !form.niche.trim()) {
      toast.error("Business name and niche are required");
      return;
    }
    setSubmitting(true);
    toast.loading("Auditing...", { id: "audit" });
    try {
      const res = await fetch("/api/agency/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, executionTier }),
      });
      if (!res.ok) throw new Error();
      toast.success("Audit complete!", { id: "audit" });
      setForm({ businessName: "", businessUrl: "", niche: "", location: "", businessType: "local" });
      fetchAudits();
    } catch {
      toast.error("Audit failed", { id: "audit" });
    } finally {
      setSubmitting(false);
    }
  }

  async function generateFromAudit(auditId: string, type: "strategy" | "proposal" | "pricing") {
    const endpointMap = {
      strategy: "/api/agency/strategy/generate",
      proposal: "/api/agency/proposal/generate",
      pricing:  "/api/agency/pricing/generate",
    };
    setGeneratingFor(`${auditId}-${type}`);
    toast.loading(`Generating ${type}...`, { id: type });
    try {
      const res = await fetch(endpointMap[type], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId, executionTier }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} generated!`, { id: type });
      fetchAudits();
      setSelectedAudit(null);
    } catch {
      toast.error(`Failed to generate ${type}`, { id: type });
    } finally {
      setGeneratingFor(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Run New Audit Form */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Run New Audit</p>
        <ExecutionTierPicker value={executionTier} onChange={setExecutionTier} />
        <form onSubmit={runAudit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#f5a623]/40"
            placeholder="Business name *"
            value={form.businessName}
            onChange={(e) => setForm({ ...form, businessName: e.target.value })}
          />
          <input
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#f5a623]/40"
            placeholder="Business URL (optional)"
            value={form.businessUrl}
            onChange={(e) => setForm({ ...form, businessUrl: e.target.value })}
          />
          <input
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#f5a623]/40"
            placeholder="Niche *"
            value={form.niche}
            onChange={(e) => setForm({ ...form, niche: e.target.value })}
          />
          <input
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#f5a623]/40"
            placeholder="Location (optional)"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <select
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#f5a623]/40"
            value={form.businessType}
            onChange={(e) => setForm({ ...form, businessType: e.target.value as BusinessType })}
          >
            <option value="consultant">Consultant</option>
            <option value="local">Local Business</option>
            <option value="ecommerce">E-commerce</option>
            <option value="saas">SaaS</option>
            <option value="affiliate">Affiliate</option>
            <option value="agency">Agency</option>
          </select>
          <button
            type="submit"
            disabled={submitting}
            className="bg-gradient-to-r from-[#f5a623] to-[#e07850] text-white text-sm font-black px-4 py-2 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Auditing...</> : "Run Audit"}
          </button>
        </form>
      </div>

      {/* Audit List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-white/30" />
        </div>
      ) : audits.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <Building className="w-8 h-8 text-white/10 mx-auto" />
          <p className="text-white/30 text-sm">No audits yet. Run your first audit above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {audits.map((audit) => (
            <button
              key={audit.id}
              onClick={() => setSelectedAudit(audit)}
              className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 text-left hover:border-white/[0.12] transition-all space-y-4 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{audit.businessName}</p>
                  <p className="text-xs text-white/40 mt-0.5">{audit.niche}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${BUSINESS_TYPE_COLORS[audit.businessType]}`}>
                    {audit.businessType}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${audit.status === "complete" ? "text-green-400 bg-green-500/10 border-green-500/20" : audit.status === "error" ? "text-red-400 bg-red-500/10 border-red-500/20" : "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"}`}>
                    {audit.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <ScoreRing score={audit.overallScore} />
                <div className="flex-1 grid grid-cols-3 gap-1.5 min-w-0">
                  {Object.entries(audit.scoreBreakdown).map(([k, v]) => (
                    <div key={k} className={`text-[10px] font-black px-1.5 py-0.5 rounded-lg text-center ${scoreColor(v)} bg-white/[0.03] border border-white/[0.05]`}>
                      {k.slice(0, 4)} {v}
                    </div>
                  ))}
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-all" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Audit Detail Modal */}
      {selectedAudit && (
        <Modal onClose={() => setSelectedAudit(null)}>
          <div>
            <div className="flex items-start justify-between gap-3 pr-8">
              <div>
                <h2 className="text-lg font-black text-white">{selectedAudit.businessName}</h2>
                <p className="text-sm text-white/40">{selectedAudit.niche}</p>
              </div>
              <ScoreRing score={selectedAudit.overallScore} />
            </div>
          </div>

          {/* Score bars */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Score Breakdown</p>
            {Object.entries(selectedAudit.scoreBreakdown).map(([k, v]) => (
              <ScoreBar key={k} label={k} value={v} />
            ))}
          </div>

          {/* Audit Points */}
          {selectedAudit.auditPoints && selectedAudit.auditPoints.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Audit Findings</p>
              {selectedAudit.auditPoints.map((pt, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-white/50">{pt.category}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${GRADE_COLORS[pt.grade]}`}>Grade {pt.grade}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[pt.priority]}`}>{pt.priority}</span>
                  </div>
                  <p className="text-sm text-white/80">{pt.finding}</p>
                  <p className="text-xs text-white/40">{pt.recommendation}</p>
                </div>
              ))}
            </div>
          )}

          {/* Top Opportunities */}
          {selectedAudit.topOpportunities && selectedAudit.topOpportunities.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Top Opportunities</p>
              {selectedAudit.topOpportunities.map((opp, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex gap-3">
                  <span className="text-2xl font-black text-white/10 leading-none">{i + 1}</span>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">{opp.title}</p>
                    <p className="text-xs text-white/40">{opp.description}</p>
                    <p className="text-xs font-black text-green-400">{opp.estimatedRevenueLift} estimated lift</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Execution Tier</p>
            <ExecutionTierPicker value={executionTier} onChange={setExecutionTier} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(["strategy", "proposal", "pricing"] as const).map((type) => {
              const isGenerating = generatingFor === `${selectedAudit.id}-${type}`;
              const alreadyDone = type === "strategy" ? !!selectedAudit.strategyJson : type === "proposal" ? !!selectedAudit.proposalJson : false;
              return (
                <button
                  key={type}
                  onClick={() => generateFromAudit(selectedAudit.id, type)}
                  disabled={isGenerating || alreadyDone}
                  className="bg-gradient-to-r from-cyan-500/10 to-[#e07850]/10 hover:from-cyan-500/20 hover:to-[#e07850]/20 border border-white/[0.08] hover:border-white/[0.15] text-white text-xs font-black px-3 py-2.5 rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  {alreadyDone ? "Done" : `Gen ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                </button>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Strategy
// ---------------------------------------------------------------------------

function StrategyTab() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [executionTier, setExecutionTier] = useState<ExecutionTier>("elite");

  const fetchAudits = useCallback(async () => {
    try {
      const res = await fetch("/api/agency/audit");
      if (res.ok) {
        const data = await res.json() as { audits?: Audit[] };
        setAudits(data.audits ?? []);
      }
    } catch {
      toast.error("Failed to load audits");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAudits(); }, [fetchAudits]);

  async function generateStrategy(auditId: string) {
    setGenerating(auditId);
    toast.loading("Generating strategy...", { id: "strategy" });
    try {
      const res = await fetch("/api/agency/strategy/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId, executionTier }),
      });
      if (!res.ok) throw new Error();
      toast.success("Strategy generated!", { id: "strategy" });
      fetchAudits();
    } catch {
      toast.error("Failed to generate strategy", { id: "strategy" });
    } finally {
      setGenerating(null);
    }
  }

  const withStrategy = audits.filter((a) => a.strategyJson);
  const withoutStrategy = audits.filter((a) => !a.strategyJson);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-white/30" /></div>;

  return (
    <div className="space-y-6">
      {withStrategy.length === 0 && withoutStrategy.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <TrendingUp className="w-8 h-8 text-white/10 mx-auto" />
          <p className="text-white/30 text-sm">No audits yet. Run an audit first from the Audits tab.</p>
        </div>
      )}

      {withStrategy.length === 0 && withoutStrategy.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 text-center space-y-3">
          <p className="text-white/50 text-sm">No strategies generated yet.</p>
          <p className="text-white/30 text-xs">Generate a strategy from any of your existing audits below.</p>
        </div>
      )}

      {/* Strategies */}
      {withStrategy.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Generated Strategies</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {withStrategy.map((audit) => {
              const strat = audit.strategyJson!;
              return (
                <button
                  key={audit.id}
                  onClick={() => setSelectedAudit(audit)}
                  className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 text-left hover:border-white/[0.12] transition-all space-y-3 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-white">{audit.businessName}</p>
                      <p className="text-xs text-white/40 mt-0.5">{audit.niche}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-all shrink-0 mt-0.5" />
                  </div>
                  <p className="text-xs text-white/50 line-clamp-2">{strat.summary}</p>
                  <div className="flex gap-2">
                    {strat.phases.slice(0, 3).map((ph, i) => (
                      <span key={i} className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/40">{ph.name}</span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Generate for audits without strategy */}
      {withoutStrategy.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Generate Strategy</p>
          <ExecutionTierPicker value={executionTier} onChange={setExecutionTier} />
          <div className="space-y-2">
            {withoutStrategy.map((audit) => (
              <div key={audit.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-white">{audit.businessName}</p>
                  <p className="text-xs text-white/40">{audit.niche}</p>
                </div>
                <button
                  onClick={() => generateStrategy(audit.id)}
                  disabled={generating === audit.id}
                  className="bg-gradient-to-r from-[#f5a623] to-[#e07850] text-white text-xs font-black px-3 py-1.5 rounded-xl disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  {generating === audit.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                  Generate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strategy Detail Modal */}
      {selectedAudit?.strategyJson && (
        <Modal onClose={() => setSelectedAudit(null)}>
          <div>
            <h2 className="text-lg font-black text-white pr-8">{selectedAudit.businessName} — 90-Day Roadmap</h2>
            <p className="text-sm text-white/40 mt-1">{selectedAudit.strategyJson.summary}</p>
          </div>

          {selectedAudit.strategyJson.phases.map((phase, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-white/10 leading-none">{i + 1}</span>
                <div>
                  <p className="text-sm font-black text-white">{phase.name}</p>
                  <p className="text-xs text-white/40">{phase.focus}</p>
                </div>
              </div>

              <div className="space-y-2">
                {phase.tasks.map((task, j) => (
                  <div key={j} className="flex items-start gap-3">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0 mt-0.5 ${task.owner === "agency" ? "text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20" : "text-white/60 bg-white/[0.04] border-white/[0.1]"}`}>
                      {task.owner}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-white/80">{task.task}</p>
                      <div className="flex gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-white/30">{task.timeline}</span>
                        {task.tool && <span className="text-[10px] text-[#e07850]">{task.tool}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {phase.kpis.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">KPIs</p>
                  <div className="flex flex-wrap gap-1.5">
                    {phase.kpis.map((kpi, k) => (
                      <span key={k} className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/50">{kpi}</span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-white/50 italic">{phase.expectedOutcome}</p>
            </div>
          ))}

          <div className="bg-gradient-to-r from-cyan-500/10 to-[#e07850]/10 border border-[#f5a623]/20 rounded-2xl p-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Total Projected Revenue Lift</p>
            <p className="text-2xl font-black text-[#f5a623]">{selectedAudit.strategyJson.totalProjectedRevenueLift}</p>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Proposals
// ---------------------------------------------------------------------------

function ProposalsTab() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [executionTier, setExecutionTier] = useState<ExecutionTier>("elite");

  const fetchAudits = useCallback(async () => {
    try {
      const res = await fetch("/api/agency/audit");
      if (res.ok) {
        const data = await res.json() as { audits?: Audit[] };
        setAudits(data.audits ?? []);
      }
    } catch {
      toast.error("Failed to load audits");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAudits(); }, [fetchAudits]);

  async function generateProposal(auditId: string) {
    setGenerating(auditId);
    toast.loading("Generating proposal...", { id: "proposal" });
    try {
      const res = await fetch("/api/agency/proposal/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId, executionTier }),
      });
      if (!res.ok) throw new Error();
      toast.success("Proposal generated!", { id: "proposal" });
      fetchAudits();
    } catch {
      toast.error("Failed to generate proposal", { id: "proposal" });
    } finally {
      setGenerating(null);
    }
  }

  function copyProposal(prop: Proposal) {
    const tiers = prop.engagementOptions.map((t) =>
      `${t.name} — $${t.price}/${t.billingCycle}\n${t.deliverables.map((d) => `  • ${d}`).join("\n")}`
    ).join("\n\n");
    const text = `${prop.title}\n\n${prop.problemStatement}\n\nOur Approach\n${prop.ourApproach}\n\nEngagement Options\n${tiers}\n\nSocial Proof\n${prop.socialProof}\n\nGuarantee\n${prop.guarantee}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Proposal copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const withProposal = audits.filter((a) => a.proposalJson);
  const withoutProposal = audits.filter((a) => !a.proposalJson);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-white/30" /></div>;

  return (
    <div className="space-y-6">
      {withProposal.length === 0 && withoutProposal.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <FileText className="w-8 h-8 text-white/10 mx-auto" />
          <p className="text-white/30 text-sm">No audits yet. Run an audit first from the Audits tab.</p>
        </div>
      )}

      {withProposal.length === 0 && withoutProposal.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 text-center space-y-2">
          <p className="text-white/50 text-sm">No proposals yet.</p>
          <p className="text-white/30 text-xs">Generate one from an audit below.</p>
        </div>
      )}

      {withProposal.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Proposals</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {withProposal.map((audit) => {
              const prop = audit.proposalJson!;
              return (
                <button
                  key={audit.id}
                  onClick={() => setSelectedAudit(audit)}
                  className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 text-left hover:border-white/[0.12] transition-all space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-white">{audit.businessName}</p>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-all shrink-0" />
                  </div>
                  <p className="text-xs text-white/40 line-clamp-2">{prop.title}</p>
                  <div className="flex items-center gap-3 text-[10px] text-white/30">
                    <span>{prop.engagementOptions.length} tiers</span>
                    <span>{new Date(audit.createdAt).toLocaleDateString()}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {withoutProposal.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Generate Proposal</p>
          <ExecutionTierPicker value={executionTier} onChange={setExecutionTier} />
          <div className="space-y-2">
            {withoutProposal.map((audit) => (
              <div key={audit.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-white">{audit.businessName}</p>
                  <p className="text-xs text-white/40">{audit.niche}</p>
                </div>
                <button
                  onClick={() => generateProposal(audit.id)}
                  disabled={generating === audit.id}
                  className="bg-gradient-to-r from-[#f5a623] to-[#e07850] text-white text-xs font-black px-3 py-1.5 rounded-xl disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  {generating === audit.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                  Generate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proposal Detail Modal */}
      {selectedAudit?.proposalJson && (
        <Modal onClose={() => setSelectedAudit(null)}>
          <div className="space-y-1 pr-8">
            <h2 className="text-lg font-black text-white">{selectedAudit.proposalJson.title}</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Problem Statement</p>
              <p className="text-sm text-white/70">{selectedAudit.proposalJson.problemStatement}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Our Approach</p>
              <p className="text-sm text-white/70">{selectedAudit.proposalJson.ourApproach}</p>
            </div>
          </div>

          {/* Engagement Tiers */}
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Engagement Options</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {selectedAudit.proposalJson.engagementOptions.map((tier, i) => (
                <div key={i} className={`bg-white/[0.02] border rounded-2xl p-4 space-y-3 ${i === 1 ? "border-[#f5a623]/30" : "border-white/[0.06]"}`}>
                  {i === 1 && <span className="text-[10px] font-black text-[#f5a623]">RECOMMENDED</span>}
                  <p className="text-sm font-black text-white">{tier.name}</p>
                  <p className="text-xl font-black text-white">${tier.price.toLocaleString()}<span className="text-xs text-white/30 font-normal">/{tier.billingCycle}</span></p>
                  <ul className="space-y-1">
                    {tier.deliverables.map((d, j) => (
                      <li key={j} className="text-xs text-white/50 flex gap-1.5">
                        <span className="text-cyan-500 shrink-0">—</span>{d}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Social Proof</p>
              <p className="text-sm text-white/60 italic">{selectedAudit.proposalJson.socialProof}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Guarantee</p>
              <p className="text-sm text-white/60">{selectedAudit.proposalJson.guarantee}</p>
            </div>
          </div>

          <button
            onClick={() => copyProposal(selectedAudit.proposalJson!)}
            className="w-full bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.15] text-white text-sm font-black px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy Full Proposal"}
          </button>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Pricing
// ---------------------------------------------------------------------------

function PricingTab() {
  const [form, setForm] = useState({ niche: "", businessType: "local" as BusinessType, targetRevenue: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PricingResult | null>(null);
  const [executionTier, setExecutionTier] = useState<ExecutionTier>("elite");

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.niche.trim()) { toast.error("Niche is required"); return; }
    setLoading(true);
    toast.loading("Generating pricing...", { id: "pricing" });
    try {
      const res = await fetch("/api/agency/pricing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, executionTier }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json() as { pricing?: PricingResult };
      setResult(data.pricing ?? null);
      toast.success("Pricing generated!", { id: "pricing" });
    } catch {
      toast.error("Failed to generate pricing", { id: "pricing" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Generate Pricing Strategy</p>
        <ExecutionTierPicker value={executionTier} onChange={setExecutionTier} />
        <form onSubmit={generate} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#f5a623]/40"
            placeholder="Niche *"
            value={form.niche}
            onChange={(e) => setForm({ ...form, niche: e.target.value })}
          />
          <select
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#f5a623]/40"
            value={form.businessType}
            onChange={(e) => setForm({ ...form, businessType: e.target.value as BusinessType })}
          >
            <option value="consultant">Consultant</option>
            <option value="local">Local Business</option>
            <option value="ecommerce">E-commerce</option>
            <option value="saas">SaaS</option>
            <option value="affiliate">Affiliate</option>
            <option value="agency">Agency</option>
          </select>
          <input
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#f5a623]/40"
            placeholder="Target revenue (optional)"
            value={form.targetRevenue}
            onChange={(e) => setForm({ ...form, targetRevenue: e.target.value })}
          />
          <button
            type="submit"
            disabled={loading}
            className="sm:col-span-3 bg-gradient-to-r from-[#f5a623] to-[#e07850] text-white text-sm font-black px-4 py-2 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</> : "Generate Pricing"}
          </button>
        </form>
      </div>

      {/* Empty state */}
      {!result && !loading && (
        <div className="text-center py-12 space-y-2">
          <DollarSign className="w-8 h-8 text-white/10 mx-auto" />
          <p className="text-white/30 text-sm">Enter your niche to get AI-powered pricing recommendations.</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-5">
          {/* Market rates */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Market Rates</p>
            <div className="grid grid-cols-3 gap-3">
              {(["low", "mid", "premium"] as const).map((tier) => (
                <div key={tier} className={`rounded-xl p-3 text-center border ${tier === result.recommendedPosition ? "bg-[#f5a623]/10 border-[#f5a623]/30" : "bg-white/[0.02] border-white/[0.06]"}`}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">{tier}</p>
                  <p className={`text-lg font-black ${tier === result.recommendedPosition ? "text-[#f5a623]" : "text-white/60"}`}>
                    ${result.marketRates[tier].toLocaleString()}
                  </p>
                  {tier === result.recommendedPosition && (
                    <span className="text-[10px] font-black text-[#f5a623]">Recommended</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-white/40">{result.reasoning}</p>
          </div>

          {/* Packages */}
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Packages</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.packages.map((pkg, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-3">
                  <div>
                    <p className="text-sm font-black text-white">{pkg.name}</p>
                    <p className="text-xl font-black text-white mt-1">${pkg.price.toLocaleString()}<span className="text-xs text-white/30 font-normal">/{pkg.billingCycle}</span></p>
                  </div>
                  <ul className="space-y-1">
                    {pkg.deliverables.map((d, j) => (
                      <li key={j} className="text-xs text-white/50 flex gap-1.5">
                        <span className="text-cyan-500 shrink-0">—</span>{d}
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2 border-t border-white/[0.06]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Margin</p>
                    <p className="text-sm font-black text-green-400">{pkg.profitMargin}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Value anchors */}
          {result.valueAnchors.length > 0 && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Value Anchors</p>
              <ol className="space-y-2">
                {result.valueAnchors.map((v, i) => (
                  <li key={i} className="flex gap-3 text-sm text-white/60">
                    <span className="text-white/20 font-black shrink-0">{i + 1}.</span>{v}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Psychology tips */}
          {result.pricingPsychologyTips.length > 0 && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Pricing Psychology</p>
              <ul className="space-y-2">
                {result.pricingPsychologyTips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white/60">
                    <span className="text-[#e07850] shrink-0">•</span>{tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Upsells */}
          {result.upsellOpportunities.length > 0 && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Upsell Opportunities</p>
              <div className="flex flex-wrap gap-2">
                {result.upsellOpportunities.map((u, i) => (
                  <span key={i} className="text-xs font-black px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[#e07850]">{u}</span>
                ))}
              </div>
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

export default function AgencyPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Audits");

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <AppNav />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white">Agency Workspace</h1>
          <p className="text-sm text-white/30">White-label audits, strategies, proposals, and pricing — ready to send.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-1.5 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
                activeTab === tab
                  ? "bg-gradient-to-r from-cyan-500/20 to-[#e07850]/20 border border-white/[0.1] text-white"
                  : "text-white/30 hover:text-white/60"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "Audits"    && <AuditsTab />}
        {activeTab === "Strategy"  && <StrategyTab />}
        {activeTab === "Proposals" && <ProposalsTab />}
        {activeTab === "Pricing"   && <PricingTab />}
      </main>
    </div>
  );
}
