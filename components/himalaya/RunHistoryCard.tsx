"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Pin, CheckCircle, PlayCircle } from "lucide-react";

type RunSummary = {
  id: string;
  mode: string;
  title: string | null;
  inputUrl: string;
  score: number | null;
  verdict: string | null;
  summary: string | null;
  pinned?: boolean;
  executionState?: { steps?: { status: string }[]; completedAt?: string | null } | null;
  createdAt: string;
};

const SCORE_COLOR = (s: number) =>
  s >= 70 ? "text-emerald-400" : s >= 45 ? "text-amber-400" : "text-red-400";

const MODE_LABEL: Record<string, string> = {
  operator: "Scratch",
  consultant: "Improve",
};

const VERDICT_STYLE: Record<string, string> = {
  Pursue: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  Consider: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  Reject: "bg-red-500/10 border-red-500/20 text-red-400",
};

export default function RunHistoryCard({ run }: { run: RunSummary }) {
  return (
    <Link
      href={`/himalaya/run/${run.id}`}
      className="group block rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.03] via-white/[0.02] to-transparent p-4 transition hover:border-white/[0.12] hover:bg-white/[0.04]"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">
              {MODE_LABEL[run.mode] ?? run.mode}
            </span>
            {run.verdict && (
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${VERDICT_STYLE[run.verdict] ?? "bg-white/5 border-white/10 text-white/40"}`}>
                {run.verdict}
              </span>
            )}
          </div>
          <h3 className="mb-1 text-sm font-bold text-white/70 sm:truncate">
            {run.title || run.inputUrl}
          </h3>
          {run.summary && (
            <p className="text-xs text-white/40 leading-relaxed line-clamp-2">{run.summary}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-[10px] text-white/20">
              {formatDistanceToNow(new Date(run.createdAt), { addSuffix: true })}
            </p>
            {run.pinned && (
              <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-400/50">
                <Pin className="w-2.5 h-2.5" /> Pinned
              </span>
            )}
            {run.executionState?.completedAt && (
              <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-400/50">
                <CheckCircle className="w-2.5 h-2.5" /> Executed
              </span>
            )}
            {run.executionState && !run.executionState.completedAt && run.executionState.steps && (
              <span className="inline-flex items-center gap-0.5 text-[9px] text-[#f5a623]/50">
                <PlayCircle className="w-2.5 h-2.5" />
                {run.executionState.steps.filter((s) => s.status === "done").length}/{run.executionState.steps.length} steps
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 sm:shrink-0 sm:justify-start">
          {run.score !== null ? (
            <div className="rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Score</p>
              <span className={`text-lg font-black ${SCORE_COLOR(run.score)}`}>{run.score}</span>
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.05] bg-black/20 px-3 py-2 text-[10px] text-white/20">
              No score
            </div>
          )}
          <ArrowRight className="h-4 w-4 text-white/10 transition group-hover:text-white/30" />
        </div>
      </div>
    </Link>
  );
}
