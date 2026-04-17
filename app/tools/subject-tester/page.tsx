"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import { Mail, Sparkles, Loader2, Trophy, Plus, X } from "lucide-react";

type SubjectScore = {
  text: string;
  score: number;
  charCount: number;
  wordCount: number;
  hasEmoji: boolean;
  hasNumber: boolean;
  hasPersonalization: boolean;
  hasCuriosityGap: boolean;
  hasUrgency: boolean;
  mobilePreview: string;
};

function scoreSubject(text: string): SubjectScore {
  const charCount = text.length;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const lower = text.toLowerCase();
  const hasEmoji = /[\p{Emoji}]/u.test(text);
  const hasNumber = /\d/.test(text);
  const hasPersonalization = /\{|first.?name|\[name\]/i.test(text);
  const hasCuriosityGap = text.endsWith("...") || text.endsWith("?") || /secret|truth|mistake|nobody|surprising|actually|really/i.test(lower);
  const hasUrgency = /now|today|last|final|expires|hours|minutes|deadline|ending|quick/i.test(lower);

  let score = 40;
  if (charCount >= 20 && charCount <= 41) score += 20; // Mobile optimal
  else if (charCount <= 50) score += 10;
  else score -= 5;

  if (hasNumber) score += 10;
  if (hasCuriosityGap) score += 10;
  if (hasUrgency) score += 5;
  if (hasPersonalization) score += 5;
  if (hasEmoji) score += 3;
  if (wordCount <= 7) score += 5;
  if (text.charAt(0) === text.charAt(0).toLowerCase() && /[a-z]/.test(text.charAt(0))) score += 3; // Lowercase start = casual
  if (/^re:|^fwd:/i.test(text)) score += 5; // Reply trick

  const mobilePreview = charCount > 41 ? text.slice(0, 38) + "..." : text;

  return {
    text,
    score: Math.max(0, Math.min(100, score)),
    charCount,
    wordCount,
    hasEmoji,
    hasNumber,
    hasPersonalization,
    hasCuriosityGap,
    hasUrgency,
    mobilePreview,
  };
}

export default function SubjectTesterPage() {
  const [subjects, setSubjects] = useState<string[]>(["", "", ""]);
  const [results, setResults] = useState<SubjectScore[] | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);

  function addSubject() {
    if (subjects.length < 6) setSubjects([...subjects, ""]);
  }

  function removeSubject(idx: number) {
    if (subjects.length > 2) setSubjects(subjects.filter((_, i) => i !== idx));
  }

  function updateSubject(idx: number, val: string) {
    setSubjects(subjects.map((s, i) => (i === idx ? val : s)));
    setResults(null);
  }

  function testAll() {
    const valid = subjects.filter((s) => s.trim());
    if (valid.length < 2) return;
    const scored = valid.map(scoreSubject).sort((a, b) => b.score - a.score);
    setResults(scored);
  }

  async function aiGenerate() {
    setAiGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate 3 email subject line variations for A/B testing. The subject lines should be:
1. A curiosity-driven angle (make them want to open)
2. A direct/benefit angle (tell them what they get)
3. A personal/conversational angle (feels like a friend wrote it)

Each under 45 characters. No emojis. No quotes. Just the text, one per line.`,
        }),
      });
      const data = await res.json() as { ok: boolean; content?: string };
      if (data.ok && data.content) {
        const lines = data.content.split("\n").map((l) => l.replace(/^\d+[\.\)]\s*/, "").replace(/^["']|["']$/g, "").trim()).filter((l) => l.length > 5 && l.length < 80);
        if (lines.length >= 2) {
          setSubjects(lines.slice(0, 3).concat(subjects.filter((s) => s.trim())).slice(0, 6));
        }
      }
    } catch { /* silent */ }
    finally { setAiGenerating(false); }
  }

  const winner = results?.[0];

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Mail className="w-5 h-5 text-[#e07850]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Subject Line Tester</h1>
            <p className="text-xs text-white/35">Compare subject lines side-by-side and find the winner</p>
          </div>
        </div>

        {/* Subject inputs */}
        <div className="space-y-3 mb-4">
          {subjects.map((subj, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-white/20 font-mono w-5 shrink-0">{String.fromCharCode(65 + i)}</span>
              <input
                type="text"
                value={subj}
                onChange={(e) => updateSubject(i, e.target.value)}
                placeholder={`Subject line ${String.fromCharCode(65 + i)}...`}
                className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-500/50 transition"
              />
              <span className="text-[10px] text-white/15 w-8 text-right shrink-0">{subj.length}</span>
              {subjects.length > 2 && (
                <button onClick={() => removeSubject(i)} className="text-white/15 hover:text-red-400 transition">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={testAll}
            disabled={subjects.filter((s) => s.trim()).length < 2}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-40"
          >
            <Trophy className="w-4 h-4" /> Test & Rank
          </button>
          {subjects.length < 6 && (
            <button onClick={addSubject} className="p-3 rounded-xl border border-white/10 bg-white/[0.03] text-white/30 hover:text-white/60 transition">
              <Plus className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={aiGenerate}
            disabled={aiGenerating}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-purple-500/30 bg-purple-500/5 text-purple-300 text-xs font-bold hover:bg-purple-500/10 transition disabled:opacity-40"
          >
            {aiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            AI Generate
          </button>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-3">
            {results.map((r, i) => {
              const isWinner = i === 0;
              const scoreColor = r.score >= 80 ? "text-emerald-400" : r.score >= 60 ? "text-[#f5a623]" : r.score >= 40 ? "text-amber-400" : "text-red-400";

              return (
                <div
                  key={i}
                  className={`rounded-2xl border p-5 transition ${
                    isWinner ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/[0.07] bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {isWinner && <Trophy className="w-4 h-4 text-emerald-400" />}
                      <span className={`text-sm font-bold ${isWinner ? "text-emerald-300" : "text-white/60"}`}>
                        {isWinner ? "Winner" : `#${i + 1}`}
                      </span>
                      <span className={`text-xl font-black ${scoreColor}`}>{r.score}</span>
                    </div>
                    <span className="text-[10px] text-white/20">{r.charCount} chars · {r.wordCount} words</span>
                  </div>

                  <p className="text-sm text-white/80 font-medium mb-3">{r.text}</p>

                  {/* Mobile preview */}
                  <div className="rounded-lg bg-white p-3 mb-3">
                    <p className="text-[11px] text-gray-400">From: Your Business</p>
                    <p className="text-[13px] text-black font-semibold truncate">{r.mobilePreview}</p>
                    <p className="text-[11px] text-gray-400 truncate">Preview text would go here...</p>
                  </div>

                  {/* Checks */}
                  <div className="flex flex-wrap gap-1.5">
                    <MicroBadge label="Number" active={r.hasNumber} />
                    <MicroBadge label="Curiosity" active={r.hasCuriosityGap} />
                    <MicroBadge label="Urgency" active={r.hasUrgency} />
                    <MicroBadge label="Personalized" active={r.hasPersonalization} />
                    <MicroBadge label="Mobile-safe" active={r.charCount <= 41} />
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

function MicroBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
      active ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-white/5 text-white/15 border border-white/[0.06]"
    }`}>
      {active ? "✓" : "✗"} {label}
    </span>
  );
}
