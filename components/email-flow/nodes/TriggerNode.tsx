"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Zap } from "lucide-react";

const TRIGGER_LABELS: Record<string, { label: string; icon: string }> = {
  new_subscriber: { label: "New Subscriber", icon: "👤" },
  purchase: { label: "Purchase Made", icon: "🛒" },
  abandoned_cart: { label: "Abandoned Cart", icon: "🛒" },
  tag_added: { label: "Tag Added", icon: "🏷" },
  form_submit: { label: "Form Submitted", icon: "📋" },
  date_based: { label: "Date / Anniversary", icon: "📅" },
  manual: { label: "Manual Trigger", icon: "▶️" },
};

export type TriggerNodeData = {
  trigger: string;
  triggerConfig?: Record<string, unknown>;
  label?: string;
};

export default function TriggerNode({ data, selected }: NodeProps) {
  const nodeData = data as TriggerNodeData;
  const meta = TRIGGER_LABELS[nodeData.trigger] ?? { label: nodeData.trigger ?? "Trigger", icon: "⚡" };

  return (
    <div
      className={`relative min-w-[200px] rounded-2xl border transition-all duration-200 ${
        selected
          ? "border-[#f5a623]/80 shadow-[0_0_32px_rgba(245,166,35,0.4)]"
          : "border-[#f5a623]/30 shadow-[0_0_16px_rgba(245,166,35,0.15)]"
      }`}
      style={{ background: "linear-gradient(135deg, rgba(245,166,35,0.12) 0%, rgba(8,145,178,0.08) 100%)" }}
    >
      {/* Top glow bar */}
      <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-transparent via-[#f5a623] to-transparent" />

      <div className="px-4 py-3">
        {/* Entry label */}
        <div className="flex items-center gap-1.5 mb-2">
          <Zap className="w-3 h-3 text-[#f5a623]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#f5a623]/70">Entry Point</span>
        </div>

        {/* Trigger info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#f5a623]/15 border border-[#f5a623]/25 flex items-center justify-center text-lg">
            {meta.icon}
          </div>
          <div>
            <p className="text-xs font-black text-white leading-tight">{nodeData.label ?? meta.label}</p>
            <p className="text-[10px] text-white/35 mt-0.5">Flow starts here</p>
          </div>
        </div>
      </div>

      {/* Output handle — bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-[#f5a623] !bg-[#050a14] hover:!bg-[#f5a623] transition-colors"
        style={{ bottom: -6 }}
      />
    </div>
  );
}
