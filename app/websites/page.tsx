"use client";

import { useState, useEffect } from "react";
import { Plus, Globe, Loader2, Settings, ExternalLink, Sparkles, Copy, Check, BotMessageSquare, Radar, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import DatabaseFallbackNotice from "@/components/DatabaseFallbackNotice";
import { WorkspaceHero, WorkspaceShell } from "@/components/ui/WorkspaceShell";

interface Site {
    id: string;
    name: string;
    slug: string;
    published: boolean;
    totalViews: number;
}

interface BusinessProfileSummary {
    businessType: string;
    businessName: string | null;
    niche: string | null;
    location: string | null;
    website: string | null;
    mainGoal: string | null;
    activeSystems?: string[];
    recommendedSystems?: {
        firstAction?: string;
        strategicSummary?: string;
    } | null;
}

interface StatsSummary {
    effectiveSystemScore?: number;
    unsyncedSystems?: string[];
    databaseUnavailable?: boolean;
    osVerdict?: {
        status?: string;
        label?: string;
        reason?: string;
    };
}

type ScanResult = {
    site: {
        id: string;
        name: string;
        slug: string;
        published: boolean;
    };
    summary: string;
    source: {
        url: string;
        title: string;
        headings: string[];
        ctas: string[];
        mode: "clone" | "improve";
        niche: string;
    };
};

function verdictTone(status?: string) {
    if (status === "healthy") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
    if (status === "stale") return "border-cyan-500/20 bg-cyan-500/10 text-cyan-100";
    return "border-amber-500/20 bg-amber-500/10 text-amber-100";
}

export default function WebsitesDashboard() {
    const router = useRouter();
    const [sites, setSites] = useState<Site[]>([]);
    const [businessProfile, setBusinessProfile] = useState<BusinessProfileSummary | null>(null);
    const [osStats, setOsStats] = useState<StatsSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [scanUrl, setScanUrl] = useState("");
    const [scanSiteName, setScanSiteName] = useState("");
    const [scanNiche, setScanNiche] = useState("");
    const [scanNotes, setScanNotes] = useState("");
    const [scanMode, setScanMode] = useState<"clone" | "improve">("improve");
    const [scanLoading, setScanLoading] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [syncingSystem, setSyncingSystem] = useState(false);
    const [refreshingRecommendations, setRefreshingRecommendations] = useState(false);

    function copyUrl(e: React.MouseEvent, siteId: string, slug: string) {
        e.preventDefault();
        void navigator.clipboard.writeText(`https://${slug}.kwanus.co`);
        setCopiedId(siteId);
        setTimeout(() => setCopiedId(null), 2000);
    }

    useEffect(() => {
        async function fetchSites() {
            try {
                const [sitesRes, profileRes, statsRes] = await Promise.all([
                    fetch("/api/sites"),
                    fetch("/api/business-profile"),
                    fetch("/api/stats"),
                ]);
                const data = await sitesRes.json() as { ok: boolean; sites?: Site[] };
                const profileData = await profileRes.json() as { ok: boolean; profile?: BusinessProfileSummary | null };
                const statsData = await statsRes.json() as { ok: boolean; stats?: StatsSummary | null };
                if (data.ok && data.sites) setSites(data.sites);
                if (profileData.ok && profileData.profile) {
                    setBusinessProfile(profileData.profile);
                    if (!scanNiche && profileData.profile.niche) setScanNiche(profileData.profile.niche);
                    if (!scanSiteName && profileData.profile.businessName) setScanSiteName(profileData.profile.businessName);
                    if (!scanUrl && profileData.profile.website) setScanUrl(profileData.profile.website);
                }
                if (statsData.ok) {
                    setOsStats(statsData.stats ?? null);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        void fetchSites();
    }, [scanNiche, scanSiteName, scanUrl]);

    async function refreshSites() {
        try {
            const [sitesRes, profileRes, statsRes] = await Promise.all([
                fetch("/api/sites"),
                fetch("/api/business-profile"),
                fetch("/api/stats"),
            ]);
            const siteData = await sitesRes.json() as { ok: boolean; sites?: Site[] };
            const profileData = await profileRes.json() as { ok: boolean; profile?: BusinessProfileSummary | null };
            const statsData = await statsRes.json() as { ok: boolean; stats?: StatsSummary | null };
            if (siteData.ok && siteData.sites) setSites(siteData.sites);
            if (profileData.ok) setBusinessProfile(profileData.profile ?? null);
            if (statsData.ok) setOsStats(statsData.stats ?? null);
        } catch (err) {
            console.error(err);
        }
    }

    async function runScanMode() {
        if (!scanUrl.trim() || scanLoading) return;

        setScanLoading(true);
        setScanError(null);
        setScanResult(null);

        try {
            const res = await fetch("/api/sites/scan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: scanUrl.trim(),
                    siteName: scanSiteName.trim() || undefined,
                    niche: scanNiche.trim() || undefined,
                    notes: scanNotes.trim() || undefined,
                    mode: scanMode,
                    triggerN8n: true,
                }),
            });

            const data = await res.json() as ({ ok: true } & ScanResult) | { ok: false; error?: string };
            if (!res.ok || !data.ok) {
                const message = "error" in data ? data.error : undefined;
                setScanError(message ?? "Site scan failed");
                return;
            }

            setScanResult(data);
            await refreshSites();
        } catch {
            setScanError("Could not reach the scan builder right now.");
        } finally {
            setScanLoading(false);
        }
    }

    async function syncBusinessSystem() {
        try {
            setSyncingSystem(true);
            const res = await fetch("/api/business-profile/sync", { method: "POST" });
            const data = await res.json() as { ok?: boolean };
            if (!res.ok || !data.ok) throw new Error("Failed");
            await refreshSites();
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
            await refreshSites();
        } finally {
            setRefreshingRecommendations(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#020509] font-sans flex flex-col text-white">
            <AppNav />
            <WorkspaceShell maxWidth="max-w-7xl">
                <WorkspaceHero
                    eyebrow="Sites"
                    title="Funnels, Stores, and Published Pages"
                    description="Build, publish, and manage the web layer of your marketing system. Sites here connect directly to your products, forms, and campaign assets."
                    accent="from-violet-300 via-cyan-300 to-emerald-300"
                    actions={(
                        <>
                            <button
                                onClick={() => router.push("/websites/new")}
                                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-black shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_50px_rgba(6,182,212,0.45)] hover:scale-[1.02] transition-all duration-200"
                            >
                                <Plus className="w-4 h-4" />
                                Create New Site
                            </button>
                            <button
                                onClick={() => {
                                    const el = document.getElementById("site-scan-mode");
                                    el?.scrollIntoView({ behavior: "smooth", block: "start" });
                                }}
                                className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] text-white/75 text-sm font-bold hover:bg-white/[0.07] transition-all duration-200"
                            >
                                <Radar className="w-4 h-4" />
                                Open Scan Mode
                            </button>
                        </>
                    )}
                    stats={sites.length > 0 ? [
                        { label: "Total Sites", value: sites.length.toString() },
                        { label: "Published", value: sites.filter(s => s.published).length.toString(), tone: "text-emerald-300" },
                        { label: "Total Views", value: sites.reduce((a, s) => a + (s.totalViews || 0), 0).toLocaleString() },
                    ] : undefined}
                />

                {businessProfile && (
                    <>
                        <section className="mb-6 rounded-[30px] border border-white/[0.08] bg-white/[0.03] p-5">
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
                                            "The sites workspace is reading the same Business OS health layer as Home, Copilot, My System, Campaigns, and Emails."}
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
                        </section>

                        <DatabaseFallbackNotice visible={osStats?.databaseUnavailable} className="mb-6" />

                        <section className="mb-6 rounded-[30px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.08] to-violet-500/[0.03] p-6">
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                <div className="max-w-3xl">
                                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200/70">Recommended Next Site Move</p>
                                    <h2 className="mt-2 text-2xl font-black text-white">
                                        {businessProfile.website ? "Scan and improve your current site" : "Generate your core conversion site"}
                                    </h2>
                                    <p className="mt-3 text-sm leading-7 text-white/62">
                                        {businessProfile.recommendedSystems?.firstAction ||
                                            businessProfile.recommendedSystems?.strategicSummary ||
                                            `Your Business OS says the website system should be one of the next things you activate for your ${businessProfile.niche || businessProfile.businessType.replace(/_/g, " ")} business.`}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    {businessProfile.website ? (
                                        <button
                                            onClick={() => {
                                                setScanMode("improve");
                                                if (businessProfile.website) setScanUrl(businessProfile.website);
                                                const el = document.getElementById("site-scan-mode");
                                                el?.scrollIntoView({ behavior: "smooth", block: "start" });
                                            }}
                                            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-black text-white shadow-[0_0_30px_rgba(6,182,212,0.22)]"
                                        >
                                            <Radar className="h-4 w-4" />
                                            Improve Existing Site
                                        </button>
                                    ) : (
                                        <Link
                                            href="/websites/new"
                                            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-black text-white shadow-[0_0_30px_rgba(6,182,212,0.22)]"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Build New Site
                                        </Link>
                                    )}
                                    <Link
                                        href="/my-system"
                                        className="flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/70"
                                    >
                                        <Sparkles className="h-4 w-4" />
                                        Open My System
                                    </Link>
                                </div>
                            </div>
                        </section>
                    </>
                )}

                <section id="site-scan-mode" className="mb-8 grid gap-4 xl:grid-cols-[1.45fr,0.95fr]">
                    <div className="rounded-[30px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300/80">Scan Mode</p>
                                <h2 className="mt-3 text-2xl font-black tracking-tight text-white">Clone any site or build the better version</h2>
                                <p className="mt-2 max-w-2xl text-sm leading-7 text-white/45">
                                    Drop in any live URL and the Sites engine will scan the structure, messaging, CTAs, and on-page cues, then generate a ready-to-edit draft in your workspace.
                                </p>
                            </div>
                            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 sm:flex">
                                <Radar className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="mt-6 grid gap-3 md:grid-cols-2">
                            <input
                                type="text"
                                value={scanUrl}
                                onChange={(e) => setScanUrl(e.target.value)}
                                placeholder="Reference URL: https://competitor.com"
                                className="rounded-2xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-cyan-400/40 focus:outline-none md:col-span-2"
                            />
                            <input
                                type="text"
                                value={scanSiteName}
                                onChange={(e) => setScanSiteName(e.target.value)}
                                placeholder="Draft site name (optional)"
                                className="rounded-2xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-cyan-400/40 focus:outline-none"
                            />
                            <input
                                type="text"
                                value={scanNiche}
                                onChange={(e) => setScanNiche(e.target.value)}
                                placeholder="Niche: med spa, roofer, law firm"
                                className="rounded-2xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-cyan-400/40 focus:outline-none"
                            />
                            <textarea
                                value={scanNotes}
                                onChange={(e) => setScanNotes(e.target.value)}
                                placeholder="Optional notes: keep the offer, improve the hero, add stronger proof, tailor to local SEO..."
                                rows={4}
                                className="rounded-2xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-cyan-400/40 focus:outline-none md:col-span-2"
                            />
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                            {[
                                {
                                    value: "improve" as const,
                                    label: "Improve It",
                                    sub: "Use the source as intelligence, then build the higher-performing version.",
                                },
                                {
                                    value: "clone" as const,
                                    label: "Clone Structure",
                                    sub: "Mirror the original flow and messaging shape inside your builder.",
                                },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setScanMode(option.value)}
                                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                                        scanMode === option.value
                                            ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-100"
                                            : "border-white/[0.08] bg-white/[0.03] text-white/55 hover:text-white/75"
                                    }`}
                                >
                                    <p className="text-sm font-black">{option.label}</p>
                                    <p className="mt-1 max-w-sm text-xs leading-5 text-inherit/80">{option.sub}</p>
                                </button>
                            ))}
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-3">
                            <button
                                onClick={() => void runScanMode()}
                                disabled={!scanUrl.trim() || scanLoading}
                                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-3 text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {scanLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                                {scanLoading ? "Scanning and Building..." : "Scan and Generate Site"}
                            </button>

                            <Link
                                href="/skills"
                                className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/70 transition hover:bg-white/[0.07]"
                            >
                                <BotMessageSquare className="h-4 w-4" />
                                Open Skills
                            </Link>
                        </div>

                        {scanError && (
                            <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                {scanError}
                            </div>
                        )}

                        {scanResult && (
                            <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200/80">Draft Created</p>
                                <h3 className="mt-2 text-lg font-black text-white">{scanResult.site.name}</h3>
                                <p className="mt-2 text-sm leading-6 text-emerald-100/90">{scanResult.summary}</p>
                                <div className="mt-3 flex flex-wrap gap-2 text-xs text-emerald-100/80">
                                    <span className="rounded-full border border-emerald-300/20 px-3 py-1">{scanResult.source.mode === "clone" ? "Clone Structure" : "Improve It"}</span>
                                    <span className="rounded-full border border-emerald-300/20 px-3 py-1">{scanResult.source.niche}</span>
                                    <span className="rounded-full border border-emerald-300/20 px-3 py-1">{scanResult.source.headings.length} headings captured</span>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <Link
                                        href={`/websites/${scanResult.site.id}`}
                                        className="rounded-2xl bg-white text-emerald-900 px-4 py-2.5 text-sm font-black"
                                    >
                                        Open Site Workspace
                                    </Link>
                                    <a
                                        href={`/s/${scanResult.site.slug}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-2xl border border-emerald-300/20 px-4 py-2.5 text-sm font-bold text-emerald-50"
                                    >
                                        Preview Draft
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="rounded-[30px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/30">How It Works</p>
                        <h2 className="mt-3 text-2xl font-black tracking-tight text-white">Built for niche-fit rebuilds</h2>

                        <div className="mt-5 space-y-3">
                            {[
                                "Scans the reference site for headings, CTAs, body copy, and on-page cues.",
                                "Generates a draft site in your Sites workspace instead of leaving you with raw analysis.",
                                "Supports clone mode for structure matching and improve mode for stronger conversion design.",
                                "Triggers n8n after generation when your external webhook is configured.",
                            ].map((line, index) => (
                                <div key={line} className="rounded-2xl border border-white/[0.07] bg-black/20 px-4 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/70">Step {index + 1}</p>
                                    <p className="mt-2 text-sm leading-6 text-white/60">{line}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-4">
                            <p className="text-sm font-black text-white">Best use case right now</p>
                            <p className="mt-2 text-sm leading-6 text-white/50">
                                Use this for competitor teardowns, client redesign drafts, or niche-specific site cloning when you want a fast starting point that you can keep editing.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Loading */}
                {loading && (
                    <div className="py-32 flex flex-col items-center gap-4 text-white/20">
                        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                        <span className="text-sm font-semibold">Loading your sites...</span>
                    </div>
                )}

                {/* Empty state */}
                {!loading && sites.length === 0 && (
                    <div className="mt-8 relative overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-purple-500/[0.05] to-transparent p-16 flex flex-col items-center text-center">
                        <div className="absolute inset-0 opacity-[0.015]"
                            style={{ backgroundImage: "radial-gradient(circle, #8b5cf6 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

                        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/[0.07] flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(139,92,246,0.15)]">
                            <Globe className="w-10 h-10 text-purple-400/60" />
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center">
                                <Sparkles className="w-3 h-3 text-white" />
                            </div>
                        </div>

                        <h2 className="text-2xl font-black text-white mb-2">Start with a Golden Funnel</h2>
                        <p className="text-sm text-white/40 max-w-sm mb-3 leading-relaxed">
                            Every new site is automatically built with a 10-block, high-converting funnel baseline — hero, testimonials, pricing, checkout, and more.
                        </p>
                        <p className="text-xs text-white/25 max-w-xs mb-10 leading-relaxed">
                            Run an AI scan first and your funnel copy will be auto-generated from the market research.
                        </p>

                        <div className="flex flex-wrap gap-3 justify-center">
                            <button
                                onClick={() => router.push("/websites/new")}
                                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-black shadow-[0_0_30px_rgba(6,182,212,0.25)] hover:scale-[1.02] transition-all"
                            >
                                <Sparkles className="w-4 h-4" />
                                Build My First Funnel
                            </button>
                            <Link href="/analyze"
                                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white/70 hover:text-white text-sm font-black transition">
                                Scan a Market First →
                            </Link>
                        </div>
                    </div>
                )}

                {/* Sites grid */}
                {!loading && sites.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-16">
                        {sites.map(site => (
                            <div key={site.id}
                                className="group relative border border-white/[0.07] bg-[#050a14] hover:border-purple-500/30 transition-all duration-300 rounded-3xl flex flex-col overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:shadow-[0_0_40px_rgba(139,92,246,0.08)]">

                                {/* Preview area */}
                                <div className="relative h-36 bg-gradient-to-br from-white/[0.025] to-transparent border-b border-white/[0.05] flex items-center justify-center overflow-hidden">
                                    <div className="absolute inset-0 opacity-[0.02]"
                                        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                                    <Globe className="w-14 h-14 text-white/[0.04] group-hover:text-purple-500/20 transition duration-500 group-hover:scale-110" />

                                    {/* Glow on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-purple-500/[0.0] to-transparent group-hover:from-purple-500/[0.04] transition-all duration-500" />

                                    {/* Status badge */}
                                    <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                    ${site.published
                                            ? "bg-green-500/20 border border-green-500/30 text-green-400"
                                            : "bg-white/5 border border-white/10 text-white/40"}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${site.published ? "bg-green-400 animate-pulse" : "bg-white/30"}`} />
                                        {site.published ? "Live" : "Draft"}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-base font-black text-white tracking-tight truncate mb-1 group-hover:text-purple-300 transition">{site.name}</h3>
                                    <div className="flex items-center gap-1.5">
                                        <a href={`/s/${site.slug}`} target="_blank" rel="noreferrer"
                                            className="text-xs text-cyan-400/60 hover:text-cyan-300 flex items-center gap-1 transition">
                                            {site.slug}.kwanus.co <ExternalLink className="w-3 h-3" />
                                        </a>
                                        <button
                                            onClick={(e) => copyUrl(e, site.id, site.slug)}
                                            className="p-1 rounded hover:bg-white/[0.06] text-white/20 hover:text-white/50 transition"
                                            title="Copy URL"
                                        >
                                            {copiedId === site.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                    </div>

                                    <div className="mt-auto pt-5 flex items-center justify-between border-t border-white/[0.05]">
                                        <div className="text-xs font-semibold text-white/30">
                                            <span className="text-white/70 font-black text-base">{site.totalViews.toLocaleString()}</span>{" "}
                                            <span className="text-white/25">views</span>
                                        </div>

                                        <div className="flex gap-2">
                                            <Link href={`/websites/${site.id}`}
                                                className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.06] text-white/40 hover:text-white transition">
                                                <Settings className="w-4 h-4" />
                                            </Link>
                                            <Link href={`/websites/${site.id}/editor`}
                                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/10 border border-purple-500/20 hover:border-purple-500/40 text-purple-300 text-xs font-black transition">
                                                Edit Site
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Add new site card */}
                        <button onClick={() => router.push("/websites/new")}
                            className="group border-2 border-dashed border-white/[0.07] hover:border-purple-500/30 rounded-3xl flex flex-col items-center justify-center gap-3 py-12 text-center transition-all duration-300 hover:bg-purple-500/[0.03]">
                            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.07] group-hover:bg-purple-500/10 group-hover:border-purple-500/20 flex items-center justify-center transition-all duration-300">
                                <Plus className="w-5 h-5 text-white/30 group-hover:text-purple-400 transition" />
                            </div>
                            <p className="text-sm font-bold text-white/25 group-hover:text-white/50 transition">New Site</p>
                        </button>
                    </div>
                )}
            </WorkspaceShell>
        </div>
    );
}
