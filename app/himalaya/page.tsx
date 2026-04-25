"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { Rocket, ScanSearch, ArrowRight, Radar } from "lucide-react";

const PATHS = [
  {
    key: "scratch",
    href: "/himalaya/scratch",
    icon: Rocket,
    label: "Start from Scratch",
    desc: "Build a business foundation from idea to strategy, site direction, and launch assets.",
    gradient: "from-cyan-500/20 to-cyan-500/5",
    border: "border-cyan-500/30 hover:border-cyan-500/60",
    iconColor: "text-cyan-400",
    btnColor: "bg-cyan-500 hover:bg-cyan-400",
  },
  {
    key: "improve",
    href: "/himalaya/improve",
    icon: ScanSearch,
    label: "Improve Existing Business",
    desc: "Analyze your current business, find what is weak, and generate better-performing assets.",
    gradient: "from-purple-500/20 to-purple-500/5",
    border: "border-purple-500/30 hover:border-purple-500/60",
    iconColor: "text-purple-400",
    btnColor: "bg-purple-500 hover:bg-purple-400",
  },
] as const;

export default function HimalayaEntryPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#020509] text-white">
      <AppNav />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 mb-2">
              <Rocket className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Business Builder</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              What do you need help with?
            </h1>
            <p className="text-white/40 text-sm">
              Start from scratch or improve what you already have.
            </p>
          </div>

          <div className="grid gap-4">
            {PATHS.map((p) => (
              <button
                key={p.key}
                onClick={() => router.push(p.href)}
                className={`group relative w-full text-left rounded-2xl border bg-gradient-to-br ${p.gradient} ${p.border} p-6 md:p-8 transition-all duration-200 cursor-pointer backdrop-blur-sm hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(6,182,212,0.06)]`}
              >
                <div className="flex items-start gap-5">
                  <div className={`mt-1 p-3 rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] ${p.iconColor}`}>
                    <p.icon className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold text-white group-hover:text-white/90">
                      {p.label}
                    </h2>
                    <p className="mt-2 text-white/50 text-sm leading-relaxed">
                      {p.desc}
                    </p>
                    <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg ${p.btnColor} text-white text-sm font-medium transition-colors`}>
                      Get Started <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/market-intelligence"
              className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition"
            >
              <Radar className="w-3.5 h-3.5" />
              Or run Market Intelligence first to find the best niche
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
