"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  DollarSign, TrendingUp, ShoppingCart, Mail, Users, BarChart3,
  ArrowUpRight, ArrowDownRight, Loader2, Globe,
} from "lucide-react";

type RevenueData = {
  total: number;
  orders: number;
  avgOrderValue: number;
  last30Days: number;
  dailyRevenue: { date: string; orders: number; revenue: number }[];
  bySite: { siteId: string; name: string; slug: string; published: boolean; views: number; orders: number; revenue: number }[];
};

type EmailData = {
  revenue: number;
  enrolled: number;
  sent: number;
  opens: number;
  clicks: number;
  openRate: number;
  clickRate: number;
  flows: { id: string; name: string; enrolled: number; sent: number; revenue: number }[];
};

type DashboardData = {
  revenue: RevenueData;
  email: EmailData;
  contacts: number;
  leads: number;
};

export default function RevenueDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/revenue")
      .then((r) => r.json() as Promise<{ ok: boolean } & DashboardData>)
      .then((d) => { if (d.ok) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-t-bg text-white">
        <AppNav />
        <main className="max-w-6xl mx-auto px-4 py-10 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
        </main>
      </div>
    );
  }

  const rev = data?.revenue;
  const email = data?.email;
  const maxDailyRev = Math.max(...(rev?.dailyRevenue ?? []).map((d) => d.revenue), 1);

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <AppNav />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Revenue</h1>
            <p className="text-sm text-white/35 mt-1">Real-time business performance across all your sites</p>
          </div>
          <Link
            href="/"
            className="text-xs text-white/30 hover:text-white/60 transition"
          >
            ← Dashboard
          </Link>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon={DollarSign} label="Total Revenue" value={`$${(rev?.total ?? 0).toLocaleString()}`} color="text-emerald-400" />
          <StatCard icon={ShoppingCart} label="Total Orders" value={String(rev?.orders ?? 0)} color="text-[#f5a623]" />
          <StatCard icon={TrendingUp} label="Avg Order" value={`$${(rev?.avgOrderValue ?? 0).toFixed(2)}`} color="text-[#e07850]" />
          <StatCard icon={DollarSign} label="Last 30 Days" value={`$${(rev?.last30Days ?? 0).toLocaleString()}`} color="text-amber-400" />
        </div>

        {/* Revenue chart (simple bar chart) */}
        {rev && rev.dailyRevenue.length > 0 && (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 mb-8">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4">Revenue — Last 30 Days</h2>
            <div className="flex items-end gap-[2px] h-32">
              {rev.dailyRevenue.map((day, i) => {
                const height = maxDailyRev > 0 ? (day.revenue / maxDailyRev) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center group relative">
                    <div
                      className={`w-full rounded-t transition-all ${day.revenue > 0 ? "bg-emerald-500" : "bg-white/[0.06]"}`}
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                      <div className="bg-black/90 rounded-lg px-2 py-1 text-[10px] text-white whitespace-nowrap">
                        {day.date}: ${day.revenue.toFixed(2)} ({day.orders} orders)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-white/20">{rev.dailyRevenue[0]?.date}</span>
              <span className="text-[10px] text-white/20">{rev.dailyRevenue[rev.dailyRevenue.length - 1]?.date}</span>
            </div>
          </div>
        )}

        {/* Two columns: Revenue by Site + Email Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue by Site */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-[#f5a623]/60" />
              <h2 className="text-[10px] font-black uppercase tracking-widest text-white/30">Revenue by Site</h2>
            </div>
            {rev && rev.bySite.length > 0 ? (
              <div className="space-y-3">
                {rev.bySite.map((site) => (
                  <Link
                    key={site.siteId}
                    href={`/websites/${site.siteId}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-cyan-400/20 transition"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{site.name}</p>
                      <p className="text-[10px] text-white/30">{site.views.toLocaleString()} views · {site.orders} orders</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-emerald-400">${site.revenue.toLocaleString()}</p>
                      {site.views > 0 && (
                        <p className="text-[10px] text-white/20">{((site.orders / site.views) * 100).toFixed(1)}% conv</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/25 text-center py-6">No revenue data yet. Deploy a site with a payment link to start tracking.</p>
            )}
          </div>

          {/* Email Performance */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-4 h-4 text-[#e07850]/60" />
              <h2 className="text-[10px] font-black uppercase tracking-widest text-white/30">Email Performance</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <MiniStat label="Enrolled" value={String(email?.enrolled ?? 0)} />
              <MiniStat label="Sent" value={String(email?.sent ?? 0)} />
              <MiniStat label="Open Rate" value={`${email?.openRate ?? 0}%`} good={(email?.openRate ?? 0) >= 20} />
              <MiniStat label="Click Rate" value={`${email?.clickRate ?? 0}%`} good={(email?.clickRate ?? 0) >= 5} />
            </div>
            {email && email.flows.length > 0 && (
              <div className="space-y-2">
                {email.flows.map((flow) => (
                  <Link
                    key={flow.id}
                    href={`/emails/flows/${flow.id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-purple-400/20 transition text-xs"
                  >
                    <span className="text-white/60 truncate">{flow.name}</span>
                    <span className="text-white/30 shrink-0">{flow.enrolled} enrolled · {flow.sent} sent</span>
                  </Link>
                ))}
              </div>
            )}
            {email && email.revenue > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-center">
                <p className="text-xs text-emerald-400/70">Email-attributed revenue</p>
                <p className="text-xl font-bold text-emerald-300">${email.revenue.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 text-center">
            <Users className="w-5 h-5 text-[#f5a623]/40 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{data?.contacts ?? 0}</p>
            <p className="text-xs text-white/30">Total Contacts</p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 text-center">
            <BarChart3 className="w-5 h-5 text-emerald-400/40 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{data?.leads ?? 0}</p>
            <p className="text-xs text-white/30">Total Leads</p>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color} opacity-60`} />
        <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function MiniStat({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center">
      <p className={`text-lg font-bold ${good === true ? "text-emerald-400" : good === false ? "text-amber-400" : "text-white"}`}>{value}</p>
      <p className="text-[10px] text-white/25">{label}</p>
    </div>
  );
}
