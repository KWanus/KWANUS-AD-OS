"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { FUTURE_THEME as FT } from "@/lib/theme/futureTheme";
import {
  Sparkles, Zap, TrendingUp, Users, Mail, Calendar,
  BarChart3, Rocket, Target, DollarSign, Star, ArrowRight,
} from "lucide-react";

/**
 * 🚀 FUTURE HOME 2060
 * Ultra-modern homepage with massive action cards
 * So simple a 5-year-old could use it
 */

interface ActionCard {
  emoji: string;
  title: string;
  subtitle: string;
  action: string;
  href: string;
  gradient: string;
  icon: React.ElementType;
  stats?: { label: string; value: string | number };
}

export default function FutureHomePage() {
  const { user } = useUser();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // ═══ MAIN ACTION CARDS (Giant, emoji-first) ═══
  const mainActions: ActionCard[] = [
    {
      emoji: "🎯",
      title: "Find Leads",
      subtitle: "Discover perfect customers in seconds",
      action: "Start Searching",
      href: "/leads",
      gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
      icon: Target,
      stats: { label: "Hot Leads", value: 12 },
    },
    {
      emoji: "💌",
      title: "Send Emails",
      subtitle: "One-click outreach with proven templates",
      action: "Send Now",
      href: "/outreach",
      gradient: "from-emerald-500 via-teal-500 to-cyan-500",
      icon: Mail,
      stats: { label: "Ready to Send", value: 8 },
    },
    {
      emoji: "📈",
      title: "Track Revenue",
      subtitle: "See your money grow in real-time",
      action: "View Dashboard",
      href: "/revenue-analytics",
      gradient: "from-amber-500 via-orange-500 to-red-500",
      icon: TrendingUp,
      stats: { label: "This Month", value: "$12,450" },
    },
    {
      emoji: "👥",
      title: "Manage Clients",
      subtitle: "Keep everyone happy and organized",
      action: "See All Clients",
      href: "/clients",
      gradient: "from-blue-500 via-indigo-500 to-purple-500",
      icon: Users,
      stats: { label: "Active", value: 24 },
    },
  ];

  // ═══ QUICK ACTIONS (Smaller cards for common tasks) ═══
  const quickActions = [
    { emoji: "📅", label: "Schedule Meeting", href: "/clients", icon: Calendar },
    { emoji: "💸", label: "Create Invoice", href: "/clients", icon: DollarSign },
    { emoji: "🚀", label: "Run Campaign", href: "/campaigns", icon: Rocket },
    { emoji: "📊", label: "View Analytics", href: "/analytics", icon: BarChart3 },
    { emoji: "⚡", label: "Quick Send", href: "/outreach", icon: Zap },
    { emoji: "⭐", label: "Hot Leads", href: "/leads", icon: Star },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-fuchsia-950/20 text-white relative overflow-hidden">
      {/* ═══ BACKGROUND EFFECTS ═══ */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.1),transparent_50%)] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-[0.02] pointer-events-none" />

      {/* ═══ FLOATING ORBS (Decorative) ═══ */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl animate-float [animation-delay:2s] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* ═══ HEADER ═══ */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 mb-6">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <span className="text-sm font-bold text-white/80">Welcome back, {user?.firstName || "Champion"}!</span>
          </div>

          <h1 className={`${FT.text.hero} bg-gradient-to-r from-white via-violet-200 to-fuchsia-200 bg-clip-text text-transparent mb-4`}>
            What do you want to do?
          </h1>
          <p className="text-xl text-white/50 font-medium max-w-2xl mx-auto">
            Pick an action below and we'll handle the rest ✨
          </p>
        </div>

        {/* ═══ MAIN ACTION CARDS (2x2 Grid) ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {mainActions.map((card) => {
            const Icon = card.icon;
            const isHovered = hoveredCard === card.title;

            return (
              <Link
                key={card.title}
                href={card.href}
                onMouseEnter={() => setHoveredCard(card.title)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`group relative rounded-[48px] overflow-hidden transition-all duration-500 ${
                  isHovered ? "scale-[1.02]" : "scale-100"
                }`}
              >
                {/* Card Background with Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />

                {/* Glass Effect */}
                <div className="relative bg-white/5 backdrop-blur-3xl border-2 border-white/10 group-hover:border-white/20 rounded-[48px] p-10 transition-all duration-500">
                  {/* Glow Effect on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500 rounded-[48px]`} />

                  <div className="relative z-10">
                    {/* Emoji + Icon */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="text-7xl group-hover:scale-110 transition-transform duration-300">
                        {card.emoji}
                      </div>
                      <div className={`p-4 rounded-3xl bg-gradient-to-br ${card.gradient} shadow-[0_10px_40px_rgba(168,85,247,0.3)] group-hover:shadow-[0_15px_60px_rgba(168,85,247,0.5)] transition-all duration-300`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-4xl font-black mb-3 text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-violet-200 group-hover:bg-clip-text transition-all duration-300">
                      {card.title}
                    </h2>

                    {/* Subtitle */}
                    <p className="text-lg text-white/60 mb-6 font-medium">
                      {card.subtitle}
                    </p>

                    {/* Stats Badge */}
                    {card.stats && (
                      <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 mb-6">
                        <span className="text-2xl font-black text-white">{card.stats.value}</span>
                        <span className="text-sm text-white/60 font-bold">{card.stats.label}</span>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="flex items-center gap-2 text-lg font-black text-white group-hover:text-violet-300 transition-colors duration-300">
                      <span>{card.action}</span>
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ═══ QUICK ACTIONS (Horizontal Scroll) ═══ */}
        <div className="mb-12">
          <h3 className="text-2xl font-black text-white/80 mb-6 flex items-center gap-3">
            <Zap className="w-6 h-6 text-violet-400" />
            Quick Actions
          </h3>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group flex-shrink-0 w-48 rounded-3xl bg-white/5 backdrop-blur-xl border-2 border-white/10 hover:border-white/30 p-6 transition-all duration-300 hover:scale-105 hover:bg-white/10"
                >
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {action.emoji}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-5 h-5 text-violet-400" />
                    <p className="text-sm font-black text-white">{action.label}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ═══ AI ASSISTANT BANNER ═══ */}
        <div className="rounded-[48px] bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-pink-500/20 backdrop-blur-3xl border-2 border-violet-500/30 p-10 relative overflow-hidden">
          {/* Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="text-7xl animate-float">🤖</div>
              <div>
                <h3 className="text-3xl font-black text-white mb-2">AI is doing the work for you</h3>
                <p className="text-lg text-white/60 font-medium">12 leads analyzed • 8 emails drafted • 3 clients updated</p>
              </div>
            </div>

            <button className="px-10 py-5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-black text-lg shadow-[0_15px_60px_rgba(168,85,247,0.5)] hover:shadow-[0_20px_80px_rgba(168,85,247,0.7)] hover:scale-105 transition-all duration-300">
              View Activity
            </button>
          </div>
        </div>

        {/* ═══ FOOTER NAVIGATION ═══ */}
        <div className="mt-16 flex items-center justify-center gap-4">
          <Link href="/settings" className="px-6 py-3 rounded-full bg-white/5 backdrop-blur-xl border border-white/20 text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300 font-bold text-sm">
            ⚙️ Settings
          </Link>
          <Link href="/help" className="px-6 py-3 rounded-full bg-white/5 backdrop-blur-xl border border-white/20 text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300 font-bold text-sm">
            ❓ Help
          </Link>
        </div>
      </div>

      {/* ═══ FLOATING ACTION BUTTON (Bottom Right) ═══ */}
      <button className="fixed bottom-8 right-8 w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-[0_15px_60px_rgba(168,85,247,0.6)] hover:shadow-[0_20px_80px_rgba(168,85,247,0.8)] hover:scale-110 transition-all duration-300 z-50 group">
        <Sparkles className="w-10 h-10 text-white group-hover:rotate-180 transition-transform duration-500" />
      </button>
    </div>
  );
}
