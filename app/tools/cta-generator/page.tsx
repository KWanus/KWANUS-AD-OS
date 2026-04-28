"use client";

import { useState } from "react";
import SimplifiedNav from "@/components/SimplifiedNav";
import { Zap, Copy, Check, RefreshCw } from "lucide-react";

const CTA_FORMULAS = [
  { name: "First Person", template: (action: string, result: string) => `Get My ${result}` },
  { name: "Action + Benefit", template: (action: string, result: string) => `${action} and ${result}` },
  { name: "Start + Outcome", template: (action: string, result: string) => `Start ${action} Today` },
  { name: "Yes Please", template: (action: string, result: string) => `Yes, I Want ${result}` },
  { name: "Urgency", template: (action: string, result: string) => `${action} Now — Limited Spots` },
  { name: "Risk Reversal", template: (action: string, result: string) => `Try It Free — ${result} Guaranteed` },
  { name: "Specificity", template: (action: string, result: string) => `${action} in 7 Days or Less` },
  { name: "Social Proof", template: (action: string, result: string) => `Join 500+ Who Already ${result}` },
  { name: "Question", template: (action: string, result: string) => `Ready to ${result}?` },
  { name: "Command", template: (action: string, result: string) => `${action}. ${result}. Now.` },
  { name: "Exclusive", template: (action: string, result: string) => `Claim Your ${result} Access` },
  { name: "Pain Escape", template: (action: string, result: string) => `Stop Struggling — ${action}` },
];

export default function CtaGeneratorPage() {
  const [action, setAction] = useState("Get Started");
  const [result, setResult] = useState("Results");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  function copyText(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  const ctas = CTA_FORMULAS.map((f) => ({
    name: f.name,
    text: f.template(action, result),
  }));

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <SimplifiedNav />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#f5a623]/10 border border-[#f5a623]/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-[#f5a623]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">CTA Generator</h1>
            <p className="text-xs text-white/35">12 proven call-to-action formulas customized for your offer</p>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Action Verb</label>
            <input type="text" value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. Get Started, Book, Download"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 transition" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">Desired Result</label>
            <input type="text" value={result} onChange={(e) => setResult(e.target.value)} placeholder="e.g. Free Audit, More Leads, Growth Plan"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 transition" />
          </div>
        </div>

        {/* Generated CTAs */}
        <div className="space-y-2">
          {ctas.map((cta, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:border-[#f5a623]/20 transition group">
              <span className="text-[10px] text-white/20 font-mono w-20 shrink-0">{cta.name}</span>
              <div className="flex-1 flex items-center gap-3">
                <button
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-white text-sm font-bold hover:opacity-90 transition"
                  onClick={() => copyText(cta.text, i)}
                >
                  {cta.text}
                </button>
              </div>
              <button
                onClick={() => copyText(cta.text, i)}
                className="opacity-0 group-hover:opacity-100 transition text-white/20 hover:text-white/50"
              >
                {copiedIdx === i ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-white/15 text-center mt-6">Click any button to copy the text</p>
      </main>
    </div>
  );
}
