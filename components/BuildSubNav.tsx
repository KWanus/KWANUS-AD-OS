"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderOpen, Mail, Zap, Send, Users, BarChart2, Layers3, FileText } from "lucide-react";

const CAMPAIGN_TABS = [
  { href: "/campaigns", label: "Campaigns", icon: FolderOpen, match: (p: string) => p === "/campaigns" || (p.startsWith("/campaigns/") && !p.includes("/automations")) },
  { href: "/emails", label: "Flows", icon: Zap, match: (p: string) => p === "/emails" || p.startsWith("/emails/flows") },
  { href: "/emails/broadcasts", label: "Broadcasts", icon: Send, match: (p: string) => p.startsWith("/emails/broadcasts") },
  { href: "/emails/contacts", label: "Contacts", icon: Users, match: (p: string) => p.startsWith("/emails/contacts") },
  { href: "/forms", label: "Forms", icon: FileText, match: (p: string) => p === "/forms" },
  { href: "/campaigns/automations", label: "Automations", icon: Layers3, match: (p: string) => p.startsWith("/campaigns/automations") },
  { href: "/emails/analytics", label: "Analytics", icon: BarChart2, match: (p: string) => p.startsWith("/emails/analytics") },
];

export default function CampaignSubNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-white/[0.06] bg-[#0c0a08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {CAMPAIGN_TABS.map(({ href, label, icon: Icon, match }) => {
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
