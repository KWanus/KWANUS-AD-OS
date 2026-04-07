"use client";

import type { ReactNode } from "react";

export default function OperatorStatCard({
  label,
  value,
  description,
  tone = "default",
  valueClassName = "",
  children,
}: {
  label: string;
  value: ReactNode;
  description: string;
  tone?: "default" | "accent" | "warning";
  valueClassName?: string;
  children?: ReactNode;
}) {
  const toneClassName =
    tone === "accent"
      ? "border-cyan-500/20 bg-cyan-500/10"
      : tone === "warning"
        ? "border-amber-500/15 bg-amber-500/[0.06]"
        : "border-white/[0.07] bg-black/20";

  return (
    <div className={`rounded-2xl border p-4 ${toneClassName}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/25">{label}</p>
      <div className={`mt-2 text-lg font-black text-white ${valueClassName}`}>{value}</div>
      <p className="mt-1 text-xs leading-5 text-white/35">{description}</p>
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
