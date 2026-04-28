"use client";

import { useState } from "react";
import SimplifiedNav from "@/components/SimplifiedNav";
import { Palette, Copy, Check, RefreshCw } from "lucide-react";

type PaletteResult = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  name: string;
};

const PALETTES: PaletteResult[] = [
  { name: "Ocean Trust", primary: "#0891b2", secondary: "#1e3a5f", accent: "#f5a623", background: "#0f172a", text: "#f8fafc" },
  { name: "Forest Growth", primary: "#16a34a", secondary: "#1a3a2a", accent: "#22c55e", background: "#0a1a0f", text: "#f0fdf4" },
  { name: "Royal Authority", primary: "#7c3aed", secondary: "#2e1065", accent: "#a78bfa", background: "#0f0525", text: "#f5f3ff" },
  { name: "Sunset Energy", primary: "#ea580c", secondary: "#431407", accent: "#f97316", background: "#1a0a02", text: "#fff7ed" },
  { name: "Midnight Gold", primary: "#d97706", secondary: "#1c1917", accent: "#fbbf24", background: "#0c0a08", text: "#fefce8" },
  { name: "Rose Premium", primary: "#e11d48", secondary: "#1a0510", accent: "#fb7185", background: "#120308", text: "#fff1f2" },
  { name: "Arctic Clean", primary: "#0ea5e9", secondary: "#0c4a6e", accent: "#38bdf8", background: "#f0f9ff", text: "#0c4a6e" },
  { name: "Warm Earth", primary: "#92400e", secondary: "#451a03", accent: "#d97706", background: "#fffbeb", text: "#451a03" },
  { name: "Steel Modern", primary: "#475569", secondary: "#1e293b", accent: "#64748b", background: "#f8fafc", text: "#0f172a" },
  { name: "Neon Cyber", primary: "#f5a623", secondary: "#0f172a", accent: "#22d3ee", background: "#020617", text: "#e0f2fe" },
  { name: "Coral Vibrant", primary: "#f43f5e", secondary: "#0f172a", accent: "#fb923c", background: "#0a0a0a", text: "#fecdd3" },
  { name: "Sage Calm", primary: "#059669", secondary: "#064e3b", accent: "#34d399", background: "#f0fdf4", text: "#064e3b" },
];

export default function ColorPalettePage() {
  const [selected, setSelected] = useState<PaletteResult>(PALETTES[0]);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [customPrimary, setCustomPrimary] = useState("#0891b2");

  function copyColor(color: string) {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 1500);
  }

  function generateFromPrimary(hex: string): PaletteResult {
    // Simple palette derivation from primary color
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const isDark = (r + g + b) / 3 < 128;

    return {
      name: "Custom",
      primary: hex,
      secondary: `#${Math.max(0, r - 80).toString(16).padStart(2, "0")}${Math.max(0, g - 80).toString(16).padStart(2, "0")}${Math.max(0, b - 80).toString(16).padStart(2, "0")}`,
      accent: `#${Math.min(255, r + 40).toString(16).padStart(2, "0")}${Math.min(255, g + 40).toString(16).padStart(2, "0")}${Math.min(255, b + 40).toString(16).padStart(2, "0")}`,
      background: isDark ? "#0a0a0a" : "#fafafa",
      text: isDark ? "#f8fafc" : "#0f172a",
    };
  }

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <SimplifiedNav />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#e07850]/10 border border-[#e07850]/20 flex items-center justify-center">
            <Palette className="w-5 h-5 text-[#e07850]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Brand Color Palette</h1>
            <p className="text-xs text-white/35">Pick a palette for your site or generate from any color</p>
          </div>
        </div>

        {/* Custom generator */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 mb-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Generate from Color</p>
          <div className="flex items-center gap-3">
            <input type="color" value={customPrimary} onChange={(e) => setCustomPrimary(e.target.value)} className="w-12 h-10 rounded-lg border-0 cursor-pointer" />
            <input type="text" value={customPrimary} onChange={(e) => setCustomPrimary(e.target.value)} className="w-24 bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none" />
            <button onClick={() => setSelected(generateFromPrimary(customPrimary))} className="px-4 py-2 rounded-lg bg-[#f5a623] text-[#0a0f1e] text-xs font-bold hover:bg-[#e07850] transition">
              Generate Palette
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Palette grid */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Presets</p>
            <div className="grid grid-cols-2 gap-2">
              {PALETTES.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setSelected(p)}
                  className={`p-3 rounded-xl border transition text-left ${
                    selected.name === p.name ? "border-[#f5a623]/40 bg-[#f5a623]/10" : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                  }`}
                >
                  <div className="flex gap-1 mb-2">
                    {[p.primary, p.secondary, p.accent, p.background].map((c, i) => (
                      <div key={i} className="w-6 h-6 rounded" style={{ backgroundColor: c, border: "1px solid rgba(255,255,255,0.1)" }} />
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-white/60">{p.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Preview — {selected.name}</p>

            {/* Color swatches */}
            <div className="space-y-2 mb-4">
              {[
                { label: "Primary", color: selected.primary },
                { label: "Secondary", color: selected.secondary },
                { label: "Accent", color: selected.accent },
                { label: "Background", color: selected.background },
                { label: "Text", color: selected.text },
              ].map((swatch) => (
                <div key={swatch.label} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-10 h-10 rounded-lg shrink-0" style={{ backgroundColor: swatch.color, border: "1px solid rgba(255,255,255,0.1)" }} />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white/60">{swatch.label}</p>
                    <p className="text-[10px] text-white/25 font-mono">{swatch.color}</p>
                  </div>
                  <button onClick={() => copyColor(swatch.color)} className="text-[10px] text-white/20 hover:text-white/50 transition">
                    {copiedColor === swatch.color ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>

            {/* Site preview */}
            <div className="rounded-xl overflow-hidden border border-white/[0.1]" style={{ backgroundColor: selected.background }}>
              <div className="px-4 py-2 flex items-center gap-2" style={{ backgroundColor: selected.secondary, borderBottom: `1px solid ${selected.primary}30` }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selected.accent }} />
                <span className="text-[10px] font-bold" style={{ color: selected.text }}>Your Brand</span>
              </div>
              <div className="p-6 text-center">
                <h3 className="text-lg font-black mb-2" style={{ color: selected.text }}>Your Headline Here</h3>
                <p className="text-xs mb-4" style={{ color: `${selected.text}80` }}>Supporting text for your landing page goes here.</p>
                <button className="px-6 py-2 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: selected.primary }}>
                  Get Started
                </button>
              </div>
            </div>

            {/* CSS variables */}
            <div className="mt-4 rounded-xl bg-black/30 p-4">
              <p className="text-[10px] text-white/20 mb-2">CSS Variables</p>
              <pre className="text-[10px] text-[#f5a623]/60 font-mono leading-relaxed">
{`:root {
  --primary: ${selected.primary};
  --secondary: ${selected.secondary};
  --accent: ${selected.accent};
  --background: ${selected.background};
  --text: ${selected.text};
}`}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
