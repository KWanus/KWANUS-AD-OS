"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Zap, Mountain, Loader2 } from "lucide-react";
import AppNav from "@/components/AppNav";
import HimalayaNav from "@/components/himalaya/HimalayaNav";

type Access = {
  tier: string;
  usage: { runsUsed: number; deploysUsed: number; executionsUsed: number; outcomesLogged: number };
};

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Try Himalaya with limited access",
    features: [
      "2 business runs",
      "1 deployment",
      "Basic strategy + partial assets",
      "Run history",
    ],
    notIncluded: [
      "Competitive intelligence",
      "Full asset generation",
      "Edit & regenerate",
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
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "Full Himalaya system for serious builders",
    features: [
      "50 runs per month",
      "20 deployments per month",
      "Competitive intelligence scanning",
      "Claude-powered generation",
      "Full asset packages",
      "Deploy websites, campaigns, emails",
      "Edit & regenerate with AI",
      "Execution tracking + outcome learning",
      "Adaptive insights from your data",
      "Templates, presets, memory",
      "Export (Markdown, DOCX, JSON, PDF)",
      "Run comparison",
    ],
    notIncluded: [],
    cta: "Upgrade to Pro",
    color: "cyan",
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    price: "$79",
    period: "/month",
    description: "For agencies and operators running multiple businesses",
    features: [
      "Everything in Pro",
      "Unlimited runs",
      "Unlimited deployments",
      "Priority support",
      "Team access (coming soon)",
      "Advanced analytics (coming soon)",
    ],
    notIncluded: [],
    cta: "Go Business",
    color: "purple",
    popular: false,
  },
];

export default function HimalayaUpgradePage() {
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

    // For now, direct upgrade (no Stripe yet)
    // In production, this would redirect to Stripe Checkout
    try {
      const res = await fetch("/api/himalaya/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: planId }),
      });
      const data = (await res.json()) as { ok: boolean };
      if (data.ok) {
        window.location.reload();
      }
    } catch {
      // non-fatal
    } finally {
      setUpgrading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <HimalayaNav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/himalaya" className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Himalaya
        </Link>

        <div className="text-center mb-10">
          <Mountain className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
          <h1 className="text-2xl font-black text-white mb-2">Upgrade Himalaya</h1>
          <p className="text-sm text-white/35 max-w-lg mx-auto">
            Himalaya builds your business, deploys your assets, and learns from your results to improve over time. Unlock the full system.
          </p>
          {access && (
            <p className="text-xs text-white/20 mt-3">
              Current plan: <span className="text-white/40 font-bold capitalize">{access.tier}</span> ·
              {access.usage.runsUsed} runs · {access.usage.deploysUsed} deploys
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = access?.tier === plan.id;
            return (
              <div
                key={plan.id}
                className={`rounded-2xl border p-6 relative ${
                  plan.popular
                    ? "bg-gradient-to-br from-cyan-500/[0.08] to-purple-500/[0.06] border-cyan-500/25"
                    : "bg-white/[0.02] border-white/[0.07]"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-cyan-500 text-[10px] font-black text-white uppercase tracking-wider">
                    Most Popular
                  </span>
                )}

                <h3 className="text-lg font-black text-white mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-2xl font-black text-white">{plan.price}</span>
                  <span className="text-xs text-white/30">{plan.period}</span>
                </div>
                <p className="text-xs text-white/35 mb-4">{plan.description}</p>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/50">
                      <Check className="w-3.5 h-3.5 text-emerald-400/60 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                  {plan.notIncluded.map((f, i) => (
                    <li key={`no-${i}`} className="flex items-start gap-2 text-xs text-white/20 line-through">
                      <span className="w-3.5 h-3.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => void handleUpgrade(plan.id)}
                  disabled={isCurrent || upgrading === plan.id}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition ${
                    isCurrent
                      ? "bg-white/[0.04] border border-white/[0.08] text-white/30 cursor-default"
                      : plan.popular
                        ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:opacity-90"
                        : "bg-white/[0.04] border border-white/[0.1] text-white/60 hover:text-white hover:border-white/[0.2]"
                  } disabled:opacity-40`}
                >
                  {upgrading === plan.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
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

        <p className="text-center text-[10px] text-white/15 mt-8">
          All plans include the core Himalaya system. Upgrade or downgrade anytime.
        </p>
      </main>
    </div>
  );
}
