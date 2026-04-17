"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import { Shield, Loader2, Copy, Check } from "lucide-react";

const GUARANTEE_TYPES = [
  { id: "money-back", label: "Money-Back", desc: "Full refund within X days" },
  { id: "results", label: "Results-Based", desc: "If you don't get X result..." },
  { id: "double", label: "Double Your Money", desc: "Get 2x back if it doesn't work" },
  { id: "keep-it", label: "Keep Everything", desc: "Refund + keep all materials" },
  { id: "conditional", label: "Conditional", desc: "Do the work, if no results, refund" },
  { id: "lifetime", label: "Lifetime Access", desc: "Updates forever, cancel anytime" },
];

export default function GuaranteeBuilderPage() {
  const [product, setProduct] = useState("");
  const [selectedType, setSelectedType] = useState("money-back");
  const [days, setDays] = useState("30");
  const [generating, setGenerating] = useState(false);
  const [guarantees, setGuarantees] = useState<{ type: string; short: string; full: string; badgeCopy: string }[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function generate() {
    if (!product.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Write 3 guarantee variations for "${product}" using the "${selectedType}" style (${days}-day window). Return JSON:
[
  {"type": "name", "short": "one-line guarantee (for badges/buttons)", "full": "full guarantee paragraph (3-4 sentences, persuasive)", "badgeCopy": "ultra-short badge text (under 8 words)"}
]
Make each variation different in tone: 1) Confident/bold 2) Empathetic/warm 3) Specific/data-driven. No placeholders.`,
        }),
      });
      const data = await res.json() as { ok: boolean; content?: string };
      if (data.ok && data.content) {
        const match = data.content.match(/\[[\s\S]*\]/);
        if (match) setGuarantees(JSON.parse(match[0]));
      }
    } catch { /* silent */ }
    finally { setGenerating(false); }
  }

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Guarantee Builder</h1>
            <p className="text-xs text-white/35">Create risk-reversal guarantees that increase conversions</p>
          </div>
        </div>

        {guarantees.length === 0 ? (
          <div className="space-y-4">
            <input type="text" value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Product or service name"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Guarantee Type</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {GUARANTEE_TYPES.map((g) => (
                  <button key={g.id} onClick={() => setSelectedType(g.id)}
                    className={`p-3 rounded-xl border text-left transition ${selectedType === g.id ? "border-emerald-500/40 bg-emerald-500/10" : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"}`}>
                    <p className="text-xs font-bold text-white">{g.label}</p>
                    <p className="text-[10px] text-white/25 mt-0.5">{g.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Duration</p>
              <div className="flex gap-2">
                {["7", "14", "30", "60", "90", "365"].map((d) => (
                  <button key={d} onClick={() => setDays(d)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition border ${days === d ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-white/10 text-white/30"}`}>
                    {d}d
                  </button>
                ))}
              </div>
            </div>
            <button onClick={generate} disabled={generating || !product.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-40">
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Writing...</> : <><Shield className="w-4 h-4" /> Generate Guarantees</>}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button onClick={() => setGuarantees([])} className="text-xs text-white/30 hover:text-white/60 transition">← Start over</button>
            {guarantees.map((g, i) => (
              <div key={i} className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-5 group">
                {/* Badge preview */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-black text-emerald-300 uppercase">{g.badgeCopy}</span>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(g.full); setCopiedIdx(i); setTimeout(() => setCopiedIdx(null), 1500); }}
                    className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-white/50 transition">
                    {copiedIdx === i ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-sm font-bold text-white mb-2">{g.short}</p>
                <p className="text-xs text-white/50 leading-relaxed">{g.full}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
