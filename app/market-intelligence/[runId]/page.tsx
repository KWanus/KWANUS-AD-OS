"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Target,
  Trophy,
  Users,
  Zap,
  BarChart2,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Mail,
  Globe,
  TrendingUp,
  Sparkles,
  ShoppingCart,
  Clock,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types (mirroring engine types for client)
// ---------------------------------------------------------------------------

interface DiscoveredProduct {
  name: string;
  url: string;
  platform: string;
  niche: string;
  subNiche?: string;
  commission?: string;
  price?: string;
  gravity?: number;
  avgEarningsPerSale?: string;
  recurringCommission?: boolean;
  competitionLevel?: string;
  demandSignals?: string[];
  whySelected?: string;
}

interface WinnerProfile {
  product: DiscoveredProduct;
  funnelStructure: Array<{ stepNumber: number; type: string; purpose: string; keyElements: string[] }>;
  customerAvatar: {
    demographics: string;
    painPoints: string[];
    desires: string[];
    objections: string[];
    buyingTriggers: string[];
    wheretheyHangOut: string[];
  };
  conversionStrategy: {
    hookApproach: string;
    trustElements: string[];
    urgencyTactics: string[];
    pricingStrategy: string;
    guaranteeType: string;
    socialProof: string[];
    emotionalTriggers: string[];
  };
  adIntelligence: {
    commonHooks: string[];
    creativeFormats: string[];
    platforms: string[];
    estimatedSpend?: string;
    topPerformingAngle?: string;
  };
  strengths: string[];
  weaknesses: string[];
  duplicableElements: string[];
  improvementOpportunities: string[];
}

interface MarketSynthesis {
  bestProduct: { name: string; url: string; platform: string; reasoning: string; estimatedEarningsPerDay: string; confidenceLevel: string };
  targetAudience: { primary: string; demographics: string; psychographics: string; platformPresence: string[] };
  winningStrategy: { primaryAngle: string; hookFormula: string; contentStyle: string; adFormat: string; trafficSource: string; budgetRecommendation: string };
  funnelBlueprint: { steps: Array<{ stepNumber: number; type: string; purpose: string; keyElements: string[] }>; estimatedConversionRate: string; keyDifferentiator: string };
  emailStrategy: { sequenceType: string; emailCount: number; keyMessages: string[] };
  dayOnePlan: { tasks: Array<{ order: number; task: string; timeEstimate: string; deliverable: string }> };
  competitiveEdge: string;
  riskAssessment: string;
  scalePlaybook: string;
}

interface RunData {
  id: string;
  niche: string;
  subNiche?: string;
  vertical?: string;
  status: string;
  score?: number;
  executionTier?: string;
  topProductName?: string;
  topProductUrl?: string;
  estimatedEarnings?: string;
  discoveredProducts: DiscoveredProduct[];
  winnerProfiles: WinnerProfile[];
  synthesis: MarketSynthesis | null;
  generatedAssets: {
    hooks?: string[];
    adScripts?: Array<{ title: string; script: string; platform: string }>;
    emailSequence?: Array<{ subject: string; body: string; sendDay: number }>;
  };
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1 rounded-lg hover:bg-white/[0.06] text-white/20 hover:text-white/50 transition shrink-0"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function SectionLabel({ children, icon: Icon }: { children: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon className="w-4 h-4 text-cyan-400/60" />}
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">{children}</p>
    </div>
  );
}

function ExpandableCard({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition">
        <span className="text-xs font-bold text-white/60">{title}</span>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-white/20" /> : <ChevronRight className="w-3.5 h-3.5 text-white/20" />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-white/[0.05]">{children}</div>}
    </div>
  );
}

function verticalToBusinessType(vertical?: string | null): string {
  const map: Record<string, string> = {
    affiliate: "affiliate",
    dropship: "affiliate",
    local_service: "local_service",
    coaching: "consultant_coach",
    ecommerce: "ecommerce",
    info_product: "content_creator",
  };
  return map[vertical ?? "affiliate"] ?? "affiliate";
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MarketIntelligenceRunPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = use(params);
  const [run, setRun] = useState<RunData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"synthesis" | "products" | "winners" | "assets">("synthesis");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/market-intelligence/${runId}`);
        const data = (await res.json()) as { ok: boolean; run?: RunData };
        if (data.ok && data.run) setRun(data.run);
      } catch { /* non-fatal */ }
      finally { setLoading(false); }
    }
    void load();
  }, [runId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020509] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="min-h-screen bg-[#020509] flex items-center justify-center">
        <p className="text-white/30">Run not found</p>
      </div>
    );
  }

  const synthesis = run.synthesis;
  const products = run.discoveredProducts ?? [];
  const winners = run.winnerProfiles ?? [];
  const assets = run.generatedAssets ?? {};

  function scoreColor(s: number) {
    if (s >= 75) return "from-emerald-400 to-green-300";
    if (s >= 50) return "from-cyan-400 to-blue-300";
    if (s >= 30) return "from-amber-400 to-yellow-300";
    return "from-red-400 to-orange-300";
  }

  return (
    <div className="min-h-screen bg-[#020509] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <Link href="/market-intelligence" className="flex items-center gap-1.5 text-white/30 hover:text-white/60 transition text-xs mb-3">
              <ArrowLeft className="w-3 h-3" />
              Back to Market Intelligence
            </Link>
            <h1 className="text-2xl font-black text-white">{run.niche}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {run.subNiche && <span className="text-xs text-white/30">/ {run.subNiche}</span>}
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.03] text-white/30">
                {run.vertical ?? "affiliate"}
              </span>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
                {run.executionTier ?? "elite"}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-white/20">
                <Clock className="w-3 h-3" />
                {new Date(run.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {run.score != null && (
            <div className="text-right shrink-0">
              <p className={`text-4xl font-black bg-gradient-to-r ${scoreColor(run.score)} bg-clip-text text-transparent`}>
                {run.score}
              </p>
              <p className="text-[10px] text-white/25 font-bold uppercase tracking-wider">Intelligence Score</p>
            </div>
          )}
        </div>

        {/* Best Product banner */}
        {synthesis && (
          <div className="rounded-[28px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.06] to-blue-600/[0.03] p-6 mb-6 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent" />
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300/80">Recommended Product</p>
                </div>
                <h2 className="text-xl font-black text-white">{synthesis.bestProduct.name}</h2>
                <p className="mt-2 text-sm text-white/50 leading-relaxed">{synthesis.bestProduct.reasoning}</p>
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  <span className="text-xs font-bold text-emerald-400">{synthesis.bestProduct.estimatedEarningsPerDay}</span>
                  <span className="text-[10px] text-white/30 uppercase">{synthesis.bestProduct.platform}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    synthesis.bestProduct.confidenceLevel === "high"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : synthesis.bestProduct.confidenceLevel === "medium"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}>
                    {synthesis.bestProduct.confidenceLevel} confidence
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Link
                  href={`/himalaya/scratch?${new URLSearchParams({
                    businessType: verticalToBusinessType(run.vertical),
                    niche: run.subNiche ? `${run.niche} - ${run.subNiche}` : run.niche,
                    goal: "launch_faster",
                    description: `Market Intelligence Score: ${run.score}/100. Top product: ${synthesis.bestProduct.name}. ${synthesis.bestProduct.reasoning ?? ""} Estimated earnings: ${synthesis.bestProduct.estimatedEarningsPerDay ?? "unknown"}.`,
                  }).toString()}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 px-5 py-3 text-sm font-black text-white shadow-[0_0_20px_rgba(6,182,212,0.2)] transition"
                >
                  <Zap className="w-4 h-4" />
                  Build This Business
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/[0.07] mb-6">
          {([
            { key: "synthesis" as const, label: "Strategy", icon: Target },
            { key: "products" as const, label: `Products (${products.length})`, icon: ShoppingCart },
            { key: "winners" as const, label: `Winners (${winners.length})`, icon: TrendingUp },
            { key: "assets" as const, label: "Launch Assets", icon: Sparkles },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold transition-all border-b-2 ${
                tab === key ? "text-cyan-300 border-cyan-500" : "text-white/30 border-transparent hover:text-white/50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "synthesis" && synthesis && (
          <div className="space-y-6">
            {/* Target Audience */}
            <div className="rounded-[28px] border border-white/[0.07] bg-white/[0.02] p-5">
              <SectionLabel icon={Users}>Target Audience</SectionLabel>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Primary</p>
                    <p className="text-sm text-white/70">{synthesis.targetAudience.primary}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Demographics</p>
                    <p className="text-sm text-white/70">{synthesis.targetAudience.demographics}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Psychographics</p>
                    <p className="text-sm text-white/70">{synthesis.targetAudience.psychographics}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Where to find them</p>
                    <div className="flex flex-wrap gap-1.5">
                      {synthesis.targetAudience.platformPresence.map((p) => (
                        <span key={p} className="px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-300">{p}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Winning Strategy */}
            <div className="rounded-[28px] border border-white/[0.07] bg-white/[0.02] p-5">
              <SectionLabel icon={Zap}>Winning Strategy</SectionLabel>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { label: "Primary Angle", value: synthesis.winningStrategy.primaryAngle },
                  { label: "Hook Formula", value: synthesis.winningStrategy.hookFormula },
                  { label: "Content Style", value: synthesis.winningStrategy.contentStyle },
                  { label: "Ad Format", value: synthesis.winningStrategy.adFormat },
                  { label: "Traffic Source", value: synthesis.winningStrategy.trafficSource },
                  { label: "Budget", value: synthesis.winningStrategy.budgetRecommendation },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-xs text-white/60 leading-relaxed">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Day 1 Plan */}
            <div className="rounded-[28px] border border-emerald-500/15 bg-emerald-500/[0.03] p-5">
              <SectionLabel icon={BarChart2}>Day 1 Action Plan</SectionLabel>
              <div className="space-y-2">
                {synthesis.dayOnePlan.tasks.map((task) => (
                  <div key={task.order} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px] font-black text-cyan-300 shrink-0">
                      {task.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white/70">{task.task}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-white/25">{task.timeEstimate}</span>
                        <span className="text-[10px] text-cyan-400/50">→ {task.deliverable}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">Competitive Edge</p>
                <p className="text-xs text-white/50 leading-relaxed">{synthesis.competitiveEdge}</p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">Risk Assessment</p>
                <p className="text-xs text-white/50 leading-relaxed">{synthesis.riskAssessment}</p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">Scale Playbook</p>
                <p className="text-xs text-white/50 leading-relaxed">{synthesis.scalePlaybook}</p>
              </div>
            </div>
          </div>
        )}

        {tab === "products" && (
          <div className="grid gap-3 md:grid-cols-2">
            {products.map((p, i) => (
              <div key={i} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-bold text-white/70">{p.name}</p>
                    <p className="text-[10px] text-white/25 mt-0.5 truncate">{p.url}</p>
                  </div>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 shrink-0">
                    {p.platform}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {p.commission && (
                    <div className="rounded-lg bg-emerald-500/[0.06] border border-emerald-500/10 px-2 py-1.5 text-center">
                      <p className="text-[9px] text-emerald-400/50 uppercase">Commission</p>
                      <p className="text-xs font-bold text-emerald-400">{p.commission}</p>
                    </div>
                  )}
                  {p.price && (
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-2 py-1.5 text-center">
                      <p className="text-[9px] text-white/25 uppercase">Price</p>
                      <p className="text-xs font-bold text-white/60">{p.price}</p>
                    </div>
                  )}
                  {p.competitionLevel && (
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-2 py-1.5 text-center">
                      <p className="text-[9px] text-white/25 uppercase">Competition</p>
                      <p className="text-xs font-bold text-white/60">{p.competitionLevel}</p>
                    </div>
                  )}
                </div>
                {p.whySelected && (
                  <p className="text-[10px] text-white/35 leading-relaxed">{p.whySelected}</p>
                )}
                {p.demandSignals && p.demandSignals.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.demandSignals.map((s) => (
                      <span key={s} className="px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.05] text-[9px] text-white/30">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "winners" && (
          <div className="space-y-4">
            {winners.map((w, i) => (
              <div key={i} className="rounded-[28px] border border-white/[0.07] bg-white/[0.02] p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xs font-black text-cyan-300">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white/70">{w.product.name}</p>
                    <p className="text-[10px] text-white/25">{w.product.platform} · {w.product.commission ?? "N/A"}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <ExpandableCard title="Customer Avatar" defaultOpen={i === 0}>
                    <div className="pt-3 space-y-3">
                      <div><p className="text-[10px] text-white/25 uppercase mb-1">Demographics</p><p className="text-xs text-white/50">{w.customerAvatar.demographics}</p></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><p className="text-[10px] text-white/25 uppercase mb-1">Pain Points</p>{w.customerAvatar.painPoints.map((p) => <p key={p} className="text-[10px] text-red-300/60">• {p}</p>)}</div>
                        <div><p className="text-[10px] text-white/25 uppercase mb-1">Desires</p>{w.customerAvatar.desires.map((d) => <p key={d} className="text-[10px] text-emerald-300/60">• {d}</p>)}</div>
                      </div>
                      <div><p className="text-[10px] text-white/25 uppercase mb-1">Objections</p>{w.customerAvatar.objections.map((o) => <p key={o} className="text-[10px] text-amber-300/60">• {o}</p>)}</div>
                    </div>
                  </ExpandableCard>

                  <ExpandableCard title="Conversion Strategy">
                    <div className="pt-3 grid grid-cols-2 gap-3">
                      <div><p className="text-[10px] text-white/25 uppercase mb-1">Hook Approach</p><p className="text-xs text-white/50">{w.conversionStrategy.hookApproach}</p></div>
                      <div><p className="text-[10px] text-white/25 uppercase mb-1">Pricing</p><p className="text-xs text-white/50">{w.conversionStrategy.pricingStrategy}</p></div>
                      <div><p className="text-[10px] text-white/25 uppercase mb-1">Guarantee</p><p className="text-xs text-white/50">{w.conversionStrategy.guaranteeType}</p></div>
                      <div><p className="text-[10px] text-white/25 uppercase mb-1">Trust Elements</p>{w.conversionStrategy.trustElements.map((t) => <p key={t} className="text-[10px] text-white/40">• {t}</p>)}</div>
                    </div>
                  </ExpandableCard>

                  <ExpandableCard title="Ad Intelligence">
                    <div className="pt-3 space-y-3">
                      <div><p className="text-[10px] text-white/25 uppercase mb-1">Top Hooks</p>{w.adIntelligence.commonHooks.map((h) => <div key={h} className="flex items-center gap-2 mb-1"><p className="text-[10px] text-cyan-300/60">"{h}"</p><CopyButton text={h} /></div>)}</div>
                      <div className="flex flex-wrap gap-1.5">{w.adIntelligence.platforms.map((p) => <span key={p} className="px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-[9px] text-white/40">{p}</span>)}</div>
                      {w.adIntelligence.topPerformingAngle && <div><p className="text-[10px] text-white/25 uppercase mb-1">Best Angle</p><p className="text-xs text-cyan-300/70">{w.adIntelligence.topPerformingAngle}</p></div>}
                    </div>
                  </ExpandableCard>

                  <ExpandableCard title="What to Copy / What to Improve">
                    <div className="pt-3 grid grid-cols-2 gap-3">
                      <div><p className="text-[10px] text-emerald-400/50 uppercase mb-1">Duplicate These</p>{w.duplicableElements.map((d) => <p key={d} className="text-[10px] text-white/40">✓ {d}</p>)}</div>
                      <div><p className="text-[10px] text-cyan-400/50 uppercase mb-1">Improve On</p>{w.improvementOpportunities.map((o) => <p key={o} className="text-[10px] text-white/40">↑ {o}</p>)}</div>
                    </div>
                  </ExpandableCard>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "assets" && (
          <div className="space-y-6">
            {/* Hooks */}
            {assets.hooks && assets.hooks.length > 0 && (
              <div className="rounded-[28px] border border-white/[0.07] bg-white/[0.02] p-5">
                <SectionLabel icon={Zap}>Ready-to-Use Hooks ({assets.hooks.length})</SectionLabel>
                <div className="space-y-1.5">
                  {assets.hooks.map((hook, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/20 px-4 py-2.5">
                      <p className="text-xs text-white/60">{hook}</p>
                      <CopyButton text={hook} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ad Scripts */}
            {assets.adScripts && assets.adScripts.length > 0 && (
              <div className="rounded-[28px] border border-white/[0.07] bg-white/[0.02] p-5">
                <SectionLabel icon={Globe}>Ad Scripts ({assets.adScripts.length})</SectionLabel>
                <div className="space-y-3">
                  {assets.adScripts.map((script, i) => (
                    <div key={i} className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <p className="text-xs font-bold text-white/60">{script.title}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] uppercase text-white/20">{script.platform}</span>
                          <CopyButton text={script.script} />
                        </div>
                      </div>
                      <p className="text-[11px] text-white/40 leading-relaxed whitespace-pre-wrap">{script.script}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Email Sequence */}
            {assets.emailSequence && assets.emailSequence.length > 0 && (
              <div className="rounded-[28px] border border-white/[0.07] bg-white/[0.02] p-5">
                <SectionLabel icon={Mail}>Email Sequence ({assets.emailSequence.length} emails)</SectionLabel>
                <div className="space-y-3">
                  {assets.emailSequence.map((email, i) => (
                    <div key={i} className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[9px] font-bold text-cyan-300">{email.sendDay}</span>
                          <p className="text-xs font-bold text-white/60">{email.subject}</p>
                        </div>
                        <CopyButton text={`Subject: ${email.subject}\n\n${email.body}`} />
                      </div>
                      <p className="text-[11px] text-white/35 leading-relaxed whitespace-pre-wrap">{email.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!assets.hooks || assets.hooks.length === 0) &&
             (!assets.adScripts || assets.adScripts.length === 0) &&
             (!assets.emailSequence || assets.emailSequence.length === 0) && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
                <p className="text-xs text-white/25">No assets were generated for this run.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
