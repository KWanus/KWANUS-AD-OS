"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Mail, Copy, Edit3, MousePointer, Eye } from "lucide-react";

export type EmailNodeData = {
  subject?: string;
  previewText?: string;
  body?: string;
  fromName?: string;
  fromEmail?: string;
  openRate?: number;
  clickRate?: number;
  onEdit?: (id: string) => void;
};

export default function EmailNode({ id, data, selected }: NodeProps) {
  const nodeData = data as EmailNodeData;

  return (
    <div
      className={`relative min-w-[220px] rounded-2xl border transition-all duration-200 ${
        selected
          ? "border-purple-400/80 shadow-[0_0_32px_rgba(168,85,247,0.4)]"
          : "border-purple-500/30 shadow-[0_0_16px_rgba(168,85,247,0.15)]"
      }`}
      style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.10) 0%, rgba(109,40,217,0.07) 100%)" }}
    >
      {/* Top glow */}
      <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-transparent via-purple-400 to-transparent" />

      <div className="px-4 py-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Mail className="w-3 h-3 text-purple-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400/70">Send Email</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => nodeData.onEdit?.(id)}
              className="p-1 rounded-md hover:bg-purple-500/20 text-white/30 hover:text-purple-300 transition"
              title="Edit email"
            >
              <Edit3 className="w-2.5 h-2.5" />
            </button>
            <button
              className="p-1 rounded-md hover:bg-purple-500/20 text-white/30 hover:text-purple-300 transition"
              title="Duplicate"
            >
              <Copy className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        {/* Subject */}
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate leading-tight">
              {nodeData.subject || "No subject set"}
            </p>
            {nodeData.previewText && (
              <p className="text-[10px] text-white/35 mt-0.5 truncate">{nodeData.previewText}</p>
            )}
          </div>
        </div>

        {/* Stats row — only when live */}
        {(nodeData.openRate !== undefined || nodeData.clickRate !== undefined) && (
          <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-white/[0.06]">
            {nodeData.openRate !== undefined && (
              <div className="flex items-center gap-1 text-[10px] text-white/40">
                <Eye className="w-2.5 h-2.5" />
                <span className="font-bold text-white/60">{nodeData.openRate}%</span>
                <span>opens</span>
              </div>
            )}
            {nodeData.clickRate !== undefined && (
              <div className="flex items-center gap-1 text-[10px] text-white/40">
                <MousePointer className="w-2.5 h-2.5" />
                <span className="font-bold text-white/60">{nodeData.clickRate}%</span>
                <span>clicks</span>
              </div>
            )}
          </div>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-purple-400 !bg-[#050a14] hover:!bg-purple-400 transition-colors"
        style={{ top: -6 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-purple-400 !bg-[#050a14] hover:!bg-purple-400 transition-colors"
        style={{ bottom: -6 }}
      />
    </div>
  );
}
