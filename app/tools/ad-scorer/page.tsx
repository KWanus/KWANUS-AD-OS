"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import { Target, Check, X } from "lucide-react";

type AdScore = {
  score: number;
  checks: { label: string; pass: boolean; detail: string }[];
  grade: "A" | "B" | "C" | "D" | "F";
};

function scoreAd(text: string, platform: string): AdScore {
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 5);
  const checks: { label: string; pass: boolean; detail: string }[] = [];

  // Hook in first line
  const firstLine = text.split("\n")[0] ?? "";
  const hasHook = firstLine.length >= 10 && (firstLine.endsWith("?") || firstLine.endsWith("...") || /\d/.test(firstLine) || firstLine.length <= 80);
  checks.push({ label: "Strong opening hook", pass: hasHook, detail: hasHook ? "First line grabs attention" : "First line should hook — try a question, number, or bold claim" });

  // CTA present
  const hasCta = /click|sign up|get|grab|start|join|try|buy|order|learn more|link|shop|book|schedule|claim|download/i.test(lower);
  checks.push({ label: "Clear CTA", pass: hasCta, detail: hasCta ? "Call-to-action found" : "Add a clear CTA (Get, Buy, Sign Up, Learn More)" });

  // Benefit-focused
  const hasBenefit = /you|your|results|transform|achieve|get|save|stop|never|without|finally|easily/i.test(lower);
  checks.push({ label: "Benefit-focused", pass: hasBenefit, detail: hasBenefit ? "Addresses reader benefits" : "Focus on what the reader GETS, not what you offer" });

  // Social proof
  const hasProof = /\d+[k+]?.*(?:customers?|clients?|people|users?|businesses|stars?|reviews?|rated|trusted)/i.test(lower) || /testimonial|case study|proven|results/i.test(lower);
  checks.push({ label: "Social proof", pass: hasProof, detail: hasProof ? "Includes credibility elements" : "Add numbers, reviews, or proof (e.g., '500+ customers')" });

  // Urgency/scarcity
  const hasUrgency = /limited|now|today|hurry|last|ends|expires|only \d|don't miss|before/i.test(lower);
  checks.push({ label: "Urgency element", pass: hasUrgency, detail: hasUrgency ? "Creates urgency" : "Add urgency (limited time, limited spots, etc.)" });

  // Emotional trigger
  const hasEmotion = /tired|frustrated|struggling|imagine|finally|dreaming|fear|love|hate|amazing|incredible|shocking|secret/i.test(lower);
  checks.push({ label: "Emotional trigger", pass: hasEmotion, detail: hasEmotion ? "Uses emotional language" : "Tap into emotions (pain, desire, frustration, aspiration)" });

  // Length check (platform-specific)
  const maxWords = platform === "tiktok" ? 30 : platform === "twitter" ? 50 : 125;
  const goodLength = words.length <= maxWords && words.length >= 10;
  checks.push({ label: `Optimal length (${platform})`, pass: goodLength, detail: goodLength ? `${words.length} words — good for ${platform}` : `${words.length} words — aim for ${maxWords > 50 ? "under 125" : `under ${maxWords}`} for ${platform}` });

  // Readability
  const shortSentences = sentences.filter((s) => s.split(/\s+/).length <= 15).length;
  const readable = sentences.length === 0 || (shortSentences / sentences.length) >= 0.7;
  checks.push({ label: "Easy to read", pass: readable, detail: readable ? "Short, punchy sentences" : "Break up long sentences — keep them under 15 words" });

  const passCount = checks.filter((c) => c.pass).length;
  const score = Math.round((passCount / checks.length) * 100);
  const grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";

  return { score, checks, grade };
}

export default function AdScorerPage() {
  const [adText, setAdText] = useState("");
  const [platform, setPlatform] = useState("facebook");
  const [result, setResult] = useState<AdScore | null>(null);

  function analyze() {
    if (!adText.trim()) return;
    setResult(scoreAd(adText.trim(), platform));
  }

  const gradeColors: Record<string, string> = { A: "text-emerald-400", B: "text-[#f5a623]", C: "text-amber-400", D: "text-orange-400", F: "text-red-400" };

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#f5a623]/10 border border-[#f5a623]/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-[#f5a623]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Ad Copy Scorer</h1>
            <p className="text-xs text-white/35">Score your ad copy for conversion potential</p>
          </div>
        </div>

        {/* Platform */}
        <div className="flex gap-2 mb-4">
          {["facebook", "instagram", "tiktok", "google", "twitter"].map((p) => (
            <button
              key={p}
              onClick={() => { setPlatform(p); setResult(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                platform === p ? "border-[#f5a623]/40 bg-[#f5a623]/10 text-[#f5a623]" : "border-white/10 bg-white/[0.03] text-white/30"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Input */}
        <textarea
          value={adText}
          onChange={(e) => { setAdText(e.target.value); setResult(null); }}
          placeholder="Paste your ad copy here..."
          rows={6}
          className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 transition resize-none mb-4"
        />

        <button
          onClick={analyze}
          disabled={!adText.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#f5a623] text-[#0a0f1e] text-sm font-bold hover:bg-[#e07850] transition disabled:opacity-40 mb-6"
        >
          Score My Ad
        </button>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 flex items-center justify-center gap-6">
              <div className="text-center">
                <p className={`text-5xl font-black ${gradeColors[result.grade]}`}>{result.grade}</p>
                <p className="text-[10px] text-white/25 mt-1">Grade</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-white">{result.score}</p>
                <p className="text-[10px] text-white/25 mt-1">Score / 100</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-2">
              {result.checks.map((check, i) => (
                <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl border ${
                  check.pass ? "border-emerald-500/15 bg-emerald-500/5" : "border-red-500/15 bg-red-500/5"
                }`}>
                  {check.pass ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <X className="w-4 h-4 text-red-400 shrink-0" />}
                  <div>
                    <p className="text-xs font-bold text-white/70">{check.label}</p>
                    <p className="text-[10px] text-white/35 mt-0.5">{check.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
