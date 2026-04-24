"use client";

import { ReactNode } from "react";

export function WorkspaceShell({
  children,
  maxWidth = "max-w-6xl",
}: {
  children: ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className="min-h-screen bg-[#020509] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        <div className="absolute -top-12 left-[12%] h-[340px] w-[520px] rounded-full bg-cyan-500/8 blur-[130px]" />
        <div className="absolute right-[8%] top-[18%] h-[320px] w-[420px] rounded-full bg-blue-500/8 blur-[130px]" />
        <div className="absolute bottom-[8%] left-[28%] h-[280px] w-[440px] rounded-full bg-emerald-500/6 blur-[130px]" />
      </div>

      <div className={`relative z-10 mx-auto w-full px-4 sm:px-6 pb-20 ${maxWidth}`}>
        {children}
      </div>
    </div>
  );
}

export function WorkspaceHero({
  eyebrow,
  title,
  description,
  accent = "from-cyan-400 via-blue-400 to-emerald-300",
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
    <section className="pt-10 pb-8">
      <div className="rounded-[32px] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] backdrop-blur-xl px-6 py-7 shadow-[0_24px_80px_rgba(0,0,0,0.3)] sm:px-8 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1">
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.7)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.26em] text-cyan-300/80">{eyebrow}</span>
            </div>
            <h1 className={`bg-gradient-to-r ${accent} bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl`}>
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45 sm:text-[15px]">
              {description}
            </p>
          </div>

          {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
        </div>

        {stats && stats.length > 0 && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm px-4 py-4 hover:border-white/[0.12] transition-all">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/28">{stat.label}</p>
                <p className={`mt-2 text-2xl font-black tracking-tight ${stat.tone ?? "text-white"}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
