"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AppNav from "@/components/AppNav";
import HimalayaNav from "@/components/himalaya/HimalayaNav";
import TemplateList from "@/components/himalaya/TemplateList";

export default function HimalayaTemplatesPage() {
  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <HimalayaNav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/himalaya/runs"
          className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Run History
        </Link>
        <h1 className="text-xl font-black text-white mb-1">Templates</h1>
        <p className="text-sm text-white/30 mb-6">Your saved asset templates for reuse across runs</p>
        <TemplateList />
      </main>
    </div>
  );
}
