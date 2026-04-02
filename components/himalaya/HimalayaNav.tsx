"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mountain, History, Bookmark, GitCompare } from "lucide-react";

const NAV_ITEMS = [
  { href: "/himalaya", label: "New", icon: Mountain, exact: true },
  { href: "/himalaya/runs", label: "History", icon: History },
  { href: "/himalaya/templates", label: "Templates", icon: Bookmark },
  { href: "/himalaya/runs/compare", label: "Compare", icon: GitCompare },
];

export default function HimalayaNav() {
  const pathname = usePathname();

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
        </div>
      </div>
    </div>
  );
}
