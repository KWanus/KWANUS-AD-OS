"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Loader2, ChevronLeft, ChevronRight, Target, BarChart3, Sparkles,
  Rocket, Copy, Check, ExternalLink, Download, CheckSquare, Square,
  TrendingUp, AlertTriangle, Zap, Image as ImageIcon, Play, Globe,
  ArrowRight, RefreshCw, Shield, BookOpen, Layers
} from "lucide-react";
import PhaseStepper from "@/components/workflow/PhaseStepper";
import type { StudioBrief } from "@/components/studio/CreativeStudio";

// Dynamic import — CreativeStudio uses canvas/Konva which cannot SSR
const CreativeStudio = dynamic(() => import("@/components/studio/CreativeStudio"), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

type WorkflowState = {
  executionTier?: "core" | "elite";
  source?: { url: string; type: string };
  audit?: {
    verdict: string;
    score: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    confidence?: string;
  };
  strategy?: {
    hooks: { format: string; hook: string }[];
    briefs: StudioBrief[];
  };
  produce?: { creatives: SavedCreative[] };
  deploy?: { checklist: { text: string; done: boolean }[] };
};

type Project = {
  id: string;
  name: string;
  mode: string;
  status: string;
  sourceUrl: string | null;
  sourceType: string | null;
  currentPhase: number;
  workflowState: WorkflowState | null;
  productName: string | null;
  createdAt: string;
};

type SavedCreative = {
  id: string;
  name: string;
  type: "image" | "video";
  outputUrl: string | null;
  createdAt: string;
  state?: {
    executionTier?: ExecutionTier;
  } | null;
};

type ExecutionTier = "core" | "elite";

const ANALYZE_PROGRESS_MESSAGES = [
  "Fetching page content...",
  "Classifying link type...",
  "Extracting signals...",
  "Diagnosing opportunity...",
  "Scoring dimensions...",
  "Building strategy...",
  "Generating ad hooks...",
  "Packaging assets...",
];

const DEFAULT_CHECKLIST = [
  { text: "Set up ad account and billing", done: false },
  { text: "Upload creatives to ad platform", done: false },
  { text: "Set daily budget and bid strategy", done: false },
  { text: "Define target audience segments", done: false },
  { text: "Review compliance and ad policies", done: false },
  { text: "Launch campaign", done: false },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProjectWorkspace() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      const data = await res.json();
      if (data.ok) {
        setProject(data.project);
      } else {
        setError(data.message || "Project not found");
      }
    } catch {
      setError("Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) loadProject();
  }, [id, loadProject]);

  const advancePhase = useCallback(async (
    nextPhase: number,
    stateUpdate: Partial<WorkflowState>
  ) => {
    if (!project) return;
    const newWorkflowState = { ...(project.workflowState ?? {}), ...stateUpdate };
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPhase: nextPhase, workflowState: newWorkflowState }),
    });
    const data = await res.json();
    if (data.ok) {
      setProject(data.project);
    }
  }, [id, project]);

  // ── Render states ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020509] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
        </div>
        <p className="text-[10px] font-black uppercase text-white/30 tracking-[0.3em]">
          Loading Mission Control...
        </p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#020509] flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-white/60 font-black uppercase tracking-widest text-sm">
            {error ?? "Project not found"}
          </p>
          <p className="text-white/20 text-xs mt-1">The project may have been deleted or you lack access.</p>
        </div>
        <Link
          href="/winners"
          className="px-6 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/10 transition font-black uppercase tracking-widest"
        >
          Back to Winner Finder
        </Link>
      </div>
    );
  }

  const renderPhase = () => {
    switch (project.currentPhase) {
      case 1: return <SourcePhase project={project} onAdvance={advancePhase} />;
      case 2: return <AuditPhase project={project} onAdvance={advancePhase} />;
      case 3: return <StrategyPhase project={project} onAdvance={advancePhase} />;
      case 4: return <ProducePhase project={project} onAdvance={advancePhase} executionTier={executionTier} />;
      case 5: return <DeployPhase project={project} onAdvance={advancePhase} />;
      default: return null;
    }
  };

  const executionTier: ExecutionTier = project.workflowState?.executionTier === "core" ? "core" : "elite";

  return (
    <main className="min-h-screen bg-[#020509] text-white flex flex-col font-inter">
      {/* Dot grid background */}
      <div
        className="fixed inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(#fff 1px,transparent 1px)", backgroundSize: "28px 28px" }}
      />
      {/* Ambient glows */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/[0.04] blur-[140px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/[0.04] blur-[140px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 px-8 py-4 border-b border-white/[0.06] bg-black/30 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/winners"
            className="p-2 hover:bg-white/[0.03] rounded-full transition text-white/30 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black tracking-[0.25em] text-cyan-400/70 uppercase">
                Mission Control
              </span>
              <span className="text-white/15">·</span>
              <h1 className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[280px]">
                {project.name}
              </h1>
            </div>
            <p className="text-[9px] text-white/20 font-medium uppercase tracking-[0.15em] mt-0.5">
              Phase {project.currentPhase} of 5
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-1.5">
            {(["core", "elite"] as const).map((tier) => {
              const active = executionTier === tier;
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => {
                    if (tier === executionTier) return;
                    void advancePhase(project.currentPhase, {
                      ...(project.workflowState ?? {}),
                      executionTier: tier,
                    });
                  }}
                  className={`rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] transition ${
                    active
                      ? "bg-cyan-500/15 text-cyan-300"
                      : "text-white/30 hover:bg-white/[0.05] hover:text-white/70"
                  }`}
                >
                  {tier}
                </button>
              );
            })}
          </div>
          <StatusBadge status={project.status} />
        </div>
      </header>

      {/* Phase Stepper — sticky below header */}
      <PhaseStepper
        currentPhase={project.currentPhase}
        onPhaseClick={(p) => {
          // Only allow navigating to completed phases
          if (p < project.currentPhase) {
            advancePhase(p, {});
          }
        }}
      />

      {/* Phase Content */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        {renderPhase()}
      </div>
    </main>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-white/[0.03] border-white/10 text-white/30",
    active: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
    testing: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
    scaling: "bg-green-500/10 border-green-500/30 text-green-400",
    dead: "bg-red-500/5 border-red-500/20 text-red-400/50",
  };
  return (
    <span className={`px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-[0.2em] ${styles[status] ?? styles.draft}`}>
      {status}
    </span>
  );
}

// ─── Phase 1: SOURCE ──────────────────────────────────────────────────────────

function SourcePhase({
  project,
  onAdvance,
}: {
  project: Project;
  onAdvance: (phase: number, state: Partial<WorkflowState>) => Promise<void>;
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const [progressIdx, setProgressIdx] = useState(0);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const sourceTypeColors: Record<string, string> = {
    winner: "bg-orange-500/20 border-orange-500/40 text-orange-400",
    url: "bg-cyan-500/20 border-cyan-500/40 text-cyan-400",
    niche: "bg-purple-500/20 border-purple-500/40 text-purple-400",
  };
  const sourceType = project.sourceType ?? "url";
  const badgeClass = sourceTypeColors[sourceType] ?? sourceTypeColors.url;

  const handleAnalyze = async () => {
    if (!project.sourceUrl) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    setProgressIdx(0);

    // Cycle through progress messages while waiting
    const interval = setInterval(() => {
      setProgressIdx((prev) => Math.min(prev + 1, ANALYZE_PROGRESS_MESSAGES.length - 1));
    }, 900);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: project.sourceUrl,
          mode: project.mode,
          executionTier: project.workflowState?.executionTier === "core" ? "core" : "elite",
        }),
      });
      const data = await res.json();

      if (!data.ok) {
        setAnalyzeError(data.error ?? "Analysis failed");
        return;
      }

      const { analysis, opportunityAssessment, assetPackage } = data;

      const auditState = {
        verdict: analysis.verdict,
        score: analysis.score,
        summary: analysis.summary,
        confidence: analysis.confidence,
        strengths: analysis.decisionPacket?.strengths ?? [],
        weaknesses: analysis.decisionPacket?.weaknesses ?? [],
      };

      const strategyState = assetPackage
        ? {
            hooks: (assetPackage.adHooks ?? []).map((h: { format?: string; hook?: string; text?: string }) => ({
              format: h.format ?? "Hook",
              hook: h.hook ?? h.text ?? "",
            })),
            briefs: assetPackage.adBriefs ?? [],
          }
        : null;

      await onAdvance(2, {
        executionTier: project.workflowState?.executionTier === "core" ? "core" : "elite",
        audit: auditState,
        ...(strategyState ? { strategy: strategyState } : {}),
      });
    } catch {
      setAnalyzeError("Network error. Please try again.");
    } finally {
      clearInterval(interval);
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 flex flex-col items-center gap-10">
      {/* Phase Icon */}
      <div className="relative">
        <div className="w-24 h-24 rounded-3xl bg-cyan-500/10 border-2 border-cyan-500/20 flex items-center justify-center shadow-[0_0_60px_rgba(6,182,212,0.1)]">
          <Target className="w-12 h-12 text-cyan-400" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-[#020509] border border-cyan-500/40 flex items-center justify-center">
          <span className="text-[9px] font-black text-cyan-400">01</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-[10px] font-black tracking-[0.3em] text-cyan-400/60 uppercase mb-2">
          Phase 1 — Source Intake
        </p>
        <h2 className="text-4xl font-black text-white uppercase tracking-tight leading-tight">
          Target Acquired
        </h2>
        <p className="text-white/35 mt-3 max-w-md mx-auto leading-relaxed text-sm">
          We've locked in your source. Run the deep competitive audit to extract signals, score the opportunity, and generate your entire ad strategy.
        </p>
      </div>

      {/* Source Card */}
      <div className="w-full bg-white/[0.025] border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
            Source Target
          </span>
          <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${badgeClass}`}>
            {sourceType}
          </span>
        </div>
        <div className="px-6 py-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center flex-shrink-0">
            <Globe className="w-5 h-5 text-white/30" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-mono text-white/70 truncate">
              {project.sourceUrl ?? "No URL set"}
            </p>
            <p className="text-[10px] text-white/25 mt-0.5 font-medium">Ready for analysis</p>
          </div>
          {project.sourceUrl && (
            <a
              href={project.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-white/[0.03] border border-white/10 text-white/30 hover:text-white hover:bg-white/10 transition flex-shrink-0"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* What happens section */}
      <div className="w-full grid grid-cols-3 gap-4">
        {[
          { icon: BarChart3, label: "Opportunity Score", desc: "0–100 competitive rating" },
          { icon: Sparkles, label: "Ad Hooks Generated", desc: "Platform-specific copy" },
          { icon: Layers, label: "Full Strategy Pack", desc: "Briefs, scripts, angles" },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 flex flex-col gap-2">
            <Icon className="w-5 h-5 text-cyan-500/60" />
            <p className="text-xs font-black text-white/60 uppercase tracking-wide">{label}</p>
            <p className="text-[10px] text-white/25 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Error */}
      {analyzeError && (
        <div className="w-full px-5 py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {analyzeError}
        </div>
      )}

      {/* CTA */}
      {analyzing ? (
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-xs font-black text-cyan-400 uppercase tracking-widest">
              {ANALYZE_PROGRESS_MESSAGES[progressIdx]}
            </p>
            <p className="text-[10px] text-white/20 mt-1">This takes 10–20 seconds</p>
          </div>
          {/* Progress bar */}
          <div className="w-64 h-1 bg-white/[0.03] rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all duration-700"
              style={{ width: `${((progressIdx + 1) / ANALYZE_PROGRESS_MESSAGES.length) * 100}%` }}
            />
          </div>
        </div>
      ) : (
        <button
          onClick={handleAnalyze}
          disabled={!project.sourceUrl}
          className="px-10 py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed text-[#050a14] font-black uppercase tracking-[0.2em] transition-all duration-200 flex items-center gap-3 shadow-[0_0_40px_rgba(6,182,212,0.25)] hover:shadow-[0_0_60px_rgba(6,182,212,0.4)] group"
        >
          <Zap className="w-5 h-5" />
          Analyze This
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      )}
    </div>
  );
}

// ─── Phase 2: AUDIT ───────────────────────────────────────────────────────────

function AuditPhase({
  project,
  onAdvance,
}: {
  project: Project;
  onAdvance: (phase: number, state: Partial<WorkflowState>) => Promise<void>;
}) {
  const [advancing, setAdvancing] = useState(false);
  const audit = project.workflowState?.audit;

  if (!audit) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 flex flex-col items-center gap-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-yellow-500/10 border-2 border-yellow-500/20 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-yellow-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">No Audit Data</h2>
          <p className="text-white/35 mt-2 text-sm">Run Phase 1 first to generate audit results.</p>
        </div>
        <button
          onClick={() => onAdvance(1, {})}
          className="px-6 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition"
        >
          Back to Phase 1
        </button>
      </div>
    );
  }

  const verdictStyles: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    "Strong Buy": { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", glow: "shadow-[0_0_40px_rgba(34,197,94,0.15)]" },
    Buy: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400", glow: "shadow-[0_0_40px_rgba(6,182,212,0.15)]" },
    Caution: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", glow: "shadow-[0_0_40px_rgba(234,179,8,0.15)]" },
    Reject: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", glow: "shadow-[0_0_40px_rgba(239,68,68,0.15)]" },
  };
  const verdictStyle = verdictStyles[audit.verdict] ?? verdictStyles.Buy;
  const scoreColor = audit.score >= 75 ? "text-green-400" : audit.score >= 50 ? "text-yellow-400" : "text-red-400";

  const handleAdvance = async () => {
    setAdvancing(true);
    await onAdvance(3, {});
    setAdvancing(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-[9px] font-black tracking-[0.3em] text-cyan-400/60 uppercase mb-2">
            Phase 2 — Competitive Audit
          </p>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">Analysis Results</h2>
          <p className="text-white/30 mt-1 text-sm">{project.sourceUrl}</p>
        </div>
        <div className={`flex-shrink-0 rounded-2xl ${verdictStyle.bg} ${verdictStyle.border} border px-6 py-4 text-center ${verdictStyle.glow}`}>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">Verdict</p>
          <p className={`text-xl font-black uppercase tracking-tight ${verdictStyle.text}`}>{audit.verdict}</p>
          {audit.confidence && (
            <p className="text-[9px] text-white/25 mt-1 uppercase tracking-widest">{audit.confidence} confidence</p>
          )}
        </div>
      </div>

      {/* Score + Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Big Score */}
        <div className="rounded-2xl bg-white/[0.025] border border-white/[0.07] p-8 flex flex-col items-center justify-center gap-2">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25">Opportunity Score</p>
          <p className={`text-7xl font-black tabular-nums ${scoreColor}`}>{audit.score}</p>
          <div className="w-full bg-white/[0.03] rounded-full h-1.5 mt-2">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${audit.score >= 75 ? "bg-green-500" : audit.score >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
              style={{ width: `${audit.score}%` }}
            />
          </div>
          <p className="text-[9px] text-white/20 mt-1">out of 100</p>
        </div>

        {/* Summary */}
        <div className="md:col-span-2 rounded-2xl bg-white/[0.025] border border-white/[0.07] p-6 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-500/60" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">AI Summary</span>
          </div>
          <p className="text-sm text-white/60 leading-relaxed flex-1">{audit.summary}</p>
        </div>
      </div>

      {/* Strengths + Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="rounded-2xl bg-green-500/[0.03] border border-green-500/[0.12] p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400/70" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-green-400/60">Strengths</span>
          </div>
          <ul className="space-y-2.5">
            {(audit.strengths ?? []).length > 0
              ? audit.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/55">
                    <Check className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                    {s}
                  </li>
                ))
              : <li className="text-sm text-white/20">No strengths data available.</li>
            }
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="rounded-2xl bg-red-500/[0.03] border border-red-500/[0.12] p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400/70" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-400/60">Weaknesses</span>
          </div>
          <ul className="space-y-2.5">
            {(audit.weaknesses ?? []).length > 0
              ? audit.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/55">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                    {w}
                  </li>
                ))
              : <li className="text-sm text-white/20">No weaknesses data available.</li>
            }
          </ul>
        </div>
      </div>

      {/* CTA */}
      <div className="flex justify-end">
        <button
          onClick={handleAdvance}
          disabled={advancing}
          className="px-10 py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-[#050a14] font-black uppercase tracking-[0.2em] transition-all duration-200 flex items-center gap-3 shadow-[0_0_40px_rgba(6,182,212,0.2)] hover:shadow-[0_0_60px_rgba(6,182,212,0.35)] group"
        >
          {advancing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
          Generate Strategy
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

// ─── Phase 3: STRATEGIZE ──────────────────────────────────────────────────────

function StrategyPhase({
  project,
  onAdvance,
}: {
  project: Project;
  onAdvance: (phase: number, state: Partial<WorkflowState>) => Promise<void>;
}) {
  const [advancing, setAdvancing] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const strategy = project.workflowState?.strategy;

  const handleCopy = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1800);
  };

  const handleAdvance = async () => {
    setAdvancing(true);
    await onAdvance(4, {});
    setAdvancing(false);
  };

  const hooks = strategy?.hooks ?? [];
  const briefs = strategy?.briefs ?? [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col gap-10">
      {/* Header */}
      <div>
        <p className="text-[9px] font-black tracking-[0.3em] text-cyan-400/60 uppercase mb-2">
          Phase 3 — Strategy
        </p>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Your Ad Arsenal</h2>
        <p className="text-white/30 mt-1 text-sm">
          {hooks.length} hooks · {briefs.length} briefs generated
        </p>
      </div>

      {/* Hooks Section */}
      {hooks.length > 0 ? (
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-500/60" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Ad Hooks</h3>
            <div className="flex-1 h-[1px] bg-white/[0.05]" />
            <span className="text-[9px] font-bold text-white/20">{hooks.length} total</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {hooks.map((hook, i) => (
              <div
                key={i}
                className="group rounded-xl bg-white/[0.025] border border-white/[0.07] hover:border-cyan-500/20 transition-all duration-300 p-5 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-black text-cyan-400 uppercase tracking-widest">
                    {hook.format}
                  </span>
                  <button
                    onClick={() => handleCopy(hook.hook, i)}
                    className="p-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-white/25 hover:text-white hover:bg-white/10 transition opacity-0 group-hover:opacity-100"
                  >
                    {copiedIdx === i ? (
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-white/70 leading-relaxed">{hook.hook}</p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-8 text-center">
          <p className="text-white/25 text-sm">No hooks generated. Run Phase 1 analysis to generate ad hooks.</p>
        </div>
      )}

      {/* Briefs Section */}
      {briefs.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-500/60" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Ad Briefs</h3>
            <div className="flex-1 h-[1px] bg-white/[0.05]" />
            <span className="text-[9px] font-bold text-white/20">{briefs.length} briefs</span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {briefs.map((brief: StudioBrief, i) => (
              <div
                key={i}
                className="rounded-xl bg-white/[0.025] border border-white/[0.07] hover:border-purple-500/20 transition-all duration-300 p-6 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-white/80 uppercase tracking-tight">{brief.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {brief.format && (
                        <span className="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/20 text-[9px] font-black text-purple-400 uppercase tracking-widest">
                          {brief.format}
                        </span>
                      )}
                      {brief.platform && (
                        <span className="px-2 py-0.5 rounded bg-white/[0.03] border border-white/10 text-[9px] font-black text-white/30 uppercase tracking-widest">
                          {brief.platform}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {brief.concept && (
                  <p className="text-sm text-white/45 leading-relaxed">{brief.concept}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <div className="flex justify-end">
        <button
          onClick={handleAdvance}
          disabled={advancing}
          className="px-10 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 disabled:opacity-50 text-white font-black uppercase tracking-[0.2em] transition-all duration-200 flex items-center gap-3 shadow-[0_0_40px_rgba(139,92,246,0.2)] hover:shadow-[0_0_60px_rgba(139,92,246,0.35)] group"
        >
          {advancing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Play className="w-5 h-5" />
          )}
          Go to Studio
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

// ─── Phase 4: PRODUCE ─────────────────────────────────────────────────────────

function ProducePhase({
  project,
  onAdvance,
  executionTier,
}: {
  project: Project;
  onAdvance: (phase: number, state: Partial<WorkflowState>) => Promise<void>;
  executionTier: ExecutionTier;
}) {
  const [studioOpen, setStudioOpen] = useState(false);
  const [creatives, setCreatives] = useState<SavedCreative[]>([]);
  const [loadingCreatives, setLoadingCreatives] = useState(true);
  const [advancing, setAdvancing] = useState(false);

  // Get the first brief for the studio if available
  const strategyBriefs = project.workflowState?.strategy?.briefs ?? [];
  const studioBrief: StudioBrief = strategyBriefs[0] ?? {
    id: project.id,
    title: project.name,
    format: "TikTok / Reels",
    duration: "15–30s",
    platform: "TikTok",
    concept: "Build your ad creative. Use the canvas to design image ads or storyboard video ads.",
    scenes: [],
    productionKit: {
      location: "Studio",
      props: ["Product"],
      casting: "UGC creator",
      lighting: "Soft diffused",
      audioStyle: "Trending sound + VO",
      colorGrade: "High contrast",
    },
  };

  useEffect(() => {
    fetch(`/api/creative/save?campaignId=${project.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setCreatives(data.creatives ?? []);
      })
      .catch(() => {})
      .finally(() => setLoadingCreatives(false));
  }, [project.id, studioOpen]);

  const handleAdvance = async () => {
    setAdvancing(true);
    await onAdvance(5, {});
    setAdvancing(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col gap-8">
      {/* Header */}
      <div>
        <p className="text-[9px] font-black tracking-[0.3em] text-purple-400/60 uppercase mb-2">
          Phase 4 — Creative Production
        </p>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Creative Studio</h2>
        <p className="text-white/30 mt-1 text-sm">
          Build image ads, video storyboards, and export production-ready assets.
        </p>
      </div>

      {/* Open Studio CTA */}
      <button
        onClick={() => setStudioOpen(true)}
        className="w-full rounded-2xl border border-purple-500/30 bg-purple-500/[0.04] hover:bg-purple-500/[0.08] hover:border-purple-500/50 p-8 transition-all duration-300 flex items-center justify-between group"
      >
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center group-hover:border-purple-500/40 transition">
            <ImageIcon className="w-8 h-8 text-purple-400" />
          </div>
          <div className="text-left">
            <p className="text-lg font-black text-white uppercase tracking-tight">Open Creative Studio</p>
            <p className="text-sm text-white/35 mt-1">Canvas editor · AI image generation · Video storyboards</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500 group-hover:bg-purple-400 text-white font-black text-sm uppercase tracking-widest transition shadow-[0_0_30px_rgba(139,92,246,0.3)]">
          Launch <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </button>

      {/* Saved Creatives */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-white/25" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Saved Creatives</h3>
          <div className="flex-1 h-[1px] bg-white/[0.05]" />
          {!loadingCreatives && (
            <span className="text-[9px] font-bold text-white/20">{creatives.length} saved</span>
          )}
        </div>

        {loadingCreatives ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
          </div>
        ) : creatives.length === 0 ? (
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] border-dashed p-8 text-center">
            <ImageIcon className="w-8 h-8 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/20">No creatives saved yet.</p>
            <p className="text-[11px] text-white/15 mt-1">Open the studio and save your work to see it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {creatives.map((creative) => (
              <div
                key={creative.id}
                className="rounded-xl bg-white/[0.03] border border-white/[0.07] overflow-hidden flex flex-col gap-0 group hover:border-white/20 transition"
              >
                {creative.outputUrl ? (
                  <div className="aspect-square overflow-hidden bg-black/30">
                    <img
                      src={creative.outputUrl}
                      alt={creative.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-white/[0.02] flex items-center justify-center">
                    {creative.type === "video" ? (
                      <Play className="w-8 h-8 text-white/10" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-white/10" />
                    )}
                  </div>
                )}
                <div className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-black text-white/50 truncate uppercase tracking-wide">{creative.name}</p>
                    {creative.state?.executionTier && (
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.18em] ${
                        creative.state.executionTier === "elite"
                          ? "border border-cyan-400/30 bg-cyan-500/10 text-cyan-300"
                          : "border border-white/10 bg-white/[0.03] text-white/45"
                      }`}>
                        {creative.state.executionTier}
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] text-white/20 mt-0.5 uppercase tracking-widest">{creative.type}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA to next phase */}
      <div className="flex justify-end">
        <button
          onClick={handleAdvance}
          disabled={advancing}
          className="px-10 py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-[#050a14] font-black uppercase tracking-[0.2em] transition-all duration-200 flex items-center gap-3 shadow-[0_0_40px_rgba(6,182,212,0.2)] hover:shadow-[0_0_60px_rgba(6,182,212,0.35)] group"
        >
          {advancing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Rocket className="w-5 h-5" />
          )}
          Ready to Deploy
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Creative Studio Modal */}
      {studioOpen && (
        <CreativeStudio
          isOpen={studioOpen}
          onClose={() => setStudioOpen(false)}
          brief={studioBrief}
          executionTier={executionTier}
        />
      )}
    </div>
  );
}

// ─── Phase 5: DEPLOY ──────────────────────────────────────────────────────────

function DeployPhase({
  project,
  onAdvance,
}: {
  project: Project;
  onAdvance: (phase: number, state: Partial<WorkflowState>) => Promise<void>;
}) {
  const savedChecklist = project.workflowState?.deploy?.checklist ?? DEFAULT_CHECKLIST;
  const [checklist, setChecklist] = useState(savedChecklist);
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(project.status === "active");

  const toggleItem = async (idx: number) => {
    const updated = checklist.map((item, i) =>
      i === idx ? { ...item, done: !item.done } : item
    );
    setChecklist(updated);
    // Persist checklist state
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workflowState: {
          ...(project.workflowState ?? {}),
          deploy: { checklist: updated },
        },
      }),
    });
  };

  const handleExport = () => {
    const exportData = {
      project: {
        id: project.id,
        name: project.name,
        sourceUrl: project.sourceUrl,
        sourceType: project.sourceType,
        createdAt: project.createdAt,
        exportedAt: new Date().toISOString(),
      },
      workflow: project.workflowState,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, "-").toLowerCase()}-campaign.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMarkLive = async () => {
    setLaunching(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      const data = await res.json();
      if (data.ok) setLaunched(true);
    } finally {
      setLaunching(false);
    }
  };

  const completedCount = checklist.filter((i) => i.done).length;
  const allDone = completedCount === checklist.length;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col gap-8">
      {/* Header */}
      <div>
        <p className="text-[9px] font-black tracking-[0.3em] text-cyan-400/60 uppercase mb-2">
          Phase 5 — Deploy
        </p>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Launch Checklist</h2>
        <p className="text-white/30 mt-1 text-sm">
          Complete each step before marking your campaign live.
        </p>
      </div>

      {/* Progress Overview */}
      <div className="rounded-2xl bg-white/[0.025] border border-white/[0.07] p-6 flex items-center gap-6">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke={allDone ? "#22c55e" : "#06b6d4"}
              strokeWidth="3"
              strokeDasharray={`${(completedCount / checklist.length) * 100} 100`}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-black text-white">{completedCount}/{checklist.length}</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-black text-white uppercase tracking-tight">
            {allDone ? "All Systems Go" : `${checklist.length - completedCount} steps remaining`}
          </p>
          <p className="text-xs text-white/30 mt-1">
            {allDone ? "Your campaign is ready to launch." : "Complete all items before launching."}
          </p>
          <div className="w-48 bg-white/[0.03] rounded-full h-1 mt-3">
            <div
              className={`h-full rounded-full transition-all duration-700 ${allDone ? "bg-green-500" : "bg-cyan-500"}`}
              style={{ width: `${(completedCount / checklist.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="flex flex-col gap-2">
        {checklist.map((item, idx) => (
          <button
            key={idx}
            onClick={() => toggleItem(idx)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left group ${
              item.done
                ? "bg-green-500/[0.05] border-green-500/20 hover:border-green-500/30"
                : "bg-white/[0.02] border-white/[0.07] hover:border-white/20 hover:bg-white/[0.04]"
            }`}
          >
            {item.done ? (
              <CheckSquare className="w-5 h-5 text-green-400 flex-shrink-0" />
            ) : (
              <Square className="w-5 h-5 text-white/20 flex-shrink-0 group-hover:text-white/40 transition-colors" />
            )}
            <span className={`text-sm font-medium transition-colors ${item.done ? "text-white/40 line-through" : "text-white/70"}`}>
              {item.text}
            </span>
            {item.done && (
              <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-green-400/60">
                Done
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleExport}
          className="flex-1 px-6 py-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white/60 hover:text-white font-black uppercase tracking-[0.2em] text-sm transition flex items-center justify-center gap-3 group"
        >
          <Download className="w-5 h-5" />
          Export All Assets
        </button>

        {launched ? (
          <div className="flex-1 px-6 py-4 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3">
            <Check className="w-5 h-5" />
            Campaign Live
          </div>
        ) : (
          <button
            onClick={handleMarkLive}
            disabled={launching}
            className="flex-1 px-6 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-[#050a14] font-black uppercase tracking-[0.2em] text-sm transition flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(6,182,212,0.2)] hover:shadow-[0_0_50px_rgba(6,182,212,0.4)] group"
          >
            {launching ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Rocket className="w-5 h-5 group-hover:translate-y-[-2px] transition-transform" />
            )}
            Mark Campaign Live
          </button>
        )}
      </div>

      {/* Completion message */}
      {launched && (
        <div className="rounded-2xl bg-green-500/[0.06] border border-green-500/20 p-8 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-500/15 border border-green-500/20 flex items-center justify-center">
            <Rocket className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <p className="text-xl font-black text-white uppercase tracking-tight">Campaign Active</p>
            <p className="text-white/35 text-sm mt-1">
              Your campaign is now live. Track performance and iterate.
            </p>
          </div>
          <Link
            href="/winners"
            className="px-6 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm font-black uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            Find More Winners
          </Link>
        </div>
      )}
    </div>
  );
}
