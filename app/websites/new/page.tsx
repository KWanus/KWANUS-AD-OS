"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Rocket, Sparkles } from "lucide-react";

export default function NewSitePage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [campaignId, setCampaignId] = useState("");
    const [campaigns, setCampaigns] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("/api/campaigns")
            .then(r => r.json())
            .then(data => {
                if (data.ok) setCampaigns(data.campaigns);
            });
    }, []);

    async function createSite(e: React.FormEvent) {
        e.preventDefault();
        if (!name || !slug) return;

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/sites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, slug, template: "golden", campaignId }),
            });

            const data = await res.json();
            if (!data.ok) {
                throw new Error(data.error || "Failed to create site");
            }

            router.push(`/websites/${data.site.id}`);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#020509] flex flex-col items-center justify-center font-sans p-6">
            <div className="w-full max-w-md">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-white/40 hover:text-white transition text-sm font-semibold mb-8"
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <div className="bg-[#050a14] border border-white/[0.08] rounded-3xl p-8 shadow-2xl">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-cyan-400 flex items-center justify-center mb-6">
                        <Rocket className="w-6 h-6" />
                    </div>

                    <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Create a New Site</h1>
                    <p className="text-sm text-white/50 mb-8">Give your funnel or store a name and a web address.</p>

                    <form onSubmit={createSite} className="space-y-5">
                        <div>
                            <label className="block text-xs font-black uppercase text-white/50 tracking-widest mb-2">Site Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                                }}
                                className="w-full bg-white/[0.03] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
                                placeholder="e.g. My Awesome Store"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase text-white/50 tracking-widest mb-2">Web Address</label>
                            <div className="flex bg-white/[0.03] border border-white/[0.1] rounded-xl overflow-hidden focus-within:border-cyan-500/50 transition">
                                <input
                                    type="text"
                                    required
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                                    className="flex-1 bg-transparent px-4 py-3 text-white font-mono text-sm placeholder-white/20 focus:outline-none"
                                    placeholder="my-store"
                                />
                                <span className="flex-none bg-white/[0.02] border-l border-white/[0.05] px-4 py-3 text-sm text-white/40 font-mono">
                                    .kwanus.co
                                </span>
                            </div>
                        </div>

                        {campaigns.length > 0 && (
                            <div className="pt-4 border-t border-white/5">
                                <label className="flex items-center gap-2 text-xs font-black uppercase text-cyan-400 tracking-widest mb-2">
                                    <Sparkles className="w-4 h-4" /> AI Auto-Generate Funnel
                                </label>
                                <select
                                    value={campaignId}
                                    onChange={(e) => setCampaignId(e.target.value)}
                                    className="w-full bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-4 py-3 text-cyan-100 outline-none focus:border-cyan-400 transition"
                                >
                                    <option value="">Start with blank template</option>
                                    {campaigns.map(c => (
                                        <option key={c.id} value={c.id}>Auto-Build using: {c.name}</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-white/40 mt-2 leading-relaxed">
                                    Selecting a campaign will instantly inject its custom AI-generated headlines, benefits, and sales copy into the high-converting funnel design.
                                </p>
                            </div>
                        )}

                        {error && <p className="text-red-400 text-sm font-semibold">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading || !name || !slug}
                            className="w-full flex justify-center items-center py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-black hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Site"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
