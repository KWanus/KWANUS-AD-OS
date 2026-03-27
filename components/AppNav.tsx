"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, SignInButton, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { LayoutDashboard, Globe, Mail, Users, Settings, Zap, BotMessageSquare, FolderOpen, Sparkles, ScanSearch, Building2, Package, Briefcase, MapPin, TrendingUp, ShoppingCart, Building, Layers3, BarChart2 } from "lucide-react";

const CreditsDisplay = dynamic(() => import("@/components/CreditsDisplay"), { ssr: false });

const NAV_ITEMS = [
  { href: "/",          label: "Home",      icon: LayoutDashboard },
  { href: "/my-system", label: "My System", icon: LayoutDashboard },
  { href: "/copilot",   label: "AI Copilot",icon: BotMessageSquare },
  { href: "/leads",     label: "Leads",     icon: Building2 },
  { href: "/scan",      label: "Scan",      icon: ScanSearch },
  { href: "/analyses",  label: "History",   icon: BarChart2 },
  { href: "/skills",    label: "Skills",    icon: Sparkles },
  { href: "/websites",  label: "Sites",     icon: Globe },
  { href: "/campaigns", label: "Campaigns", icon: FolderOpen },
  { href: "/projects",  label: "Projects",  icon: Layers3 },
  { href: "/emails",    label: "Emails",    icon: Mail },
  { href: "/clients",   label: "Clients",   icon: Users },
  { href: "/products",  label: "Products",  icon: Package },
  { href: "/consult",   label: "Consult",   icon: Briefcase },
  { href: "/local",     label: "Local",     icon: MapPin },
  { href: "/affiliate", label: "Affiliate", icon: TrendingUp },
  { href: "/dropship",  label: "Dropship",  icon: ShoppingCart },
  { href: "/agency",    label: "Agency",    icon: Building },
];

type StatsPayload = {
  databaseUnavailable?: boolean;
};

export default function AppNav() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const [databaseUnavailable, setDatabaseUnavailable] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      setDatabaseUnavailable(false);
      return;
    }

    let cancelled = false;

    async function loadHealth() {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json() as { ok: boolean; stats?: StatsPayload | null };
        if (!cancelled) {
          setDatabaseUnavailable(Boolean(data.ok && data.stats?.databaseUnavailable));
        }
      } catch {
        if (!cancelled) setDatabaseUnavailable(false);
      }
    }

    void loadHealth();
    const interval = setInterval(() => void loadHealth(), 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isSignedIn]);

  return (
    <header className="sticky top-0 z-50">
      {databaseUnavailable && (
        <div className="border-b border-amber-500/20 bg-amber-500/12 px-6 py-2 text-center text-[11px] font-medium text-amber-100 backdrop-blur-xl">
          Production workspace data is temporarily unavailable. The app is running in fallback mode until the database connection is fixed.
        </div>
      )}

      <div className="bg-[#020509]/80 backdrop-blur-2xl border-b border-white/[0.05] px-6 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_16px_rgba(6,182,212,0.4)] group-hover:shadow-[0_0_24px_rgba(6,182,212,0.6)] transition-all duration-300">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-[13px] font-black tracking-tight text-white">Himalaya</span>
            <span className="text-[9px] font-bold tracking-[0.2em] text-white/30 uppercase">Marketing OS</span>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-0.5 overflow-x-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap
                  ${active
                    ? "bg-white/[0.07] text-white border border-white/[0.08]"
                    : "text-white/30 hover:text-white/70 hover:bg-white/[0.04]"
                  }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-cyan-400" : ""}`} />
                <span className="hidden md:block">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          <CreditsDisplay />
          {isSignedIn && (
            <Link href="/settings"
              className={`p-2 rounded-xl transition-all ${pathname.startsWith("/settings") ? "bg-white/[0.07] text-white" : "text-white/25 hover:text-white/60 hover:bg-white/[0.04]"}`}>
              <Settings className="w-3.5 h-3.5" />
            </Link>
          )}
          {isSignedIn ? (
            <UserButton />
          ) : (
            <SignInButton mode="modal">
              <button className="text-xs px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 hover:from-cyan-500/20 hover:to-purple-500/20 border border-white/[0.08] hover:border-white/[0.15] transition font-bold text-white/60 hover:text-white">
                Sign in
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  );
}
