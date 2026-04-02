"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Lightbulb } from "lucide-react";

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
    <div className="bg-gradient-to-br from-purple-500/[0.03] to-cyan-500/[0.03] border border-purple-500/10 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-purple-400/50" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/25">Based on Your History</span>
        </div>
        <button onClick={() => setDismissed(true)} className="text-[10px] text-white/15 hover:text-white/30 transition">
          dismiss
        </button>
      </div>
      <ul className="space-y-1.5">
        {insights.map((insight, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-white/40">
            <Lightbulb className="w-3 h-3 text-purple-400/40 shrink-0 mt-0.5" />
            {insight}
          </li>
        ))}
      </ul>
    </div>
  );
}
