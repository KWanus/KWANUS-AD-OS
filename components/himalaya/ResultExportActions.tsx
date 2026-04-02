"use client";

import { useState } from "react";
import { Copy, Check, Download } from "lucide-react";
import { exportSummary, exportAllResults, exportJSON } from "@/lib/himalaya/exportResults";
import type { HimalayaResultsViewModel } from "@/lib/himalaya/types";

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  function copy(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }
  return { copied, copy };
}

export default function ResultExportActions({ vm }: { vm: HimalayaResultsViewModel }) {
  const { copied, copy } = useCopy();

  function downloadJSON() {
    const blob = new Blob([exportJSON(vm)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `himalaya-run-${vm.analysisId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const actions = [
    {
      key: "summary",
      label: "Copy Summary",
      onClick: () => copy("summary", exportSummary(vm)),
    },
    {
      key: "all",
      label: "Copy All Results",
      onClick: () => copy("all", exportAllResults(vm)),
    },
  ];

  return (
    <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
      <h2 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">
        Export
      </h2>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.key}
            onClick={action.onClick}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] transition text-xs font-semibold text-white/50 hover:text-white/80"
          >
            {copied === action.key ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            {copied === action.key ? "Copied" : action.label}
          </button>
        ))}
        <button
          onClick={downloadJSON}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] transition text-xs font-semibold text-white/50 hover:text-white/80"
        >
          <Download className="w-3 h-3" />
          Export JSON
        </button>
      </div>
    </div>
  );
}
