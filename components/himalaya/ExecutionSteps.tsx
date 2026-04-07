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

function DayAction({ day, title, actions }: { day: string; title: string; actions: string[] }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-black/20 p-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="shrink-0 rounded border border-cyan-500/15 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-black text-cyan-400/60">{day}</span>
        <h4 className="text-xs font-bold text-white/60">{title}</h4>
      </div>
      <ul className="space-y-1.5 pl-1">
        {actions.map((a, i) => (
          <li key={i} className="flex items-start gap-2 text-[11px] text-white/40">
            <span className="text-cyan-400/30 shrink-0 mt-0.5">→</span>
            {a}
          </li>
        ))}
      </ul>
    </div>
  );
}

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
      <div className="mb-6 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.02] to-transparent p-4">
        <div className="mb-2 flex items-center justify-between">
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
          <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-6 text-center">
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

          {/* Your Next 7 Days — concrete action plan */}
          <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.03] via-white/[0.02] to-transparent p-5">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-cyan-400/50" />
              <h3 className="text-sm font-bold text-white/60">Your Next 7 Days</h3>
            </div>
            <p className="text-xs text-white/25 mb-4">This is exactly what to do with what you just built. Follow this order.</p>

            <div className="space-y-3">
              {vm.mode === "operator" ? (
                <>
                  <DayAction day="Today" title="Go live" actions={[
                    "Open your deployed site and make sure it loads correctly",
                    "Share the link with 3 people you trust and ask: 'Would you buy this?'",
                    "Post your best marketing angle on the platform it was built for",
                  ]} />
                  <DayAction day="Day 2-3" title="Start outreach" actions={[
                    "Send your offer to 10 potential customers directly (DM, email, or call)",
                    "Post 2 more marketing angles — test different hooks",
                    "Set up your email sequence so leads get automatic follow-up",
                  ]} />
                  <DayAction day="Day 4-5" title="Read the signals" actions={[
                    "Check which marketing angle got the most engagement",
                    "Check if anyone replied to your outreach — what did they say?",
                    "If something worked, do more of it. If nothing worked, change the angle.",
                  ]} />
                  <DayAction day="Day 6-7" title="Iterate or double down" actions={[
                    "Come back to Himalaya and report your outcome (what happened?)",
                    "Regenerate the assets that didn't work with fresh competitive data",
                    "If you got a response or sale — that's your winning direction. Scale it.",
                  ]} />
                </>
              ) : (
                <>
                  <DayAction day="Today" title="Apply the fixes" actions={[
                    "Open your site and implement the #1 priority fix from your results",
                    "Update your headline if the system flagged it as weak",
                    "Make sure your CTA is visible above the fold",
                  ]} />
                  <DayAction day="Day 2-3" title="Deploy the improvements" actions={[
                    "Replace your current email sequence with the generated one",
                    "Test 2-3 of the new marketing angles on your best platform",
                    "Add the trust elements the system identified as missing",
                  ]} />
                  <DayAction day="Day 4-5" title="Measure the change" actions={[
                    "Compare your traffic and conversion numbers to last week",
                    "Check if the new headline/CTA is getting more clicks",
                    "Note which marketing angle performs best",
                  ]} />
                  <DayAction day="Day 6-7" title="Report and improve" actions={[
                    "Come back to Himalaya and report your outcome",
                    "Run another scan on your URL to see what improved",
                    "The system will adjust recommendations based on your real results",
                  ]} />
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:justify-center">
            <Link
              href={`/himalaya/run/${runId}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/50 transition hover:text-white/80"
            >
              <ArrowLeft className="w-3 h-3" /> Back to Results
            </Link>
            <Link
              href={vm.mode === "consultant" ? `/himalaya/improve?fromRun=${runId}` : `/himalaya/scratch?fromRun=${runId}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/50 transition hover:text-white/80"
            >
              <RefreshCw className="w-3 h-3" /> Run Again (Improved)
            </Link>
            <Link
              href="/himalaya"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90"
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
