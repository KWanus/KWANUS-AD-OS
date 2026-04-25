"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, SignInButton, useUser } from "@clerk/nextjs";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import NotificationBell from "@/components/NotificationBell";
import {
  Home, Mountain, FolderKanban, Globe, Mail, Users, Settings,
  Search, ChevronDown, LayoutGrid, Sun, Moon, Sparkles,
  MessageSquareText, TrendingUp, BarChart3, Briefcase, FileText,
  MapPin, ShoppingCart, Building2, Package, Wrench, Send, Share2, Code2, Store, BookOpen,
} from "lucide-react";
import { useTheme, type ThemeMode } from "@/lib/theme/ThemeProvider";

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

// Pruned from 18 to 8 items (audit: 16+ items is overwhelming)
const MORE = [
  { href: "/inbox",      label: "Inbox",      icon: MessageSquareText },
  { href: "/analytics",  label: "Analytics",  icon: BarChart3 },
  { href: "/revenue-analytics", label: "CRM Revenue", icon: TrendingUp },
  { href: "/revenue",    label: "Store Revenue", icon: DollarSign },
  { href: "/orders",     label: "Orders",     icon: ShoppingCart },
  { href: "/websites/submissions", label: "Submissions", icon: FileText },
  { href: "/affiliate",  label: "Referrals",  icon: Share2 },
  { href: "/marketplace",label: "Marketplace", icon: Store },
  { href: "/tools",      label: "Tools",      icon: Wrench },
  { href: "/outreach",   label: "Outreach",   icon: Send },
  { href: "/leads",      label: "Leads",      icon: TrendingUp },
  { href: "/agents",     label: "AI Agents",  icon: Sparkles },
  { href: "/milestones", label: "Milestones", icon: TrendingUp },
  { href: "/leaderboard",label: "Leaderboard",icon: BarChart3 },
  { href: "/playbook/tasks", label: "Weekly Tasks", icon: BookOpen },
  { href: "/guide",      label: "Guide",      icon: Briefcase },
  { href: "/settings/integrations", label: "Integrations", icon: Settings },
  { href: "/my-system",  label: "My System",  icon: Settings },
  { href: "/developers", label: "Developers", icon: Code2 },
  // Admin-only (the admin page itself does the auth check)
  { href: "/admin",      label: "Admin",      icon: Settings },
];

export default function AppNav() {
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();
  const isAdmin = user?.primaryEmailAddress?.emailAddress === "kwanus@gmail.com";
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
    <header className="sticky top-0 z-50 bg-t-bg/90 backdrop-blur-xl border-b border-t-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#f5a623] to-[#e07850] flex items-center justify-center">
            <Mountain className="w-3.5 h-3.5 text-[#0c0a08]" />
          </div>
          <span className="hidden sm:block text-sm font-black text-t-text tracking-tight">Himalaya</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-0.5">
          {NAV.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition whitespace-nowrap
                  ${active ? "bg-white/[0.08] text-t-text" : "text-t-text/30 hover:text-t-text/60"}`}
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
                ${showMore ? "bg-white/[0.08] text-t-text" : "text-t-text/30 hover:text-t-text/60"}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <ChevronDown className={`w-3 h-3 transition ${showMore ? "rotate-180" : ""}`} />
            </button>

            {showMore && (
              <div className="absolute top-full right-0 mt-1.5 w-48 rounded-xl border border-t-border bg-t-bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50 py-1">
                {MORE.filter(item => item.href !== "/admin" || isAdmin).map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href}
                    className={`flex items-center gap-2.5 px-3 py-2 text-[11px] font-semibold transition
                      ${pathname.startsWith(href) ? "bg-[#f5a623]/10 text-t-text" : "text-t-text/45 hover:bg-t-bg-card hover:text-t-text/80"}`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${pathname.startsWith(href) ? "text-[#f5a623]" : "text-t-text/25"}`} />
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
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-t-border text-t-text/20 hover:text-t-text/50 transition text-[11px]">
              <Search className="w-3 h-3" />
              <kbd className="px-1 py-0.5 rounded bg-white/[0.05] text-[9px] font-mono text-t-text/25">/</kbd>
            </button>
          )}
          <CreditsDisplay />
          {isSignedIn && <NotificationBell />}
          <ThemeToggle />
          {isSignedIn && (
            <Link href="/settings" className={`p-1.5 rounded-lg transition ${pathname.startsWith("/settings") ? "bg-white/[0.08] text-t-text" : "text-t-text/20 hover:text-t-text/50"}`}>
              <Settings className="w-3.5 h-3.5" />
            </Link>
          )}
          {isSignedIn ? <UserButton /> : (
            <SignInButton mode="modal">
              <button className="text-[11px] px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-t-border font-semibold text-t-text/50 hover:text-t-text transition">
                Sign in
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  );
}

function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const MODES: { id: ThemeMode; icon: React.ElementType; label: string }[] = [
    { id: "himalaya", icon: Mountain, label: "Himalaya" },
    { id: "dark", icon: Moon, label: "Dark" },
    { id: "light", icon: Sun, label: "Light" },
  ];

  const current = MODES.find(m => m.id === mode) ?? MODES[0];

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)}
        className="p-1.5 rounded-lg text-t-text/20 hover:text-t-text/50 transition" title="Theme">
        <current.icon className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1.5 w-36 rounded-xl border border-t-border bg-t-bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50 py-1">
          {MODES.map(m => (
            <button key={m.id} onClick={() => { setMode(m.id); setOpen(false); }}
              className={`flex items-center gap-2.5 w-full px-3 py-2 text-[11px] font-semibold transition ${
                mode === m.id ? "bg-[#f5a623]/10 text-[#f5a623]" : "text-t-text/45 hover:bg-t-bg-card hover:text-t-text/80"
              }`}>
              <m.icon className="w-3.5 h-3.5" />
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
