"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import type { HimalayaResultsViewModel } from "@/lib/himalaya/types";

export default function ResultsTraceDetails({ vm }: { vm: HimalayaResultsViewModel }) {
  const [expanded, setExpanded] = useState(false);

  if (!vm.trace) return null;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.025] via-white/[0.015] to-transparent">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between rounded-2xl p-4 text-left transition hover:bg-white/[0.02]"
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
        <div className="space-y-3 px-4 pb-4">
          {[
            { label: "Run ID", value: vm.trace.runId },
            { label: "Mode", value: vm.trace.mode },
            { label: "Link Type", value: vm.trace.linkType },
            { label: "Confidence", value: vm.trace.confidence },
            { label: "Assets Generated", value: String(vm.trace.assetsGenerated) },
            { label: "Created", value: format(new Date(vm.trace.createdAt), "MMM d, yyyy 'at' h:mm a") },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-1 rounded-xl border border-white/[0.05] bg-black/20 px-3 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
              <span className="text-white/20">{label}</span>
              <span className="break-all font-mono text-[11px] text-white/40 sm:text-right">{value}</span>
            </div>
          ))}

          {/* Dimension scores */}
          {vm.dimensions.length > 0 && (
            <div className="mt-3 border-t border-white/[0.05] pt-3">
              <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-white/15">Dimension Scores</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-1">
                {vm.dimensions.map((d) => (
                  <div key={d.key} className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-black/20 px-2.5 py-2 text-[11px]">
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
            <div className="mt-2 flex items-center justify-between border-t border-white/[0.05] pt-2 text-xs">
              <span className="text-white/20">Notes</span>
              <span className="text-amber-400/40 font-mono text-[11px]">{vm.notes.length}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
