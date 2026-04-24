"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Users, Send, BarChart2 } from "lucide-react";

const TABS = [
  { href: "/emails", label: "Flows", icon: Zap, exact: true },
  { href: "/emails/broadcasts", label: "Broadcasts", icon: Send, exact: false },
  { href: "/emails/contacts", label: "Contacts", icon: Users, exact: false },
  { href: "/emails/analytics", label: "Analytics", icon: BarChart2, exact: false },
];

export default function EmailSubNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-white/[0.06] bg-[#020509]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {TABS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
                  active
                    ? "border-cyan-500 text-cyan-400"
                    : "border-transparent text-white/35 hover:text-white/60 hover:border-white/20"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
