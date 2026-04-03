"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mountain, History, Bookmark, GitCompare, Zap } from "lucide-react";

const NAV_ITEMS = [
  { href: "/himalaya", label: "New", icon: Mountain, exact: true },
  { href: "/himalaya/runs", label: "History", icon: History },
  { href: "/himalaya/templates", label: "Templates", icon: Bookmark },
  { href: "/himalaya/runs/compare", label: "Compare", icon: GitCompare },
];

const TIER_BADGE: Record<string, { label: string; color: string }> = {
  free: { label: "Free", color: "text-white/25 bg-white/[0.03] border-white/[0.06]" },
  pro: { label: "Builder", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  business: { label: "Operator", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
};

export default function HimalayaNav() {
  const pathname = usePathname();
  const [tier, setTier] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 3000);
    fetch("/api/himalaya/access", { signal: controller.signal })
      .then((r) => r.json() as Promise<{ ok: boolean; access?: { tier: string } }>)
      .then((data) => { if (data.ok && data.access) setTier(data.access.tier); })
      .catch(() => {});
  }, []);

  const badge = tier ? TIER_BADGE[tier] : null;

  return (
    <div className="border-b border-white/[0.06] bg-white/[0.01]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-1 h-10 overflow-x-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                  active
                    ? "bg-white/[0.06] text-white/70"
                    : "text-white/25 hover:text-white/50 hover:bg-white/[0.03]"
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </Link>
            );
          })}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Tier badge */}
          {badge && (
            tier === "free" ? (
              <Link
                href="/himalaya/upgrade"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition hover:border-cyan-500/20 hover:text-cyan-400/60 text-white/25 bg-white/[0.03] border-white/[0.06]"
              >
                <Zap className="w-2.5 h-2.5" /> Upgrade
              </Link>
            ) : (
              <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold ${badge.color}`}>
                {badge.label}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}
