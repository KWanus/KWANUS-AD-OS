"use client";

import Link from "next/link";
import SimplifiedNav from "@/components/SimplifiedNav";
import {
  Webhook, Calculator, Globe, FileText, Calendar, Search,
  MessageSquare, BookmarkPlus, BarChart3, Target, Users,
  DollarSign, Zap, Mail, TrendingUp, Star, BookOpen, Shield, Compass, Sparkles, Rocket, Mountain,
} from "lucide-react";

const PATHWAYS = [
  {
    label: "Starter Wizard",
    href: "/start",
    icon: Compass,
    eyebrow: "Beginner Path",
    desc: "Answer a few questions and get a first offer, first hook, and day-one plan.",
    color: "border-[#f5a623]/20 bg-[#f5a623]/10 text-[#f5a623]",
  },
  {
    label: "Scan",
    href: "/scan",
    icon: Search,
    eyebrow: "Fast Verdict",
    desc: "Score a competitor, market, or offer quickly before you commit to building.",
    color: "border-white/[0.08] bg-white/[0.03] text-white",
  },
  {
    label: "Analysis Studio",
    href: "/analyze",
    icon: Sparkles,
    eyebrow: "Deep Build",
    desc: "Turn a URL or idea into strategy, hooks, landing copy, emails, and creative briefs.",
    color: "border-white/[0.08] bg-white/[0.03] text-white",
  },
  {
    label: "Launch Wizard",
    href: "/launch",
    icon: Rocket,
    eyebrow: "Fast Deploy",
    desc: "Type a niche and let the system launch the full stack in one shot.",
    color: "border-white/[0.08] bg-white/[0.03] text-white",
  },
  {
    label: "Himalaya",
    href: "/himalaya",
    icon: Mountain,
    eyebrow: "Full System",
    desc: "Use the guided operating system when you want research, builds, deploys, and iteration in one flow.",
    color: "border-[#f5a623]/20 bg-gradient-to-br from-[#f5a623]/10 to-[#e07850]/10 text-[#f5f0e8]",
  },
];

const TOOLS = [
  {
    category: "Money",
    items: [
      { label: "Revenue Dashboard", href: "/revenue", icon: DollarSign, desc: "Track sales, orders, and email ROI across all sites", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
      { label: "Profit Calculator", href: "/tools/profit-calculator", icon: Calculator, desc: "Calculate ROAS, ROI, and break-even from ad spend", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
      { label: "Funnel View", href: "/funnel", icon: TrendingUp, desc: "See your full visitor → lead → customer pipeline", color: "text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20" },
    ],
  },
  {
    category: "Content",
    items: [
      { label: "Content Calendar", href: "/content", icon: Calendar, desc: "Generate 7 days of ready-to-post social content", color: "text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20" },
      { label: "Social Generator", href: "/social", icon: MessageSquare, desc: "Create posts for Instagram, TikTok, X, LinkedIn", color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
      { label: "Swipe File", href: "/swipe", icon: BookmarkPlus, desc: "Save and reuse your best-performing copy", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
      { label: "Headline Analyzer", href: "/tools/headline-analyzer", icon: Target, desc: "Score your headlines for conversion effectiveness", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
      { label: "Ad Copy Scorer", href: "/tools/ad-scorer", icon: Target, desc: "Grade your ad copy across 8 conversion factors", color: "text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20" },
      { label: "Subject Line Tester", href: "/tools/subject-tester", icon: Mail, desc: "Compare email subject lines side by side", color: "text-[#e07850] bg-[#e07850]/10 border-[#e07850]/20" },
      { label: "Blog Writer", href: "/blog-writer", icon: FileText, desc: "AI writes a full SEO-optimized blog post", color: "text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20" },
      { label: "Course Outline Builder", href: "/tools/course-outline", icon: BookOpen, desc: "Generate a full course curriculum with modules and pricing", color: "text-[#e07850] bg-[#e07850]/10 border-[#e07850]/20" },
      { label: "Hashtag Generator", href: "/tools/hashtag-generator", icon: Target, desc: "Platform-specific hashtags grouped by strategy", color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
      { label: "Bio Generator", href: "/tools/bio-generator", icon: Users, desc: "5 platform-optimized bio variations", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
      { label: "Offer Builder", href: "/tools/offer-builder", icon: DollarSign, desc: "Build irresistible offer stacks with bonuses", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
      { label: "Creative Library", href: "/creatives", icon: Globe, desc: "Browse all AI-generated images and videos", color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
      { label: "Competitor Spy", href: "/tools/competitor-spy", icon: Search, desc: "Analyze any competitor URL on demand", color: "text-red-400 bg-red-500/10 border-red-500/20" },
    ],
  },
  {
    category: "Clients",
    items: [
      { label: "Proposals", href: "/proposals", icon: FileText, desc: "Generate professional client proposals from analysis data", color: "text-[#e07850] bg-[#e07850]/10 border-[#e07850]/20" },
      { label: "Testimonials", href: "/settings", icon: Star, desc: "Share review link: /review/[your-id] for clients to submit", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
      { label: "Client CRM", href: "/clients", icon: Users, desc: "Track relationships, pipeline stages, and health scores", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
      { label: "Testimonial Wall", href: "/settings", icon: Star, desc: "Public testimonial page at /wall/[your-id]", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    ],
  },
  {
    category: "Growth",
    items: [
      { label: "Starter Wizard", href: "/start", icon: Compass, desc: "Answer a few questions to get a first offer, first hook, and day-one plan", color: "text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20" },
      { label: "Launch Wizard", href: "/launch", icon: Zap, desc: "Type a niche and launch the full stack in one shot", color: "text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20" },
      { label: "Analysis Studio", href: "/analyze", icon: Search, desc: "Turn a URL or idea into strategy, assets, and an execution plan", color: "text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20" },
      { label: "Winner Finder", href: "/winners", icon: TrendingUp, desc: "Research affiliate and dropship angles worth building around", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
      { label: "Workspace Analytics", href: "/analytics", icon: BarChart3, desc: "See performance, health, and trends across the whole workspace", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
      { label: "Forms Manager", href: "/forms", icon: FileText, desc: "Create, publish, and track opt-in forms from one place", color: "text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20" },
      { label: "Site Analytics", href: "/websites", icon: BarChart3, desc: "Views, form submissions, revenue, and CRO suggestions", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
      { label: "Email Analytics", href: "/emails/analytics", icon: Mail, desc: "Open rates, click rates, revenue attribution by flow", color: "text-[#e07850] bg-[#e07850]/10 border-[#e07850]/20" },
      { label: "ROI Tracker", href: "/tools/roi-tracker", icon: TrendingUp, desc: "Track return on investment month over month", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
      { label: "CTA Generator", href: "/tools/cta-generator", icon: Zap, desc: "12 proven CTA formulas customized for your offer", color: "text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20" },
      { label: "Guarantee Builder", href: "/tools/guarantee-builder", icon: Shield, desc: "Risk-reversal guarantees that increase conversions", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
      { label: "Email Preview", href: "/tools/email-preview", icon: Mail, desc: "Preview emails desktop & mobile before sending", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
      { label: "Color Palette", href: "/tools/color-palette", icon: Target, desc: "Pick or generate brand color palettes", color: "text-[#e07850] bg-[#e07850]/10 border-[#e07850]/20" },
    ],
  },
  {
    category: "Utilities",
    items: [
      { label: "Report Intake", href: "/report", icon: FileText, desc: "Upload reports and hand them directly into strategy analysis", color: "text-[#e07850] bg-[#e07850]/10 border-[#e07850]/20" },
      { label: "Billing & Credits", href: "/billing", icon: DollarSign, desc: "Buy credits and manage workspace plan upgrades", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
      { label: "Business Card", href: "/tools/business-card", icon: Globe, desc: "Create a digital business card with QR code + vCard", color: "text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20" },
      { label: "Link Shortener", href: "/tools/link-shortener", icon: Globe, desc: "Create branded short links with click tracking", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
      { label: "Idea Validator", href: "/tools/idea-validator", icon: Star, desc: "Score any business idea for viability in 30 seconds", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
      { label: "Pricing Calculator", href: "/tools/pricing-calculator", icon: DollarSign, desc: "Calculate project pricing from income goals", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
      { label: "Niche Finder", href: "/tools/niche-finder", icon: Compass, desc: "Find profitable niches based on interests, skills, and budget", color: "text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20" },
      { label: "Persona Builder", href: "/tools/persona-builder", icon: Users, desc: "AI builds a detailed buyer persona for your niche", color: "text-[#e07850] bg-violet-500/10 border-violet-500/20" },
      { label: "Pain Point Finder", href: "/tools/pain-point-finder", icon: Target, desc: "Discover deepest pains + desires of any audience", color: "text-red-400 bg-red-500/10 border-red-500/20" },
      { label: "USP Generator", href: "/tools/usp-generator", icon: Star, desc: "6 unique positioning angles for your business", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
      { label: "Thank-You Page", href: "/tools/thank-you-page-builder", icon: Target, desc: "Post-purchase page that reduces refunds and upsells", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
      { label: "Refund Preventer", href: "/tools/refund-preventer", icon: Target, desc: "5 automated emails to reduce refunds", color: "text-green-400 bg-green-500/10 border-green-500/20" },
    ],
  },
  {
    category: "Integrations",
    items: [
      { label: "SEO Audit", href: "/tools/seo-audit", icon: Search, desc: "Audit any page for SEO issues with Google preview", color: "text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20" },
      { label: "Webhook Tester", href: "/tools/webhook-tester", icon: Webhook, desc: "Test your n8n, Zapier, or Make.com connections", color: "text-[#e07850] bg-[#e07850]/10 border-[#e07850]/20" },
      { label: "Multi-Site Dashboard", href: "/websites", icon: Globe, desc: "Manage all your sites, metrics, and deployments", color: "text-[#f5a623] bg-[#f5a623]/10 border-[#f5a623]/20" },
      { label: "Settings", href: "/settings", icon: Target, desc: "Pixels, API keys, domains, theme, integrations", color: "text-white/40 bg-white/5 border-white/10" },
    ],
  },
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-t-bg text-white">
      <SimplifiedNav />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white tracking-tight">Tools</h1>
          <p className="text-sm text-white/35 mt-1">Everything you need to grow, track, and optimize</p>
        </div>

        <section className="mb-10">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3">How To Navigate</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            {PATHWAYS.map((pathway) => {
              const Icon = pathway.icon;
              return (
                <Link
                  key={pathway.label}
                  href={pathway.href}
                  className={`rounded-3xl border p-4 transition hover:scale-[1.01] ${pathway.color}`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-white/40">{pathway.eyebrow}</p>
                  <h2 className="mt-2 text-sm font-black text-white">{pathway.label}</h2>
                  <p className="mt-2 text-[11px] leading-5 text-white/50">{pathway.desc}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="space-y-8">
          {TOOLS.map((group) => (
            <div key={group.category}>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3">{group.category}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {group.items.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Link
                      key={tool.label}
                      href={tool.href}
                      className={`flex items-start gap-3 p-4 rounded-2xl border transition hover:scale-[1.01] ${tool.color}`}
                    >
                      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-white">{tool.label}</p>
                        <p className="text-[10px] text-white/35 mt-0.5 leading-relaxed">{tool.desc}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
