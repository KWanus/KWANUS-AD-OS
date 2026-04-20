"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { UiRunStage, UiStageState } from "@/components/himalaya/ProgressStage";

const INITIAL_STAGES: Record<UiRunStage, UiStageState> = {
  diagnosis: "waiting",
  strategy: "waiting",
  research: "waiting",
  generation: "waiting",
  save: "waiting",
};

function stateForStatus(status: string | undefined): UiStageState {
  if (status === "fallback") return "fallback";
  if (status === "partial") return "partial";
  return "complete";
}

interface UseHimalayaRunOptions {
  mode: "scratch" | "improve";
  buildDiagnoseBody: () => Record<string, unknown>;
  buildSaveInput: () => Record<string, unknown>;
}

export function useHimalayaRun({ mode, buildDiagnoseBody, buildSaveInput }: UseHimalayaRunOptions) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState<UiRunStage | null>(null);
  const [stages, setStages] = useState(INITIAL_STAGES);
  const [error, setError] = useState<string | null>(null);

  function updateStage(stage: UiRunStage, state: UiStageState) {
    setStages((prev) => ({ ...prev, [stage]: state }));
  }

  const run = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setError(null);
    setStages(INITIAL_STAGES);

    let activeStage: UiRunStage | null = null;

    try {
      // Diagnosis
      activeStage = "diagnosis";
      setCurrentStage("diagnosis");
      updateStage("diagnosis", "active");
      const diagRes = await fetch("/api/himalaya/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildDiagnoseBody()),
      });
      const diagData = await diagRes.json();
      if (!diagData.ok) throw new Error(diagData.error || "Diagnosis failed");
      updateStage("diagnosis", stateForStatus(diagData.diagnosis?.status));

      // Strategy
      activeStage = "strategy";
      setCurrentStage("strategy");
      updateStage("strategy", "active");
      const stratRes = await fetch("/api/himalaya/strategize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, diagnosis: diagData.diagnosis }),
      });
      const stratData = await stratRes.json();
      if (!stratData.ok) throw new Error(stratData.error || "Strategy failed");
      updateStage("strategy", stateForStatus(stratData.strategy?.status));

      // Research (competitor intelligence — only for scratch mode with site generation)
      let researchData: { intelligence?: unknown } = {};
      const shouldResearch = mode === "scratch" && stratData.strategy?.generateQueue?.includes("site");
      if (shouldResearch) {
        activeStage = "research";
        setCurrentStage("research");
        updateStage("research", "active");
        try {
          const researchRes = await fetch("/api/sites/research", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ niche: diagData.diagnosis?.niche }),
          });
          researchData = await researchRes.json();
          updateStage("research", researchData.intelligence ? "complete" : "fallback");
        } catch {
          updateStage("research", "fallback");
        }
      } else {
        updateStage("research", "skipped");
      }

      // Generation
      activeStage = "generation";
      setCurrentStage("generation");
      updateStage("generation", "active");
      const genRes = await fetch("/api/himalaya/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, diagnosis: diagData.diagnosis, strategy: stratData.strategy, nicheIntelligence: researchData.intelligence ?? null }),
      });
      const genData = await genRes.json();
      if (!genData.ok) throw new Error(genData.error || "Generation failed");
      updateStage("generation", stateForStatus(genData.generated?.status));

      // Save
      activeStage = "save";
      setCurrentStage("save");
      updateStage("save", "active");
      const saveRes = await fetch("/api/himalaya/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          mode,
          input: buildSaveInput(),
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
      if (activeStage) updateStage(activeStage, "failed");
      setRunning(false);
    }
  }, [running, mode, buildDiagnoseBody, buildSaveInput, router]);

  const cancel = useCallback(() => setRunning(false), []);

  return { running, currentStage, stages, error, run, cancel };
}
