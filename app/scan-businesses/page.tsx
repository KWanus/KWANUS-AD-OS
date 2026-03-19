"use client";
import { useState } from "react";
import Link from "next/link";

type BusinessScanResult = {
  id: string;
  url: string;
  overallScore: number;
  issues: string[];
  strengths: string[];
  suggestions: string[];
  source: "phase1-business-scan";
  createdAt: string;
};

type ScanApiResponse = {
  success: boolean;
  mode: "business";
  data: BusinessScanResult;
  error?: string;
};

function scoreColor(score: number): string {
  if (score >= 70) return "text-green-400";
  if (score >= 40) return "text-yellow-400";
  return "text-red-400";
}

export default function ScanBusinessesPage() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<BusinessScanResult | null>(null);

  async function handleScan() {
    if (!url.trim()) {
      setError("Please enter a URL to scan.");
      return;
    }
    setError("");
    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "business", url: url.trim() }),
      });
      const payload = (await res.json()) as ScanApiResponse;
      if (!payload.success || !payload.data) {
        setError(payload.error ?? "Scan failed. Please try again.");
        return;
      }
      setResult(payload.data);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0f1e] text-white flex flex-col">
      <header className="px-8 py-6 border-b border-white/10">
        <Link href="/" className="text-cyan-400 text-sm hover:underline">← Back to Dashboard</Link>
        <h1 className="text-2xl font-bold mt-2">Scan Businesses</h1>
        <p className="text-sm text-white/40 mt-1">Enter a business URL to get a structured diagnostic report.</p>
      </header>

      <div className="flex-1 px-8 py-10 max-w-3xl mx-auto w-full">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-6">
          <label className="block mb-2 text-sm text-white/60">Business URL</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-400/60 transition"
            onKeyDown={(e) => { if (e.key === "Enter") handleScan(); }}
          />
          <button
            onClick={handleScan}
            disabled={isLoading}
            className="mt-4 w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 text-sm font-semibold text-[#0a0f1e] transition"
          >
            {isLoading ? "Scanning..." : "Run Business Scan"}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 mb-6 text-sm text-red-300">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Overall Score</p>
              <p className={`text-6xl font-bold ${scoreColor(result.overallScore)}`}>
                {result.overallScore}
                <span className="text-2xl text-white/30">/100</span>
              </p>
              <p className="text-white/40 text-sm mt-2">{result.url}</p>
            </div>

            {result.strengths.length > 0 && (
              <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6">
                <h3 className="text-sm font-semibold text-green-400 uppercase tracking-widest mb-3">Strengths</h3>
                <ul className="space-y-2">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                      <span className="text-green-400 mt-0.5">✓</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.issues.length > 0 && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                <h3 className="text-sm font-semibold text-red-400 uppercase tracking-widest mb-3">Issues</h3>
                <ul className="space-y-2">
                  {result.issues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                      <span className="text-red-400 mt-0.5">✗</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.suggestions.length > 0 && (
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">
                <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-widest mb-3">Suggestions</h3>
                <ul className="space-y-2">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                      <span className="text-yellow-400 mt-0.5">→</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
