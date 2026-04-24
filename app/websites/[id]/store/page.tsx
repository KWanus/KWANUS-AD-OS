"use client";

import { useState, useEffect, use } from "react";
import { ArrowLeft, Plus, Loader2, PackageOpen, Search, ExternalLink, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SiteProduct {
    id: string;
    name: string;
    description: string | null;
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
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft" | "archived">("all");
    const [showAddModal, setShowAddModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [productForm, setProductForm] = useState({
        name: "",
        description: "",
        price: "",
        compareAt: "",
        inventory: "",
        imageUrl: "",
        status: "active",
    });

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

    async function createProduct() {
        if (!productForm.name.trim() || !productForm.price.trim()) {
            toast.error("Name and price are required");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    siteId,
                    name: productForm.name.trim(),
                    description: productForm.description.trim() || undefined,
                    price: Math.round(Number(productForm.price) * 100),
                    compareAt: productForm.compareAt.trim() ? Math.round(Number(productForm.compareAt) * 100) : undefined,
                    inventory: productForm.inventory.trim() ? Number(productForm.inventory) : null,
                    images: productForm.imageUrl.trim() ? [productForm.imageUrl.trim()] : [],
                    status: productForm.status,
                }),
            });

            const data = await res.json() as { ok: boolean; product?: SiteProduct; error?: string };
            if (!data.ok || !data.product) {
                toast.error(data.error ?? "Could not add product");
                return;
            }

            setProducts((prev) => [data.product!, ...prev]);
            setProductForm({
                name: "",
                description: "",
                price: "",
                compareAt: "",
                inventory: "",
                imageUrl: "",
                status: "active",
            });
            setShowAddModal(false);
            toast.success("Product added");
        } catch {
            toast.error("Could not add product");
        } finally {
            setSaving(false);
        }
    }

    async function updateProductStatus(productId: string, status: "active" | "draft" | "archived") {
        setEditingId(productId);
        try {
            const res = await fetch(`/api/products/${productId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ siteId, status }),
            });
            const data = await res.json() as { ok: boolean; product?: SiteProduct; error?: string };
            if (!data.ok || !data.product) {
                toast.error(data.error ?? "Could not update product");
                return;
            }
            setProducts((prev) => prev.map((product) => product.id === productId ? data.product! : product));
        } catch {
            toast.error("Could not update product");
        } finally {
            setEditingId(null);
        }
    }

    async function deleteProduct(productId: string) {
        setEditingId(productId);
        try {
            const res = await fetch(`/api/products/${productId}?siteId=${siteId}`, {
                method: "DELETE",
            });
            const data = await res.json() as { ok: boolean; error?: string };
            if (!data.ok) {
                toast.error(data.error ?? "Could not delete product");
                return;
            }
            setProducts((prev) => prev.filter((product) => product.id !== productId));
            toast.success("Product deleted");
        } catch {
            toast.error("Could not delete product");
        } finally {
            setEditingId(null);
        }
    }

    const filteredProducts = products.filter((product) => {
        const matchesSearch = [product.name, product.description ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" ? true : product.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

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
            <header className="h-16 border-b border-white/[0.08] flex items-center justify-between px-6 bg-[#020509]">
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
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white transition shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Product
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-6xl w-full mx-auto p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Products</h2>
                        <p className="text-sm text-white/40 mt-1">Manage your catalog, control which items go live, and populate your public products block.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 w-72 items-center gap-2">
                            <Search className="w-4 h-4 text-white/30" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search products..."
                                className="bg-transparent border-none text-sm text-white focus:outline-none w-full placeholder-white/20"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "draft" | "archived")}
                            className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                        >
                            <option value="all" className="bg-[#020509]">All statuses</option>
                            <option value="active" className="bg-[#020509]">Active</option>
                            <option value="draft" className="bg-[#020509]">Draft</option>
                            <option value="archived" className="bg-[#020509]">Archived</option>
                        </select>
                    </div>
                </div>

                {products.length === 0 ? (
                    <div className="border border-dashed border-white/[0.1] rounded-3xl p-12 flex flex-col items-center justify-center text-center bg-white/[0.01]">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/[0.05] flex items-center justify-center mb-6">
                            <PackageOpen className="w-8 h-8 text-white/40" />
                        </div>
                        <h3 className="text-lg font-black text-white mb-2">No products yet</h3>
                        <p className="text-sm text-white/40 max-w-xs mb-6">Start building your store catalogue by adding your first product.</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black bg-white text-[#050a14] hover:bg-white/90 transition shadow-lg"
                        >
                            <Plus className="w-4 h-4" />
                            Add Product
                        </button>
                    </div>
                ) : (
                    <div className="bg-[#020509] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
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
                                {filteredProducts.map((p) => (
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
                                            {p.description && (
                                                <div className="text-xs text-white/35 mt-1 max-w-md line-clamp-2">{p.description}</div>
                                            )}
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
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => void updateProductStatus(p.id, p.status === "active" ? "draft" : "active")}
                                                    disabled={editingId === p.id}
                                                    className="px-2.5 py-1 rounded-lg border border-white/[0.08] text-[11px] font-bold text-white/55 hover:text-white transition disabled:opacity-40"
                                                >
                                                    {p.status === "active" ? "Move to Draft" : "Make Active"}
                                                </button>
                                                <button
                                                    onClick={() => void deleteProduct(p.id)}
                                                    disabled={editingId === p.id}
                                                    className="p-2 rounded-lg text-white/25 hover:bg-red-500/10 hover:text-red-400 transition disabled:opacity-40"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {products.length > 0 && filteredProducts.length === 0 && (
                    <div className="border border-white/[0.08] rounded-2xl p-10 text-center text-white/35 bg-white/[0.02]">
                        No products match this search yet.
                    </div>
                )}
            </main>

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="w-full max-w-2xl rounded-3xl border border-white/[0.08] bg-[#020509] shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-400/70">Store Catalog</p>
                                <h3 className="text-lg font-black text-white mt-1">Add Product</h3>
                            </div>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/[0.05] transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                            <input
                                value={productForm.name}
                                onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
                                placeholder="Product name"
                                className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none"
                            />
                            <input
                                value={productForm.imageUrl}
                                onChange={(event) => setProductForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                                placeholder="Image URL"
                                className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none"
                            />
                            <input
                                value={productForm.price}
                                onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))}
                                placeholder="Price (e.g. 49)"
                                className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none"
                            />
                            <input
                                value={productForm.compareAt}
                                onChange={(event) => setProductForm((prev) => ({ ...prev, compareAt: event.target.value }))}
                                placeholder="Compare-at price"
                                className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none"
                            />
                            <input
                                value={productForm.inventory}
                                onChange={(event) => setProductForm((prev) => ({ ...prev, inventory: event.target.value }))}
                                placeholder="Inventory (blank = unlimited)"
                                className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none"
                            />
                            <select
                                value={productForm.status}
                                onChange={(event) => setProductForm((prev) => ({ ...prev, status: event.target.value }))}
                                className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                            >
                                <option value="active" className="bg-[#020509]">Active</option>
                                <option value="draft" className="bg-[#020509]">Draft</option>
                                <option value="archived" className="bg-[#020509]">Archived</option>
                            </select>
                            <textarea
                                value={productForm.description}
                                onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))}
                                placeholder="Short product description"
                                rows={4}
                                className="md:col-span-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none resize-none"
                            />
                        </div>

                        <div className="flex items-center justify-between px-6 py-5 border-t border-white/[0.08]">
                            <p className="text-xs text-white/35">Added products can be shown instantly on your public storefront using the Products block.</p>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2.5 rounded-xl border border-white/[0.08] text-sm font-bold text-white/55 hover:text-white transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => void createProduct()}
                                    disabled={saving}
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-sm font-black text-white disabled:opacity-50"
                                >
                                    {saving ? "Adding..." : "Add Product"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
