"use client";

import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

type QACheck = {
  id: string;
  label: string;
  category: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

type QAReport = {
  score: number;
  checks: QACheck[];
  passCount: number;
  warnCount: number;
  failCount: number;
  summary: string;
};

const STATUS_ICON = {
  pass: CheckCircle,
  warn: AlertTriangle,
  fail: XCircle,
};

const STATUS_COLOR = {
  pass: "text-emerald-400",
  warn: "text-amber-400",
  fail: "text-red-400",
};

const CATEGORY_LABELS: Record<string, string> = {
  conversion: "Conversion",
  content: "Content",
  trust: "Trust",
  technical: "Technical",
};

export default function DeployQAReport({ report }: { report: QAReport }) {
  const scoreColor = report.score >= 80 ? "text-emerald-400" : report.score >= 50 ? "text-amber-400" : "text-red-400";

  // Group by category
  const grouped = new Map<string, QACheck[]>();
  for (const check of report.checks) {
    const list = grouped.get(check.category) ?? [];
    list.push(check);
    grouped.set(check.category, list);
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30">Deployment QA</h3>
          <p className="text-xs text-white/40 mt-0.5">{report.summary}</p>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-black ${scoreColor}`}>{report.score}</span>
          <span className="text-[10px] text-white/20 block">/100</span>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 mb-4 text-[10px] font-bold">
        <span className="text-emerald-400/60">{report.passCount} passed</span>
        {report.warnCount > 0 && <span className="text-amber-400/60">{report.warnCount} warnings</span>}
        {report.failCount > 0 && <span className="text-red-400/60">{report.failCount} failed</span>}
      </div>

      {/* Checks by category */}
      <div className="space-y-4">
        {[...grouped.entries()].map(([category, checks]) => (
          <div key={category}>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-2">
              {CATEGORY_LABELS[category] ?? category}
            </p>
            <div className="space-y-1">
              {checks.map((check) => {
                const Icon = STATUS_ICON[check.status];
                return (
                  <div key={check.id} className="flex items-start gap-2.5 py-1">
                    <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${STATUS_COLOR[check.status]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/50">{check.label}</p>
                      <p className="text-[10px] text-white/25">{check.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
