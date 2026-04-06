"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, Mountain, AlertTriangle, XCircle } from "lucide-react";
import AppNav from "@/components/AppNav";
import HimalayaNav from "@/components/himalaya/HimalayaNav";

type StageDisplay = {
  name: string;
  label: string;
  status: "pending" | "running" | "done" | "failed";
};

const STAGE_LABELS: Record<string, string> = {
  diagnose: "Analyzing your situation",
  strategize: "Building your strategy",
  generate: "Creating your assets",
  handoff: "Preparing deliverables",
  persist: "Saving your results",
};

export default function HimalayaBuildingPage({ params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = use(params);
  const router = useRouter();
  const [stages, setStages] = useState<StageDisplay[]>([
    { name: "diagnose", label: "Analyzing your situation", status: "pending" },
    { name: "strategize", label: "Building your strategy", status: "pending" },
    { name: "generate", label: "Creating your assets", status: "pending" },
    { name: "handoff", label: "Preparing deliverables", status: "pending" },
    { name: "persist", label: "Saving your results", status: "pending" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [path, setPath] = useState<string | null>(null);

  useEffect(() => {
    // Get the path from URL params
    const searchParams = new URLSearchParams(window.location.search);
    const selectedPath = searchParams.get("path") ?? "affiliate";
    const mode = searchParams.get("mode") ?? "scratch";
    const url = searchParams.get("url");
    setPath(selectedPath);

    // Simulate progressive stage updates
    let stageIndex = 0;
    const interval = setInterval(() => {
      if (stageIndex < 5) {
        setStages((prev) =>
          prev.map((s, i) =>
            i === stageIndex ? { ...s, status: "running" } : i < stageIndex ? { ...s, status: "done" } : s
          )
        );
        stageIndex++;
      }
    }, 700);

    // Build pipeline body — for improve, fetch profile to get URL
    async function buildBody() {
      if (mode === "improve") {
        // Load profile to get the existingUrl
        try {
          const profileRes = await fetch(`/api/himalaya/profile/${profileId}`);
          const profileData = (await profileRes.json()) as { ok: boolean; profile?: { existingUrl?: string; niche?: string } };
          const profileUrl = profileData.profile?.existingUrl || url;
          return { mode: "improve", url: profileUrl, niche: profileData.profile?.niche || searchParams.get("niche") };
        } catch {
          return { mode: "improve", url, niche: searchParams.get("niche") };
        }
      }
      return { mode: "scratch", profileId, path: selectedPath };
    }

    // Run the actual pipeline
    buildBody().then((body) =>
    fetch("/api/himalaya/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }))
      .then((r) => r.json() as Promise<{ ok: boolean; runId?: string; error?: string }>)
      .then((data) => {
        clearInterval(interval);

        if (data.ok && data.runId) {
          // Mark all stages done
          setStages((prev) => prev.map((s) => ({ ...s, status: "done" as const })));
          // Navigate after brief celebration
          setTimeout(() => {
            router.push(`/himalaya/run/${data.runId}`);
          }, 1200);
        } else {
          setError(data.error ?? "Something went wrong");
          setStages((prev) =>
            prev.map((s) => (s.status === "running" ? { ...s, status: "failed" as const } : s))
          );
        }
      })
      .catch(() => {
        clearInterval(interval);
        setError("Connection failed. Please try again.");
      });

    return () => clearInterval(interval);
  }, [profileId, router]);

  const completedCount = stages.filter((s) => s.status === "done").length;
  const progress = (completedCount / stages.length) * 100;

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <HimalayaNav />
      <main className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        {/* Header */}
        <div className="mb-10 rounded-3xl border border-cyan-500/12 bg-gradient-to-br from-cyan-500/[0.06] via-transparent to-purple-500/[0.05] px-5 py-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600">
            <Mountain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-black text-white mb-2">
            {error ? "Something went wrong" : completedCount === 5 ? "Your foundation is ready" : "Building your foundation"}
          </h1>
          <p className="text-sm text-white/30">
            {error
              ? "The pipeline encountered an issue"
              : completedCount === 5
                ? "Redirecting to your results..."
                : "Himalaya is working on your business foundation"}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${error ? "bg-red-500" : "bg-gradient-to-r from-cyan-500 to-purple-600"}`}
              style={{ width: `${Math.max(progress, 3)}%` }}
            />
          </div>
        </div>

        {/* Stages */}
        <div className="space-y-3 rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent p-4 sm:p-5">
          {stages.map((stage) => (
            <div
              key={stage.name}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-500 ${
                stage.status === "done"
                  ? "bg-emerald-500/[0.04] border-emerald-500/10"
                  : stage.status === "running"
                    ? "bg-cyan-500/[0.04] border-cyan-500/15"
                    : stage.status === "failed"
                      ? "bg-red-500/[0.04] border-red-500/15"
                      : "bg-white/[0.01] border-white/[0.04]"
              }`}
            >
              {stage.status === "done" && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
              {stage.status === "running" && <Loader2 className="w-5 h-5 text-cyan-400 animate-spin shrink-0" />}
              {stage.status === "failed" && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
              {stage.status === "pending" && <div className="w-5 h-5 rounded-full border border-white/[0.1] shrink-0" />}

              <span className={`text-sm font-semibold transition-colors ${
                stage.status === "done" ? "text-white/40" : stage.status === "running" ? "text-white/70" : stage.status === "failed" ? "text-red-300" : "text-white/20"
              }`}>
                {STAGE_LABELS[stage.name] ?? stage.name}
              </span>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/15 bg-red-500/5 p-4">
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
      </main>
    </div>
  );
}
