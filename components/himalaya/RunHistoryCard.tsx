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
      className="block bg-white/[0.02] border border-white/[0.07] rounded-xl p-4 hover:bg-white/[0.04] hover:border-white/[0.12] transition group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">
              {MODE_LABEL[run.mode] ?? run.mode}
            </span>
            {run.verdict && (
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${VERDICT_STYLE[run.verdict] ?? "bg-white/5 border-white/10 text-white/40"}`}>
                {run.verdict}
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-white/70 truncate mb-1">
            {run.title || run.inputUrl}
          </h3>
          {run.summary && (
            <p className="text-xs text-white/40 leading-relaxed line-clamp-2">{run.summary}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
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
              <span className="inline-flex items-center gap-0.5 text-[9px] text-cyan-400/50">
                <PlayCircle className="w-2.5 h-2.5" />
                {run.executionState.steps.filter((s) => s.status === "done").length}/{run.executionState.steps.length} steps
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {run.score !== null && (
            <span className={`text-lg font-black ${SCORE_COLOR(run.score)}`}>{run.score}</span>
          )}
          <ArrowRight className="w-4 h-4 text-white/10 group-hover:text-white/30 transition" />
        </div>
      </div>
    </Link>
  );
}
