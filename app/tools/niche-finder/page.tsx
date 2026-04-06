"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import { Compass, Loader2, TrendingUp, DollarSign, Users, Star } from "lucide-react";

type NicheResult = {
  niches: {
    name: string;
    score: number;
    demandLevel: "high" | "medium" | "low";
    competition: "high" | "medium" | "low";
    monetization: string;
    idealCustomer: string;
    entryStrategy: string;
    monthlyPotential: string;
  }[];
};

export default function NicheFinderPage() {
  const [interests, setInterests] = useState("");
  const [skills, setSkills] = useState("");
  const [budget, setBudget] = useState<"low" | "medium" | "high">("low");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<NicheResult | null>(null);

  async function find() {
    if (!interests.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Find 5 profitable niches for someone with these interests: "${interests}"${skills ? `, skills: "${skills}"` : ""}, budget level: ${budget}. Return JSON:
{"niches":[{"name":"niche name","score":85,"demandLevel":"high","competition":"medium","monetization":"how to make money (specific)","idealCustomer":"who to target (specific)","entryStrategy":"how to start (specific first step)","monthlyPotential":"realistic $X-$Y range"}]}
Score 0-100 for overall viability. Be realistic with income estimates. Sort by score descending. Each niche must be specific (not "fitness" — instead "postpartum fitness for working moms").`,
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

  const demandColors = { high: "text-emerald-400 bg-emerald-500/10", medium: "text-amber-400 bg-amber-500/10", low: "text-red-400 bg-red-500/10" };
  const compColors = { high: "text-red-400", medium: "text-amber-400", low: "text-emerald-400" };

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Compass className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Niche Finder</h1>
            <p className="text-xs text-white/35">AI finds profitable niches based on your interests and skills</p>
          </div>
        </div>

        {!result ? (
          <div className="space-y-4 max-w-md mx-auto">
            <input type="text" value={interests} onChange={(e) => setInterests(e.target.value)}
              placeholder="Your interests (e.g. cooking, tech, fitness, personal finance)"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition" />
            <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)}
              placeholder="Your skills (optional — e.g. writing, video, design, teaching)"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition" />
            <div>
              <p className="text-[10px] text-white/30 mb-1.5">Starting budget</p>
              <div className="flex gap-2">
                {(["low", "medium", "high"] as const).map((b) => (
                  <button key={b} onClick={() => setBudget(b)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition border ${budget === b ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" : "border-white/10 text-white/30"}`}>
                    {b === "low" ? "$0-$100" : b === "medium" ? "$100-$1k" : "$1k+"}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={find} disabled={generating || !interests.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-40">
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Finding niches...</> : <><Compass className="w-4 h-4" /> Find My Niche</>}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button onClick={() => setResult(null)} className="text-xs text-white/30 hover:text-white/60 transition">← Search again</button>
            {result.niches.map((n, i) => {
              const scoreColor = n.score >= 80 ? "text-emerald-400" : n.score >= 60 ? "text-cyan-400" : "text-amber-400";
              return (
                <div key={i} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 hover:border-cyan-400/20 transition">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-base font-black text-white">{n.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${demandColors[n.demandLevel]}`}>
                          {n.demandLevel} demand
                        </span>
                        <span className={`text-[9px] font-bold ${compColors[n.competition]}`}>
                          {n.competition} competition
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-2xl font-black ${scoreColor}`}>{n.score}</p>
                      <p className="text-[10px] text-white/20">/ 100</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <div className="flex items-center gap-1 mb-1">
                        <DollarSign className="w-3 h-3 text-emerald-400/50" />
                        <p className="text-[9px] text-white/25 uppercase">Monthly Potential</p>
                      </div>
                      <p className="text-xs text-emerald-400 font-bold">{n.monthlyPotential}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <div className="flex items-center gap-1 mb-1">
                        <Users className="w-3 h-3 text-cyan-400/50" />
                        <p className="text-[9px] text-white/25 uppercase">Ideal Customer</p>
                      </div>
                      <p className="text-xs text-white/50">{n.idealCustomer}</p>
                    </div>
                  </div>

                  <div className="mt-3 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-[9px] text-white/25 uppercase mb-1">How to monetize</p>
                    <p className="text-xs text-white/50">{n.monetization}</p>
                  </div>
                  <div className="mt-2 p-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                    <p className="text-[9px] text-cyan-400/50 uppercase mb-1">First step</p>
                    <p className="text-xs text-cyan-300/70">{n.entryStrategy}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
