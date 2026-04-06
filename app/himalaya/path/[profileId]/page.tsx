"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2, ArrowRight, Mountain, CheckCircle, Target,
  TrendingUp, Shield, Clock, DollarSign, AlertTriangle,
  Link as LinkIcon, Package, Briefcase, User, GraduationCap,
  MapPin, ShoppingBag, FileText, Zap, Wrench,
} from "lucide-react";
import AppNav from "@/components/AppNav";
import HimalayaNav from "@/components/himalaya/HimalayaNav";
import type { DecisionResult, BusinessPath, PathRecommendation } from "@/lib/himalaya/profileTypes";
import { PATH_INFO } from "@/lib/himalaya/profileTypes";

const PATH_ICONS: Record<string, React.ElementType> = {
  affiliate: LinkIcon,
  dropshipping: Package,
  agency: Briefcase,
  freelance: User,
  coaching: GraduationCap,
  local_service: MapPin,
  ecommerce_brand: ShoppingBag,
  digital_product: FileText,
  improve_existing: Wrench,
  scale_systems: Zap,
};

const RISK_COLORS: Record<string, string> = {
  Low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  High: "text-red-400 bg-red-500/10 border-red-500/20",
};

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 60 ? "bg-emerald-500" : value >= 35 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden w-24">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(value, 3)}%` }} />
    </div>
  );
}

function PathCard({
  rec,
  isPrimary,
  profileId,
  onLaunch,
  launching,
}: {
  rec: PathRecommendation;
  isPrimary: boolean;
  profileId: string;
  onLaunch: (path: BusinessPath) => void;
  launching: boolean;
}) {
  const info = PATH_INFO[rec.path];
  const Icon = PATH_ICONS[rec.path] ?? Target;

  return (
    <div className={`rounded-3xl border p-5 sm:p-6 ${
      isPrimary
        ? "bg-gradient-to-br from-cyan-500/[0.06] to-purple-500/[0.06] border-cyan-500/20"
        : "bg-gradient-to-br from-white/[0.03] via-white/[0.02] to-transparent border-white/[0.07]"
    }`}>
      {isPrimary && (
        <div className="flex items-center gap-2 mb-4">
          <Mountain className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Recommended Path</span>
        </div>
      )}

      <div className="flex items-start gap-4 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          isPrimary ? "bg-cyan-500/15" : "bg-white/[0.04]"
        }`}>
          <Icon className={`w-5 h-5 ${isPrimary ? "text-cyan-400" : "text-white/30"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-black ${isPrimary ? "text-white" : "text-white/70"}`}>{rec.label}</h3>
          <p className="text-xs text-white/35 mt-0.5">{info?.description}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-black/20 p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Target className="w-3 h-3 text-white/20" />
            <span className="text-[9px] font-bold text-white/25 uppercase">Match</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-white/60">{rec.confidence}%</span>
            <ConfidenceBar value={rec.confidence} />
          </div>
        </div>
        <div className="rounded-lg bg-black/20 p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3 h-3 text-white/20" />
            <span className="text-[9px] font-bold text-white/25 uppercase">First Revenue</span>
          </div>
          <p className="text-sm font-bold text-white/60">{rec.estimatedTimeToFirstRevenue}</p>
        </div>
        <div className="rounded-lg bg-black/20 p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="w-3 h-3 text-white/20" />
            <span className="text-[9px] font-bold text-white/25 uppercase">Investment</span>
          </div>
          <p className="text-sm font-bold text-white/60">{rec.startingInvestment}</p>
        </div>
        <div className="rounded-lg bg-black/20 p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Shield className="w-3 h-3 text-white/20" />
            <span className="text-[9px] font-bold text-white/25 uppercase">Risk</span>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${RISK_COLORS[rec.riskLevel]}`}>
            {rec.riskLevel}
          </span>
        </div>
      </div>

      {/* Why this path */}
      {rec.reasoning.length > 0 && (
        <div className="mb-5">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-2">Why This Path</h4>
          <ul className="space-y-1.5">
            {rec.reasoning.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-white/45">
                <CheckCircle className="w-3 h-3 text-emerald-400/50 shrink-0 mt-0.5" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next steps */}
      <div className="mb-5">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-2">Your First 5 Steps</h4>
        <ol className="space-y-1.5">
          {rec.nextSteps.map((s, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-white/50">
              <span className="text-cyan-400/50 font-black shrink-0">{i + 1}.</span>
              {s}
            </li>
          ))}
        </ol>
      </div>

      {/* CTA */}
      {rec.path === "improve_existing" || rec.path === "scale_systems" ? (
        <Link
          href={`/himalaya/building/${profileId}?path=${rec.path}&mode=improve`}
          className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition ${
            isPrimary
              ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:opacity-90"
              : "bg-white/[0.04] border border-white/[0.1] text-white/60 hover:text-white hover:border-white/[0.2]"
          }`}
        >
          {isPrimary ? <TrendingUp className="w-4 h-4" /> : <ArrowRight className="w-3.5 h-3.5" />}
          {isPrimary ? "Scan & Improve" : "Explore This Path"}
        </Link>
      ) : (
        <button
          onClick={() => onLaunch(rec.path)}
          disabled={launching}
          className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition disabled:opacity-40 ${
            isPrimary
              ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:opacity-90"
              : "bg-white/[0.04] border border-white/[0.1] text-white/60 hover:text-white hover:border-white/[0.2]"
          }`}
        >
          {launching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isPrimary ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <ArrowRight className="w-3.5 h-3.5" />
          )}
          {launching ? "Building..." : isPrimary ? "Build My Foundation" : "Start This Path"}
        </button>
      )}
    </div>
  );
}

export default function HimalayaPathPage({ params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = use(params);
  const router = useRouter();
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/himalaya/profile/${profileId}`)
      .then((r) => r.json() as Promise<{ ok: boolean; profile?: { decisionResult: DecisionResult } }>)
      .then((data) => {
        if (data.ok && data.profile?.decisionResult) {
          setResult(data.profile.decisionResult);
        } else {
          setError("Profile not found");
        }
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [profileId]);

  const handleLaunch = useCallback((path: BusinessPath) => {
    setLaunching(true);
    // Route to building page which runs the pipeline with progress visualization
    router.push(`/himalaya/building/${profileId}?path=${path}&mode=scratch`);
  }, [profileId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050a14] text-white">
        <AppNav />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          <p className="text-sm text-white/30">Analyzing your profile...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#050a14] text-white">
        <AppNav />
        <div className="mx-auto flex min-h-[50vh] max-w-3xl flex-col justify-center gap-4 px-4">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-8">
            <AlertTriangle className="w-8 h-8 text-red-400/50" />
            <p className="text-white/40">{error}</p>
            <Link href="/himalaya" className="text-sm text-cyan-400 hover:text-cyan-300">← Start Over</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <HimalayaNav />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="mb-8 rounded-3xl border border-cyan-500/12 bg-gradient-to-br from-cyan-500/[0.06] via-transparent to-purple-500/[0.05] px-5 py-8 text-center sm:px-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600">
            <Mountain className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Your Path Is Clear</h1>
          <p className="text-sm text-white/35">
            Based on your profile: <span className="text-white/50">{result.profileSummary}</span>
          </p>
        </div>

        {/* Primary recommendation */}
        <div className="mb-6">
          <PathCard rec={result.primary} isPrimary profileId={profileId} onLaunch={(p) => void handleLaunch(p)} launching={launching} />
        </div>

        {/* Alternatives */}
        {result.alternatives.length > 0 && (
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-4 mt-10">
              Other Strong Options
            </h2>
            <div className="space-y-4">
              {result.alternatives.map((alt, i) => (
                <PathCard key={i} rec={alt} isPrimary={false} profileId={profileId} onLaunch={(p) => void handleLaunch(p)} launching={launching} />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 text-center">
          <Link
            href="/himalaya"
            className="text-xs text-white/20 hover:text-white/40 transition"
          >
            Retake the assessment
          </Link>
        </div>
      </main>
    </div>
  );
}
