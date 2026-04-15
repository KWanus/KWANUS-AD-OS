"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, SignInButton, useUser } from "@clerk/nextjs";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import NotificationBell from "@/components/NotificationBell";
import {
  Home, Mountain, FolderKanban, Globe, Mail, Users, Settings,
  Search, ChevronDown, LayoutGrid,
  MessageSquareText, TrendingUp, BarChart3, Briefcase, FileText,
  MapPin, ShoppingCart, Building2, Package, Wrench,
} from "lucide-react";

const CreditsDisplay = dynamic(() => import("@/components/CreditsDisplay"), { ssr: false });

// ── Primary nav — 6 items max ────────────────────────────────────────────────

const NAV = [
  { href: "/",          label: "Home",      icon: Home,          match: (p: string) => p === "/" || p === "/dashboard" },
  { href: "/himalaya",  label: "Himalaya",  icon: Mountain,      match: (p: string) => ["/himalaya","/scan","/analyses","/analyze","/launch","/start","/winners","/report"].some(r => p.startsWith(r)) },
  { href: "/campaigns", label: "Campaigns", icon: FolderKanban,  match: (p: string) => p.startsWith("/campaigns") || p.startsWith("/projects") },
  { href: "/websites",  label: "Sites",     icon: Globe,         match: (p: string) => p.startsWith("/websites") },
  { href: "/emails",    label: "Emails",    icon: Mail,          match: (p: string) => p.startsWith("/emails") },
  { href: "/clients",   label: "CRM",       icon: Users,         match: (p: string) => p.startsWith("/clients") || p.startsWith("/leads") },
];

// ── More menu ────────────────────────────────────────────────────────────────

const MORE = [
  { href: "/inbox",      label: "Inbox",      icon: MessageSquareText },
  { href: "/ads",        label: "Ads",        icon: TrendingUp },
  { href: "/analytics",  label: "Analytics",  icon: BarChart3 },
  { href: "/bookings",   label: "Bookings",   icon: Briefcase },
  { href: "/forms",      label: "Forms",      icon: FileText },
  { href: "/revenue",    label: "Revenue",    icon: TrendingUp },
  { href: "/tools",      label: "Tools",      icon: Wrench },
  { href: "/content",    label: "Content",    icon: LayoutGrid },
  { href: "/proposals",  label: "Proposals",  icon: Briefcase },
  { href: "/products",   label: "Products",   icon: Package },
  { href: "/consult",    label: "Consult",    icon: Briefcase },
  { href: "/local",      label: "Local",      icon: MapPin },
  { href: "/affiliate",  label: "Affiliate",  icon: TrendingUp },
  { href: "/dropship",   label: "Dropship",   icon: ShoppingCart },
  { href: "/agency",     label: "Agency",     icon: Building2 },
  { href: "/my-system",  label: "My System",  icon: Settings },
];

export default function AppNav() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setShowMore(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => { setShowMore(false); }, [pathname]);

  return (
    <header className="sticky top-0 z-50 bg-[#0c0a08]/90 backdrop-blur-xl border-b border-white/[0.04]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#f5a623] to-[#e07850] flex items-center justify-center">
            <Mountain className="w-3.5 h-3.5 text-[#0c0a08]" />
          </div>
          <span className="hidden sm:block text-sm font-black text-white tracking-tight">Himalaya</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-0.5">
          {NAV.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition whitespace-nowrap
                  ${active ? "bg-white/[0.08] text-white" : "text-white/30 hover:text-white/60"}`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-[#f5a623]" : ""}`} />
                <span className="hidden md:block">{label}</span>
              </Link>
            );
          })}

          {/* More */}
          <div className="relative" ref={moreRef}>
            <button onClick={() => setShowMore(v => !v)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition
                ${showMore ? "bg-white/[0.08] text-white" : "text-white/30 hover:text-white/60"}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <ChevronDown className={`w-3 h-3 transition ${showMore ? "rotate-180" : ""}`} />
            </button>

            {showMore && (
              <div className="absolute top-full right-0 mt-1.5 w-48 rounded-xl border border-white/[0.08] bg-[#0a0f1a]/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50 py-1">
                {MORE.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href}
                    className={`flex items-center gap-2.5 px-3 py-2 text-[11px] font-semibold transition
                      ${pathname.startsWith(href) ? "bg-[#f5a623]/10 text-white" : "text-white/45 hover:bg-white/[0.04] hover:text-white/80"}`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${pathname.startsWith(href) ? "text-[#f5a623]" : "text-white/25"}`} />
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Right */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isSignedIn && (
            <button onClick={() => window.dispatchEvent(new Event("open-global-search"))}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.06] text-white/20 hover:text-white/50 transition text-[11px]">
              <Search className="w-3 h-3" />
              <kbd className="px-1 py-0.5 rounded bg-white/[0.05] text-[9px] font-mono text-white/25">/</kbd>
            </button>
          )}
          <CreditsDisplay />
          {isSignedIn && <NotificationBell />}
          {isSignedIn && (
            <Link href="/settings" className={`p-1.5 rounded-lg transition ${pathname.startsWith("/settings") ? "bg-white/[0.08] text-white" : "text-white/20 hover:text-white/50"}`}>
              <Settings className="w-3.5 h-3.5" />
            </Link>
          )}
          {isSignedIn ? <UserButton /> : (
            <SignInButton mode="modal">
              <button className="text-[11px] px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] font-semibold text-white/50 hover:text-white transition">
                Sign in
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  );
}
