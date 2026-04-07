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
  Package, BotMessageSquare, Building2, Mountain, Wrench, BarChart3, FileText, MessageSquareText,
} from "lucide-react";

const CreditsDisplay = dynamic(() => import("@/components/CreditsDisplay"), { ssr: false });

// ── Primary nav (always visible) ─────────────────────────────────────────────

const MAIN_NAV = [
  { href: "/",           label: "Home",      icon: LayoutDashboard, match: (p: string) => p === "/" },
  { href: "/himalaya",   label: "Himalaya",  icon: Mountain,        match: (p: string) =>
    p.startsWith("/himalaya") ||
    p.startsWith("/scan") ||
    p.startsWith("/analyses") ||
    p.startsWith("/analyze") ||
    p.startsWith("/launch") ||
    p.startsWith("/start") ||
    p.startsWith("/winners") ||
    p.startsWith("/report")
  },
  { href: "/campaigns",  label: "Campaigns", icon: FolderOpen,      match: (p: string) => p.startsWith("/campaigns") || p.startsWith("/projects") },
  { href: "/websites",   label: "Sites",     icon: Globe,           match: (p: string) => p.startsWith("/websites") },
  { href: "/emails",     label: "Emails",    icon: Mail,            match: (p: string) => p.startsWith("/emails") },
  { href: "/clients",    label: "Clients",   icon: Users,           match: (p: string) => p.startsWith("/clients") || p.startsWith("/leads") },
];

// ── Business verticals (dropdown) ────────────────────────────────────────────

const BUSINESS_NAV = [
  { href: "/inbox",     label: "Inbox",     icon: MessageSquareText, sub: "Forms, chat, bookings, replies" },
  { href: "/ads",       label: "Ads",       icon: TrendingUp,   sub: "Spend, ROAS, budget shifts, leaks" },
  { href: "/tools",     label: "Tools",     icon: Wrench,       sub: "Calculators, generators, audits" },
  { href: "/analytics", label: "Analytics", icon: BarChart3,    sub: "Cross-workspace performance and health" },
  { href: "/forms",     label: "Forms",     icon: FileText,     sub: "Opt-in forms, links, and submissions" },
  { href: "/bookings",  label: "Bookings",  icon: Briefcase,    sub: "Public scheduling and appointments" },
  { href: "/revenue",   label: "Revenue",   icon: TrendingUp,   sub: "Sales, orders, email ROI" },
  { href: "/content",   label: "Content",   icon: LayoutDashboard, sub: "7-day social calendar" },
  { href: "/social",    label: "Social",    icon: Globe,         sub: "Generate posts for any platform" },
  { href: "/proposals", label: "Proposals", icon: Briefcase,    sub: "AI client proposals" },
  { href: "/consult",   label: "Consult",   icon: Briefcase,    sub: "Packages, proposals, audits" },
  { href: "/local",     label: "Local",     icon: MapPin,        sub: "SEO, GMB, review requests" },
  { href: "/affiliate", label: "Affiliate", icon: TrendingUp,    sub: "Offer research, funnels" },
  { href: "/dropship",  label: "Dropship",  icon: ShoppingCart,   sub: "Products, profit math, ads" },
  { href: "/agency",    label: "Agency",    icon: Building,       sub: "Client audits, strategy" },
  { href: "/products",  label: "Products",  icon: Package,        sub: "Offer library, sources" },
];

const BUSINESS_GROUPS = [
  {
    title: "Operate",
    items: ["/inbox", "/ads", "/analytics", "/bookings", "/forms", "/revenue"],
  },
  {
    title: "Create",
    items: ["/tools", "/content", "/social", "/proposals", "/products"],
  },
  {
    title: "Verticals",
    items: ["/consult", "/local", "/affiliate", "/dropship", "/agency"],
  },
] as const;

const MOBILE_QUICK_NAV = [
  { href: "/himalaya", label: "Himalaya", icon: Mountain },
  { href: "/inbox", label: "Inbox", icon: MessageSquareText },
  { href: "/ads", label: "Ads", icon: TrendingUp },
  { href: "/bookings", label: "Bookings", icon: Briefcase },
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
  const groupedBusinessNav = BUSINESS_GROUPS.map((group) => ({
    ...group,
    items: group.items
      .map((href) => BUSINESS_NAV.find((item) => item.href === href))
      .filter((item): item is NonNullable<typeof item> => Boolean(item)),
  }));

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
              <div className="absolute top-full right-0 mt-2 w-[22rem] rounded-2xl border border-white/[0.1] bg-[#0a1020] shadow-2xl overflow-hidden z-50">
                <div className="border-b border-white/[0.06] px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">Business Surfaces</p>
                  <p className="mt-1 text-[11px] text-white/35">Operate the system, create assets, or jump into a vertical-specific workspace.</p>
                </div>
                <div className="max-h-[70vh] overflow-y-auto p-2">
                  {groupedBusinessNav.map((group) => (
                    <div key={group.title} className="mb-3 last:mb-0">
                      <div className="px-2 pb-2 pt-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">{group.title}</p>
                      </div>
                      <div className="space-y-1">
                        {group.items.map(({ href, label, icon: Icon, sub }) => {
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
                    </div>
                  ))}
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

      {isSignedIn && (
        <div className="border-b border-white/[0.05] bg-[#040912]/85 px-4 py-2.5 backdrop-blur-2xl lg:hidden">
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {MOBILE_QUICK_NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold transition ${
                    active
                      ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-300"
                      : "border-white/[0.08] bg-white/[0.03] text-white/45 hover:text-white/75"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              );
            })}
            <Link
              href="/settings"
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold transition ${
                pathname.startsWith("/settings")
                  ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-300"
                  : "border-white/[0.08] bg-white/[0.03] text-white/45 hover:text-white/75"
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
