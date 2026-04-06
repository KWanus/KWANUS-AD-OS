"use client";

import { useState, useEffect } from "react";
import AppNav from "@/components/AppNav";
import Link from "next/link";
import {
  FileText, Loader2, Copy, Check, Download, RefreshCw, ExternalLink,
} from "lucide-react";

type RecentAnalysis = {
  id: string;
  title: string | null;
  score: number | null;
  verdict: string | null;
  createdAt: string;
};

export default function ProposalGeneratorPage() {
  const [analyses, setAnalyses] = useState<RecentAnalysis[]>([]);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [clientName, setClientName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [proposal, setProposal] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analyses?limit=20")
      .then((r) => r.json() as Promise<{ ok: boolean; analyses?: RecentAnalysis[] }>)
      .then((data) => {
        if (data.ok && data.analyses) {
          setAnalyses(data.analyses);
          if (data.analyses.length > 0) setSelectedRunId(data.analyses[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function generateProposal() {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId: selectedRunId || undefined,
          clientName: clientName || undefined,
        }),
      });
      const data = await res.json() as { ok: boolean; proposal?: string };
      if (data.ok && data.proposal) setProposal(data.proposal);
    } catch {
      // Silent
    } finally {
      setGenerating(false);
    }
  }

  function copyAll() {
    navigator.clipboard.writeText(proposal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadProposal() {
    const blob = new Blob([proposal], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proposal-${clientName || "client"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Proposal Generator</h1>
            <p className="text-sm text-white/35 mt-1">Create a professional client proposal from your analysis data</p>
          </div>
        </div>

        {!proposal ? (
          <div className="space-y-6">
            {/* Client name */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Client Name</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Green Valley Dental"
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
              />
            </div>

            {/* Select analysis */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">
                Base on Analysis (optional)
              </label>
              {loading ? (
                <Loader2 className="w-4 h-4 text-white/20 animate-spin" />
              ) : analyses.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {analyses.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedRunId(a.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition text-left ${
                        selectedRunId === a.id
                          ? "border-cyan-500/30 bg-cyan-500/10"
                          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{a.title ?? a.id}</p>
                        <p className="text-[10px] text-white/30 mt-0.5">
                          Score: {a.score ?? "—"} · {a.verdict ?? "—"} · {new Date(a.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedRunId === a.id && (
                        <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/25">No analyses yet. The proposal will use your business profile instead.</p>
              )}
            </div>

            {/* Generate button */}
            <button
              onClick={generateProposal}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-40"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating proposal...</>
              ) : (
                <><FileText className="w-4 h-4" /> Generate Proposal</>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Actions bar */}
            <div className="flex items-center gap-2">
              <button
                onClick={copyAll}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-[#0a0f1e] text-xs font-bold hover:bg-cyan-400 transition"
              >
                {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy All</>}
              </button>
              <button
                onClick={downloadProposal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-bold text-white/50 hover:text-white/70 transition"
              >
                <Download className="w-3.5 h-3.5" /> Download .md
              </button>
              {selectedRunId && (
                <Link
                  href={`/portal/${selectedRunId}`}
                  target="_blank"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-bold text-white/50 hover:text-white/70 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Client Portal
                </Link>
              )}
              <button
                onClick={() => { setProposal(""); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-bold text-white/50 hover:text-white/70 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> New Proposal
              </button>
            </div>

            {/* Proposal content */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8">
              <div className="prose prose-sm prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-white/80 leading-relaxed">
                  {proposal}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
