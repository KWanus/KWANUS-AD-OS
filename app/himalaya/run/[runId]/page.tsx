"use client";

import { useState, useEffect, useCallback, use, type ReactNode } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, AlertTriangle, ChevronDown } from "lucide-react";
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

function ResultsSection({
  title,
  children,
  defaultOpen = false,
  printHidden = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  printHidden?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className={`group mb-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 ${printHidden ? "print:hidden" : ""}`}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30 transition group-hover:text-white/45">
          {title}
        </span>
        <ChevronDown className="h-4 w-4 text-white/20 transition group-open:rotate-180 group-open:text-white/40" />
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

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
      <div className="min-h-screen bg-t-bg text-white">
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
      <div className="min-h-screen bg-t-bg text-white">
        <AppNav />
        <div className="mx-auto flex min-h-[50vh] max-w-3xl flex-col justify-center gap-4 px-4">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-8">
            <AlertTriangle className="w-8 h-8 text-red-400/50" />
            <p className="text-white/40">{error ?? "Analysis not found"}</p>
            <Link href="/himalaya/runs" className="text-sm text-[#f5a623] hover:text-[#f5a623]">
              ← Back to Run History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <AppNav />
      <HimalayaNav />
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 print:max-w-none print:px-8">
        {/* Back nav + share portal (hidden in print) */}
        <div className="mb-6 flex flex-col gap-2 print:hidden sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/himalaya/runs"
            className="inline-flex items-center gap-1.5 text-xs text-white/30 transition hover:text-white/60"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Run History
          </Link>
          <button
            onClick={() => {
              const portalUrl = `${window.location.origin}/portal/${runId}`;
              navigator.clipboard.writeText(portalUrl);
              alert("Portal link copied! Share it with your client.");
            }}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/40 transition hover:text-white/70 sm:w-auto"
          >
            Share Client Portal
          </button>
        </div>

        {/* ═══ ABOVE THE FOLD: what matters immediately ═══ */}
        <section className="mb-6">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/20">Run Snapshot</p>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-white/35">Review the verdict, decide whether to execute, and launch from one surface.</p>
            </div>
            <div className="hidden rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/30 sm:block">
              Above the fold
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="space-y-4">
              <ResultsHeader vm={vm} />
              <ResultsSummary vm={vm} />
              <ExecutionDecisionBlock runId={runId} mode={vm.mode} />
            </div>

            <div className="space-y-4 print:hidden">
              <div className="rounded-3xl border border-[#f5a623]/15 bg-gradient-to-br from-[#f5a623]/[0.05] via-transparent to-[#e07850]/[0.05] p-3 sm:p-4">
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#f5a623]/70">Launch Surface</p>
                <DeployActions vm={vm} autoDeploy />
              </div>
              <ExecutionBanner runId={runId} />
            </div>
          </div>
        </section>

        {/* ═══ BELOW THE FOLD: details on demand ═══ */}

        {/* Priorities + Strategy */}
        <ResultsSection title="Priorities & Strategy" defaultOpen>
          <div className="space-y-4">
            <ResultsPriorities vm={vm} />
            <StrategyReasoning vm={vm} />
            <ConfidenceBadge vm={vm} />
          </div>
        </ResultsSection>

        {/* Generated Assets */}
        <ResultsSection title="Generated Assets" defaultOpen>
          <ResultsAssets vm={vm} onRegenerated={loadRun} />
        </ResultsSection>

        {/* Competitive Intelligence */}
        <ResultsSection title="Competitive Intelligence">
          <CompetitorCards vm={vm} />
        </ResultsSection>

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
        <ResultsSection title="Export & Tools" printHidden>
          <div className="space-y-4">
            <ExportMenu vm={vm} />
            <ResultOperatorTools vm={vm} />
            <ResultsTraceDetails vm={vm} />
          </div>
        </ResultsSection>
      </main>
    </div>
  );
}
