"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Zap, Check, Loader2, ChevronLeft, Crown, Sparkles, TrendingUp, Shield, Star } from "lucide-react";
import { toast } from "sonner";
import AppNav from "@/components/AppNav";

type BundleKey = "starter" | "growth" | "scale" | "pro";

const BUNDLES: {
  key: BundleKey;
  label: string;
  price: number;
  credits: number;
  perCredit: string;
  badge?: string;
  color: string;
  highlights: string[];
}[] = [
  {
    key: "starter",
    label: "Starter",
    price: 9,
    credits: 100,
    perCredit: "$0.09",
    color: "from-white/10 to-white/5",
    highlights: ["100 credits", "~100 AI images", "~20 video clips", "Never expires"],
  },
  {
    key: "growth",
    label: "Growth",
    price: 29,
    credits: 400,
    perCredit: "$0.07",
    badge: "Most Popular",
    color: "from-cyan-500/20 to-cyan-500/5",
    highlights: ["400 credits", "~400 AI images", "~80 video clips", "Save 22% vs Starter"],
  },
  {
    key: "scale",
    label: "Scale",
    price: 79,
    credits: 1200,
    perCredit: "$0.07",
    color: "from-purple-500/20 to-purple-500/5",
    highlights: ["1,200 credits", "~1200 AI images", "~240 video clips", "Save 34% vs Starter"],
  },
  {
    key: "pro",
    label: "Pro",
    price: 199,
    credits: 3500,
    perCredit: "$0.06",
    badge: "Best Value",
    color: "from-amber-500/20 to-amber-500/5",
    highlights: ["3,500 credits", "~3500 AI images", "~700 video clips", "Save 44% vs Starter"],
  },
];

const CREDIT_COSTS = [
  { action: "AI Image (DALL-E 3)", credits: 1, cost: "$0.09" },
  { action: "AI Video Clip (5s, Runway)", credits: 5, cost: "$0.45" },
  { action: "AI Video Clip (10s, Runway)", credits: 10, cost: "$0.90" },
  { action: "URL Analysis (full)", credits: 0, cost: "Free" },
  { action: "Ad Hooks + Scripts", credits: 0, cost: "Free" },
  { action: "Creative Briefs", credits: 0, cost: "Free" },
];

// ---------------------------------------------------------------------------
// Subscription tiers
// ---------------------------------------------------------------------------

const SUBSCRIPTION_TIERS = [
  {
    key: "free",
    label: "Free",
    price: 0,
    period: "forever",
    badge: null,
    color: "border-white/[0.08]",
    headerColor: "text-white/50",
    buttonClass: "bg-white/[0.06] border border-white/[0.12] text-white/50 cursor-default",
    buttonLabel: "Current Plan",
    features: [
      "25 clients / CRM contacts",
      "500 email contacts",
      "2 email flows",
      "3 broadcasts / month",
      "Basic analytics",
      "KWANUS branding on forms",
    ],
    missing: ["Custom sending domain", "Unlimited everything", "Webhooks", "White-label"],
  },
  {
    key: "pro",
    label: "Pro",
    price: 49,
    period: "/ month",
    badge: "Most Popular",
    color: "border-cyan-500/40",
    headerColor: "text-cyan-300",
    buttonClass: "bg-cyan-500 hover:bg-cyan-400 text-[#050a14] shadow-[0_0_20px_rgba(6,182,212,0.25)]",
    buttonLabel: "Upgrade to Pro →",
    features: [
      "Unlimited clients",
      "5,000 email contacts",
      "Unlimited email flows",
      "Unlimited broadcasts",
      "Custom sending domain",
      "Advanced analytics",
      "100 studio credits / mo",
      "Priority support",
    ],
    missing: ["Webhooks / API access", "White-label & sub-accounts"],
  },
  {
    key: "elite",
    label: "Elite",
    price: 149,
    period: "/ month",
    badge: "Best Value",
    color: "border-amber-500/30",
    headerColor: "text-amber-300",
    buttonClass: "bg-amber-500 hover:bg-amber-400 text-[#050a14]",
    buttonLabel: "Upgrade to Elite →",
    features: [
      "Everything in Pro",
      "Unlimited contacts",
      "Webhooks & full API",
      "White-label platform",
      "Sub-accounts",
      "300 studio credits / mo",
      "Dedicated onboarding",
      "SLA support",
    ],
    missing: [],
  },
] as const;

function BillingContent() {
  const searchParams = useSearchParams();
  const [credits, setCredits] = useState<number | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [loading, setLoading] = useState<BundleKey | null>(null);
  const success = searchParams.get("success") === "1";
  const cancelled = searchParams.get("cancelled") === "1";
  const successBundle = searchParams.get("bundle") as BundleKey | null;

  useEffect(() => {
    fetch("/api/user/credits")
      .then(r => r.json() as Promise<{ ok: boolean; credits: number; plan?: string }>)
      .then(d => {
        if (d.ok) {
          setCredits(d.credits);
          setCurrentPlan(d.plan ?? "free");
        }
      });
  }, []);

  async function handlePurchase(bundle: BundleKey) {
    setLoading(bundle);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundle }),
      });
      const data = await res.json() as { ok: boolean; url?: string; error?: string };

      if (data.error === "no_stripe_key") {
        toast.error("Payment processing is not configured yet. Contact support.");
        return;
      }
      if (data.ok && data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#050a14] text-white flex flex-col">
      <AppNav />
      {/* Background */}
      <div className="fixed inset-0 opacity-[0.025] pointer-events-none" style={{ backgroundImage: "radial-gradient(#fff 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] opacity-[0.06] blur-[100px] pointer-events-none" style={{ background: "linear-gradient(to bottom,#06b6d4,#8b5cf6)" }} />

      {/* Header */}
      <header className="relative z-10 px-8 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-white/30 hover:text-white transition">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-xs font-medium">Dashboard</span>
          </Link>
          <span className="text-white/10">|</span>
          <span className="text-sm font-black tracking-[0.2em] text-cyan-400 uppercase">Credits</span>
        </div>
        {credits !== null && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/[0.06]">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-black text-cyan-300">{credits} credits remaining</span>
          </div>
        )}
      </header>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 w-full">

        {/* Success / cancelled banners */}
        {success && (
          <div className="mb-8 px-5 py-4 rounded-2xl border border-green-500/30 bg-green-500/[0.07] flex items-center gap-3">
            <Check className="w-5 h-5 text-green-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-green-300">Payment successful!</p>
              <p className="text-xs text-green-400/60">
                {successBundle ? `Your ${BUNDLES.find(b => b.key === successBundle)?.credits} credits have been added.` : "Credits added to your account."}
              </p>
            </div>
          </div>
        )}
        {cancelled && (
          <div className="mb-8 px-5 py-4 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center gap-3">
            <span className="text-white/40 text-sm">Payment cancelled — no charge was made.</span>
          </div>
        )}

        {/* Hero */}
        <div className="text-center mb-14">
          <p className="text-[11px] font-black tracking-[0.3em] text-cyan-500/60 uppercase mb-3">Plans & Credits</p>
          <h1 className="text-4xl font-black mb-3">One platform. No bloat.</h1>
          <p className="text-white/35 text-base max-w-md mx-auto leading-relaxed">
            Start free. Upgrade when you&apos;re ready. Studio credits are separate pay-per-use — they never expire.
          </p>
        </div>

        {/* Subscription tiers */}
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-5 flex items-center gap-2">
            <Star className="w-3 h-3" />
            Platform Access
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-16">
            {SUBSCRIPTION_TIERS.map((tier) => (
              <div
                key={tier.key}
                className={`relative rounded-2xl border p-6 flex flex-col gap-5 ${tier.color} ${tier.key === "pro" ? "bg-gradient-to-b from-cyan-500/[0.07] to-transparent" : tier.key === "elite" ? "bg-gradient-to-b from-amber-500/[0.05] to-transparent" : "bg-white/[0.02]"}`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${tier.key === "pro" ? "bg-cyan-500 text-[#050a14]" : "bg-amber-500 text-[#050a14]"}`}>
                      {tier.badge}
                    </span>
                  </div>
                )}

                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${tier.headerColor}`}>{tier.label}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-black text-white">{tier.price === 0 ? "Free" : `$${tier.price}`}</span>
                    {tier.price > 0 && <span className="text-white/30 text-sm mb-1">{tier.period}</span>}
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  {tier.features.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <Check className={`w-3 h-3 shrink-0 ${tier.key === "pro" ? "text-cyan-400" : tier.key === "elite" ? "text-amber-400" : "text-white/30"}`} />
                      <span className="text-xs text-white/55">{f}</span>
                    </div>
                  ))}
                  {tier.missing.map((f) => (
                    <div key={f} className="flex items-center gap-2 opacity-35">
                      <div className="w-3 h-3 shrink-0 flex items-center justify-center">
                        <div className="w-1.5 h-px bg-white/30" />
                      </div>
                      <span className="text-xs text-white/30 line-through">{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  disabled={tier.key === "free"}
                  className={`w-full py-3 rounded-xl text-sm font-black uppercase tracking-widest transition flex items-center justify-center gap-2 ${tier.buttonClass} disabled:cursor-default`}
                >
                  {tier.key === "elite" && <Crown className="w-3.5 h-3.5" />}
                  {currentPlan === tier.key ? "Current Plan" : tier.buttonLabel}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8 mb-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-6">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white/30">Execution Quality</h3>
              <p className="text-sm text-white/40 mt-2 max-w-2xl">
                The real upgrade path is output quality. Core is strong and launch-ready. Elite is where the platform pushes for sharper positioning, stronger objection handling, tighter conversion structure, and more premium execution across tools.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-300">
                Current plan: {currentPlan}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                label: "Core Lane",
                badge: "Included",
                border: "border-white/[0.08]",
                badgeClass: "border-white/10 bg-white/5 text-white/45",
                bullets: [
                  "Strong practical generation that ships fast",
                  "Clean conversion structure and usable defaults",
                  "Best for speed, validation, and standard client work",
                ],
              },
              {
                label: "Elite Lane",
                badge: "Premium",
                border: "border-cyan-500/30",
                badgeClass: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
                bullets: [
                  "Sharper positioning, proof framing, and objection handling",
                  "Higher-end page, email, campaign, and research execution",
                  "Built for top-operator outputs and higher-ticket delivery",
                ],
              },
            ].map((lane) => (
              <div key={lane.label} className={`rounded-2xl border ${lane.border} bg-black/20 p-5`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-base font-black text-white">{lane.label}</p>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${lane.badgeClass}`}>
                    {lane.badge}
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  {lane.bullets.map((bullet) => (
                    <div key={bullet} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" />
                      <span className="text-sm text-white/55">{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 border-t border-white/[0.06]" />
          <p className="text-[10px] font-black uppercase tracking-widest text-white/20 flex items-center gap-2">
            <Zap className="w-3 h-3" />
            Studio Credits (pay-per-use, never expire)
          </p>
          <div className="flex-1 border-t border-white/[0.06]" />
        </div>

        {/* Bundles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {BUNDLES.map(b => (
            <div key={b.key}
              className={`relative rounded-2xl border p-6 flex flex-col gap-5 transition-all duration-200
                ${b.badge === "Most Popular"
                  ? "border-cyan-500/40 bg-gradient-to-b from-cyan-500/10 to-transparent"
                  : b.badge === "Best Value"
                  ? "border-amber-500/30 bg-gradient-to-b from-amber-500/[0.08] to-transparent"
                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"
                }`}
            >
              {b.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                    ${b.badge === "Most Popular" ? "bg-cyan-500 text-[#050a14]" : "bg-amber-500 text-[#050a14]"}`}>
                    {b.badge}
                  </span>
                </div>
              )}

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">{b.label}</p>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-black text-white">${b.price}</span>
                  <span className="text-white/30 text-sm mb-1">one-time</span>
                </div>
                <p className="text-[11px] text-white/25 mt-1">{b.perCredit} / credit</p>
              </div>

              <div className="flex-1 space-y-2">
                {b.highlights.map(h => (
                  <div key={h} className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="text-xs text-white/55">{h}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handlePurchase(b.key)}
                disabled={loading !== null}
                className={`w-full py-3 rounded-xl text-sm font-black uppercase tracking-widest transition flex items-center justify-center gap-2
                  ${b.badge === "Most Popular"
                    ? "bg-cyan-500 hover:bg-cyan-400 text-[#050a14] shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                    : b.badge === "Best Value"
                    ? "bg-amber-500 hover:bg-amber-400 text-[#050a14]"
                    : "bg-white/8 hover:bg-white/12 text-white border border-white/10"
                  } disabled:opacity-50`}
              >
                {loading === b.key
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                  : `Get ${b.credits} Credits →`}
              </button>
            </div>
          ))}
        </div>

        {/* Credit cost breakdown */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8 mb-10">
          <h3 className="text-sm font-black uppercase tracking-widest text-white/30 mb-6">What costs credits?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CREDIT_COSTS.map(c => (
              <div key={c.action} className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                <span className="text-sm text-white/60">{c.action}</span>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-black ${c.credits === 0 ? "text-green-400" : "text-cyan-300"}`}>
                    {c.credits === 0 ? "FREE" : `${c.credits} credit${c.credits > 1 ? "s" : ""}`}
                  </span>
                  <span className="text-xs text-white/20 w-12 text-right">{c.cost}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust signals */}
        <div className="grid grid-cols-3 gap-6 text-center">
          {[
            { icon: Shield, label: "Secure Payments", sub: "Powered by Stripe" },
            { icon: Zap, label: "Instant Credits", sub: "Added immediately after payment" },
            { icon: TrendingUp, label: "Credits Never Expire", sub: "Use them whenever you need" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
                <Icon className="w-5 h-5 text-white/30" />
              </div>
              <p className="text-xs font-bold text-white/50">{label}</p>
              <p className="text-[10px] text-white/25">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function BillingPage() {
  return <Suspense><BillingContent /></Suspense>;
}
