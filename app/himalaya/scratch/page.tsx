"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ProgressStage } from "@/components/himalaya/ProgressStage";
import { useHimalayaRun } from "@/lib/himalaya/useHimalayaRun";

const BUSINESS_TYPES = [
  { key: "local_service", label: "Service Business" },
  { key: "ecommerce", label: "E-commerce Brand" },
  { key: "agency", label: "Agency" },
  { key: "consultant_coach", label: "Coaching / Consulting" },
  { key: "content_creator", label: "Personal Brand / Creator" },
  { key: "saas", label: "SaaS" },
  { key: "affiliate", label: "Affiliate / Dropship" },
  { key: "financial", label: "Financial / Real Estate" },
] as const;

const GOALS = [
  { key: "first_client", label: "Get first client" },
  { key: "more_leads", label: "Get more leads" },
  { key: "stronger_offer", label: "Build a stronger offer" },
  { key: "launch_faster", label: "Launch faster" },
  { key: "improve_conversions", label: "Improve conversions" },
  { key: "create_structure", label: "Create structure" },
  { key: "scale_operations", label: "Scale operations" },
] as const;

export default function HimalayaScratchPage() {
  const router = useRouter();
  const [businessType, setBusinessType] = useState("");
  const [niche, setNiche] = useState("");
  const [goal, setGoal] = useState("");
  const [dream, setDream] = useState("");

  const buildDiagnoseBody = useCallback(() => ({
    mode: "scratch" as const,
    businessType,
    niche,
    goal,
    description: dream || undefined,
  }), [businessType, niche, goal, dream]);

  const buildSaveInput = useCallback(() => ({
    mode: "scratch" as const,
    businessType,
    niche,
    goal,
    description: dream || undefined,
  }), [businessType, niche, goal, dream]);

  const { running, currentStage, stages, error, run, cancel } = useHimalayaRun({
    mode: "scratch",
    buildDiagnoseBody,
    buildSaveInput,
  });

  const canSubmit = businessType && niche.trim() && goal && !running;

  // ── Progress UI ───────────────────────────────────────────────────────────
  if (running) {
    return (
      <div className="min-h-screen bg-[#020509] flex items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <ProgressStage
            stages={stages}
            currentStage={currentStage}
            error={error}
            onRetry={run}
            onCancel={cancel}
          />
        </div>
      </div>
    );
  }

  // ── Form UI ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#020509] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <button
          onClick={() => router.push("/himalaya")}
          className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Build your business foundation
            </h1>
            <p className="text-white/40 text-sm">
              Tell us what you're building. We'll handle the rest.
            </p>
          </div>

          {/* Business Type */}
          <div className="space-y-3">
            <label className="text-white/60 text-sm font-medium">What type of business?</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BUSINESS_TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setBusinessType(t.key)}
                  className={`text-left rounded-xl border px-3 py-2.5 text-sm transition-all ${
                    businessType === t.key
                      ? "border-cyan-500/60 bg-cyan-500/10 text-white"
                      : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Niche */}
          <div className="space-y-2">
            <label className="text-white/60 text-sm font-medium">What's your niche?</label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g. Weight loss for women over 40"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Goal */}
          <div className="space-y-3">
            <label className="text-white/60 text-sm font-medium">What's your main goal?</label>
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map((g) => (
                <button
                  key={g.key}
                  onClick={() => setGoal(g.key)}
                  className={`text-left rounded-xl border px-3 py-2.5 text-sm transition-all ${
                    goal === g.key
                      ? "border-cyan-500/60 bg-cyan-500/10 text-white"
                      : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dream / extra context */}
          <div className="space-y-2">
            <label className="text-white/60 text-sm font-medium">
              Dream outcome <span className="text-white/30">(optional)</span>
            </label>
            <textarea
              value={dream}
              onChange={(e) => setDream(e.target.value)}
              placeholder="Describe your ideal business in a few sentences..."
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 resize-none"
            />
          </div>

          {/* Validation hint */}
          {(!businessType || !niche.trim() || !goal) && (
            <p className="text-white/30 text-xs text-center">
              {!businessType ? "Select a business type to continue." :
               !niche.trim() ? "Enter your niche to continue." :
               "Select a goal to continue."}
            </p>
          )}

          <button
            onClick={run}
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3.5 text-sm font-medium text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-cyan-400 transition-colors"
          >
            Build My Foundation <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
