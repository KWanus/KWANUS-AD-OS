"use client";

import type { LucideIcon } from "lucide-react";

export default function WorkflowHeader({
  title,
  description,
  icon: Icon,
  center = false,
  className = "",
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  center?: boolean;
  className?: string;
}) {
  if (center) {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500 to-purple-600 shadow-[0_0_40px_rgba(6,182,212,0.3)]">
          <Icon className="h-9 w-9 text-white" />
        </div>
        <h1 className="mb-3 text-3xl font-black text-white md:text-5xl">{title}</h1>
        <p className="max-w-xl text-sm leading-relaxed text-white/45 md:text-base md:leading-8">
          {description}
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-2 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-xl font-black text-white">{title}</h1>
      </div>
      <p className="max-w-lg text-sm text-white/40">{description}</p>
    </div>
  );
}
