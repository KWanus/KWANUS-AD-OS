"use client";

import { ReactNode } from "react";

export function WorkspaceShell({
  children,
  maxWidth = "max-w-5xl",
}: {
  children: ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className="min-h-screen bg-[#020509] text-white">
      <div className={`relative mx-auto w-full px-4 sm:px-6 pb-20 ${maxWidth}`}>
        {children}
      </div>
    </div>
  );
}

export function WorkspaceHero({
  eyebrow,
  title,
  description,
  accent = "from-white to-white/60",
  actions,
  stats,
}: {
  eyebrow: string;
  title: string;
  description: string;
  accent?: string;
  actions?: ReactNode;
  stats?: Array<{ label: string; value: string; tone?: string }>;
}) {
  return (
    <section className="pt-8 pb-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25 mb-2">{eyebrow}</p>
          <h1 className={`bg-gradient-to-r ${accent} bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-3xl`}>
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm leading-relaxed text-white/35">
              {description}
            </p>
          )}
        </div>

        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>

      {stats && stats.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-6">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/20">{stat.label}</p>
              <p className={`text-xl font-black tracking-tight ${stat.tone ?? "text-white"}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
