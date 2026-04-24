"use client";

import Link from "next/link";

type WorkflowGuideItem = {
  title: string;
  description: string;
  href?: string;
  active?: boolean;
};

export default function WorkflowGuide({
  items,
  className = "mb-6",
}: {
  items: WorkflowGuideItem[];
  className?: string;
}) {
  return (
    <div className={`${className} grid gap-2 md:grid-cols-3`}>
      {items.map((item) => {
        const classes = item.active
          ? "rounded-2xl border border-[#f5a623]/20 bg-[#f5a623]/10 p-4"
          : "rounded-2xl border border-white/[0.06] bg-black/20 p-4 transition hover:border-white/[0.12] hover:bg-white/[0.04]";
        const content = (
          <>
            <p className={`text-xs font-black ${item.active ? "text-[#f5a623]" : "text-white"}`}>{item.title}</p>
            <p className={`mt-1 text-[11px] leading-5 ${item.active ? "text-white/55" : "text-white/45"}`}>{item.description}</p>
          </>
        );

        return item.href ? (
          <Link key={item.title} href={item.href} className={classes}>
            {content}
          </Link>
        ) : (
          <div key={item.title} className={classes}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
