"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  CheckSquare,
  Loader2,
  Rocket,
  Search,
  Sparkles,
  Target,
  Wand2,
} from "lucide-react";
import AppNav from "@/components/AppNav";

type Project = {
  id: string;
  name: string;
  mode: string;
  status: string;
  sourceUrl: string | null;
  sourceType: string | null;
  currentPhase: number;
  updatedAt: string;
  workflowState?: {
    executionTier?: "core" | "elite";
  } | null;
  _count: {
    creatives: number;
    adVariations: number;
    emailDrafts: number;
    checklistItems: number;
  };
};

const PHASE_META: Record<number, { label: string; icon: typeof Target; tone: string }> = {
  1: { label: "Source", icon: Target, tone: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  2: { label: "Audit", icon: BarChart3, tone: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  3: { label: "Strategize", icon: Sparkles, tone: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  4: { label: "Produce", icon: Wand2, tone: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20" },
  5: { label: "Deploy", icon: Rocket, tone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
};

function formatRelativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatSourceLabel(sourceType: string | null) {
  if (!sourceType) return "Manual";
  return sourceType.charAt(0).toUpperCase() + sourceType.slice(1);
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch("/api/projects");
        const data = await res.json() as { ok: boolean; projects?: Project[] };
        if (data.ok && data.projects) {
          setProjects(data.projects);
        }
      } finally {
        setLoading(false);
      }
    }

    void loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return projects;
    return projects.filter((project) =>
      project.name.toLowerCase().includes(needle) ||
      (project.sourceUrl ?? "").toLowerCase().includes(needle) ||
      (project.sourceType ?? "").toLowerCase().includes(needle)
    );
  }, [projects, search]);

  const totals = useMemo(() => {
    return {
      projects: projects.length,
      active: projects.filter((project) => project.currentPhase > 1).length,
      creatives: projects.reduce((sum, project) => sum + project._count.creatives, 0),
      tasks: projects.reduce((sum, project) => sum + project._count.checklistItems, 0),
    };
  }, [projects]);

  return (
    <main className="min-h-screen bg-[#050a14] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 h-[28rem] w-[28rem] rounded-full bg-cyan-500/10 blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 h-[24rem] w-[24rem] rounded-full bg-fuchsia-500/10 blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />
      </div>

      <AppNav />

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-col px-6 pb-20">
        <header className="flex flex-wrap items-end justify-between gap-6 border-b border-white/[0.06] py-12">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-cyan-400/70">
                Projects
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tight">
              Saved{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-transparent">
                Build Missions
              </span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/35">
              Every remix, scan, and guided build becomes a project workspace you can reopen, push forward, and ship.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/winners"
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Browse Winners
            </Link>
            <Link
              href="/analyze"
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 px-6 py-3 text-sm font-black text-white shadow-[0_0_30px_rgba(6,182,212,0.25)] transition hover:scale-[1.02]"
            >
              Start New Analysis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {projects.length > 0 && (
          <>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: "Projects", value: totals.projects, tone: "text-white" },
                { label: "In Progress", value: totals.active, tone: "text-cyan-400" },
                { label: "Creatives", value: totals.creatives, tone: "text-fuchsia-400" },
                { label: "Checklist Tasks", value: totals.tasks, tone: "text-emerald-400" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-5 py-4">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/25">{stat.label}</p>
                  <p className={`text-3xl font-black ${stat.tone}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 max-w-sm">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search projects, sources, or modes..."
                  className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-cyan-500/40"
                />
              </div>
            </div>
          </>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-4 py-32 text-white/25">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            <p className="text-sm font-semibold">Loading your project workspaces...</p>
          </div>
        )}

        {!loading && projects.length === 0 && (
          <div className="mt-8 overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-cyan-500/[0.05] to-fuchsia-500/[0.04] p-14 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border border-white/[0.08] bg-white/[0.04] shadow-[0_0_40px_rgba(6,182,212,0.16)]">
              <Sparkles className="h-10 w-10 text-cyan-300" />
            </div>
            <h2 className="text-2xl font-black">No projects yet</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/35">
              Start from Winner Finder or paste a URL into Analyze. Once you create a remix, this becomes your mission board for auditing, strategizing, producing, and deploying.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/winners"
                className="rounded-2xl bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:bg-white/15"
              >
                Explore Winners
              </Link>
              <Link
                href="/analyze"
                className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-6 py-3 text-sm font-black text-cyan-300 transition hover:bg-cyan-500/15"
              >
                Analyze a URL
              </Link>
            </div>
          </div>
        )}

        {!loading && projects.length > 0 && filteredProjects.length === 0 && (
          <div className="py-20 text-center text-sm font-semibold text-white/25">
            No projects match &ldquo;{search}&rdquo;.
          </div>
        )}

        {!loading && filteredProjects.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {filteredProjects.map((project) => {
              const phase = PHASE_META[project.currentPhase] ?? PHASE_META[1];
              const PhaseIcon = phase.icon;
              const executionTier = project.workflowState?.executionTier === "core" ? "core" : "elite";

              return (
                <button
                  key={project.id}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="group rounded-3xl border border-white/[0.07] bg-white/[0.03] p-6 text-left transition duration-200 hover:border-cyan-500/30 hover:bg-white/[0.045]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${phase.tone}`}>
                          <PhaseIcon className="h-3 w-3" />
                          {phase.label}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
                          {project.mode}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${
                            executionTier === "elite"
                              ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-300"
                              : "border-white/10 bg-white/5 text-white/45"
                          }`}
                        >
                          {executionTier}
                        </span>
                        <span className="text-[11px] text-white/25">
                          Updated {formatRelativeDate(project.updatedAt)}
                        </span>
                      </div>

                      <h2 className="truncate text-xl font-black tracking-tight text-white transition group-hover:text-cyan-300">
                        {project.name}
                      </h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/35">
                        {project.sourceUrl ?? "No source URL yet. This project was created from a guided workflow."}
                      </p>
                      <p className="mt-2 text-[11px] text-white/28">
                        {executionTier === "elite"
                          ? "Elite mission lane with sharper strategy and heavier proof depth."
                          : "Core mission lane with strong operator-ready execution."}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">Source Type</p>
                      <p className="mt-1 text-sm font-black text-white/75">
                        {formatSourceLabel(project.sourceType)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <MetricTile label="Variations" value={project._count.adVariations} />
                    <MetricTile label="Emails" value={project._count.emailDrafts} />
                    <MetricTile label="Creatives" value={project._count.creatives} />
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4">
                    <div className="flex items-center gap-2 text-xs text-white/35">
                      <CheckSquare className="h-3.5 w-3.5 text-emerald-400/70" />
                      {project._count.checklistItems} execution tasks saved
                    </div>
                    <span className="inline-flex items-center gap-2 text-sm font-black text-cyan-300">
                      Open workspace
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function MetricTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}
