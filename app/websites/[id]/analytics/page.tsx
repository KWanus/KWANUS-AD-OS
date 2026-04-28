"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import SimplifiedNav from "@/components/SimplifiedNav";
import {
  ArrowLeft,
  Loader2,
  Eye,
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  FileText,
  Globe,
  BarChart3,
  Filter,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyView {
  date: string;
  views: number;
}

interface TopPage {
  title: string;
  slug: string;
  views: number;
}

interface RecentLead {
  name: string | null;
  email: string;
  score: number;
  status: string;
  date: string;
}

interface RecentOrder {
  email: string;
  amount: number;
  date: string;
}

interface SiteAnalytics {
  totalViews: number;
  totalLeads: number;
  totalOrders: number;
  totalRevenue: number;
  conversionRate: number;
  published: boolean;
  dailyViews: DailyView[];
  topPages: TopPage[];
  recentLeads: RecentLead[];
  recentOrders: RecentOrder[];
  sources: Record<string, number>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SiteAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<SiteAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [funnel, setFunnel] = useState<{steps: {name: string; count: number; rate: number}[]} | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/sites/${id}/analytics`).then((r) => r.json()),
      fetch(`/api/analytics/dashboard?siteId=${id}`).then((r) => r.json()).catch(() => null),
    ])
      .then(([analyticsJson, dashboardJson]) => {
        if (analyticsJson.ok) setData(analyticsJson.analytics);
        else setError(analyticsJson.error ?? "Unknown error");

        if (dashboardJson?.ok && dashboardJson.funnel) {
          setFunnel(dashboardJson.funnel);
        }
      })
      .catch(() => setError("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Loading / Error ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="min-h-screen bg-t-bg text-t-text">
        <SimplifiedNav />
        <div className="flex items-center justify-center min-h-[70vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#f5a623]" />
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-t-bg text-t-text">
        <SimplifiedNav />
        <div className="max-w-4xl mx-auto text-center py-20 px-4">
          <p className="text-red-400">{error ?? "No data"}</p>
          <Link href={`/websites/${id}`} className="mt-4 inline-block text-[#f5a623] hover:underline">Back to site</Link>
        </div>
      </main>
    );
  }

  const maxDailyView = Math.max(...data.dailyViews.map((d) => d.views), 1);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-t-bg text-t-text">
      <SimplifiedNav />
      <div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link
              href={`/websites/${id}`}
              className="flex items-center gap-2 text-sm text-[#f5a623]/70 hover:text-[#f5a623] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to site
            </Link>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Site Analytics
              </h1>
              <p className="text-sm text-[#f5f0e8]/50 mt-1">
                Performance overview — last 30 days
              </p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium tracking-widest uppercase ${
                data.published
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20"
              }`}
            >
              {data.published ? "Live" : "Draft"}
            </div>
          </div>

          {/* ── Stat Cards ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Eye className="w-5 h-5" />}
              label="Total Views"
              value={data.totalViews.toLocaleString()}
              color="text-[#f5a623]"
              borderColor="border-[#f5a623]/20"
              bgColor="bg-[#f5a623]/5"
            />
            <StatCard
              icon={<Users className="w-5 h-5" />}
              label="Leads"
              value={data.totalLeads.toLocaleString()}
              color="text-[#e07850]"
              borderColor="border-[#e07850]/20"
              bgColor="bg-[#e07850]/5"
            />
            <StatCard
              icon={<ShoppingCart className="w-5 h-5" />}
              label="Orders"
              value={data.totalOrders.toLocaleString()}
              color="text-[#f5a623]"
              borderColor="border-[#f5a623]/20"
              bgColor="bg-[#f5a623]/5"
            />
            <StatCard
              icon={<DollarSign className="w-5 h-5" />}
              label="Revenue"
              value={formatCurrency(data.totalRevenue)}
              color="text-emerald-400"
              borderColor="border-emerald-500/20"
              bgColor="bg-emerald-500/5"
            />
          </div>

          {/* ── Conversion Rate ─────────────────────────────────────────── */}
          <div className="rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/5 p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-[#f5a623]" />
              <span className="text-xs font-medium tracking-widest uppercase text-[#f5f0e8]/50">
                Conversion Rate
              </span>
            </div>
            <p className="text-4xl font-bold text-[#f5a623]">
              {data.conversionRate}%
            </p>
            <p className="text-xs text-[#f5f0e8]/40 mt-1">
              Leads captured per site view
            </p>
          </div>

          {/* ── Daily Views Chart ───────────────────────────────────────── */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-5 h-5 text-[#f5a623]" />
              <span className="text-xs font-medium tracking-widest uppercase text-[#f5f0e8]/50">
                Daily Views — Last 30 Days
              </span>
            </div>
            <div className="flex items-end gap-[3px] h-40">
              {data.dailyViews.map((d) => {
                const pct = (d.views / maxDailyView) * 100;
                return (
                  <div
                    key={d.date}
                    className="group relative flex-1 flex flex-col items-center justify-end h-full"
                  >
                    <div
                      className="w-full rounded-t bg-[#f5a623]/70 hover:bg-[#f5a623] transition-colors min-h-[2px]"
                      style={{ height: `${Math.max(pct, 1.5)}%` }}
                    />
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-[10px] whitespace-nowrap z-10">
                      <span className="text-[#f5a623] font-semibold">
                        {d.views}
                      </span>{" "}
                      views
                      <br />
                      <span className="text-[#f5f0e8]/50">
                        {formatDate(d.date)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-[#f5f0e8]/30">
              <span>{formatDate(data.dailyViews[0]?.date ?? "")}</span>
              <span>
                {formatDate(
                  data.dailyViews[data.dailyViews.length - 1]?.date ?? ""
                )}
              </span>
            </div>
          </div>

          {/* ── Conversion Funnel ─────────────────────────────────────── */}
          {funnel && funnel.steps.length > 0 && (() => {
            const maxCount = funnel.steps[0]?.count || 1;
            const FUNNEL_COLORS = [
              "#f5a623",
              "#e8983a",
              "#db8a51",
              "#ce7c68",
              "#5cb87a",
              "#34d399",
            ];
            return (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Filter className="w-5 h-5 text-[#f5a623]" />
                  <span className="text-xs font-medium tracking-widest uppercase text-[#f5f0e8]/50">
                    Conversion Funnel
                  </span>
                </div>
                <div className="space-y-3">
                  {funnel.steps.map((step, i) => {
                    const widthPct = Math.max((step.count / maxCount) * 100, 4);
                    const color = FUNNEL_COLORS[i] ?? FUNNEL_COLORS[FUNNEL_COLORS.length - 1];
                    return (
                      <div key={step.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-[#f5f0e8]/80">{step.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold tabular-nums" style={{ color }}>
                              {step.count.toLocaleString()}
                            </span>
                            <span className="text-xs text-[#f5f0e8]/40 tabular-nums w-12 text-right">
                              {i === 0 ? "100%" : `${step.rate}%`}
                            </span>
                          </div>
                        </div>
                        <div className="h-7 rounded-lg bg-white/[0.03] overflow-hidden">
                          <div
                            className="h-full rounded-lg transition-all duration-500"
                            style={{
                              width: `${widthPct}%`,
                              backgroundColor: color,
                              opacity: 0.8,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {funnel.steps.length >= 2 && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-xs text-[#f5f0e8]/40">
                      Overall conversion
                    </span>
                    <span className="text-sm font-bold text-emerald-400">
                      {maxCount > 0
                        ? ((funnel.steps[funnel.steps.length - 1].count / maxCount) * 100).toFixed(1)
                        : "0"}%
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Two-Column: Top Pages + Sources ────────────────────────── */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Pages */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-[#f5a623]" />
                <span className="text-xs font-medium tracking-widest uppercase text-[#f5f0e8]/50">
                  Top Pages
                </span>
              </div>
              {data.topPages.length === 0 ? (
                <p className="text-sm text-[#f5f0e8]/30">No pages yet</p>
              ) : (
                <div className="space-y-3">
                  {data.topPages.slice(0, 10).map((p, i) => {
                    const maxPageViews = Math.max(
                      ...data.topPages.map((x) => x.views),
                      1
                    );
                    const barPct = (p.views / maxPageViews) * 100;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm truncate max-w-[70%]">
                            {p.title || `/${p.slug}`}
                          </span>
                          <span className="text-xs text-[#f5f0e8]/50 tabular-nums">
                            {p.views.toLocaleString()} views
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#f5a623]/60"
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Lead Sources */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-5 h-5 text-[#e07850]" />
                <span className="text-xs font-medium tracking-widest uppercase text-[#f5f0e8]/50">
                  Lead Sources
                </span>
              </div>
              {Object.keys(data.sources).length === 0 ? (
                <p className="text-sm text-[#f5f0e8]/30">
                  No lead sources yet
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(data.sources)
                    .sort(([, a], [, b]) => b - a)
                    .map(([src, count]) => {
                      const totalSrcLeads = Object.values(
                        data.sources
                      ).reduce((a, b) => a + b, 0);
                      const pct = Math.round((count / totalSrcLeads) * 100);
                      return (
                        <div key={src}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm capitalize">{src}</span>
                            <span className="text-xs text-[#f5f0e8]/50 tabular-nums">
                              {count} ({pct}%)
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#e07850]/60"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* ── Recent Leads Table ──────────────────────────────────────── */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-[#e07850]" />
              <span className="text-xs font-medium tracking-widest uppercase text-[#f5f0e8]/50">
                Recent Leads
              </span>
            </div>
            {data.recentLeads.length === 0 ? (
              <p className="text-sm text-[#f5f0e8]/30">No leads captured yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left py-2 pr-4 text-xs font-medium tracking-widest uppercase text-[#f5f0e8]/40">
                        Name
                      </th>
                      <th className="text-left py-2 pr-4 text-xs font-medium tracking-widest uppercase text-[#f5f0e8]/40">
                        Email
                      </th>
                      <th className="text-left py-2 pr-4 text-xs font-medium tracking-widest uppercase text-[#f5f0e8]/40">
                        Score
                      </th>
                      <th className="text-left py-2 pr-4 text-xs font-medium tracking-widest uppercase text-[#f5f0e8]/40">
                        Status
                      </th>
                      <th className="text-left py-2 text-xs font-medium tracking-widest uppercase text-[#f5f0e8]/40">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentLeads.map((l, i) => (
                      <tr
                        key={i}
                        className="border-b border-white/[0.03] hover:bg-white/[0.02]"
                      >
                        <td className="py-2.5 pr-4 text-[#f5f0e8]/80">
                          {l.name || "—"}
                        </td>
                        <td className="py-2.5 pr-4 text-[#f5f0e8]/60 font-mono text-xs">
                          {l.email}
                        </td>
                        <td className="py-2.5 pr-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              l.score >= 70
                                ? "bg-emerald-500/10 text-emerald-400"
                                : l.score >= 40
                                ? "bg-[#f5a623]/10 text-[#f5a623]"
                                : "bg-white/[0.04] text-[#f5f0e8]/50"
                            }`}
                          >
                            {l.score}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 capitalize text-[#f5f0e8]/60 text-xs">
                          {l.status}
                        </td>
                        <td className="py-2.5 text-[#f5f0e8]/40 text-xs">
                          {formatDate(l.date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Recent Orders Table ─────────────────────────────────────── */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
            <div className="flex items-center gap-3 mb-4">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-medium tracking-widest uppercase text-[#f5f0e8]/50">
                Recent Orders
              </span>
            </div>
            {data.recentOrders.length === 0 ? (
              <p className="text-sm text-[#f5f0e8]/30">No orders yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left py-2 pr-4 text-xs font-medium tracking-widest uppercase text-[#f5f0e8]/40">
                        Email
                      </th>
                      <th className="text-left py-2 pr-4 text-xs font-medium tracking-widest uppercase text-[#f5f0e8]/40">
                        Amount
                      </th>
                      <th className="text-left py-2 text-xs font-medium tracking-widest uppercase text-[#f5f0e8]/40">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.map((o, i) => (
                      <tr
                        key={i}
                        className="border-b border-white/[0.03] hover:bg-white/[0.02]"
                      >
                        <td className="py-2.5 pr-4 text-[#f5f0e8]/60 font-mono text-xs">
                          {o.email}
                        </td>
                        <td className="py-2.5 pr-4 text-emerald-400 font-semibold">
                          {formatCurrency(o.amount)}
                        </td>
                        <td className="py-2.5 text-[#f5f0e8]/40 text-xs">
                          {formatDate(o.date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
  borderColor,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  borderColor: string;
  bgColor: string;
}) {
  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-5`}>
      <div className={`${color} mb-3`}>{icon}</div>
      <p className="text-xs font-medium tracking-widest uppercase text-[#f5f0e8]/50 mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
