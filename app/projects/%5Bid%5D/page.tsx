"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ChevronLeft, ChevronRight, Zap, Target, BarChart3, Sparkles, Palette, Rocket } from "lucide-react";
import Link from "next/link";
import PhaseStepper from "@/components/workflow/PhaseStepper";

// We'll need to import or dynamic load our existing tools
// For now, let's build the workspace skeleton

export default function ProjectWorkspace() {
    const { id } = useParams();
    const router = useRouter();
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/projects/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.ok) setProject(data.project);
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050a14] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Loading Master Workflow...</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-[#050a14] flex flex-col items-center justify-center gap-4">
                <p className="text-white/40">Project not found</p>
                <Link href="/projects" className="text-cyan-400 text-sm hover:underline">Back to Projects</Link>
            </div>
        );
    }

    const renderPhase = () => {
        switch (project.currentPhase) {
            case 1: return <SourcePhase project={project} />;
            case 2: return <AuditPhase project={project} />;
            case 3: return <StrategyPhase project={project} />;
            case 4: return <ProducePhase project={project} />;
            case 5: return <DeployPhase project={project} />;
            default: return null;
        }
    };

    return (
        <main className="min-h-screen bg-[#050a14] text-white flex flex-col font-inter">
            {/* Background glow */}
            <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Header */}
            <header className="px-8 py-4 border-b border-white/[0.06] bg-black/20 backdrop-blur-xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/projects" className="p-2 hover:bg-white/5 rounded-full transition text-white/40 hover:text-white">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black tracking-[0.2em] text-cyan-400 uppercase">Workflow</span>
                            <div className="w-1 h-1 rounded-full bg-white/20" />
                            <h1 className="text-sm font-black text-white uppercase tracking-tight">{project.name}</h1>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-white/40">
                        AUTO-SAVED · 2S AGO
                    </div>
                </div>
            </header>

            {/* Stepper */}
            <PhaseStepper
                currentPhase={project.currentPhase}
                onPhaseClick={(p) => {
                    // Allow logic to go back or forward?
                }}
            />

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {renderPhase()}
            </div>
        </main>
    );
}

function SourcePhase({ project }: { project: any }) {
    return (
        <div className="max-w-4xl mx-auto p-12 flex flex-col items-center text-center gap-8">
            <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border-2 border-cyan-500/20 flex items-center justify-center">
                <Target className="w-10 h-10 text-cyan-400" />
            </div>
            <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tight">Phase 1: Source Intake</h2>
                <p className="text-white/40 mt-2 max-w-md mx-auto">We've locked in your target source. Now we need to perform a deep competitive audit.</p>
            </div>

            <div className="w-full max-w-xl bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 text-left space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Target URL</span>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest">{project.sourceType}</span>
                </div>
                <p className="text-sm font-mono text-white/60 truncate">{project.sourceUrl}</p>
            </div>

            <button className="px-8 py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-[#050a14] font-black uppercase tracking-widest transition flex items-center gap-3 group shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                Start Deep Audit Analysis <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );
}

function AuditPhase({ project }: { project: any }) {
    return <div className="p-8"><p className="text-white/20">Audit Phase Implementation...</p></div>;
}

function StrategyPhase({ project }: { project: any }) {
    return <div className="p-8"><p className="text-white/20">Strategy Phase Implementation...</p></div>;
}

function ProducePhase({ project }: { project: any }) {
    return <div className="p-8"><p className="text-white/20">Produce Phase Implementation...</p></div>;
}

function DeployPhase({ project }: { project: any }) {
    return <div className="p-8"><p className="text-white/20">Deploy Phase Implementation...</p></div>;
}
