"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Trophy, ArrowLeft, TrendingUp, Rocket, Target, BarChart2, RefreshCw } from "lucide-react";
import Link from "next/link";
import OutcomePrompt from "./OutcomePrompt";
import ExecutionStepCard from "./ExecutionStepCard";
import { buildExecutionSteps, mergeExecutionState } from "@/lib/himalaya/buildExecutionSteps";
import type { ExecutionState } from "@/lib/himalaya/buildExecutionSteps";
import type { HimalayaResultsViewModel } from "@/lib/himalaya/types";

type Props = {
  vm: HimalayaResultsViewModel;
  runId: string;
};

const GROWTH_COLORS: Record<string, string> = {
  cyan: "bg-cyan-500/5 border-cyan-500/10",
  purple: "bg-purple-500/5 border-purple-500/10",
  amber: "bg-amber-500/5 border-amber-500/10",
  emerald: "bg-emerald-500/5 border-emerald-500/10",
};

const GROWTH_ICON_COLORS: Record<string, string> = {
  cyan: "text-cyan-400/60",
  purple: "text-purple-400/60",
  amber: "text-amber-400/60",
  emerald: "text-emerald-400/60",
};

function GrowthCard({ icon: Icon, title, description, color }: { icon: React.ElementType; title: string; description: string; color: string }) {
  return (
    <div className={`rounded-xl border p-4 ${GROWTH_COLORS[color] ?? GROWTH_COLORS.cyan}`}>
      <Icon className={`w-4 h-4 mb-2 ${GROWTH_ICON_COLORS[color] ?? GROWTH_ICON_COLORS.cyan}`} />
      <h4 className="text-xs font-bold text-white/60 mb-1">{title}</h4>
      <p className="text-[11px] text-white/35 leading-relaxed">{description}</p>
    </div>
  );
}

export default function ExecutionSteps({ vm, runId }: Props) {
  const [state, setState] = useState<ExecutionState | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    const freshSteps = buildExecutionSteps(vm);

    // Try to load saved state, but don't block on it
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    fetch(`/api/analyses/${runId}/execute`, { signal: controller.signal })
      .then((r) => r.json() as Promise<{ ok: boolean; executionState?: ExecutionState | null }>)
      .then((data) => {
        clearTimeout(timeout);
        const saved = data.ok ? (data.executionState as ExecutionState | null) : null;
        const stepsMatch = saved && saved.steps.length === freshSteps.length &&
          saved.steps.every((s, i) => s.id === freshSteps[i].id);
        const merged = stepsMatch ? mergeExecutionState(freshSteps, saved) : mergeExecutionState(freshSteps, null);
        if (!merged.startedAt) merged.startedAt = new Date().toISOString();
        setState(merged);
      })
      .catch(() => {
        clearTimeout(timeout);
        // DB unavailable — just use fresh steps
        const fresh: ExecutionState = { steps: freshSteps, startedAt: new Date().toISOString(), completedAt: null };
        setState(fresh);
      })
      .finally(() => setLoading(false));
  }, [runId, vm]);

  useEffect(() => { load(); }, [load]);

  // Fire-and-forget persist with timeout
  function persist(newState: ExecutionState) {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 3000);
    fetch(`/api/analyses/${runId}/execute`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ executionState: newState }),
      signal: controller.signal,
    }).catch(() => { /* non-blocking */ });
  }

  function toggleStep(stepId: string) {
    if (!state) return;

    // Optimistic update — instant UI response
    const updated: ExecutionState = {
      ...state,
      steps: state.steps.map((s) => {
        if (s.id !== stepId) return s;
        const next = s.status === "not_started" ? "done" as const : "not_started" as const;
        return { ...s, status: next };
      }),
    };
    updated.completedAt = updated.steps.every((s) => s.status === "done") ? new Date().toISOString() : null;

    setState(updated);
    persist(updated);
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
            {allDone ? "All done!" : `${completed} of ${total} steps completed`}
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

      {/* Post-Execution Flow */}
      {allDone && (
        <div className="space-y-4 mb-6">
          {/* Celebration */}
          <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-6 text-center">
            <Trophy className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <h2 className="text-lg font-black text-emerald-300 mb-1">Execution Complete</h2>
            <p className="text-sm text-white/40 max-w-md mx-auto">
              {vm.mode === "consultant"
                ? "Your improvements are live. Now track the impact and keep optimizing."
                : "Your business foundation is launched. Now it's about getting your first traction."}
            </p>
          </div>

          {/* Outcome prompt */}
          <OutcomePrompt runId={runId} />

          {/* What's next — growth path */}
          <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-cyan-400/50" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30">What to Do Next</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {vm.mode === "operator" ? (
                <>
                  <GrowthCard
                    icon={Target}
                    title="Get Your First Customer"
                    description="Share your site, run your first ads, reach out to 10 potential clients this week."
                    color="cyan"
                  />
                  <GrowthCard
                    icon={BarChart2}
                    title="Track What Works"
                    description="Watch which marketing angles get clicks. Double down on winners, kill losers after 48 hours."
                    color="purple"
                  />
                  <GrowthCard
                    icon={RefreshCw}
                    title="Improve Your Assets"
                    description="Come back and regenerate sections based on real feedback. The system gets smarter with your input."
                    color="amber"
                  />
                  <GrowthCard
                    icon={Rocket}
                    title="Scale What's Working"
                    description="Once you have traction, run Himalaya again to build your next growth layer — funnels, automations, expansion."
                    color="emerald"
                  />
                </>
              ) : (
                <>
                  <GrowthCard
                    icon={BarChart2}
                    title="Measure the Impact"
                    description="Compare your metrics before and after the changes. Report the outcome so the system can learn."
                    color="cyan"
                  />
                  <GrowthCard
                    icon={Target}
                    title="Fix the Next Weak Point"
                    description="Run Himalaya again on the same URL to find the next improvement opportunity."
                    color="purple"
                  />
                  <GrowthCard
                    icon={RefreshCw}
                    title="Iterate on What Changed"
                    description="Regenerate specific sections with fresh competitive intelligence to keep your edge."
                    color="amber"
                  />
                  <GrowthCard
                    icon={Rocket}
                    title="Add Systems"
                    description="Once conversions improve, add automations, email sequences, and scaling infrastructure."
                    color="emerald"
                  />
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href={`/himalaya/run/${runId}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-white/50 hover:text-white/80 transition"
            >
              <ArrowLeft className="w-3 h-3" /> Back to Results
            </Link>
            <Link
              href={vm.mode === "consultant" ? `/himalaya/improve?fromRun=${runId}` : `/himalaya/scratch?fromRun=${runId}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-white/50 hover:text-white/80 transition"
            >
              <RefreshCw className="w-3 h-3" /> Run Again (Improved)
            </Link>
            <Link
              href="/himalaya"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-xs font-bold text-white hover:opacity-90 transition"
            >
              Start New Path
            </Link>
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-3">
        {state.steps.map((step, i) => (
          <ExecutionStepCard
            key={step.id}
            step={step}
            index={i}
            runId={runId}
            onToggle={toggleStep}
          />
        ))}
      </div>
    </div>
  );
}
