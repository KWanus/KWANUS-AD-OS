"use client";

import { useEffect, useState } from "react";
import SimplifiedNav from "@/components/SimplifiedNav";
import Link from "next/link";
import {
  DollarSign, TrendingUp, Users, Target, ArrowUpRight, ArrowDownRight,
  BarChart3, PieChart, Loader2, ArrowLeft,
} from "lucide-react";

interface DashboardMetrics {
  totalRevenue: number;
  currentMRR: number;
  avgDealSize: number;
  ltv: number;
  revenueBySource: Array<{
    source: string;
    clients: number;
    totalRevenue: number;
    avgDealSize: number;
    conversionRate: number;
  }>;
  topClients: Array<{
    clientId: string;
    clientName: string;
    source: string;
    totalRevenue: number;
    lifetimeValue: number;
  }>;
  mrrProjection: {
    currentMRR: number;
    projectedMRR: number;
    growthRate: number;
    churnRate: number;
    newMRR: number;
    churnedMRR: number;
  };
  revenueThisMonth: number;
  revenueLastMonth: number;
  growthRate: number;
}

interface RevenueHistory {
  month: string;
  revenue: number;
  clients: number;
}

export default function RevenueAnalyticsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [history, setHistory] = useState<RevenueHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/analytics/revenue");
      const data = await res.json() as {
        ok: boolean;
        metrics?: DashboardMetrics;
        history?: RevenueHistory[];
      };

      if (data.ok) {
        if (data.metrics) setMetrics(data.metrics);
        if (data.history) setHistory(data.history);
      }
    } catch (err) {
      console.error("Failed to fetch revenue data:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-t-bg text-white">
        <SimplifiedNav />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-white/40" />
          </div>
        </main>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-t-bg text-white">
        <SimplifiedNav />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <p className="text-white/40">Failed to load revenue data</p>
        </main>
      </div>
    );
  }

  const maxRevenue = Math.max(...history.map(h => h.revenue), 1);
  const { mrrProjection } = metrics;
  const projectionChange = mrrProjection.projectedMRR - mrrProjection.currentMRR;
  const projectionPositive = projectionChange >= 0;

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <SimplifiedNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">Revenue Analytics</h1>
          <p className="text-sm text-white/35">Track revenue, attribution, and MRR projections</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            icon={DollarSign}
            label="Total Revenue"
            value={`$${metrics.totalRevenue.toLocaleString()}`}
            change={metrics.growthRate}
            changeLabel="vs last month"
          />
          <MetricCard
            icon={TrendingUp}
            label="Current MRR"
            value={`$${metrics.currentMRR.toLocaleString()}`}
            subtitle={`Projected: $${mrrProjection.projectedMRR.toLocaleString()}`}
          />
          <MetricCard
            icon={Target}
            label="Avg Deal Size"
            value={`$${metrics.avgDealSize.toLocaleString()}`}
            subtitle={`LTV: $${metrics.ltv.toLocaleString()}`}
          />
          <MetricCard
            icon={BarChart3}
            label="This Month"
            value={`$${metrics.revenueThisMonth.toLocaleString()}`}
            subtitle={`Last: $${metrics.revenueLastMonth.toLocaleString()}`}
          />
        </div>

        {/* Revenue Trend Chart */}
        {history.length > 0 && (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 mb-8">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="w-5 h-5 text-[#f5a623]" />
              <h2 className="text-base font-black text-white">Revenue Trend (Last 6 Months)</h2>
            </div>

            {/* Chart */}
            <div className="space-y-3">
              {history.map((item, idx) => {
                const percentage = (item.revenue / maxRevenue) * 100;
                const isCurrentMonth = idx === history.length - 1;
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white/60">{item.month}</span>
                      <div className="text-right">
                        <p className="text-sm font-black text-white">
                          ${item.revenue.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-white/40">{item.clients} clients</p>
                      </div>
                    </div>
                    <div className="h-10 rounded-xl bg-white/[0.03] overflow-hidden relative">
                      <div
                        className={`h-full rounded-xl transition-all duration-500 ${
                          isCurrentMonth
                            ? "bg-gradient-to-r from-emerald-500/70 to-emerald-400/70"
                            : "bg-gradient-to-r from-[#f5a623]/50 to-[#e07850]/50"
                        }`}
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      >
                        <div className="absolute inset-0 flex items-center justify-end pr-3">
                          {percentage > 15 && (
                            <span className="text-xs font-bold text-white">
                              ${item.revenue.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MRR Projection */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 mb-8">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-black text-white">MRR Projection</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">
                Current MRR
              </p>
              <p className="text-xl font-black text-white">
                ${mrrProjection.currentMRR.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">
                Projected MRR
              </p>
              <p className="text-xl font-black text-white">
                ${mrrProjection.projectedMRR.toLocaleString()}
              </p>
              <p
                className={`text-xs font-bold mt-1 ${
                  projectionPositive ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {projectionPositive ? "+" : ""}
                {projectionChange.toLocaleString()} next month
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">
                New MRR
              </p>
              <p className="text-xl font-black text-emerald-400">
                +${mrrProjection.newMRR.toLocaleString()}
              </p>
              <p className="text-xs text-white/40 mt-1">From new clients</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">
                Churn Rate
              </p>
              <p className="text-xl font-black text-red-400">{mrrProjection.churnRate}%</p>
              <p className="text-xs text-white/40 mt-1">
                -${mrrProjection.churnedMRR.toLocaleString()} lost
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Source */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
            <div className="flex items-center gap-2 mb-5">
              <PieChart className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-black text-white">Revenue by Source</h2>
            </div>

            <div className="space-y-3">
              {metrics.revenueBySource.slice(0, 5).map((source, idx) => {
                const percentage =
                  metrics.totalRevenue > 0 ? (source.totalRevenue / metrics.totalRevenue) * 100 : 0;
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <p className="text-sm font-bold text-white">{source.source}</p>
                        <p className="text-xs text-white/40">
                          {source.clients} clients • ${source.avgDealSize.toLocaleString()} avg
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-white">
                          ${source.totalRevenue.toLocaleString()}
                        </p>
                        <p className="text-xs text-white/40">{percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#f5a623] to-[#e07850] rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Clients */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
            <div className="flex items-center gap-2 mb-5">
              <Users className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-black text-white">Top Clients</h2>
            </div>

            <div className="space-y-3">
              {metrics.topClients.map((client, idx) => (
                <Link
                  key={client.clientId}
                  href={`/clients/${client.clientId}`}
                  className="flex items-center justify-between p-3 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:border-emerald-400/20 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f5a623] to-[#e07850] flex items-center justify-center text-xs font-black text-white">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
                        {client.clientName}
                      </p>
                      <p className="text-xs text-white/40">{client.source}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white">
                      ${client.totalRevenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-white/40">
                      LTV: ${client.lifetimeValue.toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  change,
  changeLabel,
  subtitle,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  change?: number;
  changeLabel?: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-white/[0.05]">
          <Icon className="w-4 h-4 text-[#f5a623]" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">{label}</p>
      </div>
      <p className="text-2xl font-black text-white mb-1">{value}</p>
      {change !== undefined && changeLabel && (
        <div className="flex items-center gap-1">
          {change >= 0 ? (
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
          )}
          <p className={`text-xs font-bold ${change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {Math.abs(change).toFixed(1)}% {changeLabel}
          </p>
        </div>
      )}
      {subtitle && <p className="text-xs text-white/40">{subtitle}</p>}
    </div>
  );
}
