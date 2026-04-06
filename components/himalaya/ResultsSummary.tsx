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
    <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.04] via-white/[0.025] to-transparent p-4 sm:p-5">
      <h2 className="mb-4 text-[10px] font-black uppercase tracking-widest text-white/30">
        {isImprove ? "Improvement Summary" : "Executive Summary"}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {blocks.map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-white/[0.06] bg-black/25 p-3.5 sm:p-4">
            <p className="mb-1.5 text-[9px] font-black uppercase tracking-widest text-cyan-400/50">{label}</p>
            <p className="text-sm leading-relaxed text-white/65">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
