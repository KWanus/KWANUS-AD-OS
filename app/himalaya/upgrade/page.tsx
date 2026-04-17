"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Zap, Mountain, Loader2, Target, Rocket, BarChart2, TrendingUp, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import AppNav from "@/components/AppNav";
import HimalayaNav from "@/components/himalaya/HimalayaNav";

type Access = {
  tier: string;
  usage: { runsUsed: number; deploysUsed: number; executionsUsed: number; outcomesLogged: number };
};

const PLANS = [
  {
    id: "free",
    name: "Explorer",
    price: "$0",
    period: "forever",
    headline: "See what Himalaya can do",
    features: [
      "2 business runs",
      "1 deployment",
      "Basic strategy + preview assets",
      "Run history",
    ],
    notIncluded: [
      "Competitive intelligence",
      "Full asset generation",
      "Edit & regenerate with AI",
      "Execution tracking",
      "Outcome learning",
      "Templates & presets",
      "Export & compare",
    ],
    cta: "Current Plan",
    color: "white",
    popular: false,
  },
  {
    id: "pro",
    name: "Builder",
    price: "$29",
    period: "/month",
    headline: "Build, launch, and improve until you win",
    features: [
      "50 runs with competitive intelligence",
      "20 site + campaign deployments",
      "AI-powered niche research",
      "Full asset packages that beat competitors",
      "One-click deploy to site, campaigns, email",
      "Edit & regenerate with Claude AI",
      "Execution tracking with tool links",
      "Outcome learning — system gets smarter",
      "Adaptive insights from your data",
      "Templates, presets, memory",
      "Export (Markdown, DOCX, JSON, PDF)",
      "Side-by-side run comparison",
    ],
    notIncluded: [],
    cta: "Start Building",
    color: "cyan",
    popular: true,
  },
  {
    id: "business",
    name: "Operator",
    price: "$79",
    period: "/month",
    headline: "Scale across multiple businesses",
    features: [
      "Everything in Builder",
      "Unlimited runs & deployments",
      "Priority AI generation",
    ],
    notIncluded: [],
    cta: "Go Operator",
    color: "purple",
    popular: false,
  },
];

const LOOP_STEPS = [
  { icon: Target, label: "Research", description: "Scan competitors in your niche" },
  { icon: Rocket, label: "Build", description: "Generate assets that beat them" },
  { icon: Zap, label: "Deploy", description: "Launch site, campaigns, emails" },
  { icon: BarChart2, label: "Track", description: "Execute and report outcomes" },
  { icon: TrendingUp, label: "Improve", description: "System learns, next run is better" },
];

export default function HimalayaUpgradePage() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";
  const [access, setAccess] = useState<Access | null>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/himalaya/access")
      .then((r) => r.json() as Promise<{ ok: boolean; access?: Access }>)
      .then((data) => { if (data.ok && data.access) setAccess(data.access); })
      .catch(() => {});
  }, []);

  async function handleUpgrade(planId: string) {
    if (planId === "free") return;
    setUpgrading(planId);
    try {
      // Try Stripe checkout first
      const checkoutRes = await fetch("/api/himalaya/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const checkoutData = (await checkoutRes.json()) as { ok: boolean; url?: string; error?: string };

      if (checkoutData.ok && checkoutData.url) {
        // Redirect to Stripe
        window.location.href = checkoutData.url;
        return;
      }

      // Fallback: direct upgrade (dev mode / no Stripe)
      const res = await fetch("/api/himalaya/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: planId }),
      });
      const data = (await res.json()) as { ok: boolean };
      if (data.ok) window.location.reload();
    } catch {} finally { setUpgrading(null); }
  }

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <AppNav />
      <HimalayaNav />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link href="/himalaya" className="mb-8 inline-flex items-center gap-1.5 text-xs text-white/30 transition hover:text-white/60">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Himalaya
        </Link>

        {/* Hero */}
        <div className="mb-10 rounded-3xl border border-[#f5a623]/12 bg-gradient-to-br from-cyan-500/[0.06] via-transparent to-purple-500/[0.05] px-5 py-8 text-center sm:px-8 sm:py-10">
          <Mountain className="mx-auto mb-4 h-12 w-12 text-[#f5a623]" />
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">
            Don't stop at ideas.<br className="hidden sm:block" />
            Execute and improve until it works.
          </h1>
          <p className="text-sm text-white/35 max-w-lg mx-auto">
            Himalaya scans your competitors, builds assets that beat them, deploys everything, and learns from your results. Each run gets smarter.
          </p>
        </div>

        {/* Success/cancel banners */}
        {success && (
          <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 sm:flex-row sm:items-center">
            <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-emerald-300">You're upgraded!</h3>
              <p className="text-xs text-white/40">Full access is now active. Go build something great.</p>
            </div>
            <Link href="/himalaya" className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/30 sm:ml-auto sm:shrink-0">
              Start Building <Rocket className="w-3 h-3" />
            </Link>
          </div>
        )}
        {canceled && (
          <div className="mb-8 flex items-center gap-4 rounded-2xl border border-amber-500/15 bg-amber-500/5 p-5">
            <XCircle className="w-5 h-5 text-amber-400/60 shrink-0" />
            <div>
              <p className="text-xs text-white/40">Checkout was canceled. No charges were made. You can upgrade anytime.</p>
            </div>
          </div>
        )}

        {/* The Loop — visual proof */}
        <div className="mb-12 rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent p-5 sm:p-6">
          <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
            {LOOP_STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-1 sm:gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                    <step.icon className="w-4 h-4 text-[#f5a623]/60" />
                  </div>
                  <p className="text-[9px] font-bold text-white/30 text-center">{step.label}</p>
                </div>
                {i < LOOP_STEPS.length - 1 && (
                  <div className="text-white/10 text-xs font-bold mt-[-12px]">→</div>
                )}
              </div>
            ))}
            <div className="text-[#f5a623]/30 text-xs font-bold mt-[-12px] ml-1">↻</div>
          </div>
          <p className="text-center text-[10px] text-white/20 mt-3">
            Each cycle makes your business stronger. That's the real product.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {PLANS.map((plan) => {
            const isCurrent = access?.tier === plan.id;
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 ${
                  plan.popular
                    ? "bg-gradient-to-br from-cyan-500/[0.08] to-purple-500/[0.06] border-[#f5a623]/25"
                    : "bg-gradient-to-br from-white/[0.03] via-white/[0.02] to-transparent border-white/[0.07]"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-[#f5a623] to-[#e07850] text-[9px] font-black text-white uppercase tracking-wider">
                    Most Chosen
                  </span>
                )}

                <h3 className="text-lg font-black text-white mb-0.5">{plan.name}</h3>
                <p className="text-xs text-white/30 mb-3">{plan.headline}</p>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-black text-white">{plan.price}</span>
                  <span className="text-xs text-white/25">{plan.period}</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/50">
                      <Check className="w-3.5 h-3.5 text-emerald-400/60 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                  {plan.notIncluded.map((f, i) => (
                    <li key={`no-${i}`} className="flex items-start gap-2 text-xs text-white/15 line-through">
                      <span className="w-3.5 h-3.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => void handleUpgrade(plan.id)}
                  disabled={isCurrent || upgrading === plan.id}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition ${
                    isCurrent
                      ? "bg-white/[0.04] border border-white/[0.08] text-white/30 cursor-default"
                      : plan.popular
                        ? "bg-gradient-to-r from-[#f5a623] to-[#e07850] text-white hover:opacity-90"
                        : "bg-white/[0.04] border border-white/[0.1] text-white/60 hover:text-white hover:border-white/[0.2]"
                  } disabled:opacity-40`}
                >
                  {upgrading === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : isCurrent ? (
                    "Current Plan"
                  ) : (
                    plan.cta
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Manage billing for paid users */}
        {access && access.tier !== "free" && (
          <div className="text-center mb-6">
            <button
              onClick={async () => {
                const res = await fetch("/api/himalaya/billing", { method: "POST" });
                const data = (await res.json()) as { ok: boolean; url?: string };
                if (data.ok && data.url) window.location.href = data.url;
              }}
              className="text-xs text-white/25 hover:text-white/50 transition underline"
            >
              Manage billing, cancel, or change plan
            </button>
          </div>
        )}

        {/* Social proof / urgency */}
        <div className="space-y-3 rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-white/[0.015] to-transparent px-5 py-6 text-center">
          <div className="flex justify-center gap-6 text-[11px] text-white/25">
            <span>Runs completing daily</span>
            <span>Sites being deployed</span>
            <span>Results improving</span>
          </div>
          <p className="text-xs text-white/30 font-semibold">Most users see their first result after executing one plan.</p>
          <p className="text-[10px] text-white/15">
            Cancel anytime. No contracts. Your data stays yours.
          </p>
        </div>

        {/* Usage stats */}
        {access && (
          <div className="mt-8 border-t border-white/[0.05] pt-6 text-center">
            <p className="text-[10px] text-white/15 mb-2">Your usage so far</p>
            <div className="grid grid-cols-2 gap-3 text-[11px] text-white/25 sm:flex sm:justify-center sm:gap-6">
              <span><span className="text-white/40 font-bold">{access.usage.runsUsed}</span> runs</span>
              <span><span className="text-white/40 font-bold">{access.usage.deploysUsed}</span> deploys</span>
              <span><span className="text-white/40 font-bold">{access.usage.executionsUsed}</span> executions</span>
              <span><span className="text-white/40 font-bold">{access.usage.outcomesLogged}</span> outcomes</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
