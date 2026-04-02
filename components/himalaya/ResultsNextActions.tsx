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
    <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
      <h2 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">
        Next Steps
      </h2>
      <p className="text-xs text-white/30 mb-4">{helperText}</p>

      <div className="flex flex-wrap gap-3">
        {rerunAction && (
          <Link
            href={rerunAction.href}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/30 transition text-xs font-bold text-cyan-400"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Run Again
          </Link>
        )}
        {otherActions.map((action, i) => (
          <Link
            key={i}
            href={action.href}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] transition text-xs font-semibold text-white/50 hover:text-white/80"
          >
            {action.label}
            <ArrowRight className="w-3 h-3" />
          </Link>
        ))}
      </div>
      {rerunAction && (
        <p className="text-[10px] text-white/20 mt-2">Start a new run using this one as your base.</p>
      )}
    </div>
  );
}
