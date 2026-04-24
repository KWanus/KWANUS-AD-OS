"use client";

import { useState, useEffect } from "react";
import {
  Check, Rocket, Loader2, Copy, Download, Instagram, Facebook,
  ChevronDown, ChevronRight, Sparkles, AlertCircle,
} from "lucide-react";

type AdVariation = {
  id: string;
  name: string;
  type: string;
  platform: string | null;
  status: string;
  content: {
    hook?: string;
    body?: string;
    cta?: string;
    imageBase64?: string;
    angle?: string;
    estimatedCtr?: string;
  };
};

type OrganicPost = {
  id: string;
  platform: string;
  type: string;
  content: string;
  hashtags?: string[];
  scheduleSuggestion: string;
};

const PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram_feed: "Instagram",
  instagram_story: "IG Story",
  tiktok: "TikTok",
  google_search: "Google",
  google_display: "Google Display",
};

const ANGLE_COLORS: Record<string, string> = {
  pain: "bg-red-500/10 text-red-400 border-red-500/20",
  desire: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  proof: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  urgency: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  story: "bg-[#e07850]/10 text-[#e07850] border-[#e07850]/20",
  search: "bg-[#f5a623]/10 text-[#f5a623] border-[#f5a623]/20",
};

export default function AdReviewLaunch({ campaignId }: { campaignId: string }) {
  const [ads, setAds] = useState<AdVariation[]>([]);
  const [organicPosts, setOrganicPosts] = useState<OrganicPost[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [launchResult, setLaunchResult] = useState("");
  const [showOrganic, setShowOrganic] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // Load campaign ads
    fetch(`/api/campaigns/${campaignId}`)
      .then(r => r.json() as Promise<{ ok: boolean; campaign?: { adVariations?: AdVariation[] } }>)
      .then(data => {
        if (data.ok && data.campaign?.adVariations) {
          const variations = data.campaign.adVariations.filter(v =>
            v.type === "hook" || v.type === "image"
          );
          setAds(variations);
          // Auto-select top 5 (first of each angle)
          const autoSelect = new Set<string>();
          const seenAngles = new Set<string>();
          for (const ad of variations) {
            const angle = ad.content.angle ?? "unknown";
            if (!seenAngles.has(angle) && autoSelect.size < 5) {
              autoSelect.add(ad.id);
              seenAngles.add(angle);
            }
          }
          setSelected(autoSelect);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Load organic posts
    fetch(`/api/campaigns/${campaignId}/organic`)
      .then(r => r.json() as Promise<{ ok: boolean; posts?: OrganicPost[] }>)
      .then(data => { if (data.ok && data.posts) setOrganicPosts(data.posts); })
      .catch(() => {});
  }, [campaignId]);

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(ads.map(a => a.id)));
  }

  function selectNone() {
    setSelected(new Set());
  }

  async function handleLaunch() {
    if (selected.size === 0) return;
    setLaunching(true);
    try {
      const res = await fetch("/api/ads/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, platforms: ["meta", "tiktok"] }),
      });
      const data = await res.json() as { ok: boolean; summary?: string; results?: { platform: string; ok: boolean; error?: string }[] };
      setLaunched(true);
      setLaunchResult(data.summary ?? (data.ok ? "Ads launched!" : "Launch had issues — check your ad account connections in Settings."));
    } catch {
      setLaunchResult("Connection error. Try again.");
    } finally {
      setLaunching(false);
    }
  }

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
        <Loader2 className="w-5 h-5 text-white/20 animate-spin mx-auto mb-2" />
        <p className="text-xs text-white/25">Loading your ad creatives...</p>
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
        <p className="text-xs text-white/30">Ad creatives are still generating. Refresh in a moment.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">YOUR AD CREATIVES</p>
          <p className="text-xs text-white/30 mt-0.5">{ads.length} ads generated · {selected.size} selected for launch</p>
        </div>
        <div className="flex gap-2">
          <button onClick={selectAll} className="text-[10px] text-[#f5a623]/50 hover:text-[#f5a623] transition">Select all</button>
          <button onClick={selectNone} className="text-[10px] text-white/20 hover:text-white/40 transition">Clear</button>
        </div>
      </div>

      {/* Ad grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {ads.slice(0, 10).map(ad => {
          const isSelected = selected.has(ad.id);
          const angle = ad.content.angle ?? "unknown";
          const angleStyle = ANGLE_COLORS[angle] ?? "bg-white/5 text-white/40 border-white/10";

          return (
            <div
              key={ad.id}
              onClick={() => toggleSelect(ad.id)}
              className={`relative rounded-xl border cursor-pointer transition overflow-hidden ${
                isSelected ? "border-[#f5a623]/30 bg-[#f5a623]/[0.04]" : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]"
              }`}
            >
              {/* Selection indicator */}
              <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border flex items-center justify-center z-10 ${
                isSelected ? "bg-[#f5a623] border-[#f5a623]" : "border-white/20 bg-black/40"
              }`}>
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>

              {/* Image */}
              {ad.content.imageBase64 && (
                <div className="aspect-square bg-black/20 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ad.content.imageBase64.startsWith("data:") ? ad.content.imageBase64 : `data:image/png;base64,${ad.content.imageBase64}`}
                    alt={ad.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Copy */}
              <div className="p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${angleStyle}`}>
                    {angle}
                  </span>
                  <span className="text-[9px] text-white/20">
                    {PLATFORM_LABELS[ad.platform ?? ""] ?? ad.platform}
                  </span>
                  {ad.content.estimatedCtr && (
                    <span className="text-[9px] text-emerald-400/50">~{ad.content.estimatedCtr} CTR</span>
                  )}
                </div>

                <p className="text-xs font-bold text-white leading-relaxed mb-1">
                  {ad.content.hook}
                </p>
                {ad.content.body && (
                  <p className="text-[11px] text-white/30 line-clamp-2">{ad.content.body}</p>
                )}

                {/* Quick actions */}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); copyText(ad.content.hook ?? "", ad.id); }}
                    className="text-[9px] text-white/20 hover:text-white/50 transition flex items-center gap-1"
                  >
                    {copiedId === ad.id ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                    {copiedId === ad.id ? "Copied" : "Copy"}
                  </button>
                  {ad.content.imageBase64 && (
                    <a
                      href={ad.content.imageBase64.startsWith("data:") ? ad.content.imageBase64 : `data:image/png;base64,${ad.content.imageBase64}`}
                      download={`${ad.name.replace(/\s+/g, "-")}.png`}
                      onClick={e => e.stopPropagation()}
                      className="text-[9px] text-white/20 hover:text-white/50 transition flex items-center gap-1"
                    >
                      <Download className="w-2.5 h-2.5" /> Save
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {ads.length > 10 && (
        <p className="text-[10px] text-white/15 text-center mb-3">
          Showing 10 of {ads.length} · Open campaign for full gallery
        </p>
      )}

      {/* Launch button */}
      {!launched ? (
        <button
          onClick={() => void handleLaunch()}
          disabled={selected.size === 0 || launching}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] py-3.5 text-sm font-bold text-white disabled:opacity-30 hover:opacity-90 transition"
        >
          {launching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
          {launching ? "Launching..." : `Launch ${selected.size} Ads on Meta + TikTok`}
        </button>
      ) : (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 text-center">
          <Check className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-emerald-300">{launchResult}</p>
          <p className="text-[10px] text-white/30 mt-1">Campaigns start PAUSED. Approve them in your ad platform to go live.</p>
        </div>
      )}

      {/* No ad account warning */}
      <div className="flex items-start gap-2 mt-3 px-1">
        <AlertCircle className="w-3 h-3 text-white/15 shrink-0 mt-0.5" />
        <p className="text-[10px] text-white/15">
          No ad account? Copy the ads above and post them manually on Facebook, Instagram, or TikTok for free.
        </p>
      </div>

      {/* Organic posts section */}
      {organicPosts.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowOrganic(!showOrganic)}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-white/40 transition mb-2"
          >
            {showOrganic ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            FREE CONTENT — 7 DAY CALENDAR ({organicPosts.length} posts)
          </button>

          {showOrganic && (
            <div className="space-y-2">
              {organicPosts.map((post, i) => (
                <div key={post.id ?? i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold uppercase text-[#f5a623]/50">{post.platform}</span>
                      <span className="text-[9px] text-white/15">{post.type}</span>
                      <span className="text-[9px] text-white/15">{post.scheduleSuggestion}</span>
                    </div>
                    <button
                      onClick={() => copyText(post.content, `organic-${i}`)}
                      className="text-[9px] text-white/20 hover:text-white/50 transition flex items-center gap-1"
                    >
                      {copiedId === `organic-${i}` ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                      {copiedId === `organic-${i}` ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="text-xs text-white/50 whitespace-pre-wrap">{post.content}</p>
                  {post.hashtags && post.hashtags.length > 0 && (
                    <p className="text-[10px] text-[#f5a623]/30 mt-1">{post.hashtags.map(h => `#${h}`).join(" ")}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
