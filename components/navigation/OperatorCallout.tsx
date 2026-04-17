"use client";

import type { LucideIcon } from "lucide-react";

export default function OperatorCallout({
  icon: Icon,
  eyebrow,
  title,
  description,
  tone = "default",
  className = "",
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  tone?: "default" | "warning" | "accent";
  className?: string;
}) {
  const toneClassName =
    tone === "warning"
      ? "border-amber-500/15 bg-amber-500/[0.06]"
      : tone === "accent"
        ? "border-[#f5a623]/15 bg-[#f5a623]/[0.06]"
        : "border-white/[0.07] bg-black/20";

  const iconClassName =
    tone === "warning"
      ? "text-amber-300"
      : tone === "accent"
        ? "text-[#f5a623]"
        : "text-white/50";

  return (
    <div className={`rounded-2xl border p-4 ${toneClassName} ${className}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 ${iconClassName}`} />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">{eyebrow}</p>
      </div>
      <p className="mt-2 text-sm font-semibold text-white/80">{title}</p>
      <p className="mt-1 text-sm leading-6 text-white/45">{description}</p>
    </div>
  );
}
