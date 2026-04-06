"use client";

import { ExternalLink, AlertTriangle, Shield, TrendingDown } from "lucide-react";
import type { HimalayaResultsViewModel } from "@/lib/himalaya/types";

type Competitor = {
  url: string;
  headline: string;
  weaknesses: string[];
  benefits?: string[];
  trustSignals?: string[];
  pricing?: string | null;
};

type MarketInsights = {
  commonPricing?: string;
  commonWeaknesses?: string[];
  underservedAngles?: string[];
  commonPromises?: string[];
};

export default function CompetitorCards({ vm }: { vm: HimalayaResultsViewModel }) {
  // Extract intel from raw signals via asset groups
  // The data is in the "Competitive Intelligence" and "Market Analysis" groups
  const intelGroup = vm.assetGroups.find(g => g.title === "Competitive Intelligence");
  const marketGroup = vm.assetGroups.find(g => g.title === "Market Analysis");
  const diffGroup = vm.assetGroups.find(g => g.title === "Your Differentiators");

  if (!intelGroup && !marketGroup) return null;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.03] via-white/[0.02] to-transparent p-4 sm:p-5">
      <h2 className="mb-4 text-[10px] font-black uppercase tracking-widest text-white/30">
        Competitive Intelligence
      </h2>

      {/* Competitor cards */}
      {intelGroup && intelGroup.type === "list" && (
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(intelGroup.content as string[]).map((item, i) => {
            // Parse: "domain: "headline" — Weaknesses: weakness1, weakness2"
            const parts = item.split(" — Weaknesses: ");
            const domainAndHeadline = parts[0] || "";
            const weaknesses = parts[1] || "none detected";
            const colonIdx = domainAndHeadline.indexOf(": ");
            const domain = colonIdx > -1 ? domainAndHeadline.slice(0, colonIdx) : domainAndHeadline;
            const headline = colonIdx > -1 ? domainAndHeadline.slice(colonIdx + 2).replace(/^"|"$/g, "") : "";

            return (
              <div key={i} className="rounded-xl border border-white/[0.05] bg-black/20 p-3.5">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-red-500/10">
                    <TrendingDown className="w-3 h-3 text-red-400/60" />
                  </div>
                  <p className="text-xs font-bold text-white/50 truncate">{domain}</p>
                </div>
                {headline && headline !== "No clear headline" && (
                  <p className="text-[11px] text-white/35 mb-2 line-clamp-2">"{headline}"</p>
                )}
                <div className="flex items-start gap-1.5 rounded-lg border border-amber-500/10 bg-amber-500/[0.04] px-2.5 py-2">
                  <AlertTriangle className="w-3 h-3 text-amber-400/40 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-400/50">{weaknesses}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Market analysis */}
      {marketGroup && marketGroup.type === "kv" && (
        <div className="mb-4 rounded-xl border border-white/[0.04] bg-black/20 p-4">
          <h3 className="mb-3 text-[9px] font-black uppercase tracking-widest text-cyan-400/40">Market Analysis</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(marketGroup.content as { label: string; value: string }[]).map(({ label, value }, i) => (
              <div key={i} className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-3">
                <p className="text-[9px] font-bold text-white/25 uppercase mb-0.5">{label}</p>
                <p className="text-xs text-white/50">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Differentiators */}
      {diffGroup && diffGroup.type === "list" && (
        <div>
          <h3 className="text-[9px] font-black uppercase tracking-widest text-emerald-400/40 mb-2">How You Win</h3>
          <div className="space-y-2">
            {(diffGroup.content as string[]).map((item, i) => (
              <div key={i} className="flex items-start gap-2 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04] px-3 py-3">
                <Shield className="w-3 h-3 text-emerald-400/50 shrink-0 mt-0.5" />
                <p className="text-xs text-white/50">{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
