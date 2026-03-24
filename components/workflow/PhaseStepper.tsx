"use client";

import { Check, Target, BarChart3, Sparkles, Palette, Rocket } from "lucide-react";

const PHASES = [
    { id: 1, label: "SOURCE", icon: Target, desc: "Intake Source" },
    { id: 2, label: "AUDIT", icon: BarChart3, desc: "Analyze Competitor" },
    { id: 3, label: "STRATEGIZE", icon: Sparkles, desc: "Generate Briefs" },
    { id: 4, label: "PRODUCE", icon: Palette, desc: "Creative Studio" },
    { id: 5, label: "DEPLOY", icon: Rocket, desc: "Final Export" },
];

interface PhaseStepperProps {
    currentPhase: number;
    onPhaseClick?: (phase: number) => void;
}

export default function PhaseStepper({ currentPhase, onPhaseClick }: PhaseStepperProps) {
    return (
        <div className="w-full py-6 px-8 bg-black/40 backdrop-blur-xl border-b border-white/[0.06] sticky top-0 z-50">
            <div className="max-w-4xl mx-auto flex items-center justify-between relative">
                {/* Progress Line */}
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/10 -translate-y-1/2 z-0" />
                <div
                    className="absolute top-1/2 left-0 h-[1px] bg-cyan-500 transition-all duration-700 -translate-y-1/2 z-0"
                    style={{ width: `${((currentPhase - 1) / (PHASES.length - 1)) * 100}%` }}
                />

                {PHASES.map((phase) => {
                    const Icon = phase.icon;
                    const isActive = currentPhase === phase.id;
                    const isCompleted = currentPhase > phase.id;

                    return (
                        <div key={phase.id} className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer" onClick={() => onPhaseClick?.(phase.id)}>
                            <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 border-2 font-black text-xs ${isActive
                                        ? "bg-cyan-500 border-cyan-400 text-[#050a14] shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-110"
                                        : isCompleted
                                            ? "bg-[#050a14] border-cyan-500 text-cyan-500"
                                            : "bg-[#050a14] border-white/10 text-white/20 group-hover:border-white/30"
                                    }`}
                            >
                                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                            </div>
                            <div className="text-center">
                                <p className={`text-[9px] font-black uppercase tracking-[0.2em] transition-colors ${isActive ? "text-cyan-400" : isCompleted ? "text-cyan-600" : "text-white/20"
                                    }`}>
                                    {phase.label}
                                </p>
                                <p className={`text-[8px] font-medium transition-colors ${isActive ? "text-white/60" : "text-transparent"
                                    }`}>
                                    {phase.desc}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
