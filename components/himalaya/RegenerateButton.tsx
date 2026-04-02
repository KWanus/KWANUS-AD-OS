"use client";

import { useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";

type Props = {
  analysisId: string;
  target: string;
  onRegenerated?: () => void;
};

export default function RegenerateButton({ analysisId, target, onRegenerated }: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleRegenerate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const data = (await res.json()) as { ok: boolean };
      if (data.ok) {
        setDone(true);
        onRegenerated?.();
        // Track regen in memory (fire-and-forget)
        fetch("/api/himalaya/memory").then(r => r.json() as Promise<{ ok: boolean; memory?: { regenCounts?: Record<string, number> } | null }>).then(mem => {
          const counts = mem.memory?.regenCounts ?? {};
          counts[target] = (counts[target] ?? 0) + 1;
          fetch("/api/himalaya/memory", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ regenCounts: counts }) }).catch(() => {});
        }).catch(() => {});
        setTimeout(() => setDone(false), 2000);
      }
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={() => void handleRegenerate()}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] transition text-[10px] font-semibold text-white/30 hover:text-white/60 disabled:opacity-40"
      title="Refresh this section using the same strategy context"
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : done ? (
        <RefreshCw className="w-3 h-3 text-emerald-400" />
      ) : (
        <RefreshCw className="w-3 h-3" />
      )}
      {done ? "Updated" : "Regenerate"}
    </button>
  );
}
