"use client";

import Link from "next/link";
import { Circle, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import type { ExecutionStep } from "@/lib/himalaya/buildExecutionSteps";

type Props = {
  step: ExecutionStep;
  index: number;
  onToggle: (stepId: string) => void;
};

export default function ExecutionStepCard({ step, index, onToggle }: Props) {
  const isDone = step.status === "done";
  const isActive = step.status === "in_progress";

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl border transition ${
        isDone
          ? "bg-emerald-500/[0.03] border-emerald-500/10"
          : isActive
            ? "bg-cyan-500/[0.03] border-cyan-500/15"
            : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.1]"
      }`}
    >
      {/* Toggle */}
      <button
        onClick={() => onToggle(step.id)}
        className="shrink-0 mt-0.5 transition"
      >
        {isDone ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        ) : isActive ? (
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
        ) : (
          <Circle className="w-5 h-5 text-white/15 hover:text-white/40 transition" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-black ${isDone ? "text-emerald-400/50" : "text-white/20"}`}>
            {index + 1}
          </span>
          <h3 className={`text-sm font-bold transition ${
            isDone ? "text-white/30 line-through" : "text-white/70"
          }`}>
            {step.title}
          </h3>
        </div>
        <p className={`text-xs leading-relaxed transition ${
          isDone ? "text-white/15" : "text-white/40"
        }`}>
          {step.instruction}
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          {step.assetRef && !isDone && (
            <p className="text-[10px] text-cyan-400/40">
              Uses: {step.assetRef}
            </p>
          )}
          {step.actionUrl && !isDone && (
            <Link
              href={step.actionUrl}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-400/50 hover:text-cyan-400/80 transition"
            >
              <ExternalLink className="w-2.5 h-2.5" />
              {step.actionLabel || "Open Tool"}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
