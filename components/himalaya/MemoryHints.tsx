"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Brain, ExternalLink } from "lucide-react";

type Memory = {
  lastNiche: string | null;
  lastMode: string | null;
  lastInputUrl: string | null;
  lastPresetId: string | null;
  preferredExport: string | null;
  regenCounts: Record<string, number> | null;
};

type Props = {
  onApplyUrl?: (url: string) => void;
  onApplyMode?: (mode: string) => void;
};

export default function MemoryHints({ onApplyUrl, onApplyMode }: Props) {
  const [memory, setMemory] = useState<Memory | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/himalaya/memory")
      .then((r) => r.json() as Promise<{ ok: boolean; memory?: Memory | null }>)
      .then((data) => {
        if (data.ok && data.memory) setMemory(data.memory);
      })
      .catch(console.error);
  }, []);

  if (!memory || dismissed) return null;

  const hasHints = memory.lastInputUrl || memory.lastMode || memory.lastNiche;
  if (!hasHints) return null;

  const mostRegenerated = memory.regenCounts
    ? Object.entries(memory.regenCounts).sort((a, b) => b[1] - a[1])[0]
    : null;

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Brain className="w-3 h-3 text-purple-400/50" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Remembered</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-[10px] text-white/15 hover:text-white/40 transition"
        >
          dismiss
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {memory.lastInputUrl && (
          <button
            onClick={() => onApplyUrl?.(memory.lastInputUrl!)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/5 border border-purple-500/10 text-[10px] text-white/40 hover:text-white/60 transition"
          >
            <ExternalLink className="w-2.5 h-2.5" />
            Last URL: {memory.lastInputUrl.replace(/^https?:\/\//, "").slice(0, 30)}
          </button>
        )}

        {memory.lastMode && (
          <button
            onClick={() => onApplyMode?.(memory.lastMode!)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/5 border border-purple-500/10 text-[10px] text-white/40 hover:text-white/60 transition"
          >
            Last mode: {memory.lastMode === "consultant" ? "Improve" : "Scratch"}
          </button>
        )}

        {memory.lastNiche && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/[0.02] border border-white/[0.05] text-[10px] text-white/25">
            Niche: {memory.lastNiche}
          </span>
        )}

        {mostRegenerated && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/[0.02] border border-white/[0.05] text-[10px] text-white/25">
            Most regenerated: {mostRegenerated[0]} ({mostRegenerated[1]}x)
          </span>
        )}

        {memory.preferredExport && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/[0.02] border border-white/[0.05] text-[10px] text-white/25">
            Preferred export: {memory.preferredExport}
          </span>
        )}
      </div>

      <div className="flex gap-2 mt-2">
        <Link
          href="/himalaya/templates"
          className="text-[10px] text-cyan-400/40 hover:text-cyan-400/70 transition"
        >
          View Templates
        </Link>
      </div>
    </div>
  );
}
