"use client";

import type { LucideIcon } from "lucide-react";

export default function WorkflowLoading({
  title,
  subtitle,
  icon: Icon,
  steps,
  activeIndex = 0,
  className = "",
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  steps?: string[];
  activeIndex?: number;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#f5a623]/30 bg-[#f5a623]/5">
        <Icon className="h-7 w-7 animate-pulse text-[#f5a623]" />
      </div>
      <h2 className="mb-2 text-xl font-black text-white">{title}</h2>
      <p className="text-sm text-white/40">{subtitle}</p>
      {steps && steps.length > 0 && (
        <div className="mt-8 flex gap-1.5">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                index <= activeIndex ? "w-6 bg-cyan-400" : "w-1.5 bg-white/10"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
