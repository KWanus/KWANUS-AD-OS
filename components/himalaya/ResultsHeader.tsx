"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Copy, Check, Download } from "lucide-react";
import { exportAllResults } from "@/lib/himalaya/exportResults";
import type { HimalayaResultsViewModel } from "@/lib/himalaya/types";

const TONE_STYLES = {
  success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  partial: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  fallback: "bg-orange-500/10 border-orange-500/20 text-orange-400",
  failed: "bg-red-500/10 border-red-500/20 text-red-400",
} as const;

const SCORE_COLOR = (s: number) =>
  s >= 70 ? "text-emerald-400" : s >= 45 ? "text-amber-400" : "text-red-400";
const SCORE_RING = (s: number) =>
  s >= 70 ? "#10b981" : s >= 45 ? "#f59e0b" : "#ef4444";

function ScoreRing({ score }: { score: number }) {
  const size = 80;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = SCORE_RING(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease", filter: `drop-shadow(0 0 6px ${color}60)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-xl font-black ${SCORE_COLOR(score)}`}>{score}</span>
      </div>
    </div>
  );
}

export default function ResultsHeader({ vm }: { vm: HimalayaResultsViewModel }) {
  const [copied, setCopied] = useState(false);

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleQuickDownload() {
    const md = exportAllResults(vm);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `himalaya-${vm.analysisId.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-5">
        <ScoreRing score={vm.score} />

        <div className="flex-1 min-w-0">
          {/* Mode + Status badges */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[10px] font-bold text-white/40 uppercase tracking-wider">
              {vm.modeLabel}
            </span>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${TONE_STYLES[vm.statusTone]}`}>
              {vm.statusLabel}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-lg sm:text-xl font-black text-white mb-2">
            {vm.title}
          </h1>

          {/* Summary */}
          <p className="text-sm text-white/50 leading-relaxed max-w-2xl mb-3">
            {vm.summary}
          </p>

          {/* Meta + Quick actions */}
          <div className="flex items-center gap-4 text-[11px] text-white/25 flex-wrap">
            <span>{format(new Date(vm.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
            <span>Score: <span className={`font-bold ${SCORE_COLOR(vm.score)}`}>{vm.score}/100</span></span>
            <span>Verdict: <span className="text-white/40 font-semibold">{vm.verdict}</span></span>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[10px] font-semibold text-white/25 hover:text-white/50 transition"
            >
              {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
              {copied ? "Copied" : "Share"}
            </button>
            <button
              onClick={handleQuickDownload}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[10px] font-semibold text-white/25 hover:text-white/50 transition"
            >
              <Download className="w-2.5 h-2.5" />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
