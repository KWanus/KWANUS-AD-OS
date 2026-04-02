"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Trash2, Loader2, Copy, Check } from "lucide-react";

type Template = {
  id: string;
  name: string;
  assetType: string;
  mode: string;
  content: unknown;
  sourceRunId: string | null;
  createdAt: string;
};

const TYPE_LABELS: Record<string, string> = {
  adHooks: "Marketing Angles",
  adScripts: "Ad Scripts",
  adBriefs: "Ad Briefs",
  landingPage: "Homepage Blueprint",
  emailSequences: "Email Sequence",
  executionChecklist: "Action Roadmap",
};

const MODE_LABELS: Record<string, string> = {
  operator: "Scratch",
  consultant: "Improve",
};

export default function TemplateCard({ template, onDeleted }: { template: Template; onDeleted?: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/himalaya/templates/${template.id}`, { method: "DELETE" });
      const data = (await res.json()) as { ok: boolean };
      if (data.ok) onDeleted?.();
    } catch {
      // non-fatal
    } finally {
      setDeleting(false);
    }
  }

  function handleCopy() {
    const text = typeof template.content === "string"
      ? template.content
      : JSON.stringify(template.content, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.07] rounded-xl p-4 hover:border-white/[0.12] transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white/70 truncate">{template.name}</h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-cyan-400/50 bg-cyan-500/10 border border-cyan-500/15 px-2 py-0.5 rounded">
              {TYPE_LABELS[template.assetType] ?? template.assetType}
            </span>
            <span className="text-[10px] font-bold text-white/25 uppercase">
              {MODE_LABELS[template.mode] ?? template.mode}
            </span>
          </div>
          <p className="text-[10px] text-white/20 mt-2">
            {formatDistanceToNow(new Date(template.createdAt), { addSuffix: true })}
            {template.sourceRunId && (
              <span> · from run {template.sourceRunId.slice(0, 8)}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-white/[0.05] text-white/20 hover:text-white/50 transition"
            title="Copy content"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition disabled:opacity-40"
            title="Delete template"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
