"use client";

import { useState } from "react";
import Link from "next/link";
import SimplifiedNav from "@/components/SimplifiedNav";
import { ECOMMERCE_TEMPLATES } from "@/lib/templates/provenTemplates";
import {
  Search, Filter, Upload, Download, Sparkles, Layout, Image as ImageIcon,
  Video, FileText, Palette, Wand2, Copy, Trash2, Star, Grid3x3, List,
  ChevronRight, Plus, Folder, Heart, Clock, TrendingUp, Zap, Eye, Mountain,
  Award, Target, BarChart3,
} from "lucide-react";

// Template categories based on proven templates
const CATEGORIES = [
  { id: "all", label: "All Templates", icon: Layout, count: 100 },
  { id: "ecommerce", label: "E-Commerce", icon: TrendingUp, count: 50 },
  { id: "saas", label: "SaaS B2B", icon: Target, count: 50 },
  { id: "meta", label: "Meta/Facebook", icon: ImageIcon, count: 40 },
  { id: "tiktok", label: "TikTok", icon: Video, count: 18 },
  { id: "high-ctr", label: "Top Performers (6%+ CTR)", icon: Award, count: 25 },
];

// Template subcategories based on proven templates
const SUBCATEGORIES = {
  ecommerce: ["Product Demo", "Before/After", "Flash Sale", "Reviews", "Lifestyle", "UGC"],
  saas: ["Problem-Solution", "Feature Highlight", "ROI Calculator", "Case Study", "Free Trial"],
  meta: ["Square (1080x1080)", "Carousel", "Video 15s", "Video 30s"],
  tiktok: ["Viral Demo", "GRWM", "Transformation", "Try-On Haul", "Tutorial"],
  "high-ctr": ["6%+ CTR", "8%+ CTR", "10%+ CTR"],
};

// Convert proven templates to display format
const TEMPLATES = ECOMMERCE_TEMPLATES.map((template, index) => {
  // Determine category based on template properties
  let category = "ecommerce";
  if (template.avgCTR >= 6) category = "high-ctr";
  if (template.platform === "tiktok") category = "tiktok";
  if (template.platform === "meta") category = "meta";

  // Determine subcategory based on visual style
  let subcategory = template.visualStyle === "before-after" ? "Before/After" :
    template.visualStyle === "urgency" ? "Flash Sale" :
    template.visualStyle === "testimonial" ? "Reviews" :
    template.visualStyle === "lifestyle" ? "Lifestyle" :
    template.visualStyle === "ugc" ? "UGC" : "Product Demo";

  // Format display
  const formatDisplay = template.format === "square" ? "1080x1080" :
    template.format === "story" ? "1080x1920" :
    template.format === "video_15s" ? "15s Video" :
    template.format === "video_30s" ? "30s Video" : template.format;

  // Generate thumbnail URL with template colors
  const bgColor = template.designElements.backgroundColor.replace("#", "");
  const primaryColor = template.designElements.primaryColor.replace("#", "");
  const templateName = encodeURIComponent(template.name.split(":")[0].substring(0, 20));
  const thumbnail = `https://placehold.co/400x400/${bgColor}/${primaryColor}?text=${templateName}`;

  return {
    id: template.id,
    title: template.name,
    category,
    subcategory,
    thumbnail,
    isPro: template.isPro,
    uses: Math.floor(template.avgCTR * 1000), // Simulated usage based on CTR
    likes: Math.floor(template.avgCTR * 150), // Simulated likes
    format: formatDisplay,
    // Add proven template data
    ctr: template.avgCTR,
    ctrRange: template.ctrRange,
    brandExample: template.brandExamples[0],
    hook: template.hooks[0]?.text || "",
    platforms: template.platform,
  };
});

export default function CreativeStudioPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"popular" | "recent" | "trending">("popular");

  const filteredTemplates = TEMPLATES.filter((template) => {
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    const matchesSubcategory = !selectedSubcategory || template.subcategory === selectedSubcategory;
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSubcategory && matchesSearch;
  });

  const currentSubcategories = selectedCategory !== "all" && SUBCATEGORIES[selectedCategory as keyof typeof SUBCATEGORIES]
    ? SUBCATEGORIES[selectedCategory as keyof typeof SUBCATEGORIES]
    : [];

  return (
    <div className="min-h-screen bg-[#0c0a08]">
      <SimplifiedNav />

      <div className="max-w-[1800px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-[#f5a623]" />
                Creative Studio
              </h1>
              <p className="text-white/50 text-sm">
                {TEMPLATES.length} proven templates · 2.9x-4.8x better CTR · Real brand examples
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/creative-studio/himalaya"
                className="px-4 py-2 rounded-lg border border-[#f5a623]/30 bg-[#f5a623]/10 text-[#f5a623] hover:bg-[#f5a623]/20 transition flex items-center gap-2 text-sm font-bold"
              >
                <Sparkles className="w-4 h-4" />
                Himalaya Creatives
              </Link>
              <button className="px-4 py-2 rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition flex items-center gap-2 text-sm font-semibold">
                <Upload className="w-4 h-4" />
                Import
              </button>
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
                placeholder="Search 1,500+ templates..."
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
                <option value="popular">Most Popular</option>
                <option value="recent">Recently Added</option>
                <option value="trending">Trending Now</option>
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
              {/* Categories */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-white/30 uppercase tracking-wider mb-3">Categories</h3>
                <div className="space-y-1">
                  {CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    const isActive = selectedCategory === category.id;

                    return (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategory(category.id);
                          setSelectedSubcategory(null);
                        }}
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
                        <span className="text-xs text-white/30">{category.count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subcategories */}
              {currentSubcategories.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-white/30 uppercase tracking-wider mb-3">
                    {CATEGORIES.find(c => c.id === selectedCategory)?.label}
                  </h3>
                  <div className="space-y-1">
                    {currentSubcategories.map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setSelectedSubcategory(selectedSubcategory === sub ? null : sub)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition text-sm ${
                          selectedSubcategory === sub
                            ? "bg-white/10 text-white"
                            : "text-white/40 hover:text-white/70 hover:bg-white/5"
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-[#f5a623]/10 to-[#ff6b6b]/10 border border-[#f5a623]/20">
                <Zap className="w-5 h-5 text-[#f5a623] mb-2" />
                <h4 className="text-sm font-bold text-white mb-1">Quick Generate</h4>
                <p className="text-xs text-white/50 mb-3">Describe your ad, get instant templates</p>
                <button className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-[#f5a623] to-[#ff6b6b] text-white text-xs font-bold hover:shadow-lg hover:shadow-[#f5a623]/20 transition">
                  Generate Now
                </button>
              </div>
            </div>
          </div>

          {/* Main Content - Template Grid */}
          <div className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-white/50">
                <span className="text-white font-semibold">{filteredTemplates.length}</span> templates found
              </p>

              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition text-xs font-semibold flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5" />
                  Favorites
                </button>
                <button className="px-3 py-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition text-xs font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Recent
                </button>
              </div>
            </div>

            {/* Template Grid */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTemplates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTemplates.map((template) => (
                  <TemplateListItem key={template.id} template={template} />
                ))}
              </div>
            )}

            {filteredTemplates.length === 0 && (
              <div className="text-center py-20">
                <Folder className="w-16 h-16 text-white/10 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white/50 mb-2">No templates found</h3>
                <p className="text-sm text-white/30 mb-6">Try adjusting your filters or search query</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setSelectedSubcategory(null);
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
    </div>
  );
}

function TemplateCard({ template }: { template: typeof TEMPLATES[0] }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group relative rounded-xl overflow-hidden border border-white/10 bg-white/[0.02] hover:border-[#f5a623]/30 transition-all duration-300 hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-square bg-white/5 overflow-hidden">
        <img
          src={template.thumbnail}
          alt={template.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Hover Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-2 animate-in fade-in duration-200">
            <Link
              href={`/creative-studio/editor/${template.id}`}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#f5a623] to-[#ff6b6b] text-white text-sm font-bold hover:shadow-lg hover:shadow-[#f5a623]/40 transition"
            >
              <Wand2 className="w-4 h-4 inline mr-1" />
              Customize
            </Link>
            <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition">
              <Eye className="w-4 h-4 text-white" />
            </button>
            <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition">
              <Heart className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        {/* Pro Badge */}
        {template.isPro && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-gradient-to-r from-[#f5a623] to-[#ff6b6b] text-white text-[10px] font-bold flex items-center gap-1">
            <Star className="w-3 h-3" />
            PRO
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h4 className="font-bold text-white text-sm mb-1 truncate">{template.title}</h4>
        <div className="flex items-center justify-between text-[10px] text-white/50 mb-1">
          <span className="flex items-center gap-1">
            <BarChart3 className="w-3 h-3 text-[#10b981]" />
            <span className="text-[#10b981] font-bold">{template.ctr}% CTR</span>
          </span>
          <span className="text-white/30">·</span>
          <span className="truncate">{template.brandExample}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-white/40">
          <span>{template.format}</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Award className="w-3 h-3 text-[#f5a623]" />
              <span className="text-[#f5a623]">{template.ctrRange}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateListItem({ template }: { template: typeof TEMPLATES[0] }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-[#f5a623]/30 hover:bg-white/[0.04] transition group">
      {/* Thumbnail */}
      <div className="w-24 h-24 rounded-lg overflow-hidden bg-white/5 shrink-0">
        <img src={template.thumbnail} alt={template.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-bold text-white text-sm">{template.title}</h4>
          {template.isPro && (
            <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-[#f5a623] to-[#ff6b6b] text-white text-[10px] font-bold">
              PRO
            </span>
          )}
          <span className="px-2 py-0.5 rounded-md bg-[#10b981]/20 text-[#10b981] text-[10px] font-bold flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            {template.ctr}% CTR
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/40">
          <span>{template.brandExample}</span>
          <span>•</span>
          <span>{template.format}</span>
          <span>•</span>
          <span className="flex items-center gap-1 text-[#f5a623]">
            <Award className="w-3 h-3" />
            {template.ctrRange}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {template.likes}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link
          href={`/creative-studio/editor/${template.id}`}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#f5a623] to-[#ff6b6b] text-white text-sm font-bold hover:shadow-lg hover:shadow-[#f5a623]/20 transition"
        >
          Customize
        </Link>
        <button className="p-2 rounded-lg border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition">
          <Copy className="w-4 h-4" />
        </button>
        <button className="p-2 rounded-lg border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition">
          <Heart className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
