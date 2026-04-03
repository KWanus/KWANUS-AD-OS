"use client";

import { useState } from "react";
import Link from "next/link";
import { Circle, CheckCircle2, ExternalLink, Rocket, ChevronDown, ChevronRight, Loader2, Copy, Check } from "lucide-react";
import type { ExecutionStep } from "@/lib/himalaya/buildExecutionSteps";

type Props = {
  step: ExecutionStep;
  index: number;
  runId: string;
  onToggle: (stepId: string) => void;
};

export default function ExecutionStepCard({ step, index, runId, onToggle }: Props) {
  const isDone = step.status === "done";
  const [expanded, setExpanded] = useState(!isDone && index === 0);
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleDeploy() {
    if (!step.deployTarget) return;
    setDeploying(true);
    try {
      const res = await fetch("/api/himalaya/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, targets: [step.deployTarget] }),
      });
      const data = (await res.json()) as { ok: boolean };
      if (data.ok) {
        setDeployed(true);
        onToggle(step.id);
      }
    } catch { /* */ } finally { setDeploying(false); }
  }

  function copyContent() {
    if (!step.content) return;
    let text = "";
    if (step.content.type === "list") text = (step.content.data as string[]).join("\n");
    else if (step.content.type === "kv") text = (step.content.data as { label: string; value: string }[]).map(i => `${i.label}: ${i.value}`).join("\n");
    else text = String(step.content.data);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={`rounded-xl border transition-all ${
      isDone
        ? "bg-emerald-500/[0.02] border-emerald-500/10"
        : expanded
          ? "bg-white/[0.03] border-white/[0.1]"
          : "bg-white/[0.015] border-white/[0.06] hover:border-white/[0.1]"
    }`}>
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={() => !isDone && setExpanded(!expanded)}
      >
        <button onClick={(e) => { e.stopPropagation(); onToggle(step.id); }} className="shrink-0">
          {isDone ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          ) : (
            <Circle className="w-6 h-6 text-white/15 hover:text-cyan-400/50 transition" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-black w-5 ${isDone ? "text-emerald-400/40" : "text-cyan-400/40"}`}>{index + 1}</span>
            <h3 className={`text-sm font-bold ${isDone ? "text-white/30 line-through" : "text-white/80"}`}>
              {step.title}
            </h3>
          </div>
        </div>

        {step.deployTarget && !isDone && !deployed && (
          <button
            onClick={(e) => { e.stopPropagation(); void handleDeploy(); }}
            disabled={deploying}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-400 hover:bg-cyan-500/20 transition disabled:opacity-40"
          >
            {deploying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Rocket className="w-3 h-3" />}
            Deploy
          </button>
        )}
        {deployed && (
          <span className="shrink-0 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Deployed
          </span>
        )}

        {!isDone && step.content && (
          expanded
            ? <ChevronDown className="w-4 h-4 text-white/15 shrink-0" />
            : <ChevronRight className="w-4 h-4 text-white/15 shrink-0" />
        )}
      </div>

      {/* Expanded body */}
      {expanded && !isDone && (
        <div className="px-4 pb-4 pl-[56px]">
          <p className="text-xs text-white/35 mb-3">{step.instruction}</p>

          {step.content && (
            <div className="bg-white/[0.025] border border-white/[0.06] rounded-lg p-3 mb-3">
              {step.content.type === "list" && (
                <ul className="space-y-1.5">
                  {(step.content.data as string[]).map((item, i) => (
                    <li key={i} className="text-xs text-white/55 flex items-start gap-2">
                      <span className="text-cyan-400/40 font-mono text-[10px] shrink-0 mt-px">{i + 1}</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {step.content.type === "kv" && (
                <div className="space-y-2">
                  {(step.content.data as { label: string; value: string }[]).map(({ label, value }, i) => (
                    <div key={i}>
                      <p className="text-[9px] font-bold text-cyan-400/30 uppercase">{label}</p>
                      <p className="text-xs text-white/55">{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center gap-2">
            {step.content && (
              <button
                onClick={copyContent}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-[10px] font-semibold text-white/30 hover:text-white/60 transition"
              >
                {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            )}
            {step.actionUrl && (
              <Link
                href={step.actionUrl}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-[10px] font-semibold text-white/30 hover:text-white/60 transition"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                {step.actionLabel || "Open Tool"}
              </Link>
            )}
            <button
              onClick={() => onToggle(step.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/15 text-[10px] font-bold text-emerald-400/70 hover:text-emerald-400 transition ml-auto"
            >
              <CheckCircle2 className="w-2.5 h-2.5" /> Mark Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
