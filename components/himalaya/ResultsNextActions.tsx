"use client";

import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import type { HimalayaResultsViewModel } from "@/lib/himalaya/types";

export default function ResultsNextActions({ vm }: { vm: HimalayaResultsViewModel }) {
  if (vm.nextActions.length === 0) return null;

  const helperText =
    vm.mode === "consultant"
      ? "Start with the highest-priority fixes first, then apply the rebuilt assets."
      : "Use these assets as your starting foundation, then refine what matters most first.";

  const rerunAction = vm.nextActions.find((a) => a.label === "Run Again");
  const otherActions = vm.nextActions.filter((a) => a.label !== "Run Again");

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.03] via-white/[0.02] to-transparent p-4 sm:p-5">
      <h2 className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/30">
        Next Steps
      </h2>
      <p className="mb-4 max-w-2xl text-xs leading-6 text-white/30">{helperText}</p>

      <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-3">
        {rerunAction && (
          <Link
            href={rerunAction.href}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-5 py-2.5 text-xs font-bold text-cyan-400 transition hover:border-cyan-500/30 hover:bg-cyan-500/20"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Run Again
          </Link>
        )}
        {otherActions.map((action, i) => (
          <Link
            key={i}
            href={action.href}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-white/50 transition hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white/80"
          >
            {action.label}
            <ArrowRight className="w-3 h-3" />
          </Link>
        ))}
      </div>
      {rerunAction && (
        <p className="mt-2 text-[10px] text-white/20">Start a new run using this one as your base.</p>
      )}
    </div>
  );
}
