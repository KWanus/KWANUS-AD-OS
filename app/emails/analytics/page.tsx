"use client";

import { useState, useEffect, useCallback } from "react";
import AppNav from "@/components/AppNav";
import CampaignSubNav from "@/components/BuildSubNav";
import {
  BarChart2,
  TrendingUp,
  Users,
  Eye,
  MousePointer,
  DollarSign,
  Zap,
  Send,
  Loader2,
  Activity,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmailFlow {
  id: string;
  name: string;
  status: string;
  triggerConfig?: { executionTier?: "core" | "elite" };
  enrolled: number;
  opens: number;
  clicks: number;
  conversions: number;
  revenue: number;
  sent: number;
}

interface EmailBroadcast {
  id: string;
  name: string;
  subject: string;
  status: string;
  executionTier?: "core" | "elite";
  recipients: number;
  opens: number;
  clicks: number;
  bounces: number;
  sentAt?: string;
}

interface EmailContact {
  id: string;
  status: string;
  executionTier?: "core" | "elite";
  source?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Metric card
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  trend?: string;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-5 py-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-8 h-8 rounded-xl ${color.replace("text-", "bg-").replace("400", "500/15")} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        {trend && (
          <span className="text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-white mb-1">{value}</p>
      <p className="text-[11px] text-white/35 font-medium uppercase tracking-wider">{label}</p>
      {sub && <p className="text-[10px] text-white/20 mt-1">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top performers table
// ---------------------------------------------------------------------------

function TopFlowsTable({ flows }: { flows: EmailFlow[] }) {
  const sorted = [...flows]
    .filter((f) => f.sent > 0 || f.enrolled > 0)
    .sort((a, b) => b.revenue - a.revenue || b.enrolled - a.enrolled)
    .slice(0, 5);

  if (sorted.length === 0) return null;

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <h3 className="text-sm font-black text-white">Top Email Flows</h3>
        <p className="text-[11px] text-white/30 mt-0.5">Ranked by revenue then enrolled</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/[0.04]">
              {["Flow", "Status", "Enrolled", "Open Rate", "Click Rate", "Revenue"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/25">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((flow) => {
              const openRate = flow.sent > 0 ? Math.round((flow.opens / flow.sent) * 100) : 0;
              const clickRate = flow.opens > 0 ? Math.round((flow.clicks / flow.opens) * 100) : 0;
              const executionTier = flow.triggerConfig?.executionTier === "core" ? "core" : "elite";
              return (
                <tr key={flow.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                  <td className="px-5 py-3 max-w-[180px]">
                    <p className="truncate text-white/70 font-semibold">{flow.name}</p>
                    <span className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] ${
                      executionTier === "elite"
                        ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                        : "border-white/10 bg-white/5 text-white/45"
                    }`}>
                      {executionTier}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                      flow.status === "active"
                        ? "border-green-500/20 bg-green-500/10 text-green-400"
                        : "border-white/10 bg-white/5 text-white/30"
                    }`}>
                      {flow.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-white/60">{flow.enrolled.toLocaleString()}</td>
                  <td className="px-5 py-3 text-cyan-400 font-bold">{openRate > 0 ? `${openRate}%` : "—"}</td>
                  <td className="px-5 py-3 text-purple-400 font-bold">{clickRate > 0 ? `${clickRate}%` : "—"}</td>
                  <td className="px-5 py-3 text-green-400 font-bold">
                    {flow.revenue > 0 ? `$${flow.revenue.toLocaleString()}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TopBroadcastsTable({ broadcasts }: { broadcasts: EmailBroadcast[] }) {
  const sorted = [...broadcasts]
    .filter((b) => b.status === "sent" && b.recipients > 0)
    .sort((a, b) => b.opens / b.recipients - a.opens / a.recipients)
    .slice(0, 5);

  if (sorted.length === 0) return null;

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <h3 className="text-sm font-black text-white">Top Broadcasts</h3>
        <p className="text-[11px] text-white/30 mt-0.5">Ranked by open rate</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/[0.04]">
              {["Broadcast", "Sent", "Recipients", "Open Rate", "Click Rate", "Bounce Rate"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/25">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((b) => {
              const openRate = Math.round((b.opens / b.recipients) * 100);
              const clickRate = b.opens > 0 ? Math.round((b.clicks / b.opens) * 100) : 0;
              const bounceRate = Math.round((b.bounces / b.recipients) * 100);
              const executionTier = b.executionTier === "core" ? "core" : "elite";
              return (
                <tr key={b.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                  <td className="px-5 py-3 max-w-[180px]">
                    <p className="text-white/70 font-semibold truncate">{b.name}</p>
                    <p className="text-[10px] text-white/25 truncate">{b.subject}</p>
                    <span className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] ${
                      executionTier === "elite"
                        ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                        : "border-white/10 bg-white/5 text-white/45"
                    }`}>
                      {executionTier}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-white/40 text-[10px]">
                    {b.sentAt ? new Date(b.sentAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-3 text-white/60">{b.recipients.toLocaleString()}</td>
                  <td className="px-5 py-3 text-cyan-400 font-bold">{openRate}%</td>
                  <td className="px-5 py-3 text-purple-400 font-bold">{clickRate > 0 ? `${clickRate}%` : "—"}</td>
                  <td className="px-5 py-3">
                    <span className={bounceRate > 2 ? "text-red-400 font-bold" : "text-white/40"}>
                      {bounceRate > 0 ? `${bounceRate}%` : "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contact source breakdown
// ---------------------------------------------------------------------------

function ContactSourceChart({ contacts }: { contacts: EmailContact[] }) {
  const sources: Record<string, number> = {};
  contacts.forEach((c) => {
    const s = c.source ?? "unknown";
    sources[s] = (sources[s] ?? 0) + 1;
  });

  const total = contacts.length;
  if (total === 0) return null;

  const items = Object.entries(sources).sort((a, b) => b[1] - a[1]);
  const colors = ["bg-cyan-500", "bg-purple-500", "bg-green-500", "bg-amber-500", "bg-rose-500"];

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
      <h3 className="text-sm font-black text-white mb-1">Contact Sources</h3>
      <p className="text-[11px] text-white/30 mb-5">How contacts joined your list</p>
      <div className="space-y-3">
        {items.map(([source, count], i) => {
          const pct = Math.round((count / total) * 100);
          return (
            <div key={source}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-white/60 font-semibold capitalize">{source}</span>
                <span className="text-xs text-white/40">{count.toLocaleString()} ({pct}%)</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={`h-full rounded-full ${colors[i % colors.length]}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EmailAnalyticsPage() {
  const [flows, setFlows] = useState<EmailFlow[]>([]);
  const [broadcasts, setBroadcasts] = useState<EmailBroadcast[]>([]);
  const [contacts, setContacts] = useState<EmailContact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [flowRes, broadcastRes, contactRes] = await Promise.all([
        fetch("/api/email-flows"),
        fetch("/api/email-broadcasts"),
        fetch("/api/email-contacts?limit=100"),
      ]);
      const [flowData, broadcastData, contactData] = await Promise.all([
        flowRes.json() as Promise<{ ok: boolean; flows?: EmailFlow[] }>,
        broadcastRes.json() as Promise<{ ok: boolean; broadcasts?: EmailBroadcast[] }>,
        contactRes.json() as Promise<{ ok: boolean; contacts?: EmailContact[] }>,
      ]);
      if (flowData.ok && flowData.flows) setFlows(flowData.flows);
      if (broadcastData.ok && broadcastData.broadcasts) setBroadcasts(broadcastData.broadcasts);
      if (contactData.ok && contactData.contacts) setContacts(contactData.contacts);
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Aggregate metrics
  const totalContacts = contacts.length;
  const subscribedContacts = contacts.filter((c) => c.status === "subscribed").length;
  const activeFlows = flows.filter((f) => f.status === "active").length;
  const eliteFlows = flows.filter((f) => (f.triggerConfig?.executionTier ?? "elite") === "elite").length;
  const eliteBroadcasts = broadcasts.filter((b) => (b.executionTier ?? "elite") === "elite").length;
  const eliteContacts = contacts.filter((c) => (c.executionTier ?? "elite") === "elite").length;
  const totalEnrolled = flows.reduce((s, f) => s + f.enrolled, 0);
  const totalRevenue = flows.reduce((s, f) => s + f.revenue, 0);

  const sentBroadcasts = broadcasts.filter((b) => b.status === "sent");
  const totalBroadcastSent = sentBroadcasts.reduce((s, b) => s + b.recipients, 0);

  const allSentEmails = flows.reduce((s, f) => s + f.sent, 0) + totalBroadcastSent;
  const allOpens =
    flows.reduce((s, f) => s + f.opens, 0) + sentBroadcasts.reduce((s, b) => s + b.opens, 0);
  const allClicks =
    flows.reduce((s, f) => s + f.clicks, 0) + sentBroadcasts.reduce((s, b) => s + b.clicks, 0);

  const overallOpenRate = allSentEmails > 0 ? Math.round((allOpens / allSentEmails) * 100) : null;
  const overallClickRate = allOpens > 0 ? Math.round((allClicks / allOpens) * 100) : null;

  return (
    <div className="min-h-screen bg-[#020509] text-white">
      <AppNav />
      <CampaignSubNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white tracking-tight">Email Analytics</h1>
          <p className="text-sm text-white/35 mt-1">Performance across flows and broadcasts</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Top metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              <MetricCard label="Total Contacts" value={totalContacts.toLocaleString()} icon={Users} color="text-cyan-400" />
              <MetricCard label="Subscribed" value={subscribedContacts.toLocaleString()} icon={Activity} color="text-green-400" />
              <MetricCard label="Active Flows" value={activeFlows} icon={Zap} color="text-purple-400" />
              <MetricCard label="Flow Enrolled" value={totalEnrolled.toLocaleString()} icon={TrendingUp} color="text-amber-400" />
              <MetricCard
                label="Avg Open Rate"
                value={overallOpenRate != null ? `${overallOpenRate}%` : "—"}
                icon={Eye}
                color="text-cyan-400"
              />
              <MetricCard
                label="Avg Click Rate"
                value={overallClickRate != null ? `${overallClickRate}%` : "—"}
                icon={MousePointer}
                color="text-purple-400"
              />
            </div>

            {/* Secondary row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
              <MetricCard label="Emails Sent" value={allSentEmails.toLocaleString()} icon={Send} color="text-white/50" />
              <MetricCard label="Total Opens" value={allOpens.toLocaleString()} icon={Eye} color="text-cyan-400" />
              <MetricCard label="Total Clicks" value={allClicks.toLocaleString()} icon={MousePointer} color="text-purple-400" />
              <MetricCard label="Flow Revenue" value={totalRevenue > 0 ? `$${totalRevenue.toLocaleString()}` : "—"} icon={DollarSign} color="text-green-400" />
              <MetricCard label="Elite Flows" value={eliteFlows.toLocaleString()} icon={Zap} color="text-cyan-400" />
              <MetricCard label="Elite Contacts" value={eliteContacts.toLocaleString()} icon={Users} color="text-cyan-400" />
            </div>

            {/* Tables */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <TopFlowsTable flows={flows} />
              <TopBroadcastsTable broadcasts={broadcasts} />
            </div>

            {/* Contact source + empty state hint */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ContactSourceChart contacts={contacts} />

              {/* Platform health */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                <h3 className="text-sm font-black text-white mb-1">List Health</h3>
                <p className="text-[11px] text-white/30 mb-5">Key deliverability indicators</p>
                <div className="space-y-4">
                  {[
                    {
                      label: "Subscription Rate",
                      value: totalContacts > 0 ? `${Math.round((subscribedContacts / totalContacts) * 100)}%` : "—",
                      target: "> 95%",
                      good: totalContacts === 0 || subscribedContacts / totalContacts >= 0.95,
                    },
                    {
                      label: "Active Flows",
                      value: `${activeFlows} / ${flows.length}`,
                      target: "At least 1 active",
                      good: activeFlows > 0,
                    },
                    {
                      label: "Elite Coverage",
                      value: `${eliteFlows + eliteBroadcasts} lane assets`,
                      target: "Use elite where quality matters most",
                      good: eliteFlows + eliteBroadcasts > 0,
                    },
                    {
                      label: "Broadcast Bounce Rate",
                      value: (() => {
                        const totalBounces = sentBroadcasts.reduce((s, b) => s + b.bounces, 0);
                        return totalBroadcastSent > 0
                          ? `${Math.round((totalBounces / totalBroadcastSent) * 100)}%`
                          : "—";
                      })(),
                      target: "< 2%",
                      good: (() => {
                        const totalBounces = sentBroadcasts.reduce((s, b) => s + b.bounces, 0);
                        return totalBroadcastSent === 0 || totalBounces / totalBroadcastSent < 0.02;
                      })(),
                    },
                  ].map(({ label, value, target, good }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/60 font-semibold">{label}</p>
                        <p className="text-[10px] text-white/25">{target}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-black ${good ? "text-green-400" : "text-red-400"}`}>{value}</p>
                        <p className={`text-[10px] font-semibold ${good ? "text-green-400/50" : "text-red-400/50"}`}>
                          {good ? "✓ Good" : "⚠ Check"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Zero state hint */}
            {flows.length === 0 && broadcasts.length === 0 && contacts.length === 0 && (
              <div className="text-center py-12">
                <BarChart2 className="w-10 h-10 text-white/10 mx-auto mb-4" />
                <p className="text-sm text-white/30 font-medium">
                  Analytics will populate once you create flows, broadcasts, and contacts.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
