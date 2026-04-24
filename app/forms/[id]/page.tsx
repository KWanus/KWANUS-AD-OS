"use client";

import { useState, useEffect, use } from "react";
import { Loader2, CheckCircle, AlertTriangle, Zap } from "lucide-react";

interface FormData {
  id: string;
  headline?: string;
  subheadline?: string;
  buttonText: string;
  redirectUrl?: string;
  executionTier?: "core" | "elite";
}

export default function PublicFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/opt-in-forms/${id}`)
      .then((r) => r.json() as Promise<{ ok: boolean; form?: FormData }>)
      .then((data) => {
        if (data.ok && data.form) setForm(data.form);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) { setError("Enter a valid email"); return; }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/opt-in-forms/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName }),
      });
      const data = await res.json() as { ok: boolean; redirectUrl?: string; error?: string };
      if (!data.ok) throw new Error(data.error ?? "Failed");

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setDone(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020509] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-[#020509] flex flex-col items-center justify-center gap-3">
        <AlertTriangle className="w-8 h-8 text-red-400/50" />
        <p className="text-white/30 text-sm">This form is no longer available.</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#020509] flex flex-col items-center justify-center gap-5 px-4">
        <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black text-white mb-2">You&apos;re in!</h2>
          <p className="text-sm text-white/40">Thanks for subscribing. Check your inbox.</p>
        </div>
      </div>
    );
  }

  const executionTier = form.executionTier === "core" ? "core" : "elite";

  return (
    <div className="min-h-screen bg-[#020509] flex flex-col items-center justify-center px-4">
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 shadow-2xl">
          <div className="mb-4 flex justify-center">
            <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] ${
              executionTier === "elite"
                ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                : "border-white/10 bg-white/5 text-white/45"
            }`}>
              {executionTier} opt-in
            </span>
          </div>
          {form.headline && (
            <h1 className="text-2xl font-black text-white text-center mb-2 leading-tight">
              {form.headline}
            </h1>
          )}
          {form.subheadline && (
            <p className="text-sm text-white/45 text-center mb-7 leading-relaxed">
              {form.subheadline}
            </p>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name (optional)"
              className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-cyan-500/50 transition"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-cyan-500/50 transition"
            />

            {error && (
              <p className="text-xs text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !email}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition ${
                executionTier === "elite"
                  ? "bg-gradient-to-r from-cyan-500 to-purple-600 shadow-[0_0_30px_rgba(6,182,212,0.18)]"
                  : "bg-gradient-to-r from-cyan-500 to-blue-500"
              }`}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Subscribing...</>
              ) : (
                form.buttonText || "Subscribe"
              )}
            </button>
          </form>

          <p className="text-[10px] text-white/20 text-center mt-5">
            No spam. Unsubscribe anytime.
          </p>
        </div>

        {/* Powered by */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          <Zap className="w-2.5 h-2.5 text-white/15" />
          <span className="text-[10px] text-white/15">Powered by KWANUS</span>
        </div>
      </div>
    </div>
  );
}
