"use client";

import { useState } from "react";
import Link from "next/link";
import { Mountain, Check, ArrowRight, Zap, Star } from "lucide-react";

type BillingCycle = "monthly" | "annual";

function getPlans(billing: BillingCycle) {
  return [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Build your first business and see if it works.",
    features: [
      "2 business builds",
      "Website with payment processing",
      "10 ad creatives per build",
      "Email automation (5 emails)",
      "Daily commands",
      "Basic analytics",
    ],
    cta: "Start Free",
    href: "/sign-up",
    highlighted: false,
  },
  {
    name: "Pro",
    price: billing === "annual" ? "$24" : "$29",
    period: billing === "annual" ? "/mo (billed annually)" : "/month",
    annualSavings: billing === "annual" ? "Save $60/year" : undefined,
    description: "Unlimited builds. Full automation. Scale to $10K+/month.",
    features: [
      "Unlimited business builds",
      "Unlimited ad creatives with AI images",
      "Full campaign packages (scripts, emails, bridge pages)",
      "Auto-optimizer (kills losers, scales winners)",
      "20 growth tools (webinar, VSL, quiz funnel, etc.)",
      "Revenue tracking + funnel analytics",
      "AI strategic advisor",
      "Priority support",
    ],
    cta: "Go Pro",
    href: "/sign-up",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Business",
    price: billing === "annual" ? "$66" : "$79",
    period: billing === "annual" ? "/mo (billed annually)" : "/month",
    annualSavings: billing === "annual" ? "Save $156/year" : undefined,
    description: "For agencies and power users running multiple businesses.",
    features: [
      "Everything in Pro",
      "Unlimited projects",
      "White-label sites (remove Himalaya branding)",
      "Team access (invite VAs and partners)",
      "Custom domain support",
      "API access",
      "Dedicated support",
      "Early access to new features",
    ],
    cta: "Go Business",
    href: "/sign-up",
    highlighted: false,
  },
];
}

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const PLANS = getPlans(billing);
  return (
    <div className="min-h-screen bg-[#0c0a08] text-[#f5f0e8]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#0c0a08]/90 backdrop-blur-xl border-b border-[#f5f0e8]/[0.05]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/welcome" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#f5a623] to-[#e07850] flex items-center justify-center">
              <Mountain className="w-3.5 h-3.5 text-[#0c0a08]" />
            </div>
            <span className="text-sm font-black">Himalaya</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-xs text-[#f5f0e8]/40 hover:text-[#f5f0e8]/70 transition font-semibold">Log in</Link>
            <Link href="/sign-up" className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-xs font-bold text-[#0c0a08]">
              Start Free →
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          Simple pricing. <span className="text-[#f5a623]">Start free.</span>
        </h1>
        <p className="mt-3 text-base text-[#f5f0e8]/35 max-w-lg mx-auto">
          Build your first business for free. Upgrade when you&apos;re ready to scale.
        </p>

        {/* Billing toggle */}
        <div className="mt-6 inline-flex items-center rounded-xl border border-[#f5f0e8]/[0.08] bg-[#f5f0e8]/[0.03] p-1">
          <button onClick={() => setBilling("monthly")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${billing === "monthly" ? "bg-[#f5a623]/10 text-[#f5a623]" : "text-[#f5f0e8]/40 hover:text-[#f5f0e8]/60"}`}>
            Monthly
          </button>
          <button onClick={() => setBilling("annual")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${billing === "annual" ? "bg-[#f5a623]/10 text-[#f5a623]" : "text-[#f5f0e8]/40 hover:text-[#f5f0e8]/60"}`}>
            Annual <span className="text-emerald-400 ml-1">Save 17%</span>
          </button>
        </div>
      </section>

      {/* Plans */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map(plan => (
            <div key={plan.name} className={`rounded-2xl border p-6 relative ${
              plan.highlighted
                ? "border-[#f5a623]/30 bg-[#f5a623]/[0.04] shadow-[0_0_40px_rgba(245,166,35,0.08)]"
                : "border-[#f5f0e8]/[0.06] bg-[#1c1916]"
            }`}>
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#f5a623] text-[10px] font-bold text-[#0c0a08]">
                  {plan.badge}
                </span>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-black">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-black">{plan.price}</span>
                  <span className="text-sm text-[#f5f0e8]/30">{plan.period}</span>
                </div>
                {"annualSavings" in plan && plan.annualSavings && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
                    {plan.annualSavings}
                  </span>
                )}
                <p className="text-sm text-[#f5f0e8]/35 mt-2">{plan.description}</p>
              </div>

              <div className="space-y-2.5 mb-6">
                {plan.features.map(f => (
                  <div key={f} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-[#f5f0e8]/60">{f}</span>
                  </div>
                ))}
              </div>

              <Link href={plan.href}
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition ${
                  plan.highlighted
                    ? "bg-gradient-to-r from-[#f5a623] to-[#e07850] text-[#0c0a08] hover:opacity-90"
                    : "bg-[#f5f0e8]/[0.06] text-[#f5f0e8]/60 hover:bg-[#f5f0e8]/[0.1] hover:text-[#f5f0e8]"
                }`}>
                {plan.cta} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-xl font-black text-center mb-6">Common Questions</h2>
          <div className="space-y-3">
            {[
              { q: "Can I really start for free?", a: "Yes. You get 2 full business builds on the free plan. No credit card required. If you like it, upgrade to Pro for unlimited." },
              { q: "What counts as a 'business build'?", a: "One build = Himalaya creates a complete business for you: website, ads, emails, funnel, scripts, and daily commands. Everything needed to start making money." },
              { q: "Can I cancel anytime?", a: "Yes. Cancel from your settings page. No contracts, no penalties. Your existing businesses keep working even after canceling." },
              { q: "Do I keep my businesses if I cancel?", a: "Yes. Your sites stay live, your email flows keep running, and your data is yours. You just can't create new builds without an active plan." },
            ].map(f => (
              <details key={f.q} className="group rounded-xl border border-[#f5f0e8]/[0.06] bg-[#1c1916]">
                <summary className="flex items-center justify-between cursor-pointer px-4 py-3 text-sm font-bold text-[#f5f0e8]/70 group-hover:text-[#f5f0e8] transition">
                  {f.q}
                  <ArrowRight className="w-3.5 h-3.5 text-[#f5f0e8]/15 group-open:rotate-90 transition-transform" />
                </summary>
                <p className="px-4 pb-3 text-sm text-[#f5f0e8]/35 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#f5f0e8]/[0.04] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#f5a623] to-[#e07850] flex items-center justify-center">
              <Mountain className="w-3 h-3 text-[#0c0a08]" />
            </div>
            <span className="text-xs font-black text-[#f5f0e8]/40">Himalaya</span>
          </div>
          <div className="flex gap-4 text-[10px] text-[#f5f0e8]/20">
            <Link href="/privacy" className="hover:text-[#f5f0e8]/40 transition">Privacy</Link>
            <Link href="/terms" className="hover:text-[#f5f0e8]/40 transition">Terms</Link>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
