"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppNav from "@/components/AppNav";
import Link from "next/link";
import {
  Radar, ArrowRight, Loader2, CheckCircle2, Clock,
  TrendingUp, Target, Zap, AlertCircle,
} from "lucide-react";

type MarketVertical = "affiliate" | "dropship" | "ecommerce" | "digital" | "local_service";

const VERTICALS: { key: MarketVertical; label: string; description: string }[] = [
  { key: "affiliate", label: "Affiliate Marketing", description: "Find high-converting offers to promote" },
  { key: "dropship", label: "Dropshipping", description: "Discover winning products to sell" },
  { key: "ecommerce", label: "E-Commerce", description: "Analyze product markets and competitors" },
  { key: "digital", label: "Digital Products", description: "Courses, templates, SaaS opportunities" },
  { key: "local_service", label: "Local Services", description: "Service business opportunities" },
];

type RunSummary = {
  id: string;
  niche: string;
  vertical: string;
  status: string;
  score?: number | null;
  topProductName?: string | null;
  createdAt: string;
};

export default function MarketIntelligencePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [vertical, setVertical] = useState<MarketVertical>(
    (searchParams.get("vertical") as MarketVertical) || "affiliate"
  );
  const [niche, setNiche] = useState("");
  const [subNiche, setSubNiche] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState("discovering");
  const [pastRuns, setPastRuns] = useState<RunSummary[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const stageTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    fetch("/api/market-intelligence")
      .then(r => r.json() as Promise<{ ok: boolean; runs?: RunSummary[] }>)
      .then(d => { if (d.ok && d.runs) setPastRuns(d.runs); })
      .catch(() => {})
      .finally(() => setLoadingRuns(false));
  }, []);

  async function runScan() {
    if (!niche.trim()) return;
    setRunning(true);
    setError("");
    setStage("discovering");

    stageTimers.current = [
      setTimeout(() => setStage("analyzing"), 8000),
      setTimeout(() => setStage("synthesizing"), 25000),
      setTimeout(() => setStage("generating"), 45000),
    ];

    try {
      const res = await fetch("/api/market-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: niche.trim(), subNiche: subNiche.trim() || undefined, vertical }),
      });
      stageTimers.current.forEach(clearTimeout);
      const data = await res.json() as { ok: boolean; runId?: string; error?: string };
      if (data.ok && data.runId) {
        router.push(`/market-intelligence/${data.runId}`);
      } else {
        setError(data.error || "Scan failed");
        setRunning(false);
      }
    } catch (err) {
      stageTimers.current.forEach(clearTimeout);
      setError(err instanceof Error ? err.message : "Network error");
      setRunning(false);
    }
  }

  const stageLabels: Record<string, string> = {
    discovering: "Discovering products and offers...",
    analyzing: "Analyzing top winners...",
    synthesizing: "Synthesizing market strategy...",
    generating: "Generating launch assets...",
  };

  const stageOrder = ["discovering", "analyzing", "synthesizing", "generating"];

  if (running) {
    return (
      <div className="min-h-screen bg-[#020509] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <Radar className="w-12 h-12 text-cyan-400 mx-auto mb-6 animate-pulse" />
          <h2 className="text-xl font-bold text-white mb-2">Scanning Market</h2>
          <p className="text-white/40 text-sm mb-8">{niche}</p>
          <div className="space-y-3">
            {stageOrder.map((s) => {
              const idx = stageOrder.indexOf(s);
              const currentIdx = stageOrder.indexOf(stage);
              const done = idx < currentIdx;
              const active = idx === currentIdx;
              return (
                <div key={s} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${
                  active ? "border-cyan-500/30 bg-cyan-500/5" : done ? "border-white/[0.05] bg-white/[0.02]" : "border-white/[0.03] bg-transparent"
                }`}>
                  {done ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                   active ? <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" /> :
                   <div className="w-4 h-4 rounded-full border border-white/10" />}
                  <span className={`text-sm ${active ? "text-white" : done ? "text-white/50" : "text-white/20"}`}>
                    {stageLabels[s]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020509] text-white">
      <AppNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
            <Radar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300">Market Intelligence</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
            Discover Winning Products
          </h1>
          <p className="text-white/40 text-sm max-w-lg mx-auto">
            Scan any niche. Find top products, analyze winners, get a complete launch strategy with ads, emails, and funnels.
          </p>
        </div>

        {/* Vertical selector */}
        <div className="mb-6">
          <label className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3 block">Market Vertical</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {VERTICALS.map((v) => (
              <button
                key={v.key}
                onClick={() => setVertical(v.key)}
                className={`text-left rounded-xl border px-3 py-2.5 text-sm transition-all ${
                  vertical === v.key
                    ? "border-cyan-500/50 bg-cyan-500/10 text-white"
                    : "border-white/[0.07] bg-white/[0.02] text-white/50 hover:border-white/20"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Niche input */}
        <div className="mb-4">
          <label className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2 block">Niche / Market</label>
          <input
            type="text"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="e.g. weight loss supplements, pet grooming tools, AI productivity apps"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-white placeholder:text-white/25 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        {/* Sub-niche */}
        <div className="mb-6">
          <label className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2 block">
            Sub-niche <span className="text-white/20">(optional)</span>
          </label>
          <input
            type="text"
            value={subNiche}
            onChange={(e) => setSubNiche(e.target.value)}
            placeholder="e.g. keto for women over 40, eco-friendly dog toys"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={runScan}
          disabled={!niche.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-3.5 text-sm font-bold text-white disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(34,211,238,0.2)] transition-all mb-12"
        >
          <Radar className="w-4 h-4" />
          Scan This Market
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Past runs */}
        {pastRuns.length > 0 && (
          <div>
            <h2 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">Previous Scans</h2>
            <div className="space-y-2">
              {pastRuns.map((run) => (
                <Link
                  key={run.id}
                  href={`/market-intelligence/${run.id}`}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      run.status === "complete" ? "bg-emerald-400" : run.status === "running" ? "bg-cyan-400 animate-pulse" : "bg-red-400"
                    }`} />
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">{run.niche}</p>
                      <p className="text-[10px] text-white/30">
                        {run.vertical} · {new Date(run.createdAt).toLocaleDateString()}
                        {run.topProductName && ` · ${run.topProductName}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {run.score != null && (
                      <span className={`text-xs font-bold ${
                        run.score >= 70 ? "text-emerald-400" : run.score >= 40 ? "text-cyan-400" : "text-white/30"
                      }`}>
                        {run.score}/100
                      </span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {loadingRuns && pastRuns.length === 0 && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
