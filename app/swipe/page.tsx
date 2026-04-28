"use client";

import { useState, useEffect } from "react";
import SimplifiedNav from "@/components/SimplifiedNav";
import { BookmarkPlus, Copy, Check, Loader2, Search, Tag } from "lucide-react";

type SwipeItem = {
  id: string;
  type: string;
  title: string;
  content: string;
  platform: string;
  source: string;
  tags: string[];
  savedAt: string;
};

export default function SwipeFilePage() {
  const [items, setItems] = useState<SwipeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    fetch("/api/swipe-file")
      .then((r) => r.json() as Promise<{ ok: boolean; swipes?: SwipeItem[] }>)
      .then((data) => { if (data.ok && data.swipes) setItems(data.swipes); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function copyItem(id: string, content: string) {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const types = ["all", ...Array.from(new Set(items.map((i) => i.type)))];
  const filtered = items.filter((i) => {
    if (filterType !== "all" && i.type !== filterType) return false;
    if (search && !i.content.toLowerCase().includes(search.toLowerCase()) && !i.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <SimplifiedNav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Swipe File</h1>
            <p className="text-sm text-white/35 mt-1">Your best-performing hooks, scripts, and emails saved for reuse</p>
          </div>
          <span className="text-xs text-white/20">{items.length} saved</span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your swipe file..."
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 transition"
            />
          </div>
          <div className="flex gap-1.5">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition border ${
                  filterType === t
                    ? "border-[#f5a623]/40 bg-[#f5a623]/10 text-[#f5a623]"
                    : "border-white/10 bg-white/[0.03] text-white/30 hover:text-white/50"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <BookmarkPlus className="w-10 h-10 text-white/10 mx-auto mb-4" />
            <h2 className="text-lg font-black text-white mb-2">
              {items.length === 0 ? "Your swipe file is empty" : "No matches found"}
            </h2>
            <p className="text-sm text-white/30 max-w-sm mx-auto">
              {items.length === 0
                ? "When you find a hook, email, or script that performs well, save it here for reuse across campaigns."
                : "Try a different search or filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 hover:border-[#f5a623]/15 transition">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#f5a623]/15 text-[#f5a623] border border-[#f5a623]/20">
                      {item.type}
                    </span>
                    {item.platform && (
                      <span className="text-[10px] text-white/25 border border-white/10 px-2 py-0.5 rounded">
                        {item.platform}
                      </span>
                    )}
                    {item.tags.map((tag) => (
                      <span key={tag} className="flex items-center gap-0.5 text-[10px] text-white/20">
                        <Tag className="w-2.5 h-2.5" /> {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => copyItem(item.id, item.content)}
                    className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#f5a623]/10 border border-[#f5a623]/20 text-[#f5a623] text-[10px] font-bold hover:bg-[#f5a623]/20 transition"
                  >
                    {copiedId === item.id ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
                {item.title && <p className="text-xs font-bold text-white/60 mb-1">{item.title}</p>}
                <pre className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap font-sans">
                  {item.content.slice(0, 500)}{item.content.length > 500 ? "..." : ""}
                </pre>
                {item.source && (
                  <p className="text-[10px] text-white/15 mt-2">Source: {item.source}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
