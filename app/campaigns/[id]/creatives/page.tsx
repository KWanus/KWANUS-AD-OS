"use client";

import { use, useState } from "react";
import Link from "next/link";
import { IMAGE_FRAMEWORKS, VIDEO_FRAMEWORKS } from "@/lib/ads/professionalCreatives";
import type { CreativeFramework } from "@/lib/ads/professionalCreatives";
import {
  Search, Filter, Sparkles, Layout, ImageIcon, Video, Grid3x3, List,
  Eye, Heart, Star, Wand2, ArrowLeft, TrendingUp, Zap, Play, ChevronRight,
} from "lucide-react";

// Template categories matching creative studio
const CATEGORIES = [
  { id: "all", label: "All Frameworks", icon: Layout },
  { id: "image", label: "Image Ads", icon: ImageIcon },
  { id: "video", label: "Video Ads", icon: Video },
  { id: "meta", label: "Meta/Facebook", icon: TrendingUp },
  { id: "tiktok", label: "TikTok", icon: Play },
  { id: "google", label: "Google Ads", icon: Search },
];

export default function CreativesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [selectedFramework, setSelectedFramework] = useState<CreativeFramework | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"winRate" | "platform">("winRate");

  const allFrameworks = [...IMAGE_FRAMEWORKS, ...VIDEO_FRAMEWORKS];

  // Filter frameworks
  const filteredFrameworks = allFrameworks.filter((framework) => {
    const matchesCategory =
      selectedCategory === "all" ||
      (selectedCategory === "image" && framework.format === "image") ||
      (selectedCategory === "video" && framework.format === "video") ||
      framework.platform === selectedCategory;
    const matchesSearch = framework.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      framework.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort frameworks
  const sortedFrameworks = [...filteredFrameworks].sort((a, b) => {
    if (sortBy === "winRate") return b.winRate - a.winRate;
    return a.platform.localeCompare(b.platform);
  });

  const handleGenerate = async (framework: CreativeFramework) => {
    setGeneratingImage(true);
    setGeneratedUrl(null);

    try {
      const res = await fetch("/api/creative/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Generate professional ad creative",
          product: "Your Product Name",
          benefit: "Key benefit for customers",
          hook: "Attention-grabbing hook",
          platform: framework.platform === "universal" ? "meta" : framework.platform,
          executionTier: "elite",
          aspectRatio: "1:1",
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setGeneratedUrl(data.url);
      }
    } catch (err) {
      console.error("Generation failed:", err);
    } finally {
      setGeneratingImage(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0a08]">
      <div className="max-w-[1800px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href={`/campaigns/${resolvedParams.id}`}
              className="p-2 rounded-lg border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-[#f5a623]" />
                Professional Ad Creatives
              </h1>
              <p className="text-white/50 text-sm">
                16 proven frameworks · 2.9x - 4.8x CTR improvement · Used by 7-8 figure brands
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/creative-studio"
                className="px-4 py-2 rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition flex items-center gap-2 text-sm font-semibold"
              >
                <Layout className="w-4 h-4" />
                All Templates
              </Link>
              <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#f5a623] to-[#ff6b6b] text-white font-bold hover:shadow-lg hover:shadow-[#f5a623]/20 transition flex items-center gap-2 text-sm">
                <Wand2 className="w-4 h-4" />
                Generate with AI
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search frameworks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#f5a623]/50 focus:bg-white/[0.07] transition"
              />
            </div>

            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
              <Filter className="w-4 h-4 text-white/50" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-white/70 text-sm font-semibold focus:outline-none cursor-pointer"
              >
                <option value="winRate">Highest CTR</option>
                <option value="platform">By Platform</option>
              </select>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition ${
                  viewMode === "grid" ? "bg-[#f5a623]/20 text-[#f5a623]" : "text-white/40 hover:text-white/70"
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition ${
                  viewMode === "list" ? "bg-[#f5a623]/20 text-[#f5a623]" : "text-white/40 hover:text-white/70"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar - Categories */}
          <div className="w-64 shrink-0">
            <div className="sticky top-24">
              <div className="mb-6">
                <h3 className="text-xs font-bold text-white/30 uppercase tracking-wider mb-3">Filter by Type</h3>
                <div className="space-y-1">
                  {CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    const isActive = selectedCategory === category.id;
                    const count = category.id === "all"
                      ? allFrameworks.length
                      : allFrameworks.filter(f =>
                          (category.id === "image" && f.format === "image") ||
                          (category.id === "video" && f.format === "video") ||
                          f.platform === category.id
                        ).length;

                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition text-sm font-semibold ${
                          isActive
                            ? "bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20"
                            : "text-white/50 hover:text-white/80 hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4" />
                          {category.label}
                        </div>
                        <span className="text-xs text-white/30">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#f5a623]/10 to-[#ff6b6b]/10 border border-[#f5a623]/20">
                <Zap className="w-5 h-5 text-[#f5a623] mb-2" />
                <h4 className="text-sm font-bold text-white mb-1">Elite Frameworks</h4>
                <p className="text-xs text-white/50 mb-3">Based on $100M+ ad spend data</p>
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <Star className="w-3.5 h-3.5 text-[#f5a623]" />
                  <span>2.9x - 4.8x CTR vs generic ads</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-white/50">
                <span className="text-white font-semibold">{sortedFrameworks.length}</span> frameworks found
              </p>
            </div>

            {/* Framework Grid */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedFrameworks.map((framework) => (
                  <FrameworkCard
                    key={framework.id}
                    framework={framework}
                    onSelect={setSelectedFramework}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {sortedFrameworks.map((framework) => (
                  <FrameworkListItem
                    key={framework.id}
                    framework={framework}
                    onSelect={setSelectedFramework}
                  />
                ))}
              </div>
            )}

            {sortedFrameworks.length === 0 && (
              <div className="text-center py-20">
                <Sparkles className="w-16 h-16 text-white/10 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white/50 mb-2">No frameworks found</h3>
                <p className="text-sm text-white/30 mb-6">Try adjusting your filters or search query</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition text-sm font-semibold"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Framework Modal */}
      {selectedFramework && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="max-w-4xl w-full p-8 rounded-3xl bg-gradient-to-br from-[#0c0a08] to-[#1a1612] border border-white/20 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-black text-white mb-2">{selectedFramework.name}</h2>
                <p className="text-white/70">{selectedFramework.description}</p>
              </div>
              <button
                onClick={() => setSelectedFramework(null)}
                className="text-white/40 hover:text-white text-2xl transition"
              >
                ✕
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-[#f5a623] mb-1">
                  {selectedFramework.winRate.toFixed(1)}x
                </div>
                <div className="text-xs text-white/50">CTR vs Generic</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-[#f5a623] mb-1 uppercase">
                  {selectedFramework.platform}
                </div>
                <div className="text-xs text-white/50">Platform</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-[#f5a623] mb-1 uppercase">
                  {selectedFramework.format}
                </div>
                <div className="text-xs text-white/50">Format</div>
              </div>
            </div>

            {/* Examples from successful brands */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-white/50 mb-3 uppercase tracking-wide">
                Used by these brands:
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedFramework.examples.map((example, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#f5a623]/10 to-[#ff6b6b]/10 border border-[#f5a623]/20 text-sm font-medium text-white/80"
                  >
                    {example}
                  </span>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={() => handleGenerate(selectedFramework)}
              disabled={generatingImage}
              className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-[#f5a623] via-[#ff6b6b] to-[#a855f7] hover:shadow-[0_0_40px_rgba(245,166,35,0.5)] transition-all duration-300 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] text-white"
            >
              {generatingImage ? "Generating..." : "Generate with This Framework"}
            </button>

            {/* Generated Preview */}
            {generatedUrl && (
              <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
                <h4 className="text-sm font-bold mb-3 text-white/50">GENERATED PREVIEW:</h4>
                <img
                  src={generatedUrl}
                  alt="Generated creative"
                  className="w-full rounded-lg"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FrameworkCard({ framework, onSelect }: { framework: CreativeFramework; onSelect: (f: CreativeFramework) => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group relative rounded-xl overflow-hidden border border-white/10 bg-white/[0.02] hover:border-[#f5a623]/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(framework)}
    >
      {/* Thumbnail Preview */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-white/5 to-white/[0.02] overflow-hidden flex items-center justify-center p-6">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-[#f5a623]/30 mx-auto mb-3" />
          <p className="text-xs text-white/30 font-medium">{framework.format.toUpperCase()} AD</p>
        </div>

        {/* Hover Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-2 animate-in fade-in duration-200">
            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#f5a623] to-[#ff6b6b] text-white text-sm font-bold hover:shadow-lg hover:shadow-[#f5a623]/40 transition">
              <Wand2 className="w-4 h-4 inline mr-1" />
              View Details
            </button>
          </div>
        )}

        {/* Win Rate Badge */}
        <div className="absolute top-2 right-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#f5a623] to-[#ff6b6b] text-white text-xs font-bold flex items-center gap-1">
          <Star className="w-3 h-3" />
          {framework.winRate.toFixed(1)}x CTR
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs font-medium text-white/40 uppercase">
            {framework.platform}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs font-medium text-white/40 uppercase">
            {framework.format}
          </span>
        </div>
        <h4 className="font-bold text-white text-sm mb-1">{framework.name}</h4>
        <p className="text-xs text-white/50 line-clamp-2">{framework.description}</p>

        {/* Brand Examples */}
        <div className="flex items-center gap-1 mt-2">
          {framework.examples.slice(0, 2).map((example, i) => (
            <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-white/30">
              {example}
            </span>
          ))}
          {framework.examples.length > 2 && (
            <span className="text-xs text-white/30">+{framework.examples.length - 2}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function FrameworkListItem({ framework, onSelect }: { framework: CreativeFramework; onSelect: (f: CreativeFramework) => void }) {
  return (
    <div
      onClick={() => onSelect(framework)}
      className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-[#f5a623]/30 hover:bg-white/[0.04] transition group cursor-pointer"
    >
      {/* Icon */}
      <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-white/5 to-white/[0.02] shrink-0 flex items-center justify-center border border-white/10">
        <Sparkles className="w-8 h-8 text-[#f5a623]/40" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-bold text-white text-sm">{framework.name}</h4>
          <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-[#f5a623] to-[#ff6b6b] text-white text-xs font-bold">
            {framework.winRate.toFixed(1)}x CTR
          </span>
        </div>
        <p className="text-xs text-white/50 mb-2 line-clamp-1">{framework.description}</p>
        <div className="flex items-center gap-3 text-xs text-white/40">
          <span className="uppercase">{framework.platform}</span>
          <span>•</span>
          <span className="uppercase">{framework.format}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3" />
            {framework.examples.slice(0, 3).join(", ")}
          </span>
        </div>
      </div>

      {/* Action */}
      <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#f5a623] to-[#ff6b6b] text-white text-sm font-bold hover:shadow-lg hover:shadow-[#f5a623]/20 transition flex items-center gap-2">
        View Details
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
