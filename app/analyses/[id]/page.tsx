"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import AppNav from "@/components/AppNav";
import ScanSubNav from "@/components/ScanSubNav";
import DatabaseFallbackNotice from "@/components/DatabaseFallbackNotice";
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
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

interface TruthEngineBreakdown {
  dimension: string;
  rawScore: number;
  weight: number;
  weightedScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  isRisk: boolean;
}

interface TruthEngineDiagnostic {
  severity: "critical" | "warning" | "info" | "positive";
  dimension: string;
  message: string;
  fix?: string;
}

interface TruthEngineResult {
  totalScore: number;
  verdict: string;
  confidence: string;
  profile: string;
  breakdown: TruthEngineBreakdown[];
  diagnostics: TruthEngineDiagnostic[];
  strengthSummary: string;
  weaknessSummary: string;
  actionPlan: string[];
}

interface ScoringProfileInfo {
  key: string;
  name: string;
  description: string;
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
// Convert Button (create client/campaign from scan)
// ---------------------------------------------------------------------------

function ConvertButton({ label, icon, endpoint, successRedirect, successLabel }: {
  label: string;
  icon: React.ReactNode;
  endpoint: string;
  successRedirect: string;
  successLabel: string;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json() as { ok: boolean; error?: string; duplicate?: boolean; existingClientId?: string };
      if (!data.ok) {
        if (data.duplicate) {
          setError("Already exists");
        } else {
          setError(data.error ?? "Failed");
        }
        return;
      }
      setDone(true);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Link
        href={successRedirect}
        className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400"
      >
        <CheckCircle className="w-3.5 h-3.5" /> {successLabel} — View →
      </Link>
    );
  }

  return (
    <button
      onClick={() => void handleClick()}
      disabled={loading}
      className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1] transition text-xs font-semibold text-white/50 hover:text-white/70 disabled:opacity-40 text-left"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      {label}
      {error && <span className="ml-auto text-[10px] text-red-400">{error}</span>}
    </button>
  );
}

// ---------------------------------------------------------------------------

export default function AnalysisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [databaseUnavailable, setDatabaseUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [copiedHook, setCopiedHook] = useState<number | null>(null);
  const [truthResult, setTruthResult] = useState<TruthEngineResult | null>(null);
  const [loadingTruth, setLoadingTruth] = useState(false);
  const [profiles, setProfiles] = useState<ScoringProfileInfo[]>([]);
  const [selectedProfile, setSelectedProfile] = useState("balanced");

  useEffect(() => {
    Promise.all([
      fetch(`/api/analyses/${id}`)
        .then(r => r.json() as Promise<{ ok: boolean; analysis?: Analysis | null; databaseUnavailable?: boolean }>),
      fetch("/api/truth-engine")
        .then(r => r.json() as Promise<{ ok: boolean; profiles?: ScoringProfileInfo[] }>),
    ])
      .then(([analysisData, profilesData]) => {
        setDatabaseUnavailable(Boolean(analysisData.databaseUnavailable));
        if (analysisData.ok && analysisData.analysis) setAnalysis(analysisData.analysis);
        if (profilesData.ok && profilesData.profiles) setProfiles(profilesData.profiles);
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

  async function runTruthRescore(profile: string) {
    setLoadingTruth(true);
    setSelectedProfile(profile);
    try {
      const res = await fetch("/api/truth-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId: id, profile }),
      });
      const data = await res.json() as { ok: boolean; result?: TruthEngineResult };
      if (data.ok && data.result) setTruthResult(data.result);
    } catch {
      // non-fatal
    } finally {
      setLoadingTruth(false);
    }
  }

  function copyHook(text: string, index: number) {
    navigator.clipboard.writeText(text);
    setCopiedHook(index);
    setTimeout(() => setCopiedHook(null), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-t-bg text-white">
        <AppNav />
        <ScanSubNav />
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-t-bg text-white">
        <AppNav />
        <ScanSubNav />
        <div className="mx-auto flex min-h-[50vh] max-w-3xl flex-col justify-center gap-4 px-4">
          <DatabaseFallbackNotice visible={databaseUnavailable} />
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-8">
            <AlertTriangle className="w-8 h-8 text-red-400/50" />
            <p className="text-white/40">{databaseUnavailable ? "Analysis data is temporarily unavailable" : "Analysis not found"}</p>
            <Link href="/analyses" className="text-sm text-[#f5a623] hover:text-[#f5a623]">← Back to Scan History</Link>
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
    <div className="min-h-screen bg-t-bg text-white">
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
              <div className="flex items-center gap-3 mb-3">
                <a
                  href={analysis.inputUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#f5a623]/60 hover:text-[#f5a623] transition flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" /> {analysis.inputUrl}
                </a>
                <Link
                  href={`/scan?prefill=${encodeURIComponent(analysis.inputUrl)}`}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[10px] font-bold text-white/40 hover:text-white/70 hover:border-white/[0.15] transition"
                >
                  <Search className="w-2.5 h-2.5" /> Rescan
                </Link>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Report link copied");
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[10px] font-bold text-white/40 hover:text-white/70 hover:border-white/[0.15] transition"
                >
                  <Copy className="w-2.5 h-2.5" /> Share
                </button>
              </div>
              {analysis.summary && (
                <p className="text-sm text-white/50 leading-relaxed max-w-2xl">{analysis.summary}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-[11px] text-white/25 flex-wrap">
                <span>Mode: <span className="text-white/40 font-semibold">{analysis.mode}</span></span>
                <span>Confidence: <span className="text-white/40 font-semibold">{analysis.confidence ?? "—"}</span></span>
                <span>Type: <span className="text-white/40 font-semibold">{analysis.linkType ?? "—"}</span></span>
                <span>{format(new Date(analysis.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                {Date.now() - new Date(analysis.createdAt).getTime() > 7 * 24 * 60 * 60 * 1000 && (
                  <Link
                    href={`/scan?prefill=${encodeURIComponent(analysis.inputUrl)}`}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold hover:bg-amber-500/20 transition"
                  >
                    <AlertTriangle className="w-2.5 h-2.5" /> Stale — rescan recommended
                  </Link>
                )}
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
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#f5a623]/50 mb-2">Next Actions</p>
                    <ul className="space-y-1.5">
                      {(packet.nextActions ?? []).map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-white/50">
                          <Zap className="w-3 h-3 text-[#f5a623]/60 shrink-0 mt-0.5" /> {a}
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
                    <span className="text-sm font-black text-[#f5a623]">{opp.totalScore ?? 0}/100</span>
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
                  <div className="mt-4 bg-[#f5a623]/5 border border-[#f5a623]/15 rounded-xl p-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#f5a623]/50 mb-1">Recommended Path</p>
                    <p className="text-xs text-[#f5f0e8]/70 leading-relaxed">{opp.recommendedPath}</p>
                  </div>
                )}
              </div>
            )}

            {/* Truth Engine — Rescore Panel */}
            {opp && profiles.length > 0 && (
              <div className="bg-gradient-to-br from-cyan-900/15 to-purple-900/15 border border-[#f5a623]/20 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-[#f5a623]" />
                    <h2 className="text-xs font-black uppercase tracking-widest text-white/30">Truth Engine</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedProfile}
                      onChange={(e) => void runTruthRescore(e.target.value)}
                      className="bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-1.5 text-xs text-white/60 focus:outline-none focus:border-[#f5a623]/50 transition appearance-none cursor-pointer"
                    >
                      {profiles.map(p => (
                        <option key={p.key} value={p.key} className="bg-[#0d1525]">{p.name}</option>
                      ))}
                    </select>
                    {loadingTruth && <Loader2 className="w-3.5 h-3.5 text-[#f5a623] animate-spin" />}
                  </div>
                </div>

                {truthResult ? (
                  <div className="space-y-4">
                    {/* Score + Verdict */}
                    <div className="flex items-center gap-4">
                      <div className="text-3xl font-black text-white">{truthResult.totalScore}</div>
                      <div>
                        <span className={`text-xs font-black uppercase px-2 py-1 rounded-lg border ${
                          truthResult.verdict === "Pursue" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : truthResult.verdict === "Reject" ? "bg-red-500/10 border-red-500/20 text-red-400"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        }`}>
                          {truthResult.verdict}
                        </span>
                        <span className="text-[10px] text-white/25 ml-2">{truthResult.confidence} confidence · {truthResult.profile} profile</span>
                      </div>
                    </div>

                    {/* Grade Breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {truthResult.breakdown.map((b) => {
                        const gradeColors: Record<string, string> = {
                          A: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                          B: "text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20",
                          C: "text-amber-400 bg-amber-500/10 border-amber-500/20",
                          D: "text-orange-400 bg-orange-500/10 border-orange-500/20",
                          F: "text-red-400 bg-red-500/10 border-red-500/20",
                        };
                        return (
                          <div key={b.dimension} className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-2 text-center">
                            <span className={`text-lg font-black ${gradeColors[b.grade]?.split(" ")[0] ?? "text-white/40"}`}>{b.grade}</span>
                            <p className="text-[9px] text-white/30 font-bold mt-0.5 truncate">{b.dimension}</p>
                            <p className="text-[10px] text-white/20">{b.rawScore}/100</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Diagnostics */}
                    {truthResult.diagnostics.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/25">Diagnostics</p>
                        {truthResult.diagnostics.map((d, i) => {
                          const sevConfig: Record<string, { color: string; icon: React.ElementType }> = {
                            critical: { color: "text-red-400 bg-red-500/5 border-red-500/15", icon: XCircle },
                            warning: { color: "text-amber-400 bg-amber-500/5 border-amber-500/15", icon: AlertTriangle },
                            info: { color: "text-blue-400 bg-blue-500/5 border-blue-500/15", icon: Eye },
                            positive: { color: "text-emerald-400 bg-emerald-500/5 border-emerald-500/15", icon: CheckCircle },
                          };
                          const cfg = sevConfig[d.severity] ?? sevConfig.info;
                          const Icon = cfg.icon;
                          return (
                            <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border ${cfg.color}`}>
                              <Icon className="w-3 h-3 shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-semibold">{d.message}</p>
                                {d.fix && <p className="text-[10px] opacity-60 mt-0.5">{d.fix}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Action Plan */}
                    {truthResult.actionPlan.length > 0 && (
                      <div className="bg-[#f5a623]/5 border border-[#f5a623]/15 rounded-xl p-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#f5a623]/50 mb-2">Prioritized Action Plan</p>
                        <ul className="space-y-1">
                          {truthResult.actionPlan.map((a, i) => (
                            <li key={i} className="text-xs text-white/60 flex items-start gap-2">
                              <span className="text-[#f5a623] font-black shrink-0">{i + 1}.</span>
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Summary */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/[0.02] rounded-lg p-2.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400/50 mb-1">Strengths</p>
                        <p className="text-[11px] text-white/50">{truthResult.strengthSummary}</p>
                      </div>
                      <div className="bg-white/[0.02] rounded-lg p-2.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-red-400/50 mb-1">Weaknesses</p>
                        <p className="text-[11px] text-white/50">{truthResult.weaknessSummary}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-[11px] text-white/25 mb-3">Select a scoring profile to run the Truth Engine diagnostic</p>
                    <button
                      onClick={() => void runTruthRescore(selectedProfile)}
                      disabled={loadingTruth}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f5a623]/20 border border-[#f5a623]/30 text-[#f5a623] text-xs font-bold hover:bg-[#f5a623]/30 transition disabled:opacity-40"
                    >
                      {loadingTruth ? <Loader2 className="w-3 h-3 animate-spin" /> : <BarChart2 className="w-3 h-3" />}
                      Run Truth Engine
                    </button>
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
                      <span className="text-[10px] font-black text-[#e07850]/60 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
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
                            <span className="text-[10px] text-[#f5a623]/50 font-mono shrink-0 w-10 pt-0.5">{section.timestamp}</span>
                            <div>
                              <p className="text-[10px] text-[#e07850]/50 font-bold uppercase tracking-wider mb-0.5">{section.direction}</p>
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
                  <Sparkles className="w-4 h-4 text-[#e07850]" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">AI Deep Insights</h3>
                </div>
                {!insights && (
                  <button
                    onClick={() => void generateInsights()}
                    disabled={loadingInsights}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#e07850]/40 to-cyan-600/40 border border-purple-500/30 hover:border-purple-400/50 text-[11px] font-bold text-white transition disabled:opacity-40"
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
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#e07850]/50 mb-1">Executive Summary</p>
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
                    <InsightCard title="Audience Insight" content={insights.audienceInsight} icon={Target} color="text-[#f5a623]" />
                  )}
                  {insights.adAngle && (
                    <InsightCard title="Ad Angle" content={insights.adAngle} icon={Megaphone} color="text-[#e07850]" />
                  )}
                  {insights.emailPlaybook && (
                    <InsightCard title="Email Playbook" content={insights.emailPlaybook} icon={Mail} color="text-blue-400" />
                  )}
                  {insights.landingPageAdvice && (
                    <InsightCard title="Landing Page" content={insights.landingPageAdvice} icon={Globe} color="text-[#f5a623]" />
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
                            <span className="text-[#f5a623] font-black shrink-0">{i + 1}.</span> {r}
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
                <ConvertButton
                  label="Create Client from Scan"
                  icon={<Users className="w-3.5 h-3.5 text-[#f5a623]/60" />}
                  endpoint={`/api/analyses/${id}/create-client`}
                  successRedirect="/clients"
                  successLabel="Client created"
                />
                <ConvertButton
                  label="Create Campaign from Scan"
                  icon={<Megaphone className="w-3.5 h-3.5 text-[#e07850]/60" />}
                  endpoint={`/api/analyses/${id}/create-campaign`}
                  successRedirect="/campaigns"
                  successLabel="Campaign created"
                />
                <Link
                  href={`/skills?skill=ad-campaign&prefill_url=${encodeURIComponent(analysis.inputUrl)}&prefill_mode=${analysis.mode}`}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1] transition text-xs font-semibold text-white/50 hover:text-white/70"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400/60" /> Generate Ad Campaign
                </Link>
                <Link
                  href={`/skills?skill=landing-page&prefill_offer=${encodeURIComponent(analysis.title ?? analysis.inputUrl)}&prefill_audience=${encodeURIComponent((packet?.audience as string) ?? "")}`}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1] transition text-xs font-semibold text-white/50 hover:text-white/70"
                >
                  <Globe className="w-3.5 h-3.5 text-[#e07850]/60" /> Build Landing Page
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
