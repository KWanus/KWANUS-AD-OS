"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import { Shield, Loader2, Copy, Check } from "lucide-react";

export default function RefundPreventerPage() {
  const [product, setProduct] = useState("");
  const [generating, setGenerating] = useState(false);
  const [strategies, setStrategies] = useState<{ strategy: string; email: string; timing: string }[]>([]);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!product.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Create a refund prevention strategy for "${product}". Return JSON array:
[
  {"strategy": "what to do", "email": "ready-to-send email (full body text, 150-200 words)", "timing": "when to send"},
  ...
]
Create 5 anti-refund touchpoints:
1. Immediate post-purchase (prevent buyer's remorse)
2. Day 1 (set expectations)
3. Day 3 (early win)
4. Day 7 (check-in before refund window)
5. Day 14 (lock in satisfaction)

Each email must be specific to "${product}". No placeholders. Ready to copy and use.`,
        }),
      });
      const data = await res.json() as { ok: boolean; content?: string };
      if (data.ok && data.content) {
        const match = data.content.match(/\[[\s\S]*\]/);
        if (match) setStrategies(JSON.parse(match[0]));
      }
    } catch { /* silent */ }
    finally { setGenerating(false); }
  }

  function copyAll() {
    navigator.clipboard.writeText(strategies.map((s) => `## ${s.timing}: ${s.strategy}\n\n${s.email}`).join("\n\n---\n\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Refund Preventer</h1>
            <p className="text-xs text-white/35">5 automated emails that reduce refunds and increase satisfaction</p>
          </div>
        </div>

        {strategies.length === 0 ? (
          <div className="space-y-4 max-w-md mx-auto">
            <input type="text" value={product} onChange={(e) => setProduct(e.target.value)}
              placeholder="Product or service name"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-green-500/50 transition" />
            <button onClick={generate} disabled={generating || !product.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-40">
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating strategy...</> : <><Shield className="w-4 h-4" /> Build Refund Prevention</>}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button onClick={copyAll} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-400 transition">
                {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy All Emails</>}
              </button>
              <button onClick={() => setStrategies([])} className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-bold text-white/40 transition">New Product</button>
            </div>

            {strategies.map((s, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
                  <div>
                    <span className="text-emerald-400 font-bold text-xs mr-2">{s.timing}</span>
                    <span className="text-xs text-white/40">{s.strategy}</span>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(s.email); }}
                    className="text-[10px] text-white/20 hover:text-white/50 transition">Copy</button>
                </div>
                <div className="p-5">
                  <pre className="text-xs text-white/60 leading-relaxed whitespace-pre-wrap font-sans">{s.email}</pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
