"use client";

import { useState, useEffect, use } from "react";
import {
    ArrowLeft, Loader2, ShoppingBag, Search, ExternalLink,
    ChevronDown, Check, Download, Filter,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SiteOrder {
    id: string;
    productId: string;
    customerEmail: string;
    customerName: string | null;
    amountCents: number;
    currency: string;
    status: "pending" | "paid" | "fulfilled" | "refunded";
    stripePaymentId: string | null;
    shippingAddress: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    } | null;
    notes: string | null;
    createdAt: string;
}

interface Site {
    id: string;
    name: string;
    slug: string;
}

const STATUS_STYLES: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    paid: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    fulfilled: "bg-green-500/15 text-green-400 border border-green-500/30",
    refunded: "bg-white/[0.05] text-white/40 border border-white/[0.1]",
};

const NEXT_STATUS: Record<string, { label: string; next: "paid" | "fulfilled" | "refunded" }> = {
    pending: { label: "Mark Paid", next: "paid" },
    paid: { label: "Mark Fulfilled", next: "fulfilled" },
    fulfilled: { label: "Refund", next: "refunded" },
};

export default function OrdersDashboard({ params }: { params: Promise<{ id: string }> }) {
    const { id: siteId } = use(params);
    const router = useRouter();

    const [site, setSite] = useState<Site | null>(null);
    const [orders, setOrders] = useState<SiteOrder[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid" | "fulfilled" | "refunded">("all");
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const [siteRes, ordersRes] = await Promise.all([
                    fetch(`/api/sites/${siteId}`),
                    fetch(`/api/sites/${siteId}/orders?limit=200`),
                ]);
                const s = await siteRes.json() as { ok: boolean; site?: Site };
                const o = await ordersRes.json() as { ok: boolean; orders?: SiteOrder[]; total?: number };
                if (s.ok && s.site) setSite(s.site);
                if (o.ok) {
                    setOrders(o.orders ?? []);
                    setTotal(o.total ?? 0);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        void fetchData();
    }, [siteId]);

    async function updateStatus(orderId: string, status: "paid" | "fulfilled" | "refunded") {
        setUpdatingId(orderId);
        try {
            const res = await fetch(`/api/sites/${siteId}/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            const data = await res.json() as { ok: boolean; order?: SiteOrder; error?: string };
            if (!data.ok || !data.order) {
                toast.error(data.error ?? "Could not update order");
                return;
            }
            setOrders((prev) => prev.map((o) => o.id === orderId ? data.order! : o));
            toast.success(`Order marked as ${status}`);
        } catch {
            toast.error("Could not update order");
        } finally {
            setUpdatingId(null);
        }
    }

    const filtered = orders.filter((o) => {
        const matchesStatus = statusFilter === "all" || o.status === statusFilter;
        const q = search.toLowerCase();
        const matchesSearch = !q || [
            o.customerEmail,
            o.customerName ?? "",
            o.id,
        ].some((s) => s.toLowerCase().includes(q));
        return matchesStatus && matchesSearch;
    });

    const revenue = orders
        .filter((o) => o.status === "paid" || o.status === "fulfilled")
        .reduce((sum, o) => sum + o.amountCents, 0);

    function exportToCSV() {
        if (!site) return;
        const headers = ["Order ID", "Customer Name", "Customer Email", "Date", "Amount", "Status"];
        const rows = filtered.map((o) => [
            o.id,
            o.customerName ?? "",
            o.customerEmail,
            new Date(o.createdAt).toLocaleDateString("en-US"),
            `$${(o.amountCents / 100).toFixed(2)}`,
            o.status,
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `orders-${site.slug}-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Orders exported to CSV");
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-t-bg flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
            </div>
        );
    }

    if (!site) {
        return (
            <div className="min-h-screen bg-t-bg flex items-center justify-center text-white/40">
                Site not found
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-t-bg flex flex-col font-sans">
            <header className="h-16 border-b border-white/[0.08] flex items-center justify-between px-6 bg-t-bg">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push(`/websites/${siteId}`)}
                        className="flex items-center gap-1.5 text-white/40 hover:text-white transition group"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-bold">Back to Site</span>
                    </button>
                    <div className="h-4 w-[1px] bg-white/10" />
                    <h1 className="text-base font-black text-white">{site.name} Orders</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push(`/websites/${siteId}/store`)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white/60 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition"
                    >
                        Manage Products
                    </button>
                    <a
                        href={`/s/${site.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white/60 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition"
                    >
                        <ExternalLink className="w-3.5 h-3.5" /> Live Store
                    </a>
                </div>
            </header>

            <main className="flex-1 max-w-6xl w-full mx-auto p-8">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { label: "Total Orders", value: total },
                        { label: "Paid + Fulfilled", value: `$${(revenue / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
                        { label: "Pending", value: orders.filter((o) => o.status === "pending").length },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-t-bg border border-white/[0.08] rounded-2xl p-5 hover:border-white/[0.12] hover:bg-white/[0.02] transition-all hover:scale-[1.01]">
                            <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">{stat.label}</div>
                            <div className="text-2xl font-black text-white">{stat.value}</div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-white tracking-tight">Orders</h2>
                    <div className="flex items-center gap-3">
                        {orders.length > 0 && (
                            <button
                                onClick={exportToCSV}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white/60 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition"
                            >
                                <Download className="w-3.5 h-3.5" /> Export CSV
                            </button>
                        )}
                        <div className="flex bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 w-64 items-center gap-2">
                            <Search className="w-4 h-4 text-white/30" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by email or name..."
                                className="bg-transparent border-none text-sm text-white focus:outline-none w-full placeholder-white/20"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                            className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                        >
                            <option value="all" className="bg-t-bg">All statuses</option>
                            <option value="pending" className="bg-t-bg">Pending</option>
                            <option value="paid" className="bg-t-bg">Paid</option>
                            <option value="fulfilled" className="bg-t-bg">Fulfilled</option>
                            <option value="refunded" className="bg-t-bg">Refunded</option>
                        </select>
                    </div>
                </div>

                {orders.length === 0 ? (
                    <div className="border border-dashed border-white/[0.1] rounded-3xl p-12 flex flex-col items-center justify-center text-center bg-white/[0.01]">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/[0.05] flex items-center justify-center mb-6">
                            <ShoppingBag className="w-8 h-8 text-white/40" />
                        </div>
                        <h3 className="text-lg font-black text-white mb-2">No orders yet</h3>
                        <p className="text-sm text-white/40 max-w-xs">Orders will appear here once customers purchase from your public storefront.</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="border border-white/[0.08] rounded-2xl p-10 text-center text-white/35 bg-white/[0.02]">
                        No orders match this filter.
                    </div>
                ) : (
                    <div className="bg-t-bg border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-white/30">Customer</th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-white/30">Date</th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-white/30">Amount</th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-white/30">Status</th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-white/30">Details</th>
                                    <th className="py-4 px-6 w-40"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {filtered.map((order) => (
                                    <>
                                        <tr key={order.id} className="hover:bg-white/[0.02] transition-all duration-200 group">
                                            <td className="py-4 px-6">
                                                <div className="text-sm font-bold text-white">{order.customerName ?? "—"}</div>
                                                <div className="text-xs text-white/40 mt-0.5">{order.customerEmail}</div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="text-sm text-white/60">
                                                    {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="text-sm font-bold text-white">
                                                    ${(order.amountCents / 100).toFixed(2)}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${STATUS_STYLES[order.status] ?? ""}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                {order.shippingAddress?.city ? (
                                                    <button
                                                        onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                                                        className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition"
                                                    >
                                                        Address <ChevronDown className={`w-3 h-3 transition-transform ${expandedId === order.id ? "rotate-180" : ""}`} />
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-white/20">—</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                {NEXT_STATUS[order.status] ? (
                                                    <button
                                                        onClick={() => void updateStatus(order.id, NEXT_STATUS[order.status]!.next)}
                                                        disabled={updatingId === order.id}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-[11px] font-bold text-white/55 hover:text-white hover:border-white/20 transition disabled:opacity-40 ml-auto"
                                                    >
                                                        <Check className="w-3 h-3" />
                                                        {NEXT_STATUS[order.status]!.label}
                                                    </button>
                                                ) : null}
                                            </td>
                                        </tr>
                                        {expandedId === order.id && order.shippingAddress && (
                                            <tr key={`${order.id}-expanded`} className="bg-white/[0.01]">
                                                <td colSpan={6} className="px-6 py-3">
                                                    <div className="text-xs text-white/50 space-y-0.5">
                                                        {order.shippingAddress.line1 && <div>{order.shippingAddress.line1}</div>}
                                                        {order.shippingAddress.line2 && <div>{order.shippingAddress.line2}</div>}
                                                        <div>
                                                            {[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.postalCode].filter(Boolean).join(", ")}
                                                            {order.shippingAddress.country ? ` · ${order.shippingAddress.country}` : ""}
                                                        </div>
                                                        {order.notes && <div className="mt-1 text-white/35 italic">Note: {order.notes}</div>}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}
