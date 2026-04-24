"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { GitBranch, Check, X } from "lucide-react";

export type ConditionNodeData = {
  conditionType?: "opened_email" | "clicked_link" | "has_tag" | "property_equals";
  conditionValue?: string;
  label?: string;
};

const CONDITION_LABELS: Record<string, string> = {
  opened_email: "Opened previous email?",
  clicked_link: "Clicked a link?",
  has_tag: "Has tag:",
  property_equals: "Property equals:",
};

export default function ConditionNode({ data, selected }: NodeProps) {
  const nodeData = data as ConditionNodeData;
  const condLabel = nodeData.conditionType
    ? CONDITION_LABELS[nodeData.conditionType] ?? nodeData.conditionType
    : "Set condition";
  const fullLabel = nodeData.conditionValue
    ? `${condLabel} ${nodeData.conditionValue}`
    : condLabel;

  return (
    <div className="relative" style={{ minWidth: 220 }}>
      {/* Diamond shape outer ring */}
      <div
        className={`absolute inset-0 rounded-2xl border transition-all duration-200 ${
          selected
            ? "border-orange-400/80 shadow-[0_0_32px_rgba(249,115,22,0.4)]"
            : "border-orange-500/30 shadow-[0_0_16px_rgba(249,115,22,0.15)]"
        }`}
        style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.10) 0%, rgba(234,88,12,0.07) 100%)" }}
      />

      {/* Top glow */}
      <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-transparent via-orange-400 to-transparent" />

      <div className="relative px-4 py-3">
        <div className="flex items-center gap-1.5 mb-2">
          <GitBranch className="w-3 h-3 text-orange-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-orange-400/70">Condition</span>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center shrink-0">
            <GitBranch className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-xs font-bold text-white leading-snug pt-1">{fullLabel}</p>
        </div>

        {/* Branch labels */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-1 text-[10px] text-white/30">
            <X className="w-2.5 h-2.5 text-red-400" />
            <span className="text-red-400/70 font-bold">NO</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-white/30">
            <Check className="w-2.5 h-2.5 text-green-400" />
            <span className="text-green-400/70 font-bold">YES</span>
          </div>
        </div>
      </div>

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-orange-400 !bg-[#020509] hover:!bg-orange-400 transition-colors"
        style={{ top: -6 }}
      />

      {/* YES output — right */}
      <Handle
        type="source"
        position={Position.Right}
        id="yes"
        className="!w-3 !h-3 !border-2 !border-green-400 !bg-[#020509] hover:!bg-green-400 transition-colors"
        style={{ right: -6 }}
      />

      {/* NO output — left */}
      <Handle
        type="source"
        position={Position.Left}
        id="no"
        className="!w-3 !h-3 !border-2 !border-red-400 !bg-[#020509] hover:!bg-red-400 transition-colors"
        style={{ left: -6 }}
      />
    </div>
  );
}
