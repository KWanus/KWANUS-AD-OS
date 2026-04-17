"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, Zap, CheckCircle, TrendingUp, Shield, Rocket } from "lucide-react";

type Access = {
  tier: string;
  canRun: boolean;
  canDeploy: boolean;
  runsRemaining: number;
  deploysRemaining: number;
  usage: { runsUsed: number; deploysUsed: number; executionsUsed: number; outcomesLogged: number };
  limits: Record<string, boolean | number>;
};

type Props = {
  feature: string; // what the user tried to access
  children: React.ReactNode;
};

const PRO_FEATURES = [
  { icon: Zap, text: "Unlimited runs with competitive intelligence" },
  { icon: Rocket, text: "Deploy websites, campaigns, and email flows" },
  { icon: TrendingUp, text: "Outcome tracking and adaptive learning" },
  { icon: Shield, text: "Edit, regenerate, compare, and export" },
];

export default function UpgradeGate({ feature, children }: Props) {
  const [access, setAccess] = useState<Access | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 3000);
    fetch("/api/himalaya/access", { signal: controller.signal })
      .then((r) => r.json() as Promise<{ ok: boolean; access?: Access }>)
      .then((data) => { if (data.ok && data.access) setAccess(data.access); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // While loading or if access check failed, show content (don't block)
  if (loading || !access) return <>{children}</>;

  // Check if the specific feature is allowed
  const featureMap: Record<string, boolean> = {
    run: access.canRun,
    deploy: access.canDeploy,
    regenerate: !!access.limits.regenerate,
    edit: !!access.limits.edit,
    export: !!access.limits.export,
    compare: !!access.limits.compare,
    templates: !!access.limits.templates,
    execution: !!access.limits.executionTracking,
    outcome: !!access.limits.outcomeTracking,
    insights: !!access.limits.adaptiveInsights,
  };

  const isAllowed = featureMap[feature] ?? true;

  if (isAllowed) return <>{children}</>;

  // Show upgrade gate
  return (
    <div className="rounded-2xl border border-purple-500/15 bg-gradient-to-br from-purple-500/[0.06] to-cyan-500/[0.06] p-5 sm:p-6">
      <div className="mb-3 flex items-center gap-2">
        <Lock className="w-4 h-4 text-[#e07850]/60" />
        <h3 className="text-sm font-bold text-white/60">Unlock Full Access</h3>
      </div>

      <p className="text-xs text-white/35 mb-4">
        {feature === "run" && `You've used ${access.usage.runsUsed} of ${access.runsRemaining + access.usage.runsUsed} free runs. Upgrade to keep building.`}
        {feature === "deploy" && `You've used ${access.usage.deploysUsed} of ${access.deploysRemaining + access.usage.deploysUsed} free deploys. Upgrade to deploy more.`}
        {!["run", "deploy"].includes(feature) && "This feature is available on the Pro plan. Upgrade to access the full Himalaya system."}
      </p>

      <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {PRO_FEATURES.map(({ icon: Icon, text }, i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl border border-white/[0.05] bg-black/20 px-3 py-3">
            <Icon className="w-3.5 h-3.5 text-[#f5a623]/50 shrink-0" />
            <p className="text-[11px] text-white/45">{text}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <Link
          href="/himalaya/upgrade"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] px-5 py-2.5 text-xs font-bold text-white transition hover:opacity-90"
        >
          <Zap className="w-3.5 h-3.5" /> Upgrade to Pro
        </Link>
        <p className="text-[10px] text-white/20 self-center">Starting at $29/month</p>
      </div>

      {/* Show usage stats */}
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/[0.05] pt-3 text-[10px] text-white/20 sm:flex sm:gap-4">
        <span>{access.usage.runsUsed} runs used</span>
        <span>{access.usage.deploysUsed} deploys used</span>
        <span>{access.usage.executionsUsed} executions</span>
        <span>{access.usage.outcomesLogged} outcomes</span>
      </div>
    </div>
  );
}

/**
 * Simple hook to check access for inline gating
 */
export function useHimalayaAccess() {
  const [access, setAccess] = useState<Access | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 3000);
    fetch("/api/himalaya/access", { signal: controller.signal })
      .then((r) => r.json() as Promise<{ ok: boolean; access?: Access }>)
      .then((data) => { if (data.ok && data.access) setAccess(data.access); })
      .catch(() => {});
  }, []);

  return access;
}
