"use client";

import { AlertTriangle } from "lucide-react";
import type { HimalayaResultsViewModel } from "@/lib/himalaya/types";

export default function ResultsWarnings({ vm }: { vm: HimalayaResultsViewModel }) {
  if (vm.notes.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-500/10 bg-gradient-to-br from-amber-500/[0.05] via-amber-500/[0.025] to-transparent p-4 sm:p-5">
      <h2 className="mb-3 text-[10px] font-black uppercase tracking-widest text-amber-400/50">
        Notes
      </h2>
      <ul className="space-y-2">
        {vm.notes.map((note, i) => (
          <li key={i} className="flex items-start gap-2.5 rounded-xl border border-amber-500/10 bg-black/20 px-3 py-3">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400/40 shrink-0 mt-0.5" />
            <p className="text-xs text-white/50 leading-relaxed">{note}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
