"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SimplifiedNav from "@/components/SimplifiedNav";
import {
  Store, Package, Globe, Mail, Zap, Loader2, Check, DollarSign,
  ArrowRight, X, Tag, ChevronDown,
} from "lucide-react";

type Asset = {
  id: string;
  name: string;
  description?: string;
  type: "project" | "email_flow" | "site";
};

type ListingForm = {
  assetId: string;
  assetType: string;
  title: string;
  description: string;
  price: number;
  category: string;
};

const CATEGORIES = [
  { value: "funnel", label: "Funnel" },
  { value: "email_sequence", label: "Email Sequence" },
  { value: "ad_pack", label: "Ad Pack" },
  { value: "site_template", label: "Site Template" },
];

const TYPE_ICON: Record<string, React.ElementType> = {
  project: Package,
  email_flow: Mail,
  site: Globe,
};

const TYPE_BADGE_STYLE: Record<string, string> = {
  project: "text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20",
  email_flow: "text-[#e07850] bg-[#e07850]/10 border-[#e07850]/20",
  site: "text-blue-400 bg-blue-500/10 border-blue-500/20",
};

const DEFAULT_CATEGORY: Record<string, string> = {
  project: "funnel",
  email_flow: "email_sequence",
  site: "site_template",
};

export default function SellPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ListingForm | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ title: string; price: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const all: Asset[] = [];

    Promise.allSettled([
      fetch("/api/himalaya/projects")
        .then((r) => r.json())
        .then((d) => {
          const items = d.projects ?? d.items ?? (Array.isArray(d) ? d : []);
          items.forEach((p: { id: string; name?: string; title?: string; description?: string }) => {
            all.push({ id: p.id, name: p.name ?? p.title ?? "Untitled Project", description: p.description, type: "project" });
          });
        }),
      fetch("/api/email-flows")
        .then((r) => r.json())
        .then((d) => {
          const items = d.flows ?? d.items ?? (Array.isArray(d) ? d : []);
          items.forEach((f: { id: string; name?: string; title?: string; description?: string }) => {
            all.push({ id: f.id, name: f.name ?? f.title ?? "Untitled Flow", description: f.description, type: "email_flow" });
          });
        }),
      fetch("/api/sites")
        .then((r) => r.json())
        .then((d) => {
          const items = d.sites ?? d.items ?? (Array.isArray(d) ? d : []);
          items.forEach((s: { id: string; name?: string; title?: string; domain?: string; description?: string }) => {
            all.push({ id: s.id, name: s.name ?? s.title ?? s.domain ?? "Untitled Site", description: s.description, type: "site" });
          });
        }),
    ]).finally(() => {
      if (!cancelled) {
        setAssets(all);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, []);

  const openForm = (asset: Asset) => {
    setSuccess(null);
    setForm({
      assetId: asset.id,
      assetType: asset.type,
      title: asset.name,
      description: asset.description ?? "",
      price: asset.type === "site" ? 49 : asset.type === "email_flow" ? 29 : 19,
      category: DEFAULT_CATEGORY[asset.type] ?? "funnel",
    });
  };

  const submitListing = async () => {
    if (!form) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: form.assetId,
          assetType: form.assetType,
          title: form.title,
          description: form.description,
          price: form.price,
          category: form.category,
        }),
      });
      const data = await res.json();
      if (data.ok || res.ok) {
        setSuccess({ title: form.title, price: form.price });
        setForm(null);
      }
    } catch {
      // silently handle
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SimplifiedNav />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Store className="w-7 h-7 text-[#f5a623]" />
            <h1 className="text-2xl font-bold">Sell on Marketplace</h1>
          </div>
          <Link
            href="/marketplace"
            className="text-sm text-white/50 hover:text-white/80 transition-colors flex items-center gap-1"
          >
            View Marketplace <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Success banner */}
        {success && (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6 mb-6 text-center">
            <Check className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-green-400 mb-1">Listed!</h2>
            <p className="text-sm text-white/70 mb-1">
              <span className="font-semibold text-white">{success.title}</span> is now on the marketplace.
            </p>
            <p className="text-sm text-white/50">
              You&apos;ll earn 80% of every sale{" "}
              <span className="text-[#f5a623] font-semibold">(${(success.price * 0.8).toFixed(2)} per sale)</span>
            </p>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-lg bg-[#f5a623] text-black font-semibold text-sm hover:bg-[#e09000] transition-colors"
            >
              See Your Listing <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Listing form modal overlay */}
        {form && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#141414] p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#f5a623]" />
                  List for Sale
                </h2>
                <button onClick={() => setForm(null)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-white/40" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[#f5a623]/50"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[#f5a623]/50 resize-none"
                    placeholder="Describe what's included..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Price ($)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="number"
                        min={1}
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                        className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[#f5a623]/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Category</label>
                    <div className="relative">
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[#f5a623]/50 appearance-none"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value} className="bg-[#141414]">{c.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <p className="text-xs text-white/40 text-center">
                  You earn <span className="text-[#f5a623] font-semibold">80%</span> of each sale = <span className="text-[#f5a623] font-semibold">${(form.price * 0.8).toFixed(2)}</span> per sale
                </p>

                <button
                  onClick={submitListing}
                  disabled={submitting || !form.title}
                  className="w-full py-3 rounded-lg bg-[#f5a623] text-black font-semibold text-sm hover:bg-[#e09000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Listing...</>
                  ) : (
                    <>List for Sale</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assets grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#f5a623]" />
          </div>
        ) : assets.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-10 text-center">
            <Package className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/50 mb-1">No assets yet</p>
            <p className="text-sm text-white/30 mb-4">Build a project, email flow, or site first, then come back to sell it.</p>
            <Link
              href="/himalaya"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#f5a623] text-black font-semibold text-sm hover:bg-[#e09000] transition-colors"
            >
              Build Something <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {assets.map((asset) => {
              const Icon = TYPE_ICON[asset.type] ?? Package;
              const badgeStyle = TYPE_BADGE_STYLE[asset.type] ?? "text-white/60 bg-white/5 border-white/10";
              return (
                <div
                  key={`${asset.type}-${asset.id}`}
                  className="rounded-xl border border-white/10 bg-white/5 p-5 flex flex-col"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="w-5 h-5 text-[#f5a623] shrink-0" />
                      <h3 className="font-semibold text-sm truncate">{asset.name}</h3>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-medium shrink-0 ml-2 ${badgeStyle}`}>
                      {asset.type.replace("_", " ")}
                    </span>
                  </div>
                  {asset.description && (
                    <p className="text-xs text-white/40 mb-4 line-clamp-2">{asset.description}</p>
                  )}
                  <div className="mt-auto">
                    <button
                      onClick={() => openForm(asset)}
                      className="w-full py-2 rounded-lg border border-[#f5a623]/30 text-[#f5a623] text-sm font-semibold hover:bg-[#f5a623]/10 transition-colors"
                    >
                      List for Sale
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
