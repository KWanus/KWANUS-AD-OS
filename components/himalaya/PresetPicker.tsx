"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Check, Settings2 } from "lucide-react";

type Preset = {
  id: string;
  name: string;
  config: Record<string, unknown>;
  isDefault: boolean;
  createdAt: string;
};

type Props = {
  onSelect?: (preset: Preset | null) => void;
};

const PRESET_FIELDS: { key: string; label: string; placeholder: string; type: "text" | "select"; options?: string[] }[] = [
  { key: "tone", label: "Tone", placeholder: "professional", type: "select", options: ["professional", "casual", "bold", "empathetic", "direct"] },
  { key: "density", label: "Output Density", placeholder: "standard", type: "select", options: ["minimal", "standard", "detailed"] },
  { key: "homepageStyle", label: "Homepage Style", placeholder: "conversion-focused", type: "select", options: ["conversion-focused", "story-driven", "minimal-clean", "feature-led"] },
  { key: "emailTone", label: "Email Tone", placeholder: "friendly", type: "select", options: ["friendly", "authoritative", "urgent", "educational", "personal"] },
  { key: "businessType", label: "Business Type", placeholder: "e.g. SaaS, Agency", type: "text" },
];

export default function PresetPicker({ onSelect }: Props) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newConfig, setNewConfig] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/himalaya/presets")
      .then((r) => r.json() as Promise<{ ok: boolean; presets?: Preset[] }>)
      .then((data) => {
        if (data.ok && data.presets) {
          setPresets(data.presets);
          const def = data.presets.find((p) => p.isDefault);
          if (def) {
            setSelectedId(def.id);
            onSelect?.(def);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function handleSelect(preset: Preset | null) {
    setSelectedId(preset?.id ?? null);
    onSelect?.(preset ?? null);
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const config: Record<string, string> = {};
      for (const f of PRESET_FIELDS) {
        if (newConfig[f.key]?.trim()) config[f.key] = newConfig[f.key].trim();
      }
      const res = await fetch("/api/himalaya/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), config, isDefault: presets.length === 0 }),
      });
      const data = (await res.json()) as { ok: boolean; preset?: Preset };
      if (data.ok && data.preset) {
        setPresets([data.preset, ...presets]);
        setCreating(false);
        setNewName("");
        setNewConfig({});
        handleSelect(data.preset);
      }
    } catch {
      // non-fatal
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[10px] text-white/20">
        <Loader2 className="w-3 h-3 animate-spin" /> Loading presets...
      </div>
    );
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.07] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Settings2 className="w-3.5 h-3.5 text-white/25" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30">Output Preset</h3>
        </div>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[10px] font-semibold text-white/30 hover:text-white/60 transition"
          >
            <Plus className="w-3 h-3" /> New Preset
          </button>
        )}
      </div>

      {/* Preset list */}
      {presets.length > 0 && !creating && (
        <div className="flex flex-wrap gap-2 mb-2">
          <button
            onClick={() => handleSelect(null)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition border ${
              !selectedId ? "bg-white/[0.08] border-white/[0.15] text-white/60" : "bg-white/[0.02] border-white/[0.06] text-white/30 hover:text-white/50"
            }`}
          >
            None
          </button>
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelect(p)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition border ${
                selectedId === p.id
                  ? "bg-[#f5a623]/10 border-[#f5a623]/20 text-[#f5a623]"
                  : "bg-white/[0.02] border-white/[0.06] text-white/30 hover:text-white/50"
              }`}
            >
              {p.name}
              {p.isDefault && <span className="ml-1 text-[8px] text-white/20">(default)</span>}
            </button>
          ))}
        </div>
      )}

      {/* Create form */}
      {creating && (
        <div className="space-y-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Preset name..."
            className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.1] text-xs text-white/60 focus:outline-none focus:border-[#f5a623]/30"
            autoFocus
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESET_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="text-[9px] font-bold text-white/25 uppercase mb-1 block">{f.label}</label>
                {f.type === "select" && f.options ? (
                  <select
                    value={newConfig[f.key] ?? ""}
                    onChange={(e) => setNewConfig({ ...newConfig, [f.key]: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/50 focus:outline-none appearance-none"
                  >
                    <option value="" className="bg-[#0d1525]">Default</option>
                    {f.options.map((o) => <option key={o} value={o} className="bg-[#0d1525]">{o}</option>)}
                  </select>
                ) : (
                  <input
                    value={newConfig[f.key] ?? ""}
                    onChange={(e) => setNewConfig({ ...newConfig, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/50 focus:outline-none focus:border-[#f5a623]/30"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => void handleCreate()}
              disabled={saving || !newName.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-40"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Save Preset
            </button>
            <button
              onClick={() => { setCreating(false); setNewName(""); setNewConfig({}); }}
              className="px-3 py-1.5 rounded-lg text-[10px] font-semibold text-white/30 hover:text-white/60 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
