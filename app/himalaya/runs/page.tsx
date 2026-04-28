"use client";

import Link from "next/link";
import { GitCompare, Bookmark } from "lucide-react";
import SimplifiedNav from "@/components/SimplifiedNav";
import HimalayaNav from "@/components/himalaya/HimalayaNav";
import RunHistoryList from "@/components/himalaya/RunHistoryList";

export default function HimalayaRunsPage() {
  return (
    <div className="min-h-screen bg-t-bg text-white">
      <SimplifiedNav />
      <HimalayaNav />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/20">History</p>
            <h1 className="mt-1 text-xl font-black text-white">Run History</h1>
            <p className="mt-1 text-sm text-white/30">Browse, revisit, and compare your previous Himalaya runs.</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center">
            <Link
              href="/himalaya/templates"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-semibold text-white/50 transition hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white/80"
            >
              <Bookmark className="w-3.5 h-3.5" />
              Templates
            </Link>
            <Link
              href="/himalaya/runs/compare"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-semibold text-white/50 transition hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white/80"
            >
              <GitCompare className="w-3.5 h-3.5" />
              Compare
            </Link>
          </div>
        </div>
        <RunHistoryList />
      </main>
    </div>
  );
}
