"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AppNav from "@/components/AppNav";
import {
  LayoutGrid,
  Users,
  Kanban,
  BarChart2,
  Plus,
  Settings,
} from "lucide-react";

const CRM_TABS = [
  { href: "/clients", label: "Clients", icon: Users, exact: true },
  { href: "/clients/pipeline", label: "Pipeline", icon: Kanban, exact: false },
  { href: "/clients/dashboard", label: "Dashboard", icon: BarChart2, exact: false },
];

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />

      {/* CRM sub-nav */}
      <div className="border-b border-white/[0.06] bg-[#050a14] sticky top-[57px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <nav className="flex items-center gap-1">
            {CRM_TABS.map(({ href, label, icon: Icon, exact }) => {
              const active = exact
                ? pathname === href
                : pathname.startsWith(href) && pathname !== "/clients";
              const isClients = exact && pathname === "/clients";
              const finalActive = isClients || (!exact && pathname.startsWith(href));
              const realActive = exact ? pathname === href : pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
                    realActive
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

          <Link
            href="/clients/new"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-bold hover:opacity-90 transition-opacity my-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Client
          </Link>
        </div>
      </div>

      {children}
    </div>
  );
}
