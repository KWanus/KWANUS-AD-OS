"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SimplifiedNav from "@/components/SimplifiedNav";
import HimalayaNav from "@/components/himalaya/HimalayaNav";
import TemplateList from "@/components/himalaya/TemplateList";

export default function HimalayaTemplatesPage() {
  return (
    <div className="min-h-screen bg-t-bg text-white">
      <SimplifiedNav />
      <HimalayaNav />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link
          href="/himalaya/runs"
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-white/30 transition hover:text-white/60"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Run History
        </Link>
        <div className="mb-6 rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent p-5 sm:p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/20">Templates</p>
          <h1 className="mt-1 text-xl font-black text-white">Saved Templates</h1>
          <p className="mt-1 text-sm text-white/30">Reuse your best-performing angles, pages, emails, and execution assets across future runs.</p>
        </div>
        <TemplateList />
      </main>
    </div>
  );
}
