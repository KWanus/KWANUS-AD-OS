"use client";

import { useState } from "react";
import { Copy, Check, Code, Pin, PinOff, ClipboardCopy, Loader2 } from "lucide-react";
import type { HimalayaResultsViewModel } from "@/lib/himalaya/types";
import { exportJSON } from "@/lib/himalaya/exportResults";

export default function ResultOperatorTools({ vm }: { vm: HimalayaResultsViewModel }) {
  const [copiedId, setCopiedId] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  function copyRunId() {
    navigator.clipboard.writeText(vm.analysisId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }

  function copyDuplicateLink() {
    const url = `/scan?prefill=${encodeURIComponent(vm.inputUrl)}&mode=${vm.mode}`;
    navigator.clipboard.writeText(window.location.origin + url);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }

  async function togglePin() {
    setPinLoading(true);
    try {
      const res = await fetch(`/api/analyses/${vm.analysisId}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !pinned }),
      });
      const data = (await res.json()) as { ok: boolean; pinned?: boolean };
      if (data.ok) setPinned(data.pinned ?? !pinned);
    } catch {
      // non-fatal
    } finally {
      setPinLoading(false);
    }
  }

  return (
    <div className="bg-white/[0.015] border border-white/[0.05] rounded-2xl p-4">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3">
        Operator Tools
      </h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={copyRunId}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.06] text-[10px] font-semibold text-white/30 hover:text-white/60 hover:border-white/[0.12] transition"
        >
          {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <ClipboardCopy className="w-3 h-3" />}
          Copy Run ID
        </button>

        <button
          onClick={() => setShowRaw(!showRaw)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold transition ${
            showRaw
              ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
              : "bg-white/[0.02] border-white/[0.06] text-white/30 hover:text-white/60 hover:border-white/[0.12]"
          }`}
        >
          <Code className="w-3 h-3" />
          {showRaw ? "Hide Raw JSON" : "View Raw JSON"}
        </button>

        <button
          onClick={copyDuplicateLink}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.06] text-[10px] font-semibold text-white/30 hover:text-white/60 hover:border-white/[0.12] transition"
        >
          <Copy className="w-3 h-3" />
          Duplicate Input
        </button>

        <button
          onClick={() => void togglePin()}
          disabled={pinLoading}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold transition disabled:opacity-40 ${
            pinned
              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
              : "bg-white/[0.02] border-white/[0.06] text-white/30 hover:text-white/60 hover:border-white/[0.12]"
          }`}
        >
          {pinLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : pinned ? (
            <PinOff className="w-3 h-3" />
          ) : (
            <Pin className="w-3 h-3" />
          )}
          {pinned ? "Unpin" : "Pin Run"}
        </button>
      </div>

      {showRaw && (
        <div className="mt-3">
          <pre className="bg-black/30 border border-white/[0.05] rounded-lg p-3 text-[10px] text-white/40 leading-relaxed overflow-x-auto max-h-80 overflow-y-auto font-mono">
            {exportJSON(vm)}
          </pre>
        </div>
      )}
    </div>
  );
}
