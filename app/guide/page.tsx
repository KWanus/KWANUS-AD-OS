"use client";

import Link from "next/link";
import SimplifiedNav from "@/components/SimplifiedNav";
import {
  Mountain, ArrowRight, Zap, Globe, Mail, Users,
  Play, DollarSign, BarChart2, Settings, Target,
  HelpCircle, BookOpen, Rocket, Shield,
} from "lucide-react";

const GUIDES = [
  {
    category: "Getting Started",
    items: [
      { title: "Build your first business", desc: "Type your goal, Himalaya builds everything in 60 seconds", href: "/himalaya", icon: Rocket, time: "2 min" },
      { title: "Understand your project page", desc: "See your scripts, math, timeline, and tools all in one place", href: "/", icon: Mountain, time: "3 min" },
      { title: "Set up email sending", desc: "Configure Gmail SMTP to send emails for free", href: "/settings", icon: Mail, time: "5 min" },
      { title: "Connect your ad accounts", desc: "Link Meta, Google, or TikTok to push ads from Himalaya", href: "/settings/ad-accounts", icon: Target, time: "10 min" },
    ],
  },
  {
    category: "Creating Content",
    items: [
      { title: "Record your first 3 videos", desc: "Use the word-for-word scripts from your project page", href: "/", icon: Play, time: "15 min" },
      { title: "Generate a webinar", desc: "Create a complete evergreen webinar system", href: "/tools/webinar", icon: Play, time: "5 min" },
      { title: "Create a VSL script", desc: "Write a 10-minute video sales letter", href: "/tools/vsl", icon: Play, time: "5 min" },
      { title: "Build an offer stack", desc: "Create a no-brainer offer people can't refuse", href: "/tools/offer-stack-builder", icon: DollarSign, time: "3 min" },
      { title: "Generate a case study", desc: "Turn client results into social proof", href: "/tools/case-study", icon: BookOpen, time: "3 min" },
      { title: "Build a quiz funnel", desc: "Segment visitors and recommend the right product", href: "/tools/quiz-funnel", icon: HelpCircle, time: "5 min" },
    ],
  },
  {
    category: "Getting Traffic",
    items: [
      { title: "Post organic content", desc: "Follow the daily commands — post what Himalaya tells you to post", href: "/", icon: Globe, time: "10 min/day" },
      { title: "Boost a winning post", desc: "When a post gets 500+ views, boost it for $20/day on Meta", href: "/ads", icon: Zap, time: "5 min" },
      { title: "Launch ads on Meta/TikTok", desc: "Push your creatives to connected ad platforms", href: "/campaigns", icon: Target, time: "10 min" },
    ],
  },
  {
    category: "Making Money",
    items: [
      { title: "Set up Stripe payments", desc: "Configure payment processing so customers can buy", href: "/settings", icon: DollarSign, time: "10 min" },
      { title: "Check your revenue", desc: "See what's earning, what's converting, what needs fixing", href: "/dashboard", icon: BarChart2, time: "2 min" },
      { title: "Follow up with leads", desc: "Himalaya scores leads and tells you who to contact", href: "/leads", icon: Users, time: "5 min" },
    ],
  },
  {
    category: "Scaling Up",
    items: [
      { title: "Review your funnel health", desc: "Find where visitors drop off and fix it", href: "/dashboard", icon: BarChart2, time: "3 min" },
      { title: "Get the AI advisor", desc: "Himalaya analyzes your data and tells you what to do next", href: "/dashboard", icon: Mountain, time: "1 min" },
      { title: "Build a second business", desc: "Type a new goal on the homepage and build another one", href: "/", icon: Rocket, time: "2 min" },
    ],
  },
];

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-t-bg text-t-text">
      <SimplifiedNav />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <div className="pt-8 pb-6">
          <h1 className="text-2xl font-black">How to Use Himalaya</h1>
          <p className="text-sm text-t-text-muted">Step-by-step guides for every part of the system. Click any item to get started.</p>
        </div>

        <div className="space-y-8">
          {GUIDES.map(section => (
            <div key={section.category}>
              <p className="text-[10px] font-black text-t-text-faint tracking-wider mb-3">{section.category.toUpperCase()}</p>
              <div className="space-y-2">
                {section.items.map(item => (
                  <Link key={item.title} href={item.href}
                    className="flex items-center gap-4 rounded-xl border border-t-border bg-t-bg-raised px-4 py-3 hover:border-[#f5a623]/15 hover:bg-[#f5a623]/[0.02] transition group">
                    <div className="w-9 h-9 rounded-lg bg-t-bg-card border border-t-border flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-[#f5a623]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-t-text group-hover:text-[#f5a623] transition">{item.title}</p>
                      <p className="text-xs text-t-text-faint">{item.desc}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-t-text-faint">{item.time}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-t-text-faint group-hover:text-[#f5a623] transition" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-t-border bg-t-bg-raised p-5 text-center">
          <Mountain className="w-8 h-8 text-[#f5a623] mx-auto mb-3" />
          <h3 className="text-base font-black mb-1">Still need help?</h3>
          <p className="text-sm text-t-text-muted mb-3">Open the AI Copilot from any page — it knows your business and can answer specific questions.</p>
          <Link href="/copilot" className="inline-flex items-center gap-2 text-sm font-bold text-[#f5a623] hover:text-[#e07850] transition">
            Open Copilot <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </main>
  );
}
