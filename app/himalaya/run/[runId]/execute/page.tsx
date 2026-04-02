"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, AlertTriangle } from "lucide-react";
import AppNav from "@/components/AppNav";
import HimalayaNav from "@/components/himalaya/HimalayaNav";
import ExecutionSteps from "@/components/himalaya/ExecutionSteps";
import { formatResults } from "@/lib/himalaya/formatResults";
import type { RawAnalysis, HimalayaResultsViewModel } from "@/lib/himalaya/types";

export default function HimalayaExecutePage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = use(params);
  const [vm, setVm] = useState<HimalayaResultsViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/analyses/${runId}`)
      .then((r) => r.json() as Promise<{ ok: boolean; analysis?: RawAnalysis | null; error?: string }>)
      .then((data) => {
        if (data.ok && data.analysis) {
          setVm(formatResults(data.analysis));
        } else {
          setError(data.error ?? "Run not found");
        }
      })
      .catch(() => setError("Failed to load run"))
      .finally(() => setLoading(false));
  }, [runId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050a14] text-white">
        <AppNav />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
        </div>
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
            <p className="text-white/40">{error ?? "Run not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <HimalayaNav />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href={`/himalaya/run/${runId}`}
          className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Results
        </Link>

        <div className="mb-6">
          <h1 className="text-xl font-black text-white mb-1">Execute Your Plan</h1>
          <p className="text-sm text-white/30">
            {vm.mode === "consultant"
              ? "Follow these steps to implement the improvement plan."
              : "Follow these steps to launch your business foundation."}
          </p>
        </div>

        {/* Run context summary */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white/50">{vm.title}</p>
              <p className="text-[10px] text-white/25 mt-0.5">{vm.modeLabel} · Score: {vm.score}/100</p>
            </div>
            <span className={`text-sm font-black ${vm.score >= 70 ? "text-emerald-400" : vm.score >= 45 ? "text-amber-400" : "text-red-400"}`}>
              {vm.score}
            </span>
          </div>
        </div>

        <ExecutionSteps vm={vm} runId={runId} />
      </main>
    </div>
  );
}
