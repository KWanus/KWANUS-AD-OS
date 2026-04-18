"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import { Mountain, Loader2, Copy, Check, HelpCircle, ArrowRight, Users } from "lucide-react";

type QuizResult = {
  title: string;
  questions: { question: string; options: { label: string; value: string; leadsTo: string }[] }[];
  results: { id: string; headline: string; body: string; cta: string; ctaUrl: string }[];
};

export default function QuizFunnelPage() {
  const [niche, setNiche] = useState("");
  const [offer, setOffer] = useState("");
  const [outcomes, setOutcomes] = useState("");
  const [quiz, setQuiz] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewStep, setPreviewStep] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);

  async function generate() {
    if (!niche) return;
    setLoading(true);
    try {
      const res = await fetch("/api/himalaya/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "quiz_funnel",
          params: {
            niche, offer: offer || niche,
            outcomes: outcomes ? outcomes.split(",").map(o => o.trim()) : ["beginner", "intermediate", "advanced"],
          },
        }),
      });
      const data = await res.json();
      if (data.ok) setQuiz(data.result);
    } catch { /* ignore */ }
    setLoading(false);
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text); setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <main className="min-h-screen bg-t-bg text-t-text">
      <AppNav />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-20">
        <div className="pt-8 pb-4">
          <h1 className="text-2xl font-black">Quiz Funnel Generator</h1>
          <p className="text-sm text-t-text-muted">Create an interactive quiz that segments visitors into buyer types and recommends the right offer.</p>
        </div>

        <div className="space-y-3 mb-6">
          <input type="text" value={niche} onChange={e => setNiche(e.target.value)} placeholder="Your niche"
            className="w-full rounded-xl border border-t-border bg-t-bg-raised px-4 py-3 text-sm placeholder-t-text-faint outline-none focus:border-[#f5a623]/30 transition" />
          <input type="text" value={offer} onChange={e => setOffer(e.target.value)} placeholder="Your offer/product"
            className="w-full rounded-xl border border-t-border bg-t-bg-raised px-4 py-3 text-sm placeholder-t-text-faint outline-none" />
          <input type="text" value={outcomes} onChange={e => setOutcomes(e.target.value)} placeholder="Result types (e.g., beginner, intermediate, advanced)"
            className="w-full rounded-xl border border-t-border bg-t-bg-raised px-4 py-3 text-sm placeholder-t-text-faint outline-none" />
          <button onClick={() => void generate()} disabled={!niche || loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] py-3 text-sm font-bold text-[#0c0a08] disabled:opacity-30 hover:opacity-90 transition">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <HelpCircle className="w-4 h-4" />}
            {loading ? "Generating..." : "Generate Quiz Funnel"}
          </button>
        </div>

        {quiz && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/[0.03] p-4 text-center">
              <h2 className="text-lg font-black">{quiz.title}</h2>
              <p className="text-xs text-t-text-faint mt-1">{quiz.questions.length} questions → {quiz.results.length} result types</p>
              <button onClick={() => { setPreviewMode(!previewMode); setPreviewStep(0); }}
                className="mt-3 text-xs font-bold text-[#f5a623] hover:text-[#e07850] transition">
                {previewMode ? "Hide Preview" : "Preview Quiz →"}
              </button>
            </div>

            {/* Live Preview */}
            {previewMode && (
              <div className="rounded-xl border border-t-border bg-t-bg-raised p-5">
                {previewStep < quiz.questions.length ? (
                  <div>
                    <div className="h-1 rounded bg-t-bg-card mb-4">
                      <div className="h-full rounded bg-[#f5a623] transition-all" style={{ width: `${((previewStep + 1) / quiz.questions.length) * 100}%` }} />
                    </div>
                    <p className="text-[10px] text-t-text-faint mb-2">Question {previewStep + 1} of {quiz.questions.length}</p>
                    <h3 className="text-base font-black mb-4">{quiz.questions[previewStep].question}</h3>
                    <div className="space-y-2">
                      {quiz.questions[previewStep].options.map((opt, i) => (
                        <button key={i} onClick={() => setPreviewStep(previewStep + 1)}
                          className="w-full text-left px-4 py-3 rounded-lg border border-t-border bg-t-bg-card text-sm hover:border-[#f5a623]/20 hover:bg-[#f5a623]/[0.03] transition">
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Users className="w-8 h-8 text-[#f5a623] mx-auto mb-3" />
                    <h3 className="text-lg font-black mb-1">{quiz.results[0]?.headline ?? "Your Result"}</h3>
                    <p className="text-sm text-t-text-muted mb-4">{quiz.results[0]?.body ?? ""}</p>
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-sm font-bold text-[#0c0a08]">
                      {quiz.results[0]?.cta ?? "Get Started"} <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                    <button onClick={() => setPreviewStep(0)} className="block mx-auto mt-3 text-xs text-t-text-faint hover:text-t-text-muted transition">
                      Retake quiz
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Questions */}
            <div className="rounded-xl border border-t-border bg-t-bg-raised p-5">
              <p className="text-[10px] font-black text-t-text-faint tracking-wider mb-3">QUESTIONS ({quiz.questions.length})</p>
              <div className="space-y-3">
                {quiz.questions.map((q, i) => (
                  <div key={i} className="rounded-lg border border-t-border bg-t-bg-card p-3">
                    <p className="text-sm font-bold mb-2">Q{i + 1}: {q.question}</p>
                    <div className="space-y-1">
                      {q.options.map((opt, j) => (
                        <p key={j} className="text-xs text-t-text-muted pl-3">• {opt.label} → {opt.leadsTo}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Results */}
            <div className="rounded-xl border border-t-border bg-t-bg-raised p-5">
              <p className="text-[10px] font-black text-t-text-faint tracking-wider mb-3">RESULT PAGES ({quiz.results.length})</p>
              <div className="space-y-3">
                {quiz.results.map((r, i) => (
                  <div key={i} className="rounded-lg border border-emerald-500/15 bg-emerald-500/[0.03] p-3">
                    <p className="text-sm font-bold text-emerald-400">{r.headline}</p>
                    <p className="text-xs text-t-text-muted mt-1">{r.body}</p>
                    <p className="text-xs text-emerald-400/60 mt-1">CTA: {r.cta}</p>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => copy(JSON.stringify(quiz, null, 2), "quiz")}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-t-border py-2.5 text-xs font-bold text-t-text-muted hover:text-t-text transition">
              {copiedId === "quiz" ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy Full Quiz</>}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
