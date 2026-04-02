"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import type { HimalayaResultsViewModel } from "@/lib/himalaya/types";

export default function ResultsTraceDetails({ vm }: { vm: HimalayaResultsViewModel }) {
  const [expanded, setExpanded] = useState(false);

  if (!vm.trace) return null;

  return (
    <div className="bg-white/[0.015] border border-white/[0.05] rounded-2xl">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition rounded-2xl"
      >
        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
          Run Details
        </span>
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-white/20" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-white/20" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {[
            { label: "Run ID", value: vm.trace.runId },
            { label: "Mode", value: vm.trace.mode },
            { label: "Link Type", value: vm.trace.linkType },
            { label: "Confidence", value: vm.trace.confidence },
            { label: "Assets Generated", value: String(vm.trace.assetsGenerated) },
            { label: "Created", value: format(new Date(vm.trace.createdAt), "MMM d, yyyy 'at' h:mm a") },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between text-xs">
              <span className="text-white/20">{label}</span>
              <span className="text-white/40 font-mono text-[11px]">{value}</span>
            </div>
          ))}

          {/* Dimension scores */}
          {vm.dimensions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/[0.05]">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/15 mb-2">Dimension Scores</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {vm.dimensions.map((d) => (
                  <div key={d.key} className="flex items-center justify-between text-[11px]">
                    <span className="text-white/20">{d.label}</span>
                    <span className={`font-mono font-bold ${
                      d.isRisk
                        ? (d.value <= 30 ? "text-emerald-400/60" : d.value <= 60 ? "text-amber-400/60" : "text-red-400/60")
                        : (d.value >= 70 ? "text-emerald-400/60" : d.value >= 45 ? "text-amber-400/60" : "text-red-400/60")
                    }`}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes count */}
          {vm.notes.length > 0 && (
            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-white/[0.05]">
              <span className="text-white/20">Notes</span>
              <span className="text-amber-400/40 font-mono text-[11px]">{vm.notes.length}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
