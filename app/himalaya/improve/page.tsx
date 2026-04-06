"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mountain, RotateCcw } from "lucide-react";
import AppNav from "@/components/AppNav";
import HimalayaNav from "@/components/himalaya/HimalayaNav";
import { track } from "@/lib/himalaya/tracking";
import ProgressStage from "@/components/himalaya/ProgressStage";
import type { UiRunStage, UiStageState } from "@/components/himalaya/ProgressStage";

const GOALS = [
  "Improve conversion",
  "Improve trust",
  "Improve messaging",
  "Improve lead flow",
  "Improve follow-up",
  "Improve offer clarity",
  "Rebuild weak pages",
];

export default function HimalayaImprovePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromRun = searchParams.get("fromRun");
  const [loadedFromRun, setLoadedFromRun] = useState(false);
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [problem, setProblem] = useState("");
  const [goal, setGoal] = useState("");

  // Load prior run data if fromRun param exists
  useEffect(() => {
    if (!fromRun) return;
    fetch(`/api/analyses/${fromRun}`)
      .then((r) => r.json() as Promise<{ ok: boolean; analysis?: { inputUrl: string; summary: string | null; decisionPacket: Record<string, unknown> | null } }>)
      .then((data) => {
        if (!data.ok || !data.analysis) return;
        const a = data.analysis;
        if (a.inputUrl && !a.inputUrl.startsWith("himalaya://")) setUrl(a.inputUrl);
        if (a.summary) setDescription(a.summary);
        if (a.decisionPacket?.weaknesses) {
          const weaknesses = a.decisionPacket.weaknesses as string[];
          if (weaknesses.length > 0) setProblem(weaknesses[0]);
        }
        setLoadedFromRun(true);
      })
      .catch(() => {});
  }, [fromRun]);

  const [running, setRunning] = useState(false);
  const [stages, setStages] = useState<Record<UiRunStage, UiStageState>>({
    diagnosis: "waiting",
    strategy: "waiting",
    generation: "waiting",
    save: "waiting",
  });
  const [error, setError] = useState<string | null>(null);

  const hasInput = url.trim() || description.trim();
  const urlValid = !url.trim() || /^https?:\/\/.+\..+/.test(url.trim());

  async function handleSubmit() {
    if (!hasInput || !urlValid) return;
    setRunning(true);
    setError(null);
    track.runStart("improve");

    // Animate stages
    const stageOrder: UiRunStage[] = ["diagnosis", "strategy", "generation", "save"];
    let stageIdx = 0;
    const interval = setInterval(() => {
      if (stageIdx < stageOrder.length) {
        setStages((prev) => {
          const next = { ...prev };
          if (stageIdx > 0) next[stageOrder[stageIdx - 1]] = "complete";
          next[stageOrder[stageIdx]] = "active";
          return next;
        });
        stageIdx++;
      }
    }, 1200); // Improve takes longer (scan)

    try {
      // If URL provided, run improve through orchestrator
      if (url.trim()) {
        const runRes = await fetch("/api/himalaya/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "improve",
            url: url.trim(),
            niche: description.trim() || undefined,
          }),
        });
        const runData = (await runRes.json()) as { ok: boolean; runId?: string; error?: string; trace?: { stages?: { name: string; status: string }[] } };

        clearInterval(interval);

        if (runData.ok && runData.runId) {
          if (runData.trace?.stages) {
            const finalStages: Record<UiRunStage, UiStageState> = { diagnosis: "waiting", strategy: "waiting", generation: "waiting", save: "waiting" };
            for (const s of runData.trace.stages) {
              const key = s.name as UiRunStage;
              if (key in finalStages) finalStages[key] = s.status as UiStageState;
            }
            setStages(finalStages);
          } else {
            setStages({ diagnosis: "complete", strategy: "complete", generation: "complete", save: "complete" });
          }
          setTimeout(() => router.push(`/himalaya/run/${runData.runId}`), 1000);
        } else {
          throw new Error(runData.error ?? "Analysis failed");
        }
      } else {
        // Description only — create a profile and run scratch path with "improve" framing
        const decideRes = await fetch("/api/himalaya/decide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessStage: "has_revenue",
            primaryGoal: "fix_existing",
            budget: "moderate",
            timeAvailable: "parttime",
            skills: ["communication"],
            riskTolerance: "medium",
            description: [description, problem, goal].filter(Boolean).join(". "),
          }),
        });
        const decideData = (await decideRes.json()) as { ok: boolean; profileId?: string };

        if (!decideData.ok || !decideData.profileId) throw new Error("Failed to create profile");

        const runRes = await fetch("/api/himalaya/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "scratch", profileId: decideData.profileId, path: "improve_existing" }),
        });
        const runData = (await runRes.json()) as { ok: boolean; runId?: string; error?: string };

        clearInterval(interval);

        if (runData.ok && runData.runId) {
          setStages({ diagnosis: "complete", strategy: "complete", generation: "complete", save: "complete" });
          setTimeout(() => router.push(`/himalaya/run/${runData.runId}`), 1000);
        } else {
          throw new Error(runData.error ?? "Run failed");
        }
      }
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStages((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next) as UiRunStage[]) {
          if (next[key] === "active") next[key] = "failed";
        }
        return next;
      });
    }
  }

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <HimalayaNav />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {running ? (
          <>
            <div className="mb-4 rounded-3xl border border-amber-500/12 bg-gradient-to-br from-amber-500/[0.06] via-transparent to-orange-500/[0.05] px-5 py-8 text-center">
              <Mountain className="mx-auto mb-3 h-8 w-8 text-amber-400" />
              <h1 className="text-xl font-black text-white">Analyzing Your Business</h1>
              <p className="text-sm text-white/30 mt-1">Scanning, scoring, and building improvements</p>
            </div>
            <ProgressStage stages={stages} error={error} />
          </>
        ) : (
          <>
            <Link href="/himalaya" className="mb-6 inline-flex items-center gap-1.5 text-xs text-white/30 transition hover:text-white/60">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Link>

            <div className="mb-4 rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent p-5 sm:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/20">Improve</p>
              <h1 className="mt-1 text-xl font-black text-white">Improve Existing Business</h1>
              <p className="mt-1 text-sm text-white/35">
                Analyze your current business, find what is weak, and generate better-performing assets.
              </p>
            </div>
            {loadedFromRun && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-purple-500/10 bg-purple-500/5 px-3 py-2">
                <RotateCcw className="w-3 h-3 text-purple-400/50" />
                <p className="text-[10px] text-purple-300/60">Loaded from a previous run. Edit anything before re-analyzing.</p>
              </div>
            )}

            <div className="space-y-6 rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent p-4 sm:p-5">
              {/* URL */}
              <div>
                <label className="text-[10px] font-bold text-cyan-400/50 uppercase tracking-widest mb-2 block">Your website URL</label>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://yourbusiness.com"
                  autoFocus
                  className="w-full bg-white/[0.04] border border-cyan-500/15 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/30"
                />
                <p className="text-[10px] text-white/20 mt-1 pl-1">Paste your main page. The system scans it, finds weak points, and builds fixes.</p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[10px] text-white/15 font-bold">OR describe your business</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 block">Business description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does your business do? Who do you serve? What do you sell?"
                  rows={3}
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/30 resize-none"
                />
              </div>

              {/* Quick goal selector */}
              <div>
                <label className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2 block">What needs fixing?</label>
                <div className="flex flex-wrap gap-1.5">
                  {GOALS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGoal(goal === g ? "" : g)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition ${
                        goal === g
                          ? "bg-amber-500/10 border-amber-500/25 text-amber-300"
                          : "bg-white/[0.02] border-white/[0.06] text-white/30 hover:border-white/[0.12]"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional extras */}
              <details className="rounded-2xl border border-white/[0.05] bg-black/20 px-4 py-3">
                <summary className="text-[10px] font-bold text-white/20 cursor-pointer hover:text-white/40 transition">
                  Add more context (optional)
                </summary>
                <div className="mt-2">
                  <input
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    placeholder="e.g. Low conversions, bad messaging, no follow-up system"
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-white placeholder-white/15 focus:outline-none focus:border-cyan-500/20"
                  />
                </div>
              </details>

              {/* Submit */}
              <button
                onClick={() => void handleSubmit()}
                disabled={!hasInput || !urlValid}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Analyze My Business
              </button>

              {/* What you'll get */}
              <div className="rounded-xl border border-white/[0.04] bg-black/20 p-3">
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-2">What you'll get</p>
                <div className="flex flex-wrap gap-2">
                  {["Competitor Scan", "Weakness Analysis", "Priority Fixes", "Improved Homepage", "Marketing Angles", "Email Fixes", "Action Roadmap"].map((item) => (
                    <span key={item} className="rounded border border-white/[0.04] bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/25">{item}</span>
                  ))}
                </div>
              </div>

              {!hasInput && <p className="text-[10px] text-white/15 text-center">Enter a URL or describe your business to continue</p>}
              {url.trim() && !urlValid && <p className="text-[10px] text-red-400/60 text-center">Enter a valid URL starting with https://</p>}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
