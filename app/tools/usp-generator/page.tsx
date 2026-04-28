"use client";

import { useState } from "react";
import SimplifiedNav from "@/components/SimplifiedNav";
import { Zap, Loader2, Copy, Check, Star } from "lucide-react";

export default function USPGeneratorPage() {
  const [business, setBusiness] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [audience, setAudience] = useState("");
  const [generating, setGenerating] = useState(false);
  const [usps, setUsps] = useState<{ usp: string; angle: string; useCase: string }[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function generate() {
    if (!business.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate 6 unique selling proposition (USP) statements for this business:
Business: "${business}"
${competitors ? `Competitors: ${competitors}` : ""}
${audience ? `Target audience: ${audience}` : ""}

For each USP, provide a JSON array:
[
  {"usp": "the USP statement itself (1-2 sentences max)", "angle": "what makes this angle unique", "useCase": "where to use this (headline, tagline, ad, about page)"}
]

6 different USPs with different angles:
1. Speed/efficiency angle
2. Results/outcome angle
3. Simplicity/ease angle
4. Trust/authority angle
5. Exclusivity/premium angle
6. Contrarian/different angle

Each must be specific, memorable, and differentiated. No generic statements.
Return ONLY the JSON array.`,
        }),
      });
      const data = await res.json() as { ok: boolean; content?: string };
      if (data.ok && data.content) {
        const match = data.content.match(/\[[\s\S]*\]/);
        if (match) setUsps(JSON.parse(match[0]));
      }
    } catch { /* silent */ }
    finally { setGenerating(false); }
  }

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <SimplifiedNav />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Star className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">USP Generator</h1>
            <p className="text-xs text-white/35">Find what makes you different — 6 unique positioning angles</p>
          </div>
        </div>

        {usps.length === 0 ? (
          <div className="space-y-3 max-w-md mx-auto">
            <input type="text" value={business} onChange={(e) => setBusiness(e.target.value)}
              placeholder="What does your business do? (e.g. AI-powered meal planning for busy parents)"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 transition" />
            <input type="text" value={audience} onChange={(e) => setAudience(e.target.value)}
              placeholder="Target audience (optional)"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition" />
            <input type="text" value={competitors} onChange={(e) => setCompetitors(e.target.value)}
              placeholder="Main competitors (optional)"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition" />
            <button onClick={generate} disabled={generating || !business.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-40">
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Finding your USP...</> : <><Zap className="w-4 h-4" /> Generate USPs</>}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button onClick={() => setUsps([])} className="text-xs text-white/30 hover:text-white/60 transition">← Start over</button>
            {usps.map((u, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 hover:border-amber-400/20 transition group">
                <p className="text-sm font-bold text-white leading-relaxed mb-2">&ldquo;{u.usp}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-amber-400/60 font-bold">{u.angle}</span>
                    <span className="text-[10px] text-white/20 ml-3">Best for: {u.useCase}</span>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(u.usp); setCopiedIdx(i); setTimeout(() => setCopiedIdx(null), 1500); }}
                    className="opacity-0 group-hover:opacity-100 transition text-white/20 hover:text-white/50">
                    {copiedIdx === i ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
