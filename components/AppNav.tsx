"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, SignInButton, useUser } from "@clerk/nextjs";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import NotificationBell from "@/components/NotificationBell";
import {
  LayoutDashboard, Globe, Mail, Users, Settings, Zap,
  ScanSearch, Sparkles, FolderOpen, ChevronDown, Search,
  Briefcase, MapPin, TrendingUp, ShoppingCart, Building,
  Package, BotMessageSquare, Building2, Mountain,
} from "lucide-react";

const CreditsDisplay = dynamic(() => import("@/components/CreditsDisplay"), { ssr: false });

// ── Primary nav (always visible) ─────────────────────────────────────────────

const MAIN_NAV = [
  { href: "/",           label: "Home",      icon: LayoutDashboard, match: (p: string) => p === "/" },
  { href: "/himalaya",   label: "Himalaya",  icon: Mountain,        match: (p: string) => p.startsWith("/himalaya") },
  { href: "/scan",       label: "Scan",      icon: ScanSearch,      match: (p: string) => p.startsWith("/scan") || p.startsWith("/analyses") },
  { href: "/campaigns",  label: "Campaigns", icon: FolderOpen,      match: (p: string) => p.startsWith("/campaigns") || p.startsWith("/projects") || p.startsWith("/emails") },
  { href: "/websites",   label: "Sites",     icon: Globe,           match: (p: string) => p.startsWith("/websites") },
  { href: "/clients",    label: "Clients",   icon: Users,           match: (p: string) => p.startsWith("/clients") || p.startsWith("/leads") },
  { href: "/copilot",    label: "AI",        icon: Sparkles,        match: (p: string) => p.startsWith("/copilot") || p.startsWith("/skills") },
];

// ── Business verticals (dropdown) ────────────────────────────────────────────

const BUSINESS_NAV = [
  { href: "/consult",   label: "Consult",   icon: Briefcase,   sub: "Packages, proposals, audits" },
  { href: "/local",     label: "Local",     icon: MapPin,       sub: "SEO, GMB, review requests" },
  { href: "/affiliate", label: "Affiliate", icon: TrendingUp,   sub: "Offer research, funnels" },
  { href: "/dropship",  label: "Dropship",  icon: ShoppingCart,  sub: "Products, profit math, ads" },
  { href: "/agency",    label: "Agency",    icon: Building,      sub: "Client audits, strategy" },
  { href: "/products",  label: "Products",  icon: Package,       sub: "Offer library, sources" },
];

type StatsPayload = {
  databaseUnavailable?: boolean;
};

export default function AppNav() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const [databaseUnavailable, setDatabaseUnavailable] = useState(false);
  const [showBizDropdown, setShowBizDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowBizDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close dropdown on route change
  useEffect(() => { setShowBizDropdown(false); }, [pathname]);

  const isBizActive = BUSINESS_NAV.some(n => pathname.startsWith(n.href));

  return (
    <header className="sticky top-0 z-50">
      {databaseUnavailable && (
        <div className="border-b border-amber-500/20 bg-amber-500/12 px-6 py-2 text-center text-[11px] font-medium text-amber-100 backdrop-blur-xl">
          Production workspace data is temporarily unavailable. The app is running in fallback mode.
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
          {MAIN_NAV.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
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

          {/* Business verticals dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowBizDropdown(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap
                ${isBizActive
                  ? "bg-white/[0.07] text-white border border-white/[0.08]"
                  : "text-white/30 hover:text-white/70 hover:bg-white/[0.04]"
                }`}
            >
              <Building2 className={`w-3.5 h-3.5 ${isBizActive ? "text-cyan-400" : ""}`} />
              <span className="hidden md:block">Business</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showBizDropdown ? "rotate-180" : ""}`} />
            </button>

            {showBizDropdown && (
              <div className="absolute top-full right-0 mt-2 w-64 rounded-2xl border border-white/[0.1] bg-[#0a1020] shadow-2xl overflow-hidden z-50">
                <div className="p-2">
                  {BUSINESS_NAV.map(({ href, label, icon: Icon, sub }) => {
                    const active = pathname.startsWith(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                          active ? "bg-cyan-500/10 text-white" : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${active ? "text-cyan-400" : "text-white/30"}`} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold">{label}</p>
                          <p className="text-[10px] text-white/30 truncate">{sub}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <div className="border-t border-white/[0.06] p-2">
                  <Link
                    href="/my-system"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                      pathname.startsWith("/my-system") ? "bg-cyan-500/10 text-white" : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    <LayoutDashboard className={`w-4 h-4 shrink-0 ${pathname.startsWith("/my-system") ? "text-cyan-400" : "text-white/30"}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold">My System</p>
                      <p className="text-[10px] text-white/30">Business profile & OS config</p>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Search trigger */}
          {isSignedIn && (
            <button
              onClick={() => window.dispatchEvent(new Event("open-global-search"))}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-white/25 hover:text-white/50 hover:border-white/[0.12] transition text-xs"
            >
              <Search className="w-3 h-3" />
              <span>Search</span>
              <kbd className="px-1 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[9px] font-mono text-white/30">/</kbd>
            </button>
          )}
          <CreditsDisplay />
          {isSignedIn && <NotificationBell />}
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
