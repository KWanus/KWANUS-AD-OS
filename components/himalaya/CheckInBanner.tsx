"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, Play } from "lucide-react";

type RunCheck = {
  id: string;
  title: string | null;
  hasOutcome: boolean;
  hasExecution: boolean;
  executionComplete: boolean;
};

export default function CheckInBanner() {
  const [run, setRun] = useState<RunCheck | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Find the most recent run that needs attention
    fetch("/api/analyses?sortBy=createdAt&limit=5")
      .then((r) => r.json() as Promise<{ ok: boolean; analyses?: { id: string; title: string | null; outcome: unknown; executionState: unknown }[] }>)
      .then((data) => {
        if (!data.ok || !data.analyses) return;

        for (const a of data.analyses) {
          const hasOutcome = !!a.outcome;
          const execState = a.executionState as { completedAt?: string; steps?: unknown[] } | null;
          const hasExecution = !!execState?.steps;
          const executionComplete = !!execState?.completedAt;

          // Find first run that either has no outcome or incomplete execution
          if (!hasOutcome || (hasExecution && !executionComplete)) {
            setRun({ id: a.id, title: a.title, hasOutcome, hasExecution, executionComplete });
            break;
          }
        }
      })
      .catch(() => {});
  }, []);

  if (!run || dismissed) return null;

  // Run has execution in progress but no outcome
  if (run.hasExecution && !run.executionComplete) {
    return (
      <div className="mb-6 rounded-2xl border border-[#f5a623]/10 bg-gradient-to-br from-[#f5a623]/[0.05] via-[#f5a623]/[0.025] to-transparent p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Play className="w-4 h-4 text-[#f5a623]/60" />
            <div>
              <p className="text-xs font-bold text-white/50">You have an active execution</p>
              <p className="text-[10px] text-white/25 mt-0.5">{run.title ?? "Your latest run"} — continue where you left off</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 shrink-0">
            <Link
              href={`/himalaya/run/${run.id}/execute`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#f5a623]/20 bg-[#f5a623]/10 px-3 py-2 text-[10px] font-bold text-[#f5a623] transition hover:bg-[#f5a623]/20"
            >
              Continue <ArrowRight className="w-2.5 h-2.5" />
            </Link>
            <button onClick={() => setDismissed(true)} className="px-1 text-left text-[10px] text-white/15 transition hover:text-white/30">
              later
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Run has no outcome reported
  if (!run.hasOutcome) {
    return (
      <div className="mb-6 rounded-2xl border border-amber-500/10 bg-gradient-to-br from-amber-500/[0.05] via-amber-500/[0.025] to-transparent p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-4 h-4 text-amber-400/60" />
            <div>
              <p className="text-xs font-bold text-white/50">Have you applied these changes yet?</p>
              <p className="text-[10px] text-white/25 mt-0.5">{run.title ?? "Your latest run"} — tell us how it went</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 shrink-0">
            <Link
              href={`/himalaya/run/${run.id}#outcome`}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[10px] font-bold text-amber-400 transition hover:bg-amber-500/20"
            >
              Report outcome <ArrowRight className="w-2.5 h-2.5" />
            </Link>
            <button onClick={() => setDismissed(true)} className="px-1 text-left text-[10px] text-white/15 transition hover:text-white/30">
              later
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
