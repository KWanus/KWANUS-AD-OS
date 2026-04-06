"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import { Gift, Copy, Check, Loader2 } from "lucide-react";

export default function ThankYouPageBuilderPage() {
  const [productName, setProductName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [page, setPage] = useState<{ headline: string; subheadline: string; steps: string[]; upsell: string; socialProof: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!productName.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Create a high-converting thank-you page for "${productName}". Return JSON:
{
  "headline": "confirmation headline that makes them feel great about buying",
  "subheadline": "what happens next + set expectations",
  "steps": ["step 1 — what to do right now", "step 2 — what to expect", "step 3 — how to get help"],
  "upsell": "one-sentence pitch for a complementary offer or upgrade",
  "socialProof": "a short social proof statement to reduce buyer's remorse"
}
Make it specific to "${productName}". No placeholders.`,
        }),
      });
      const data = await res.json() as { ok: boolean; content?: string };
      if (data.ok && data.content) {
        const match = data.content.match(/\{[\s\S]*\}/);
        if (match) setPage(JSON.parse(match[0]));
      }
    } catch { /* silent */ }
    finally { setGenerating(false); }
  }

  function copyPage() {
    if (!page) return;
    navigator.clipboard.writeText(`# ${page.headline}\n\n${page.subheadline}\n\n## What to do next:\n${page.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n${page.socialProof}\n\n---\n${page.upsell}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Gift className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Thank-You Page Builder</h1>
            <p className="text-xs text-white/35">Create a post-purchase page that reduces refunds and upsells</p>
          </div>
        </div>

        {!page ? (
          <div className="space-y-4 max-w-md mx-auto">
            <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)}
              placeholder="Product or service name (e.g. Growth Accelerator Package)"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/50 transition" />
            <button onClick={generate} disabled={generating || !productName.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-40">
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Building...</> : <><Gift className="w-4 h-4" /> Generate Thank-You Page</>}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button onClick={copyPage} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-[#0a0f1e] text-xs font-bold hover:bg-cyan-400 transition">
                {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
              <button onClick={() => setPage(null)} className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-bold text-white/40 transition">New Page</button>
            </div>

            {/* Preview */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-black text-white mb-2">{page.headline}</h2>
              <p className="text-sm text-white/50 mb-6">{page.subheadline}</p>

              <div className="text-left max-w-sm mx-auto space-y-3 mb-6">
                {page.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-black/20 border border-white/[0.06]">
                    <span className="text-emerald-400 font-bold shrink-0">{i + 1}.</span>
                    <p className="text-xs text-white/60">{step}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs text-white/30 italic mb-4">{page.socialProof}</p>

              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <p className="text-xs text-cyan-300/70">{page.upsell}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
