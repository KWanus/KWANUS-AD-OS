"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import CampaignSubNav from "@/components/BuildSubNav";
import DatabaseFallbackNotice from "@/components/DatabaseFallbackNotice";
import { WorkspaceHero, WorkspaceShell } from "@/components/ui/WorkspaceShell";
import { Search, Plus, Trash2, ArrowRight, BarChart2, Mail, CheckSquare, Clock, Zap, Copy } from "lucide-react";

type Campaign = {
  id: string;
  name: string;
  mode: string;
  status: string;
  productName: string | null;
  productUrl: string | null;
  createdAt: string;
  workflowState?: {
    executionTier?: "core" | "elite";
  } | null;
  _count: { adVariations: number; emailDrafts: number; checklistItems: number };
};

type BusinessProfileSummary = {
  businessType: string;
  businessName: string | null;
  niche: string | null;
  mainGoal: string | null;
  activeSystems: string[];
  recommendedSystems?: {
    firstAction?: string;
    strategicSummary?: string;
    prioritizedSystems?: Array<{ slug: string; priority: string; personalizedReason?: string }>;
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

const STATUS_STYLES: Record<string, { border: string; text: string; bg: string; dot: string; glow: string }> = {
  draft: { border: "border-white/10", text: "text-white/40", bg: "bg-white/5", dot: "bg-white/30", glow: "" },
  active: { border: "border-cyan-500/40", text: "text-cyan-400", bg: "bg-cyan-500/10", dot: "bg-cyan-400", glow: "shadow-[0_0_6px_rgba(6,182,212,0.4)]" },
  testing: { border: "border-yellow-500/40", text: "text-yellow-400", bg: "bg-yellow-500/10", dot: "bg-yellow-400", glow: "shadow-[0_0_6px_rgba(234,179,8,0.4)]" },
  scaling: { border: "border-green-500/40", text: "text-green-400", bg: "bg-green-500/10", dot: "bg-green-400", glow: "shadow-[0_0_6px_rgba(34,197,94,0.4)]" },
  dead: { border: "border-red-500/30", text: "text-red-400/60", bg: "bg-red-500/5", dot: "bg-red-500/60", glow: "" },
};

const MODE_ICONS: Record<string, string> = {
  operator: "🛒",
  consultant: "💼",
  saas: "💻",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Not launched yet — assets saved, nothing live",
  active: "Running — ads or emails are live right now",
  testing: "A/B testing — comparing hooks or audiences",
  scaling: "Profitable — increasing budget to scale",
  dead: "Paused or shut down — no longer running",
};

function verdictTone(status?: string) {
  if (status === "healthy") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  if (status === "stale") return "border-cyan-500/20 bg-cyan-500/10 text-cyan-100";
  return "border-amber-500/20 bg-amber-500/10 text-amber-100";
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileSummary | null>(null);
  const [osStats, setOsStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [syncingSystem, setSyncingSystem] = useState(false);
  const [refreshingRecommendations, setRefreshingRecommendations] = useState(false);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch("/api/campaigns").then((r) => r.json() as Promise<{ ok: boolean; campaigns?: Campaign[] }>),
      fetch("/api/business-profile").then((r) => r.json() as Promise<{ ok: boolean; profile?: BusinessProfileSummary | null }>),
      fetch("/api/stats").then((r) => r.json() as Promise<{ ok: boolean; stats?: StatsSummary | null }>),
    ])
      .then(([campaignData, profileData, statsData]) => {
        if (campaignData.ok && campaignData.campaigns) setCampaigns(campaignData.campaigns);
        if (profileData.ok && profileData.profile) setBusinessProfile(profileData.profile);
        if (statsData.ok && statsData.stats) setOsStats(statsData.stats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function syncBusinessSystem() {
    try {
      setSyncingSystem(true);
      const res = await fetch("/api/business-profile/sync", { method: "POST" });
      const data = await res.json() as { ok?: boolean };
      if (!res.ok || !data.ok) throw new Error("Failed");
      const [profileRes, statsRes] = await Promise.all([fetch("/api/business-profile"), fetch("/api/stats")]);
      const profileData = await profileRes.json() as { ok: boolean; profile?: BusinessProfileSummary | null };
      const statsData = await statsRes.json() as { ok: boolean; stats?: StatsSummary | null };
      if (profileData.ok) setBusinessProfile(profileData.profile ?? null);
      if (statsData.ok) setOsStats(statsData.stats ?? null);
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
      const [profileRes, statsRes] = await Promise.all([fetch("/api/business-profile"), fetch("/api/stats")]);
      const profileData = await profileRes.json() as { ok: boolean; profile?: BusinessProfileSummary | null };
      const statsData = await statsRes.json() as { ok: boolean; stats?: StatsSummary | null };
      if (profileData.ok) setBusinessProfile(profileData.profile ?? null);
      if (statsData.ok) setOsStats(statsData.stats ?? null);
    } finally {
      setRefreshingRecommendations(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    setDeleteConfirm(null);
  }

  const filtered = campaigns.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.productName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const totalAds = campaigns.reduce((acc, c) => acc + c._count.adVariations, 0);
  const totalEmails = campaigns.reduce((acc, c) => acc + c._count.emailDrafts, 0);
  const recommendedCampaignSlug =
    businessProfile?.recommendedSystems?.prioritizedSystems?.find((system) =>
      ["google_ads", "facebook_ads", "tiktok_ads", "website"].includes(system.slug)
    )?.slug ?? null;
  const recommendedTypeParam =
    recommendedCampaignSlug === "google_ads"
      ? "google"
      : recommendedCampaignSlug === "facebook_ads"
        ? "facebook"
        : recommendedCampaignSlug === "tiktok_ads"
          ? "tiktok"
          : null;
  const recommendedLabel =
    recommendedCampaignSlug === "google_ads"
      ? "Google Search Campaign"
      : recommendedCampaignSlug === "facebook_ads"
        ? "Facebook / Instagram Campaign"
        : recommendedCampaignSlug === "tiktok_ads"
          ? "TikTok Campaign"
          : "Campaign Workspace";

  return (
    <div className="min-h-screen bg-[#020509] text-white flex flex-col">
      <AppNav />
      <CampaignSubNav />
      <WorkspaceShell>
        <WorkspaceHero
          eyebrow="Campaigns"
          title="Campaign Workspaces"
          description={campaigns.length > 0
            ? `${campaigns.length} workspace${campaigns.length !== 1 ? "s" : ""} tracking hooks, landing copy, emails, and launch actions in one place.`
            : "Analyze a product or offer to generate your first full campaign package, then refine it here."}
          actions={(
            <Link href="/analyze"
              className="shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-black shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_50px_rgba(6,182,212,0.45)] hover:scale-[1.02] transition-all duration-200">
              <Zap className="w-4 h-4" /> New Scan
            </Link>
          )}
          stats={campaigns.length > 0 ? [
            { label: "Campaigns", value: campaigns.length.toString() },
            { label: "Ad Variations", value: totalAds.toString(), tone: "text-cyan-300" },
            { label: "Email Drafts", value: totalEmails.toString(), tone: "text-blue-300" },
            { label: "Active", value: campaigns.filter(c => c.status === "active" || c.status === "scaling").length.toString(), tone: "text-emerald-300" },
          ] : undefined}
        />

        {campaigns.length > 0 && (
          <div className="mb-6 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search campaigns..."
                className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-cyan-500/40 transition placeholder-white/20 font-medium"
              />
            </div>
          </div>
        )}

        {businessProfile && (
          <div className="mb-6 rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
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
                    "The campaign workspace is reading the same Business OS health layer as Home, Copilot, and My System."}
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
                    className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-5 py-3 text-sm font-bold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {refreshingRecommendations ? "Refreshing..." : "Refresh Recommendations"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <DatabaseFallbackNotice visible={osStats?.databaseUnavailable} className="mb-6" />

        {businessProfile && (
          <div className="mb-6 rounded-[28px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.08] to-blue-500/[0.03] p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-cyan-200/70">Recommended Next Campaign</p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  {recommendedLabel} for {businessProfile.niche || businessProfile.businessType.replace(/_/g, " ")}
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/62">
                  {businessProfile.recommendedSystems?.firstAction ||
                    businessProfile.recommendedSystems?.strategicSummary ||
                    `Your Business OS says the next best move is to launch the campaign system that matches your ${businessProfile.mainGoal?.replace(/_/g, " ") || "growth"} goal.`}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={recommendedTypeParam ? `/campaigns/new?type=${recommendedTypeParam}` : "/analyze"}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-black text-white shadow-[0_0_30px_rgba(6,182,212,0.22)]"
                >
                  <Zap className="w-4 h-4" />
                  Start Recommended Campaign
                </Link>
                <Link
                  href="/my-system"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/70"
                >
                  Open My System
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-8 h-8 border-2 border-white/10 border-t-cyan-500 rounded-full animate-spin" />
            <span className="text-sm text-white/25 font-semibold">Loading campaigns...</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && campaigns.length === 0 && (
          <div className="mt-8 relative rounded-3xl border border-white/[0.06] bg-gradient-to-br from-cyan-500/[0.04] to-purple-500/[0.02] p-20 flex flex-col items-center text-center overflow-hidden">
            <div className="absolute inset-0 opacity-[0.013]"
              style={{ backgroundImage: "radial-gradient(circle, #06b6d4 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/[0.07] flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(6,182,212,0.15)]">
              <BarChart2 className="w-10 h-10 text-cyan-400/50" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">No campaigns yet</h2>
            <p className="text-sm text-white/35 max-w-sm mb-10 leading-relaxed">
              Paste a product or competitor URL into the Copilot. In seconds, you'll get a full ad package — hooks, briefs, scripts, landing page copy, and email sequences.
            </p>
            <Link href="/analyze"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-black shadow-[0_0_30px_rgba(6,182,212,0.25)] hover:scale-[1.02] transition-all">
              <Zap className="w-4 h-4" />
              Analyze Your First Market →
            </Link>
          </div>
        )}

        {/* No results */}
        {!loading && campaigns.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16 text-white/20 text-sm font-semibold">No campaigns match &ldquo;{search}&rdquo;</div>
        )}

        {/* Campaign cards */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-3 pb-16">
            {filtered.map((c) => {
              const s = STATUS_STYLES[c.status] ?? STATUS_STYLES.draft;
              const executionTier = c.workflowState?.executionTier === "core" ? "core" : "elite";
              return (
                <div key={c.id}
                  onClick={() => router.push(`/campaigns/${c.id}`)}
                  className={`group relative rounded-2xl border ${s.border} bg-white/[0.02] hover:bg-white/[0.04] p-5 cursor-pointer transition-all duration-200 flex items-center gap-4 overflow-hidden`}
                >
                  {/* Subtle left accent */}
                  <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${s.dot} opacity-60`} />

                  {/* Mode icon */}
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-xl">
                    {MODE_ICONS[c.mode] ?? "📊"}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <div
                        title={STATUS_LABELS[c.status]}
                        className={`flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border font-black uppercase tracking-wider cursor-help ${s.border} ${s.text} ${s.bg}`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${s.dot} ${s.glow}`} />
                        {c.status}
                      </div>
                      <span className="text-[10px] text-white/20 font-medium">
                        {c.mode === "operator" ? "E-Commerce" : c.mode === "consultant" ? "Consultant" : "SaaS"}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] ${
                          executionTier === "elite"
                            ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-300"
                            : "border-white/10 bg-white/5 text-white/45"
                        }`}
                      >
                        {executionTier}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition truncate leading-snug">{c.name}</h3>
                    {c.productName && <p className="text-xs text-white/25 mt-0.5 truncate">{c.productName}</p>}
                    <p className="mt-1 text-[11px] text-white/30">
                      {executionTier === "elite"
                        ? "Premium execution lane: sharper hooks, deeper proof, stronger objection handling."
                        : "Core execution lane: strong operator-ready assets with lighter structure."}
                    </p>
                  </div>

                  {/* Asset counts */}
                  <div className="shrink-0 flex items-center gap-5 text-white/25">
                    <div className="flex flex-col items-center gap-0.5">
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">{c._count.adVariations}</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">{c._count.emailDrafts}</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">{c._count.checklistItems}</span>
                    </div>
                    <div className="flex items-center gap-1 text-white/15">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px] font-semibold">
                        {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    {deleteConfirm === c.id ? (
                      <>
                        <button
                          onClick={(e) => void handleDelete(e, c.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-black hover:bg-red-500/30 transition"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.07] text-white/40 text-xs font-semibold hover:text-white transition"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            try {
                              const res = await fetch(`/api/campaigns/${c.id}/clone`, { method: "POST" });
                              const data = await res.json() as { ok: boolean; campaign?: { id: string } };
                              if (data.ok && data.campaign) {
                                router.push(`/campaigns/${data.campaign.id}`);
                              }
                            } catch { /* non-fatal */ }
                          }}
                          className="p-2 rounded-lg hover:bg-cyan-500/10 text-white/20 hover:text-cyan-400 transition opacity-0 group-hover:opacity-100"
                          title="Duplicate campaign"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(c.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center">
                          <ArrowRight className="w-4 h-4 text-cyan-400/60" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </WorkspaceShell>
    </div>
  );
}
