"use client";
import { useState } from "react";
import Link from "next/link";

type ProductScanResult = {
  id: string;
  name: string;
  score: number;
  demandScore: number;
  competitionScore: number;
  reasoning: string;
  source: "phase1-product-scan";
  createdAt: string;
};

type ScanApiResponse = {
  success: boolean;
  mode: "product";
  data: ProductScanResult;
  error?: string;
};

function scoreColor(score: number): string {
  if (score >= 70) return "text-green-400";
  if (score >= 40) return "text-yellow-400";
  return "text-red-400";
}

export default function ScanProductsPage() {
  const [productInput, setProductInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ProductScanResult | null>(null);

  async function handleScan() {
    if (!productInput.trim()) {
      setError("Please describe your product before scanning.");
      return;
    }
    setError("");
    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "product", productInput: productInput.trim() }),
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
        <h1 className="text-2xl font-bold mt-2">Scan Products</h1>
        <p className="text-sm text-white/40 mt-1">Describe your product to get demand and competition analysis.</p>
      </header>

      <div className="flex-1 px-8 py-10 max-w-3xl mx-auto w-full">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-6">
          <label className="block mb-2 text-sm text-white/60">Product Description</label>
          <textarea
            value={productInput}
            onChange={(e) => setProductInput(e.target.value)}
            placeholder="Describe your product — what it does, who it's for, what problem it solves..."
            rows={5}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-400/60 transition resize-none"
          />
          <button
            onClick={handleScan}
            disabled={isLoading}
            className="mt-4 w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 text-sm font-semibold text-[#0a0f1e] transition"
          >
            {isLoading ? "Scanning..." : "Run Product Scan"}
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
              <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Opportunity Score</p>
              <p className={`text-6xl font-bold ${scoreColor(result.score)}`}>
                {result.score}
                <span className="text-2xl text-white/30">/100</span>
              </p>
              <p className="text-white/40 text-sm mt-2 truncate">{result.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Demand Score</p>
                <p className={`text-4xl font-bold ${scoreColor(result.demandScore)}`}>
                  {result.demandScore}
                  <span className="text-lg text-white/30">/100</span>
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Competition</p>
                <p className="text-4xl font-bold text-yellow-400">
                  {result.competitionScore}
                  <span className="text-lg text-white/30">/100</span>
                </p>
                <p className="text-xs text-white/30 mt-1">moderate</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-3">Analysis</h3>
              <p className="text-sm text-white/70 leading-relaxed">{result.reasoning}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
