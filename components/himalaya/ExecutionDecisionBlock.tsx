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
    <div className="rounded-3xl border border-[#f5a623]/20 bg-gradient-to-br from-[#f5a623]/[0.08] via-transparent to-[#e07850]/[0.06] p-6 print:hidden">
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#f5a623]/70">Unlock Execution</p>
      {/* Main message */}
      <h3 className="mb-1 text-base font-black text-white">
        {mode === "consultant"
          ? "This plan only works if you execute it."
          : "Your foundation is built. The next step is execution."}
      </h3>
      <p className="mb-5 max-w-lg text-xs leading-6 text-white/40">
        {mode === "consultant"
          ? "Deploy the improvements, track what changes, and iterate until your numbers improve."
          : "Deploy your site, launch your marketing, and track what works. The system learns from your results and gets smarter each time."}
      </p>

      {/* Value props — what they unlock */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-white text-sm font-bold hover:opacity-90 transition"
        >
          Unlock Execution & Tracking <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <p className="text-[10px] text-white/20">Starting at $29/month</p>
      </div>

      {/* Proof */}
      <p className="mt-4 text-[10px] italic text-white/15">
        Most users upgrade after their first run. Don't stop at ideas — execute and improve until it works.
      </p>
    </div>
  );
}

function ValueProp({ icon: Icon, label, detail }: { icon: React.ElementType; label: string; detail: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3 text-center">
      <Icon className="mx-auto mb-2 h-4 w-4 text-[#f5a623]/50" />
      <p className="text-[11px] font-bold text-white/55">{label}</p>
      <p className="mt-1 text-[9px] text-white/25">{detail}</p>
    </div>
  );
}
