"use client";

import { useState, use } from "react";
import { Star, Check, Loader2 } from "lucide-react";

export default function ReviewPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [quote, setQuote] = useState("");
  const [result, setResult] = useState("");
  const [stars, setStars] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit() {
    if (!name.trim() || !quote.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/testimonials/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name, role, company, quote, stars, result }),
      });
      const data = await res.json() as { ok: boolean };
      if (data.ok) setSubmitted(true);
    } catch {
      // Silent
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#050a14] text-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-xl font-black text-white mb-2">Thank you!</h1>
          <p className="text-sm text-white/40">Your testimonial has been submitted and will be reviewed shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050a14] text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-white mb-2">Share Your Experience</h1>
          <p className="text-sm text-white/40">Your feedback helps others make the right decision.</p>
        </div>

        <div className="space-y-4">
          {/* Stars */}
          <div className="flex justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setStars(s)}
                className="p-1 transition"
              >
                <Star
                  className={`w-8 h-8 ${s <= stars ? "text-amber-400 fill-amber-400" : "text-white/15"}`}
                />
              </button>
            ))}
          </div>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name *"
            className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Your role (optional)"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
            />
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company (optional)"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
            />
          </div>

          <textarea
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="What was your experience? What results did you see? *"
            rows={4}
            className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition resize-none"
          />

          <input
            type="text"
            value={result}
            onChange={(e) => setResult(e.target.value)}
            placeholder="Key result (e.g. '3x more leads', '+$5k revenue')"
            className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
          />

          <button
            onClick={submit}
            disabled={submitting || !name.trim() || !quote.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-40"
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : "Submit Testimonial"}
          </button>

          <p className="text-[10px] text-white/15 text-center">
            By submitting, you agree that your testimonial may be used publicly.
          </p>
        </div>
      </div>
    </div>
  );
}
