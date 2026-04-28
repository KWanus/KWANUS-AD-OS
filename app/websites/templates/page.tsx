"use client";

import { useState } from "react";
import SimplifiedNav from "@/components/SimplifiedNav";
import { ALL_WEBSITE_TEMPLATES } from "@/lib/templates/provenWebsiteTemplates";
import {
  Search, Filter, Layout, TrendingUp, Target, Briefcase, Users, Award,
  Star, BarChart3, Zap, Eye, Clock, Sparkles, ArrowRight, CheckCircle2,
  Globe, Smartphone, Shield, Code, Palette, Mountain
} from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { id: "all", label: "All Templates", icon: Layout, count: 13 },
  { id: "ecommerce", label: "E-Commerce", icon: TrendingUp, count: 5 },
  { id: "saas", label: "SaaS B2B", icon: Target, count: 2 },
  { id: "local-service", label: "Local Service", icon: Briefcase, count: 2 },
  { id: "consultant", label: "Consultant/Coach", icon: Users, count: 1 },
  { id: "agency", label: "Creative Agency", icon: Palette, count: 1 },
  { id: "high-converting", label: "Top Performers (4%+ CVR)", icon: Award, count: 6 },
];

// Convert template data to display format
const TEMPLATES = ALL_WEBSITE_TEMPLATES.map((template) => {
  let category = template.category;
  if (template.avgConversionRate >= 4.0) category = "high-converting";

  // Generate thumbnail with template colors
  const bgColor = template.colorScheme.background.replace("#", "");
  const primaryColor = template.colorScheme.primary.replace("#", "");
  const templateName = encodeURIComponent(template.name.split(" ")[0]);
  const thumbnail = `https://placehold.co/400x300/${bgColor}/${primaryColor}?text=${templateName}`;

  return {
    id: template.id,
    title: template.name,
    category,
    subcategory: template.niche,
    thumbnail,
    isPro: template.isPro,
    conversionRate: template.avgConversionRate,
    conversionRange: template.conversionRange,
    brandExample: template.brandExamples[0],
    designTheme: template.designTheme,
    difficulty: template.difficulty,
    buildTime: template.buildTime,
    avgCartRate: template.avgCartRate,
    mobileConversion: template.mobileOptimization.mobileConversionRate,
    loadTime: template.mobileOptimization.loadTime,
  };
});

export default function WebsiteTemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[0] | null>(null);

  const filteredTemplates = TEMPLATES.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.brandExample.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.subcategory.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a]">
      <SimplifiedNav />

      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/[0.08] bg-gradient-to-b from-[#0f0f0f] to-transparent">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]"></div>
        <div className="max-w-7xl mx-auto px-6 py-16 relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30">
              <Globe className="w-7 h-7 text-purple-400" />
            </div>
            <div className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">13 Proven Templates</span>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight">
            Website Templates
          </h1>
          <p className="text-xl text-white/60 max-w-2xl leading-relaxed">
            13 battle-tested website templates with{" "}
            <span className="text-[#10b981] font-bold">2.5-4.7% conversion rates</span> from real Shopify stores.
            <br />
            Dawn, Sense, and Impact-inspired designs built for performance.
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-2xl font-bold text-[#10b981]">2.5-4.7%</div>
              <div className="text-xs text-white/50 uppercase tracking-wider mt-1">Conversion Rate</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-2xl font-bold text-[#f5a623]">7.5%+</div>
              <div className="text-xs text-white/50 uppercase tracking-wider mt-1">Avg Cart Rate</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-2xl font-bold text-blue-400">&lt; 2.5s</div>
              <div className="text-xs text-white/50 uppercase tracking-wider mt-1">Load Time</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-2xl font-bold text-purple-400">90+</div>
              <div className="text-xs text-white/50 uppercase tracking-wider mt-1">Performance Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search & Filters */}
        <div className="mb-8">
          {/* Search Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search 13 proven templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#f5a623]/50 focus:bg-white/[0.07] transition"
              />
            </div>

            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
              <Filter className="w-4 h-4 text-white/50" />
              <span className="text-sm text-white/70">{filteredTemplates.length} templates</span>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                    isActive
                      ? "bg-[#f5a623] text-white"
                      : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80 border border-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.label}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${isActive ? "bg-white/20" : "bg-white/10"}`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="group relative rounded-2xl bg-gradient-to-b from-white/[0.07] to-white/[0.03] border border-white/10 hover:border-[#f5a623]/30 transition-all duration-300 overflow-hidden cursor-pointer"
              onClick={() => setSelectedTemplate(template)}
            >
              {/* Template Thumbnail */}
              <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
                <img
                  src={template.thumbnail}
                  alt={template.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {template.isPro && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#f5a623] text-white text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Pro
                  </div>
                )}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium capitalize">
                  {template.designTheme}
                </div>
              </div>

              {/* Template Info */}
              <div className="p-4">
                <h4 className="font-bold text-white text-sm mb-2 truncate">{template.title}</h4>

                {/* Conversion Rate - Primary Metric */}
                <div className="flex items-center justify-between text-[10px] mb-2">
                  <span className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3 text-[#10b981]" />
                    <span className="text-[#10b981] font-bold">{template.conversionRate}% CVR</span>
                  </span>
                  <span className="text-white/30">·</span>
                  <span className="text-white/50">{template.conversionRange}</span>
                </div>

                {/* Brand Example */}
                <div className="flex items-center justify-between text-xs text-white/40 mb-3">
                  <span className="truncate">Example: {template.brandExample}</span>
                </div>

                {/* Secondary Metrics */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="flex items-center gap-1 text-[10px] text-white/50">
                    <Smartphone className="w-3 h-3 text-blue-400" />
                    <span className="text-blue-400 font-bold">{template.mobileConversion}%</span>
                    <span>Mobile CVR</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-white/50">
                    <Zap className="w-3 h-3 text-[#f5a623]" />
                    <span className="text-[#f5a623] font-bold">{template.loadTime}</span>
                  </div>
                </div>

                {/* Build Info */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <div className="flex items-center gap-1 text-xs">
                    <Clock className="w-3 h-3 text-white/40" />
                    <span className="text-white/60">{template.buildTime}</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 text-xs capitalize">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      template.difficulty === 'beginner' ? 'bg-[#10b981]' :
                      template.difficulty === 'intermediate' ? 'bg-[#f5a623]' :
                      'bg-red-400'
                    }`}></span>
                    <span className="text-white/60">{template.difficulty}</span>
                  </div>
                </div>

                {/* CTA Button */}
                <button className="w-full mt-3 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#f5a623] to-[#f5a623]/80 text-white text-sm font-bold hover:from-[#f5a623]/90 hover:to-[#f5a623]/70 transition-all duration-300 flex items-center justify-center gap-2 group">
                  <span>Use This Template</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-white/30" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No templates found</h3>
            <p className="text-white/50">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Himalaya Integration CTA */}
        <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-purple-500/10 border border-purple-500/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]"></div>
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30">
              <Mountain className="w-12 h-12 text-purple-400" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-bold text-white mb-2">
                Build Your Website with Himalaya AI
              </h3>
              <p className="text-white/60 leading-relaxed">
                Already built your business with Himalaya? Auto-fill these templates with your business details,
                proven copy, and target audience in 60 seconds. No manual work required.
              </p>
            </div>
            <Link
              href="/himalaya"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold hover:from-purple-600 hover:to-blue-600 transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
            >
              <Mountain className="w-5 h-5" />
              <span>Try Himalaya Builder</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Shopify-Inspired Feature Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 rounded-lg bg-[#10b981]/10 border border-[#10b981]/30 flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5 text-[#10b981]" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Proven Conversion Rates</h4>
            <p className="text-sm text-white/60 leading-relaxed">
              Every template includes real conversion data (2.5-4.7%) from successful Shopify stores and top-performing brands.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-4">
              <Smartphone className="w-5 h-5 text-blue-400" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Mobile-First Design</h4>
            <p className="text-sm text-white/60 leading-relaxed">
              Optimized for mobile with 1.8-4.1% mobile conversion rates. Lightning-fast load times (&lt; 2.5s) and 90+ performance scores.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Shopify-Quality Standards</h4>
            <p className="text-sm text-white/60 leading-relaxed">
              Based on Dawn, Sense, and Impact themes. Enterprise-grade SEO, trust signals, and conversion elements built-in.
            </p>
          </div>
        </div>
      </div>

      {/* Template Details Modal (Basic version - can be enhanced) */}
      {selectedTemplate && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setSelectedTemplate(null)}
        >
          <div
            className="bg-[#1a1a1a] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">{selectedTemplate.title}</h2>
              <p className="text-white/60 mb-6">Full template details coming soon...</p>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-6 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
