"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import { Sparkles, Copy, Check, RefreshCw } from "lucide-react";

type HeadlineScore = {
  score: number;
  wordCount: number;
  charCount: number;
  hasNumber: boolean;
  hasPowerWord: boolean;
  hasEmotionalWord: boolean;
  isQuestion: boolean;
  hasUrgency: boolean;
  readingLevel: string;
  improvements: string[];
};

const POWER_WORDS = ["free", "proven", "guaranteed", "instant", "exclusive", "secret", "limited", "discover", "ultimate", "breakthrough", "revolutionary", "transform", "unlock", "master", "eliminate", "maximize", "effortless", "powerful"];
const EMOTIONAL_WORDS = ["amazing", "shocking", "terrifying", "beautiful", "heartbreaking", "incredible", "unbelievable", "brilliant", "devastating", "inspiring", "jaw-dropping", "life-changing", "mind-blowing", "stunning"];
const URGENCY_WORDS = ["now", "today", "hurry", "limited", "last chance", "expires", "deadline", "immediately", "urgent", "don't miss", "before", "ending"];

function analyzeHeadline(text: string): HeadlineScore {
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = text.length;

  const hasNumber = /\d/.test(text);
  const hasPowerWord = POWER_WORDS.some((w) => lower.includes(w));
  const hasEmotionalWord = EMOTIONAL_WORDS.some((w) => lower.includes(w));
  const isQuestion = text.trim().endsWith("?");
  const hasUrgency = URGENCY_WORDS.some((w) => lower.includes(w));

  let score = 50; // Start at average
  const improvements: string[] = [];

  // Word count scoring
  if (wordCount >= 6 && wordCount <= 12) { score += 15; }
  else if (wordCount < 6) { score -= 5; improvements.push("Add more words (6-12 is ideal for headlines)"); }
  else if (wordCount > 15) { score -= 10; improvements.push("Too long — cut to 12 words max"); }

  // Character count
  if (charCount >= 40 && charCount <= 65) { score += 5; }
  else if (charCount > 80) { improvements.push("Over 80 characters — may get truncated"); }

  // Number
  if (hasNumber) { score += 10; }
  else { improvements.push("Add a specific number (e.g., '3 Ways', '7 Days', '47% More')"); }

  // Power word
  if (hasPowerWord) { score += 10; }
  else { improvements.push("Add a power word (proven, guaranteed, instant, exclusive)"); }

  // Emotional word
  if (hasEmotionalWord) { score += 5; }

  // Question
  if (isQuestion) { score += 5; }

  // Urgency
  if (hasUrgency) { score += 5; }

  // First-person
  if (lower.includes("you") || lower.includes("your")) { score += 5; }
  else { improvements.push("Address the reader directly ('you' or 'your')"); }

  // Starts with a number
  if (/^\d/.test(text)) { score += 5; }

  // Reading level (simplified)
  const avgWordLength = words.reduce((s, w) => s + w.length, 0) / Math.max(words.length, 1);
  const readingLevel = avgWordLength <= 4.5 ? "Easy" : avgWordLength <= 6 ? "Medium" : "Complex";
  if (readingLevel === "Complex") { improvements.push("Use simpler words — complex language reduces engagement"); }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    wordCount,
    charCount,
    hasNumber,
    hasPowerWord,
    hasEmotionalWord,
    isQuestion,
    hasUrgency,
    readingLevel,
    improvements,
  };
}

export default function HeadlineAnalyzerPage() {
  const [headline, setHeadline] = useState("");
  const [result, setResult] = useState<HeadlineScore | null>(null);
  const [copied, setCopied] = useState(false);

  function analyze() {
    if (!headline.trim()) return;
    setResult(analyzeHeadline(headline.trim()));
  }

  const scoreColor = (result?.score ?? 0) >= 80 ? "text-emerald-400" : (result?.score ?? 0) >= 50 ? "text-amber-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Headline Analyzer</h1>
            <p className="text-xs text-white/35">Score your headlines for ad and landing page effectiveness</p>
          </div>
        </div>

        {/* Input */}
        <div className="mb-6">
          <textarea
            value={headline}
            onChange={(e) => { setHeadline(e.target.value); setResult(null); }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); analyze(); } }}
            placeholder="Type your headline here..."
            rows={2}
            className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-4 text-lg text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 transition resize-none font-bold"
          />
          <button
            onClick={analyze}
            disabled={!headline.trim()}
            className="w-full mt-3 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-40"
          >
            Analyze Headline
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Score */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 text-center">
              <p className={`text-5xl font-black ${scoreColor}`}>{result.score}</p>
              <p className="text-xs text-white/30 mt-1">Headline Score / 100</p>
            </div>

            {/* Checks */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <CheckBadge label="Number" active={result.hasNumber} />
              <CheckBadge label="Power Word" active={result.hasPowerWord} />
              <CheckBadge label="Emotional" active={result.hasEmotionalWord} />
              <CheckBadge label="Urgency" active={result.hasUrgency} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-center">
                <p className="text-sm font-bold text-white">{result.wordCount}</p>
                <p className="text-[10px] text-white/25">Words</p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-center">
                <p className="text-sm font-bold text-white">{result.charCount}</p>
                <p className="text-[10px] text-white/25">Characters</p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-center">
                <p className="text-sm font-bold text-white">{result.readingLevel}</p>
                <p className="text-[10px] text-white/25">Reading Level</p>
              </div>
            </div>

            {/* Improvements */}
            {result.improvements.length > 0 && (
              <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/60 mb-2">How to improve</p>
                <ul className="space-y-1.5">
                  {result.improvements.map((imp, i) => (
                    <li key={i} className="text-xs text-white/50 flex items-start gap-2">
                      <span className="text-amber-400 shrink-0">+</span> {imp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.score >= 80 && (
              <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4 text-center">
                <p className="text-xs text-emerald-300 font-bold">Strong headline. Ready to test.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function CheckBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <div className={`rounded-lg border p-2 text-center text-[10px] font-bold ${
      active ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-white/10 bg-white/5 text-white/20"
    }`}>
      {active ? "✓" : "✗"} {label}
    </div>
  );
}
