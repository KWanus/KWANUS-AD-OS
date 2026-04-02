"use client";

import { Zap } from "lucide-react";
import type { HimalayaResultsViewModel } from "@/lib/himalaya/types";

export default function ResultsPriorities({ vm }: { vm: HimalayaResultsViewModel }) {
  if (vm.priorities.length === 0) return null;

  return (
    <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
      <h2 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4">
        Top Priorities
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {vm.priorities.map((p, i) => (
          <div
            key={i}
            className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.05] hover:border-white/[0.1] transition"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black text-cyan-400">
                {i + 1}
              </span>
              <h3 className="text-xs font-bold text-white/70 flex-1 min-w-0 truncate">{p.label}</h3>
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
