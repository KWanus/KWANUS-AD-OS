"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Trophy, ArrowLeft } from "lucide-react";
import Link from "next/link";
import ExecutionStepCard from "./ExecutionStepCard";
import { buildExecutionSteps, mergeExecutionState } from "@/lib/himalaya/buildExecutionSteps";
import type { ExecutionState } from "@/lib/himalaya/buildExecutionSteps";
import type { HimalayaResultsViewModel } from "@/lib/himalaya/types";

type Props = {
  vm: HimalayaResultsViewModel;
  runId: string;
};

export default function ExecutionSteps({ vm, runId }: Props) {
  const [state, setState] = useState<ExecutionState | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    fetch(`/api/analyses/${runId}/execute`)
      .then((r) => r.json() as Promise<{ ok: boolean; executionState?: ExecutionState | null }>)
      .then((data) => {
        const freshSteps = buildExecutionSteps(vm);
        const saved = data.ok ? (data.executionState as ExecutionState | null) : null;
        const merged = mergeExecutionState(freshSteps, saved);

        // Auto-set startedAt if not yet set
        if (!merged.startedAt) {
          merged.startedAt = new Date().toISOString();
        }

        setState(merged);
        // Persist the merged state
        void persist(merged);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [runId, vm]);

  useEffect(() => { load(); }, [load]);

  async function persist(newState: ExecutionState) {
    try {
      await fetch(`/api/analyses/${runId}/execute`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ executionState: newState }),
      });
    } catch {
      // non-fatal
    }
  }

  function toggleStep(stepId: string) {
    if (!state) return;

    const updated: ExecutionState = {
      ...state,
      steps: state.steps.map((s) => {
        if (s.id !== stepId) return s;
        // Cycle: not_started → in_progress → done → not_started
        const next =
          s.status === "not_started" ? "in_progress" as const
          : s.status === "in_progress" ? "done" as const
          : "not_started" as const;
        return { ...s, status: next };
      }),
    };

    // Check if all done
    const allDone = updated.steps.every((s) => s.status === "done");
    updated.completedAt = allDone ? new Date().toISOString() : null;

    setState(updated);
    void persist(updated);
  }

  if (loading || !state) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
      </div>
    );
  }

  const completed = state.steps.filter((s) => s.status === "done").length;
  const total = state.steps.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;
  const allDone = completed === total;

  return (
    <div>
      {/* Progress header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-white/40">
            {allDone ? "Execution Complete" : `${completed} of ${total} steps completed`}
          </p>
          <span className={`text-xs font-black ${allDone ? "text-emerald-400" : "text-white/25"}`}>
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${allDone ? "bg-emerald-500" : "bg-cyan-500"}`}
            style={{ width: `${Math.max(progress, 1)}%` }}
          />
        </div>
      </div>

      {/* Completion celebration */}
      {allDone && (
        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-6 mb-6 flex flex-col items-center gap-3 text-center">
          <Trophy className="w-8 h-8 text-emerald-400" />
          <h2 className="text-lg font-black text-emerald-300">Execution Complete</h2>
          <p className="text-xs text-white/40 max-w-md">
            All steps are done. Your {vm.mode === "consultant" ? "improvement plan" : "business foundation"} has been fully executed.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-3">
            <Link
              href={`/himalaya/run/${runId}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-white/50 hover:text-white/80 transition"
            >
              <ArrowLeft className="w-3 h-3" /> Back to Results
            </Link>
            <Link
              href="/himalaya"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-xs font-bold text-white hover:opacity-90 transition"
            >
              Start New Path
            </Link>
            <Link
              href="/websites/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-white/50 hover:text-white/80 transition"
            >
              Build Website
            </Link>
            <Link
              href="/campaigns"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-white/50 hover:text-white/80 transition"
            >
              Create Campaign
            </Link>
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-2">
        {state.steps.map((step, i) => (
          <ExecutionStepCard
            key={step.id}
            step={step}
            index={i}
            onToggle={toggleStep}
          />
        ))}
      </div>
    </div>
  );
}
