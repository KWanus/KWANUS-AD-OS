"use client";

import { Lightbulb } from "lucide-react";
import type { HimalayaResultsViewModel } from "@/lib/himalaya/types";

function buildReasons(vm: HimalayaResultsViewModel): string[] {
  const reasons: string[] = [];
  const packet = vm.decisionPacket;

  if (vm.mode === "consultant") {
    // Improve mode
    if (packet?.weaknesses && packet.weaknesses.length > 0) {
      reasons.push(`"${packet.weaknesses[0]}" is the biggest gap — fixing this unlocks the most value.`);
    }
    if (vm.priorities.length > 0) {
      reasons.push(`${vm.priorities[0].label} comes first because it has the highest impact on conversion.`);
    }
    if (packet?.strengths && packet.strengths.length > 0) {
      reasons.push(`The existing strength in "${packet.strengths[0].toLowerCase()}" means the foundation is workable.`);
    }
    if (vm.assetGroups.length > 0) {
      reasons.push(`${vm.assetGroups.length} asset groups were generated to address the specific gaps found.`);
    }
  } else {
    // Scratch mode
    if (packet?.audience) {
      reasons.push(`This audience direction fits because the signals show clear demand and pain.`);
    }
    if (packet?.angle) {
      reasons.push(`The offer angle "${packet.angle}" was chosen because it aligns with the strongest market signals.`);
    }
    if (vm.priorities.length > 0) {
      reasons.push(`"${vm.priorities[0].label}" is the first priority because it creates the fastest path to traction.`);
    }
    if (vm.score >= 60) {
      reasons.push(`Score of ${vm.score}/100 indicates a viable foundation — the data supports this direction.`);
    } else if (vm.score >= 40) {
      reasons.push(`Score of ${vm.score}/100 shows potential but highlights areas that need focused attention.`);
    }
  }

  // Add dimension-based reasoning if available
  const lowDims = vm.dimensions.filter((d) => !d.isRisk && d.value < 40);
  if (lowDims.length > 0) {
    const dimName = lowDims[0].label.toLowerCase();
    reasons.push(`${lowDims[0].label} scored ${lowDims[0].value}/100 — the generated assets prioritize improving ${dimName}.`);
  }

  return reasons.slice(0, 4);
}

export default function StrategyReasoning({ vm }: { vm: HimalayaResultsViewModel }) {
  // Prefer saved orchestration reasoning over computed
  const reasons = vm.strategyReasoning && vm.strategyReasoning.length > 0
    ? vm.strategyReasoning
    : buildReasons(vm);
  if (reasons.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.03] via-white/[0.02] to-transparent p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb className="w-3.5 h-3.5 text-amber-400/50" />
        <h2 className="text-[10px] font-black uppercase tracking-widest text-white/30">
          Why This Direction
        </h2>
      </div>
      <ul className="space-y-2.5">
        {reasons.map((reason, i) => (
          <li key={i} className="flex items-start gap-2.5 rounded-xl border border-white/[0.05] bg-black/20 px-3 py-3">
            <span className="text-[10px] font-black text-amber-400/40 shrink-0 mt-0.5">{i + 1}.</span>
            <p className="text-xs text-white/50 leading-relaxed">{reason}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
