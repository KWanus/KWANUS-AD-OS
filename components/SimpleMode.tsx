"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mountain, Check, ChevronRight, Trophy, Flame, Copy,
  Globe, Zap, Mail, Play, DollarSign, ArrowRight,
  Loader2, Star,
} from "lucide-react";

type DayAction = {
  id: string;
  title: string;
  description: string;
  type: "post" | "check" | "share" | "setup" | "follow_up";
  content?: string;
  href?: string;
  completed: boolean;
  estimatedTime: string;
  whyItMatters?: string;
  canSkip?: boolean;
};

type SimpleData = {
  dayNumber: number;
  totalDays: number;
  streak: number;
  phase: string;
  phaseProgress: number;
  todaysActions: DayAction[];
  completedToday: number;
  totalToday: number;
  projectId?: string;
  projectName?: string;
  siteUrl?: string;
  totalRevenue: number;
  totalLeads: number;
  milestone?: { title: string; message: string };
};

export default function SimpleMode() {
  const [data, setData] = useState<SimpleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [cmdRes, projRes, successRes] = await Promise.allSettled([
        fetch("/api/himalaya/commands").then(r => r.json()),
        fetch("/api/himalaya/projects").then(r => r.json()),
        fetch("/api/himalaya/success").then(r => r.json()),
      ]);

      const cmds = cmdRes.status === "fulfilled" ? cmdRes.value : {};
      const projs = projRes.status === "fulfilled" ? projRes.value : {};
      const success = successRes.status === "fulfilled" ? successRes.value : {};

      const commands = (cmds.commands ?? []) as { id: string; action: string; details: string; estimatedTime: string; content?: string; href?: string; category?: string }[];
      const projects = (projs.projects ?? []) as { id: string; name: string; site?: { slug: string; published: boolean }; revenue: number; leadCount: number }[];
      const streak = cmds.stats?.streak ?? 0;

      const project = projects[0];
      const siteUrl = project?.site?.published ? `/s/${project.site.slug}` : undefined;

      const WHY_MAP: Record<string, string> = {
        post: "Every post is a chance to reach 1,000+ people for free. The algorithm rewards consistency.",
        check: "Knowing your numbers tells you what's working. Don't guess — look at the data.",
        share: "The more people who see your link, the more leads you get. Simple math.",
        setup: "This sets the foundation. Everything else builds on top of it.",
        follow_up: "80% of sales happen after the 5th follow-up. Most people quit after 1. Don't be most people.",
        review: "Everything is already built. You just need to approve it — small edits go a long way.",
      };

      const actions: DayAction[] = commands.slice(0, 5).map((cmd, i) => {
        const type = cmd.category === "post" ? "post" : cmd.category === "outreach" ? "follow_up" : cmd.category === "review" ? "check" : cmd.href ? "check" : "setup";
        return {
          id: cmd.id ?? `action-${i}`,
          title: cmd.action,
          description: cmd.details,
          type: type as DayAction["type"],
          content: cmd.content,
          href: cmd.href,
          completed: false,
          estimatedTime: cmd.estimatedTime ?? "5 min",
          whyItMatters: WHY_MAP[type] ?? "This moves your business forward.",
          canSkip: i > 0, // First action can't be skipped
        };
      });

      // If no commands, create default first actions
      if (actions.length === 0 && !project) {
        actions.push({
          id: "build",
          title: "Build your first business",
          description: "Type what you want to do. Himalaya creates your website, ads, emails, and content — all in 60 seconds.",
          type: "setup",
          href: "/himalaya",
          completed: false,
          estimatedTime: "2 min",
          whyItMatters: "This is the starting line. Everything else comes after this one step.",
          canSkip: false,
        });
      } else if (actions.length === 0) {
        actions.push(
          { id: "review", title: "Review your ads and scripts", description: "Himalaya already created your ads, scripts, and emails. Open your project and approve them — or edit anything you want to change.", type: "check", href: project?.id ? `/project/${project.id}` : "/", completed: false, estimatedTime: "3 min", whyItMatters: "Everything is already built for you. Just review, approve, and it goes live.", canSkip: false },
          { id: "share", title: "Share your site link with 5 people", description: `Text or DM this link to 5 people you know: ${siteUrl ?? "your site"}. Ask them to check it out.`, type: "share", completed: false, estimatedTime: "5 min", whyItMatters: "Your first visitors come from people you already know. This is the fastest way to get real feedback.", canSkip: false },
          { id: "post", title: "Record and post your first video", description: "Open your project → Scripts tab → pick Script #1. Record it on your phone (15 seconds). Post to TikTok + Instagram.", type: "post", href: project?.id ? `/project/${project.id}` : "/", completed: false, estimatedTime: "10 min", whyItMatters: "One viral video can bring 10,000 visitors. The algorithm rewards you for posting. Start today.", canSkip: true },
          { id: "check", title: "Check if anyone visited your site", description: "Open your project and check the analytics. Even 1 view means someone found you.", type: "check", href: project?.id ? `/project/${project.id}` : "/dashboard", completed: false, estimatedTime: "2 min", whyItMatters: "Knowing your numbers early builds good habits. The best entrepreneurs check daily.", canSkip: true },
        );
      }

      // Determine phase
      const totalRevenue = success.totalRevenue ?? 0;
      const totalLeads = success.totalLeads ?? 0;
      let phase = "Launch";
      let phaseProgress = 10;
      let dayNumber = Math.max(1, streak);

      if (totalRevenue > 0) { phase = "Making Money"; phaseProgress = 70; }
      else if (totalLeads > 5) { phase = "Getting Traction"; phaseProgress = 50; }
      else if (project) { phase = "First Traffic"; phaseProgress = 30; }

      setData({
        dayNumber,
        totalDays: 90,
        streak,
        phase,
        phaseProgress,
        todaysActions: actions,
        completedToday: 0,
        totalToday: actions.length,
        projectId: project?.id,
        projectName: project?.name,
        siteUrl,
        totalRevenue,
        totalLeads,
      });
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function completeAction(actionId: string) {
    setCompletingId(actionId);
    try {
      await fetch("/api/himalaya/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commandId: actionId }),
      });
    } catch { /* ignore */ }

    setData(prev => {
      if (!prev) return prev;
      const updated = prev.todaysActions.map(a =>
        a.id === actionId ? { ...a, completed: true } : a
      );
      const completedCount = updated.filter(a => a.completed).length;

      // Celebration!
      if (completedCount === updated.length) {
        setCelebration("All done for today! 🎉 You're crushing it.");
        setTimeout(() => setCelebration(null), 4000);
      } else {
        setCelebration("Nice! ✓ Keep going.");
        setTimeout(() => setCelebration(null), 2000);
      }

      return { ...prev, todaysActions: updated, completedToday: completedCount };
    });
    setCompletingId(null);
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-t-text-faint animate-spin" />
      </div>
    );
  }

  if (!data) return null;
  const d = data;
  const nextAction = d.todaysActions.find(a => !a.completed);

  const TYPE_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
    post: { icon: Play, color: "text-[#e07850]" },
    check: { icon: Globe, color: "text-blue-400" },
    share: { icon: ArrowRight, color: "text-emerald-400" },
    setup: { icon: Mountain, color: "text-[#f5a623]" },
    follow_up: { icon: Mail, color: "text-[#e07850]" },
  };

  return (
    <div className="max-w-md mx-auto">

      {/* Celebration overlay */}
      {celebration && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-emerald-500 text-white font-bold text-sm shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-bounce">
          {celebration}
        </div>
      )}

      {/* Progress header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-t-text-faint">Day {d.dayNumber}</span>
            <span className="text-xs text-t-text-faint">·</span>
            <span className="text-xs font-bold text-[#f5a623]">{d.phase}</span>
          </div>
          {d.streak > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/20">
              <Flame className="w-3 h-3 text-[#f5a623]" />
              <span className="text-[10px] font-bold text-[#f5a623]">{d.streak}</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-3 rounded-full bg-t-bg-card border border-t-border overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[#f5a623] to-[#e07850] transition-all duration-500"
            style={{ width: `${d.phaseProgress}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-t-text-faint">Start</span>
          <span className="text-[9px] text-t-text-faint">First Traffic</span>
          <span className="text-[9px] text-t-text-faint">Traction</span>
          <span className="text-[9px] text-t-text-faint">$$$</span>
        </div>
      </div>

      {/* Project hub link */}
      {d.projectId && (
        <Link href={`/project/${d.projectId}`}
          className="flex items-center justify-between rounded-xl border border-[#f5a623]/15 bg-[#f5a623]/[0.03] px-4 py-3 mb-4 group hover:border-[#f5a623]/25 transition">
          <div className="flex items-center gap-2.5">
            <Mountain className="w-4 h-4 text-[#f5a623]" />
            <div>
              <p className="text-xs font-bold">{d.projectName ?? "Your Business"}</p>
              <p className="text-[10px] text-t-text-faint">Site, ads, scripts, emails — all in one place</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#f5a623]/40 group-hover:text-[#f5a623] transition" />
        </Link>
      )}

      {/* Playbook link */}
      <Link href="/playbook"
        className="flex items-center justify-between rounded-xl border border-t-border bg-t-bg-raised px-4 py-3 mb-4 group hover:border-[#f5a623]/15 transition">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">📖</span>
          <div>
            <p className="text-xs font-bold">Your Playbook</p>
            <p className="text-[10px] text-t-text-faint">Step-by-step plan for your business type</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-t-text-faint/40 group-hover:text-t-text-faint transition" />
      </Link>

      {/* Stats row */}
      {(d.totalRevenue > 0 || d.totalLeads > 0) && (
        <div className="flex gap-3 mb-6">
          {d.totalRevenue > 0 && (
            <div className="flex-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-center">
              <DollarSign className="w-4 h-4 text-emerald-400 mx-auto mb-0.5" />
              <p className="text-lg font-black text-emerald-400">${d.totalRevenue.toLocaleString()}</p>
              <p className="text-[9px] text-emerald-400/60">Revenue</p>
            </div>
          )}
          {d.totalLeads > 0 && (
            <div className="flex-1 rounded-xl bg-t-bg-card border border-t-border px-3 py-2 text-center">
              <Star className="w-4 h-4 text-[#f5a623] mx-auto mb-0.5" />
              <p className="text-lg font-black">{d.totalLeads}</p>
              <p className="text-[9px] text-t-text-faint">Leads</p>
            </div>
          )}
        </div>
      )}

      {/* Today's completion */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-black">Today&apos;s Actions</p>
        <p className="text-xs text-t-text-faint">{d.completedToday}/{d.totalToday} done</p>
      </div>

      {/* Action list */}
      <div className="space-y-3">
        {d.todaysActions.map((action, i) => {
          const isNext = action === nextAction && !action.completed;
          const typeInfo = TYPE_ICONS[action.type] ?? TYPE_ICONS.check;
          const Icon = typeInfo.icon;

          return (
            <div key={action.id} className={`rounded-2xl border overflow-hidden transition-all ${
              action.completed ? "border-emerald-500/20 bg-emerald-500/[0.03] opacity-60" :
              isNext ? "border-[#f5a623]/25 bg-[#f5a623]/[0.04] shadow-[0_0_20px_rgba(245,166,35,0.08)]" :
              "border-t-border bg-t-bg-raised"
            }`}>
              <div className="px-4 py-4">
                <div className="flex items-start gap-3">
                  {/* Status circle */}
                  <button
                    onClick={() => !action.completed && void completeAction(action.id)}
                    disabled={action.completed || completingId === action.id}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition ${
                      action.completed ? "bg-emerald-500 border-emerald-500" :
                      isNext ? "border-[#f5a623] hover:bg-[#f5a623]/10" :
                      "border-t-border hover:border-t-border-strong"
                    }`}
                  >
                    {action.completed ? <Check className="w-4 h-4 text-white" /> :
                     completingId === action.id ? <Loader2 className="w-4 h-4 text-[#f5a623] animate-spin" /> :
                     <span className="text-xs font-black text-t-text-faint">{i + 1}</span>}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Icon className={`w-3.5 h-3.5 ${action.completed ? "text-emerald-400" : typeInfo.color}`} />
                      <span className="text-[10px] text-t-text-faint">{action.estimatedTime}</span>
                    </div>
                    <p className={`text-sm font-bold ${action.completed ? "line-through text-t-text-faint" : ""}`}>{action.title}</p>
                    <p className="text-xs text-t-text-faint mt-0.5">{action.description}</p>

                    {/* Content to copy */}
                    {action.content && !action.completed && (
                      <div className="mt-2 rounded-xl bg-t-bg-card border border-t-border px-3 py-2">
                        <p className="text-xs text-t-text-muted italic">&ldquo;{action.content}&rdquo;</p>
                        <button onClick={() => copy(action.content!, `action-${action.id}`)}
                          className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-[#f5a623]/60 hover:text-[#f5a623] transition">
                          {copiedId === `action-${action.id}` ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy to clipboard</>}
                        </button>
                      </div>
                    )}

                    {/* Why it matters */}
                    {action.whyItMatters && !action.completed && isNext && (
                      <div className="mt-2 flex items-start gap-2 rounded-lg bg-[#f5a623]/[0.04] border border-[#f5a623]/10 px-3 py-2">
                        <span className="text-[10px]">💡</span>
                        <p className="text-[11px] text-[#f5a623]/70 leading-relaxed">{action.whyItMatters}</p>
                      </div>
                    )}

                    {/* Action button + skip */}
                    <div className="flex items-center gap-2 mt-2">
                      {action.href && !action.completed && (
                        <Link href={action.href}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f5a623]/10 border border-[#f5a623]/20 text-xs font-bold text-[#f5a623] hover:bg-[#f5a623]/20 transition">
                          Open <ChevronRight className="w-3 h-3" />
                        </Link>
                      )}
                      {action.canSkip && !action.completed && (
                        <button onClick={() => void completeAction(action.id)}
                          className="text-[10px] text-t-text-faint hover:text-t-text-muted transition">
                          Skip for now →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mark done bar */}
              {isNext && !action.completed && (
                <button onClick={() => void completeAction(action.id)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#f5a623] to-[#e07850] text-sm font-bold text-[#0c0a08] hover:opacity-90 transition">
                  <Check className="w-4 h-4" /> Mark as Done
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* All done */}
      {d.completedToday === d.totalToday && d.totalToday > 0 && (
        <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6 text-center">
          <Trophy className="w-10 h-10 text-[#f5a623] mx-auto mb-3" />
          <h3 className="text-lg font-black">All done for today!</h3>
          <p className="text-sm text-t-text-muted mt-1">Come back tomorrow for your next set of actions.</p>
          <p className="text-xs text-[#f5a623] mt-2 font-bold">{d.streak + 1}-day streak! Keep going.</p>
        </div>
      )}
    </div>
  );
}
