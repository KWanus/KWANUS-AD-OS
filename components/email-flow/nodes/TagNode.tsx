"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Tag, Plus, Minus } from "lucide-react";

export type TagNodeData = {
  tagName?: string;
  action?: "add" | "remove";
};

export default function TagNode({ data, selected }: NodeProps) {
  const nodeData = data as TagNodeData;
  const isRemove = nodeData.action === "remove";

  return (
    <div
      className={`relative min-w-[180px] rounded-2xl border transition-all duration-200 ${
        selected
          ? "border-emerald-400/80 shadow-[0_0_32px_rgba(52,211,153,0.4)]"
          : "border-emerald-500/30 shadow-[0_0_12px_rgba(52,211,153,0.12)]"
      }`}
      style={{ background: "linear-gradient(135deg, rgba(52,211,153,0.10) 0%, rgba(16,185,129,0.07) 100%)" }}
    >
      <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

      <div className="px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0 relative">
          <Tag className="w-4 h-4 text-emerald-400" />
          <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center ${
            isRemove ? "bg-red-500/80" : "bg-emerald-500/80"
          }`}>
            {isRemove
              ? <Minus className="w-2 h-2 text-white" />
              : <Plus className="w-2 h-2 text-white" />
            }
          </div>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/70 mb-0.5">
            {isRemove ? "Remove Tag" : "Add Tag"}
          </p>
          <p className="text-xs font-bold text-white leading-tight">
            {nodeData.tagName ? `"${nodeData.tagName}"` : "Set tag name"}
          </p>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-emerald-400 !bg-[#050a14] hover:!bg-emerald-400 transition-colors"
        style={{ top: -6 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-emerald-400 !bg-[#050a14] hover:!bg-emerald-400 transition-colors"
        style={{ bottom: -6 }}
      />
    </div>
  );
}
