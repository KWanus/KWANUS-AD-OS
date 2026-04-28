"use client";

import { useState, useEffect } from "react";
import SimplifiedNav from "@/components/SimplifiedNav";
import {
  Store, Search, Star, ShoppingCart, DollarSign, TrendingUp,
  Mail, Zap, Globe, BookOpen, Loader2, Filter,
} from "lucide-react";

type MarketplaceItem = {
  id: string;
  sellerName: string;
  type: string;
  title: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  salesCount: number;
  featured: boolean;
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  funnel: Globe,
  email_sequence: Mail,
  ad_pack: Zap,
  site_template: Globe,
  prompt_pack: Star,
  course_template: BookOpen,
};

const TYPE_COLORS: Record<string, string> = {
  funnel: "text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20",
  email_sequence: "text-[#e07850] bg-[#e07850]/10 border-[#e07850]/20",
  ad_pack: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  site_template: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  prompt_pack: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  course_template: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

export default function MarketplacePage() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  useEffect(() => {
    fetch(`/api/marketplace?sort=${sortBy}`)
      .then((r) => r.json() as Promise<{ ok: boolean; items?: MarketplaceItem[] }>)
      .then((data) => { if (data.ok && data.items) setItems(data.items); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sortBy]);

  const filtered = items.filter((item) => {
    if (filterType !== "all" && item.type !== filterType) return false;
    if (search && !item.title.toLowerCase().includes(search.toLowerCase()) && !item.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const types = ["all", ...new Set(items.map((i) => i.type))];

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <SimplifiedNav />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#f5a623] to-[#e07850] flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_rgba(245,166,35,0.3)]">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Marketplace</h1>
          <p className="text-sm text-white/40 max-w-md mx-auto">Buy proven funnels, email sequences, and ad packs from top performers. One-click deploy.</p>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search marketplace..."
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 transition" />
          </div>
          <div className="flex gap-2">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white outline-none">
              <option value="newest" className="bg-t-bg-card">Newest</option>
              <option value="popular" className="bg-t-bg-card">Most Popular</option>
              <option value="rating" className="bg-t-bg-card">Highest Rated</option>
              <option value="price_low" className="bg-t-bg-card">Price: Low</option>
              <option value="price_high" className="bg-t-bg-card">Price: High</option>
            </select>
          </div>
        </div>

        {/* Type pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {types.map((type) => (
            <button key={type} onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                filterType === type ? "border-[#f5a623]/40 bg-[#f5a623]/10 text-[#f5a623]" : "border-white/10 bg-white/[0.03] text-white/30"
              }`}>
              {type === "all" ? "All" : type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Items grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Store className="w-10 h-10 text-white/10 mx-auto mb-4" />
            <h2 className="text-lg font-black text-white mb-2">
              {items.length === 0 ? "Marketplace is empty" : "No matches"}
            </h2>
            <p className="text-sm text-white/30 max-w-sm mx-auto">
              {items.length === 0
                ? "Be the first to list your winning assets. Go to any campaign, email flow, or site and click 'Sell on Marketplace'."
                : "Try a different search or filter."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => {
              const Icon = TYPE_ICONS[item.type] ?? Store;
              const colors = TYPE_COLORS[item.type] ?? "text-white/40 bg-white/5 border-white/10";

              return (
                <div key={item.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden hover:border-[#f5a623]/20 transition group">
                  {item.featured && (
                    <div className="bg-gradient-to-r from-[#f5a623] to-[#e07850] px-4 py-1 text-[10px] font-bold text-white text-center">
                      Featured
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold ${colors}`}>
                        <Icon className="w-3 h-3" />
                        {item.type.replace(/_/g, " ")}
                      </div>
                      <span className="text-lg font-black text-emerald-400">${item.price}</span>
                    </div>

                    <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
                    <p className="text-xs text-white/30 mb-3 line-clamp-2">{item.description}</p>

                    <div className="flex items-center justify-between text-[10px] text-white/20">
                      <span>by {item.sellerName}</span>
                      <div className="flex items-center gap-3">
                        {item.rating > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            {item.rating.toFixed(1)}
                          </span>
                        )}
                        <span>{item.salesCount} sales</span>
                      </div>
                    </div>

                    <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition">
                      <ShoppingCart className="w-3.5 h-3.5" /> Get This
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
