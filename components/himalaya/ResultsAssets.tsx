"use client";

import { useState, useEffect } from "react";
import EditableAssetCard from "@/components/himalaya/EditableAssetCard";
import AssetPreviewGate from "@/components/himalaya/AssetPreviewGate";
import type { HimalayaResultsViewModel } from "@/lib/himalaya/types";

export default function ResultsAssets({ vm, onRegenerated }: { vm: HimalayaResultsViewModel; onRegenerated?: () => void }) {
  const [tier, setTier] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 3000);
    fetch("/api/himalaya/access", { signal: controller.signal })
      .then((r) => r.json() as Promise<{ ok: boolean; access?: { tier: string } }>)
      .then((data) => { if (data.ok && data.access) setTier(data.access.tier); })
      .catch(() => setTier("free"));
  }, []);

  if (vm.assetGroups.length === 0) return null;

  // Free tier: show first 3 groups fully, gate the rest
  const freePreviewCount = 3;
  const isFree = tier === "free";

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.03] to-white/[0.015] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-white/30">
          Generated Assets
        </h2>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-black text-white/35">
          {vm.assetGroups.length} groups
        </span>
      </div>
      <div className="space-y-4">
        {vm.assetGroups.map((group, i) => {
          const isGated = isFree && i >= freePreviewCount;

          if (isGated) {
            return (
              <AssetPreviewGate key={i}>
                <EditableAssetCard
                  group={group}
                  analysisId={vm.analysisId}
                  mode={vm.mode}
                  onSaved={onRegenerated}
                  onRegenerated={onRegenerated}
                />
              </AssetPreviewGate>
            );
          }

          return (
            <EditableAssetCard
              key={i}
              group={group}
              analysisId={vm.analysisId}
              mode={vm.mode}
              onSaved={onRegenerated}
              onRegenerated={onRegenerated}
            />
          );
        })}
      </div>
    </div>
  );
}
