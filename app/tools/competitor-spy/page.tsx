"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import { Search, Loader2, Globe, Eye, Shield, TrendingUp, AlertTriangle, Zap } from "lucide-react";

type SpyResult = {
  url: string;
  title: string;
  headline: string;
  ctas: string[];
  trustSignals: string[];
  benefits: string[];
  pricing: string | null;
  weaknesses: string[];
  techStack: string[];
  socialLinks: string[];
};

export default function CompetitorSpyPage() {
  const [url, setUrl] = useState("");
  const [spying, setSpying] = useState(false);
  const [result, setResult] = useState<SpyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function spy() {
    if (!url.trim()) return;
    setSpying(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/tools/competitor-spy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json() as { ok: boolean; result?: SpyResult; error?: string };
      if (data.ok && data.result) setResult(data.result);
      else setError(data.error ?? "Analysis failed");
    } catch {
      setError("Connection failed");
    } finally {
      setSpying(false);
    }
  }

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <AppNav />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Eye className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Competitor Spy</h1>
            <p className="text-xs text-white/35">Analyze any competitor URL — see their strategy, weaknesses, and tech</p>
          </div>
        </div>

        {/* Input */}
        <div className="flex gap-3 mb-6">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && spy()}
            placeholder="https://competitor.com"
            className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-500/50 transition"
          />
          <button
            onClick={spy}
            disabled={spying || !url.trim()}
            className="px-6 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-400 transition disabled:opacity-40"
          >
            {spying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analyze"}
          </button>
        </div>

        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Header */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-[#f5a623]/60" />
                <p className="text-xs font-mono text-white/30 truncate">{result.url}</p>
              </div>
              <h2 className="text-lg font-bold text-white mb-1">{result.title}</h2>
              {result.headline && <p className="text-sm text-[#f5a623]/70 italic">&ldquo;{result.headline}&rdquo;</p>}
              {result.pricing && (
                <p className="text-sm text-emerald-400 font-bold mt-2">Pricing: {result.pricing}</p>
              )}
            </div>

            {/* CTAs */}
            {result.ctas.length > 0 && (
              <Section icon={Zap} title="Their CTAs" color="text-[#f5a623]/60">
                <div className="flex flex-wrap gap-2">
                  {result.ctas.map((cta, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-[#f5a623]/10 border border-[#f5a623]/20 text-xs text-[#f5a623] font-semibold">
                      {cta}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Trust signals */}
            {result.trustSignals.length > 0 && (
              <Section icon={Shield} title="Trust Signals" color="text-emerald-400/60">
                <ul className="space-y-1">
                  {result.trustSignals.map((s, i) => (
                    <li key={i} className="text-xs text-white/50 flex items-center gap-2">
                      <span className="text-emerald-400">+</span> {s}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Benefits */}
            {result.benefits.length > 0 && (
              <Section icon={TrendingUp} title="Their Benefits/Claims" color="text-[#e07850]/60">
                <ul className="space-y-1">
                  {result.benefits.map((b, i) => (
                    <li key={i} className="text-xs text-white/50">{b}</li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Weaknesses */}
            {result.weaknesses.length > 0 && (
              <Section icon={AlertTriangle} title="Gaps You Can Exploit" color="text-amber-400/60">
                <ul className="space-y-1">
                  {result.weaknesses.map((w, i) => (
                    <li key={i} className="text-xs text-amber-300/70 flex items-center gap-2">
                      <span className="text-amber-400">!</span> {w}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Tech */}
            {result.techStack.length > 0 && (
              <Section icon={Search} title="Detected Tech" color="text-white/30">
                <div className="flex flex-wrap gap-1.5">
                  {result.techStack.map((t, i) => (
                    <span key={i} className="px-2 py-1 rounded bg-white/5 border border-white/[0.08] text-[10px] text-white/30">
                      {t}
                    </span>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function Section({ icon: Icon, title, color, children }: { icon: React.ElementType; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${color}`} />
        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">{title}</p>
      </div>
      {children}
    </div>
  );
}
