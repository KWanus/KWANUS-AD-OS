"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { getNicheGuide, getAllNicheGuides, type NicheGuide } from "@/lib/himalaya/nicheGuides";
import {
  Loader2, ChevronRight, AlertTriangle, Clock, Target,
  DollarSign, Lightbulb, Calendar, CheckCircle2, Wrench,
  BarChart3, Mountain, ArrowRight, BookOpen,
} from "lucide-react";

export default function PlaybookPage() {
  const [guide, setGuide] = useState<NicheGuide | null>(null);
  const [allGuides, setAllGuides] = useState<NicheGuide[]>([]);
  const [activeType, setActiveType] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const guides = getAllNicheGuides();
    setAllGuides(guides);

    fetch("/api/business-profile")
      .then((r) => r.json())
      .then((data) => {
        const bType = data?.profile?.businessType ?? "";
        const matched = getNicheGuide(bType);
        if (matched) {
          setGuide(matched);
          setActiveType(matched.id);
        } else if (guides.length > 0) {
          setGuide(guides[0]);
          setActiveType(guides[0].id);
        }
      })
      .catch(() => {
        if (guides.length > 0) {
          setGuide(guides[0]);
          setActiveType(guides[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function switchGuide(id: string) {
    const g = getNicheGuide(id);
    if (g) {
      setGuide(g);
      setActiveType(id);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-t-bg text-t-text">
        <AppNav />
        <div className="flex flex-col items-center justify-center min-h-[75vh] gap-4">
          <Loader2 className="w-6 h-6 text-[#f5a623] animate-spin" />
          <p className="text-sm text-t-text-muted">Loading your playbook...</p>
        </div>
      </main>
    );
  }

  if (!guide) {
    return (
      <main className="min-h-screen bg-t-bg text-t-text">
        <AppNav />
        <div className="flex flex-col items-center justify-center min-h-[75vh] gap-4">
          <p className="text-sm text-t-text-muted">No playbook available yet. Complete onboarding first.</p>
          <Link href="/himalaya" className="text-xs text-[#f5a623] hover:underline">Go to Himalaya</Link>
        </div>
      </main>
    );
  }

  const firstSystem = guide.systemsToUse[0];

  return (
    <main className="min-h-screen bg-t-bg text-t-text">
      <AppNav />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-28">

        {/* Page header */}
        <div className="pt-10 pb-2">
          <div className="flex items-center gap-2 text-[#f5a623] mb-3">
            <BookOpen className="w-4 h-4" />
            <span className="text-[10px] font-black tracking-widest uppercase">Your Playbook</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black leading-tight">{guide.name}</h1>
          <p className="text-sm text-t-text-muted mt-2 max-w-xl">{guide.tagline}</p>
        </div>

        {/* Business type selector */}
        <div className="flex flex-wrap gap-2 py-5 border-b border-t-border mb-8">
          {allGuides.map((g) => (
            <button
              key={g.id}
              onClick={() => switchGuide(g.id)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition border ${
                activeType === g.id
                  ? "bg-[#f5a623] text-[#0c0a08] border-[#f5a623]"
                  : "border-t-border text-t-text/40 hover:text-t-text/70 hover:border-t-text/20"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>

        {/* SECTIONS */}
        <div className="space-y-5">

          {/* Overview */}
          <details open>
            <summary className="cursor-pointer group">
              <SectionHeader icon={Mountain} title="Overview" />
            </summary>
            <div className="pl-1 pt-4 pb-2 space-y-4">
              <p className="text-sm text-t-text-muted leading-relaxed">{guide.overview}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {guide.idealFor.map((item, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/15 text-[10px] font-semibold text-[#f5a623]">
                    <CheckCircle2 className="w-3 h-3" /> {item}
                  </span>
                ))}
              </div>
            </div>
          </details>

          {/* Revenue Model */}
          <details>
            <summary className="cursor-pointer">
              <SectionHeader icon={DollarSign} title="Revenue Model" subtitle="How you make money" />
            </summary>
            <div className="pl-1 pt-4 pb-2 space-y-5">
              <div>
                <h4 className="text-sm font-black mb-1">{guide.revenueModel.howYouMakeMoneyTitle}</h4>
                <p className="text-xs text-t-text-muted leading-relaxed">{guide.revenueModel.howYouMakeMoneyDesc}</p>
              </div>

              {/* Revenue streams table */}
              <div className="rounded-xl border border-t-border overflow-hidden">
                <div className="grid grid-cols-3 text-[10px] font-black text-t-text/40 uppercase tracking-wider bg-t-bg-raised px-4 py-2.5">
                  <span>Stream</span><span>Amount</span><span>Frequency</span>
                </div>
                {guide.revenueModel.revenueStreams.map((s, i) => (
                  <div key={i} className="grid grid-cols-3 px-4 py-3 text-xs border-t border-t-border">
                    <span className="font-semibold">{s.name}</span>
                    <span className="text-emerald-400 font-bold">{s.amount}</span>
                    <span className="text-t-text-muted">{s.frequency}</span>
                  </div>
                ))}
              </div>

              {/* Math to target */}
              <div className="rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15 p-4">
                <p className="text-[10px] font-black text-emerald-400/70 mb-1">THE MATH</p>
                <p className="text-sm font-bold text-emerald-400">{guide.revenueModel.mathToTarget}</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-t-text-muted">
                <Clock className="w-3.5 h-3.5 text-[#f5a623]" />
                <span>Time to first revenue: <strong className="text-t-text">{guide.revenueModel.timeToFirstRevenue}</strong></span>
              </div>
            </div>
          </details>

          {/* Strategy */}
          <details>
            <summary className="cursor-pointer">
              <SectionHeader icon={Target} title="Your Strategy" subtitle="Primary and secondary approaches" />
            </summary>
            <div className="pl-1 pt-4 pb-2 space-y-4">
              <div>
                <p className="text-[10px] font-black text-[#f5a623]/70 mb-1">PRIMARY STRATEGY</p>
                <p className="text-sm text-t-text-muted leading-relaxed">{guide.strategy.primary}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-t-text/30 mb-1">SECONDARY STRATEGY</p>
                <p className="text-sm text-t-text-muted leading-relaxed">{guide.strategy.secondary}</p>
              </div>
              <div className="rounded-xl bg-[#f5a623]/[0.06] border border-[#f5a623]/15 p-4">
                <div className="flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-[#f5a623] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-[#f5a623] mb-1">KEY INSIGHT</p>
                    <p className="text-sm text-t-text leading-relaxed">{guide.strategy.keyInsight}</p>
                  </div>
                </div>
              </div>
            </div>
          </details>

          {/* Daily Routine */}
          <details>
            <summary className="cursor-pointer">
              <SectionHeader icon={Calendar} title="Daily Routine" subtitle="Time-blocked schedule" />
            </summary>
            <div className="pl-1 pt-4 pb-2">
              <div className="space-y-1">
                {guide.dailyRoutine.map((block, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-t-bg-raised transition">
                    <span className="text-[11px] font-mono font-bold text-[#f5a623] w-16 shrink-0 pt-0.5">{block.time}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{block.task}</p>
                      <p className="text-[11px] text-t-text-muted mt-0.5">{block.why}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </details>

          {/* Week-by-Week Plan */}
          <details>
            <summary className="cursor-pointer">
              <SectionHeader icon={CheckCircle2} title="Week-by-Week Plan" subtitle="6-week roadmap" />
            </summary>
            <div className="pl-1 pt-4 pb-2 space-y-4">
              {guide.weekByWeek.map((w, i) => (
                <div key={i} className="rounded-xl border border-t-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-[#f5a623]">{w.week}</span>
                    <span className="text-[10px] font-semibold text-t-text/30 uppercase">{w.focus}</span>
                  </div>
                  <ul className="space-y-1.5 mb-3">
                    {w.actions.map((a, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-t-text-muted">
                        <ChevronRight className="w-3 h-3 text-[#f5a623]/50 mt-0.5 shrink-0" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-2 pt-2 border-t border-t-border">
                    <Target className="w-3 h-3 text-emerald-400" />
                    <span className="text-[11px] font-semibold text-emerald-400">{w.milestone}</span>
                  </div>
                </div>
              ))}
            </div>
          </details>

          {/* Tools You Need */}
          <details>
            <summary className="cursor-pointer">
              <SectionHeader icon={Wrench} title="Tools You Need" subtitle="Stack and costs" />
            </summary>
            <div className="pl-1 pt-4 pb-2">
              <div className="space-y-2">
                {guide.toolsNeeded.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-t-border px-4 py-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-[11px] text-t-text-muted mt-0.5">{t.purpose}</p>
                    </div>
                    <span className="text-[11px] font-bold text-[#f5a623] shrink-0">{t.cost}</span>
                  </div>
                ))}
              </div>
            </div>
          </details>

          {/* Common Mistakes */}
          <details>
            <summary className="cursor-pointer">
              <SectionHeader icon={AlertTriangle} title="Common Mistakes" subtitle="Avoid these" />
            </summary>
            <div className="pl-1 pt-4 pb-2">
              <ol className="space-y-3">
                {guide.commonMistakes.map((m, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-red-500/10 border border-red-500/15 flex items-center justify-center text-[10px] font-black text-red-400 shrink-0">{i + 1}</span>
                    <p className="text-sm text-t-text-muted leading-relaxed pt-0.5">{m}</p>
                  </li>
                ))}
              </ol>
            </div>
          </details>

          {/* KPIs */}
          <details>
            <summary className="cursor-pointer">
              <SectionHeader icon={BarChart3} title="Your KPIs" subtitle="Track these metrics" />
            </summary>
            <div className="pl-1 pt-4 pb-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {guide.kpis.map((k, i) => (
                  <div key={i} className="rounded-xl border border-t-border p-4">
                    <p className="text-[10px] font-black text-t-text/30 uppercase mb-1">{k.metric}</p>
                    <p className="text-lg font-black text-[#f5a623]">{k.target}</p>
                    <p className="text-[11px] text-t-text-muted mt-1">{k.why}</p>
                  </div>
                ))}
              </div>
            </div>
          </details>

          {/* Himalaya Systems to Use */}
          <details>
            <summary className="cursor-pointer">
              <SectionHeader icon={Mountain} title="Himalaya Systems to Use" subtitle="Your tools inside the platform" />
            </summary>
            <div className="pl-1 pt-4 pb-2">
              <div className="space-y-2">
                {guide.systemsToUse.map((s, i) => (
                  <Link key={i} href={s.page}
                    className="flex items-center gap-3 rounded-xl border border-t-border px-4 py-3 hover:border-[#f5a623]/20 hover:bg-[#f5a623]/[0.03] transition group">
                    <div className="flex-1">
                      <p className="text-sm font-semibold group-hover:text-[#f5a623] transition">{s.label}</p>
                      <p className="text-[11px] text-t-text-muted mt-0.5">{s.why}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-t-text/20 group-hover:text-[#f5a623] transition" />
                  </Link>
                ))}
              </div>
            </div>
          </details>
        </div>
      </div>

      {/* Sticky CTA */}
      {firstSystem && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-t-border bg-t-bg/95 backdrop-blur-xl">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-black truncate">Ready to execute?</p>
              <p className="text-[10px] text-t-text-muted truncate">Start with: {firstSystem.label}</p>
            </div>
            <Link href={firstSystem.page}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-sm font-bold text-[#0c0a08] hover:opacity-90 transition shrink-0">
              Start Executing <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-t-border">
      <div className="w-8 h-8 rounded-lg bg-[#f5a623]/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-[#f5a623]" />
      </div>
      <div>
        <h2 className="text-base font-black">{title}</h2>
        {subtitle && <p className="text-[10px] text-t-text-muted">{subtitle}</p>}
      </div>
    </div>
  );
}
