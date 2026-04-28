"use client";

import { useState } from "react";
import SimplifiedNav from "@/components/SimplifiedNav";
import { Mountain, Loader2, Copy, Check, FileText, Quote } from "lucide-react";

export default function CaseStudyPage() {
  const [clientName, setClientName] = useState("");
  const [niche, setNiche] = useState("");
  const [challenge, setChallenge] = useState("");
  const [solution, setSolution] = useState("");
  const [results, setResults] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [output, setOutput] = useState<{ title: string; content: string; pullQuote: string; adHook: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function generate() {
    if (!clientName || !niche) return;
    setLoading(true);
    try {
      const res = await fetch("/api/himalaya/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "case_study",
          params: {
            clientName, niche,
            challenge: challenge || "Struggling with growth",
            solution: solution || "Implemented our system",
            results: results || "3x revenue in 90 days",
            timeframe: timeframe || "90 days",
          },
        }),
      });
      const data = await res.json();
      if (data.ok) setOutput(data.result);
    } catch { /* ignore */ }
    setLoading(false);
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <main className="min-h-screen bg-t-bg text-t-text">
      <SimplifiedNav />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-20">
        <div className="pt-8 pb-4">
          <h1 className="text-2xl font-black">Case Study Generator</h1>
          <p className="text-sm text-t-text-muted">Turn client results into compelling case studies and ad hooks.</p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-2 gap-2">
            <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client name"
              className="rounded-xl border border-t-border bg-t-bg-raised px-4 py-3 text-sm placeholder-t-text-faint outline-none focus:border-[#f5a623]/30" />
            <input type="text" value={niche} onChange={e => setNiche(e.target.value)} placeholder="Industry/niche"
              className="rounded-xl border border-t-border bg-t-bg-raised px-4 py-3 text-sm placeholder-t-text-faint outline-none focus:border-[#f5a623]/30" />
          </div>
          <input type="text" value={challenge} onChange={e => setChallenge(e.target.value)} placeholder="What was the challenge?"
            className="w-full rounded-xl border border-t-border bg-t-bg-raised px-4 py-3 text-sm placeholder-t-text-faint outline-none" />
          <input type="text" value={solution} onChange={e => setSolution(e.target.value)} placeholder="What was the solution?"
            className="w-full rounded-xl border border-t-border bg-t-bg-raised px-4 py-3 text-sm placeholder-t-text-faint outline-none" />
          <div className="grid grid-cols-2 gap-2">
            <input type="text" value={results} onChange={e => setResults(e.target.value)} placeholder="Results achieved"
              className="rounded-xl border border-t-border bg-t-bg-raised px-4 py-3 text-sm placeholder-t-text-faint outline-none" />
            <input type="text" value={timeframe} onChange={e => setTimeframe(e.target.value)} placeholder="Timeframe (90 days)"
              className="rounded-xl border border-t-border bg-t-bg-raised px-4 py-3 text-sm placeholder-t-text-faint outline-none" />
          </div>
          <button onClick={() => void generate()} disabled={!clientName || !niche || loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] py-3 text-sm font-bold text-[#0c0a08] disabled:opacity-30 hover:opacity-90 transition">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {loading ? "Writing..." : "Generate Case Study"}
          </button>
        </div>

        {output && (
          <div className="space-y-4">
            {/* Title */}
            <div className="rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/[0.03] p-5">
              <h2 className="text-xl font-black">{output.title}</h2>
            </div>

            {/* Pull Quote */}
            <div className="rounded-xl border border-t-border bg-t-bg-raised p-5">
              <div className="flex items-start gap-3">
                <Quote className="w-5 h-5 text-[#f5a623] shrink-0 mt-0.5" />
                <p className="text-base font-bold italic text-t-text-muted">{output.pullQuote}</p>
              </div>
              <button onClick={() => copy(output.pullQuote, "quote")}
                className="mt-2 text-[10px] font-bold text-[#f5a623]/60 hover:text-[#f5a623] transition flex items-center gap-1">
                {copiedId === "quote" ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy Quote</>}
              </button>
            </div>

            {/* Full Content */}
            <div className="rounded-xl border border-t-border bg-t-bg-raised p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black text-t-text-faint tracking-wider">FULL CASE STUDY</p>
                <button onClick={() => copy(output.content, "content")}
                  className="text-[10px] font-bold text-[#f5a623]/60 hover:text-[#f5a623] transition flex items-center gap-1">
                  {copiedId === "content" ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                </button>
              </div>
              <div className="text-sm text-t-text-muted leading-relaxed whitespace-pre-wrap">{output.content}</div>
            </div>

            {/* Ad Hook */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
              <p className="text-[10px] font-black text-emerald-400/60 mb-1">AD HOOK FROM THIS CASE STUDY</p>
              <p className="text-sm font-bold text-emerald-300">&ldquo;{output.adHook}&rdquo;</p>
              <button onClick={() => copy(output.adHook, "hook")}
                className="mt-2 text-[10px] font-bold text-emerald-400/60 hover:text-emerald-400 transition flex items-center gap-1">
                {copiedId === "hook" ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy Hook</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
