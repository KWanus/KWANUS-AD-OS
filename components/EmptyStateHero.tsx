"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Step = { label: string };

type Props = {
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  steps?: Step[];
  color?: "cyan" | "purple" | "amber" | "emerald";
};

const COLORS = {
  cyan: "from-[#f5a623]/[0.06] to-[#e07850]/[0.04] border-[#f5a623]/15",
  purple: "from-[#e07850]/[0.06] to-[#f5a623]/[0.04] border-[#e07850]/15",
  amber: "from-amber-500/[0.06] to-orange-500/[0.04] border-amber-500/15",
  emerald: "from-emerald-500/[0.06] to-[#f5a623]/[0.04] border-emerald-500/15",
};

const CTA_COLORS = {
  cyan: "from-[#f5a623] to-[#e07850]",
  purple: "from-[#e07850] to-[#e07850]",
  amber: "from-amber-500 to-orange-600",
  emerald: "from-emerald-500 to-[#e07850]",
};

export default function EmptyStateHero({ icon, title, description, ctaLabel, ctaHref, onCtaClick, steps, color = "cyan" }: Props) {
  return (
    <div className={`bg-gradient-to-br ${COLORS[color]} border rounded-2xl p-8 text-center`}>
      <div className="flex justify-center mb-4">{icon}</div>
      <h2 className="text-lg font-black text-white mb-2">{title}</h2>
      <p className="text-sm text-white/35 max-w-md mx-auto mb-4">{description}</p>

      {steps && steps.length > 0 && (
        <div className="flex items-center justify-center gap-2 mb-5 text-[10px] text-white/25 font-bold">
          {steps.map((s, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-white/10">→</span>}
              <span className="bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded">{s.label}</span>
            </span>
          ))}
        </div>
      )}

      {ctaHref ? (
        <Link
          href={ctaHref}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r ${CTA_COLORS[color]} text-white text-sm font-bold hover:opacity-90 transition`}
        >
          {ctaLabel} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      ) : onCtaClick ? (
        <button
          onClick={onCtaClick}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r ${CTA_COLORS[color]} text-white text-sm font-bold hover:opacity-90 transition`}
        >
          {ctaLabel} <ArrowRight className="w-3.5 h-3.5" />
        </button>
      ) : null}
    </div>
  );
}
