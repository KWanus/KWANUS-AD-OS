"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { Image, Video, Loader2, Download, Filter } from "lucide-react";

type Creative = {
  id: string;
  name: string;
  type: "image" | "video";
  platform: string | null;
  status: string;
  campaignId: string;
  campaignName: string;
  imageBase64: string | null;
  videoUrl: string | null;
  model: string | null;
  hookText: string | null;
  createdAt: string;
};

export default function CreativeLibraryPage() {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");

  useEffect(() => {
    fetch("/api/creatives/library")
      .then((r) => r.json() as Promise<{ ok: boolean; creatives?: Creative[] }>)
      .then((data) => { if (data.ok && data.creatives) setCreatives(data.creatives); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? creatives : creatives.filter((c) => c.type === filter);
  const imageCount = creatives.filter((c) => c.type === "image").length;
  const videoCount = creatives.filter((c) => c.type === "video").length;

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Creative Library</h1>
            <p className="text-sm text-white/35 mt-1">All your AI-generated ad images and videos</p>
          </div>
          <div className="flex items-center gap-2">
            {[
              { id: "all" as const, label: `All (${creatives.length})` },
              { id: "image" as const, label: `Images (${imageCount})` },
              { id: "video" as const, label: `Videos (${videoCount})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                  filter === f.id ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" : "border-white/10 bg-white/[0.03] text-white/30"
                }`}
              >
                {f.label}
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
            <Image className="w-10 h-10 text-white/10 mx-auto mb-4" />
            <h2 className="text-lg font-black text-white mb-2">No creatives yet</h2>
            <p className="text-sm text-white/30 max-w-sm mx-auto mb-6">
              Deploy a Himalaya campaign to generate AI ad images and videos automatically.
            </p>
            <Link href="/himalaya" className="text-xs text-cyan-400 hover:text-cyan-300 transition">
              Run Himalaya →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((creative) => (
              <div key={creative.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden group hover:border-cyan-400/20 transition">
                {/* Preview */}
                <div className="aspect-square bg-black/30 relative">
                  {creative.type === "image" && creative.imageBase64 ? (
                    <img
                      src={`data:image/png;base64,${creative.imageBase64}`}
                      alt={creative.name}
                      className="w-full h-full object-cover"
                    />
                  ) : creative.type === "video" && creative.videoUrl ? (
                    <video src={creative.videoUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {creative.type === "video" ? <Video className="w-8 h-8 text-white/10" /> : <Image className="w-8 h-8 text-white/10" />}
                    </div>
                  )}

                  {/* Download overlay */}
                  {creative.imageBase64 && (
                    <a
                      href={`data:image/png;base64,${creative.imageBase64}`}
                      download={`${creative.name.replace(/\s+/g, "-").toLowerCase()}.png`}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                    >
                      <Download className="w-6 h-6 text-white" />
                    </a>
                  )}

                  {/* Type badge */}
                  <span className={`absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    creative.type === "video" ? "bg-purple-500/80 text-white" : "bg-cyan-500/80 text-white"
                  }`}>
                    {creative.type === "video" ? "VIDEO" : "IMAGE"}
                  </span>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-xs font-bold text-white truncate">{creative.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <Link href={`/campaigns/${creative.campaignId}`} className="text-[10px] text-cyan-400/50 hover:text-cyan-400 transition truncate">
                      {creative.campaignName}
                    </Link>
                    {creative.platform && (
                      <span className="text-[9px] text-white/20 border border-white/10 px-1.5 py-0.5 rounded shrink-0 ml-1">
                        {creative.platform}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
