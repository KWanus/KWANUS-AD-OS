"use client";

import { useState } from "react";
import { Loader2, ExternalLink, CheckCircle, AlertTriangle } from "lucide-react";

type Platform = "meta" | "tiktok" | "google";

type Props = {
  campaignId: string;
  campaignName: string;
  hasVariations: boolean;
  hasImages: boolean;
  userPixels: {
    metaPixelId?: string | null;
    tiktokPixelId?: string | null;
    googleAdsId?: string | null;
  } | null;
};

const PLATFORMS: {
  id: Platform;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  connectLabel: string;
  settingsField: string;
}[] = [
  {
    id: "meta",
    label: "Meta Ads",
    icon: "📘",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    connectLabel: "Connect Meta Business account in Settings",
    settingsField: "metaPixelId",
  },
  {
    id: "tiktok",
    label: "TikTok Ads",
    icon: "🎵",
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/20",
    connectLabel: "Connect TikTok Ads account in Settings",
    settingsField: "tiktokPixelId",
  },
  {
    id: "google",
    label: "Google Ads",
    icon: "🔍",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    connectLabel: "Connect Google Ads account in Settings",
    settingsField: "googleAdsId",
  },
];

export default function AdPlatformPush({ campaignId, campaignName, hasVariations, hasImages, userPixels }: Props) {
  const [pushing, setPushing] = useState<Platform | null>(null);
  const [pushed, setPushed] = useState<Set<Platform>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function pushToPlatform(platform: Platform) {
    setPushing(platform);
    setErrors((prev) => ({ ...prev, [platform]: "" }));

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      const data = await res.json() as { ok: boolean; error?: string; campaignId?: string };

      if (data.ok) {
        setPushed((prev) => new Set(prev).add(platform));
      } else {
        setErrors((prev) => ({ ...prev, [platform]: data.error ?? "Push failed" }));
      }
    } catch {
      setErrors((prev) => ({ ...prev, [platform]: "Connection failed" }));
    } finally {
      setPushing(null);
    }
  }

  if (!hasVariations) return null;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Push to Ad Platforms</p>
        {!hasImages && (
          <span className="text-[10px] text-amber-400/60">Generate images first for best results</span>
        )}
      </div>
      <p className="text-xs text-white/40 mb-4">
        Push your ad variations directly to platforms. Campaigns start <span className="text-white/60 font-semibold">paused</span> — you control when to go live.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PLATFORMS.map((p) => {
          const isConnected = userPixels
            ? Boolean(userPixels[p.settingsField as keyof typeof userPixels])
            : false;
          const isPushed = pushed.has(p.id);
          const isPushing = pushing === p.id;
          const error = errors[p.id];

          return (
            <div key={p.id} className={`rounded-xl border p-4 transition ${isPushed ? "border-emerald-500/20 bg-emerald-500/5" : p.borderColor + " " + p.bgColor}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{p.icon}</span>
                <span className={`text-xs font-bold ${isPushed ? "text-emerald-300" : p.color}`}>{p.label}</span>
              </div>

              {isPushed ? (
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span className="font-semibold">Pushed (paused)</span>
                </div>
              ) : isConnected ? (
                <button
                  onClick={() => pushToPlatform(p.id)}
                  disabled={isPushing}
                  className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
                    isPushing
                      ? "bg-white/10 text-white/30 cursor-wait"
                      : "bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
                  }`}
                >
                  {isPushing ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Pushing...</>
                  ) : (
                    <>Push Campaign</>
                  )}
                </button>
              ) : (
                <a
                  href="/settings"
                  className="flex items-center gap-1.5 text-[10px] text-white/30 hover:text-white/50 transition"
                >
                  <ExternalLink className="w-3 h-3" />
                  {p.connectLabel}
                </a>
              )}

              {error && (
                <div className="flex items-center gap-1 mt-2 text-[10px] text-red-400/70">
                  <AlertTriangle className="w-3 h-3" />
                  {error}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
