"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, AlertTriangle } from "lucide-react";
import AppNav from "@/components/AppNav";
import HimalayaNav from "@/components/himalaya/HimalayaNav";
import ResultsHeader from "@/components/himalaya/ResultsHeader";
import ResultsSummary from "@/components/himalaya/ResultsSummary";
import ResultsPriorities from "@/components/himalaya/ResultsPriorities";
import ResultsAssets from "@/components/himalaya/ResultsAssets";
import ResultsWarnings from "@/components/himalaya/ResultsWarnings";
import ResultsNextActions from "@/components/himalaya/ResultsNextActions";
import ResultsTraceDetails from "@/components/himalaya/ResultsTraceDetails";
import ExportMenu from "@/components/himalaya/ExportMenu";
import ResultOperatorTools from "@/components/himalaya/ResultOperatorTools";
import StrategyReasoning from "@/components/himalaya/StrategyReasoning";
import ConfidenceBadge from "@/components/himalaya/ConfidenceBadge";
import ExecutionBanner from "@/components/himalaya/ExecutionBanner";
import DeployActions from "@/components/himalaya/DeployActions";
import OutcomePrompt from "@/components/himalaya/OutcomePrompt";
import AdaptiveInsights from "@/components/himalaya/AdaptiveInsights";
import CompetitorCards from "@/components/himalaya/CompetitorCards";
import UpgradeNudge from "@/components/himalaya/UpgradeNudge";
import ExecutionDecisionBlock from "@/components/himalaya/ExecutionDecisionBlock";
import { track } from "@/lib/himalaya/tracking";
import { formatResults } from "@/lib/himalaya/formatResults";
import type { RawAnalysis, HimalayaResultsViewModel } from "@/lib/himalaya/types";

export default function HimalayaRunPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = use(params);
  const [vm, setVm] = useState<HimalayaResultsViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRun = useCallback(() => {
    fetch(`/api/analyses/${runId}`)
      .then((r) => r.json() as Promise<{ ok: boolean; analysis?: RawAnalysis | null; error?: string; databaseUnavailable?: boolean }>)
      .then((data) => {
        if (data.ok && data.analysis) {
          setVm(formatResults(data.analysis));
        } else if (data.databaseUnavailable) {
          setError("Analysis data is temporarily unavailable");
        } else {
          setError(data.error ?? "Analysis not found");
        }
      })
      .catch(() => setError("Failed to load analysis"))
      .finally(() => setLoading(false));
  }, [runId]);

  useEffect(() => { loadRun(); }, [loadRun]);

  // Update operational memory when viewing a run
  useEffect(() => {
    if (!vm) return;
    track.resultsView(runId);
    fetch("/api/himalaya/memory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lastMode: vm.mode,
        lastInputUrl: vm.inputUrl,
      }),
    }).catch(() => {/* non-fatal */});
  }, [vm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050a14] text-white">
        <AppNav />
        <HimalayaNav />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {/* Skeleton */}
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-32 bg-white/[0.04] rounded" />
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6">
              <div className="flex gap-5">
                <div className="w-20 h-20 rounded-full bg-white/[0.04]" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-48 bg-white/[0.04] rounded" />
                  <div className="h-3 w-full bg-white/[0.03] rounded" />
                  <div className="h-3 w-2/3 bg-white/[0.03] rounded" />
                </div>
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 space-y-3">
              <div className="h-3 w-24 bg-white/[0.04] rounded" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-16 bg-white/[0.03] rounded-xl" />
                <div className="h-16 bg-white/[0.03] rounded-xl" />
                <div className="h-16 bg-white/[0.03] rounded-xl" />
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 space-y-3">
              <div className="h-3 w-32 bg-white/[0.04] rounded" />
              <div className="h-20 bg-white/[0.03] rounded-xl" />
              <div className="h-20 bg-white/[0.03] rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !vm) {
    return (
      <div className="min-h-screen bg-[#050a14] text-white">
        <AppNav />
        <div className="mx-auto flex min-h-[50vh] max-w-3xl flex-col justify-center gap-4 px-4">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-8">
            <AlertTriangle className="w-8 h-8 text-red-400/50" />
            <p className="text-white/40">{error ?? "Analysis not found"}</p>
            <Link href="/himalaya/runs" className="text-sm text-cyan-400 hover:text-cyan-300">
              ← Back to Run History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <HimalayaNav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 print:max-w-none print:px-8">
        {/* Back nav (hidden in print) */}
        <Link
          href="/himalaya/runs"
          className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition mb-6 print:hidden"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Run History
        </Link>

        {/* ═══ ABOVE THE FOLD: what matters immediately ═══ */}

        {/* Header */}
        <div className="mb-4">
          <ResultsHeader vm={vm} />
        </div>

        {/* Summary + Deploy (the two things that matter) */}
        <div className="mb-4">
          <ResultsSummary vm={vm} />
        </div>

        <div className="mb-4 print:hidden">
          <DeployActions vm={vm} autoDeploy />
        </div>

        <div className="mb-4 print:hidden">
          <ExecutionBanner runId={runId} />
        </div>

        {/* Decision block for free users */}
        <div className="mb-4">
          <ExecutionDecisionBlock runId={runId} mode={vm.mode} />
        </div>

        {/* ═══ BELOW THE FOLD: details on demand ═══ */}

        {/* Priorities + Strategy */}
        <details open className="mb-4">
          <summary className="text-[10px] font-black uppercase tracking-widest text-white/25 cursor-pointer hover:text-white/40 transition py-2">
            Priorities & Strategy
          </summary>
          <div className="space-y-4 mt-2">
            <ResultsPriorities vm={vm} />
            <StrategyReasoning vm={vm} />
            <ConfidenceBadge vm={vm} />
          </div>
        </details>

        {/* Generated Assets */}
        <details open className="mb-4">
          <summary className="text-[10px] font-black uppercase tracking-widest text-white/25 cursor-pointer hover:text-white/40 transition py-2">
            Generated Assets
          </summary>
          <div className="mt-2">
            <ResultsAssets vm={vm} onRegenerated={loadRun} />
          </div>
        </details>

        {/* Competitive Intelligence */}
        <details className="mb-4">
          <summary className="text-[10px] font-black uppercase tracking-widest text-white/25 cursor-pointer hover:text-white/40 transition py-2">
            Competitive Intelligence
          </summary>
          <div className="mt-2">
            <CompetitorCards vm={vm} />
          </div>
        </details>

        {/* Upgrade nudge */}
        <div className="mb-4 print:hidden">
          <UpgradeNudge context="after_results" />
        </div>

        {/* Adaptive Insights */}
        <div className="mb-4 print:hidden">
          <AdaptiveInsights mode={vm.mode} />
        </div>

        {/* Outcome + Warnings */}
        <div id="outcome" className="mb-4 print:hidden">
          <OutcomePrompt runId={runId} />
        </div>
        <div className="mb-4">
          <ResultsWarnings vm={vm} />
        </div>

        {/* Next Actions */}
        <div className="mb-4 print:hidden">
          <ResultsNextActions vm={vm} />
        </div>

        {/* G. Export + Tools (collapsed, hidden in print) */}
        <details className="mb-6 print:hidden">
          <summary className="text-[10px] font-bold text-white/20 uppercase tracking-widest cursor-pointer hover:text-white/40 transition py-2">
            Export & Tools
          </summary>
          <div className="space-y-4 mt-2">
            <ExportMenu vm={vm} />
            <ResultOperatorTools vm={vm} />
            <ResultsTraceDetails vm={vm} />
          </div>
        </details>
      </main>
    </div>
  );
}
