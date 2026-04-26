"use client";

import { use, useState, useEffect } from "react";
import { IMAGE_FRAMEWORKS, VIDEO_FRAMEWORKS } from "@/lib/ads/professionalCreatives";
import type { CreativeFramework } from "@/lib/ads/professionalCreatives";

export default function CreativesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [selectedFramework, setSelectedFramework] = useState<CreativeFramework | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const allFrameworks = [...IMAGE_FRAMEWORKS, ...VIDEO_FRAMEWORKS];

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
    <div className="min-h-screen bg-[#0c0a08] text-white p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <h1 className="text-4xl font-black mb-3 bg-gradient-to-r from-[#f5a623] via-[#ff6b6b] to-[#a855f7] bg-clip-text text-transparent">
          Professional Ad Creatives
        </h1>
        <p className="text-gray-400 text-lg">
          Choose from proven frameworks used by 7-8 figure brands
        </p>
      </div>

      {/* Framework Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {allFrameworks.map((framework) => (
          <button
            key={framework.id}
            onClick={() => setSelectedFramework(framework)}
            className="group relative p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-[#f5a623]/50 transition-all duration-300 text-left hover:scale-[1.02] hover:-translate-y-1"
          >
            {/* Win Rate Badge */}
            <div className="absolute -top-3 -right-3 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#f5a623] to-[#ff6b6b] text-xs font-bold">
              {framework.winRate.toFixed(1)}x CTR
            </div>

            {/* Platform Badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-full bg-white/5 text-xs font-medium text-gray-400 uppercase">
                {framework.platform}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/5 text-xs font-medium text-gray-400 uppercase">
                {framework.format}
              </span>
            </div>

            {/* Framework Name */}
            <h3 className="text-xl font-bold mb-2 group-hover:text-[#f5a623] transition-colors">
              {framework.name}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-400 mb-4 line-clamp-3">
              {framework.description}
            </p>

            {/* Examples */}
            <div className="flex flex-wrap gap-1.5">
              {framework.examples.slice(0, 3).map((example, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-500"
                >
                  {example}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Selected Framework Detail */}
      {selectedFramework && (
        <div className="max-w-4xl mx-auto p-8 rounded-3xl bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-xl border border-white/20">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-black mb-2">{selectedFramework.name}</h2>
              <p className="text-gray-300">{selectedFramework.description}</p>
            </div>
            <button
              onClick={() => setSelectedFramework(null)}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-white/5">
              <div className="text-2xl font-bold text-[#f5a623] mb-1">
                {selectedFramework.winRate.toFixed(1)}x
              </div>
              <div className="text-xs text-gray-400">CTR vs Generic</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5">
              <div className="text-2xl font-bold text-[#f5a623] mb-1 uppercase">
                {selectedFramework.platform}
              </div>
              <div className="text-xs text-gray-400">Platform</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5">
              <div className="text-2xl font-bold text-[#f5a623] mb-1 uppercase">
                {selectedFramework.format}
              </div>
              <div className="text-xs text-gray-400">Format</div>
            </div>
          </div>

          {/* Examples from successful brands */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wide">
              Used by these brands:
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedFramework.examples.map((example, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#f5a623]/10 to-[#ff6b6b]/10 border border-[#f5a623]/20 text-sm font-medium"
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
            className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-[#f5a623] via-[#ff6b6b] to-[#a855f7] hover:shadow-[0_0_40px_rgba(245,166,35,0.5)] transition-all duration-300 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
          >
            {generatingImage ? "Generating..." : "Generate with This Framework"}
          </button>

          {/* Generated Preview */}
          {generatedUrl && (
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="text-sm font-bold mb-3 text-gray-400">GENERATED PREVIEW:</h4>
              <img
                src={generatedUrl}
                alt="Generated creative"
                className="w-full rounded-lg"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
