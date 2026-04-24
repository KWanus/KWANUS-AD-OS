"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Target, TrendingUp } from "lucide-react";

export type GoalNodeData = {
  goalName?: string;
  metric?: string;
  value?: number;
};

export default function GoalNode({ data, selected }: NodeProps) {
  const nodeData = data as GoalNodeData;

  return (
    <div
      className={`relative min-w-[200px] rounded-2xl border transition-all duration-200 ${
        selected
          ? "border-yellow-400/80 shadow-[0_0_32px_rgba(250,204,21,0.4)]"
          : "border-yellow-500/30 shadow-[0_0_16px_rgba(250,204,21,0.15)]"
      }`}
      style={{ background: "linear-gradient(135deg, rgba(250,204,21,0.10) 0%, rgba(202,138,4,0.07) 100%)" }}
    >
      <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />

      <div className="px-4 py-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Target className="w-3 h-3 text-yellow-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400/70">Goal</span>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-yellow-500/15 border border-yellow-500/20 flex items-center justify-center shrink-0">
            <Target className="w-4.5 h-4.5 text-yellow-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white leading-tight">
              {nodeData.goalName || "Set goal name"}
            </p>
            {nodeData.metric && (
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-2.5 h-2.5 text-yellow-400/60" />
                <p className="text-[10px] text-white/40">{nodeData.metric}{nodeData.value ? ` — ${nodeData.value}` : ""}</p>
              </div>
            )}
          </div>
        </div>

        {/* End of flow indicator */}
        <div className="mt-2.5 pt-2 border-t border-white/[0.06]">
          <p className="text-[10px] text-yellow-400/50 font-medium text-center">End of Flow</p>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-yellow-400 !bg-[#0c0a08] hover:!bg-yellow-400 transition-colors"
        style={{ top: -6 }}
      />
    </div>
  );
}
