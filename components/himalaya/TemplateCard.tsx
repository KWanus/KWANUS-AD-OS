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
    <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.03] via-white/[0.02] to-transparent p-4 transition hover:border-white/[0.12]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white/70 sm:truncate">{template.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded border border-cyan-500/15 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-400/50">
              {TYPE_LABELS[template.assetType] ?? template.assetType}
            </span>
            <span className="text-[10px] font-bold text-white/25 uppercase">
              {MODE_LABELS[template.mode] ?? template.mode}
            </span>
          </div>
          <p className="mt-3 text-[10px] text-white/20">
            {formatDistanceToNow(new Date(template.createdAt), { addSuffix: true })}
            {template.sourceRunId && (
              <span> · from run {template.sourceRunId.slice(0, 8)}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleCopy}
            className="rounded-lg p-2 text-white/20 transition hover:bg-white/[0.05] hover:text-white/50"
            title="Copy content"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="rounded-lg p-2 text-white/20 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
            title="Delete template"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
