"use client";

import { useState, useEffect, useCallback } from "react";
import AppNav from "@/components/AppNav";
import Link from "next/link";
import {
  Search, Loader2, MapPin, Globe, Phone, Star, ChevronRight,
  Zap, CheckCircle, Clock, Send, AlertCircle, RefreshCw, Building2,
} from "lucide-react";

type Lead = {
  id: string;
  name: string;
  niche: string;
  location: string;
  website: string | null;
  phone: string | null;
  address: string | null;
  rating: number | null;
  reviewCount: number | null;
  score: number | null;
  verdict: string | null;
  summary: string | null;
  status: string;
  outreachSentAt: string | null;
  createdAt: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  new:            { label: "New",           color: "text-white/40 border-white/10",               icon: <Clock className="w-3 h-3" /> },
  analyzing:      { label: "Analyzing…",    color: "text-amber-400 border-amber-500/20",           icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  analyzed:       { label: "Analyzed",      color: "text-blue-400 border-blue-500/20",             icon: <CheckCircle className="w-3 h-3" /> },
  generating:     { label: "Generating…",   color: "text-purple-400 border-purple-500/20",         icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  ready:          { label: "Ready",         color: "text-emerald-400 border-emerald-500/20",       icon: <Zap className="w-3 h-3" /> },
  outreach_sent:  { label: "Outreach Sent", color: "text-cyan-400 border-cyan-500/20",             icon: <Send className="w-3 h-3" /> },
  replied:        { label: "Replied!",      color: "text-green-300 border-green-500/30",           icon: <CheckCircle className="w-3 h-3" /> },
  converted:      { label: "Client",        color: "text-amber-300 border-amber-400/30",           icon: <Star className="w-3 h-3" /> },
  rejected:       { label: "Skip",          color: "text-white/20 border-white/5",                 icon: <AlertCircle className="w-3 h-3" /> },
};

function ScoreBadge({ score, verdict }: { score: number | null; verdict: string | null }) {
  if (score === null) return null;
  const color = score >= 70 ? "text-emerald-400 bg-emerald-500/10" : score >= 45 ? "text-amber-400 bg-amber-500/10" : "text-red-400 bg-red-500/10";
  return (
    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${color}`}>
      {score}/100 {verdict ? `· ${verdict}` : ""}
    </span>
  );
}

function LeadCard({ lead, onProcess }: { lead: Lead; onProcess: (id: string, action: "analyze" | "generate") => void }) {
  const status = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new;
  const canAnalyze = lead.status === "new";
  const canGenerate = lead.status === "analyzed";
  const isProcessing = lead.status === "analyzing" || lead.status === "generating";

  return (
    <div className="bg-white/[0.025] border border-white/[0.07] rounded-2xl p-4 hover:border-white/[0.12] transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-sm font-black text-white truncate">{lead.name}</h3>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${status.color}`}>
              {status.icon}
              {status.label}
            </span>
          </div>
          {lead.score !== null && <ScoreBadge score={lead.score} verdict={lead.verdict} />}
        </div>
      </div>

      {/* Info row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
        {lead.address && (
          <span className="flex items-center gap-1 text-[11px] text-white/35">
            <MapPin className="w-3 h-3 shrink-0" />
            {lead.address.length > 40 ? lead.address.slice(0, 40) + "…" : lead.address}
          </span>
        )}
        {lead.phone && (
          <span className="flex items-center gap-1 text-[11px] text-white/35">
            <Phone className="w-3 h-3 shrink-0" />
            {lead.phone}
          </span>
        )}
        {lead.rating !== null && (
          <span className="flex items-center gap-1 text-[11px] text-amber-400/70">
            <Star className="w-3 h-3 shrink-0" />
            {lead.rating} ({lead.reviewCount ?? 0})
          </span>
        )}
        {lead.website ? (
          <span className="flex items-center gap-1 text-[11px] text-cyan-400/60">
            <Globe className="w-3 h-3 shrink-0" />
            {lead.website.replace(/https?:\/\/(www\.)?/, "").slice(0, 30)}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] text-red-400/60">
            <Globe className="w-3 h-3 shrink-0" />
            No website
          </span>
        )}
      </div>

      {/* Summary */}
      {lead.summary && (
        <p className="text-[11px] text-white/40 leading-relaxed mb-3 line-clamp-2">{lead.summary}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {canAnalyze && (
          <button
            onClick={() => onProcess(lead.id, "analyze")}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold hover:bg-blue-500/20 transition disabled:opacity-40"
          >
            <Search className="w-3 h-3" />
            Analyze
          </button>
        )}
        {canGenerate && (
          <button
            onClick={() => onProcess(lead.id, "generate")}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[11px] font-bold hover:bg-purple-500/20 transition disabled:opacity-40"
          >
            <Zap className="w-3 h-3" />
            Generate Assets
          </button>
        )}
        {(lead.status === "ready" || lead.status === "outreach_sent" || lead.status === "replied") && (
          <Link
            href={`/leads/${lead.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-bold hover:bg-cyan-500/20 transition"
          >
            View Assets
            <ChevronRight className="w-3 h-3" />
          </Link>
        )}
        <Link
          href={`/leads/${lead.id}`}
          className="ml-auto flex items-center gap-1 text-[11px] text-white/20 hover:text-white/50 transition"
        >
          Details <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const [niche, setNiche] = useState("");
  const [location, setLocation] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ found: number; created: number; isDemo?: boolean } | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch("/api/leads");
      const data = await res.json() as { ok: boolean; leads: Lead[] };
      if (data.ok) setLeads(data.leads);
    } finally {
      setLoadingLeads(false);
    }
  }, []);

  useEffect(() => {
    void fetchLeads();
    // Poll while any lead is processing
    const interval = setInterval(() => {
      void fetchLeads();
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  async function runSearch() {
    if (!niche.trim() || !location.trim() || searching) return;
    setSearching(true);
    setError(null);
    setSearchResult(null);
    try {
      const res = await fetch("/api/leads/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: niche.trim(), location: location.trim() }),
      });
      const data = await res.json() as { ok: boolean; found: number; created: number; isDemo?: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? "Search failed");
      } else {
        setSearchResult(data);
        await fetchLeads();
      }
    } catch {
      setError("Could not connect to search service");
    } finally {
      setSearching(false);
    }
  }

  async function processLead(id: string, action: "analyze" | "generate") {
    setProcessingIds((p) => new Set(p).add(id));
    try {
      await fetch(`/api/leads/${id}/${action}`, { method: "POST" });
      await fetchLeads();
    } finally {
      setProcessingIds((p) => {
        const next = new Set(p);
        next.delete(id);
        return next;
      });
    }
  }

  async function processAll(action: "analyze" | "generate") {
    const targets = action === "analyze"
      ? leads.filter((l) => l.status === "new")
      : leads.filter((l) => l.status === "analyzed");

    for (const lead of targets) {
      await processLead(lead.id, action);
    }
  }

  const newCount = leads.filter((l) => l.status === "new").length;
  const analyzedCount = leads.filter((l) => l.status === "analyzed").length;
  const readyCount = leads.filter((l) => l.status === "ready").length;
  const sentCount = leads.filter((l) => l.status === "outreach_sent" || l.status === "replied").length;

  const niches = [...new Set(leads.map((l) => l.niche))];
  const [filterNiche, setFilterNiche] = useState("all");

  const filtered = filterNiche === "all" ? leads : leads.filter((l) => l.niche === filterNiche);

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />

      <div className="max-w-5xl mx-auto px-4 pt-10 pb-20">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-black text-white">Lead Engine</h1>
          </div>
          <p className="text-sm text-white/35">Find businesses in any niche → analyze → generate assets → send outreach</p>
        </div>

        {/* Search form */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 mb-6">
          <p className="text-xs font-black text-white/50 uppercase tracking-widest mb-4">Find Businesses</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void runSearch()}
              placeholder="Niche (e.g. roofers, dentists, plumbers)"
              className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-cyan-500/40 transition"
            />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void runSearch()}
              placeholder="Location (e.g. Houston TX, Chicago)"
              className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-cyan-500/40 transition"
            />
            <button
              onClick={() => void runSearch()}
              disabled={!niche.trim() || !location.trim() || searching}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-bold hover:opacity-90 disabled:opacity-30 transition flex items-center gap-2 whitespace-nowrap"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {searching ? "Searching…" : "Find Businesses"}
            </button>
          </div>

          {searchResult && (
            <div className={`mt-3 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              searchResult.isDemo
                ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
            }`}>
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              {searchResult.isDemo
                ? `Demo mode — ${searchResult.created} sample leads created. Add your SerpAPI key in .env to search real businesses.`
                : `Found ${searchResult.found} businesses — ${searchResult.created} new leads added.`}
            </div>
          )}
          {error && (
            <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Stats bar */}
        {leads.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: "New",      count: newCount,      color: "text-white/50" },
              { label: "Analyzed", count: analyzedCount, color: "text-blue-400" },
              { label: "Ready",    count: readyCount,    color: "text-emerald-400" },
              { label: "Sent",     count: sentCount,     color: "text-cyan-400" },
            ].map((s) => (
              <div key={s.label} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 text-center">
                <p className={`text-lg font-black ${s.color}`}>{s.count}</p>
                <p className="text-[10px] text-white/30 font-bold">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Bulk actions + filters */}
        {leads.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {newCount > 0 && (
              <button
                onClick={() => void processAll("analyze")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition"
              >
                <Search className="w-3 h-3" />
                Analyze All ({newCount})
              </button>
            )}
            {analyzedCount > 0 && (
              <button
                onClick={() => void processAll("generate")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold hover:bg-purple-500/20 transition"
              >
                <Zap className="w-3 h-3" />
                Generate Assets ({analyzedCount})
              </button>
            )}
            <button
              onClick={() => void fetchLeads()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.08] text-white/30 hover:text-white/60 text-xs transition ml-auto"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
        )}

        {/* Niche filter */}
        {niches.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-4">
            <button
              onClick={() => setFilterNiche("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${filterNiche === "all" ? "bg-white/[0.07] text-white border-white/15" : "text-white/30 border-white/[0.07] hover:text-white/60"}`}
            >
              All
            </button>
            {niches.map((n) => (
              <button
                key={n}
                onClick={() => setFilterNiche(n)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition capitalize ${filterNiche === n ? "bg-white/[0.07] text-white border-white/15" : "text-white/30 border-white/[0.07] hover:text-white/60"}`}
              >
                {n}
              </button>
            ))}
          </div>
        )}

        {/* Lead list */}
        {loadingLeads ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-white/20" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-white/20">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-bold">No leads yet</p>
            <p className="text-xs mt-1 opacity-60">Search for businesses above to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filtered.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onProcess={(id, action) => void processLead(id, action)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
