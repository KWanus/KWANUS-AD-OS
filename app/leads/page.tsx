"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import CRMSubNav from "@/components/CRMSubNav";
import DatabaseFallbackNotice from "@/components/DatabaseFallbackNotice";
import { WorkspaceHero, WorkspaceShell } from "@/components/ui/WorkspaceShell";
import {
  AlertCircle,
  BotMessageSquare,
  Building2,
  CheckCircle,
  ChevronRight,
  Clock,
  Globe,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

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

type BusinessProfileSummary = {
  businessType: string;
  businessName: string | null;
  niche: string | null;
  location: string | null;
  mainGoal: string | null;
  activeSystems?: string[];
  recommendedSystems?: {
    firstAction?: string;
    strategicSummary?: string;
  } | null;
};

type StatsSummary = {
  effectiveSystemScore?: number;
  unsyncedSystems?: string[];
  databaseUnavailable?: boolean;
  osVerdict?: {
    status?: string;
    label?: string;
    reason?: string;
  };
};
type ExecutionTier = "core" | "elite";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: ReactNode }> = {
  new: { label: "New", color: "text-white/55 border-white/10 bg-white/[0.04]", icon: <Clock className="h-3 w-3" /> },
  analyzing: { label: "Analyzing", color: "text-amber-300 border-amber-500/20 bg-amber-500/10", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  analyzed: { label: "Analyzed", color: "text-blue-300 border-blue-500/20 bg-blue-500/10", icon: <CheckCircle className="h-3 w-3" /> },
  generating: { label: "Generating", color: "text-violet-300 border-violet-500/20 bg-violet-500/10", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  ready: { label: "Ready", color: "text-emerald-300 border-emerald-500/20 bg-emerald-500/10", icon: <Zap className="h-3 w-3" /> },
  outreach_sent: { label: "Outreach Sent", color: "text-[#f5a623] border-[#f5a623]/20 bg-[#f5a623]/10", icon: <Send className="h-3 w-3" /> },
  replied: { label: "Replied", color: "text-green-200 border-green-500/20 bg-green-500/10", icon: <CheckCircle className="h-3 w-3" /> },
  converted: { label: "Client", color: "text-amber-200 border-amber-400/20 bg-amber-500/10", icon: <Star className="h-3 w-3" /> },
  rejected: { label: "Skipped", color: "text-white/40 border-white/10 bg-white/[0.03]", icon: <AlertCircle className="h-3 w-3" /> },
};

function ScoreBadge({ score, verdict }: { score: number | null; verdict: string | null }) {
  if (score === null) return null;

  const tone =
    score >= 70
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
      : score >= 45
        ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
        : "border-red-500/20 bg-red-500/10 text-red-300";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${tone}`}>
      {score}/100{verdict ? ` · ${verdict}` : ""}
    </span>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-white/[0.08]" />
      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/30">{children}</p>
      <div className="h-px flex-1 bg-white/[0.08]" />
    </div>
  );
}

function verdictTone(status?: string) {
  if (status === "healthy") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  if (status === "stale") return "border-[#f5a623]/20 bg-[#f5a623]/10 text-[#f5f0e8]";
  return "border-amber-500/20 bg-amber-500/10 text-amber-100";
}

function LeadCard({
  lead,
  isProcessing,
  onProcess,
}: {
  lead: Lead;
  isProcessing: boolean;
  onProcess: (id: string, action: "analyze" | "generate") => void;
}) {
  const status = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new;
  const canAnalyze = lead.status === "new";
  const canGenerate = lead.status === "analyzed";

  return (
    <div className="rounded-[28px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)] transition hover:border-white/[0.12] hover:bg-white/[0.05]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-black tracking-tight text-white">{lead.name}</h3>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${status.color}`}>
              {status.icon}
              {status.label}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-white/35">
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {lead.niche || "General"}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {lead.location}
            </span>
          </div>
        </div>
        <ScoreBadge score={lead.score} verdict={lead.verdict} />
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.07] bg-black/20 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">Contact</p>
          <div className="mt-3 space-y-2 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#f5a623]/70" />
              <span className="truncate">{lead.phone ?? "No phone found"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#f5a623]/70" />
              <span className="truncate">
                {lead.website ? lead.website.replace(/https?:\/\/(www\.)?/, "") : "No website found"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-black/20 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">Signals</p>
          <div className="mt-3 space-y-2 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-300/70" />
              <span className="truncate">{lead.address ?? "Address unavailable"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-300/80" />
              <span>{lead.rating !== null ? `${lead.rating} stars · ${lead.reviewCount ?? 0} reviews` : "No rating captured yet"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">Lead Summary</p>
        <p className="mt-2 text-sm leading-6 text-white/55">
          {lead.summary ?? "Run analysis to generate a quick view of the business, what is missing, and where the opportunity is strongest."}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {canAnalyze && (
          <button
            onClick={() => onProcess(lead.id, "analyze")}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-2.5 text-sm font-black text-blue-200 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Analyze Lead
          </button>
        )}

        {canGenerate && (
          <button
            onClick={() => onProcess(lead.id, "generate")}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-2.5 text-sm font-black text-violet-200 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate Assets
          </button>
        )}

        {(lead.status === "ready" || lead.status === "outreach_sent" || lead.status === "replied") && (
          <Link
            href={`/leads/${lead.id}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-black text-emerald-200 transition hover:bg-emerald-500/20"
          >
            Open Assets
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}

        <Link
          href={`/leads/${lead.id}`}
          className="ml-auto inline-flex items-center gap-2 text-sm font-bold text-white/40 transition hover:text-white/70"
        >
          View Details
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const [executionTier, setExecutionTier] = useState<ExecutionTier>("elite");
  const [niche, setNiche] = useState("");
  const [location, setLocation] = useState("");
  const [leadQuery, setLeadQuery] = useState("");
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileSummary | null>(null);
  const [osStats, setOsStats] = useState<StatsSummary | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ found: number; created: number; isDemo?: boolean } | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [filterNiche, setFilterNiche] = useState("all");
  const [syncingSystem, setSyncingSystem] = useState(false);
  const [refreshingRecommendations, setRefreshingRecommendations] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      const [leadRes, profileRes, statsRes] = await Promise.all([
        fetch("/api/leads"),
        fetch("/api/business-profile"),
        fetch("/api/stats"),
      ]);
      const data = await leadRes.json() as { ok: boolean; leads: Lead[] };
      const profileData = await profileRes.json() as { ok: boolean; profile?: BusinessProfileSummary | null };
      const statsData = await statsRes.json() as { ok: boolean; stats?: StatsSummary | null };
      if (data.ok) {
        setLeads(data.leads);
      }
      if (profileData.ok && profileData.profile) {
        setBusinessProfile(profileData.profile);
        if (!niche && profileData.profile.niche) setNiche(profileData.profile.niche);
        if (!location && profileData.profile.location) setLocation(profileData.profile.location);
      }
      if (statsData.ok) {
        setOsStats(statsData.stats ?? null);
      }
    } finally {
      setLoadingLeads(false);
    }
  }, [location, niche]);

  useEffect(() => {
    void fetchLeads();
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
        body: JSON.stringify({ niche: niche.trim(), location: location.trim(), executionTier }),
      });
      const data = await res.json() as { ok: boolean; found: number; created: number; isDemo?: boolean; error?: string };

      if (!data.ok) {
        setError(data.error ?? "Search failed");
      } else {
        setSearchResult(data);
        if (data.ok) {
          toast.success(`Found ${data.found} businesses${data.isDemo ? " (demo mode)" : ""}`);
        }
        await fetchLeads();
      }
    } catch {
      setError("Could not connect to search service");
    } finally {
      setSearching(false);
    }
  }

  async function processLead(id: string, action: "analyze" | "generate") {
    setProcessingIds((current) => new Set(current).add(id));
    try {
      await fetch(`/api/leads/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ executionTier }),
      });
      await fetchLeads();
    } finally {
      setProcessingIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  }

  async function processAll(action: "analyze" | "generate") {
    const targets = action === "analyze"
      ? leads.filter((lead) => lead.status === "new")
      : leads.filter((lead) => lead.status === "analyzed");

    for (const lead of targets) {
      await processLead(lead.id, action);
    }
  }

  async function syncBusinessSystem() {
    try {
      setSyncingSystem(true);
      const res = await fetch("/api/business-profile/sync", { method: "POST" });
      const data = await res.json() as { ok?: boolean };
      if (!res.ok || !data.ok) throw new Error("Failed");
      await fetchLeads();
    } finally {
      setSyncingSystem(false);
    }
  }

  async function refreshBusinessSystem() {
    if (!businessProfile?.businessType) return;
    try {
      setRefreshingRecommendations(true);
      const res = await fetch("/api/business-profile/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType: businessProfile.businessType,
          niche: businessProfile.niche,
          goal: businessProfile.mainGoal,
        }),
      });
      const data = await res.json() as { ok?: boolean };
      if (!res.ok || !data.ok) throw new Error("Failed");
      await fetchLeads();
    } finally {
      setRefreshingRecommendations(false);
    }
  }

  const newCount = leads.filter((lead) => lead.status === "new").length;
  const analyzedCount = leads.filter((lead) => lead.status === "analyzed").length;
  const readyCount = leads.filter((lead) => lead.status === "ready").length;
  const sentCount = leads.filter((lead) => lead.status === "outreach_sent" || lead.status === "replied").length;

  const niches = [...new Set(leads.map((lead) => lead.niche).filter(Boolean))];
  const visibleByNiche = filterNiche === "all" ? leads : leads.filter((lead) => lead.niche === filterNiche);
  const filtered = leadQuery.trim()
    ? visibleByNiche.filter((lead) => {
        const query = leadQuery.toLowerCase();
        return [
          lead.name,
          lead.niche,
          lead.location,
          lead.address ?? "",
          lead.website ?? "",
        ].some((value) => value.toLowerCase().includes(query));
      })
    : visibleByNiche;

  return (
    <main className="min-h-screen bg-t-bg text-white">
      <AppNav />
      <CRMSubNav />

      <WorkspaceShell maxWidth="max-w-6xl">
        <WorkspaceHero
          eyebrow="Lead Engine"
          title="Build the outreach pipeline like a command center"
          description="Find businesses by niche and city, score where the opportunity is real, generate assets, and keep your best prospects moving without the page feeling like a plain spreadsheet."
          accent="from-emerald-300 via-[#f5a623] to-blue-300"
          actions={(
            <>
              <Link
                href="/copilot"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#f5a623] to-[#e07850] px-5 py-3 text-sm font-black text-white shadow-[0_0_26px_rgba(245,166,35,0.28)]"
              >
                <BotMessageSquare className="h-4 w-4" />
                Ask Copilot
              </Link>
              <button
                onClick={() => void fetchLeads()}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/75 transition hover:bg-white/[0.07]"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Pipeline
              </button>
            </>
          )}
          stats={[
            { label: "New", value: String(newCount), tone: "text-white" },
            { label: "Analyzed", value: String(analyzedCount), tone: "text-blue-300" },
            { label: "Ready", value: String(readyCount), tone: "text-emerald-300" },
            { label: "Sent", value: String(sentCount), tone: "text-[#f5a623]" },
          ]}
        />

        <section className="mb-8 grid gap-4 xl:grid-cols-[1.5fr,0.95fr]">
          {businessProfile && (
            <>
              <div className="xl:col-span-2 rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/35">Business OS Status</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      {osStats?.osVerdict?.label && (
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${verdictTone(osStats.osVerdict.status)}`}>
                          {osStats.osVerdict.label}
                        </span>
                      )}
                      <span className="text-sm font-black text-white">{osStats?.effectiveSystemScore ?? 0}/100</span>
                      {(osStats?.unsyncedSystems?.length ?? 0) > 0 && (
                        <span className="text-xs text-amber-200/80">{osStats?.unsyncedSystems?.length} unsynced systems</span>
                      )}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-white/58">
                      {osStats?.osVerdict?.reason ||
                        "The lead workspace is reading the same Business OS health layer as Home, Copilot, My System, Campaigns, and Emails."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {(osStats?.unsyncedSystems?.length ?? 0) > 0 && (
                      <button
                        onClick={() => void syncBusinessSystem()}
                        disabled={syncingSystem}
                        className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-5 py-3 text-sm font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {syncingSystem ? "Syncing..." : "Sync My System"}
                      </button>
                    )}
                    {osStats?.osVerdict?.status === "stale" && (
                      <button
                        onClick={() => void refreshBusinessSystem()}
                        disabled={refreshingRecommendations}
                        className="inline-flex items-center gap-2 rounded-2xl border border-[#f5a623]/20 bg-[#f5a623]/10 px-5 py-3 text-sm font-bold text-[#f5f0e8] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {refreshingRecommendations ? "Refreshing..." : "Refresh Recommendations"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <DatabaseFallbackNotice visible={osStats?.databaseUnavailable} className="xl:col-span-2" />

              <div className="xl:col-span-2 rounded-[28px] border border-[#f5a623]/20 bg-gradient-to-br from-[#f5a623]/[0.08] to-emerald-500/[0.03] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#f5a623]/70">Recommended Lead Engine Move</p>
                    <h2 className="mt-2 text-2xl font-black text-white">
                      Search {businessProfile.niche || "your niche"} in {businessProfile.location || "your best market"}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-white/62">
                      {businessProfile.recommendedSystems?.firstAction ||
                        businessProfile.recommendedSystems?.strategicSummary ||
                        `Your Business OS says lead generation should be one of the next systems you activate for your ${businessProfile.businessType.replace(/_/g, " ")} business.`}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        if (businessProfile.niche) setNiche(businessProfile.niche);
                        if (businessProfile.location) setLocation(businessProfile.location);
                        void runSearch();
                      }}
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-[#f5a623] px-5 py-3 text-sm font-black text-white shadow-[0_0_30px_rgba(16,185,129,0.22)]"
                    >
                      <Search className="h-4 w-4" />
                      Run Recommended Search
                    </button>
                    <Link
                      href="/my-system"
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/70"
                    >
                      <Sparkles className="h-4 w-4" />
                      Open My System
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="rounded-[28px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#f5a623]/80">Find Businesses</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-white">Spin up a fresh lead batch</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/45">
              Search a niche and market, then let the engine turn raw businesses into scored opportunities you can analyze and convert.
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {([
                ["core", "Core", "Strong local lead research and launch-ready outreach assets."],
                ["elite", "Elite", "Sharper operator-grade diagnosis, stronger offers, and better outreach framing."],
              ] as const).map(([value, label, description]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setExecutionTier(value)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    executionTier === value
                      ? "border-[#f5a623]/25 bg-[#f5a623]/10 text-[#f5f0e8]"
                      : "border-white/[0.08] bg-white/[0.03] text-white/60 hover:border-[#f5a623]/20 hover:bg-[#f5a623]/[0.05]"
                  }`}
                >
                  <p className="text-sm font-black">{label}</p>
                  <p className="mt-1 text-xs leading-5 text-inherit/75">{description}</p>
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-[1fr,1fr,auto]">
              <input
                type="text"
                value={niche}
                onChange={(event) => setNiche(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && void runSearch()}
                placeholder="Niche: roofers, med spas, dentists"
                className="rounded-2xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[#f5a623]/40 focus:outline-none"
              />
              <input
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && void runSearch()}
                placeholder="Location: Miami FL, Austin TX"
                className="rounded-2xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[#f5a623]/40 focus:outline-none"
              />
              <button
                onClick={() => void runSearch()}
                disabled={!niche.trim() || !location.trim() || searching}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-[#f5a623] px-5 py-3 text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {searching ? "Searching" : "Find Businesses"}
              </button>
            </div>

            {searchResult && (
              <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                searchResult.isDemo
                  ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
                  : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
              }`}>
                <div className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    {searchResult.isDemo
                      ? `Demo mode is active. ${searchResult.created} sample leads were created. Add a SerpAPI key in your env when you want live business search.`
                      : `Search completed. ${searchResult.found} businesses were found and ${searchResult.created} new leads were added to the pipeline.`}
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/30">Workflow</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-white">Keep the engine moving</h2>
            <div className="mt-5 space-y-3">
              {[
                { label: "Source and review raw businesses", value: `${newCount} waiting`, tone: "text-white" },
                { label: "Analyze the strongest opportunities", value: `${analyzedCount} scored`, tone: "text-blue-300" },
                { label: "Generate assets and offers", value: `${readyCount} ready`, tone: "text-emerald-300" },
                { label: "Push outreach and follow-up", value: `${sentCount} in motion`, tone: "text-[#f5a623]" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/[0.07] bg-black/20 px-4 py-3">
                  <p className="text-sm font-bold text-white/65">{item.label}</p>
                  <p className={`mt-1 text-lg font-black ${item.tone}`}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {newCount > 0 && (
                <button
                  onClick={() => void processAll("analyze")}
                  className="inline-flex items-center gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-2.5 text-sm font-black text-blue-200 transition hover:bg-blue-500/20"
                >
                  <Search className="h-4 w-4" />
                  Analyze All
                </button>
              )}
              {analyzedCount > 0 && (
                <button
                  onClick={() => void processAll("generate")}
                  className="inline-flex items-center gap-2 rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-2.5 text-sm font-black text-violet-200 transition hover:bg-violet-500/20"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate All
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="mb-6">
          <SectionLabel>Pipeline View</SectionLabel>

          <div className="rounded-[28px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <input
                  type="text"
                  value={leadQuery}
                  onChange={(event) => setLeadQuery(event.target.value)}
                  placeholder="Search leads by name, niche, city, address, or website"
                  className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[#f5a623]/40 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterNiche("all")}
                  className={`rounded-2xl border px-4 py-2.5 text-sm font-bold capitalize transition ${
                    filterNiche === "all"
                      ? "border-[#f5a623]/20 bg-[#f5a623]/10 text-[#f5a623]"
                      : "border-white/[0.08] bg-white/[0.03] text-white/50 hover:text-white/75"
                  }`}
                >
                  All Niches
                </button>
                {niches.map((item) => (
                  <button
                    key={item}
                    onClick={() => setFilterNiche(item)}
                    className={`rounded-2xl border px-4 py-2.5 text-sm font-bold capitalize transition ${
                      filterNiche === item
                        ? "border-[#f5a623]/20 bg-[#f5a623]/10 text-[#f5a623]"
                        : "border-white/[0.08] bg-white/[0.03] text-white/50 hover:text-white/75"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {loadingLeads ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-white/20" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-white/[0.1] bg-white/[0.02] px-6 py-20 text-center">
            <Building2 className="mx-auto h-12 w-12 text-white/15" />
            <h3 className="mt-4 text-xl font-black tracking-tight text-white">Your lead workspace is empty</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/40">
              Leads are created when you scan businesses through Himalaya or add them manually. Start with Himalaya to auto-generate leads from your niche.
            </p>
            <Link href="/himalaya" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-white text-sm font-bold hover:opacity-90 transition">
              <Sparkles className="w-4 h-4" /> Find Leads with Himalaya
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                isProcessing={processingIds.has(lead.id)}
                onProcess={(id, action) => void processLead(id, action)}
              />
            ))}
          </div>
        )}
      </WorkspaceShell>
    </main>
  );
}
