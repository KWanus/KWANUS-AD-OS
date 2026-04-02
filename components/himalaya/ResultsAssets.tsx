"use client";

import EditableAssetCard from "@/components/himalaya/EditableAssetCard";
import type { HimalayaResultsViewModel } from "@/lib/himalaya/types";

export default function ResultsAssets({ vm, onRegenerated }: { vm: HimalayaResultsViewModel; onRegenerated?: () => void }) {
  if (vm.assetGroups.length === 0) return null;

  return (
    <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
      <h2 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4">
        Generated Assets
      </h2>
      <div className="space-y-4">
        {vm.assetGroups.map((group, i) => (
          <EditableAssetCard
            key={i}
            group={group}
            analysisId={vm.analysisId}
            mode={vm.mode}
            onSaved={onRegenerated}
            onRegenerated={onRegenerated}
          />
        ))}
      </div>
    </div>
  );
}
