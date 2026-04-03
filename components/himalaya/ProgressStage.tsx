"use client";

import { CheckCircle, Loader2, AlertTriangle, XCircle, Circle } from "lucide-react";

export type UiRunStage = "diagnosis" | "strategy" | "generation" | "save";
export type UiStageState = "waiting" | "active" | "complete" | "partial" | "fallback" | "failed";

const STAGE_LABELS: Record<UiRunStage, { title: string; description: string }> = {
  diagnosis: {
    title: "Researching Your Market",
    description: "Finding competitors, scanning their sites, analyzing the competitive landscape.",
  },
  strategy: {
    title: "Building Your Strategy",
    description: "Analyzing competitor weaknesses and positioning you to win.",
  },
  generation: {
    title: "Creating Your Assets",
    description: "Generating business profile, website, marketing, and email assets tailored to beat your competition.",
  },
  save: {
    title: "Save",
    description: "Saving your run, outputs, and generated assets.",
  },
};

const STAGE_ORDER: UiRunStage[] = ["diagnosis", "strategy", "generation", "save"];

function StageIcon({ state }: { state: UiStageState }) {
  switch (state) {
    case "complete":
      return <CheckCircle className="w-5 h-5 text-emerald-400" />;
    case "active":
      return <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />;
    case "partial":
    case "fallback":
      return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    case "failed":
      return <XCircle className="w-5 h-5 text-red-400" />;
    default:
      return <Circle className="w-5 h-5 text-white/10" />;
  }
}

export default function ProgressStage({
  stages,
  error,
}: {
  stages: Record<UiRunStage, UiStageState>;
  error: string | null;
}) {
  return (
    <div className="max-w-md mx-auto py-12">
      <p className="text-[10px] text-white/20 text-center mb-4">Usually takes 30-90 seconds depending on niche research</p>
      <div className="space-y-3">
        {STAGE_ORDER.map((key) => {
          const state = stages[key];
          const label = STAGE_LABELS[key];
          const isActive = state === "active";
          const isDone = state === "complete" || state === "partial" || state === "fallback";

          return (
            <div
              key={key}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-500 ${
                isDone
                  ? "bg-emerald-500/[0.03] border-emerald-500/10"
                  : isActive
                    ? "bg-cyan-500/[0.04] border-cyan-500/15"
                    : state === "failed"
                      ? "bg-red-500/[0.04] border-red-500/15"
                      : "bg-white/[0.01] border-white/[0.04]"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                <StageIcon state={state} />
              </div>
              <div>
                <h3 className={`text-sm font-bold transition ${
                  isDone ? "text-white/40" : isActive ? "text-white/70" : state === "failed" ? "text-red-300" : "text-white/20"
                }`}>
                  {label.title}
                  {state === "partial" && <span className="text-amber-400/60 text-[10px] ml-2 font-normal">partial</span>}
                  {state === "fallback" && <span className="text-amber-400/60 text-[10px] ml-2 font-normal">fallback used</span>}
                </h3>
                {(isActive || state === "failed") && (
                  <p className={`text-xs mt-0.5 leading-relaxed ${state === "failed" ? "text-red-400/60" : "text-white/30"}`}>
                    {label.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-6 bg-red-500/5 border border-red-500/15 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-300">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-red-400/60 hover:text-red-400 transition mt-2"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
