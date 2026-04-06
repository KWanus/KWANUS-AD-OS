"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import { Search, Loader2, Check, X, AlertTriangle, Globe } from "lucide-react";

type AuditResult = {
  url: string;
  title: string;
  titleLength: number;
  description: string;
  descLength: number;
  h1Count: number;
  h1Text: string;
  hasCanonical: boolean;
  hasViewport: boolean;
  hasOgTitle: boolean;
  hasOgImage: boolean;
  imageCount: number;
  imagesWithoutAlt: number;
  linkCount: number;
  wordCount: number;
  score: number;
  issues: { severity: "error" | "warning" | "pass"; message: string }[];
};

export default function SeoAuditPage() {
  const [url, setUrl] = useState("");
  const [auditing, setAuditing] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);

  async function runAudit() {
    if (!url.trim()) return;
    setAuditing(true);
    setResult(null);

    try {
      const res = await fetch("/api/tools/seo-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json() as { ok: boolean; audit?: AuditResult };
      if (data.ok && data.audit) setResult(data.audit);
    } catch {
      // Silent
    } finally {
      setAuditing(false);
    }
  }

  const scoreColor = (result?.score ?? 0) >= 80 ? "text-emerald-400" : (result?.score ?? 0) >= 50 ? "text-amber-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Search className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">SEO Audit</h1>
            <p className="text-xs text-white/35">Check any page for SEO issues</p>
          </div>
        </div>

        {/* Input */}
        <div className="flex gap-3 mb-6">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runAudit()}
            placeholder="https://yourdomain.com"
            className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
          />
          <button
            onClick={runAudit}
            disabled={auditing || !url.trim()}
            className="px-6 py-3 rounded-xl bg-cyan-500 text-[#0a0f1e] text-sm font-bold hover:bg-cyan-400 transition disabled:opacity-40"
          >
            {auditing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Audit"}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Score */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 text-center">
              <p className={`text-5xl font-black ${scoreColor}`}>{result.score}</p>
              <p className="text-xs text-white/30 mt-1">SEO Score / 100</p>
              <p className="text-xs text-white/20 mt-2 font-mono truncate">{result.url}</p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <QuickStat label="Title Length" value={`${result.titleLength}`} good={result.titleLength >= 30 && result.titleLength <= 60} />
              <QuickStat label="Desc Length" value={`${result.descLength}`} good={result.descLength >= 120 && result.descLength <= 160} />
              <QuickStat label="Word Count" value={`${result.wordCount}`} good={result.wordCount >= 300} />
              <QuickStat label="H1 Tags" value={`${result.h1Count}`} good={result.h1Count === 1} />
            </div>

            {/* Issues */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Audit Results</p>
              <div className="space-y-2">
                {result.issues.map((issue, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border ${
                      issue.severity === "error" ? "border-red-500/15 bg-red-500/5" :
                      issue.severity === "warning" ? "border-amber-500/15 bg-amber-500/5" :
                      "border-emerald-500/15 bg-emerald-500/5"
                    }`}
                  >
                    {issue.severity === "error" ? <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" /> :
                     issue.severity === "warning" ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" /> :
                     <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                    <span className="text-xs text-white/60">{issue.message}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Meta preview */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Google Preview</p>
              <div className="rounded-xl bg-white p-4">
                <p className="text-[#1a0dab] text-base font-medium leading-tight truncate">
                  {result.title || "No title tag found"}
                </p>
                <p className="text-[#006621] text-xs mt-1 truncate">{result.url}</p>
                <p className="text-[#545454] text-xs mt-1 leading-relaxed line-clamp-2">
                  {result.description || "No meta description found"}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function QuickStat({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-center">
      <p className={`text-lg font-bold ${good ? "text-emerald-400" : "text-amber-400"}`}>{value}</p>
      <p className="text-[10px] text-white/25">{label}</p>
    </div>
  );
}
