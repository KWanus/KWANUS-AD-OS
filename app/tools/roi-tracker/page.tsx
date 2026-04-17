"use client";

import { useState, useEffect } from "react";
import AppNav from "@/components/AppNav";
import { TrendingUp, DollarSign, Target, Loader2 } from "lucide-react";

type ROIEntry = {
  month: string;
  adSpend: number;
  revenue: number;
  leads: number;
  customers: number;
};

export default function ROITrackerPage() {
  const [entries, setEntries] = useState<ROIEntry[]>([
    { month: "Month 1", adSpend: 0, revenue: 0, leads: 0, customers: 0 },
    { month: "Month 2", adSpend: 0, revenue: 0, leads: 0, customers: 0 },
    { month: "Month 3", adSpend: 0, revenue: 0, leads: 0, customers: 0 },
  ]);

  function updateEntry(idx: number, field: keyof ROIEntry, value: string) {
    if (field === "month") {
      setEntries(entries.map((e, i) => i === idx ? { ...e, month: value } : e));
    } else {
      setEntries(entries.map((e, i) => i === idx ? { ...e, [field]: parseFloat(value) || 0 } : e));
    }
  }

  function addMonth() {
    setEntries([...entries, { month: `Month ${entries.length + 1}`, adSpend: 0, revenue: 0, leads: 0, customers: 0 }]);
  }

  const totalSpend = entries.reduce((s, e) => s + e.adSpend, 0);
  const totalRevenue = entries.reduce((s, e) => s + e.revenue, 0);
  const totalLeads = entries.reduce((s, e) => s + e.leads, 0);
  const totalCustomers = entries.reduce((s, e) => s + e.customers, 0);
  const totalROI = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend * 100) : 0;
  const totalROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const cac = totalCustomers > 0 ? totalSpend / totalCustomers : 0;
  const ltv = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  const isProfitable = totalRevenue > totalSpend;

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <AppNav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">ROI Tracker</h1>
            <p className="text-xs text-white/35">Track your return on investment month over month</p>
          </div>
        </div>

        {/* Data table */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden mb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/30 text-left">Month</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/30 text-right">Ad Spend</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/30 text-right">Revenue</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/30 text-right">Leads</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/30 text-right">Customers</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/30 text-right">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => {
                const roas = entry.adSpend > 0 ? entry.revenue / entry.adSpend : 0;
                return (
                  <tr key={i} className="border-b border-white/[0.04]">
                    <td className="px-4 py-2">
                      <input type="text" value={entry.month} onChange={(e) => updateEntry(i, "month", e.target.value)}
                        className="bg-transparent text-xs text-white/60 outline-none w-20" />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <input type="number" value={entry.adSpend || ""} onChange={(e) => updateEntry(i, "adSpend", e.target.value)}
                        placeholder="0" className="bg-transparent text-xs text-white/60 outline-none w-20 text-right" />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <input type="number" value={entry.revenue || ""} onChange={(e) => updateEntry(i, "revenue", e.target.value)}
                        placeholder="0" className="bg-transparent text-xs text-white/60 outline-none w-20 text-right" />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <input type="number" value={entry.leads || ""} onChange={(e) => updateEntry(i, "leads", e.target.value)}
                        placeholder="0" className="bg-transparent text-xs text-white/60 outline-none w-16 text-right" />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <input type="number" value={entry.customers || ""} onChange={(e) => updateEntry(i, "customers", e.target.value)}
                        placeholder="0" className="bg-transparent text-xs text-white/60 outline-none w-16 text-right" />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span className={`text-xs font-bold ${roas >= 2 ? "text-emerald-400" : roas >= 1 ? "text-amber-400" : roas > 0 ? "text-red-400" : "text-white/20"}`}>
                        {roas > 0 ? `${roas.toFixed(1)}x` : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-2">
            <button onClick={addMonth} className="text-[10px] text-[#f5a623]/60 hover:text-[#f5a623] transition">+ Add month</button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className={`rounded-2xl border p-5 text-center ${isProfitable ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}`}>
            <p className={`text-2xl font-black ${isProfitable ? "text-emerald-400" : "text-red-400"}`}>{totalROI >= 0 ? "+" : ""}{totalROI.toFixed(0)}%</p>
            <p className="text-[10px] text-white/25">Total ROI</p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 text-center">
            <p className={`text-2xl font-black ${totalROAS >= 2 ? "text-emerald-400" : "text-white"}`}>{totalROAS.toFixed(1)}x</p>
            <p className="text-[10px] text-white/25">ROAS</p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 text-center">
            <p className="text-2xl font-black text-white">${cac.toFixed(0)}</p>
            <p className="text-[10px] text-white/25">CAC</p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 text-center">
            <p className="text-2xl font-black text-white">${ltv.toFixed(0)}</p>
            <p className="text-[10px] text-white/25">LTV per Customer</p>
          </div>
        </div>

        {/* Totals row */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-center justify-between text-xs text-white/40">
          <span>Total Spend: <strong className="text-white">${totalSpend.toLocaleString()}</strong></span>
          <span>Total Revenue: <strong className="text-emerald-400">${totalRevenue.toLocaleString()}</strong></span>
          <span>Total Leads: <strong className="text-white">{totalLeads}</strong></span>
          <span>Total Customers: <strong className="text-white">{totalCustomers}</strong></span>
        </div>
      </main>
    </div>
  );
}
