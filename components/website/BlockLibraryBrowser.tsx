"use client";

import { useState } from "react";
import {
  ALL_BLOCKS,
  getBlocksByCategory,
  getTopConversionBlocks,
  type BlockTemplate,
  type BlockCategory,
} from "@/lib/sites/blockLibrary";
import { X, Search, TrendingUp, Sparkles } from "lucide-react";

interface BlockLibraryBrowserProps {
  onSelectBlock: (block: BlockTemplate) => void;
  onClose: () => void;
}

const CATEGORIES: { id: BlockCategory; label: string; emoji: string }[] = [
  { id: "hero", label: "Hero", emoji: "🎯" },
  { id: "features", label: "Features", emoji: "⚡" },
  { id: "testimonials", label: "Testimonials", emoji: "💬" },
  { id: "pricing", label: "Pricing", emoji: "💰" },
  { id: "cta", label: "CTA", emoji: "🚀" },
  { id: "faq", label: "FAQ", emoji: "❓" },
  { id: "stats", label: "Stats", emoji: "📊" },
  { id: "newsletter", label: "Newsletter", emoji: "📧" },
];

export function BlockLibraryBrowser({ onSelectBlock, onClose }: BlockLibraryBrowserProps) {
  const [selectedCategory, setSelectedCategory] = useState<BlockCategory | "all" | "top">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter blocks
  let blocks: BlockTemplate[] = [];
  if (selectedCategory === "all") {
    blocks = ALL_BLOCKS;
  } else if (selectedCategory === "top") {
    blocks = getTopConversionBlocks(10);
  } else {
    blocks = getBlocksByCategory(selectedCategory);
  }

  // Search filter
  if (searchQuery.trim()) {
    blocks = blocks.filter(
      (b) =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-7xl h-[90vh] bg-gradient-to-b from-[#0c0a08] to-violet-950/20 rounded-3xl border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02] backdrop-blur-xl">
          <div>
            <h2 className="font-black text-3xl bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              Block Library
            </h2>
            <p className="text-sm text-white/60 mt-1">
              {blocks.length} conversion-optimized sections
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/[0.05] border border-white/10 text-white/70 hover:bg-white/[0.1] hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search + Categories */}
        <div className="p-6 space-y-4 border-b border-white/10">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Search sections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/[0.05] backdrop-blur-xl border border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                selectedCategory === "all"
                  ? "bg-gradient-to-r from-[#f5a623]/20 to-orange-500/20 border border-[#f5a623]/30 text-white shadow-[0_0_20px_rgba(245,166,35,0.2)]"
                  : "bg-white/[0.02] border border-white/10 text-white/70 hover:bg-white/[0.05] hover:border-white/20"
              }`}
            >
              All Sections
            </button>
            <button
              onClick={() => setSelectedCategory("top")}
              className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedCategory === "top"
                  ? "bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                  : "bg-white/[0.02] border border-white/10 text-white/70 hover:bg-white/[0.05] hover:border-white/20"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Top Conversion
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? "bg-gradient-to-r from-violet-500/20 to-violet-600/20 border border-violet-500/30 text-white shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                    : "bg-white/[0.02] border border-white/10 text-white/70 hover:bg-white/[0.05] hover:border-white/20"
                }`}
              >
                <span className="mr-2">{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Block Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="text-6xl opacity-20">🔍</div>
              <p className="text-xl text-white/60">No sections found</p>
              <p className="text-sm text-white/40">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blocks.map((block) => (
                <button
                  key={block.id}
                  onClick={() => {
                    onSelectBlock(block);
                    onClose();
                  }}
                  className="group p-6 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-white/20 hover:bg-white/[0.05] transition-all text-left space-y-4 hover:scale-[1.02]"
                >
                  {/* Thumbnail (placeholder for now) */}
                  <div className="aspect-video rounded-xl bg-gradient-to-br from-violet-500/10 via-orange-500/10 to-violet-500/10 border border-white/10 flex items-center justify-center">
                    <span className="text-5xl opacity-40">
                      {CATEGORIES.find((c) => c.id === block.category)?.emoji || "📄"}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-white group-hover:text-[#f5a623] transition-colors">
                        {block.name}
                      </h3>
                      {block.conversionScore >= 90 && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          <span className="text-xs font-bold text-emerald-400">High CR</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-white/60 line-clamp-2">{block.description}</p>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-white/40 pt-2 border-t border-white/5">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {block.conversionScore}% CR
                    </span>
                    {block.mobileOptimized && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        Mobile Ready
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] backdrop-blur-xl">
          <p className="text-xs text-white/50 text-center">
            💡 Click any section to add it to your page. All sections are fully customizable.
          </p>
        </div>
      </div>
    </div>
  );
}
