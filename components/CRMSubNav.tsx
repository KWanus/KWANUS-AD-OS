"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Kanban, Building2, BarChart2, Plus } from "lucide-react";

const CRM_TABS = [
  { href: "/clients", label: "Clients", icon: Users, match: (p: string) => p === "/clients" || (p.startsWith("/clients/") && !p.startsWith("/clients/pipeline") && !p.startsWith("/clients/dashboard") && !p.startsWith("/clients/new")) },
  { href: "/clients/pipeline", label: "Pipeline", icon: Kanban, match: (p: string) => p.startsWith("/clients/pipeline") },
  { href: "/leads", label: "Leads", icon: Building2, match: (p: string) => p.startsWith("/leads") },
  { href: "/clients/dashboard", label: "Dashboard", icon: BarChart2, match: (p: string) => p.startsWith("/clients/dashboard") },
];

export default function CRMSubNav({ showAddButton = false }: { showAddButton?: boolean }) {
  const pathname = usePathname();

  return (
    <div className="border-b border-white/[0.06] bg-[#020509]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {CRM_TABS.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
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

        {showAddButton && (
          <Link
            href="/clients/new"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold hover:opacity-90 transition-opacity my-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Client
          </Link>
        )}
      </div>
    </div>
  );
}
