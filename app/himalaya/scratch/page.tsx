"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ProgressStage } from "@/components/himalaya/ProgressStage";
import type { UiRunStage, UiStageState } from "@/components/himalaya/ProgressStage";

const BUSINESS_TYPES = [
  { key: "service_business", label: "Service Business" },
  { key: "ecommerce", label: "E-commerce Brand" },
  { key: "agency", label: "Agency" },
  { key: "coaching_consulting", label: "Coaching / Consulting" },
  { key: "personal_brand", label: "Personal Brand" },
  { key: "digital_product", label: "Digital Product" },
  { key: "saas", label: "SaaS" },
  { key: "other", label: "Other" },
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

const INITIAL_STAGES: Record<UiRunStage, UiStageState> = {
  diagnosis: "waiting",
  strategy: "waiting",
  generation: "waiting",
  save: "waiting",
};

export default function HimalayaScratchPage() {
  const router = useRouter();
  const [businessType, setBusinessType] = useState("");
  const [niche, setNiche] = useState("");
  const [goal, setGoal] = useState("");
  const [dream, setDream] = useState("");

  const [running, setRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState<UiRunStage | null>(null);
  const [stages, setStages] = useState(INITIAL_STAGES);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = businessType && niche.trim() && goal;

  function updateStage(stage: UiRunStage, state: UiStageState) {
    setStages((prev) => ({ ...prev, [stage]: state }));
  }

  async function handleSubmit() {
    setRunning(true);
    setError(null);
    setStages(INITIAL_STAGES);

    try {
      // Diagnosis
      setCurrentStage("diagnosis");
      updateStage("diagnosis", "active");
      const diagRes = await fetch("/api/himalaya/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "scratch", businessType, niche, goal, description: dream || undefined }),
      });
      const diagData = await diagRes.json();
      if (!diagData.ok) throw new Error(diagData.error || "Diagnosis failed");
      updateStage("diagnosis", diagData.diagnosis?.status === "partial" ? "partial" : "complete");

      // Strategy
      setCurrentStage("strategy");
      updateStage("strategy", "active");
      const stratRes = await fetch("/api/himalaya/strategize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "scratch", diagnosis: diagData.diagnosis }),
      });
      const stratData = await stratRes.json();
      if (!stratData.ok) throw new Error(stratData.error || "Strategy failed");
      const stratStatus = stratData.strategy?.status || "success";
      updateStage("strategy", stratStatus === "fallback" ? "fallback" : stratStatus === "partial" ? "partial" : "complete");

      // Generation
      setCurrentStage("generation");
      updateStage("generation", "active");
      const genRes = await fetch("/api/himalaya/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "scratch", diagnosis: diagData.diagnosis, strategy: stratData.strategy }),
      });
      const genData = await genRes.json();
      if (!genData.ok) throw new Error(genData.error || "Generation failed");
      const genStatus = genData.generated?.status || "success";
      updateStage("generation", genStatus === "partial" ? "partial" : "complete");

      // Save
      setCurrentStage("save");
      updateStage("save", "active");
      const saveRes = await fetch("/api/himalaya/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          mode: "scratch",
          input: { mode: "scratch", businessType, niche, goal, description: dream || undefined },
          diagnosis: diagData.diagnosis,
          strategy: stratData.strategy,
          generated: genData.generated,
          created: genData.created || { siteId: null, emailFlowId: null },
        }),
      });
      const saveData = await saveRes.json();
      if (!saveData.ok) throw new Error(saveData.error || "Save failed");
      updateStage("save", "complete");

      // Redirect to results
      router.push(`/himalaya/run/${saveData.runId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      if (currentStage) updateStage(currentStage, "failed");
      setRunning(false);
    }
  }

  // ── Progress UI ───────────────────────────────────────────────────────────
  if (running) {
    return (
      <div className="min-h-screen bg-[#050a14] flex items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <ProgressStage
            stages={stages}
            currentStage={currentStage}
            error={error}
            onRetry={() => handleSubmit()}
          />
        </div>
      </div>
    );
  }

  // ── Form UI ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050a14] flex items-center justify-center px-4 py-12">
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

          <button
            onClick={handleSubmit}
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
