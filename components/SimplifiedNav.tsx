"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, SignInButton, useUser } from "@clerk/nextjs";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import NotificationBell from "@/components/NotificationBell";
import {
  Home, Mountain, Settings, Search, ChevronDown, Sun, Moon,
  Rocket, Megaphone, Users, TrendingUp, HelpCircle, Sparkles,
  Globe, FolderKanban, Mail, BarChart3, Wrench, Store, Code2,
} from "lucide-react";
import { useTheme, type ThemeMode } from "@/lib/theme/ThemeProvider";

const CreditsDisplay = dynamic(() => import("@/components/CreditsDisplay"), { ssr: false });

// ── Simplified 4-section navigation ──────────────────────────────────────────
//
// BUILD: Create new projects, businesses, websites
// MARKET: Ads, campaigns, creatives
// CONNECT: Email, CRM, leads
// GROW: Analytics, tools, revenue
//

const NAV_SECTIONS = [
  {
    id: "build",
    label: "Build",
    icon: Rocket,
    color: "text-purple-400",
    activeColor: "bg-purple-500/10 border-purple-500/30",
    items: [
      { href: "/himalaya", label: "AI Business Builder", icon: Mountain, description: "Build a complete business in 60 seconds" },
      { href: "/websites", label: "Websites", icon: Globe, description: "13 proven templates · 2.5-4.7% CVR" },
      { href: "/projects", label: "Projects", icon: FolderKanban, description: "All your projects in one place" },
    ],
  },
  {
    id: "market",
    label: "Market",
    icon: Megaphone,
    color: "text-[#f5a623]",
    activeColor: "bg-[#f5a623]/10 border-[#f5a623]/30",
    items: [
      { href: "/campaigns", label: "Ad Campaigns", icon: FolderKanban, description: "Professional ad campaigns" },
      { href: "/creative-studio", label: "Creative Studio", icon: Sparkles, description: "13 proven templates · 2.9x-4.8x CTR" },
      { href: "/creative-studio/himalaya", label: "Himalaya Creatives", icon: Mountain, description: "AI-generated ads from your business" },
      { href: "/analytics", label: "Ad Analytics", icon: BarChart3, description: "Track campaign performance" },
    ],
  },
  {
    id: "connect",
    label: "Connect",
    icon: Users,
    color: "text-emerald-400",
    activeColor: "bg-emerald-500/10 border-emerald-500/30",
    items: [
      { href: "/emails", label: "Email Automation", icon: Mail, description: "Automated email flows" },
      { href: "/clients", label: "CRM", icon: Users, description: "Manage clients and leads" },
      { href: "/leads", label: "Leads", icon: TrendingUp, description: "Track and convert leads" },
    ],
  },
  {
    id: "grow",
    label: "Grow",
    icon: TrendingUp,
    color: "text-blue-400",
    activeColor: "bg-blue-500/10 border-blue-500/30",
    items: [
      { href: "/revenue-analytics", label: "Revenue Dashboard", icon: BarChart3, description: "Track all revenue sources" },
      { href: "/tools", label: "Marketing Tools", icon: Wrench, description: "40+ business tools" },
      { href: "/marketplace", label: "Marketplace", icon: Store, description: "Buy & sell templates" },
    ],
  },
];

// Additional items in settings dropdown
const SETTINGS_ITEMS = [
  { href: "/settings", label: "General Settings", icon: Settings },
  { href: "/settings/api-keys", label: "API Keys", icon: Code2 },
  { href: "/settings/integrations", label: "Integrations", icon: Settings },
];

export default function SimplifiedNav() {
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sectionRef.current && !sectionRef.current.contains(e.target as Node)) {
        setActiveSection(null);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close dropdowns on navigation
  useEffect(() => {
    setActiveSection(null);
    setShowSettings(false);
  }, [pathname]);

  // Determine which section is active based on current path
  const getCurrentSection = () => {
    for (const section of NAV_SECTIONS) {
      if (section.items.some(item => pathname.startsWith(item.href))) {
        return section.id;
      }
    }
    return null;
  };

  const currentSection = getCurrentSection();

  return (
    <header className="sticky top-0 z-50 bg-[#0c0a08]/95 backdrop-blur-xl border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f5a623] to-[#e07850] flex items-center justify-center shadow-lg shadow-[#f5a623]/20 group-hover:shadow-[#f5a623]/40 transition">
            <Mountain className="w-4.5 h-4.5 text-[#0c0a08]" />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-black text-white tracking-tight leading-none">Himalaya</div>
            <div className="text-[9px] text-white/30 font-semibold uppercase tracking-wider leading-none mt-0.5">Business OS</div>
          </div>
        </Link>

        {/* Main Navigation - 4 Sections */}
        <nav className="flex items-center gap-1" ref={sectionRef}>
          <Link
            href="/dashboard"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
              pathname === "/dashboard" || pathname === "/"
                ? "bg-white/[0.08] text-white"
                : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="hidden lg:block">Home</span>
          </Link>

          {NAV_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = currentSection === section.id || activeSection === section.id;

            return (
              <div key={section.id} className="relative">
                <button
                  onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
                    isActive
                      ? "bg-white/[0.08] text-white"
                      : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? section.color : ""}`} />
                  <span className="hidden md:block">{section.label}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${activeSection === section.id ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown */}
                {activeSection === section.id && (
                  <div className="absolute top-full left-0 mt-2 w-72 rounded-xl border border-white/10 bg-[#0c0a08]/98 backdrop-blur-xl shadow-2xl overflow-hidden z-50 py-2">
                    <div className="px-3 py-2 border-b border-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${section.color}`} />
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">{section.label}</h3>
                      </div>
                    </div>

                    <div className="p-1.5">
                      {section.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isItemActive = pathname.startsWith(item.href);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-start gap-3 px-3 py-2.5 rounded-lg transition group ${
                              isItemActive
                                ? `${section.activeColor} border`
                                : "hover:bg-white/[0.04]"
                            }`}
                          >
                            <ItemIcon className={`w-4 h-4 mt-0.5 ${isItemActive ? section.color : "text-white/25 group-hover:text-white/50"}`} />
                            <div className="flex-1 min-w-0">
                              <div className={`text-xs font-bold mb-0.5 ${isItemActive ? "text-white" : "text-white/70 group-hover:text-white"}`}>
                                {item.label}
                              </div>
                              <div className="text-[10px] text-white/40 leading-snug">
                                {item.description}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Search */}
          {isSignedIn && (
            <button
              onClick={() => window.dispatchEvent(new Event("open-global-search"))}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-white/30 hover:text-white/60 hover:border-white/20 transition text-xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Search</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] font-mono text-white/25">/</kbd>
            </button>
          )}

          {/* Help Tutorial */}
          {isSignedIn && (
            <button
              onClick={() => window.dispatchEvent(new Event("open-tutorial"))}
              className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition"
              title="Tutorial & Help"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}

          {/* Credits */}
          <CreditsDisplay />

          {/* Notifications */}
          {isSignedIn && <NotificationBell />}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Settings Dropdown */}
          {isSignedIn && (
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition ${
                  pathname.startsWith("/settings") || showSettings
                    ? "bg-white/[0.08] text-white"
                    : "text-white/30 hover:text-white/70 hover:bg-white/[0.04]"
                }`}
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              {showSettings && (
                <div className="absolute top-full right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#0c0a08]/98 backdrop-blur-xl shadow-2xl overflow-hidden z-50 py-1.5">
                  {SETTINGS_ITEMS.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold transition ${
                          isActive
                            ? "bg-[#f5a623]/10 text-white"
                            : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                        }`}
                      >
                        <ItemIcon className={`w-3.5 h-3.5 ${isActive ? "text-[#f5a623]" : "text-white/30"}`} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* User Button */}
          {isSignedIn ? (
            <UserButton />
          ) : (
            <SignInButton mode="modal">
              <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#f5a623] to-[#e07850] text-xs font-bold text-white hover:shadow-lg hover:shadow-[#f5a623]/20 transition">
                Sign In
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
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
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
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition"
        title="Theme"
      >
        <current.icon className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-40 rounded-xl border border-white/10 bg-[#0c0a08]/98 backdrop-blur-xl shadow-2xl overflow-hidden z-50 py-1.5">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setMode(m.id);
                setOpen(false);
              }}
              className={`flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold transition ${
                mode === m.id
                  ? "bg-[#f5a623]/10 text-[#f5a623]"
                  : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
              }`}
            >
              <m.icon className="w-3.5 h-3.5" />
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
