"use client";

import { useState } from "react";
import AppNav from "@/components/AppNav";
import { Calculator, TrendingUp, DollarSign, Target } from "lucide-react";

export default function ProfitCalculatorPage() {
  const [adSpend, setAdSpend] = useState(500);
  const [cpc, setCpc] = useState(1.5);
  const [conversionRate, setConversionRate] = useState(2);
  const [avgOrderValue, setAvgOrderValue] = useState(97);
  const [cogs, setCogs] = useState(0);

  // Calculations
  const clicks = adSpend / cpc;
  const conversions = (clicks * conversionRate) / 100;
  const revenue = conversions * avgOrderValue;
  const grossProfit = revenue - (conversions * cogs);
  const netProfit = grossProfit - adSpend;
  const roas = adSpend > 0 ? revenue / adSpend : 0;
  const roi = adSpend > 0 ? ((netProfit / adSpend) * 100) : 0;
  const cpa = conversions > 0 ? adSpend / conversions : 0;
  const breakEvenRoas = avgOrderValue > 0 ? (avgOrderValue / (avgOrderValue - cogs)) : 1;

  const isProfitable = netProfit > 0;

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <AppNav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Profit Calculator</h1>
            <p className="text-xs text-white/35">Calculate your ROAS, ROI, and break-even from ad spend</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Inputs</p>

              <SliderInput label="Monthly Ad Spend" value={adSpend} onChange={setAdSpend} min={50} max={10000} step={50} prefix="$" />
              <SliderInput label="Cost Per Click" value={cpc} onChange={setCpc} min={0.1} max={10} step={0.1} prefix="$" />
              <SliderInput label="Conversion Rate" value={conversionRate} onChange={setConversionRate} min={0.1} max={20} step={0.1} suffix="%" />
              <SliderInput label="Average Order Value" value={avgOrderValue} onChange={setAvgOrderValue} min={5} max={5000} step={5} prefix="$" />
              <SliderInput label="Cost of Goods (per unit)" value={cogs} onChange={setCogs} min={0} max={2000} step={5} prefix="$" />
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {/* Main verdict */}
            <div className={`rounded-2xl border p-6 text-center ${isProfitable ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}`}>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">
                {isProfitable ? "Profitable" : "Unprofitable"}
              </p>
              <p className={`text-4xl font-black ${isProfitable ? "text-emerald-400" : "text-red-400"}`}>
                ${Math.abs(netProfit).toFixed(0)}
              </p>
              <p className="text-xs text-white/30 mt-1">
                {isProfitable ? "net profit per month" : "net loss per month"}
              </p>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-3">
              <MetricBox icon={DollarSign} label="Revenue" value={`$${revenue.toFixed(0)}`} color="text-[#f5a623]" />
              <MetricBox icon={TrendingUp} label="ROAS" value={`${roas.toFixed(1)}x`} color={roas >= 2 ? "text-emerald-400" : roas >= 1 ? "text-amber-400" : "text-red-400"} />
              <MetricBox icon={Target} label="CPA" value={`$${cpa.toFixed(2)}`} color="text-[#e07850]" />
              <MetricBox icon={TrendingUp} label="ROI" value={`${roi.toFixed(0)}%`} color={roi > 0 ? "text-emerald-400" : "text-red-400"} />
            </div>

            {/* Breakdown */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">Breakdown</p>
              <div className="space-y-2 text-xs">
                <Row label="Clicks from ads" value={Math.round(clicks).toLocaleString()} />
                <Row label="Conversions" value={conversions.toFixed(1)} />
                <Row label="Gross revenue" value={`$${revenue.toFixed(0)}`} />
                <Row label="COGS" value={`-$${(conversions * cogs).toFixed(0)}`} />
                <Row label="Gross profit" value={`$${grossProfit.toFixed(0)}`} />
                <Row label="Ad spend" value={`-$${adSpend.toFixed(0)}`} />
                <div className="border-t border-white/[0.06] pt-2 mt-2">
                  <Row label="Net profit" value={`${netProfit >= 0 ? "" : "-"}$${Math.abs(netProfit).toFixed(0)}`} bold />
                </div>
              </div>
            </div>

            {/* Break-even */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
              <p className="text-[10px] text-white/25">Break-even ROAS: <span className="text-white/50 font-bold">{breakEvenRoas.toFixed(1)}x</span></p>
              <p className="text-[10px] text-white/15 mt-0.5">You need ${(breakEvenRoas * adSpend).toFixed(0)} in revenue to break even on ${adSpend} spend</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SliderInput({ label, value, onChange, min, max, step, prefix, suffix }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; prefix?: string; suffix?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs text-white/50">{label}</label>
        <span className="text-xs font-bold text-white">{prefix}{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full bg-white/10 appearance-none cursor-pointer accent-[#f5a623]"
      />
    </div>
  );
}

function MetricBox({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-center">
      <Icon className={`w-4 h-4 ${color} mx-auto mb-1 opacity-60`} />
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] text-white/25">{label}</p>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`${bold ? "text-white font-bold" : "text-white/40"}`}>{label}</span>
      <span className={`font-mono ${bold ? "text-white font-bold" : "text-white/60"}`}>{value}</span>
    </div>
  );
}
