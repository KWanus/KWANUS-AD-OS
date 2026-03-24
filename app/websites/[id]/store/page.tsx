"use client";

import { useState, useEffect, use } from "react";
import { ArrowLeft, Plus, Loader2, PackageOpen, MoreVertical, Search, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

interface SiteProduct {
    id: string;
    name: string;
    price: number;
    compareAt: number | null;
    status: string;
    inventory: number | null;
    images: string[];
}

interface Site {
    id: string;
    name: string;
    slug: string;
}

export default function StoreDashboard({ params }: { params: Promise<{ id: string }> }) {
    const { id: siteId } = use(params);
    const router = useRouter();

    const [site, setSite] = useState<Site | null>(null);
    const [products, setProducts] = useState<SiteProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStore() {
            try {
                const [siteRes, prodRes] = await Promise.all([
                    fetch(`/api/sites/${siteId}`),
                    fetch(`/api/products?siteId=${siteId}`)
                ]);
                const s = await siteRes.json();
                const p = await prodRes.json();
                if (s.ok) setSite(s.site);
                if (p.ok) setProducts(p.products);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        void fetchStore();
    }, [siteId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020509] flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
            </div>
        );
    }

    if (!site) {
        return (
            <div className="min-h-screen bg-[#020509] flex items-center justify-center text-white/40">
                Site not found
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020509] flex flex-col font-sans">
            <header className="h-16 border-b border-white/[0.08] flex items-center justify-between px-6 bg-[#050a14]">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push(`/websites/${siteId}`)} className="flex items-center gap-1.5 text-white/40 hover:text-white transition group">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-bold">Back to Site</span>
                    </button>
                    <div className="h-4 w-[1px] bg-white/10" />
                    <h1 className="text-base font-black text-white">{site.name} Store</h1>
                </div>

                <div className="flex items-center gap-3">
                    <a href={`/s/${site.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white/60 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition">
                        <ExternalLink className="w-3.5 h-3.5" /> Live Store
                    </a>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:opacity-90 transition shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                        <Plus className="w-3.5 h-3.5" />
                        Add Product
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-6xl w-full mx-auto p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Products</h2>
                        <p className="text-sm text-white/40 mt-1">Manage your physical and digital goods.</p>
                    </div>
                    <div className="flex bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 w-64 items-center gap-2">
                        <Search className="w-4 h-4 text-white/30" />
                        <input type="text" placeholder="Search products..." className="bg-transparent border-none text-sm text-white focus:outline-none w-full placeholder-white/20" />
                    </div>
                </div>

                {products.length === 0 ? (
                    <div className="border border-dashed border-white/[0.1] rounded-3xl p-12 flex flex-col items-center justify-center text-center bg-white/[0.01]">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/[0.05] flex items-center justify-center mb-6">
                            <PackageOpen className="w-8 h-8 text-white/40" />
                        </div>
                        <h3 className="text-lg font-black text-white mb-2">No products yet</h3>
                        <p className="text-sm text-white/40 max-w-xs mb-6">Start building your store catalogue by adding your first product.</p>
                        <button className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black bg-white text-[#050a14] hover:bg-white/90 transition shadow-lg">
                            <Plus className="w-4 h-4" />
                            Add Product
                        </button>
                    </div>
                ) : (
                    <div className="bg-[#050a14] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-white/30 w-12"></th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-white/30">Product</th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-white/30">Status</th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-white/30">Inventory</th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-white/30">Price</th>
                                    <th className="py-4 px-6 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {products.map((p) => (
                                    <tr key={p.id} className="hover:bg-white/[0.02] transition cursor-pointer group">
                                        <td className="py-4 px-6">
                                            <div className="w-10 h-10 rounded-lg bg-white/[0.05] border border-white/[0.1] flex items-center justify-center overflow-hidden">
                                                {p.images[0] ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <PackageOpen className="w-4 h-4 text-white/20" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition">{p.name}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${p.status === 'active' ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-white/[0.05] text-white/50 border border-white/[0.1]'}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-sm text-white/60">{p.inventory === null ? '∞' : `${p.inventory} in stock`}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-sm font-bold text-white">${(p.price / 100).toFixed(2)}</div>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button className="p-1.5 rounded-lg text-white/30 hover:bg-white/[0.05] hover:text-white transition">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}
