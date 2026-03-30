"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Globe, MessageSquare } from "lucide-react";

export default function HimalayaImprovePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [challenge, setChallenge] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("");

  const canSubmit = url.trim() || businessDescription.trim();

  async function handleScan() {
    setLoading(true);

    try {
      // Step 1: Diagnose
      setPhase("Scanning your business...");
      const diagRes = await fetch("/api/himalaya/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "improve",
          url: url.trim() || undefined,
          businessDescription: businessDescription.trim() || undefined,
          challenge: challenge.trim() || undefined,
        }),
      });
      const diagData = await diagRes.json();
      if (!diagData.ok) throw new Error(diagData.error);

      // Step 2: Strategize
      setPhase("Analyzing weaknesses...");
      const stratRes = await fetch("/api/himalaya/strategize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "improve", diagnosis: diagData.diagnosis }),
      });
      const stratData = await stratRes.json();
      if (!stratData.ok) throw new Error(stratData.error);

      // Step 3: Generate fixes
      setPhase("Generating fixes...");
      const genRes = await fetch("/api/himalaya/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "improve",
          diagnosis: diagData.diagnosis,
          strategy: stratData.strategy,
        }),
      });
      const genData = await genRes.json();
      if (!genData.ok) throw new Error(genData.error);

      // Store results and navigate
      sessionStorage.setItem("himalaya_results", JSON.stringify({
        mode: "improve",
        diagnosis: diagData.diagnosis,
        strategy: stratData.strategy,
        generated: genData.generated,
        created: genData.created,
      }));
      router.push("/himalaya/results");
    } catch (err) {
      console.error(err);
      setPhase("");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050a14] flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Back button */}
        {!loading && (
          <button
            onClick={() => router.push("/himalaya")}
            className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}

        {/* ── Loading ──────────────────────────────────────────────────── */}
        {loading && (
          <div className="text-center space-y-6 py-20">
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto" />
            <div>
              <p className="text-white text-lg font-medium">{phase}</p>
              <p className="text-white/40 text-sm mt-2">This takes about 30 seconds.</p>
            </div>
            <div className="flex items-center justify-center gap-3">
              {["Scan", "Analysis", "Fixes"].map((label) => {
                const isActive =
                  (label === "Scan" && phase.includes("Scanning")) ||
                  (label === "Analysis" && phase.includes("Analyzing")) ||
                  (label === "Fixes" && phase.includes("Generating"));
                const isDone =
                  (label === "Scan" && !phase.includes("Scanning")) ||
                  (label === "Analysis" && phase.includes("Generating"));
                return (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isDone ? "bg-purple-400" : isActive ? "bg-purple-400 animate-pulse" : "bg-white/20"}`} />
                    <span className={`text-xs ${isDone || isActive ? "text-white/70" : "text-white/30"}`}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Form ─────────────────────────────────────────────────────── */}
        {!loading && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-white">Tell us about your business</h1>
              <p className="text-white/40 text-sm">Share a URL, a description, or both. More info = better results.</p>
            </div>

            {/* URL input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-white/60 text-sm">
                <Globe className="w-4 h-4" /> Website URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yourbusiness.com"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-white/60 text-sm">
                <MessageSquare className="w-4 h-4" /> Describe your business
              </label>
              <textarea
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="What do you do? Who do you serve? What do you sell?"
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 resize-none"
              />
            </div>

            {/* Challenge */}
            <div className="space-y-2">
              <label className="text-white/60 text-sm">Biggest challenge right now</label>
              <input
                type="text"
                value={challenge}
                onChange={(e) => setChallenge(e.target.value)}
                placeholder="e.g. Not enough leads, low conversion, no follow-up system"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            <button
              onClick={handleScan}
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-500 px-4 py-3 text-sm font-medium text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-purple-400 transition-colors"
            >
              Scan & Fix My Business <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
