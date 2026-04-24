"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { track } from "@/lib/himalaya/tracking";

type Access = {
  tier: string;
  limits: Record<string, boolean>;
};

/**
 * Wraps asset content. Free tier sees first item + blurred rest.
 * Pro/Business sees everything.
 */
export default function AssetPreviewGate({ children }: { children: React.ReactNode }) {
  const [tier, setTier] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 3000);
    fetch("/api/himalaya/access", { signal: controller.signal })
      .then((r) => r.json() as Promise<{ ok: boolean; access?: Access }>)
      .then((data) => { if (data.ok && data.access) setTier(data.access.tier); })
      .catch(() => setTier("free"));
  }, []);

  if (!tier || tier !== "free") return <>{children}</>;

  return (
    <div className="relative">
      <div className="max-h-24 overflow-hidden">
        {children}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0c0a08] via-[#0c0a08]/90 to-transparent" />

      <div className="relative -mt-4 flex flex-col items-center gap-2 py-4">
        <p className="text-[10px] text-white/30 text-center max-w-xs">
          This is what you need to get results. Unlock to deploy, edit, and track performance.
        </p>
        <Link
          href="/himalaya/upgrade"
          onClick={() => track.upgradeClick("asset_gate")}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#f5a623]/20 to-[#e07850]/20 border border-[#f5a623]/20 text-[11px] font-bold text-[#f5a623] hover:from-[#f5a623]/30 hover:to-[#e07850]/30 transition"
        >
          <Zap className="w-3 h-3" /> Unlock Execution & Assets
        </Link>
      </div>
    </div>
  );
}
