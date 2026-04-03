"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, Zap } from "lucide-react";

type Access = {
  tier: string;
  limits: Record<string, boolean>;
};

/**
 * Wraps asset content. Free tier sees first item + blurred rest.
 * Pro/Business sees everything.
 */
export default function AssetPreviewGate({ children, previewLines }: { children: React.ReactNode; previewLines?: number }) {
  const [tier, setTier] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 3000);
    fetch("/api/himalaya/access", { signal: controller.signal })
      .then((r) => r.json() as Promise<{ ok: boolean; access?: Access }>)
      .then((data) => { if (data.ok && data.access) setTier(data.access.tier); })
      .catch(() => setTier("free")); // default to free on error
  }, []);

  // Loading or paid — show full content
  if (!tier || tier !== "free") return <>{children}</>;

  // Free tier — show preview with blur
  return (
    <div className="relative">
      {/* Preview (first few items visible) */}
      <div className="max-h-24 overflow-hidden">
        {children}
      </div>

      {/* Blur overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#050a14] via-[#050a14]/90 to-transparent" />

      {/* Unlock CTA */}
      <div className="relative -mt-4 flex flex-col items-center gap-2 py-4">
        <div className="flex items-center gap-1.5 text-[10px] text-white/25">
          <Lock className="w-3 h-3" />
          <span>Full content available on Builder plan</span>
        </div>
        <Link
          href="/himalaya/upgrade"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/20 text-[10px] font-bold text-cyan-400 hover:from-cyan-500/30 hover:to-purple-500/30 transition"
        >
          <Zap className="w-3 h-3" /> Unlock Full Assets
        </Link>
      </div>
    </div>
  );
}
