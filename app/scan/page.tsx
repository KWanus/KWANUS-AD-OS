"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import Link from "next/link";
import {
  Search, Loader2, Globe, Megaphone, Mail, Zap, AlertTriangle,
  CheckCircle, XCircle, ChevronRight, ArrowRight, Sparkles, Building2, ShoppingBag,
} from "lucide-react";

type ScanMode = "consultant" | "operator";

type ScanResult = {
  ok: boolean;
  analysis: {
    inputUrl: string;
    title: string;
    score: number;
    verdict: string;
    confidence: string;
    summary: string;
    decisionPacket: {
      audience: string;
      painDesire: string;
      angle: string;
      strengths: string[];
      weaknesses: string[];
      nextActions: string[];
    };
  };
  opportunityAssessment: {
    status: string;
    totalScore: number;
    topGaps: string[];
    topStrengths: string[];
    recommendedPath: string;
  } | null;
  assetPackage: {
    adHooks: { format: string; hook: string }[];
  } | null;
  error?: string;
};

const SCORE_COLOR = (s: number) =>
  s >= 70 ? "text-emerald-400" : s >= 45 ? "text-amber-400" : "text-red-400";
const SCORE_BG = (s: number) =>
  s >= 70 ? "bg-emerald-500/10 border-emerald-500/20" : s >= 45 ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20";

type BuildAction = {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  skillSlug: string;
  gradient: string;
};

function getActions(mode: ScanMode, result: ScanResult): BuildAction[] {
  const { analysis, opportunityAssessment } = result;
  const url = analysis.inputUrl;
  const audience = analysis.decisionPacket.audience;
  const angle = analysis.decisionPacket.angle;

  if (mode === "consultant") {
    return [
      {
        icon: <Globe className="w-4 h-4" />,
        label: "Build New Landing Page",
        sublabel: "AI rebuilds their site, better",
        skillSlug: "landing-page",
        gradient: "from-purple-500/20 to-blue-500/20 border-purple-500/25",
      },
      {
        icon: <Megaphone className="w-4 h-4" />,
        label: "Generate Ad Campaign",
        sublabel: "Hooks + scripts for their product",
        skillSlug: "ad-campaign",
        gradient: "from-cyan-500/20 to-teal-500/20 border-cyan-500/25",
      },
      {
        icon: <Sparkles className="w-4 h-4" />,
        label: "Full Client Package",
        sublabel: "Site + ads + CRM client in one shot",
        skillSlug: "website-builder-scout",
        gradient: "from-amber-500/20 to-orange-500/20 border-amber-500/25",
      },
      {
        icon: <Mail className="w-4 h-4" />,
        label: "Email Sequence",
        sublabel: "Nurture sequence for their leads",
        skillSlug: "email-sequence",
        gradient: "from-blue-500/20 to-indigo-500/20 border-blue-500/25",
      },
    ];
  }

  // operator / product mode
  return [
    {
      icon: <Megaphone className="w-4 h-4" />,
      label: "Launch Ad Campaign",
      sublabel: "7 hooks + scripts for this product",
      skillSlug: "ad-campaign",
      gradient: "from-cyan-500/20 to-purple-500/20 border-cyan-500/25",
    },
    {
      icon: <Globe className="w-4 h-4" />,
      label: "Build Better Landing Page",
      sublabel: "Beat their funnel with yours",
      skillSlug: "landing-page",
      gradient: "from-purple-500/20 to-blue-500/20 border-purple-500/25",
    },
    {
      icon: <Mail className="w-4 h-4" />,
      label: "Build Email Funnel",
      sublabel: "Welcome + cart + post-purchase",
      skillSlug: "email-campaign",
      gradient: "from-blue-500/20 to-teal-500/20 border-blue-500/25",
    },
    {
      icon: <Sparkles className="w-4 h-4" />,
      label: "Full Campaign System",
      sublabel: "Ads + landing page + emails — done",
      skillSlug: "ad-campaign",
      gradient: "from-amber-500/20 to-orange-500/20 border-amber-500/25",
    },
  ];
}

function ScoreGauge({ score }: { score: number }) {
  const size = 80;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
    </svg>
  );
}

export default function ScanPage() {
  const [mode, setMode] = useState<ScanMode>("consultant");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runScan() {
    const trimmed = url.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, mode }),
      });
      const data = await res.json() as ScanResult;
      if (!data.ok) {
        setError(data.error ?? "Scan failed. Check the URL and try again.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Could not reach the analysis server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const actions = result ? getActions(mode, result) : [];
  const analysis = result?.analysis;
  const opp = result?.opportunityAssessment;

  function buildSkillUrl(slug: string): string {
    if (!analysis) return `/skills?skill=${slug}`;
    const params = new URLSearchParams({ skill: slug });
    if (slug === "ad-campaign" || slug === "email-campaign") {
      params.set("prefill_url", analysis.inputUrl);
      params.set("prefill_mode", mode);
    } else if (slug === "landing-page") {
      params.set("prefill_offer", `${analysis.title || analysis.inputUrl} — ${analysis.decisionPacket.angle}`);
      params.set("prefill_audience", analysis.decisionPacket.audience);
    } else if (slug === "website-builder-scout") {
      params.set("prefill_url", analysis.inputUrl);
    } else if (slug === "email-sequence") {
      params.set("prefill_offer", `${analysis.title || analysis.inputUrl}`);
      params.set("prefill_audience", analysis.decisionPacket.audience);
    }
    return `/skills?${params.toString()}`;
  }

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />

      <div className="max-w-3xl mx-auto px-4 pt-10 pb-20">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <Search className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-black text-white">Scan & Build</h1>
          </div>
          <p className="text-sm text-white/40 max-w-lg">
            Drop any URL. We scan it, score it, find the gaps — then build a better version for you in one click.
          </p>
        </div>

        {/* Mode selector */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => { setMode("consultant"); setResult(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${
              mode === "consultant"
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                : "border-white/[0.08] text-white/35 hover:text-white/60 hover:border-white/15"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Client / Competitor Site
          </button>
          <button
            onClick={() => { setMode("operator"); setResult(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${
              mode === "operator"
                ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                : "border-white/[0.08] text-white/35 hover:text-white/60 hover:border-white/15"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Product to Sell
          </button>
        </div>

        {/* Mode context */}
        <p className="text-xs text-white/30 mb-5 -mt-1 pl-1">
          {mode === "consultant"
            ? "Found a business with a bad site? Scan it, see exactly what's broken, and use Himalaya to build them a better one — then offer it as your service."
            : "Found a dropship product, affiliate offer, or competitor? Scan it and we'll build you a better funnel for the same market."}
        </p>

        {/* URL input */}
        <div className="flex gap-2 mb-6">
          <div className="flex-1 relative">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void runScan()}
              placeholder={mode === "consultant" ? "https://localbusiness.com" : "https://amazon.com/dp/B0..."}
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-cyan-500/40 transition"
            />
          </div>
          <button
            onClick={() => void runScan()}
            disabled={!url.trim() || loading}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-bold hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? "Scanning…" : "Scan"}
          </button>
        </div>

        {/* Scanning animation */}
        {loading && (
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 mb-6 flex flex-col items-center gap-3 text-center">
            <div className="flex gap-1 items-center">
              {[0, 150, 300, 450, 600].map((d) => (
                <div
                  key={d}
                  className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </div>
            <p className="text-sm text-white/50">Scanning site… extracting signals, scoring opportunities</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && analysis && (
          <div className="space-y-4">

            {/* Score card */}
            <div className={`border rounded-2xl p-5 flex items-start gap-5 ${SCORE_BG(analysis.score)}`}>
              <div className="relative shrink-0">
                <ScoreGauge score={analysis.score} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-lg font-black ${SCORE_COLOR(analysis.score)}`}>{analysis.score}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-base truncate">{analysis.title || analysis.inputUrl}</p>
                <p className={`text-sm font-bold mt-0.5 ${SCORE_COLOR(analysis.score)}`}>
                  {analysis.verdict} · {analysis.confidence} confidence
                </p>
                <p className="text-xs text-white/50 mt-2 leading-relaxed">{analysis.summary}</p>
              </div>
            </div>

            {/* Two-column breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Problems */}
              <div className="bg-red-500/[0.05] border border-red-500/15 rounded-xl p-4">
                <p className="text-xs font-black text-red-400 mb-3 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" /> Top Problems
                </p>
                <ul className="space-y-1.5">
                  {(opp?.topGaps?.length ? opp.topGaps : analysis.decisionPacket.weaknesses).slice(0, 4).map((w, i) => (
                    <li key={i} className="text-xs text-white/60 flex items-start gap-1.5">
                      <span className="text-red-400/60 shrink-0 mt-0.5">•</span>
                      {w}
                    </li>
                  ))}
                  {!(opp?.topGaps?.length || analysis.decisionPacket.weaknesses.length) && (
                    <li className="text-xs text-white/30 italic">None detected</li>
                  )}
                </ul>
              </div>

              {/* Strengths */}
              <div className="bg-emerald-500/[0.05] border border-emerald-500/15 rounded-xl p-4">
                <p className="text-xs font-black text-emerald-400 mb-3 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> Strengths
                </p>
                <ul className="space-y-1.5">
                  {(opp?.topStrengths?.length ? opp.topStrengths : analysis.decisionPacket.strengths).slice(0, 4).map((s, i) => (
                    <li key={i} className="text-xs text-white/60 flex items-start gap-1.5">
                      <span className="text-emerald-400/60 shrink-0 mt-0.5">•</span>
                      {s}
                    </li>
                  ))}
                  {!(opp?.topStrengths?.length || analysis.decisionPacket.strengths.length) && (
                    <li className="text-xs text-white/30 italic">None detected</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Audience + angle */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-wider mb-1">Target Audience</p>
                <p className="text-xs text-white/70">{analysis.decisionPacket.audience || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-wider mb-1">Core Pain / Desire</p>
                <p className="text-xs text-white/70">{analysis.decisionPacket.painDesire || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-wider mb-1">Best Angle</p>
                <p className="text-xs text-white/70">{analysis.decisionPacket.angle || "—"}</p>
              </div>
            </div>

            {/* Recommended path */}
            {opp?.recommendedPath && (
              <div className="bg-cyan-500/[0.06] border border-cyan-500/20 rounded-xl p-4 flex items-start gap-3">
                <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-cyan-400 mb-0.5">Recommended Path</p>
                  <p className="text-xs text-white/60">{opp.recommendedPath}</p>
                </div>
              </div>
            )}

            {/* Build actions */}
            <div>
              <p className="text-xs font-black text-white/50 uppercase tracking-wider mb-3">
                Build it now →
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {actions.map((action) => (
                  <Link
                    key={action.skillSlug + action.label}
                    href={buildSkillUrl(action.skillSlug)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r border hover:opacity-80 transition group ${action.gradient}`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-white/[0.07] flex items-center justify-center shrink-0 text-white/60 group-hover:text-white transition">
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">{action.label}</p>
                      <p className="text-xs text-white/40">{action.sublabel}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/30 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Ask Copilot */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-white/25">Not sure which path to take?</p>
              <Link
                href={`/copilot?prefill=${encodeURIComponent(`I scanned ${analysis.inputUrl} and got a score of ${analysis.score}/100 (${analysis.verdict}). What should I do next?`)}`}
                className="flex items-center gap-1.5 text-xs font-bold text-cyan-400/70 hover:text-cyan-400 transition"
              >
                Ask Himalaya Copilot <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !result && !error && (
          <div className="text-center py-16 text-white/20">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Enter a URL above to get started</p>
            <p className="text-xs mt-1 opacity-60">Works on any public website — business, product, ecommerce, landing page</p>
          </div>
        )}

      </div>
    </div>
  );
}
