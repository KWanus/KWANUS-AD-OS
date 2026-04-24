"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import { toast } from "sonner";
import {
  ArrowLeft, Loader2, Sparkles, Copy, Check, Shield, Clock,
  TrendingUp, Building, MapPin, Tag,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BusinessType = "consultant" | "local" | "ecommerce" | "saas" | "affiliate" | "agency";

interface ScoreBreakdown {
  Traffic?: number;
  Conversion?: number;
  Offer?: number;
  Trust?: number;
  Automation?: number;
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
  timeline?: string;
  effort?: "low" | "medium" | "high";
}

interface AuditJson {
  scoreBreakdown?: ScoreBreakdown;
  auditPoints?: AuditPoint[];
  topOpportunities?: Opportunity[];
  competitivePosition?: string;
  summary?: string;
}

interface PhaseTask {
  task: string;
  owner: "agency" | "client";
  timeline: string;
  tool?: string;
}

interface StrategyPhase {
  name: string;
  focus: string;
  tasks: PhaseTask[];
  kpis: string[];
  expectedOutcome: string;
}

interface StrategyJson {
  summary: string;
  phases: StrategyPhase[];
  projectedRevenueLift: string;
  roi?: string;
}

interface ProposalTier {
  name: string;
  price: string;
  deliverables: string[];
  bestFor?: string;
}

interface ProposalJson {
  title?: string;
  problemStatement?: string;
  ourApproach?: string;
  tiers?: ProposalTier[];
  socialProof?: string;
  guarantee?: string;
  nextSteps?: string[];
  expiry?: string;
}

interface PricingPackage {
  name: string;
  price: string;
  deliverables: string[];
  profitMargin?: string;
}

interface PricingJson {
  marketRates?: { low: string; mid: string; premium: string; recommended: "low" | "mid" | "premium" };
  reasoning?: string;
  packages?: PricingPackage[];
  valueAnchors?: string[];
  pricingTips?: string[];
  upsellOpportunities?: string[];
}

interface AgencyAudit {
  id: string;
  businessName: string;
  businessType: BusinessType;
  niche: string;
  location?: string;
  overallScore: number;
  status: "pending" | "complete" | "error";
  auditJson: AuditJson | null;
  strategyJson: StrategyJson | null;
  proposalJson: ProposalJson | null;
  pricingJson: PricingJson | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GRADE_COLORS: Record<string, string> = {
  A: "text-green-400 bg-green-500/10 border-green-500/20",
  B: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  C: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  D: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  F: "text-red-400 bg-red-500/10 border-red-500/20",
};

const PRIORITY_COLORS: Record<string, string> = {
  high:   "text-red-400 bg-red-500/10 border-red-500/20",
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  low:    "text-white/40 bg-white/[0.04] border-white/10",
};

const STATUS_COLORS: Record<string, string> = {
  pending:  "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  complete: "text-green-400 bg-green-500/10 border-green-500/20",
  error:    "text-red-400 bg-red-500/10 border-red-500/20",
};

const EFFORT_COLORS: Record<string, string> = {
  low:    "text-green-400 bg-green-500/10 border-green-500/20",
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  high:   "text-red-400 bg-red-500/10 border-red-500/20",
};

const TABS = ["Audit", "Strategy", "Proposal", "Pricing"];

// ---------------------------------------------------------------------------
// Atoms
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">{children}</p>;
}

function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    if (label) toast.success(`${label} copied`);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-xs text-white/40 hover:text-white/70 transition">
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
      {label ?? "Copy"}
    </button>
  );
}

function EmptyGenerate({ icon: Icon, title, subtitle, btnLabel, onGenerate, loading }: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  btnLabel: string;
  onGenerate: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Icon className="w-10 h-10 text-white/10 mb-4" />
      <p className="text-sm font-bold text-white/30 mb-1">{title}</p>
      <p className="text-xs text-white/20 mb-5">{subtitle}</p>
      <button
        onClick={onGenerate}
        disabled={loading}
        className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-black px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-30 transition"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
        {btnLabel}
      </button>
    </div>
  );
}

// Score ring SVG
function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score));
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 70 ? "#22d3ee" : pct >= 50 ? "#facc15" : "#f87171";
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} stroke="white" strokeOpacity="0.06" strokeWidth="8" fill="none" />
        <circle cx="44" cy="44" r={r} stroke={color} strokeWidth="8" fill="none" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-white">{score}</span>
        <span className="text-[9px] text-white/30 font-bold">/100</span>
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? "bg-cyan-400" : value >= 50 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/50 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-bold text-white/60 w-8 text-right">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 1 — Audit
// ---------------------------------------------------------------------------

function AuditTab({ audit }: { audit: AgencyAudit }) {
  const aj = audit.auditJson;

  if (!aj) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <TrendingUp className="w-10 h-10 text-white/10 mb-3" />
        <p className="text-sm font-bold text-white/30">No audit data</p>
      </div>
    );
  }

  const sb = aj.scoreBreakdown ?? {};
  const scoreEntries: [string, number][] = [
    ["Traffic",    sb.Traffic    ?? 0],
    ["Conversion", sb.Conversion ?? 0],
    ["Offer",      sb.Offer      ?? 0],
    ["Trust",      sb.Trust      ?? 0],
    ["Automation", sb.Automation ?? 0],
  ];

  const points = aj.auditPoints ?? [];

  return (
    <div className="space-y-8">
      {/* Score bars */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <SectionLabel>Score Breakdown</SectionLabel>
        <div className="space-y-3 mt-3">
          {scoreEntries.map(([label, val]) => (
            <ScoreBar key={label} label={label} value={val} />
          ))}
        </div>
      </div>

      {/* Audit points */}
      {points.length > 0 && (
        <div>
          <SectionLabel>Audit Points ({points.length})</SectionLabel>
          <div className="space-y-2">
            {points.map((point, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-white/50 bg-white/[0.06] border border-white/[0.08] rounded-lg px-2 py-0.5">
                    {point.category}
                  </span>
                  <span className={`text-[10px] font-bold border rounded-lg px-2 py-0.5 ${GRADE_COLORS[point.grade] ?? GRADE_COLORS.C}`}>
                    {point.grade}
                  </span>
                  <span className={`text-[10px] font-bold border rounded-lg px-2 py-0.5 capitalize ${PRIORITY_COLORS[point.priority] ?? PRIORITY_COLORS.low}`}>
                    {point.priority}
                  </span>
                </div>
                <p className="text-sm font-bold text-white mb-1">{point.finding}</p>
                <p className="text-xs text-white/45 leading-relaxed">{point.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top opportunities */}
      {aj.topOpportunities && aj.topOpportunities.length > 0 && (
        <div>
          <SectionLabel>Top Opportunities</SectionLabel>
          <div className="space-y-2">
            {aj.topOpportunities.map((opp, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-black flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{opp.title}</p>
                  <p className="text-xs text-white/45 mt-0.5 leading-relaxed">{opp.description}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    {opp.estimatedRevenueLift && (
                      <span className="text-[11px] text-green-400 font-bold">{opp.estimatedRevenueLift}</span>
                    )}
                    {opp.timeline && (
                      <span className="text-[11px] text-white/30">{opp.timeline}</span>
                    )}
                    {opp.effort && (
                      <span className={`text-[10px] font-bold border rounded-lg px-2 py-0.5 capitalize ${EFFORT_COLORS[opp.effort] ?? EFFORT_COLORS.medium}`}>
                        {opp.effort} effort
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitive position */}
      {aj.competitivePosition && (
        <div>
          <SectionLabel>Competitive Position</SectionLabel>
          <p className="text-sm text-white/55 leading-relaxed">{aj.competitivePosition}</p>
        </div>
      )}

      {/* Summary */}
      {aj.summary && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <SectionLabel>Summary</SectionLabel>
          <p className="text-sm text-white/60 leading-relaxed">{aj.summary}</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2 — Strategy
// ---------------------------------------------------------------------------

function StrategyTab({ audit, onRefresh }: { audit: AgencyAudit; onRefresh: () => void }) {
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/agency/strategy/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId: audit.id }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) { toast.success("Strategy generated"); onRefresh(); }
      else toast.error(data.error ?? "Failed");
    } catch { toast.error("Could not connect"); }
    finally { setGenerating(false); }
  }

  const strategy = audit.strategyJson;

  if (!strategy) {
    return (
      <EmptyGenerate
        icon={TrendingUp}
        title="No strategy yet"
        subtitle="Generate a 90-day growth roadmap based on the audit"
        btnLabel="Generate Strategy"
        onGenerate={handleGenerate}
        loading={generating}
      />
    );
  }

  const PHASE_COLORS = [
    "from-cyan-500/10 to-cyan-500/5 border-cyan-500/20",
    "from-purple-500/10 to-purple-500/5 border-purple-500/20",
    "from-green-500/10 to-green-500/5 border-green-500/20",
  ];

  const PHASE_NAMES = ["Phase 1 — Foundation", "Phase 2 — Growth", "Phase 3 — Scale"];

  return (
    <div className="space-y-6">
      {/* Summary */}
      {strategy.summary && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <SectionLabel>Executive Summary</SectionLabel>
          <p className="text-sm text-white/60 leading-relaxed">{strategy.summary}</p>
        </div>
      )}

      {/* Phases */}
      {(strategy.phases ?? []).map((phase, pi) => (
        <div key={pi} className={`bg-gradient-to-br ${PHASE_COLORS[pi] ?? PHASE_COLORS[0]} border rounded-2xl p-5`}>
          <p className="text-sm font-black text-white mb-1">{PHASE_NAMES[pi] ?? phase.name}</p>
          <p className="text-xs text-white/45 mb-4">{phase.focus}</p>

          {/* Tasks */}
          {phase.tasks && phase.tasks.length > 0 && (
            <div className="space-y-2 mb-4">
              {phase.tasks.map((task, ti) => (
                <div key={ti} className="bg-black/20 rounded-xl p-3 flex gap-3 items-start">
                  <span className={`text-[10px] font-bold border rounded-lg px-2 py-0.5 shrink-0 ${
                    task.owner === "agency"
                      ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
                      : "text-white/40 bg-white/[0.04] border-white/10"
                  }`}>
                    {task.owner}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/70">{task.task}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] text-white/25">{task.timeline}</span>
                      {task.tool && (
                        <span className="text-[10px] text-purple-400/70 bg-purple-500/10 px-1.5 py-0.5 rounded">
                          {task.tool}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* KPIs */}
          {phase.kpis && phase.kpis.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {phase.kpis.map((kpi, ki) => (
                <span key={ki} className="text-[10px] font-bold bg-black/20 text-white/50 border border-white/[0.08] rounded-lg px-2 py-0.5">
                  {kpi}
                </span>
              ))}
            </div>
          )}

          {/* Expected outcome */}
          {phase.expectedOutcome && (
            <p className="text-xs text-white/40 italic border-t border-white/[0.08] pt-3">{phase.expectedOutcome}</p>
          )}
        </div>
      ))}

      {/* Revenue lift */}
      {strategy.projectedRevenueLift && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 flex items-center gap-4">
          <TrendingUp className="w-6 h-6 text-cyan-400 shrink-0" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Projected Revenue Lift</p>
            <p className="text-3xl font-black text-cyan-400">{strategy.projectedRevenueLift}</p>
          </div>
        </div>
      )}

      {/* ROI */}
      {strategy.roi && (
        <div>
          <SectionLabel>ROI Analysis</SectionLabel>
          <p className="text-sm text-white/55 leading-relaxed">{strategy.roi}</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3 — Proposal
// ---------------------------------------------------------------------------

function ProposalTab({ audit, onRefresh }: { audit: AgencyAudit; onRefresh: () => void }) {
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/agency/proposal/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId: audit.id }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) { toast.success("Proposal generated"); onRefresh(); }
      else toast.error(data.error ?? "Failed");
    } catch { toast.error("Could not connect"); }
    finally { setGenerating(false); }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proposalRaw = audit.proposalJson as Record<string, any> | null;

  if (!proposalRaw) {
    return (
      <EmptyGenerate
        icon={Building}
        title="No proposal yet"
        subtitle="Generate a full agency proposal with tiers, guarantee and next steps"
        btnLabel="Generate Proposal"
        onGenerate={handleGenerate}
        loading={generating}
      />
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proposal: Record<string, any> = proposalRaw;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tiers: any[] = proposal.tiers ?? [];

  const TIER_COLORS = [
    "border-white/[0.06] bg-white/[0.02]",
    "border-cyan-500/40 bg-cyan-500/[0.04]",
    "border-purple-500/30 bg-purple-500/[0.03]",
  ];

  const TIER_NAMES = ["Starter", "Growth", "Partnership"];

  function buildCopyText(): string {
    const lines: string[] = [
      proposal.title ?? `${audit.businessName} — Agency Proposal`,
      "=".repeat(50),
      "",
    ];
    if (proposal.problemStatement) lines.push(`PROBLEM\n${proposal.problemStatement}\n`);
    if (proposal.ourApproach) lines.push(`OUR APPROACH\n${proposal.ourApproach}\n`);
    if (tiers.length > 0) {
      lines.push("ENGAGEMENT TIERS");
      tiers.forEach((t: any, i: number) => {
        lines.push(`\n${TIER_NAMES[i] ?? t.name} — ${t.price}`);
        t.deliverables.forEach((d: any) => lines.push(`  • ${d}`));
      });
      lines.push("");
    }
    if (proposal.guarantee) lines.push(`GUARANTEE\n${proposal.guarantee}\n`);
    if (proposal.nextSteps) lines.push(`NEXT STEPS\n${(proposal.nextSteps as any[]).map((s: any, i: number) => `${i + 1}. ${s}`).join("\n")}\n`);
    if (proposal.expiry) lines.push(`This offer expires: ${proposal.expiry}`);
    return lines.join("\n");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        {proposal.title && <h2 className="text-base font-black text-white">{proposal.title}</h2>}
        <CopyBtn text={buildCopyText()} label="Full proposal" />
      </div>

      {/* Problem */}
      {proposal.problemStatement && (
        <div>
          <SectionLabel>Problem Statement</SectionLabel>
          <p className="text-sm text-white/60 leading-relaxed">{proposal.problemStatement}</p>
        </div>
      )}

      {/* Approach */}
      {proposal.ourApproach && (
        <div>
          <SectionLabel>Our Approach</SectionLabel>
          <p className="text-sm text-white/60 leading-relaxed">{proposal.ourApproach}</p>
        </div>
      )}

      {/* Tiers */}
      {tiers.length > 0 && (
        <div>
          <SectionLabel>Engagement Tiers</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map((tier, i) => {
              const isRecommended = i === 1 || tiers.length === 1;
              return (
                <div key={i} className={`rounded-2xl p-5 border flex flex-col gap-3 ${TIER_COLORS[i] ?? TIER_COLORS[0]}`}>
                  {isRecommended && (
                    <span className="self-start text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-lg">
                      Recommended
                    </span>
                  )}
                  <div>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{TIER_NAMES[i] ?? tier.name}</p>
                    <p className="text-sm font-black text-white">{tier.name}</p>
                    <p className="text-xl font-black text-cyan-400">{tier.price}</p>
                  </div>
                  <ul className="space-y-1.5 flex-1">
                    {tier.deliverables.map((d: any, j: number) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-white/55">
                        <Check className="w-3 h-3 text-cyan-400/60 mt-0.5 shrink-0" />{d}
                      </li>
                    ))}
                  </ul>
                  {tier.bestFor && (
                    <p className="text-[11px] text-white/35 border-t border-white/[0.06] pt-2">Best for: {tier.bestFor}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Social proof */}
      {proposal.socialProof && (
        <div className="border-l-2 border-cyan-500/30 pl-4">
          <SectionLabel>Social Proof</SectionLabel>
          <p className="text-sm text-white/50 italic leading-relaxed">"{proposal.socialProof}"</p>
        </div>
      )}

      {/* Guarantee */}
      {proposal.guarantee && (
        <div className="bg-green-500/[0.04] border border-green-500/20 rounded-2xl px-5 py-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
          <div>
            <SectionLabel>Guarantee</SectionLabel>
            <p className="text-sm text-white/60">{proposal.guarantee}</p>
          </div>
        </div>
      )}

      {/* Next steps */}
      {proposal.nextSteps && proposal.nextSteps.length > 0 && (
        <div>
          <SectionLabel>Next Steps</SectionLabel>
          <div className="space-y-2">
            {(proposal.nextSteps as any[]).map((step: any, i: number) => (
              <div key={i} className="flex items-start gap-3 text-sm text-white/60">
                <span className="w-6 h-6 rounded-full bg-white/[0.06] text-white/50 text-xs font-black flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expiry */}
      {proposal.expiry && (
        <div className="flex items-center gap-2 text-xs text-orange-400/70">
          <Clock className="w-3.5 h-3.5" />
          This offer expires: {proposal.expiry}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 4 — Pricing
// ---------------------------------------------------------------------------

function PricingTab({ audit, onRefresh }: { audit: AgencyAudit; onRefresh: () => void }) {
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/agency/pricing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId: audit.id }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) { toast.success("Pricing generated"); onRefresh(); }
      else toast.error(data.error ?? "Failed");
    } catch { toast.error("Could not connect"); }
    finally { setGenerating(false); }
  }

  const pricing = audit.pricingJson;

  if (!pricing) {
    return (
      <EmptyGenerate
        icon={TrendingUp}
        title="No pricing data yet"
        subtitle="Generate market-rate analysis and package pricing"
        btnLabel="Generate Pricing"
        onGenerate={handleGenerate}
        loading={generating}
      />
    );
  }

  const mr = pricing.marketRates;
  const packages = pricing.packages ?? [];

  const RATE_LABELS: Array<{ key: "low" | "mid" | "premium"; label: string; color: string }> = [
    { key: "low",     label: "Low",     color: "text-white/50" },
    { key: "mid",     label: "Mid",     color: "text-cyan-400" },
    { key: "premium", label: "Premium", color: "text-purple-400" },
  ];

  const PKG_COLORS = [
    "border-white/[0.06] bg-white/[0.02]",
    "border-cyan-500/40 bg-cyan-500/[0.04]",
    "border-purple-500/30 bg-purple-500/[0.03]",
  ];

  return (
    <div className="space-y-6">
      {/* Market rates bar */}
      {mr && (
        <div>
          <SectionLabel>Market Rate Positioning</SectionLabel>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
            <div className="grid grid-cols-3 gap-4">
              {RATE_LABELS.map(({ key, label, color }) => {
                const isRec = mr.recommended === key;
                return (
                  <div key={key} className={`text-center p-4 rounded-xl transition ${isRec ? "bg-cyan-500/10 border border-cyan-500/20" : "bg-white/[0.02] border border-white/[0.06]"}`}>
                    <p className="text-[10px] font-black uppercase tracking-wider text-white/30 mb-1">{label}</p>
                    <p className={`text-lg font-black ${color}`}>{mr[key]}</p>
                    {isRec && (
                      <span className="text-[9px] font-black uppercase tracking-wider text-cyan-400 mt-1 block">Recommended</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Reasoning */}
      {pricing.reasoning && (
        <div>
          <SectionLabel>Pricing Rationale</SectionLabel>
          <p className="text-sm text-white/55 leading-relaxed">{pricing.reasoning}</p>
        </div>
      )}

      {/* Packages */}
      {packages.length > 0 && (
        <div>
          <SectionLabel>Packages</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {packages.map((pkg, i) => (
              <div key={i} className={`rounded-2xl p-5 border flex flex-col gap-3 ${PKG_COLORS[i] ?? PKG_COLORS[0]}`}>
                <div>
                  <p className="text-sm font-black text-white">{pkg.name}</p>
                  <p className="text-xl font-black text-cyan-400">{pkg.price}</p>
                  {pkg.profitMargin && (
                    <p className="text-[11px] text-green-400/70 mt-0.5">Margin: {pkg.profitMargin}</p>
                  )}
                </div>
                <ul className="space-y-1.5 flex-1">
                  {pkg.deliverables.map((d, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-white/55">
                      <Check className="w-3 h-3 text-cyan-400/60 mt-0.5 shrink-0" />{d}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Value anchors */}
      {pricing.valueAnchors && pricing.valueAnchors.length > 0 && (
        <div>
          <SectionLabel>Value Anchors</SectionLabel>
          <div className="space-y-2">
            {pricing.valueAnchors.map((anchor, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-white/55">
                <span className="w-5 h-5 rounded-full bg-white/[0.06] text-white/40 text-[10px] font-black flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                {anchor}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing psychology tips */}
      {pricing.pricingTips && pricing.pricingTips.length > 0 && (
        <div>
          <SectionLabel>Pricing Psychology</SectionLabel>
          <ul className="space-y-1.5">
            {pricing.pricingTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-white/45">
                <span className="w-1 h-1 rounded-full bg-cyan-500/50 mt-1.5 shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upsell opportunities */}
      {pricing.upsellOpportunities && pricing.upsellOpportunities.length > 0 && (
        <div>
          <SectionLabel>Upsell Opportunities</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {pricing.upsellOpportunities.map((item, i) => (
              <span key={i} className="text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-3 py-1.5">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AgencyAuditDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [audit, setAudit] = useState<AgencyAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchAudit() {
    try {
      const res = await fetch(`/api/agency/audit/${id}`);
      const data = await res.json() as { ok: boolean; audit: AgencyAudit; error?: string };
      if (data.ok) setAudit(data.audit);
      else toast.error(data.error ?? "Failed to load audit");
    } catch { toast.error("Could not connect"); }
    finally { setLoading(false); }
  }

  useEffect(() => { void fetchAudit(); }, [id]);

  async function runAction(key: string, endpoint: string, body: Record<string, unknown>) {
    setActionLoading(key);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) { toast.success(`${key} generated`); void fetchAudit(); }
      else toast.error(data.error ?? "Failed");
    } catch { toast.error("Could not connect"); }
    finally { setActionLoading(null); }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020509] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-white/20" />
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="min-h-screen bg-[#020509] flex flex-col items-center justify-center text-center px-4">
        <p className="text-sm font-bold text-white/30 mb-4">Audit not found</p>
        <button onClick={() => router.push("/agency")} className="text-cyan-400 text-sm hover:underline">Back to Agency</button>
      </div>
    );
  }

  const actionBtns = [
    { key: "Strategy", label: "Generate Strategy", endpoint: "/api/agency/strategy/generate", body: { auditId: id } },
    { key: "Proposal", label: "Write Proposal",    endpoint: "/api/agency/proposal/generate", body: { auditId: id } },
    { key: "Pricing",  label: "Get Pricing",        endpoint: "/api/agency/pricing/generate",  body: { auditId: id } },
  ];

  return (
    <div className="min-h-screen bg-[#020509] text-white">
      <AppNav />
      <div className="max-w-5xl mx-auto px-4 pt-8 pb-24">

        {/* Back */}
        <button onClick={() => router.push("/agency")} className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/70 transition mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Agency
        </button>

        {/* Header */}
        <div className="flex flex-wrap items-start gap-5 mb-8">
          <ScoreRing score={audit.overallScore} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-black text-white">{audit.businessName}</h1>
              <span className="text-[10px] font-bold text-white/50 bg-white/[0.06] border border-white/[0.08] rounded-lg px-2 py-0.5 capitalize">
                {audit.businessType}
              </span>
              <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold capitalize ${STATUS_COLORS[audit.status] ?? STATUS_COLORS.pending}`}>
                {audit.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-white/35 mb-3">
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" />{audit.niche}
              </span>
              {audit.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{audit.location}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {actionBtns.map(({ key, label, endpoint, body }) => (
                <button
                  key={key}
                  onClick={() => void runAction(key, endpoint, body)}
                  disabled={actionLoading === key}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50 text-xs font-bold hover:text-white hover:border-white/[0.15] disabled:opacity-30 transition"
                >
                  {actionLoading === key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl flex gap-1 p-1 mb-6 overflow-x-auto">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`whitespace-nowrap px-4 py-2 text-sm rounded-xl transition ${
                activeTab === i ? "bg-white/[0.06] text-white font-black" : "text-white/40 hover:text-white/60"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 0 && <AuditTab audit={audit} />}
        {activeTab === 1 && <StrategyTab audit={audit} onRefresh={() => void fetchAudit()} />}
        {activeTab === 2 && <ProposalTab audit={audit} onRefresh={() => void fetchAudit()} />}
        {activeTab === 3 && <PricingTab audit={audit} onRefresh={() => void fetchAudit()} />}
      </div>
    </div>
  );
}
