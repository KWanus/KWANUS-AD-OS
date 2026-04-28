"use client";

import { useState } from "react";
import SimplifiedNav from "@/components/SimplifiedNav";
import { Lightbulb, Loader2, Check, X, AlertTriangle, ArrowRight } from "lucide-react";

type ValidationResult = {
  score: number;
  verdict: "Go" | "Maybe" | "Risky" | "Stop";
  checks: { label: string; pass: boolean; note: string }[];
  nextSteps: string[];
};

export default function IdeaValidatorPage() {
  const [idea, setIdea] = useState("");
  const [audience, setAudience] = useState("");
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

  async function validate() {
    if (!idea.trim()) return;
    setValidating(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Validate this business idea and score it for viability.

Idea: "${idea}"
Target audience: "${audience || "general"}"

Score 0-100 and provide your assessment. Return ONLY valid JSON:
{
  "score": 75,
  "verdict": "Go",
  "checks": [
    {"label": "Market Demand", "pass": true, "note": "explanation"},
    {"label": "Competition Level", "pass": true, "note": "explanation"},
    {"label": "Revenue Potential", "pass": true, "note": "explanation"},
    {"label": "Ease of Entry", "pass": false, "note": "explanation"},
    {"label": "Scalability", "pass": true, "note": "explanation"},
    {"label": "Differentiation", "pass": false, "note": "explanation"}
  ],
  "nextSteps": ["step 1", "step 2", "step 3"]
}

Verdict must be one of: "Go" (70+), "Maybe" (50-69), "Risky" (30-49), "Stop" (<30).
Be honest and specific. No generic advice.`,
        }),
      });
      const data = await res.json() as { ok: boolean; content?: string };
      if (data.ok && data.content) {
        try {
          const jsonMatch = data.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]) as ValidationResult;
            setResult(parsed);
          }
        } catch {
          // Parse failed
        }
      }
    } catch { /* silent */ }
    finally { setValidating(false); }
  }

  const verdictColors: Record<string, string> = {
    Go: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
    Maybe: "text-amber-400 border-amber-500/20 bg-amber-500/5",
    Risky: "text-orange-400 border-orange-500/20 bg-orange-500/5",
    Stop: "text-red-400 border-red-500/20 bg-red-500/5",
  };

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <SimplifiedNav />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Idea Validator</h1>
            <p className="text-xs text-white/35">Get an instant viability score for any business idea</p>
          </div>
        </div>

        {!result ? (
          <div className="space-y-4">
            <textarea value={idea} onChange={(e) => setIdea(e.target.value)} rows={3}
              placeholder="Describe your business idea... (e.g. 'An AI-powered meal planning app for busy parents')"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 transition resize-none" />
            <input type="text" value={audience} onChange={(e) => setAudience(e.target.value)}
              placeholder="Target audience (optional — e.g. 'busy parents aged 25-40')"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition" />
            <button onClick={validate} disabled={validating || !idea.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-40">
              {validating ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Lightbulb className="w-4 h-4" /> Validate Idea</>}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Score + Verdict */}
            <div className={`rounded-2xl border p-6 text-center ${verdictColors[result.verdict] ?? verdictColors.Maybe}`}>
              <p className="text-5xl font-black">{result.score}</p>
              <p className="text-lg font-bold mt-1">{result.verdict}</p>
              <p className="text-xs opacity-60 mt-1">{idea}</p>
            </div>

            {/* Checks */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-2">
              {result.checks.map((check, i) => (
                <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl border ${
                  check.pass ? "border-emerald-500/15 bg-emerald-500/5" : "border-red-500/15 bg-red-500/5"
                }`}>
                  {check.pass ? <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-xs font-bold text-white/70">{check.label}</p>
                    <p className="text-[10px] text-white/35 mt-0.5">{check.note}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Next steps */}
            {result.nextSteps.length > 0 && (
              <div className="rounded-2xl border border-[#f5a623]/15 bg-[#f5a623]/5 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#f5a623]/60 mb-2">Next Steps</p>
                {result.nextSteps.map((step, i) => (
                  <p key={i} className="text-xs text-white/50 mb-1.5 flex items-start gap-2">
                    <ArrowRight className="w-3 h-3 text-[#f5a623] shrink-0 mt-0.5" /> {step}
                  </p>
                ))}
              </div>
            )}

            <button onClick={() => { setResult(null); setIdea(""); }} className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-bold text-white/40 hover:text-white/60 transition">
              Validate Another Idea
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
