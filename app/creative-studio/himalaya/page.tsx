"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import SimplifiedNav from "@/components/SimplifiedNav";
import {
  Search, Filter, Sparkles, Layout, Image as ImageIcon,
  Video, TrendingUp, Zap, Eye, Heart, Clock, Grid3x3, List,
  Wand2, Mountain, ArrowRight, Star,
} from "lucide-react";

type HimalayaProject = {
  id: string;
  title: string;
  niche: string;
  createdAt: string;
};

type AdCreative = {
  platform: string;
  format: string;
  hook: string;
  visualStyle: string;
  imagePrompt: string;
  videoScript?: {
    duration: string;
    hook: string;
    problem: string;
    solution: string;
    cta: string;
  };
};

type HimalayaAnalysis = {
  id: string;
  title: string;
  niche: string;
  foundation?: {
    adCreatives?: AdCreative[];
    marketingAngles?: { hook: string; angle: string; platform: string }[];
    websiteBlueprint?: {
      headline: string;
      subheadline: string;
    };
    offerDirection?: {
      coreOffer: string;
      transformation: string;
    };
  };
};

export default function HimalayaCreativeStudioPage() {
  const { user } = useUser();
  const [projects, setProjects] = useState<HimalayaProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<HimalayaAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    loadHimalayaProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadProjectAnalysis(selectedProject);
    }
  }, [selectedProject]);

  const loadHimalayaProjects = async () => {
    try {
      const res = await fetch("/api/himalaya/projects");
      const data = await res.json();
      setProjects(data || []);
      if (data && data.length > 0) {
        setSelectedProject(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load Himalaya projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectAnalysis = async (projectId: string) => {
    try {
      const res = await fetch(`/api/analyses/${projectId}`);
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      console.error("Failed to load analysis:", err);
    }
  };

  const generateCreativesFromHimalaya = async () => {
    if (!analysis?.foundation?.adCreatives) return;

    // Generate actual ad creatives using Himalaya data
    const response = await fetch("/api/creative/generate-from-himalaya", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        analysisId: analysis.id,
        adCreatives: analysis.foundation.adCreatives,
        niche: analysis.niche,
        headline: analysis.foundation?.websiteBlueprint?.headline,
        offer: analysis.foundation?.offerDirection?.coreOffer,
      }),
    });

    const result = await response.json();
    console.log("Generated creatives:", result);
  };

  const adCreatives = analysis?.foundation?.adCreatives || [];
  const marketingAngles = analysis?.foundation?.marketingAngles || [];

  const filteredCreatives = adCreatives.filter((creative) =>
    creative.hook.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creative.platform.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0c0a08]">
      <SimplifiedNav />

      <div className="max-w-[1800px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                <Mountain className="w-8 h-8 text-[#f5a623]" />
                Himalaya Creative Studio
              </h1>
              <p className="text-white/50 text-sm">
                Generate professional ad creatives from your Himalaya business analysis
              </p>
            </div>

            <Link
              href="/creative-studio"
              className="px-4 py-2 rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition flex items-center gap-2 text-sm font-semibold"
            >
              <Sparkles className="w-4 h-4" />
              Browse All Templates
            </Link>
          </div>

          {/* Project Selector */}
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-[#f5a623]/10 to-[#ff6b6b]/10 border border-[#f5a623]/20">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">
                  Select Himalaya Project
                </label>
                <select
                  value={selectedProject || ""}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full max-w-md px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-semibold focus:outline-none focus:border-[#f5a623]/50"
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id} className="bg-[#1a1a1a]">
                      {project.title || project.niche}
                    </option>
                  ))}
                </select>
              </div>

              {analysis && (
                <button
                  onClick={generateCreativesFromHimalaya}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#f5a623] to-[#ff6b6b] text-white font-bold hover:shadow-lg hover:shadow-[#f5a623]/20 transition flex items-center gap-2"
                >
                  <Wand2 className="w-5 h-5" />
                  Generate All Creatives
                </button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder={`Search ${adCreatives.length} AI-generated creative ideas...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#f5a623]/50 focus:bg-white/[0.07] transition"
              />
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

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-[#f5a623]/20 border-t-[#f5a623] rounded-full animate-spin mb-4" />
            <p className="text-white/50 text-sm">Loading your Himalaya projects...</p>
          </div>
        ) : !analysis ? (
          <div className="text-center py-20">
            <Mountain className="w-16 h-16 text-white/10 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white/50 mb-2">No Himalaya Analysis Found</h3>
            <p className="text-sm text-white/30 mb-6">Create a business with Himalaya first to generate ad creatives</p>
            <Link
              href="/himalaya"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[#f5a623] to-[#ff6b6b] text-white font-bold hover:shadow-lg hover:shadow-[#f5a623]/20 transition"
            >
              <Mountain className="w-5 h-5" />
              Go to Himalaya
            </Link>
          </div>
        ) : (
          <>
            {/* Business Context */}
            <div className="mb-6 p-6 rounded-xl bg-white/[0.02] border border-white/10">
              <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-3">Business Context</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-white/30 mb-1">Headline</p>
                  <p className="text-sm font-semibold text-white">{analysis.foundation?.websiteBlueprint?.headline || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-white/30 mb-1">Core Offer</p>
                  <p className="text-sm font-semibold text-white">{analysis.foundation?.offerDirection?.coreOffer || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Ad Creatives Grid */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#f5a623]" />
                  AI-Generated Ad Creatives ({filteredCreatives.length})
                </h3>
              </div>

              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredCreatives.map((creative, idx) => (
                    <CreativeCard key={idx} creative={creative} analysisId={analysis.id} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCreatives.map((creative, idx) => (
                    <CreativeListItem key={idx} creative={creative} analysisId={analysis.id} />
                  ))}
                </div>
              )}
            </div>

            {/* Marketing Angles */}
            {marketingAngles.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#f5a623]" />
                  Marketing Angles ({marketingAngles.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {marketingAngles.map((angle, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-[#f5a623]/30 transition"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 rounded-md bg-[#f5a623]/20 text-[#f5a623] text-[10px] font-bold">
                          {angle.platform}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white mb-1">{angle.hook}</p>
                      <p className="text-xs text-white/50">{angle.angle}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CreativeCard({ creative, analysisId }: { creative: AdCreative; analysisId: string }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group relative rounded-xl overflow-hidden border border-white/10 bg-white/[0.02] hover:border-[#f5a623]/30 transition-all duration-300 hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail Preview */}
      <div className="relative aspect-square bg-gradient-to-br from-[#f5a623]/20 to-[#ff6b6b]/20 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <p className="text-center text-sm font-bold text-white/70 line-clamp-3">{creative.hook}</p>
        </div>

        {/* Hover Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-2 animate-in fade-in duration-200">
            <Link
              href={`/creative-studio/editor/${analysisId}?creative=${encodeURIComponent(JSON.stringify(creative))}`}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#f5a623] to-[#ff6b6b] text-white text-sm font-bold hover:shadow-lg hover:shadow-[#f5a623]/40 transition"
            >
              <Wand2 className="w-4 h-4 inline mr-1" />
              Design Ad
            </Link>
          </div>
        )}

        {/* Platform Badge */}
        <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-gradient-to-r from-[#f5a623] to-[#ff6b6b] text-white text-[10px] font-bold flex items-center gap-1">
          <Star className="w-3 h-3" />
          {creative.platform}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs text-white/40 mb-1">{creative.format}</p>
        <p className="text-xs text-white/60 line-clamp-2">{creative.visualStyle}</p>
      </div>
    </div>
  );
}

function CreativeListItem({ creative, analysisId }: { creative: AdCreative; analysisId: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-[#f5a623]/30 hover:bg-white/[0.04] transition group">
      {/* Icon */}
      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#f5a623]/20 to-[#ff6b6b]/20 shrink-0 flex items-center justify-center">
        {creative.format.includes("video") ? (
          <Video className="w-8 h-8 text-[#f5a623]" />
        ) : (
          <ImageIcon className="w-8 h-8 text-[#f5a623]" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded-md bg-[#f5a623]/20 text-[#f5a623] text-[10px] font-bold">
            {creative.platform}
          </span>
          <span className="text-xs text-white/40">{creative.format}</span>
        </div>
        <p className="font-bold text-white text-sm mb-1">{creative.hook}</p>
        <p className="text-xs text-white/40 line-clamp-1">{creative.visualStyle}</p>
      </div>

      {/* Actions */}
      <Link
        href={`/creative-studio/editor/${analysisId}?creative=${encodeURIComponent(JSON.stringify(creative))}`}
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#f5a623] to-[#ff6b6b] text-white text-sm font-bold hover:shadow-lg hover:shadow-[#f5a623]/20 transition flex items-center gap-2"
      >
        <Wand2 className="w-4 h-4" />
        Design Ad
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
