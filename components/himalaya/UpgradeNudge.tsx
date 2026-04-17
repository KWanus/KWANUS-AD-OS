"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, TrendingUp, Rocket, BarChart2, ArrowRight } from "lucide-react";
import { track } from "@/lib/himalaya/tracking";

type Access = {
  tier: string;
  canRun: boolean;
  canDeploy: boolean;
  limits: Record<string, boolean>;
};

type NudgeContext =
  | "after_results"
  | "after_deploy"
  | "after_outcome"
  | "after_execution"
  | "locked_feature";

const NUDGE_CONFIG: Record<NudgeContext, {
  icon: React.ElementType;
  headline: string;
  message: string;
  cta: string;
  color: string;
  urgency?: string;
}> = {
  after_results: {
    icon: TrendingUp,
    headline: "Your foundation is ready. Now make it work.",
    message: "Unlock execution tracking, deployment, and outcome learning to turn this foundation into real results that improve over time.",
    cta: "Unlock Full Execution",
    color: "from-cyan-500/[0.06] to-purple-500/[0.06] border-[#f5a623]/15",
    urgency: "Most users upgrade after seeing their first results",
  },
  after_deploy: {
    icon: Rocket,
    headline: "Your site is live. Now optimize it.",
    message: "Track which changes actually improve conversions, get adaptive insights, and regenerate assets based on real performance data.",
    cta: "Unlock Tracking & Optimization",
    color: "from-emerald-500/[0.06] to-cyan-500/[0.06] border-emerald-500/15",
    urgency: "Don't just launch — learn and improve",
  },
  after_outcome: {
    icon: BarChart2,
    headline: "This is where Himalaya gets powerful.",
    message: "Your outcome data feeds the learning loop. With Pro, every run gets smarter — better recommendations, sharper assets, higher conversion rates.",
    cta: "Unlock Adaptive Intelligence",
    color: "from-purple-500/[0.06] to-pink-500/[0.06] border-purple-500/15",
    urgency: "The system improves with every outcome you report",
  },
  after_execution: {
    icon: Zap,
    headline: "You executed. Now track the impact.",
    message: "Upgrade to see which steps drove results, get improvement suggestions, and run again with competitive intelligence.",
    cta: "Unlock Outcome Tracking",
    color: "from-amber-500/[0.06] to-orange-500/[0.06] border-amber-500/15",
  },
  locked_feature: {
    icon: Zap,
    headline: "This feature is part of the full system.",
    message: "Himalaya Pro unlocks competitive intelligence, deployment, execution tracking, and adaptive learning that improves your results over time.",
    cta: "Upgrade to Pro",
    color: "from-cyan-500/[0.06] to-purple-500/[0.06] border-[#f5a623]/15",
  },
};

export default function UpgradeNudge({ context, onDismiss }: { context: NudgeContext; onDismiss?: () => void }) {
  const [access, setAccess] = useState<Access | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 3000);
    fetch("/api/himalaya/access", { signal: controller.signal })
      .then((r) => r.json() as Promise<{ ok: boolean; access?: Access }>)
      .then((data) => { if (data.ok && data.access) setAccess(data.access); })
      .catch(() => {});
  }, []);

  // Don't show for paid users
  if (!access || access.tier !== "free") return null;
  if (dismissed) return null;

  const config = NUDGE_CONFIG[context];
  const Icon = config.icon;

  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-4 sm:p-5 ${config.color}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
          <Icon className="w-5 h-5 text-white/50" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white/70 mb-1">{config.headline}</h3>
          <p className="text-xs text-white/40 leading-relaxed mb-3">{config.message}</p>

          {config.urgency && (
            <p className="text-[10px] text-white/25 italic mb-3">{config.urgency}</p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <Link
              href="/himalaya/upgrade"
              onClick={() => track.upgradeClick(context)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
            >
              {config.cta} <ArrowRight className="w-3 h-3" />
            </Link>
            {onDismiss && (
              <button
                onClick={() => { setDismissed(true); onDismiss(); }}
                className="text-left text-[10px] text-white/20 transition hover:text-white/40"
              >
                maybe later
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
