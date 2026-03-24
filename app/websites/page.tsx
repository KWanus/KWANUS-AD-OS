"use client";

import { useState, useEffect } from "react";
import { Plus, Globe, Loader2, Settings, ExternalLink, Sparkles, Copy, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";

interface Site {
    id: string;
    name: string;
    slug: string;
    published: boolean;
    totalViews: number;
}

export default function WebsitesDashboard() {
    const router = useRouter();
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    function copyUrl(e: React.MouseEvent, siteId: string, slug: string) {
        e.preventDefault();
        void navigator.clipboard.writeText(`https://${slug}.kwanus.co`);
        setCopiedId(siteId);
        setTimeout(() => setCopiedId(null), 2000);
    }

    useEffect(() => {
        async function fetchSites() {
            try {
                const res = await fetch("/api/sites");
                const data = await res.json();
                if (data.ok) setSites(data.sites);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        void fetchSites();
    }, []);

    return (
        <div className="min-h-screen bg-[#020509] font-sans flex flex-col text-white">
            {/* Ambient glows */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[300px] opacity-[0.04] blur-[120px] bg-purple-500 rounded-full" />
                <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] opacity-[0.03] blur-[100px] bg-cyan-500 rounded-full" />
                <div className="absolute inset-0 opacity-[0.018]"
                    style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
            </div>

            <AppNav />

            <div className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6">
                {/* Header */}
                <header className="pt-12 pb-10 flex items-end justify-between gap-6 border-b border-white/[0.06]">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                            <span className="text-[11px] font-black tracking-[0.25em] text-purple-400/70 uppercase">Himalaya Sites</span>
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tight">
                            Your{" "}
                            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                                Funnels & Stores
                            </span>
                        </h1>
                        <p className="text-white/35 mt-2 text-sm max-w-sm">
                            Auto-generated, high-converting funnels with zero transaction fees. Launch, edit, and scale.
                        </p>
                    </div>

                    <div className="flex gap-3 shrink-0">
                        <button
                            onClick={() => router.push("/websites/new")}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-black shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_50px_rgba(6,182,212,0.45)] hover:scale-[1.02] transition-all duration-200"
                        >
                            <Plus className="w-4 h-4" />
                            Create New Site
                        </button>
                    </div>
                </header>

                {/* Stats bar */}
                {sites.length > 0 && (
                    <div className="mt-8 mb-10 grid grid-cols-3 gap-4">
                        {[
                            { label: "Total Sites", value: sites.length.toString() },
                            { label: "Published", value: sites.filter(s => s.published).length.toString(), color: "text-green-400" },
                            { label: "Total Views", value: sites.reduce((a, s) => a + (s.totalViews || 0), 0).toLocaleString() },
                        ].map((stat) => (
                            <div key={stat.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-6 py-4">
                                <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className={`text-3xl font-black tracking-tight ${stat.color || "text-white"}`}>{stat.value}</p>
                            </div>
                        ))}
                    </div>
                )}

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
            </div>
        </div>
    );
}
