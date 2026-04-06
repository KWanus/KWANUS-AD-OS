"use client";

import { Zap } from "lucide-react";
import type { HimalayaResultsViewModel } from "@/lib/himalaya/types";

export default function ResultsPriorities({ vm }: { vm: HimalayaResultsViewModel }) {
  if (vm.priorities.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.04] via-white/[0.025] to-transparent p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-white/30">
          Top Priorities
        </h2>
        <span className="w-fit rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-black text-white/35">
          {vm.priorities.length} items
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {vm.priorities.map((p, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/[0.06] bg-black/25 p-4 transition hover:border-white/[0.1]"
          >
            <div className="mb-2 flex items-start gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black text-cyan-400">
                {i + 1}
              </span>
              <h3 className="min-w-0 flex-1 text-xs font-bold leading-5 text-white/70 sm:truncate">{p.label}</h3>
            </div>
            <p className="text-[11px] text-white/40 leading-relaxed mb-2">{p.reason}</p>
            <div className="flex items-start gap-1.5 mt-auto">
              <Zap className="w-3 h-3 text-cyan-400/50 shrink-0 mt-0.5" />
              <p className="text-[11px] text-cyan-400/60 leading-relaxed">{p.nextStep}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
