"use client";

import { useState } from "react";
import { Pencil, Save, X, Loader2 } from "lucide-react";
import RegenerateButton from "@/components/himalaya/RegenerateButton";
import SaveTemplateButton from "@/components/himalaya/SaveTemplateButton";
import type { AssetGroup } from "@/lib/himalaya/types";

type Props = {
  group: AssetGroup;
  analysisId: string;
  mode?: string;
  onSaved?: () => void;
  onRegenerated?: () => void;
};

function serializeForSave(group: AssetGroup, editedText: string): unknown {
  // Convert edited text back to the right shape for the API
  if (group.type === "list") {
    return editedText
      .split("\n")
      .map((l) => l.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean);
  }
  if (group.type === "kv") {
    const pairs: { label: string; value: string }[] = [];
    for (const line of editedText.split("\n")) {
      const match = line.match(/^(.+?):\s*(.+)$/);
      if (match) pairs.push({ label: match[1].trim(), value: match[2].trim() });
    }
    return pairs.length > 0 ? pairs : editedText;
  }
  return editedText;
}

function renderToEditableText(group: AssetGroup): string {
  if (group.type === "text") return group.content as string;
  if (group.type === "list") return (group.content as string[]).map((s) => `- ${s}`).join("\n");
  if (group.type === "kv") return (group.content as { label: string; value: string }[]).map((p) => `${p.label}: ${p.value}`).join("\n");
  if (group.type === "scripts") {
    return (group.content as { title: string; duration: string; sections: { timestamp: string; direction: string; copy: string }[] }[])
      .map((s) => [`## ${s.title} (${s.duration})`, ...s.sections.map((sec) => `[${sec.timestamp}] ${sec.direction}\n  "${sec.copy}"`)].join("\n"))
      .join("\n\n");
  }
  return String(group.content);
}

export default function EditableAssetCard({ group, analysisId, mode = "operator", onSaved, onRegenerated }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editText, setEditText] = useState("");

  function startEdit() {
    setEditText(renderToEditableText(group));
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setEditText("");
  }

  async function saveEdit() {
    if (!group.regenerateTarget) return;
    setSaving(true);
    try {
      const content = serializeForSave(group, editText);
      const res = await fetch(`/api/analyses/${analysisId}/asset`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: group.regenerateTarget, content }),
      });
      const data = (await res.json()) as { ok: boolean };
      if (data.ok) {
        setEditing(false);
        onSaved?.();
      }
    } catch {
      // non-fatal
    } finally {
      setSaving(false);
    }
  }

  const isEditable = !!group.regenerateTarget;

  return (
    <div className="rounded-2xl border border-white/[0.05] bg-gradient-to-br from-white/[0.03] via-white/[0.02] to-transparent p-4">
      {/* Header with actions */}
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30">{group.title}</h3>
        <div className="flex flex-wrap items-center gap-2">
          {editing ? (
            <>
              <button
                onClick={() => void saveEdit()}
                disabled={saving}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-bold text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-40"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save
              </button>
              <button
                onClick={cancelEdit}
                className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-semibold text-white/30 transition hover:text-white/60"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
            </>
          ) : (
            <>
              {isEditable && (
                <button
                  onClick={startEdit}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-semibold text-white/30 transition hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white/60"
                >
                  <Pencil className="w-3 h-3" />
                  Edit
                </button>
              )}
              {group.regenerateTarget && (
                <RegenerateButton analysisId={analysisId} target={group.regenerateTarget} onRegenerated={onRegenerated} />
              )}
              <SaveTemplateButton group={group} analysisId={analysisId} mode={mode} />
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {editing ? (
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="min-h-[120px] w-full resize-y rounded-lg border border-white/[0.1] bg-white/[0.03] p-3 font-mono text-xs leading-relaxed text-white/70 transition focus:border-[#f5a623]/30 focus:outline-none"
          autoFocus
        />
      ) : (
        <AssetCardContent group={group} />
      )}
    </div>
  );
}

// Render content in read mode (extracted from ResultsAssets patterns)
function AssetCardContent({ group }: { group: AssetGroup }) {
  if (group.type === "text") {
    return <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">{group.content as string}</p>;
  }

  if (group.type === "list") {
    return (
      <ul className="space-y-2">
        {(group.content as string[]).map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="text-[10px] font-black text-[#f5a623]/50 shrink-0 mt-0.5 w-4 text-right">{i + 1}.</span>
            <p className="text-xs text-white/60 leading-relaxed flex-1">{item}</p>
          </li>
        ))}
      </ul>
    );
  }

  if (group.type === "kv") {
    return (
      <div className="space-y-3">
        {(group.content as { label: string; value: string }[]).map(({ label, value }, i) => (
          <div key={i}>
            <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-1">{label}</p>
            <p className="text-xs text-white/60 leading-relaxed">{value}</p>
          </div>
        ))}
      </div>
    );
  }

  if (group.type === "scripts") {
    return (
      <div className="space-y-4">
        {(group.content as { title: string; duration: string; sections: { timestamp: string; direction: string; copy: string }[] }[]).map((script, i) => (
          <div key={i} className="rounded-xl border border-white/[0.05] bg-black/20 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-bold text-white/70">{script.title}</h4>
              <span className="text-[10px] text-white/25">{script.duration}</span>
            </div>
            <div className="space-y-2">
              {script.sections.map((section, j) => (
                <div key={j} className="flex gap-3">
                  <span className="text-[10px] text-[#f5a623]/50 font-mono shrink-0 w-10 pt-0.5">{section.timestamp}</span>
                  <div>
                    <p className="text-[10px] text-[#e07850]/50 font-bold uppercase tracking-wider mb-0.5">{section.direction}</p>
                    <p className="text-xs text-white/50 leading-relaxed">{section.copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
