"use client";

import type { HimalayaResultsViewModel } from "@/lib/himalaya/types";

export default function ResultsSummary({ vm }: { vm: HimalayaResultsViewModel }) {
  const packet = vm.decisionPacket;
  if (!packet) return null;

  const isImprove = vm.mode === "consultant";

  const blocks: { label: string; value: string }[] = [];

  if (isImprove) {
    if (packet.weaknesses && packet.weaknesses.length > 0) {
      blocks.push({ label: "Biggest Issue", value: packet.weaknesses[0] });
    }
    if (vm.priorities.length > 0) {
      blocks.push({ label: "Highest-Priority Fix", value: vm.priorities[0].label });
    }
    if (packet.angle) {
      blocks.push({ label: "Strategic Direction", value: packet.angle });
    }
  } else {
    if (packet.audience) {
      blocks.push({ label: "Business Direction", value: packet.audience });
    }
    if (packet.angle) {
      blocks.push({ label: "Core Offer Direction", value: packet.angle });
    }
    if (vm.priorities.length > 0) {
      blocks.push({ label: "First Focus", value: vm.priorities[0].label });
    }
  }

  if (blocks.length === 0) return null;

  return (
    <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5">
      <h2 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4">
        {isImprove ? "Improvement Summary" : "Executive Summary"}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {blocks.map(({ label, value }) => (
          <div key={label} className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.05]">
            <p className="text-[9px] font-black uppercase tracking-widest text-cyan-400/50 mb-1.5">{label}</p>
            <p className="text-sm text-white/60 leading-relaxed">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
