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
      <div className="flex items-center justify-center rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent py-16">
        <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
      </div>
    );
  }

  if (runs.length < 2) {
    return (
      <div className="rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent py-16 text-center">
        <p className="text-sm text-white/30">You need at least 2 runs to compare</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent p-4 sm:p-5">
      <div className="mb-4 grid grid-cols-1 gap-3 rounded-2xl border border-white/[0.05] bg-black/20 p-4 sm:grid-cols-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/20">Step 1</p>
          <p className="mt-1 text-sm font-bold text-white/65">Pick your baseline</p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/20">Step 2</p>
          <p className="mt-1 text-sm font-bold text-white/65">Choose the run to compare against it</p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/20">Step 3</p>
          <p className="mt-1 text-sm font-bold text-white/65">Review score, priorities, assets, and notes side by side</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Run A picker */}
        <div>
          <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-white/30">Run A</p>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {runs.map((run) => (
              <button
                key={run.id}
                onClick={() => setSelectedA(run.id)}
                disabled={run.id === selectedB}
                className={`w-full rounded-xl border p-3 text-left text-xs transition ${
                  selectedA === run.id
                    ? "border-[#f5a623]/20 bg-[#f5a623]/10"
                    : run.id === selectedB
                      ? "border-white/[0.03] bg-white/[0.01] opacity-30"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0 flex-1 text-white/60 font-semibold sm:truncate">{run.title || run.inputUrl}</span>
                  {run.score !== null && <span className={`font-black ${SCORE_COLOR(run.score)}`}>{run.score}</span>}
                </div>
                <div className="text-[10px] text-white/25 mt-1">{run.mode} · {run.verdict}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Run B picker */}
        <div>
          <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-white/30">Run B</p>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {runs.map((run) => (
              <button
                key={run.id}
                onClick={() => setSelectedB(run.id)}
                disabled={run.id === selectedA}
                className={`w-full rounded-xl border p-3 text-left text-xs transition ${
                  selectedB === run.id
                    ? "border-purple-500/20 bg-purple-500/10"
                    : run.id === selectedA
                      ? "border-white/[0.03] bg-white/[0.01] opacity-30"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0 flex-1 text-white/60 font-semibold sm:truncate">{run.title || run.inputUrl}</span>
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
        className="inline-flex items-center gap-2 rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/10 px-5 py-2.5 text-sm font-bold text-[#f5a623] transition hover:bg-[#f5a623]/20 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <GitCompare className="w-4 h-4" />
        Compare Runs
      </button>
    </div>
  );
}
