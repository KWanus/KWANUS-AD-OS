"use client";

import { useState, useEffect } from "react";
import AppNav from "@/components/AppNav";
import {
  Loader2, Check, ExternalLink, RefreshCw, AlertTriangle, Shield,
} from "lucide-react";

type OAuthPlatform = {
  connected: boolean;
  connectUrl: string;
};

type OAuthStatus = {
  meta: OAuthPlatform;
  google: OAuthPlatform;
  tiktok: OAuthPlatform;
};

const PLATFORMS = [
  {
    id: "meta" as const,
    label: "Meta (Facebook/Instagram)",
    icon: "📘",
    color: "border-blue-500/20 bg-blue-500/5",
    connectedColor: "border-emerald-500/20 bg-emerald-500/5",
    description: "Run and optimize ads on Facebook and Instagram. Pull performance metrics automatically.",
    features: ["Push ad campaigns", "Pull ROAS/CTR/CPC metrics", "Auto-optimize budgets", "Audience targeting"],
  },
  {
    id: "google" as const,
    label: "Google Ads",
    icon: "🔍",
    color: "border-amber-500/20 bg-amber-500/5",
    connectedColor: "border-emerald-500/20 bg-emerald-500/5",
    description: "Manage Google Search and Display campaigns. Automated bid management.",
    features: ["Search campaigns", "Display campaigns", "Keyword optimization", "Conversion tracking"],
  },
  {
    id: "tiktok" as const,
    label: "TikTok Ads",
    icon: "🎵",
    color: "border-pink-500/20 bg-pink-500/5",
    connectedColor: "border-emerald-500/20 bg-emerald-500/5",
    description: "Create and manage TikTok ad campaigns. Push video ads directly.",
    features: ["Video ad campaigns", "Audience management", "Performance metrics", "Creative optimization"],
  },
];

export default function AdAccountsPage() {
  const [status, setStatus] = useState<OAuthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/oauth/status")
      .then((r) => r.json() as Promise<{ ok: boolean; platforms?: OAuthStatus }>)
      .then((data) => { if (data.ok && data.platforms) setStatus(data.platforms); })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Check for OAuth callback result
    const params = new URLSearchParams(window.location.search);
    const oauthResult = params.get("oauth");
    const provider = params.get("provider");
    if (oauthResult === "success" && provider) {
      // Refresh status
      fetch("/api/oauth/status")
        .then((r) => r.json() as Promise<{ ok: boolean; platforms?: OAuthStatus }>)
        .then((data) => { if (data.ok && data.platforms) setStatus(data.platforms); })
        .catch(() => {});
    }
  }, []);

  if (loading) return <div className="min-h-screen bg-t-bg text-white"><AppNav /><main className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-white/20 animate-spin" /></main></div>;

  const connectedCount = status ? Object.values(status).filter((p) => p.connected).length : 0;

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <AppNav />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#f5a623]/10 border border-[#f5a623]/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#f5a623]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Ad Accounts</h1>
            <p className="text-xs text-white/35">Connect your ad platforms — one click, then Himalaya manages everything</p>
          </div>
        </div>

        {/* Status bar */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connectedCount > 0 ? "bg-emerald-400" : "bg-white/20"}`} />
            <span className="text-xs text-white/40">{connectedCount} of 3 platforms connected</span>
          </div>
          {connectedCount === 0 && (
            <span className="text-[10px] text-amber-400/60 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Connect at least one to enable the ad buying agent
            </span>
          )}
        </div>

        {/* Platform cards */}
        <div className="space-y-4">
          {PLATFORMS.map((platform) => {
            const platformStatus = status?.[platform.id];
            const connected = platformStatus?.connected ?? false;

            return (
              <div key={platform.id} className={`rounded-2xl border p-6 transition ${connected ? platform.connectedColor : platform.color}`}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{platform.icon}</span>
                    <div>
                      <h2 className="text-sm font-bold text-white">{platform.label}</h2>
                      <p className="text-xs text-white/35 mt-0.5">{platform.description}</p>
                    </div>
                  </div>
                  {connected ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-300">Connected</span>
                    </div>
                  ) : (
                    <a
                      href={platformStatus?.connectUrl ?? "#"}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
                    >
                      Connect <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 gap-2">
                  {platform.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px] text-white/30">
                      <Check className={`w-3 h-3 shrink-0 ${connected ? "text-emerald-400" : "text-white/15"}`} />
                      {feature}
                    </div>
                  ))}
                </div>

                {connected && (
                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[10px] text-emerald-400/50">Account ID extracted automatically</span>
                    <button
                      onClick={() => { window.location.href = platformStatus?.connectUrl ?? "#"; }}
                      className="text-[10px] text-white/20 hover:text-white/40 transition flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Reconnect
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* What happens after connecting */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 mt-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">What Happens When You Connect</p>
          <ol className="space-y-2 text-xs text-white/40">
            <li className="flex items-start gap-2"><span className="text-[#f5a623] font-bold shrink-0">1.</span> Himalaya pulls your campaign performance data automatically</li>
            <li className="flex items-start gap-2"><span className="text-[#f5a623] font-bold shrink-0">2.</span> The ad buying agent starts monitoring and optimizing your campaigns</li>
            <li className="flex items-start gap-2"><span className="text-[#f5a623] font-bold shrink-0">3.</span> Smart budget allocator shifts spend to the highest-ROAS platform</li>
            <li className="flex items-start gap-2"><span className="text-[#f5a623] font-bold shrink-0">4.</span> You see unified metrics across all platforms in the Ads dashboard</li>
            <li className="flex items-start gap-2"><span className="text-[#f5a623] font-bold shrink-0">5.</span> Proactive alerts notify you when ROAS drops or campaigns need attention</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
