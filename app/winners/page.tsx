"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
    Search, Filter,
    BarChart3, Edit3, Loader2,
    Flame, Sparkles, ShoppingBag, BadgeDollarSign
} from "lucide-react";
import type { WinnerAd } from "../api/winners/route";

type ExecutionTier = "core" | "elite";
type ResearchMode = "affiliate" | "dropship";

type AffiliateResearch = {
    topNetworks?: Array<{
        network: string;
        avgComm?: string;
        topOffers?: string[];
    }>;
    topNicheAngles?: string[];
    competitionLevel?: string;
    estimatedEpc?: string;
    entryStrategy?: string;
};

type DropshipResearch = {
    marketAnalysis?: string;
    productOpportunities?: Array<{
        name: string;
        winnerScore: number;
        estimatedMargin?: string;
        topAngle?: string;
        bestSupplierPlatform?: string;
    }>;
    trendingNow?: string[];
};

export default function WinnerFinder() {
    const router = useRouter();
    const [winners, setWinners] = useState<WinnerAd[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [projectLoading, setProjectLoading] = useState<string | null>(null);
    const [researchMode, setResearchMode] = useState<ResearchMode>("affiliate");
    const [executionTier, setExecutionTier] = useState<ExecutionTier>("elite");
    const [researching, setResearching] = useState(false);
    const [researchNiche, setResearchNiche] = useState("");
    const [researchBudget, setResearchBudget] = useState("");
    const [researchExtra, setResearchExtra] = useState("");
    const [researchError, setResearchError] = useState<string | null>(null);
    const [affiliateResearch, setAffiliateResearch] = useState<AffiliateResearch | null>(null);
    const [dropshipResearch, setDropshipResearch] = useState<DropshipResearch | null>(null);

    useEffect(() => {
        fetch("/api/winners")
            .then(res => res.json())
            .then(data => {
                if (data.ok) setWinners(data.winners);
                setLoading(false);
            });
    }, []);

    const handleRemix = async (winner: WinnerAd) => {
        setProjectLoading(winner.id);
        try {
            const res = await fetch("/api/projects/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: `Winner: ${winner.title}`,
                    sourceUrl: winner.url,
                    sourceType: "winner",
                    executionTier,
                })
            });
            const data = await res.json();
            if (data.ok) {
                router.push(`/projects/${data.projectId}`);
            }
        } finally {
            setProjectLoading(null);
        }
    };

    const filtered = winners.filter(w =>
        w.title.toLowerCase().includes(search.toLowerCase()) ||
        w.niche.toLowerCase().includes(search.toLowerCase())
    );

    const runResearch = async () => {
        if (!researchNiche.trim() || researching) return;
        setResearching(true);
        setResearchError(null);
        setAffiliateResearch(null);
        setDropshipResearch(null);

        try {
            const endpoint = researchMode === "affiliate"
                ? "/api/affiliate/research"
                : "/api/dropship/products/research";
            const payload = researchMode === "affiliate"
                ? {
                    niche: researchNiche.trim(),
                    budget: researchBudget.trim() || undefined,
                    trafficSource: researchExtra.trim() || undefined,
                    executionTier,
                }
                : {
                    niche: researchNiche.trim(),
                    budget: researchBudget.trim() || undefined,
                    targetMarket: researchExtra.trim() || undefined,
                    executionTier,
                };

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!data.ok) {
                throw new Error(data.error ?? "Research failed");
            }

            if (researchMode === "affiliate") {
                setAffiliateResearch(data.research as AffiliateResearch);
            } else {
                setDropshipResearch(data.research as DropshipResearch);
            }
        } catch (error) {
            setResearchError(error instanceof Error ? error.message : "Research failed");
        } finally {
            setResearching(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#020509] text-white flex flex-col font-inter">
            {/* Subtle background glow */}
            <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

            <AppNav />

            {/* Main Grid */}
            <section className="flex-1 p-8 overflow-y-auto">
                <div className="mb-8 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6">
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                        <div className="max-w-2xl">
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200/70">Research Lab</p>
                            <h2 className="mt-2 text-3xl font-black text-white">Find the next angle worth building around</h2>
                            <p className="mt-3 text-sm leading-7 text-white/45">
                                Run affiliate or dropship research with a clean validation pass in Core, or push for sharper operator-grade market selection in Elite.
                            </p>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 xl:w-[360px]">
                            {([
                                ["core", "Core", "Strong, practical niche validation."],
                                ["elite", "Elite", "Sharper market selection and angle research."],
                            ] as const).map(([value, label, copy]) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setExecutionTier(value)}
                                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                                        executionTier === value
                                            ? "border-cyan-500/25 bg-cyan-500/10 text-cyan-100"
                                            : "border-white/[0.08] bg-white/[0.03] text-white/60 hover:border-cyan-500/20 hover:bg-cyan-500/[0.05]"
                                    }`}
                                >
                                    <p className="text-sm font-black">{label}</p>
                                    <p className="mt-1 text-xs leading-5 text-inherit/75">{copy}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                {([
                                    ["affiliate", "Affiliate Niche Research", <BadgeDollarSign key="a" className="w-4 h-4" />],
                                    ["dropship", "Dropship Product Research", <ShoppingBag key="d" className="w-4 h-4" />],
                                ] as const).map(([value, label, icon]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setResearchMode(value)}
                                        className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-black transition ${
                                            researchMode === value
                                                ? "border-cyan-500/25 bg-cyan-500/10 text-cyan-100"
                                                : "border-white/[0.08] bg-white/[0.03] text-white/55 hover:text-white/75"
                                        }`}
                                    >
                                        {icon}
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                <input
                                    type="text"
                                    value={researchNiche}
                                    onChange={(e) => setResearchNiche(e.target.value)}
                                    placeholder={researchMode === "affiliate" ? "Niche: weight loss, dogs, finance" : "Niche: home fitness, pets, kitchen"}
                                    className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-cyan-400/40 focus:outline-none"
                                />
                                <input
                                    type="text"
                                    value={researchBudget}
                                    onChange={(e) => setResearchBudget(e.target.value)}
                                    placeholder="Budget: $500 test, $2k/mo, etc."
                                    className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-cyan-400/40 focus:outline-none"
                                />
                            </div>

                            <input
                                type="text"
                                value={researchExtra}
                                onChange={(e) => setResearchExtra(e.target.value)}
                                placeholder={researchMode === "affiliate" ? "Traffic source: Meta, TikTok, SEO, YouTube" : "Target market: US women 25-44, homeowners, etc."}
                                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-cyan-400/40 focus:outline-none"
                            />

                            <button
                                onClick={() => void runResearch()}
                                disabled={!researchNiche.trim() || researching}
                                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-3 text-sm font-black text-white shadow-[0_0_30px_rgba(6,182,212,0.22)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {researching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {researching ? "Researching..." : `Run ${executionTier === "elite" ? "Elite" : "Core"} Research`}
                            </button>

                            {researchError && (
                                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                    {researchError}
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-5">
                            {affiliateResearch ? (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200/70">Affiliate Snapshot</p>
                                        <p className="mt-2 text-lg font-black text-white">
                                            {affiliateResearch.competitionLevel ? `${affiliateResearch.competitionLevel} competition` : "Research Ready"}
                                        </p>
                                        <p className="mt-1 text-sm text-emerald-300">
                                            {affiliateResearch.estimatedEpc ?? "EPC estimate unavailable"}
                                        </p>
                                    </div>
                                    {!!affiliateResearch.topNetworks?.length && (
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">Top Networks</p>
                                            <div className="mt-3 space-y-2">
                                                {affiliateResearch.topNetworks.slice(0, 3).map((network) => (
                                                    <div key={network.network} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                                                        <p className="text-sm font-black text-white">{network.network}</p>
                                                        <p className="mt-1 text-xs text-white/40">{network.avgComm ?? "Commission range not noted"}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {!!affiliateResearch.topNicheAngles?.length && (
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">Top Angles</p>
                                            <ul className="mt-3 space-y-2">
                                                {affiliateResearch.topNicheAngles.slice(0, 4).map((angle, index) => (
                                                    <li key={index} className="text-xs leading-6 text-white/55">
                                                        <span className="mr-2 text-cyan-300/60">{index + 1}.</span>
                                                        {angle}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : dropshipResearch ? (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200/70">Dropship Snapshot</p>
                                        <p className="mt-2 text-sm leading-7 text-white/55">
                                            {dropshipResearch.marketAnalysis ?? "Market analysis ready."}
                                        </p>
                                    </div>
                                    {!!dropshipResearch.productOpportunities?.length && (
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">Top Opportunities</p>
                                            <div className="mt-3 space-y-2">
                                                {dropshipResearch.productOpportunities.slice(0, 3).map((product) => (
                                                    <div key={product.name} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <p className="text-sm font-black text-white">{product.name}</p>
                                                            <span className="text-xs font-black text-emerald-300">{product.winnerScore}/100</span>
                                                        </div>
                                                        <p className="mt-1 text-xs text-white/40">
                                                            {product.estimatedMargin ?? "Margin TBD"} · {product.bestSupplierPlatform ?? "Supplier TBD"}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {!!dropshipResearch.trendingNow?.length && (
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">Trending Now</p>
                                            <ul className="mt-3 space-y-2">
                                                {dropshipResearch.trendingNow.slice(0, 4).map((trend, index) => (
                                                    <li key={index} className="text-xs leading-6 text-white/55">
                                                        <span className="mr-2 text-cyan-300/60">{index + 1}.</span>
                                                        {trend}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center">
                                    <Sparkles className="w-8 h-8 text-white/15" />
                                    <p className="mt-4 text-sm font-bold text-white/45">Research results will show up here</p>
                                    <p className="mt-2 max-w-sm text-xs leading-6 text-white/25">
                                        Run affiliate or dropship research to get sharper market selection, angle ideas, and product/niche intelligence before you build.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Search bar */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                        <input
                            type="text"
                            placeholder="Search niches, products..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-cyan-400/50 transition w-64"
                        />
                    </div>
                    <button className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-white/40 hover:text-white">
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                        <p className="text-sm font-black text-white/20 uppercase tracking-widest">Scanning Market Data...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-3">
                        <p className="text-white/30 text-sm">No winners match your search.</p>
                    </div>
                ) : (
                    <>
                        <p className="text-xs text-white/20 mb-6 font-medium">{filtered.length} winning ads across {[...new Set(filtered.map(w => w.niche))].length} niches</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filtered.map(winner => (
                                <WinnerCard
                                    key={winner.id}
                                    winner={winner}
                                    onRemix={() => handleRemix(winner)}
                                    isLoading={projectLoading === winner.id}
                                />
                            ))}
                        </div>
                    </>
                )}
            </section>
        </main>
    );
}

const PLATFORM_COLORS: Record<string, string> = {
    TikTok: "text-pink-400 border-pink-500/30 bg-pink-500/10",
    Facebook: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    Instagram: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    YouTube: "text-red-400 border-red-500/30 bg-red-500/10",
};

function WinnerCard({ winner, onRemix, isLoading }: { winner: WinnerAd; onRemix: () => void; isLoading?: boolean }) {
    return (
        <div className="group rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] transition-all duration-300 overflow-hidden flex flex-col h-full relative">
            {/* Score Badge */}
            <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                <Flame className={`w-3 h-3 ${winner.score >= 93 ? "text-orange-500" : winner.score >= 85 ? "text-yellow-400" : "text-white/40"}`} />
                <span className="text-[10px] font-black text-white">{winner.score}</span>
            </div>

            {/* Saturation Badge */}
            <div
              title={`Market saturation: ${winner.saturation === "low" ? "Low — few advertisers running this angle, great entry opportunity" : winner.saturation === "medium" ? "Medium — some competition, but room to differentiate" : "High — saturated market, needs a fresh angle to cut through"}`}
              className="absolute top-3 right-3 z-10 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 flex items-center gap-1.5 cursor-help"
            >
                <div className={`w-1.5 h-1.5 rounded-full ${winner.saturation === "low" ? "bg-green-400" : winner.saturation === "medium" ? "bg-yellow-400" : "bg-red-400"}`} />
                <span className="text-[9px] font-black text-white/50 uppercase tracking-wider">{winner.saturation} sat.</span>
            </div>

            {/* Thumbnail */}
            <div className="aspect-[4/5] relative overflow-hidden bg-black/50">
                <img src={winner.thumbnail} alt={winner.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-75" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050a14] via-[#050a14]/20 to-transparent" />

                {/* CTAs — always visible on mobile, hover-reveal on desktop */}
                <div className="absolute inset-x-0 bottom-3 px-3 sm:translate-y-3 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 transition-all duration-200 flex flex-col gap-2">
                    <Link href={`/analyze?url=${encodeURIComponent(winner.url)}`}
                        className="w-full bg-cyan-500 hover:bg-cyan-400 text-[#050a14] py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                        <BarChart3 className="w-3.5 h-3.5" /> Analyze with AI
                    </Link>
                    <button onClick={onRemix} disabled={isLoading}
                        className="w-full bg-black/60 hover:bg-white/10 backdrop-blur-md text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-1.5 border border-white/15 disabled:opacity-60">
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Edit3 className="w-3.5 h-3.5" />}
                        {isLoading ? "Creating..." : "Remix in Studio"}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col gap-3">
                {/* Platform + Format badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${PLATFORM_COLORS[winner.platform] ?? "text-white/40 border-white/10"}`}>
                        {winner.platform}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded border border-white/[0.08] text-white/30 uppercase tracking-wider">
                        {winner.format}
                    </span>
                </div>

                <div>
                    <p className="text-[9px] font-black text-white/25 uppercase tracking-[0.2em] mb-0.5">{winner.niche}</p>
                    <h3 className="text-sm font-bold text-white/90 leading-tight line-clamp-2">{winner.title}</h3>
                </div>

                {/* Hook preview */}
                <p className="text-[11px] text-white/40 italic leading-snug line-clamp-2 border-l-2 border-cyan-500/30 pl-2">
                    &ldquo;{winner.hook}&rdquo;
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">ROAS</p>
                        <p className="text-xs font-black text-green-400">{winner.metrics.roas}x</p>
                    </div>
                    <div>
                        <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Views</p>
                        <p className="text-xs font-black text-white/70">{winner.metrics.views}</p>
                    </div>
                    <div>
                        <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">CTR</p>
                        <p className="text-xs font-black text-cyan-400">{winner.metrics.ctr ?? "—"}</p>
                    </div>
                </div>

                {/* Why it works */}
                <p className="text-[10px] text-white/30 leading-relaxed line-clamp-2 mt-auto pt-2 border-t border-white/[0.05]">
                    {winner.whyItWorks}
                </p>
            </div>
        </div>
    );
}
