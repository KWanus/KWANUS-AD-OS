"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import { Users, Loader2, Copy, Check, Download } from "lucide-react";

type Persona = {
  name: string;
  age: string;
  occupation: string;
  income: string;
  location: string;
  goals: string[];
  frustrations: string[];
  motivations: string[];
  objections: string[];
  whereToBuy: string[];
  mediaHabits: string[];
  buyingTrigger: string;
  quote: string;
};

export default function PersonaBuilderPage() {
  const [niche, setNiche] = useState("");
  const [product, setProduct] = useState("");
  const [generating, setGenerating] = useState(false);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!niche.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Create a detailed buyer persona for a ${niche} business${product ? ` selling "${product}"` : ""}. Return ONLY valid JSON:
{
  "name": "realistic first name + last initial",
  "age": "age range",
  "occupation": "job title",
  "income": "income range",
  "location": "city/region type",
  "goals": ["3-4 specific goals"],
  "frustrations": ["3-4 specific pain points"],
  "motivations": ["what drives their purchasing decisions"],
  "objections": ["top 3 reasons they'd hesitate to buy"],
  "whereToBuy": ["where they discover and buy products like this"],
  "mediaHabits": ["which platforms they use daily"],
  "buyingTrigger": "the specific moment they decide to buy",
  "quote": "a sentence this persona would actually say about their problem"
}
Be specific and realistic. No generic filler.`,
        }),
      });
      const data = await res.json() as { ok: boolean; content?: string };
      if (data.ok && data.content) {
        const match = data.content.match(/\{[\s\S]*\}/);
        if (match) setPersona(JSON.parse(match[0]));
      }
    } catch { /* silent */ }
    finally { setGenerating(false); }
  }

  function copyPersona() {
    if (!persona) return;
    const text = `BUYER PERSONA: ${persona.name}
Age: ${persona.age} | ${persona.occupation} | ${persona.income}
Location: ${persona.location}

"${persona.quote}"

GOALS: ${persona.goals.join("; ")}
FRUSTRATIONS: ${persona.frustrations.join("; ")}
MOTIVATIONS: ${persona.motivations.join("; ")}
OBJECTIONS: ${persona.objections.join("; ")}
WHERE TO REACH THEM: ${persona.whereToBuy.join("; ")}
MEDIA: ${persona.mediaHabits.join("; ")}
BUYING TRIGGER: ${persona.buyingTrigger}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <AppNav />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-[#e07850]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Buyer Persona Builder</h1>
            <p className="text-xs text-white/35">AI creates a detailed customer avatar for your niche</p>
          </div>
        </div>

        {!persona ? (
          <div className="space-y-4 max-w-md mx-auto">
            <input type="text" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Your niche (e.g. fitness coaching for women over 40)"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition" />
            <input type="text" value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Your product/service (optional)"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition" />
            <button onClick={generate} disabled={generating || !niche.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-violet-500 to-[#e07850] text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-40">
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Building persona...</> : <><Users className="w-4 h-4" /> Build Persona</>}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2 mb-2">
              <button onClick={copyPersona} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-500 text-white text-xs font-bold hover:bg-violet-400 transition">
                {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
              <button onClick={() => setPersona(null)} className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-bold text-white/40 hover:text-white/60 transition">
                New Persona
              </button>
            </div>

            {/* Header card */}
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center text-2xl font-black text-violet-300">
                  {persona.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">{persona.name}</h2>
                  <p className="text-sm text-white/50">{persona.age} · {persona.occupation}</p>
                  <p className="text-xs text-white/30">{persona.income} · {persona.location}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-violet-200/70 italic border-l-2 border-violet-400/30 pl-3">
                &ldquo;{persona.quote}&rdquo;
              </p>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DetailCard title="Goals" items={persona.goals} color="emerald" />
              <DetailCard title="Frustrations" items={persona.frustrations} color="red" />
              <DetailCard title="Motivations" items={persona.motivations} color="cyan" />
              <DetailCard title="Objections" items={persona.objections} color="amber" />
              <DetailCard title="Where to Reach Them" items={persona.whereToBuy} color="blue" />
              <DetailCard title="Media Habits" items={persona.mediaHabits} color="purple" />
            </div>

            {/* Buying trigger */}
            <div className="rounded-xl border border-[#f5a623]/15 bg-[#f5a623]/5 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#f5a623]/60 mb-1">Buying Trigger</p>
              <p className="text-sm text-white/70">{persona.buyingTrigger}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function DetailCard({ title, items, color }: { title: string; items: string[]; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: "border-emerald-500/15 bg-emerald-500/5 text-emerald-400/60",
    red: "border-red-500/15 bg-red-500/5 text-red-400/60",
    cyan: "border-[#f5a623]/15 bg-[#f5a623]/5 text-[#f5a623]/60",
    amber: "border-amber-500/15 bg-amber-500/5 text-amber-400/60",
    blue: "border-blue-500/15 bg-blue-500/5 text-blue-400/60",
    purple: "border-purple-500/15 bg-purple-500/5 text-[#e07850]/60",
  };
  const c = colorMap[color] ?? colorMap.cyan;
  return (
    <div className={`rounded-xl border p-4 ${c.split(" ").slice(0, 2).join(" ")}`}>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${c.split(" ")[2]}`}>{title}</p>
      <ul className="space-y-1">
        {items.map((item, i) => <li key={i} className="text-xs text-white/50">{item}</li>)}
      </ul>
    </div>
  );
}
