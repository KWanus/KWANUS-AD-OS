"use client";

import { useState } from "react";
import SimplifiedNav from "@/components/SimplifiedNav";
import { User, Loader2, Copy, Check, RefreshCw } from "lucide-react";

const PLATFORMS = ["Instagram", "TikTok", "Twitter/X", "LinkedIn", "YouTube", "Facebook", "Personal Website"];
const TONES = ["Professional", "Casual", "Witty", "Authoritative", "Friendly", "Bold"];

export default function BioGeneratorPage() {
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [tone, setTone] = useState("Professional");
  const [generating, setGenerating] = useState(false);
  const [bios, setBios] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function generate() {
    if (!niche.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Write 5 bio variations for ${platform}.
${name ? `Name: ${name}` : ""}
Niche: ${niche}
Tone: ${tone}

Platform rules:
- Instagram: max 150 chars. Use line breaks. One emoji max.
- TikTok: max 80 chars. Punchy. Personality-forward.
- Twitter/X: max 160 chars. Sharp, memorable.
- LinkedIn: 2-3 sentences. Professional + personal.
- YouTube: 1-2 sentences. What your channel is about.
- Facebook: Short paragraph. Community-focused.
- Personal Website: 2-3 sentences. Story-driven.

Write 5 different bios for ${platform}, each with a different angle:
1. Results-focused (what you deliver)
2. Story-focused (your journey)
3. Authority-focused (credentials + expertise)
4. Personality-focused (who you are as a person)
5. Action-focused (what to do next)

Return each bio on its own line, numbered 1-5. No quotes. No explanations. Just the bios.`,
        }),
      });
      const data = await res.json() as { ok: boolean; content?: string };
      if (data.ok && data.content) {
        const lines = data.content.split("\n")
          .map((l) => l.replace(/^\d+[\.\)]\s*/, "").trim())
          .filter((l) => l.length > 10);
        setBios(lines.slice(0, 5));
      }
    } catch { /* silent */ }
    finally { setGenerating(false); }
  }

  function copyBio(idx: number) {
    navigator.clipboard.writeText(bios[idx]);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <SimplifiedNav />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <User className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Bio Generator</h1>
            <p className="text-xs text-white/35">5 platform-optimized bio variations in seconds</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)"
            className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition" />
          <input type="text" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="What you do (e.g. fitness coach, SaaS founder, real estate agent)"
            className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition" />

          <div>
            <p className="text-[10px] text-white/30 mb-1.5">Platform</p>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS.map((p) => (
                <button key={p} onClick={() => setPlatform(p)} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition border ${platform === p ? "border-blue-500/40 bg-blue-500/10 text-blue-300" : "border-white/10 bg-white/[0.03] text-white/25"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] text-white/30 mb-1.5">Tone</p>
            <div className="flex flex-wrap gap-1.5">
              {TONES.map((t) => (
                <button key={t} onClick={() => setTone(t)} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition border ${tone === t ? "border-blue-500/40 bg-blue-500/10 text-blue-300" : "border-white/10 bg-white/[0.03] text-white/25"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button onClick={generate} disabled={generating || !niche.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-[#e07850] text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-40">
            {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Writing bios...</> : "Generate 5 Bios"}
          </button>
        </div>

        {bios.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/30">{platform} bios · {tone} tone</span>
              <button onClick={generate} disabled={generating} className="text-[10px] text-blue-400/60 hover:text-blue-400 transition flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Regenerate
              </button>
            </div>
            {bios.map((bio, i) => (
              <div key={i} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 flex items-start gap-3 group hover:border-blue-400/20 transition">
                <span className="text-[10px] text-white/15 font-mono shrink-0 mt-1">{i + 1}</span>
                <p className="text-sm text-white/70 flex-1 leading-relaxed">{bio}</p>
                <button onClick={() => copyBio(i)} className="shrink-0 opacity-0 group-hover:opacity-100 transition text-white/20 hover:text-white/50">
                  {copiedIdx === i ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
