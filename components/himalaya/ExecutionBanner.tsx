"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play, ArrowRight, Trophy, Loader2 } from "lucide-react";
import type { ExecutionState } from "@/lib/himalaya/buildExecutionSteps";

type Props = {
  runId: string;
};

export default function ExecutionBanner({ runId }: Props) {
  const [state, setState] = useState<ExecutionState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/analyses/${runId}/execute`)
      .then((r) => r.json() as Promise<{ ok: boolean; executionState?: ExecutionState | null }>)
      .then((data) => {
        if (data.ok && data.executionState) setState(data.executionState as ExecutionState);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [runId]);

  if (loading) return null;

  // No execution started yet → show "Start Execution" CTA
  if (!state || !state.startedAt) {
    return (
      <div className="rounded-2xl border border-[#f5a623]/15 bg-gradient-to-br from-cyan-500/[0.08] via-transparent to-purple-500/[0.06] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/70">Execution</p>
            <h3 className="mt-2 text-sm font-black text-white">Ready to execute?</h3>
            <p className="mt-1 text-xs text-white/40">Turn your results into a step-by-step action plan</p>
          </div>
          <Link
            href={`/himalaya/run/${runId}/execute`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-white text-xs font-bold hover:opacity-90 transition shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            Start Execution
          </Link>
        </div>
      </div>
    );
  }

  const completed = state.steps.filter((s) => s.status === "done").length;
  const total = state.steps.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;
  const allDone = completed === total;

  // Execution complete
  if (allDone) {
    return (
      <div className="rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-emerald-500/[0.08] to-transparent p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-emerald-300">Execution Complete</h3>
              <p className="text-[10px] text-white/30">{total} steps completed</p>
            </div>
          </div>
          <Link
            href={`/himalaya/run/${runId}/execute`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[10px] font-semibold text-white/40 hover:text-white/70 transition"
          >
            View Steps <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    );
  }

  // Execution in progress
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.03] to-white/[0.015] p-4">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/25">Execution</p>
          <h3 className="mt-2 text-sm font-black text-white/70">{completed} of {total} steps completed</h3>
          <p className="text-[10px] text-white/25">Continue where you left off</p>
        </div>
        <Link
          href={`/himalaya/run/${runId}/execute`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f5a623]/10 border border-[#f5a623]/20 text-xs font-bold text-[#f5a623] hover:bg-[#f5a623]/20 transition shrink-0"
        >
          Continue Execution
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-[#f5a623] transition-all duration-500"
          style={{ width: `${Math.max(progress, 2)}%` }}
        />
      </div>
    </div>
  );
}
