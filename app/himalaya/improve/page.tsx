"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Globe, MessageSquare } from "lucide-react";
import { ProgressStage } from "@/components/himalaya/ProgressStage";
import type { UiRunStage, UiStageState } from "@/components/himalaya/ProgressStage";

const GOALS = [
  { key: "improve_conversion", label: "Improve conversion" },
  { key: "improve_trust", label: "Improve trust" },
  { key: "improve_messaging", label: "Improve messaging" },
  { key: "improve_lead_flow", label: "Improve lead flow" },
  { key: "improve_followup", label: "Improve follow-up" },
  { key: "improve_offer", label: "Improve offer clarity" },
  { key: "rebuild_pages", label: "Rebuild weak pages" },
] as const;

const INITIAL_STAGES: Record<UiRunStage, UiStageState> = {
  diagnosis: "waiting",
  strategy: "waiting",
  generation: "waiting",
  save: "waiting",
};

export default function HimalayaImprovePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [problem, setProblem] = useState("");
  const [goal, setGoal] = useState("");

  const [running, setRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState<UiRunStage | null>(null);
  const [stages, setStages] = useState(INITIAL_STAGES);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = (url.trim() || description.trim()) && !submitting;

  function updateStage(stage: UiRunStage, state: UiStageState) {
    setStages((prev) => ({ ...prev, [stage]: state }));
  }

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
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
        body: JSON.stringify({
          mode: "improve",
          url: url.trim() || undefined,
          businessDescription: description.trim() || undefined,
          challenge: problem.trim() || undefined,
          goal: goal || undefined,
        }),
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
        body: JSON.stringify({ mode: "improve", diagnosis: diagData.diagnosis }),
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
        body: JSON.stringify({ mode: "improve", diagnosis: diagData.diagnosis, strategy: stratData.strategy }),
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
          mode: "improve",
          input: { mode: "improve", url: url.trim() || undefined, businessDescription: description.trim() || undefined, challenge: problem.trim() || undefined, goal: goal || undefined },
          diagnosis: diagData.diagnosis,
          strategy: stratData.strategy,
          generated: genData.generated,
          created: genData.created || { siteId: null, emailFlowId: null },
        }),
      });
      const saveData = await saveRes.json();
      if (!saveData.ok) throw new Error(saveData.error || "Save failed");
      updateStage("save", "complete");

      router.push(`/himalaya/run/${saveData.runId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      if (currentStage) updateStage(currentStage, "failed");
      setRunning(false);
      setSubmitting(false);
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
            onCancel={() => { setRunning(false); setSubmitting(false); }}
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
              Analyze your business
            </h1>
            <p className="text-white/40 text-sm">
              Share a URL, a description, or both. More info means better results.
            </p>
          </div>

          {/* URL */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-white/60 text-sm font-medium">
              <Globe className="w-4 h-4" /> Website URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourbusiness.com"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-white/60 text-sm font-medium">
              <MessageSquare className="w-4 h-4" /> Describe your business
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What do you do? Who do you serve? What do you sell?"
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 resize-none"
            />
          </div>

          {/* Problem */}
          <div className="space-y-2">
            <label className="text-white/60 text-sm font-medium">
              Biggest problem right now <span className="text-white/30">(optional)</span>
            </label>
            <input
              type="text"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="e.g. Not enough leads, low conversion, weak messaging"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          {/* Goal */}
          <div className="space-y-3">
            <label className="text-white/60 text-sm font-medium">
              What do you want to improve? <span className="text-white/30">(optional)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map((g) => (
                <button
                  key={g.key}
                  onClick={() => setGoal(goal === g.key ? "" : g.key)}
                  className={`text-left rounded-xl border px-3 py-2.5 text-sm transition-all ${
                    goal === g.key
                      ? "border-purple-500/60 bg-purple-500/10 text-white"
                      : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Validation hint */}
          {!canSubmit && (
            <p className="text-white/30 text-xs text-center">
              Enter a website URL or business description to continue.
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-500 px-4 py-3.5 text-sm font-medium text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-purple-400 transition-colors"
          >
            Analyze My Business <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
