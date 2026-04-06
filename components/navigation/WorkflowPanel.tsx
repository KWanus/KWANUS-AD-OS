"use client";

import type { ReactNode } from "react";

export default function WorkflowPanel({
  title,
  description,
  eyebrow,
  className = "",
  children,
}: {
  title?: string;
  description?: string;
  eyebrow?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 ${className}`}>
      {(eyebrow || title || description) && (
        <div className="mb-4">
          {eyebrow && <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/30">{eyebrow}</p>}
          {title && <h2 className="text-lg font-black text-white">{title}</h2>}
          {description && <p className="mt-1 text-sm leading-6 text-white/45">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
