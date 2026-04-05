"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, AlertCircle, AlertTriangle, RefreshCw } from "lucide-react";

export type UiRunStage = "diagnosis" | "strategy" | "generation" | "save";
export type UiStageState = "waiting" | "active" | "complete" | "partial" | "fallback" | "failed";

const STAGE_META: Record<UiRunStage, { label: string; description: string }> = {
  diagnosis: {
    label: "Diagnosis",
    description: "Analyzing your business inputs and identifying the strongest path forward.",
  },
  strategy: {
    label: "Strategy",
    description: "Determining what matters most and what should be built first.",
  },
  generation: {
    label: "Generation",
    description: "Creating structured assets based on your diagnosis and strategy.",
  },
  save: {
    label: "Save",
    description: "Saving your run, outputs, and generated assets.",
  },
};

const STAGE_ORDER: UiRunStage[] = ["diagnosis", "strategy", "generation", "save"];

function StageIcon({ state }: { state: UiStageState }) {
  switch (state) {
    case "active":
      return <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />;
    case "complete":
      return (
        <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      );
    case "partial":
      return (
        <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      );
    case "fallback":
      return (
        <div className="w-5 h-5 rounded-full bg-amber-500/80 flex items-center justify-center">
          <AlertTriangle className="w-3 h-3 text-white" />
        </div>
      );
    case "failed":
      return (
        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
          <AlertCircle className="w-3 h-3 text-white" />
        </div>
      );
    default:
      return <div className="w-5 h-5 rounded-full border-2 border-white/10" />;
  }
}

function stageStatusLabel(state: UiStageState): string | null {
  switch (state) {
    case "partial": return "Completed with gaps";
    case "fallback": return "Used fallback";
    case "failed": return "Failed";
    default: return null;
  }
}

function sanitizeError(raw: string): string {
  if (/ANTHROPIC_API_KEY|API key|api_key/i.test(raw)) return "AI service is temporarily unavailable. Please try again.";
  if (/ECONNREFUSED|ETIMEDOUT|fetch failed|network/i.test(raw)) return "Could not connect to the server. Check your connection and try again.";
  if (/prisma|database|constraint/i.test(raw)) return "There was a problem saving your results. Please try again.";
  if (/JSON|parse|unexpected token/i.test(raw)) return "We received an unexpected response. Please try again.";
  if (raw.length > 120) return "Something went wrong. Please try again.";
  return raw;
}

interface ProgressStageProps {
  stages: Record<UiRunStage, UiStageState>;
  currentStage: UiRunStage | null;
  error: string | null;
  onRetry: () => void;
  onCancel?: () => void;
}

export function ProgressStage({ stages, currentStage, error, onRetry, onCancel }: ProgressStageProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (error) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [error]);

  const timeLabel = elapsed < 60
    ? `${elapsed}s`
    : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white">Building your results</h1>
        <p className="text-white/40 text-sm">
          {error ? "Something went wrong." : `Working on it... ${timeLabel}`}
        </p>
      </div>

      <div className="space-y-1">
        {STAGE_ORDER.map((stage, i) => {
          const state = stages[stage];
          const meta = STAGE_META[stage];
          const isActive = stage === currentStage;
          const statusLabel = stageStatusLabel(state);

          return (
            <div key={stage}>
              <div className={`flex items-start gap-4 rounded-xl px-4 py-3 transition-all ${
                isActive ? "bg-white/[0.03]" : ""
              }`}>
                <div className="mt-0.5">
                  <StageIcon state={state} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${
                      state === "waiting" ? "text-white/30" :
                      state === "failed" ? "text-red-400" :
                      "text-white"
                    }`}>
                      {meta.label}
                    </p>
                    {statusLabel && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        state === "partial" ? "bg-amber-500/10 text-amber-400" :
                        state === "fallback" ? "bg-amber-500/10 text-amber-400" :
                        "bg-red-500/10 text-red-400"
                      }`}>
                        {statusLabel}
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <p className="text-white/40 text-xs mt-1">{meta.description}</p>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {i < STAGE_ORDER.length - 1 && (
                <div className="ml-6 h-2 border-l border-white/[0.06]" />
              )}
            </div>
          );
        })}
      </div>

      {/* Error + retry */}
      {error && (
        <div className="space-y-4">
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
            <p className="text-red-400 text-sm">{sanitizeError(error)}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onRetry}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-medium text-white/60 hover:text-white hover:border-white/20 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-medium text-white/30 hover:text-white/60 hover:border-white/20 transition-all"
              >
                Go Back
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cancel link (while running, no error) */}
      {!error && onCancel && (
        <div className="text-center pt-2">
          <button
            onClick={onCancel}
            className="text-white/20 hover:text-white/40 text-xs transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
