"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { Loader2, TrendingUp, DollarSign, ArrowDown } from "lucide-react";

type FunnelStage = {
  label: string;
  value: number;
  rate: number;
  color: string;
};

type FunnelSummary = {
  totalViews: number;
  totalContacts: number;
  totalLeads: number;
  hotLeads: number;
  totalOrders: number;
  revenue: number;
  totalEnrolled: number;
  emailsSent: number;
  overallConversionRate: number;
  leadToCustomerRate: number;
};

const STAGE_COLORS: Record<string, { bar: string; text: string; bg: string }> = {
  cyan: { bar: "bg-[#f5a623]", text: "text-[#f5a623]", bg: "bg-[#f5a623]/10" },
  blue: { bar: "bg-blue-500", text: "text-blue-400", bg: "bg-blue-500/10" },
  purple: { bar: "bg-[#e07850]", text: "text-[#e07850]", bg: "bg-[#e07850]/10" },
  amber: { bar: "bg-amber-500", text: "text-amber-400", bg: "bg-amber-500/10" },
  emerald: { bar: "bg-emerald-500", text: "text-emerald-400", bg: "bg-emerald-500/10" },
};

export default function FunnelPage() {
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [summary, setSummary] = useState<FunnelSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/funnel")
      .then((r) => r.json() as Promise<{ ok: boolean; funnel?: { stages: FunnelStage[]; summary: FunnelSummary } }>)
      .then((data) => {
        if (data.ok && data.funnel) {
          setStages(data.funnel.stages);
          setSummary(data.funnel.summary);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const maxValue = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <AppNav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Funnel</h1>
            <p className="text-sm text-white/35 mt-1">Your complete visitor → lead → customer pipeline</p>
          </div>
          <Link href="/revenue" className="text-xs text-white/30 hover:text-white/60 transition">Revenue →</Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
          </div>
        ) : (
          <>
            {/* Funnel visualization */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8 mb-8">
              <div className="space-y-1">
                {stages.map((stage, i) => {
                  const colors = STAGE_COLORS[stage.color] ?? STAGE_COLORS.cyan;
                  const width = maxValue > 0 ? Math.max((stage.value / maxValue) * 100, 8) : 8;

                  return (
                    <div key={i}>
                      <div className="flex items-center gap-4 mb-1">
                        <div className="w-32 text-right">
                          <p className="text-xs font-bold text-white/60">{stage.label}</p>
                        </div>
                        <div className="flex-1">
                          <div
                            className={`h-10 rounded-lg ${colors.bar} flex items-center justify-end px-3 transition-all duration-700`}
                            style={{ width: `${width}%` }}
                          >
                            <span className="text-sm font-black text-white">{stage.value.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="w-16 text-right">
                          <span className={`text-xs font-bold ${colors.text}`}>{stage.rate}%</span>
                        </div>
                      </div>
                      {i < stages.length - 1 && (
                        <div className="flex items-center gap-4">
                          <div className="w-32" />
                          <div className="flex-1 flex justify-center">
                            <ArrowDown className="w-4 h-4 text-white/10" />
                          </div>
                          <div className="w-16" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary stats */}
            {summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SummaryCard
                  label="Overall Conversion"
                  value={`${summary.overallConversionRate}%`}
                  sub="Visitor → Customer"
                  icon={TrendingUp}
                  color="text-[#f5a623]"
                />
                <SummaryCard
                  label="Lead → Customer"
                  value={`${summary.leadToCustomerRate}%`}
                  sub="Contact → Purchase"
                  icon={TrendingUp}
                  color="text-emerald-400"
                />
                <SummaryCard
                  label="Total Revenue"
                  value={`$${summary.revenue.toLocaleString()}`}
                  sub={`${summary.totalOrders} orders`}
                  icon={DollarSign}
                  color="text-emerald-400"
                />
                <SummaryCard
                  label="Emails Sent"
                  value={summary.emailsSent.toLocaleString()}
                  sub={`${summary.totalEnrolled} enrolled`}
                  icon={TrendingUp}
                  color="text-[#e07850]"
                />
              </div>
            )}

            {/* Empty state guidance */}
            {stages.every((s) => s.value === 0) && (
              <div className="rounded-2xl border border-[#f5a623]/15 bg-[#f5a623]/5 p-6 mt-8 text-center">
                <p className="text-sm font-bold text-[#f5a623] mb-2">Your funnel is empty</p>
                <p className="text-xs text-white/40 mb-4">Deploy a Himalaya business to start filling your funnel with real data.</p>
                <Link
                  href="/himalaya"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-white text-sm font-bold hover:opacity-90 transition"
                >
                  Run Himalaya
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function SummaryCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 text-center">
      <Icon className={`w-5 h-5 ${color} mx-auto mb-2 opacity-60`} />
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-[10px] text-white/30 mt-0.5">{label}</p>
      <p className="text-[10px] text-white/15">{sub}</p>
    </div>
  );
}
