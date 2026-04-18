"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import { Mountain, Loader2, Copy, Check, Video, Clock } from "lucide-react";

export default function VSLPage() {
  const [niche, setNiche] = useState("");
  const [offer, setOffer] = useState("");
  const [price, setPrice] = useState("");
  const [audience, setAudience] = useState("");
  const [painPoints, setPainPoints] = useState("");
  const [result, setResult] = useState<{ script: string; duration: string; sections: { name: string; content: string; duration: string }[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function generate() {
    if (!niche) return;
    setLoading(true);
    try {
      const res = await fetch("/api/himalaya/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "vsl",
          params: {
            niche, offer: offer || niche, price: price || "$997",
            audience: audience || "customers",
            painPoints: painPoints ? painPoints.split(",").map(p => p.trim()) : ["not getting results"],
          },
        }),
      });
      const data = await res.json();
      if (data.ok) setResult(data.result);
    } catch { /* ignore */ }
    setLoading(false);
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text); setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const SECTION_COLORS: Record<string, string> = {
    Hook: "border-red-500/20 bg-red-500/[0.04]",
    Problem: "border-amber-500/20 bg-amber-500/[0.04]",
    Solution: "border-blue-500/20 bg-blue-500/[0.04]",
    Proof: "border-emerald-500/20 bg-emerald-500/[0.04]",
    Offer: "border-[#f5a623]/20 bg-[#f5a623]/[0.04]",
    Close: "border-purple-500/20 bg-purple-500/[0.04]",
  };

  return (
    <main className="min-h-screen bg-t-bg text-t-text">
      <AppNav />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-20">
        <div className="pt-8 pb-4">
          <h1 className="text-2xl font-black">VSL Generator</h1>
          <p className="text-sm text-t-text-muted">Create a 10-minute Video Sales Letter script that converts cold traffic into buyers.</p>
        </div>

        <div className="space-y-3 mb-6">
          <input type="text" value={niche} onChange={e => setNiche(e.target.value)} placeholder="Your niche"
            className="w-full rounded-xl border border-t-border bg-t-bg-raised px-4 py-3 text-sm placeholder-t-text-faint outline-none focus:border-[#f5a623]/30 transition" />
          <div className="grid grid-cols-3 gap-2">
            <input type="text" value={offer} onChange={e => setOffer(e.target.value)} placeholder="Your offer"
              className="rounded-xl border border-t-border bg-t-bg-raised px-3 py-2.5 text-sm placeholder-t-text-faint outline-none" />
            <input type="text" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price"
              className="rounded-xl border border-t-border bg-t-bg-raised px-3 py-2.5 text-sm placeholder-t-text-faint outline-none" />
            <input type="text" value={audience} onChange={e => setAudience(e.target.value)} placeholder="Audience"
              className="rounded-xl border border-t-border bg-t-bg-raised px-3 py-2.5 text-sm placeholder-t-text-faint outline-none" />
          </div>
          <input type="text" value={painPoints} onChange={e => setPainPoints(e.target.value)} placeholder="Pain points (comma separated)"
            className="w-full rounded-xl border border-t-border bg-t-bg-raised px-4 py-3 text-sm placeholder-t-text-faint outline-none" />
          <button onClick={() => void generate()} disabled={!niche || loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] py-3 text-sm font-bold text-[#0c0a08] disabled:opacity-30 hover:opacity-90 transition">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
            {loading ? "Writing script..." : "Generate VSL Script"}
          </button>
        </div>

        {result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/[0.03] px-4 py-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#f5a623]" />
                <span className="text-sm font-bold">Total: {result.duration}</span>
              </div>
              <span className="text-xs text-t-text-faint">{result.sections.length} sections</span>
            </div>

            <div className="space-y-3">
              {result.sections.map((s, i) => {
                const color = Object.entries(SECTION_COLORS).find(([k]) => s.name.includes(k))?.[1] ?? "border-t-border";
                return (
                  <div key={i} className={`rounded-xl border ${color} p-4`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#f5a623]">{s.name}</span>
                        <span className="text-[10px] text-t-text-faint">{s.duration}</span>
                      </div>
                      <button onClick={() => copy(s.content, `section-${i}`)}
                        className="text-[10px] font-bold text-t-text-faint hover:text-t-text transition flex items-center gap-1">
                        {copiedId === `section-${i}` ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                      </button>
                    </div>
                    <p className="text-sm text-t-text-muted leading-relaxed">{s.content}</p>
                  </div>
                );
              })}
            </div>

            <button onClick={() => copy(result.script || result.sections.map(s => `[${s.name} — ${s.duration}]\n${s.content}`).join("\n\n"), "full")}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-t-border py-2.5 text-xs font-bold text-t-text-muted hover:text-t-text transition">
              {copiedId === "full" ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy Full Script</>}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
