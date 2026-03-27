"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import AppNav from "@/components/AppNav";
import DatabaseFallbackNotice from "@/components/DatabaseFallbackNotice";
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Globe,
  BarChart2,
  Zap,
  Target,
  Shield,
  Eye,
  Mail,
  Search,
  Layers,
  Megaphone,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DimensionScores {
  demandPotential: number | null;
  offerStrength: number | null;
  emotionalLeverage: number | null;
  trustCredibility: number | null;
  conversionReadiness: number | null;
  adViability: number | null;
  emailLifecyclePotential: number | null;
  seoPotential: number | null;
  differentiation: number | null;
  risk: number | null;
}

interface OpportunityAssessment extends DimensionScores {
  id: string;
  status: string;
  totalScore: number | null;
  topGaps: string[] | null;
  topStrengths: string[] | null;
  recommendedPath: string | null;
  opportunityPacket: Record<string, unknown> | null;
}

interface AssetPackage {
  id: string;
  mode: string;
  adHooks: { format: string; hook: string }[];
  adScripts: { title: string; duration: string; sections: { timestamp: string; direction: string; copy: string }[] }[];
  adBriefs: unknown;
  landingPage: Record<string, unknown>;
  emailSequences: Record<string, unknown>;
  executionChecklist: Record<string, unknown>;
}

interface Analysis {
  id: string;
  mode: string;
  inputUrl: string;
  linkType: string | null;
  title: string | null;
  score: number | null;
  verdict: string | null;
  confidence: string | null;
  summary: string | null;
  rawSignals: Record<string, unknown> | null;
  decisionPacket: Record<string, unknown> | null;
  createdAt: string;
  opportunityAssessments: OpportunityAssessment[];
  assetPackages: AssetPackage[];
}

interface AIInsights {
  executiveSummary?: string;
  marketPosition?: string;
  audienceInsight?: string;
  biggestOpportunity?: string;
  biggestRisk?: string;
  strategyRecommendations?: string[];
  adAngle?: string;
  emailPlaybook?: string;
  landingPageAdvice?: string;
  competitiveAdvantage?: string;
  scoreJustification?: string;
  raw?: string;
}

// ---------------------------------------------------------------------------
// Dimension config
// ---------------------------------------------------------------------------

const DIMENSIONS: { key: keyof DimensionScores; label: string; icon: React.ElementType; description: string }[] = [
  { key: "demandPotential", label: "Demand", icon: TrendingUp, description: "Market demand signals and pain/desire clarity" },
  { key: "offerStrength", label: "Offer", icon: Zap, description: "Price visibility, CTA, value stack clarity" },
  { key: "emotionalLeverage", label: "Emotion", icon: Target, description: "Pain depth, benefit depth, desire triggers" },
  { key: "trustCredibility", label: "Trust", icon: Shield, description: "Reviews, guarantees, social proof" },
  { key: "conversionReadiness", label: "Conversion", icon: CheckCircle, description: "Page structure, headline, CTA optimization" },
  { key: "adViability", label: "Ad Viability", icon: Megaphone, description: "Suitability for paid traffic campaigns" },
  { key: "emailLifecyclePotential", label: "Email", icon: Mail, description: "Depth for nurture sequences and retention" },
  { key: "seoPotential", label: "SEO", icon: Search, description: "Content depth, keyword signals, structure" },
  { key: "differentiation", label: "Differentiation", icon: Layers, description: "Unique positioning vs competitors" },
  { key: "risk", label: "Risk", icon: AlertTriangle, description: "Red flags — lower is better" },
];

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function ScoreGauge({ score, size = 100 }: { score: number; size?: number }) {
  const stroke = Math.max(5, size * 0.07);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease", filter: `drop-shadow(0 0 6px ${color}60)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-black text-white" style={{ fontSize: size * 0.28 }}>{score}</span>
        <span className="text-white/30 font-bold uppercase tracking-widest" style={{ fontSize: Math.max(7, size * 0.08) }}>score</span>
      </div>
    </div>
  );
}

function DimensionBar({ label, value, icon: Icon, description, isRisk }: {
  label: string; value: number | null; icon: React.ElementType; description: string; isRisk?: boolean;
}) {
  const v = value ?? 0;
  const color = isRisk
    ? (v <= 30 ? "bg-emerald-500" : v <= 60 ? "bg-amber-500" : "bg-red-500")
    : (v >= 70 ? "bg-emerald-500" : v >= 45 ? "bg-amber-500" : "bg-red-500");
  const textColor = isRisk
    ? (v <= 30 ? "text-emerald-400" : v <= 60 ? "text-amber-400" : "text-red-400")
    : (v >= 70 ? "text-emerald-400" : v >= 45 ? "text-amber-400" : "text-red-400");

  return (
    <div className="group" title={description}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-white/30" />
          <span className="text-xs font-bold text-white/60">{label}</span>
        </div>
        <span className={`text-xs font-black ${textColor}`}>{v}/100</span>
      </div>
      <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${Math.max(v, 2)}%` }}
        />
      </div>
      <p className="text-[10px] text-white/20 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">{description}</p>
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: string | null }) {
  const config: Record<string, { color: string; bg: string; border: string; icon: React.ElementType }> = {
    Pursue:   { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle },
    Consider: { color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   icon: TrendingUp },
    Reject:   { color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20",     icon: XCircle },
  };
  const cfg = config[verdict ?? ""] ?? config.Consider;
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5" /> {verdict ?? "Unknown"}
    </span>
  );
}

function InsightCard({ title, content, icon: Icon, color }: {
  title: string; content: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30">{title}</h4>
      </div>
      <p className="text-xs text-white/60 leading-relaxed">{content}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AnalysisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [databaseUnavailable, setDatabaseUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [copiedHook, setCopiedHook] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/analyses/${id}`)
      .then(r => r.json() as Promise<{ ok: boolean; analysis?: Analysis | null; databaseUnavailable?: boolean }>)
      .then(data => {
        setDatabaseUnavailable(Boolean(data.databaseUnavailable));
        if (data.ok && data.analysis) setAnalysis(data.analysis);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function generateInsights() {
    setLoadingInsights(true);
    try {
      const res = await fetch(`/api/analyses/${id}/insights`, { method: "POST" });
      const data = await res.json() as { ok: boolean; insights?: AIInsights };
      if (data.ok && data.insights) setInsights(data.insights);
    } catch {
      // non-fatal
    } finally {
      setLoadingInsights(false);
    }
  }

  function copyHook(text: string, index: number) {
    navigator.clipboard.writeText(text);
    setCopiedHook(index);
    setTimeout(() => setCopiedHook(null), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050a14] text-white">
        <AppNav />
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-[#050a14] text-white">
        <AppNav />
        <div className="mx-auto flex min-h-[50vh] max-w-3xl flex-col justify-center gap-4 px-4">
          <DatabaseFallbackNotice visible={databaseUnavailable} />
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-8">
            <AlertTriangle className="w-8 h-8 text-red-400/50" />
            <p className="text-white/40">{databaseUnavailable ? "Analysis data is temporarily unavailable" : "Analysis not found"}</p>
            <Link href="/analyses" className="text-sm text-cyan-400 hover:text-cyan-300">← Back to Scan History</Link>
          </div>
        </div>
      </div>
    );
  }

  const opp = analysis.opportunityAssessments[0];
  const assets = analysis.assetPackages[0];
  const packet = analysis.decisionPacket as {
    audience?: string;
    painDesire?: string;
    angle?: string;
    strengths?: string[];
    weaknesses?: string[];
    risks?: string[];
    nextActions?: string[];
    summary?: string;
  } | null;
  const adHooks = (assets?.adHooks ?? []) as { format: string; hook: string }[];
  const adScripts = (assets?.adScripts ?? []) as { title: string; duration: string; sections: { timestamp: string; direction: string; copy: string }[] }[];

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <Link href="/analyses" className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Scan History
        </Link>

        {/* Hero header */}
        <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Score */}
            <div className="shrink-0">
              <ScoreGauge score={analysis.score ?? 0} size={120} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-xl font-black text-white truncate">{analysis.title || analysis.inputUrl}</h1>
                <VerdictBadge verdict={analysis.verdict} />
              </div>
              <a
                href={analysis.inputUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-cyan-400/60 hover:text-cyan-400 transition flex items-center gap-1 mb-3"
              >
                <ExternalLink className="w-3 h-3" /> {analysis.inputUrl}
              </a>
              {analysis.summary && (
                <p className="text-sm text-white/50 leading-relaxed max-w-2xl">{analysis.summary}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-[11px] text-white/25">
                <span>Mode: <span className="text-white/40 font-semibold">{analysis.mode}</span></span>
                <span>Confidence: <span className="text-white/40 font-semibold">{analysis.confidence ?? "—"}</span></span>
                <span>Type: <span className="text-white/40 font-semibold">{analysis.linkType ?? "—"}</span></span>
                <span>{format(new Date(analysis.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          {/* ── LEFT COLUMN ───────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Decision Packet */}
            {packet && (
              <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
                <h2 className="text-xs font-black uppercase tracking-widest text-white/30 mb-4">Decision Packet</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                  {[
                    { label: "Audience", value: packet.audience },
                    { label: "Pain / Desire", value: packet.painDesire },
                    { label: "Angle", value: packet.angle },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.05]">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-1">{label}</p>
                      <p className="text-xs text-white/60 leading-relaxed">{value ?? "—"}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400/50 mb-2">Strengths</p>
                    <ul className="space-y-1.5">
                      {(packet.strengths ?? []).map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-white/50">
                          <CheckCircle className="w-3 h-3 text-emerald-400/60 shrink-0 mt-0.5" /> {s}
                        </li>
                      ))}
                      {(packet.strengths ?? []).length === 0 && <li className="text-xs text-white/20">None detected</li>}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-red-400/50 mb-2">Weaknesses</p>
                    <ul className="space-y-1.5">
                      {(packet.weaknesses ?? []).map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-white/50">
                          <XCircle className="w-3 h-3 text-red-400/60 shrink-0 mt-0.5" /> {w}
                        </li>
                      ))}
                      {(packet.weaknesses ?? []).length === 0 && <li className="text-xs text-white/20">None detected</li>}
                    </ul>
                  </div>
                </div>

                {/* Next Actions */}
                {(packet.nextActions ?? []).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/[0.05]">
                    <p className="text-[9px] font-black uppercase tracking-widest text-cyan-400/50 mb-2">Next Actions</p>
                    <ul className="space-y-1.5">
                      {(packet.nextActions ?? []).map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-white/50">
                          <Zap className="w-3 h-3 text-cyan-400/60 shrink-0 mt-0.5" /> {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* 10-Dimension Scoring */}
            {opp && (
              <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xs font-black uppercase tracking-widest text-white/30">Opportunity Dimensions</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/20">Total:</span>
                    <span className="text-sm font-black text-cyan-400">{opp.totalScore ?? 0}/100</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  {DIMENSIONS.map(({ key, label, icon, description }) => (
                    <DimensionBar
                      key={key}
                      label={label}
                      value={opp[key]}
                      icon={icon}
                      description={description}
                      isRisk={key === "risk"}
                    />
                  ))}
                </div>

                {/* Gaps + Strengths */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-5 border-t border-white/[0.05]">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-red-400/50 mb-2">Top Gaps</p>
                    <ul className="space-y-1.5">
                      {((opp.topGaps ?? []) as string[]).map((g, i) => (
                        <li key={i} className="text-xs text-white/50 flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 text-red-400/50 shrink-0 mt-0.5" /> {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400/50 mb-2">Top Strengths</p>
                    <ul className="space-y-1.5">
                      {((opp.topStrengths ?? []) as string[]).map((s, i) => (
                        <li key={i} className="text-xs text-white/50 flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-emerald-400/50 shrink-0 mt-0.5" /> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recommended Path */}
                {opp.recommendedPath && (
                  <div className="mt-4 bg-cyan-500/5 border border-cyan-500/15 rounded-xl p-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-cyan-400/50 mb-1">Recommended Path</p>
                    <p className="text-xs text-cyan-100/70 leading-relaxed">{opp.recommendedPath}</p>
                  </div>
                )}
              </div>
            )}

            {/* Ad Hooks */}
            {adHooks.length > 0 && (
              <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
                <h2 className="text-xs font-black uppercase tracking-widest text-white/30 mb-4">
                  Ad Hooks ({adHooks.length})
                </h2>
                <div className="space-y-2">
                  {adHooks.map((hook, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] group hover:border-white/[0.1] transition"
                    >
                      <span className="text-[10px] font-black text-purple-400/60 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                        {hook.format}
                      </span>
                      <p className="text-xs text-white/60 flex-1 leading-relaxed">{hook.hook}</p>
                      <button
                        onClick={() => copyHook(hook.hook, i)}
                        className="shrink-0 p-1 rounded-lg hover:bg-white/5 text-white/20 hover:text-white/50 transition opacity-0 group-hover:opacity-100"
                      >
                        {copiedHook === i ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ad Scripts */}
            {adScripts.length > 0 && (
              <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
                <h2 className="text-xs font-black uppercase tracking-widest text-white/30 mb-4">
                  Ad Scripts ({adScripts.length})
                </h2>
                <div className="space-y-4">
                  {adScripts.map((script, i) => (
                    <div key={i} className="bg-white/[0.015] border border-white/[0.05] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-white/70">{script.title}</h3>
                        <span className="text-[10px] text-white/25">{script.duration}</span>
                      </div>
                      <div className="space-y-2">
                        {script.sections.map((section, j) => (
                          <div key={j} className="flex gap-3">
                            <span className="text-[10px] text-cyan-400/50 font-mono shrink-0 w-10 pt-0.5">{section.timestamp}</span>
                            <div>
                              <p className="text-[10px] text-purple-400/50 font-bold uppercase tracking-wider mb-0.5">{section.direction}</p>
                              <p className="text-xs text-white/50 leading-relaxed">{section.copy}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN ──────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* AI Insights */}
            <div className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border border-purple-500/20 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">AI Deep Insights</h3>
                </div>
                {!insights && (
                  <button
                    onClick={() => void generateInsights()}
                    disabled={loadingInsights}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/40 to-cyan-600/40 border border-purple-500/30 hover:border-purple-400/50 text-[11px] font-bold text-white transition disabled:opacity-40"
                  >
                    {loadingInsights ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Generate
                  </button>
                )}
              </div>

              {loadingInsights && (
                <div className="flex items-center justify-center py-8 gap-2 text-white/30">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Analyzing with AI...</span>
                </div>
              )}

              {insights && !insights.raw && (
                <div className="space-y-4">
                  {insights.executiveSummary && (
                    <div className="bg-black/20 rounded-xl p-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-purple-400/50 mb-1">Executive Summary</p>
                      <p className="text-xs text-white/70 leading-relaxed">{insights.executiveSummary}</p>
                    </div>
                  )}
                  {insights.biggestOpportunity && (
                    <InsightCard title="Biggest Opportunity" content={insights.biggestOpportunity} icon={Zap} color="text-emerald-400" />
                  )}
                  {insights.biggestRisk && (
                    <InsightCard title="Biggest Risk" content={insights.biggestRisk} icon={AlertTriangle} color="text-red-400" />
                  )}
                  {insights.audienceInsight && (
                    <InsightCard title="Audience Insight" content={insights.audienceInsight} icon={Target} color="text-cyan-400" />
                  )}
                  {insights.adAngle && (
                    <InsightCard title="Ad Angle" content={insights.adAngle} icon={Megaphone} color="text-purple-400" />
                  )}
                  {insights.emailPlaybook && (
                    <InsightCard title="Email Playbook" content={insights.emailPlaybook} icon={Mail} color="text-blue-400" />
                  )}
                  {insights.landingPageAdvice && (
                    <InsightCard title="Landing Page" content={insights.landingPageAdvice} icon={Globe} color="text-cyan-400" />
                  )}
                  {insights.competitiveAdvantage && (
                    <InsightCard title="Competitive Edge" content={insights.competitiveAdvantage} icon={Shield} color="text-amber-400" />
                  )}
                  {(insights.strategyRecommendations ?? []).length > 0 && (
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Strategy</p>
                      <ul className="space-y-1.5">
                        {(insights.strategyRecommendations ?? []).map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                            <span className="text-cyan-400 font-black shrink-0">{i + 1}.</span> {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {insights.scoreJustification && (
                    <InsightCard title="Score Justification" content={insights.scoreJustification} icon={BarChart2} color="text-white/40" />
                  )}
                </div>
              )}

              {insights?.raw && (
                <div className="bg-black/20 rounded-xl p-3">
                  <p className="text-xs text-white/60 leading-relaxed whitespace-pre-wrap">{insights.raw}</p>
                </div>
              )}

              {!insights && !loadingInsights && (
                <p className="text-[11px] text-white/20 text-center py-4">
                  Click Generate to get AI-powered strategic insights for this analysis
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href={`/skills?skill=ad-campaign&prefill_url=${encodeURIComponent(analysis.inputUrl)}&prefill_mode=${analysis.mode}`}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1] transition text-xs font-semibold text-white/50 hover:text-white/70"
                >
                  <Megaphone className="w-3.5 h-3.5 text-cyan-400/60" /> Generate Ad Campaign
                </Link>
                <Link
                  href={`/skills?skill=landing-page&prefill_offer=${encodeURIComponent(analysis.title ?? analysis.inputUrl)}&prefill_audience=${encodeURIComponent((packet?.audience as string) ?? "")}`}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1] transition text-xs font-semibold text-white/50 hover:text-white/70"
                >
                  <Globe className="w-3.5 h-3.5 text-purple-400/60" /> Build Landing Page
                </Link>
                <Link
                  href={`/skills?skill=email-sequence&prefill_offer=${encodeURIComponent(analysis.title ?? analysis.inputUrl)}&prefill_audience=${encodeURIComponent((packet?.audience as string) ?? "")}`}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1] transition text-xs font-semibold text-white/50 hover:text-white/70"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-400/60" /> Create Email Sequence
                </Link>
              </div>
            </div>

            {/* Meta */}
            <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-4 space-y-2.5">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">Details</h3>
              {[
                { label: "Scanned", value: format(new Date(analysis.createdAt), "MMM d, yyyy 'at' h:mm a") },
                { label: "Mode", value: analysis.mode },
                { label: "Link Type", value: analysis.linkType ?? "Unknown" },
                { label: "Confidence", value: analysis.confidence ?? "Unknown" },
                { label: "Assets Generated", value: `${analysis.assetPackages.length}` },
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
    </div>
  );
}
