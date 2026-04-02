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
      <div className="bg-cyan-500/[0.03] border border-cyan-500/10 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Play className="w-4 h-4 text-cyan-400/60" />
            <div>
              <p className="text-xs font-bold text-white/50">You have an active execution</p>
              <p className="text-[10px] text-white/25 mt-0.5">{run.title ?? "Your latest run"} — continue where you left off</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/himalaya/run/${run.id}/execute`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-400 hover:bg-cyan-500/20 transition"
            >
              Continue <ArrowRight className="w-2.5 h-2.5" />
            </Link>
            <button onClick={() => setDismissed(true)} className="text-[10px] text-white/15 hover:text-white/30 transition px-1">
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
      <div className="bg-amber-500/[0.03] border border-amber-500/10 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-4 h-4 text-amber-400/60" />
            <div>
              <p className="text-xs font-bold text-white/50">Have you applied these changes yet?</p>
              <p className="text-[10px] text-white/25 mt-0.5">{run.title ?? "Your latest run"} — tell us how it went</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/himalaya/run/${run.id}#outcome`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400 hover:bg-amber-500/20 transition"
            >
              Report outcome <ArrowRight className="w-2.5 h-2.5" />
            </Link>
            <button onClick={() => setDismissed(true)} className="text-[10px] text-white/15 hover:text-white/30 transition px-1">
              later
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
