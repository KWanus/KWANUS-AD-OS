"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  Loader2, CheckCircle2, Circle, ChevronRight, Lock, Trophy,
  Target, Zap, ArrowRight, BookOpen, Calendar,
} from "lucide-react";

type WeeklyTask = {
  id: string;
  week: number;
  title: string;
  description: string;
  category: "setup" | "content" | "traffic" | "sales" | "optimize";
  estimatedTime: string;
  priority: 1 | 2 | 3;
  href?: string;
  completed: boolean;
  completedAt?: string;
};

type WeeklyPlaybook = {
  week: number;
  title: string;
  goal: string;
  tasks: WeeklyTask[];
  unlocked: boolean;
  completionRate: number;
};

type PlaybookProgress = {
  ok: boolean;
  currentWeek: number;
  totalWeeks: number;
  bizType: string;
  weeks: WeeklyPlaybook[];
  overallCompletion: number;
  readyToAdvance: boolean;
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  setup: { bg: "bg-blue-400/10", text: "text-blue-400", border: "border-blue-400/20" },
  content: { bg: "bg-purple-400/10", text: "text-purple-400", border: "border-purple-400/20" },
  traffic: { bg: "bg-[#f5a623]/10", text: "text-[#f5a623]", border: "border-[#f5a623]/20" },
  sales: { bg: "bg-emerald-400/10", text: "text-emerald-400", border: "border-emerald-400/20" },
  optimize: { bg: "bg-pink-400/10", text: "text-pink-400", border: "border-pink-400/20" },
};

export default function PlaybookTasksPage() {
  const [progress, setProgress] = useState<PlaybookProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/playbook/tasks");
      const data = await res.json() as PlaybookProgress;
      if (data.ok) {
        setProgress(data);
        setSelectedWeek(data.currentWeek);
      }
    } finally {
      setLoading(false);
    }
  }

  async function toggleTask(taskId: string, completed: boolean) {
    setToggling(taskId);
    try {
      await fetch("/api/playbook/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, completed: !completed }),
      });
      await load();
    } finally {
      setToggling(null);
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

  if (!progress) {
    return (
      <main className="min-h-screen bg-t-bg text-t-text">
        <AppNav />
        <div className="flex flex-col items-center justify-center min-h-[75vh] gap-4">
          <p className="text-sm text-t-text-muted">No playbook available. Complete onboarding first.</p>
          <Link href="/himalaya" className="text-xs text-[#f5a623] hover:underline">Go to Himalaya</Link>
        </div>
      </main>
    );
  }

  const currentWeekData = progress.weeks.find(w => w.week === progress.currentWeek);
  const selectedWeekData = progress.weeks.find(w => w.week === selectedWeek);

  return (
    <main className="min-h-screen bg-t-bg text-t-text">
      <AppNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-28">

        {/* Header */}
        <div className="pt-10 pb-6">
          <div className="flex items-center gap-2 text-[#f5a623] mb-3">
            <BookOpen className="w-4 h-4" />
            <span className="text-[10px] font-black tracking-widest uppercase">6-WEEK PLAYBOOK</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-2">
            {progress.bizType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())} Roadmap
          </h1>
          <p className="text-sm text-t-text-muted">
            Week {progress.currentWeek} of {progress.totalWeeks} · {progress.overallCompletion}% complete overall
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8 rounded-2xl border border-t-border bg-t-bg-raised p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold">Overall Progress</p>
            <p className="text-sm font-black text-[#f5a623]">{progress.overallCompletion}%</p>
          </div>
          <div className="h-2 rounded-full bg-t-bg-card overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#f5a623] to-[#e07850] transition-all duration-500"
              style={{ width: `${progress.overallCompletion}%` }}
            />
          </div>
        </div>

        {/* Ready to advance banner */}
        {progress.readyToAdvance && (
          <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5">
            <div className="flex items-start gap-3">
              <Trophy className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-black text-emerald-400 mb-1">
                  Week {progress.currentWeek} Complete! 🎉
                </p>
                <p className="text-xs text-t-text-muted">
                  You've finished {currentWeekData?.completionRate}% of this week's tasks. You're ready to advance to Week {progress.currentWeek + 1}.
                  The system will automatically unlock next week's tasks.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Week selector */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {progress.weeks.map((week) => (
            <button
              key={week.week}
              onClick={() => week.unlocked && setSelectedWeek(week.week)}
              disabled={!week.unlocked}
              className={`shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border transition ${
                selectedWeek === week.week
                  ? "border-[#f5a623] bg-[#f5a623]/10"
                  : week.unlocked
                  ? "border-t-border bg-t-bg-raised hover:border-[#f5a623]/30"
                  : "border-t-border bg-t-bg-card opacity-40 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center gap-2">
                {week.unlocked ? (
                  week.completionRate === 100 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-[#f5a623]" />
                  )
                ) : (
                  <Lock className="w-4 h-4 text-t-text-faint" />
                )}
                <span className="text-xs font-black">Week {week.week}</span>
              </div>
              <p className="text-[10px] text-t-text-muted">{week.completionRate}%</p>
            </button>
          ))}
        </div>

        {/* Selected week content */}
        {selectedWeekData && (
          <div className="space-y-4">
            {/* Week header */}
            <div className="rounded-2xl border border-t-border bg-t-bg-raised p-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-xl font-black mb-1">{selectedWeekData.title}</h2>
                  <p className="text-sm text-t-text-muted">{selectedWeekData.goal}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-[#f5a623]">{selectedWeekData.completionRate}%</p>
                  <p className="text-[10px] text-t-text-faint">
                    {selectedWeekData.tasks.filter(t => t.completed).length} / {selectedWeekData.tasks.length}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-1.5 rounded-full bg-t-bg-card overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#f5a623] to-[#e07850] transition-all duration-300"
                  style={{ width: `${selectedWeekData.completionRate}%` }}
                />
              </div>
            </div>

            {/* Task list */}
            <div className="space-y-3">
              {selectedWeekData.tasks
                .sort((a, b) => a.priority - b.priority)
                .map((task) => {
                  const categoryStyle = CATEGORY_COLORS[task.category] ?? CATEGORY_COLORS.setup;
                  const isToggling = toggling === task.id;

                  return (
                    <div
                      key={task.id}
                      className={`rounded-2xl border transition ${
                        task.completed
                          ? "border-emerald-500/20 bg-emerald-500/[0.03]"
                          : "border-t-border bg-t-bg-raised hover:border-[#f5a623]/20"
                      }`}
                    >
                      <div className="p-5">
                        <div className="flex items-start gap-4">
                          {/* Checkbox */}
                          <button
                            onClick={() => void toggleTask(task.id, task.completed)}
                            disabled={isToggling || !selectedWeekData.unlocked}
                            className="shrink-0 mt-0.5"
                          >
                            {isToggling ? (
                              <Loader2 className="w-5 h-5 text-[#f5a623] animate-spin" />
                            ) : task.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <Circle className="w-5 h-5 text-t-text-faint hover:text-[#f5a623] transition" />
                            )}
                          </button>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h3
                                className={`text-sm font-bold ${
                                  task.completed ? "text-t-text-muted line-through" : "text-t-text"
                                }`}
                              >
                                {task.title}
                              </h3>
                              <div className="flex items-center gap-2 shrink-0">
                                {/* Priority */}
                                {task.priority === 1 && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-400/10 border border-red-400/20 text-[9px] font-black text-red-400 uppercase">
                                    <Zap className="w-2.5 h-2.5" /> Critical
                                  </span>
                                )}
                                {/* Category */}
                                <span
                                  className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
                                >
                                  {task.category}
                                </span>
                                {/* Time */}
                                <span className="text-[10px] text-t-text-faint">{task.estimatedTime}</span>
                              </div>
                            </div>
                            <p className={`text-xs leading-relaxed ${task.completed ? "text-t-text-faint" : "text-t-text-muted"}`}>
                              {task.description}
                            </p>
                            {task.href && !task.completed && (
                              <Link
                                href={task.href}
                                className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-[#f5a623] hover:text-[#e07850] transition"
                              >
                                Go to tool <ArrowRight className="w-3 h-3" />
                              </Link>
                            )}
                            {task.completed && task.completedAt && (
                              <p className="text-[10px] text-emerald-400/60 mt-2">
                                ✓ Completed {new Date(task.completedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 rounded-2xl border border-[#f5a623]/15 bg-gradient-to-br from-[#f5a623]/[0.06] to-transparent p-6 text-center">
          <Target className="w-8 h-8 text-[#f5a623] mx-auto mb-3" />
          <h3 className="text-lg font-black mb-2">Stay Consistent</h3>
          <p className="text-sm text-t-text-muted mb-4">
            The playbook only works if you work the playbook. Check off one task per day. In 6 weeks, you'll have a real business.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-t-text-faint">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#f5a623]" />
              <span>Daily progress beats perfect execution</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
