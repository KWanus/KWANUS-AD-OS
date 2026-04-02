"use client";

import { useState, useEffect } from "react";
import { Loader2, GitCompare } from "lucide-react";

type RunSummary = {
  id: string;
  mode: string;
  title: string | null;
  inputUrl: string;
  score: number | null;
  verdict: string | null;
  createdAt: string;
};

type Props = {
  onSelect: (runA: string, runB: string) => void;
};

const SCORE_COLOR = (s: number) =>
  s >= 70 ? "text-emerald-400" : s >= 45 ? "text-amber-400" : "text-red-400";

export default function RunComparePicker({ onSelect }: Props) {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedA, setSelectedA] = useState<string | null>(null);
  const [selectedB, setSelectedB] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analyses?sortBy=createdAt&limit=50")
      .then((r) => r.json() as Promise<{ ok: boolean; analyses?: RunSummary[] }>)
      .then((data) => {
        if (data.ok && data.analyses) setRuns(data.analyses);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function handleCompare() {
    if (selectedA && selectedB) onSelect(selectedA, selectedB);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
      </div>
    );
  }

  if (runs.length < 2) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-white/30">You need at least 2 runs to compare</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        {/* Run A picker */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Run A</p>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {runs.map((run) => (
              <button
                key={run.id}
                onClick={() => setSelectedA(run.id)}
                disabled={run.id === selectedB}
                className={`w-full text-left p-3 rounded-xl border transition text-xs ${
                  selectedA === run.id
                    ? "bg-cyan-500/10 border-cyan-500/20"
                    : run.id === selectedB
                      ? "bg-white/[0.01] border-white/[0.03] opacity-30"
                      : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white/60 font-semibold truncate">{run.title || run.inputUrl}</span>
                  {run.score !== null && <span className={`font-black ${SCORE_COLOR(run.score)}`}>{run.score}</span>}
                </div>
                <div className="text-[10px] text-white/25 mt-1">{run.mode} · {run.verdict}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Run B picker */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Run B</p>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {runs.map((run) => (
              <button
                key={run.id}
                onClick={() => setSelectedB(run.id)}
                disabled={run.id === selectedA}
                className={`w-full text-left p-3 rounded-xl border transition text-xs ${
                  selectedB === run.id
                    ? "bg-purple-500/10 border-purple-500/20"
                    : run.id === selectedA
                      ? "bg-white/[0.01] border-white/[0.03] opacity-30"
                      : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white/60 font-semibold truncate">{run.title || run.inputUrl}</span>
                  {run.score !== null && <span className={`font-black ${SCORE_COLOR(run.score)}`}>{run.score}</span>}
                </div>
                <div className="text-[10px] text-white/25 mt-1">{run.mode} · {run.verdict}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleCompare}
        disabled={!selectedA || !selectedB}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-sm font-bold text-cyan-400 hover:bg-cyan-500/20 transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <GitCompare className="w-4 h-4" />
        Compare Runs
      </button>
    </div>
  );
}
