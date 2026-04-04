"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Rocket, BarChart2, TrendingUp, Users } from "lucide-react";
import { track } from "@/lib/himalaya/tracking";

type Access = { tier: string };

export default function ExecutionDecisionBlock({ runId, mode }: { runId: string; mode: string }) {
  const [tier, setTier] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 3000);
    fetch("/api/himalaya/access", { signal: controller.signal })
      .then((r) => r.json() as Promise<{ ok: boolean; access?: Access }>)
      .then((data) => { if (data.ok && data.access) setTier(data.access.tier); })
      .catch(() => setTier("free"));
  }, []);

  // Don't show for paid users — they already have access
  if (!tier || tier !== "free") return null;

  return (
    <div className="bg-gradient-to-br from-cyan-500/[0.07] to-purple-500/[0.05] border border-cyan-500/20 rounded-2xl p-6 print:hidden">
      {/* Main message */}
      <h3 className="text-base font-black text-white mb-1">
        {mode === "consultant"
          ? "This plan only works if you execute it."
          : "Your foundation is built. The next step is execution."}
      </h3>
      <p className="text-xs text-white/40 mb-5 max-w-lg">
        {mode === "consultant"
          ? "Deploy the improvements, track what changes, and iterate until your numbers improve."
          : "Deploy your site, launch your marketing, and track what works. The system learns from your results and gets smarter each time."}
      </p>

      {/* Value props — what they unlock */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <ValueProp icon={Rocket} label="Deploy everything" detail="Site, ads, emails — one click" />
        <ValueProp icon={BarChart2} label="Track outcomes" detail="See what actually works" />
        <ValueProp icon={TrendingUp} label="Improve over time" detail="Each run gets smarter" />
        <ValueProp icon={Users} label="Beat competitors" detail="AI scans your market" />
      </div>

      {/* CTA */}
      <div className="flex items-center gap-4">
        <Link
          href="/himalaya/upgrade"
          onClick={() => track.upgradeClick("decision_block")}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition"
        >
          Unlock Execution & Tracking <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <p className="text-[10px] text-white/20">Starting at $29/month</p>
      </div>

      {/* Proof */}
      <p className="text-[10px] text-white/15 mt-4 italic">
        Most users upgrade after their first run. Don't stop at ideas — execute and improve until it works.
      </p>
    </div>
  );
}

function ValueProp({ icon: Icon, label, detail }: { icon: React.ElementType; label: string; detail: string }) {
  return (
    <div className="text-center">
      <Icon className="w-4 h-4 text-cyan-400/50 mx-auto mb-1" />
      <p className="text-[11px] font-bold text-white/50">{label}</p>
      <p className="text-[9px] text-white/25">{detail}</p>
    </div>
  );
}
