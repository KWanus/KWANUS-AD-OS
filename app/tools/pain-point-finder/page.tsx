"use client";

import { useState } from "react";
import SimplifiedNav from "@/components/SimplifiedNav";
import { Search, Loader2, Copy, Check, AlertTriangle, TrendingUp } from "lucide-react";

type PainResult = {
  painPoints: { pain: string; severity: "critical" | "high" | "medium"; frequency: string; monetizable: boolean }[];
  desires: { desire: string; willingness: "high" | "medium" | "low"; marketSize: string }[];
  opportunities: string[];
  hookAngles: string[];
};

export default function PainPointFinderPage() {
  const [audience, setAudience] = useState("");
  const [niche, setNiche] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<PainResult | null>(null);
  const [copied, setCopied] = useState(false);

  async function find() {
    if (!audience.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Research the deepest pain points and desires of "${audience}"${niche ? ` in the "${niche}" niche` : ""}. Return ONLY valid JSON:
{
  "painPoints": [
    {"pain": "specific pain", "severity": "critical", "frequency": "how often they feel it", "monetizable": true}
  ],
  "desires": [
    {"desire": "what they want", "willingness": "high", "marketSize": "large/medium/small"}
  ],
  "opportunities": ["3 business opportunities based on these pains"],
  "hookAngles": ["5 ad hook angles targeting these specific pains"]
}
Include 6 pain points (2 critical, 2 high, 2 medium) and 4 desires. Be extremely specific — no generic answers. Think about what keeps them up at night, what they secretly wish for, and what they'd pay to fix immediately.`,
        }),
      });
      const data = await res.json() as { ok: boolean; content?: string };
      if (data.ok && data.content) {
        const match = data.content.match(/\{[\s\S]*\}/);
        if (match) setResult(JSON.parse(match[0]));
      }
    } catch { /* silent */ }
    finally { setGenerating(false); }
  }

  function copyAll() {
    if (!result) return;
    const text = [
      `PAIN POINTS for ${audience}:`,
      ...result.painPoints.map((p) => `[${p.severity.toUpperCase()}] ${p.pain} (${p.frequency})`),
      "",
      "DESIRES:",
      ...result.desires.map((d) => `- ${d.desire} (willingness: ${d.willingness}, market: ${d.marketSize})`),
      "",
      "OPPORTUNITIES:",
      ...result.opportunities.map((o) => `- ${o}`),
      "",
      "HOOK ANGLES:",
      ...result.hookAngles.map((h) => `- "${h}"`),
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const severityColors = { critical: "border-red-500/20 bg-red-500/5 text-red-400", high: "border-amber-500/20 bg-amber-500/5 text-amber-400", medium: "border-blue-500/20 bg-blue-500/5 text-blue-400" };

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <SimplifiedNav />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Pain Point Finder</h1>
            <p className="text-xs text-white/35">Discover the deepest pains and desires of any audience</p>
          </div>
        </div>

        {!result ? (
          <div className="space-y-4 max-w-md mx-auto">
            <input type="text" value={audience} onChange={(e) => setAudience(e.target.value)}
              placeholder="Target audience (e.g. busy moms, SaaS founders, new real estate agents)"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-500/50 transition" />
            <input type="text" value={niche} onChange={(e) => setNiche(e.target.value)}
              placeholder="Niche (optional — e.g. weight loss, B2B marketing)"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition" />
            <button onClick={find} disabled={generating || !audience.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-40">
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Researching...</> : <><Search className="w-4 h-4" /> Find Pain Points</>}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button onClick={copyAll} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#f5a623] text-[#0a0f1e] text-xs font-bold hover:bg-[#e07850] transition">
                {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy All</>}
              </button>
              <button onClick={() => setResult(null)} className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-bold text-white/40 transition">New Research</button>
            </div>

            {/* Pain Points */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400/60 mb-3">Pain Points</p>
              <div className="space-y-2">
                {result.painPoints.map((p, i) => (
                  <div key={i} className={`rounded-xl border p-3 ${severityColors[p.severity]}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black uppercase">{p.severity}</span>
                      {p.monetizable && <span className="text-[9px] text-emerald-400">$ Monetizable</span>}
                    </div>
                    <p className="text-xs text-white/70">{p.pain}</p>
                    <p className="text-[10px] text-white/25 mt-1">{p.frequency}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Desires */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/60 mb-3">Desires</p>
              <div className="space-y-2">
                {result.desires.map((d, i) => (
                  <div key={i} className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3">
                    <p className="text-xs text-white/70">{d.desire}</p>
                    <p className="text-[10px] text-emerald-400/40 mt-1">Willingness: {d.willingness} · Market: {d.marketSize}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Opportunities */}
            <div className="rounded-2xl border border-[#f5a623]/15 bg-[#f5a623]/5 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#f5a623]/60 mb-2">Business Opportunities</p>
              {result.opportunities.map((o, i) => (
                <p key={i} className="text-xs text-white/50 mb-1.5 flex items-start gap-2">
                  <TrendingUp className="w-3 h-3 text-[#f5a623] shrink-0 mt-0.5" /> {o}
                </p>
              ))}
            </div>

            {/* Hook Angles */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#e07850]/60 mb-3">Ad Hook Angles</p>
              {result.hookAngles.map((h, i) => (
                <p key={i} className="text-xs text-white/60 mb-2 p-2 rounded-lg bg-[#e07850]/5 border border-[#e07850]/10">
                  &ldquo;{h}&rdquo;
                </p>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
