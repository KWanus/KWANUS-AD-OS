"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BotMessageSquare, Sparkles } from "lucide-react";

const AI_TABS = [
  { href: "/copilot", label: "Copilot", icon: BotMessageSquare, match: (p: string) => p.startsWith("/copilot") },
  { href: "/skills", label: "Skills", icon: Sparkles, match: (p: string) => p.startsWith("/skills") },
];

export default function AISubNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-white/[0.06] bg-[#0c0a08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {AI_TABS.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
                  active
                    ? "border-[#f5a623] text-[#f5a623]"
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
