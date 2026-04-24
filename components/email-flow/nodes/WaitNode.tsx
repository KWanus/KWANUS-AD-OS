"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Clock } from "lucide-react";

export type WaitNodeData = {
  duration?: number;
  unit?: "hours" | "days" | "weeks";
  sendAtTime?: string;
};

function formatDuration(duration?: number, unit?: string): string {
  if (!duration) return "Set wait time";
  const u = unit ?? "days";
  const label = duration === 1 ? u.slice(0, -1) : u;
  return `Wait ${duration} ${label}`;
}

export default function WaitNode({ data, selected }: NodeProps) {
  const nodeData = data as WaitNodeData;
  const text = formatDuration(nodeData.duration, nodeData.unit);

  return (
    <div
      className={`relative min-w-[180px] rounded-2xl border transition-all duration-200 ${
        selected
          ? "border-amber-400/80 shadow-[0_0_32px_rgba(251,191,36,0.35)]"
          : "border-amber-500/30 shadow-[0_0_12px_rgba(251,191,36,0.12)]"
      }`}
      style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.10) 0%, rgba(217,119,6,0.07) 100%)" }}
    >
      <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

      <div className="px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/70 mb-0.5">Delay</p>
          <p className="text-xs font-bold text-white leading-tight">{text}</p>
          {nodeData.sendAtTime && (
            <p className="text-[10px] text-white/35 mt-0.5">at {nodeData.sendAtTime}</p>
          )}
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-amber-400 !bg-[#0c0a08] hover:!bg-amber-400 transition-colors"
        style={{ top: -6 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-amber-400 !bg-[#0c0a08] hover:!bg-amber-400 transition-colors"
        style={{ bottom: -6 }}
      />
    </div>
  );
}
