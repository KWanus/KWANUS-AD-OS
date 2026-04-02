"use client";

import { useState } from "react";
import { Bookmark, Loader2, Check, X } from "lucide-react";
import type { AssetGroup } from "@/lib/himalaya/types";

type Props = {
  group: AssetGroup;
  analysisId: string;
  mode: string;
};

export default function SaveTemplateButton({ group, analysisId, mode }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!group.regenerateTarget) return null;

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/himalaya/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          assetType: group.regenerateTarget,
          mode,
          content: group.content,
          sourceRunId: analysisId,
        }),
      });
      const data = (await res.json()) as { ok: boolean };
      if (data.ok) {
        setSaved(true);
        setTimeout(() => { setSaved(false); setOpen(false); setName(""); }, 1500);
      }
    } catch {
      // non-fatal
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
        <Check className="w-3 h-3" /> Saved
      </span>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] transition text-[10px] font-semibold text-white/30 hover:text-white/60"
        title="Save as reusable template"
      >
        <Bookmark className="w-3 h-3" />
        Save as Template
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Template name..."
        className="px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.1] text-[10px] text-white/60 focus:outline-none focus:border-cyan-500/30 w-32"
        autoFocus
        onKeyDown={(e) => { if (e.key === "Enter") void handleSave(); if (e.key === "Escape") setOpen(false); }}
      />
      <button
        onClick={() => void handleSave()}
        disabled={saving || !name.trim()}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-40"
      >
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
      </button>
      <button
        onClick={() => { setOpen(false); setName(""); }}
        className="inline-flex items-center p-1 rounded-lg text-white/20 hover:text-white/50 transition"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
