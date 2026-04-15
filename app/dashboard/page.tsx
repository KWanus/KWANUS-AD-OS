"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  DollarSign, Users, Globe, Mail, TrendingUp, Target,
  CheckCircle2, AlertTriangle, ArrowRight, Loader2,
  Trophy, Flame, BarChart2, Zap, Mountain,
} from "lucide-react";

type DashboardData = {
  // Success metrics
  totalRevenue: number;
  totalLeads: number;
  totalSiteViews: number;
  activeEmailFlows: number;
  activeCampaigns: number;
  conversionRate: number;
  streak: number;
  isActuallyMakingMoney: boolean;
  nextMilestone: string;

  // Maturity
  maturity?: { stage: string; score: number; nextMilestone: string; dimensions: { name: string; score: number; status: string }[] };

  // Funnel
  funnel?: { stages: { name: string; count: number; dropoffPercent: number }[]; biggestLeak: string; fix: string };

  // Commands
  commands?: { id: string; priority: number; action: string; details: string; estimatedTime: string; content?: string; href?: string }[];
  commandGreeting?: string;

  // Milestones
  milestones?: { id: string; title: string; achieved: boolean; celebrationMessage: string }[];
  nextBadge?: { title: string; description: string } | null;

  // Health
  health?: { overall: string; checks: { name: string; status: string; detail: string }[] };

  // Advisor
  advisor?: { topPriority: string; reasoning: string; actions: string[]; avoid: string[] };
};

export default function DashboardPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace("/sign-in");
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!isSignedIn) return;

    Promise.allSettled([
      fetch("/api/himalaya/success").then(r => r.json()),
      fetch("/api/himalaya/maturity").then(r => r.json()),
      fetch("/api/himalaya/funnel").then(r => r.json()),
      fetch("/api/himalaya/commands").then(r => r.json()),
      fetch("/api/himalaya/milestones").then(r => r.json()),
      fetch("/api/himalaya/health").then(r => r.json()),
      fetch("/api/himalaya/advisor").then(r => r.json()),
    ]).then(([success, maturity, funnel, commands, milestones, health, advisor]) => {
      const s = success.status === "fulfilled" ? success.value : {};
      const m = maturity.status === "fulfilled" ? maturity.value : {};
      const f = funnel.status === "fulfilled" ? funnel.value : {};
      const c = commands.status === "fulfilled" ? commands.value : {};
      const mi = milestones.status === "fulfilled" ? milestones.value : {};
      const h = health.status === "fulfilled" ? health.value : {};
      const a = advisor.status === "fulfilled" ? advisor.value : {};

      setData({
        totalRevenue: s.totalRevenue ?? 0,
        totalLeads: s.totalLeads ?? 0,
        totalSiteViews: s.totalSiteViews ?? 0,
        activeEmailFlows: s.activeEmailFlows ?? 0,
        activeCampaigns: s.activeCampaigns ?? 0,
        conversionRate: s.conversionRate ?? 0,
        streak: s.streak ?? 0,
        isActuallyMakingMoney: s.isActuallyMakingMoney ?? false,
        nextMilestone: s.nextMilestone ?? "",
        maturity: m.maturity ?? undefined,
        funnel: f.ok ? f : undefined,
        commands: c.commands ?? [],
        commandGreeting: c.greeting ?? "",
        milestones: mi.milestones ?? [],
        nextBadge: mi.next ?? null,
        health: h.ok ? h : undefined,
        advisor: a.ok ? a : undefined,
      });
    }).finally(() => setLoading(false));
  }, [isSignedIn]);

  if (!isLoaded || !isSignedIn) return null;
  const name = user?.firstName ?? "there";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0c0a08] text-white">
        <AppNav />
        <div className="flex items-center justify-center min-h-[70vh]">
          <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
        </div>
      </main>
    );
  }

  if (!data) return null;
  const d = data;

  return (
    <main className="min-h-screen bg-[#0c0a08] text-white">
      <AppNav />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">

        {/* ── Greeting + Score ── */}
        <div className="pt-8 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-white">
                {d.commandGreeting || `Hey ${name}. Here's your business.`}
              </h1>
              {d.maturity && (
                <p className="text-xs text-white/30 mt-1">
                  Stage: <span className="text-white/50 font-bold capitalize">{d.maturity.stage}</span> · Score: {d.maturity.score}/100
                </p>
              )}
            </div>
            {d.streak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f5a623]/10 border border-[#f5a623]/20">
                <Flame className="w-3.5 h-3.5 text-[#f5a623]" />
                <span className="text-xs font-bold text-[#f5a623]">{d.streak}-day streak</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Key Metrics ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          <MetricCard icon={DollarSign} label="Revenue" value={`$${d.totalRevenue.toLocaleString()}`} color="text-emerald-400" highlight={d.isActuallyMakingMoney} />
          <MetricCard icon={Users} label="Leads" value={String(d.totalLeads)} color="text-[#f5a623]" />
          <MetricCard icon={Globe} label="Site Views" value={d.totalSiteViews.toLocaleString()} color="text-[#e07850]" />
          <MetricCard icon={BarChart2} label="Conversion" value={`${d.conversionRate}%`} color="text-blue-400" />
        </div>

        {/* ── Next Milestone ── */}
        {d.nextMilestone && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 mb-6 flex items-center gap-3">
            <Target className="w-4 h-4 text-[#f5a623]/60 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-white/20">NEXT MILESTONE</p>
              <p className="text-sm font-bold text-white/60">{d.nextMilestone}</p>
            </div>
          </div>
        )}

        {/* ── Strategic Advisor ── */}
        {d.advisor && (
          <div className="rounded-xl border border-[#f5a623]/10 bg-[#f5a623]/[0.03] px-4 py-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Mountain className="w-4 h-4 text-[#f5a623]/60" />
              <p className="text-[10px] font-bold text-[#f5a623]/60">HIMALAYA ADVISOR</p>
            </div>
            <p className="text-sm font-bold text-white mb-1">{d.advisor.topPriority}</p>
            <p className="text-xs text-white/30 mb-3">{d.advisor.reasoning}</p>
            <div className="flex flex-wrap gap-2">
              {d.advisor.actions.map((a, i) => (
                <span key={i} className="text-[10px] px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40">{a}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── Daily Commands ── */}
        {d.commands && d.commands.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] font-bold text-white/15 mb-2">TODAY&apos;S COMMANDS</p>
            <div className="space-y-2">
              {d.commands.slice(0, 5).map((cmd, i) => (
                <div key={cmd.id} className={`rounded-xl border px-4 py-3 ${cmd.priority === 1 ? "border-[#f5a623]/15 bg-[#f5a623]/[0.03]" : "border-white/[0.04]"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${cmd.priority === 1 ? "border-[#f5a623]/30 text-[#f5a623]" : "border-white/[0.08] text-white/20"}`}>
                        <span className="text-[9px] font-black">{i + 1}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white">{cmd.action}</p>
                        <p className="text-[11px] text-white/25 mt-0.5">{cmd.details}</p>
                        {cmd.content && (
                          <div className="mt-2 rounded-lg bg-white/[0.03] border border-white/[0.04] px-3 py-2">
                            <p className="text-[11px] text-white/40 italic">&ldquo;{cmd.content}&rdquo;</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] text-white/15">{cmd.estimatedTime}</span>
                      {cmd.href && (
                        <Link href={cmd.href} className="text-[10px] font-bold text-[#f5a623]/60 hover:text-[#f5a623] transition">Do it →</Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Funnel Health ── */}
        {d.funnel && d.funnel.stages && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4 mb-6">
            <p className="text-[10px] font-bold text-white/15 mb-3">FUNNEL HEALTH</p>
            <div className="flex items-end gap-1 h-16 mb-2">
              {d.funnel.stages.map((stage, i) => {
                const maxCount = Math.max(...d.funnel!.stages.map(s => s.count), 1);
                const height = Math.max((stage.count / maxCount) * 100, 5);
                const colors = ["bg-[#f5a623]", "bg-blue-400", "bg-violet-400", "bg-emerald-400"];
                return (
                  <div key={stage.name} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-full rounded-t ${colors[i % colors.length]}`} style={{ height: `${height}%` }} />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1">
              {d.funnel.stages.map((stage, i) => (
                <div key={stage.name} className="flex-1 text-center">
                  <p className="text-lg font-black text-white">{stage.count}</p>
                  <p className="text-[9px] text-white/20">{stage.name}</p>
                  {stage.dropoffPercent > 0 && (
                    <p className="text-[8px] text-red-400/50">-{stage.dropoffPercent}%</p>
                  )}
                </div>
              ))}
            </div>
            {d.funnel.biggestLeak && d.funnel.biggestLeak !== "No data yet" && (
              <div className="mt-3 flex items-start gap-2 px-1">
                <AlertTriangle className="w-3 h-3 text-[#f5a623]/50 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-[#f5a623]/60">Biggest leak: {d.funnel.biggestLeak}</p>
                  <p className="text-[10px] text-white/20">{d.funnel.fix}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── System Health ── */}
        {d.health && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-white/15">SYSTEM HEALTH</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                d.health.overall === "healthy" ? "bg-emerald-500/10 text-emerald-400" :
                d.health.overall === "degraded" ? "bg-[#f5a623]/10 text-[#f5a623]" :
                "bg-red-500/10 text-red-400"
              }`}>{d.health.overall}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {d.health.checks.map(check => (
                <div key={check.name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.02]">
                  <div className={`w-1.5 h-1.5 rounded-full ${check.status === "ok" ? "bg-emerald-400" : check.status === "warning" ? "bg-amber-400" : "bg-red-400"}`} />
                  <span className="text-[10px] text-white/40">{check.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Badges ── */}
        {d.milestones && d.milestones.filter(m => m.achieved).length > 0 && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4 mb-6">
            <p className="text-[10px] font-bold text-white/15 mb-2">ACHIEVEMENTS</p>
            <div className="flex flex-wrap gap-2">
              {d.milestones.filter(m => m.achieved).slice(0, 8).map(m => (
                <div key={m.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#f5a623]/5 border border-[#f5a623]/10">
                  <Trophy className="w-3 h-3 text-[#f5a623]" />
                  <span className="text-[10px] font-bold text-[#f5a623]/60">{m.title}</span>
                </div>
              ))}
            </div>
            {d.nextBadge && (
              <p className="text-[9px] text-white/15 mt-2">Next: {d.nextBadge.title} — {d.nextBadge.description}</p>
            )}
          </div>
        )}

        {/* ── Quick Access ── */}
        <div className="mb-6">
          <p className="text-[10px] font-bold text-white/15 mb-2">MANAGE</p>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { l: "Campaigns", h: "/campaigns", i: Zap, c: "text-[#f5a623]" },
              { l: "Sites", h: "/websites", i: Globe, c: "text-[#e07850]" },
              { l: "Emails", h: "/emails", i: Mail, c: "text-blue-400" },
              { l: "CRM", h: "/clients", i: Users, c: "text-emerald-400" },
              { l: "Ads", h: "/ads", i: TrendingUp, c: "text-[#f5a623]" },
              { l: "Revenue", h: "/revenue", i: DollarSign, c: "text-pink-400" },
            ].map(item => (
              <Link key={item.l} href={item.h} className="flex items-center gap-2 rounded-lg border border-white/[0.04] px-3 py-2.5 hover:border-white/[0.08] transition group">
                <item.i className={`w-3.5 h-3.5 ${item.c}`} />
                <span className="text-[11px] font-semibold text-white/35 group-hover:text-white/60 transition">{item.l}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Build New ── */}
        <div className="text-center">
          <Link href="/himalaya" className="inline-flex items-center gap-2 text-[11px] text-white/15 hover:text-white/35 transition">
            <Mountain className="w-3 h-3" /> Build another business <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </main>
  );
}

function MetricCard({ icon: Icon, label, value, color, highlight }: {
  icon: React.ElementType; label: string; value: string; color: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border px-3 py-3 ${highlight ? "border-emerald-500/20 bg-emerald-500/[0.04]" : "border-white/[0.06] bg-white/[0.02]"}`}>
      <Icon className={`w-3.5 h-3.5 ${color} mb-1`} />
      <p className="text-xl font-black text-white">{value}</p>
      <p className="text-[9px] text-white/20">{label}</p>
    </div>
  );
}
