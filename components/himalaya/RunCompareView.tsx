"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { formatResults } from "@/lib/himalaya/formatResults";
import type { RawAnalysis, HimalayaResultsViewModel } from "@/lib/himalaya/types";

type Props = {
  runIdA: string;
  runIdB: string;
};

const SCORE_COLOR = (s: number) =>
  s >= 70 ? "text-emerald-400" : s >= 45 ? "text-amber-400" : "text-red-400";

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-3 col-span-2">
      {children}
    </h3>
  );
}

function CompareCard({ vm, color }: { vm: HimalayaResultsViewModel; color: string }) {
  return (
    <div className={`rounded-2xl border bg-gradient-to-br from-white/[0.03] via-white/[0.02] to-transparent p-4 ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-white/30 uppercase">{vm.modeLabel}</span>
        <span className={`text-lg font-black ${SCORE_COLOR(vm.score)}`}>{vm.score}</span>
      </div>
      <h4 className="text-sm font-bold text-white/70 mb-1">{vm.title}</h4>
      <p className="text-xs text-white/40 leading-relaxed mb-2">{vm.summary}</p>
      <div className="text-[10px] text-white/20">
        {vm.verdict} · {vm.statusLabel} · {vm.confidence}
      </div>
    </div>
  );
}

function CompareSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <SectionHeader>{title}</SectionHeader>
      {children}
    </>
  );
}

function PriorityColumn({ vm }: { vm: HimalayaResultsViewModel }) {
  if (vm.priorities.length === 0) return <p className="text-xs text-white/20">No priorities</p>;
  return (
    <div className="space-y-2">
      {vm.priorities.map((p, i) => (
        <div key={i} className="rounded-xl border border-white/[0.05] bg-black/20 p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black text-[#f5a623]/50">{i + 1}.</span>
            <span className="text-xs font-bold text-white/60">{p.label}</span>
          </div>
          <p className="text-[10px] text-white/30">{p.nextStep}</p>
        </div>
      ))}
    </div>
  );
}

function AssetColumn({ vm }: { vm: HimalayaResultsViewModel }) {
  if (vm.assetGroups.length === 0) return <p className="text-xs text-white/20">No assets</p>;
  return (
    <div className="space-y-2">
      {vm.assetGroups.map((g, i) => (
        <div key={i} className="rounded-xl border border-white/[0.05] bg-black/20 p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1">{g.title}</p>
          {g.type === "text" && <p className="text-xs text-white/40 line-clamp-3">{g.content as string}</p>}
          {g.type === "list" && <p className="text-xs text-white/40">{(g.content as string[]).length} items</p>}
          {g.type === "kv" && <p className="text-xs text-white/40">{(g.content as { label: string; value: string }[]).length} fields</p>}
          {g.type === "scripts" && <p className="text-xs text-white/40">{(g.content as unknown[]).length} scripts</p>}
        </div>
      ))}
    </div>
  );
}

function NotesColumn({ vm }: { vm: HimalayaResultsViewModel }) {
  if (vm.notes.length === 0) return <p className="text-xs text-white/20">No notes</p>;
  return (
    <ul className="space-y-1.5">
      {vm.notes.map((n, i) => (
        <li key={i} className="flex items-start gap-2 rounded-xl border border-white/[0.05] bg-black/20 px-3 py-3 text-xs text-white/40">
          <span className="text-amber-400/40 shrink-0">-</span>
          {n}
        </li>
      ))}
    </ul>
  );
}

function DimensionCompare({ vmA, vmB }: { vmA: HimalayaResultsViewModel; vmB: HimalayaResultsViewModel }) {
  if (vmA.dimensions.length === 0 && vmB.dimensions.length === 0) return null;
  const dims = vmA.dimensions.length > 0 ? vmA.dimensions : vmB.dimensions;

  return (
    <>
      <SectionHeader>Dimensions</SectionHeader>
      <div className="col-span-2 rounded-2xl border border-white/[0.05] bg-gradient-to-br from-white/[0.03] via-white/[0.02] to-transparent p-4">
        <div className="mb-2 hidden grid-cols-[1fr_60px_60px_60px] gap-2 text-[10px] font-bold uppercase text-white/25 sm:grid">
          <span>Dimension</span>
          <span className="text-right">Run A</span>
          <span className="text-right">Run B</span>
          <span className="text-right">Diff</span>
        </div>
        {dims.map((d) => {
          const valA = vmA.dimensions.find((x) => x.key === d.key)?.value ?? 0;
          const valB = vmB.dimensions.find((x) => x.key === d.key)?.value ?? 0;
          const diff = valB - valA;
          const diffColor = d.isRisk
            ? (diff < 0 ? "text-emerald-400" : diff > 0 ? "text-red-400" : "text-white/20")
            : (diff > 0 ? "text-emerald-400" : diff < 0 ? "text-red-400" : "text-white/20");
          return (
            <div key={d.key} className="grid gap-2 border-t border-white/[0.03] py-2 text-xs sm:grid-cols-[1fr_60px_60px_60px]">
              <span className="text-white/40">{d.label}</span>
              <div className="grid grid-cols-3 gap-2 sm:contents">
                <span className="rounded-lg bg-black/20 px-2 py-1 text-center text-white/50 font-mono sm:rounded-none sm:bg-transparent sm:px-0 sm:py-0 sm:text-right">{valA}</span>
                <span className="rounded-lg bg-black/20 px-2 py-1 text-center text-white/50 font-mono sm:rounded-none sm:bg-transparent sm:px-0 sm:py-0 sm:text-right">{valB}</span>
                <span className={`rounded-lg bg-black/20 px-2 py-1 text-center font-mono font-bold sm:rounded-none sm:bg-transparent sm:px-0 sm:py-0 sm:text-right ${diffColor}`}>
                  {diff > 0 ? `+${diff}` : diff === 0 ? "=" : String(diff)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function RunCompareView({ runIdA, runIdB }: Props) {
  const [vmA, setVmA] = useState<HimalayaResultsViewModel | null>(null);
  const [vmB, setVmB] = useState<HimalayaResultsViewModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/analyses/${runIdA}`).then((r) => r.json() as Promise<{ ok: boolean; analysis?: RawAnalysis }>),
      fetch(`/api/analyses/${runIdB}`).then((r) => r.json() as Promise<{ ok: boolean; analysis?: RawAnalysis }>),
    ])
      .then(([dataA, dataB]) => {
        if (dataA.ok && dataA.analysis) setVmA(formatResults(dataA.analysis));
        if (dataB.ok && dataB.analysis) setVmB(formatResults(dataB.analysis));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [runIdA, runIdB]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent py-16">
        <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
      </div>
    );
  }

  if (!vmA || !vmB) {
    return <p className="rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent py-8 text-center text-sm text-white/40">Failed to load one or both runs</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Headers */}
      <CompareSection title="Summary">
        <CompareCard vm={vmA} color="border-[#f5a623]/15" />
        <CompareCard vm={vmB} color="border-purple-500/15" />
      </CompareSection>

      {/* Priorities */}
      <CompareSection title="Priorities">
        <PriorityColumn vm={vmA} />
        <PriorityColumn vm={vmB} />
      </CompareSection>

      {/* Assets */}
      <CompareSection title="Generated Assets">
        <AssetColumn vm={vmA} />
        <AssetColumn vm={vmB} />
      </CompareSection>

      {/* Notes */}
      <CompareSection title="Notes & Warnings">
        <NotesColumn vm={vmA} />
        <NotesColumn vm={vmB} />
      </CompareSection>

      {/* Dimension comparison */}
      <DimensionCompare vmA={vmA} vmB={vmB} />
    </div>
  );
}
