"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, Lightbulb, Zap } from "lucide-react";

type OutcomePatterns = Record<string, number>;

type Props = {
  mode: string;
};

function generateInsights(patterns: OutcomePatterns, mode: string): string[] {
  const insights: string[] = [];

  const improved = patterns[`${mode}_improved`] ?? 0;
  const noChange = patterns[`${mode}_no_change`] ?? 0;
  const worse = patterns[`${mode}_worse`] ?? 0;
  const notDone = patterns[`${mode}_not_done`] ?? 0;
  const total = improved + noChange + worse + notDone;

  if (total === 0) return [];

  const successRate = total > 0 ? Math.round((improved / total) * 100) : 0;

  if (improved > 0 && successRate >= 60) {
    insights.push(`${successRate}% of your past ${mode === "consultant" ? "improvements" : "foundations"} led to better results — keep executing.`);
  }

  if (noChange > 1) {
    insights.push(`${noChange} past runs showed no change — consider different strategies or check if changes were fully applied.`);
  }

  if (worse > 0) {
    insights.push(`Some past changes made things worse — review those runs to understand what to avoid.`);
  }

  if (notDone > 2) {
    insights.push(`${notDone} runs haven't been implemented yet — start with the highest-scoring one first.`);
  }

  if (improved > 2) {
    insights.push(`You have a strong track record. Trust the system's recommendations and focus on execution speed.`);
  }

  return insights.slice(0, 3);
}

export default function AdaptiveInsights({ mode }: Props) {
  const [insights, setInsights] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/himalaya/memory")
      .then((r) => r.json() as Promise<{ ok: boolean; memory?: { regenCounts?: { outcomePatterns?: OutcomePatterns } } | null }>)
      .then((data) => {
        if (data.ok && data.memory?.regenCounts?.outcomePatterns) {
          const generated = generateInsights(data.memory.regenCounts.outcomePatterns, mode);
          setInsights(generated);
        }
      })
      .catch(() => {});
  }, [mode]);

  if (insights.length === 0 || dismissed) return null;

  return (
    <div className="rounded-2xl border border-[#e07850]/10 bg-gradient-to-br from-[#e07850]/[0.05] via-[#e07850]/[0.025] to-[#f5a623]/[0.04] p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-[#e07850]/50" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/25">Based on Your History</span>
        </div>
        <button onClick={() => setDismissed(true)} className="shrink-0 text-[10px] text-white/15 transition hover:text-white/30">
          dismiss
        </button>
      </div>
      <ul className="space-y-2">
        {insights.map((insight, i) => (
          <li key={i} className="flex items-start gap-2 rounded-xl border border-white/[0.05] bg-black/20 px-3 py-3 text-xs text-white/40">
            <Lightbulb className="w-3 h-3 text-[#e07850]/40 shrink-0 mt-0.5" />
            {insight}
          </li>
        ))}
      </ul>
      <Link
        href="/himalaya/upgrade"
        className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#e07850]/40 transition hover:text-[#e07850]/70"
      >
        <Zap className="w-2.5 h-2.5" /> These insights get sharper with more data — upgrade for full tracking
      </Link>
    </div>
  );
}
