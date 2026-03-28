"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import AppNav from "@/components/AppNav";
import ScanSubNav from "@/components/ScanSubNav";
import DatabaseFallbackNotice from "@/components/DatabaseFallbackNotice";
import {
  Search,
  ScanSearch,
  Loader2,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Trash2,
  ExternalLink,
  BarChart2,
  Zap,
  Filter,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OpportunitySummary {
  id: string;
  status: string;
  totalScore: number | null;
  topGaps: string[] | null;
  topStrengths: string[] | null;
  recommendedPath: string | null;
}

interface Analysis {
  id: string;
  mode: string;
  inputUrl: string;
  linkType: string | null;
  title: string | null;
  score: number | null;
  verdict: string | null;
  confidence: string | null;
  summary: string | null;
  createdAt: string;
  opportunityAssessments: OpportunitySummary[];
  _count: { assetPackages: number };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VERDICT_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  Pursue:    { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle },
  Consider:  { color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   icon: TrendingUp },
  Reject:    { color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20",     icon: XCircle },
};

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-white/20">—</span>;
  const color = score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative w-10 h-10">
      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        <circle
          cx="20" cy="20" r="16" fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={`${(score / 100) * 100.5} 100.5`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-white">
        {score}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Analysis Row
// ---------------------------------------------------------------------------

function AnalysisRow({ analysis, onDelete }: { analysis: Analysis; onDelete: (id: string) => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const verdict = VERDICT_CONFIG[analysis.verdict ?? ""] ?? VERDICT_CONFIG.Consider;
  const VerdictIcon = verdict.icon;
  const opp = analysis.opportunityAssessments[0];

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(true);
    try {
      await fetch(`/api/analyses/${analysis.id}`, { method: "DELETE" });
      onDelete(analysis.id);
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <Link
      href={`/analyses/${analysis.id}`}
      className="group flex items-center gap-4 px-5 py-4 hover:bg-white/[0.025] border-b border-white/[0.04] transition-colors"
    >
      {/* Score */}
      <div className="shrink-0">
        <ScoreBadge score={analysis.score} />
      </div>

      {/* Title + URL */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
            {analysis.title || analysis.inputUrl}
          </p>
          <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md border ${verdict.bg} ${verdict.border} ${verdict.color}`}>
            {analysis.verdict ?? "—"}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[11px] text-white/30 truncate max-w-[300px] flex items-center gap-1">
            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
            {analysis.inputUrl}
          </span>
          <span className="text-[10px] text-white/20">
            {analysis.mode}
          </span>
          {analysis._count.assetPackages > 0 && (
            <span className="text-[10px] text-purple-400/60 flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5" /> {analysis._count.assetPackages} asset{analysis._count.assetPackages !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Opportunity status */}
      {opp && (
        <div className="hidden md:block shrink-0 text-right">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider">{opp.status}</p>
          {opp.totalScore !== null && (
            <p className="text-xs font-black text-cyan-400/70">{opp.totalScore}/100</p>
          )}
        </div>
      )}

      {/* Summary */}
      {analysis.summary && (
        <div className="hidden lg:block w-48 shrink-0">
          <p className="text-[11px] text-white/30 line-clamp-2 leading-relaxed">{analysis.summary}</p>
        </div>
      )}

      {/* Timestamp */}
      <div className="hidden sm:block w-28 text-right shrink-0">
        <span className="text-[11px] text-white/25">
          {formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
        {confirmDelete ? (
          <>
            <button
              onClick={(e) => void handleDelete(e)}
              disabled={deleting}
              className="px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 text-[11px] font-black hover:bg-red-500/30 transition disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Delete"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.07] text-white/40 text-[11px] font-semibold hover:text-white transition"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-white/[0.04]">
      <div className="w-10 h-10 rounded-full bg-white/[0.04] animate-pulse shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 bg-white/[0.04] rounded-lg animate-pulse w-48" />
        <div className="h-2.5 bg-white/[0.04] rounded animate-pulse w-64" />
      </div>
      <div className="h-5 w-16 bg-white/[0.04] rounded-md animate-pulse hidden md:block" />
      <div className="h-5 w-24 bg-white/[0.04] rounded animate-pulse hidden sm:block" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center mb-5">
        <ScanSearch className="w-7 h-7 text-cyan-400/70" />
      </div>
      {filtered ? (
        <>
          <h2 className="text-lg font-black text-white mb-2">No analyses match your filters</h2>
          <p className="text-sm text-white/35 max-w-xs">Try adjusting your search or filter criteria.</p>
        </>
      ) : (
        <>
          <h2 className="text-lg font-black text-white mb-2">No analyses yet</h2>
          <p className="text-sm text-white/35 max-w-xs mb-6 leading-relaxed">
            Run your first scan to analyze a business URL or product — the system will score, diagnose, and generate assets automatically.
          </p>
          <Link
            href="/scan"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <ScanSearch className="w-4 h-4" /> Run First Scan
          </Link>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AnalysesPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [total, setTotal] = useState(0);
  const [databaseUnavailable, setDatabaseUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verdictFilter, setVerdictFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareResult, setCompareResult] = useState<{
    analysisA: { title: string; score: number };
    analysisB: { title: string; score: number };
    scoreDiff: number;
    summary: string;
    comparison: { dimension: string; a: number; b: number; diff: number; winner: string }[];
  } | null>(null);
  const [comparing, setComparing] = useState(false);

  const fetchAnalyses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (verdictFilter) params.set("verdict", verdictFilter);
      if (modeFilter) params.set("mode", modeFilter);
      if (sortBy) params.set("sortBy", sortBy);

      const res = await fetch(`/api/analyses?${params}`);
      const data = await res.json() as {
        ok: boolean;
        analyses?: Analysis[];
        total?: number;
        databaseUnavailable?: boolean;
      };
      if (data.ok) {
        setAnalyses(data.analyses ?? []);
        setTotal(data.total ?? 0);
        setDatabaseUnavailable(Boolean(data.databaseUnavailable));
      }
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, [search, verdictFilter, modeFilter, sortBy]);

  useEffect(() => {
    const t = setTimeout(fetchAnalyses, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchAnalyses, search]);

  const isFiltered = !!(search || verdictFilter || modeFilter);

  // Stats
  const pursued = analyses.filter(a => a.verdict === "Pursue").length;
  const avgScore = analyses.length > 0
    ? Math.round(analyses.reduce((s, a) => s + (a.score ?? 0), 0) / analyses.length)
    : 0;
  const withAssets = analyses.filter(a => a._count.assetPackages > 0).length;

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <ScanSubNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <DatabaseFallbackNotice visible={databaseUnavailable} className="mb-6" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Scan History</h1>
            <p className="text-sm text-white/35 mt-0.5">
              {loading ? "Loading..." : `${total} analysis run${total !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Quick stats */}
          {analyses.length > 0 && !loading && (
            <div className="flex gap-3">
              {[
                { label: "Avg Score", value: avgScore, color: "text-cyan-400" },
                { label: "Pursue", value: pursued, color: "text-emerald-400" },
                { label: "With Assets", value: withAssets, color: "text-purple-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2 text-center">
                  <p className={`text-base font-black ${color}`}>{value}</p>
                  <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            {analyses.length >= 2 && (
              <button
                onClick={() => { setCompareMode(v => !v); setCompareIds([]); setCompareResult(null); }}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition ${
                  compareMode
                    ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
                    : "border-white/[0.08] bg-white/[0.03] text-white/50 hover:text-white hover:border-white/20"
                }`}
              >
                Compare
              </button>
            )}
            {analyses.length > 0 && (
              <a
                href="/api/analyses/export"
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/50 text-xs font-semibold hover:text-white hover:border-white/20 transition"
              >
                Export CSV
              </a>
            )}
            <Link
              href="/scan"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition-opacity"
            >
              <ScanSearch className="w-4 h-4" /> New Scan
            </Link>
          </div>
        </div>

        {/* Compare bar */}
        {compareMode && (
          <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
            <span className="text-xs font-bold text-cyan-300">
              {compareIds.length === 0 ? "Select 2 scans to compare" : compareIds.length === 1 ? "Select 1 more scan" : "Ready to compare"}
            </span>
            {compareIds.length === 2 && (
              <button
                onClick={async () => {
                  setComparing(true);
                  try {
                    const res = await fetch("/api/analyses/compare", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ analysisIdA: compareIds[0], analysisIdB: compareIds[1] }),
                    });
                    const data = await res.json() as { ok: boolean; analysisA?: { title: string; score: number }; analysisB?: { title: string; score: number }; scoreDiff?: number; summary?: string; comparison?: { dimension: string; a: number; b: number; diff: number; winner: string }[] };
                    if (data.ok) setCompareResult({ analysisA: data.analysisA!, analysisB: data.analysisB!, scoreDiff: data.scoreDiff!, summary: data.summary!, comparison: data.comparison! });
                  } catch { /* non-fatal */ } finally { setComparing(false); }
                }}
                disabled={comparing}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold hover:bg-cyan-500/30 transition disabled:opacity-40"
              >
                {comparing ? "Comparing..." : "Compare Now"}
              </button>
            )}
            <button onClick={() => { setCompareIds([]); setCompareResult(null); }} className="text-xs text-white/30 hover:text-white/60 ml-auto">Clear</button>
          </div>
        )}

        {/* Compare result */}
        {compareResult && (
          <div className="mb-6 bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/30">Comparison Result</h3>
              <p className="text-xs text-white/40">{compareResult.summary}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white/[0.02] rounded-xl p-3 text-center">
                <p className="text-[10px] text-white/30 font-bold">A</p>
                <p className="text-sm font-black text-white truncate">{compareResult.analysisA.title}</p>
                <p className="text-lg font-black text-cyan-400">{compareResult.analysisA.score}/100</p>
              </div>
              <div className="bg-white/[0.02] rounded-xl p-3 text-center">
                <p className="text-[10px] text-white/30 font-bold">B</p>
                <p className="text-sm font-black text-white truncate">{compareResult.analysisB.title}</p>
                <p className="text-lg font-black text-purple-400">{compareResult.analysisB.score}/100</p>
              </div>
            </div>
            <div className="space-y-1.5">
              {compareResult.comparison.map(c => (
                <div key={c.dimension} className="flex items-center gap-3 text-xs">
                  <span className="w-32 text-white/40 truncate">{c.dimension}</span>
                  <span className={`w-10 text-right font-bold ${c.winner === "a" ? "text-cyan-400" : "text-white/30"}`}>{c.a}</span>
                  <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden relative">
                    <div className="absolute inset-y-0 left-0 bg-cyan-500/50 rounded-full" style={{ width: `${c.a}%` }} />
                    <div className="absolute inset-y-0 right-0 bg-purple-500/50 rounded-full" style={{ width: `${c.b}%` }} />
                  </div>
                  <span className={`w-10 font-bold ${c.winner === "b" ? "text-purple-400" : "text-white/30"}`}>{c.b}</span>
                  <span className={`w-12 text-right text-[10px] font-bold ${c.diff > 0 ? "text-purple-400" : c.diff < 0 ? "text-cyan-400" : "text-white/20"}`}>
                    {c.diff > 0 ? `+${c.diff}` : c.diff}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by URL or title..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
            />
          </div>

          <select
            value={verdictFilter}
            onChange={(e) => setVerdictFilter(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/60 focus:outline-none focus:border-cyan-500/50 transition appearance-none cursor-pointer"
          >
            <option value="">All Verdicts</option>
            <option value="Pursue" className="bg-[#0d1525]">Pursue</option>
            <option value="Consider" className="bg-[#0d1525]">Consider</option>
            <option value="Reject" className="bg-[#0d1525]">Reject</option>
          </select>

          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/60 focus:outline-none focus:border-cyan-500/50 transition appearance-none cursor-pointer"
          >
            <option value="">All Modes</option>
            <option value="operator" className="bg-[#0d1525]">Operator</option>
            <option value="consultant" className="bg-[#0d1525]">Consultant</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/60 focus:outline-none focus:border-cyan-500/50 transition appearance-none cursor-pointer"
          >
            <option value="createdAt" className="bg-[#0d1525]">Most Recent</option>
            <option value="score" className="bg-[#0d1525]">Highest Score</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
          {/* Header row */}
          <div className="flex items-center gap-4 px-5 py-3 border-b border-white/[0.06] bg-white/[0.015]">
            <div className="w-10 shrink-0 text-[10px] font-black uppercase tracking-widest text-white/25">Score</div>
            <div className="flex-1 text-[10px] font-black uppercase tracking-widest text-white/25">Analysis</div>
            <div className="hidden md:block w-16 text-right text-[10px] font-black uppercase tracking-widest text-white/25">Status</div>
            <div className="hidden lg:block w-48 text-[10px] font-black uppercase tracking-widest text-white/25">Summary</div>
            <div className="hidden sm:block w-28 text-right text-[10px] font-black uppercase tracking-widest text-white/25">Date</div>
            <div className="w-20 shrink-0" />
          </div>

          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
          ) : analyses.length === 0 ? (
            <EmptyState filtered={isFiltered} />
          ) : (
            analyses.map((analysis) => (
              <div key={analysis.id} className="relative">
                {compareMode && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCompareIds(prev => {
                        if (prev.includes(analysis.id)) return prev.filter(id => id !== analysis.id);
                        if (prev.length >= 2) return prev;
                        return [...prev, analysis.id];
                      });
                    }}
                    className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${
                      compareIds.includes(analysis.id) ? "border-cyan-500 bg-cyan-500 text-white" : "border-white/20 bg-transparent"
                    }`}
                  >
                    {compareIds.includes(analysis.id) && <span className="text-[10px] font-black">{compareIds.indexOf(analysis.id) + 1}</span>}
                  </button>
                )}
                <div className={compareMode ? "pl-8" : ""}>
                  <AnalysisRow
                    analysis={analysis}
                    onDelete={(id) => setAnalyses(prev => prev.filter(a => a.id !== id))}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
