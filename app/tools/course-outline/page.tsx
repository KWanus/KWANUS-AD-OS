"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import { BookOpen, Loader2, Copy, Check, Download } from "lucide-react";

type Module = { title: string; lessons: string[]; outcome: string };
type CourseOutline = { title: string; subtitle: string; modules: Module[]; bonuses: string[]; pricing: string };

export default function CourseOutlinePage() {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [generating, setGenerating] = useState(false);
  const [course, setCourse] = useState<CourseOutline | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!topic.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Create a complete online course outline about "${topic}"${audience ? ` for ${audience}` : ""}. Return JSON:
{"title":"course name","subtitle":"one-line value prop","modules":[{"title":"module name","lessons":["lesson 1","lesson 2","lesson 3"],"outcome":"what student achieves after this module"}],"bonuses":["bonus 1","bonus 2","bonus 3"],"pricing":"suggested price with reasoning"}
Create 6 modules with 3-5 lessons each. Make it transformation-focused (before → after). Include practical bonuses. Suggest realistic pricing.`,
        }),
      });
      const data = await res.json() as { ok: boolean; content?: string };
      if (data.ok && data.content) {
        const match = data.content.match(/\{[\s\S]*\}/);
        if (match) setCourse(JSON.parse(match[0]));
      }
    } catch { /* silent */ }
    finally { setGenerating(false); }
  }

  function copyAll() {
    if (!course) return;
    const text = [`# ${course.title}`, course.subtitle, "", ...course.modules.map((m, i) =>
      `## Module ${i + 1}: ${m.title}\nOutcome: ${m.outcome}\n${m.lessons.map((l) => `- ${l}`).join("\n")}`
    ), "", "## Bonuses", ...course.bonuses.map((b) => `- ${b}`), "", `Pricing: ${course.pricing}`].join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <AppNav />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#e07850]/10 border border-[#e07850]/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[#e07850]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Course Outline Builder</h1>
            <p className="text-xs text-white/35">AI creates a complete course curriculum with modules and pricing</p>
          </div>
        </div>

        {!course ? (
          <div className="space-y-4 max-w-md mx-auto">
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
              placeholder="Course topic (e.g. Facebook Ads for local businesses)"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#e07850]/50 transition" />
            <input type="text" value={audience} onChange={(e) => setAudience(e.target.value)}
              placeholder="Target student (optional — e.g. beginners, agency owners)"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition" />
            <button onClick={generate} disabled={generating || !topic.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-[#e07850] to-pink-500 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-40">
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Building curriculum...</> : <><BookOpen className="w-4 h-4" /> Generate Course Outline</>}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button onClick={copyAll} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#e07850] text-white text-xs font-bold hover:bg-[#e07850] transition">
                {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Outline</>}
              </button>
              <button onClick={() => setCourse(null)} className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-bold text-white/40 transition">New Course</button>
            </div>

            {/* Header */}
            <div className="rounded-2xl border border-[#e07850]/20 bg-[#e07850]/5 p-6 text-center">
              <h2 className="text-xl font-black text-white">{course.title}</h2>
              <p className="text-sm text-white/50 mt-1">{course.subtitle}</p>
              <p className="text-xs text-[#f5a623] mt-3 font-bold">{course.pricing}</p>
            </div>

            {/* Modules */}
            {course.modules.map((mod, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#e07850]/20 flex items-center justify-center text-xs font-black text-[#f5a623]">{i + 1}</div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{mod.title}</h3>
                    <p className="text-[10px] text-emerald-400/60">{mod.outcome}</p>
                  </div>
                </div>
                <div className="space-y-1.5 pl-11">
                  {mod.lessons.map((l, j) => (
                    <p key={j} className="text-xs text-white/50 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/15 shrink-0" /> {l}
                    </p>
                  ))}
                </div>
              </div>
            ))}

            {/* Bonuses */}
            {course.bonuses.length > 0 && (
              <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/60 mb-2">Bonuses</p>
                {course.bonuses.map((b, i) => (
                  <p key={i} className="text-xs text-amber-300/70 mb-1.5">🎁 {b}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
