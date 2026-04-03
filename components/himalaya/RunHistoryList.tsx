"use client";

import { useState, useEffect } from "react";
import { Loader2, Inbox } from "lucide-react";
import Link from "next/link";
import RunHistoryCard from "./RunHistoryCard";

type RunSummary = {
  id: string;
  mode: string;
  title: string | null;
  inputUrl: string;
  score: number | null;
  verdict: string | null;
  summary: string | null;
  createdAt: string;
};

type FilterMode = "all" | "operator" | "consultant";

export default function RunHistoryList() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>("all");

  useEffect(() => {
    const params = new URLSearchParams({ sortBy: "createdAt", limit: "50" });
    if (filter !== "all") params.set("mode", filter);

    fetch(`/api/analyses?${params.toString()}`)
      .then((r) => r.json() as Promise<{ ok: boolean; analyses?: RunSummary[] }>)
      .then((data) => {
        if (data.ok && data.analyses) setRuns(data.analyses);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  const filterButtons: { key: FilterMode; label: string }[] = [
    { key: "all", label: "All" },
    { key: "operator", label: "Scratch" },
    { key: "consultant", label: "Improve" },
  ];

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-5">
        {filterButtons.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setLoading(true); setFilter(key); }}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition ${
              filter === key
                ? "bg-white/[0.08] border border-white/[0.15] text-white/60"
                : "bg-white/[0.02] border border-white/[0.06] text-white/30 hover:text-white/50 hover:border-white/[0.1]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
        </div>
      ) : runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Inbox className="w-10 h-10 text-white/10" />
          <p className="text-sm text-white/30">No runs yet</p>
          <Link
            href="/himalaya"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs font-bold text-cyan-400 hover:bg-cyan-500/20 transition"
          >
            Build Your First Foundation
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <RunHistoryCard key={run.id} run={run} />
          ))}
        </div>
      )}
    </div>
  );
}
