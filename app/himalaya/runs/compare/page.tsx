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
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <HimalayaNav />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/himalaya/runs"
          className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Run History
        </Link>

        <h1 className="text-xl font-black text-white mb-1">Compare Runs</h1>
        <p className="text-sm text-white/30 mb-6">Select two runs to compare side by side</p>

        {comparison ? (
          <div>
            <button
              onClick={() => setComparison(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs font-semibold text-white/40 hover:text-white/70 transition mb-6"
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
