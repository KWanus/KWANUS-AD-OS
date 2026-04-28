"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import SimplifiedNav from "@/components/SimplifiedNav";
import Link from "next/link";
import {
  ArrowLeft, DollarSign, Package, Mail, Phone,
  Search, Loader2, ChevronDown, Check, X, Clock,
  Download, Filter,
} from "lucide-react";

type Order = {
  id: string;
  siteId: string;
  siteName?: string;
  productName?: string;
  customerEmail: string;
  customerName?: string;
  amountCents: number;
  currency: string;
  status: string;
  createdAt: string;
};

export default function OrdersPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace("/sign-in");
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/orders")
      .then(r => r.json())
      .then(data => { if (data.ok) setOrders(data.orders ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isSignedIn]);

  if (!isLoaded || !isSignedIn) return null;

  const filtered = orders.filter(o => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return o.customerEmail.toLowerCase().includes(q) ||
        (o.customerName ?? "").toLowerCase().includes(q) ||
        (o.productName ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  const totalRevenue = filtered.filter(o => o.status === "paid" || o.status === "fulfilled").reduce((s, o) => s + o.amountCents, 0) / 100;
  const statusCounts = { all: orders.length, paid: orders.filter(o => o.status === "paid").length, fulfilled: orders.filter(o => o.status === "fulfilled").length, pending: orders.filter(o => o.status === "pending").length, refunded: orders.filter(o => o.status === "refunded").length };

  function exportCsv() {
    const headers = ["Date", "Customer", "Email", "Product", "Amount", "Status"];
    const rows = filtered.map(o => [
      new Date(o.createdAt).toLocaleDateString(), o.customerName ?? "", o.customerEmail,
      o.productName ?? "", `$${(o.amountCents / 100).toFixed(2)}`, o.status,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  }

  const STATUS_STYLE: Record<string, string> = {
    paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    fulfilled: "bg-blue-400/10 text-blue-400 border-blue-400/20",
    pending: "bg-[#f5a623]/10 text-[#f5a623] border-[#f5a623]/20",
    refunded: "bg-red-400/10 text-red-400 border-red-400/20",
  };

  return (
    <main className="min-h-screen bg-t-bg text-t-text">
      <SimplifiedNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        <div className="pt-6 pb-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-t-text-faint hover:text-t-text-muted transition mb-3">
            <ArrowLeft className="w-3 h-3" /> Home
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black">Orders</h1>
              <p className="text-xs text-t-text-faint">{orders.length} total · ${totalRevenue.toLocaleString()} revenue</p>
            </div>
            <button onClick={exportCsv} disabled={filtered.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-t-border text-xs font-bold text-t-text-muted hover:text-t-text disabled:opacity-30 transition">
              <Download className="w-3 h-3" /> Export
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: "Total", val: statusCounts.all, color: "text-t-text" },
            { label: "Paid", val: statusCounts.paid, color: "text-emerald-400" },
            { label: "Fulfilled", val: statusCounts.fulfilled, color: "text-blue-400" },
            { label: "Pending", val: statusCounts.pending, color: "text-[#f5a623]" },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-t-bg-card border border-t-border p-3 text-center">
              <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
              <p className="text-[9px] text-t-text-faint">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-t-text-faint" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search orders..."
              className="w-full rounded-xl border border-t-border bg-t-bg-raised pl-10 pr-4 py-2.5 text-sm placeholder-t-text-faint outline-none focus:border-[#f5a623]/25 transition" />
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-t-border bg-t-bg-raised px-1">
            {["all", "paid", "fulfilled", "pending", "refunded"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition ${statusFilter === s ? "bg-[#f5a623]/10 text-[#f5a623]" : "text-t-text-faint hover:text-t-text-muted"}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-6 h-6 text-t-text-faint animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-t-border bg-t-bg-raised p-8 text-center">
            <Package className="w-8 h-8 text-t-text-faint mx-auto mb-3" />
            <p className="text-base font-bold mb-1">{search || statusFilter !== "all" ? "No matching orders" : "No orders yet"}</p>
            <p className="text-xs text-t-text-muted">When customers buy from your sites, orders appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(order => (
              <div key={order.id} className="rounded-xl border border-t-border bg-t-bg-raised overflow-hidden">
                <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-t-bg-card transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{order.customerName || order.customerEmail}</p>
                      <p className="text-[10px] text-t-text-faint">{order.productName ?? "Product"} · {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-sm font-black text-emerald-400">${(order.amountCents / 100).toFixed(2)}</p>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${STATUS_STYLE[order.status] ?? "bg-t-bg-card text-t-text-faint border-t-border"}`}>
                      {order.status}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-t-text-faint transition ${expandedId === order.id ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {expandedId === order.id && (
                  <div className="px-4 pb-4 pt-1 border-t border-t-border">
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="rounded-lg bg-t-bg-card border border-t-border p-2.5">
                        <p className="text-[9px] font-black text-t-text-faint tracking-wider">EMAIL</p>
                        <p className="text-xs font-bold mt-0.5">{order.customerEmail}</p>
                      </div>
                      <div className="rounded-lg bg-t-bg-card border border-t-border p-2.5">
                        <p className="text-[9px] font-black text-t-text-faint tracking-wider">AMOUNT</p>
                        <p className="text-xs font-bold mt-0.5">${(order.amountCents / 100).toFixed(2)} {order.currency.toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a href={`mailto:${order.customerEmail}`}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#f5a623]/10 border border-[#f5a623]/20 text-[10px] font-bold text-[#f5a623] hover:bg-[#f5a623]/20 transition">
                        <Mail className="w-3 h-3" /> Email Customer
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
