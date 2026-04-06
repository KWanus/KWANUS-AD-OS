"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export default function WorkflowSuccess({
  title,
  description,
  icon: Icon,
  accent = "emerald",
  className = "",
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  accent?: "emerald" | "cyan";
  className?: string;
  children?: ReactNode;
}) {
  const accentStyles =
    accent === "cyan"
      ? {
          wrap: "border-cyan-500/25 bg-cyan-500/8",
          iconWrap: "border-cyan-500/25 bg-cyan-500/10",
          icon: "text-cyan-400",
          title: "text-cyan-300",
        }
      : {
          wrap: "border-emerald-500/25 bg-emerald-500/8",
          iconWrap: "border-emerald-500/25 bg-emerald-500/10",
          icon: "text-emerald-400",
          title: "text-emerald-300",
        };

  return (
    <div className={`rounded-2xl border p-5 ${accentStyles.wrap} ${className}`}>
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${accentStyles.iconWrap}`}>
          <Icon className={`h-6 w-6 ${accentStyles.icon}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className={`text-lg font-black ${accentStyles.title}`}>{title}</h2>
          <p className="mt-1 text-sm text-white/50">{description}</p>
        </div>
      </div>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
