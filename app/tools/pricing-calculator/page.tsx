"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import { DollarSign, TrendingUp, Users, Target } from "lucide-react";

export default function PricingCalculatorPage() {
  const [hourlyRate, setHourlyRate] = useState(100);
  const [hoursPerProject, setHoursPerProject] = useState(20);
  const [targetMonthly, setTargetMonthly] = useState(10000);
  const [cogs, setCogs] = useState(0);
  const [overhead, setOverhead] = useState(500);

  const projectCost = hourlyRate * hoursPerProject;
  const grossMargin = projectCost - cogs;
  const marginPercent = projectCost > 0 ? (grossMargin / projectCost) * 100 : 0;
  const projectsNeeded = grossMargin > 0 ? Math.ceil((targetMonthly + overhead) / grossMargin) : 0;
  const annualRevenue = projectCost * projectsNeeded * 12;
  const annualProfit = (grossMargin * projectsNeeded - overhead) * 12;

  // Pricing tiers
  const tiers = [
    { name: "Starter", multiplier: 0.7, label: "Accessible entry point" },
    { name: "Standard", multiplier: 1.0, label: "Your calculated rate" },
    { name: "Premium", multiplier: 1.6, label: "High-touch, premium service" },
  ];

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <AppNav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Pricing Calculator</h1>
            <p className="text-xs text-white/35">Calculate your project pricing from income goals</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Your Numbers</p>
              <Slider label="Hourly Rate" value={hourlyRate} onChange={setHourlyRate} min={25} max={500} step={5} prefix="$" />
              <Slider label="Hours Per Project" value={hoursPerProject} onChange={setHoursPerProject} min={1} max={100} step={1} suffix="h" />
              <Slider label="Target Monthly Income" value={targetMonthly} onChange={setTargetMonthly} min={1000} max={50000} step={500} prefix="$" />
              <Slider label="Cost Per Project (COGS)" value={cogs} onChange={setCogs} min={0} max={5000} step={50} prefix="$" />
              <Slider label="Monthly Overhead" value={overhead} onChange={setOverhead} min={0} max={5000} step={100} prefix="$" />
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {/* Project price */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/60">Your Project Price</p>
              <p className="text-4xl font-black text-emerald-400 mt-1">${projectCost.toLocaleString()}</p>
              <p className="text-xs text-white/30 mt-1">{marginPercent.toFixed(0)}% margin · {hoursPerProject}h of work</p>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-3">
              <Metric icon={Target} label="Projects/Month" value={String(projectsNeeded)} color="text-[#f5a623]" />
              <Metric icon={TrendingUp} label="Annual Revenue" value={`$${(annualRevenue / 1000).toFixed(0)}k`} color="text-emerald-400" />
              <Metric icon={DollarSign} label="Annual Profit" value={`$${(annualProfit / 1000).toFixed(0)}k`} color="text-[#e07850]" />
              <Metric icon={Users} label="Clients Needed" value={`${projectsNeeded}/mo`} color="text-amber-400" />
            </div>

            {/* Tier pricing */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Suggested Tier Pricing</p>
              <div className="space-y-2">
                {tiers.map((tier) => {
                  const price = Math.round(projectCost * tier.multiplier);
                  return (
                    <div key={tier.name} className={`flex items-center justify-between p-3 rounded-xl border ${
                      tier.multiplier === 1.0 ? "border-[#f5a623]/20 bg-[#f5a623]/5" : "border-white/[0.06] bg-white/[0.02]"
                    }`}>
                      <div>
                        <p className="text-xs font-bold text-white">{tier.name}</p>
                        <p className="text-[10px] text-white/25">{tier.label}</p>
                      </div>
                      <p className={`text-lg font-black ${tier.multiplier === 1.0 ? "text-[#f5a623]" : "text-white"}`}>
                        ${price.toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Breakeven */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center text-xs text-white/30">
              You need <strong className="text-white">{projectsNeeded} projects/month</strong> at <strong className="text-emerald-400">${projectCost}</strong> each to hit <strong className="text-white">${targetMonthly.toLocaleString()}/mo</strong> after costs.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Slider({ label, value, onChange, min, max, step, prefix, suffix }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; prefix?: string; suffix?: string;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-white/50">{label}</span>
        <span className="text-xs font-bold text-white">{prefix}{value.toLocaleString()}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full bg-white/10 appearance-none cursor-pointer accent-[#f5a623]" />
    </div>
  );
}

function Metric({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-center">
      <Icon className={`w-4 h-4 ${color} mx-auto mb-1 opacity-60`} />
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] text-white/25">{label}</p>
    </div>
  );
}
