"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
    Search, Filter,
    BarChart3, Edit3, Loader2,
    Flame
} from "lucide-react";
import type { WinnerAd } from "../api/winners/route";

export default function WinnerFinder() {
    const router = useRouter();
    const [winners, setWinners] = useState<WinnerAd[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [projectLoading, setProjectLoading] = useState<string | null>(null);

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
                    sourceType: "winner"
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

    return (
        <main className="min-h-screen bg-[#050a14] text-white flex flex-col font-inter">
            {/* Subtle background glow */}
            <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

            <AppNav />

            {/* Main Grid */}
            <section className="flex-1 p-8 overflow-y-auto">
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
