"use client";

import Link from "next/link";
import SimplifiedNav from "@/components/SimplifiedNav";
import { ArrowRight, Bot, Sparkles, Database, ShieldCheck } from "lucide-react";

const AGENTS = [
  { id: "digital-twin", name: "Digital Twin", desc: "Simulate how customers react to your headlines, offers, and prices before you spend money", icon: "🧬", status: "active" as const, href: "/tools" },
  { id: "business-cloner", name: "Business Cloner", desc: "Paste a competitor URL — we analyze what works, find weaknesses, and build you something better", icon: "🔬", status: "active" as const, href: "/himalaya" },
  { id: "voice-agent", name: "Voice Agent", desc: "AI calls your leads automatically. Books appointments, follows up, closes deals. 5x cheaper than alternatives", icon: "📱", status: "active" as const, href: "/settings" },
  { id: "video-spokesperson", name: "Video Spokesperson", desc: "AI-generated video presentations for your landing pages and ads. Increases conversion 80%", icon: "🎬", status: "active" as const, href: "/tools" },
  { id: "auto-optimizer", name: "Auto-Optimizer", desc: "Kills losing ads, doubles winners, generates new creative angles. Runs every night while you sleep", icon: "🤖", status: "active" as const, href: "/dashboard" },
  { id: "social-poster", name: "Social Poster", desc: "Generates and actually POSTS content to Instagram, TikTok, Twitter, LinkedIn. Scheduling included", icon: "📲", status: "active" as const, href: "/tools" },
  { id: "reputation-agent", name: "Reputation Manager", desc: "Monitors reviews across Google, Yelp, Facebook. Auto-generates responses. Requests new reviews", icon: "⭐", status: "active" as const, href: "/tools" },
  { id: "geo-optimizer", name: "GEO Optimizer", desc: "Optimizes your content for AI search engines (ChatGPT, Perplexity, Gemini) to recommend your business", icon: "🌐", status: "active" as const, href: "/tools" },
  { id: "dynamic-personalization", name: "Dynamic Personalization", desc: "Every visitor sees a different page based on traffic source, device, location, and intent signals", icon: "🎯", status: "active" as const, href: "/websites" },
  { id: "revenue-leak-detector", name: "Revenue Leak Detector", desc: "Finds exactly where money is leaking in your funnel and calculates the dollar value of each leak", icon: "🔍", status: "active" as const, href: "/dashboard" },
  { id: "smart-budget", name: "Smart Budget Allocator", desc: "AI distributes your ad spend across platforms based on real-time ROAS. No manual guessing", icon: "💰", status: "active" as const, href: "/ads" },
  { id: "computer-use", name: "Computer Use Agent", desc: "AI literally controls the browser — creates ad campaigns, uploads creatives, sets targeting, publishes", icon: "🖥️", status: "coming_soon" as const, href: "#" },
];

const STEPS = [
  {
    icon: Bot,
    title: "Agents run autonomously",
    desc: "They don't wait for you to do anything. Set them up once and they work around the clock — nights, weekends, holidays.",
  },
  {
    icon: Database,
    title: "They learn from your data",
    desc: "Every sale, click, and lead teaches them. The longer they run, the smarter they get at converting your audience.",
  },
  {
    icon: ShieldCheck,
    title: "You approve the results",
    desc: "Nothing goes live without your OK. Review suggestions, approve campaigns, and stay in full control.",
  },
];

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SimplifiedNav />

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#f5a623]/30 bg-[#f5a623]/10 text-[#f5a623] text-xs font-medium mb-4">
            <Sparkles className="w-3 h-3" />
            Autonomous AI
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">AI Agents</h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Autonomous systems that work for your business 24/7
          </p>
        </div>

        {/* Agent Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16">
          {AGENTS.map((agent) => {
            const isComingSoon = agent.status === "coming_soon";
            return (
              <Link
                key={agent.id}
                href={agent.href}
                className={`group relative block rounded-xl border p-6 transition-all ${
                  isComingSoon
                    ? "border-white/[0.06] bg-white/[0.02] opacity-60 pointer-events-none"
                    : "border-white/[0.08] bg-white/[0.03] hover:border-[#f5a623]/30 hover:bg-[#f5a623]/[0.04]"
                }`}
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  {isComingSoon ? (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/40">
                      Coming Soon
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  )}
                </div>

                {/* Icon */}
                <span className="text-3xl block mb-3">{agent.icon}</span>

                {/* Name */}
                <h3 className="text-sm font-semibold mb-1.5">{agent.name}</h3>

                {/* Description */}
                <p className="text-xs text-white/45 leading-relaxed mb-4 pr-8">
                  {agent.desc}
                </p>

                {/* Button */}
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                    isComingSoon
                      ? "text-white/30"
                      : "text-[#f5a623] group-hover:gap-2.5 transition-all"
                  }`}
                >
                  {isComingSoon ? "Learn more" : "Try it"}
                  <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            );
          })}
        </div>

        {/* How Agents Work */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-8 mb-12">
          <h2 className="text-xl font-bold text-center mb-8">How Agents Work</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#f5a623]/10 border border-[#f5a623]/20 mb-3">
                  <step.icon className="w-5 h-5 text-[#f5a623]" />
                </div>
                <h3 className="text-sm font-semibold mb-1.5">{step.title}</h3>
                <p className="text-xs text-white/45 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/himalaya"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[#f5a623] to-[#e07850] text-black text-sm font-semibold hover:brightness-110 transition-all"
          >
            Start using AI agents
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
