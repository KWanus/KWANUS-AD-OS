"use client";

import { Shield, CheckCircle, AlertTriangle } from "lucide-react";
import type { HimalayaResultsViewModel } from "@/lib/himalaya/types";

function getConfidenceConfig(vm: HimalayaResultsViewModel) {
  const score = vm.score;
  const confidence = vm.confidence;

  if (confidence === "High" && score >= 65) {
    return {
      icon: CheckCircle,
      label: "High Confidence",
      detail: "Full analysis completed with strong signals",
      color: "text-emerald-400/60",
      bg: "bg-emerald-500/5 border-emerald-500/10",
    };
  }

  if (confidence === "Medium" || (score >= 40 && score < 65)) {
    return {
      icon: Shield,
      label: "Moderate Confidence",
      detail: "Analysis completed — some signals were limited",
      color: "text-amber-400/60",
      bg: "bg-amber-500/5 border-amber-500/10",
    };
  }

  return {
    icon: AlertTriangle,
    label: "Limited Confidence",
    detail: "Analysis completed with limited signals — review recommendations carefully",
    color: "text-orange-400/60",
    bg: "bg-orange-500/5 border-orange-500/10",
  };
}

function getMetricInsight(vm: HimalayaResultsViewModel): string | null {
  const dims = vm.dimensions;
  if (dims.length === 0) return null;

  // Find the lowest non-risk dimension
  const actionable = dims
    .filter((d) => !d.isRisk && d.value < 50)
    .sort((a, b) => a.value - b.value);

  if (actionable.length > 0) {
    const worst = actionable[0];
    return `${worst.label} scored ${worst.value}/100, so the generated assets prioritize this area first.`;
  }

  // Find strongest
  const strongest = dims
    .filter((d) => !d.isRisk)
    .sort((a, b) => b.value - a.value);

  if (strongest.length > 0 && strongest[0].value >= 70) {
    return `${strongest[0].label} is the strongest dimension at ${strongest[0].value}/100 — a solid foundation to build on.`;
  }

  return null;
}

export default function ConfidenceBadge({ vm }: { vm: HimalayaResultsViewModel }) {
  const config = getConfidenceConfig(vm);
  const metric = getMetricInsight(vm);
  const Icon = config.icon;

  const hasNotes = vm.notes.length > 0;

  return (
    <div className={`rounded-xl border p-3 ${config.bg}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
        <span className={`text-[10px] font-black uppercase tracking-widest ${config.color}`}>
          {config.label}
        </span>
      </div>
      <p className="text-[11px] text-white/35 leading-relaxed">{config.detail}</p>
      {metric && (
        <p className="text-[11px] text-white/30 leading-relaxed mt-1">{metric}</p>
      )}
      {hasNotes && (
        <p className="text-[10px] text-white/20 mt-1">{vm.notes.length} note{vm.notes.length > 1 ? "s" : ""} attached</p>
      )}
      <p className="text-[9px] text-white/15 mt-2">Built from your inputs and structured analysis</p>
    </div>
  );
}
