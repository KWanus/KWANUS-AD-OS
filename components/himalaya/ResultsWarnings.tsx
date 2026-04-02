"use client";

import { AlertTriangle } from "lucide-react";
import type { HimalayaResultsViewModel } from "@/lib/himalaya/types";

export default function ResultsWarnings({ vm }: { vm: HimalayaResultsViewModel }) {
  if (vm.notes.length === 0) return null;

  return (
    <div className="bg-amber-500/[0.03] border border-amber-500/10 rounded-2xl p-5">
      <h2 className="text-[10px] font-black uppercase tracking-widest text-amber-400/50 mb-3">
        Notes
      </h2>
      <ul className="space-y-2">
        {vm.notes.map((note, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400/40 shrink-0 mt-0.5" />
            <p className="text-xs text-white/50 leading-relaxed">{note}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
