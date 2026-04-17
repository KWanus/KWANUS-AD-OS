"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AppNav from "@/components/AppNav";
import HimalayaNav from "@/components/himalaya/HimalayaNav";
import RunComparePicker from "@/components/himalaya/RunComparePicker";
import RunCompareView from "@/components/himalaya/RunCompareView";

export default function HimalayaComparePage() {
  const [comparison, setComparison] = useState<{ a: string; b: string } | null>(null);

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <AppNav />
      <HimalayaNav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link
          href="/himalaya/runs"
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-white/30 transition hover:text-white/60"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Run History
        </Link>

        <div className="mb-6 rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent p-5 sm:p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/20">Compare</p>
          <h1 className="mt-1 text-xl font-black text-white">Compare Runs</h1>
          <p className="mt-1 text-sm text-white/30">Select two runs to compare side by side across priorities, assets, notes, and score shifts.</p>
        </div>

        {comparison ? (
          <div>
            <button
              onClick={() => setComparison(null)}
              className="mb-6 inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/40 transition hover:text-white/70"
            >
              <ArrowLeft className="w-3 h-3" /> Pick Different Runs
            </button>
            <RunCompareView runIdA={comparison.a} runIdB={comparison.b} />
          </div>
        ) : (
          <RunComparePicker onSelect={(a, b) => setComparison({ a, b })} />
        )}
      </main>
    </div>
  );
}
