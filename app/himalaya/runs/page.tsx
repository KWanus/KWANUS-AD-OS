"use client";

import Link from "next/link";
import { GitCompare, Bookmark } from "lucide-react";
import AppNav from "@/components/AppNav";
import HimalayaNav from "@/components/himalaya/HimalayaNav";
import RunHistoryList from "@/components/himalaya/RunHistoryList";

export default function HimalayaRunsPage() {
  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <HimalayaNav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black text-white mb-1">Run History</h1>
            <p className="text-sm text-white/30">Browse your previous Himalaya runs</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/himalaya/templates"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] transition text-xs font-semibold text-white/50 hover:text-white/80"
            >
              <Bookmark className="w-3.5 h-3.5" />
              Templates
            </Link>
            <Link
              href="/himalaya/runs/compare"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] transition text-xs font-semibold text-white/50 hover:text-white/80"
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
