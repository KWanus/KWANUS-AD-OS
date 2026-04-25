"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  BarChart3, Calendar, DollarSign, FileText, Check, Clock,
  TrendingUp, Activity, Loader2, ExternalLink,
} from "lucide-react";

interface ClientPortal {
  client: {
    id: string;
    name: string;
    logo?: string;
    healthScore: number;
    healthStatus: string;
    dealValue: number;
    nextMeeting?: Date;
  };
  activities: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    createdAt: Date;
    status?: string;
  }>;
  invoices: Array<{
    id: string;
    amount: number;
    status: string;
    dueDate?: Date;
    paidAt?: Date;
    invoiceUrl?: string;
  }>;
  metrics: {
    totalSpent: number;
    activeProjects: number;
    completedTasks: number;
    upcomingMeetings: number;
  };
}

export default function ClientPortalPage() {
  const params = useParams();
  const clientId = params?.clientId as string;
  const [portal, setPortal] = useState<ClientPortal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;
    void fetchPortal();
  }, [clientId]);

  async function fetchPortal() {
    try {
      const res = await fetch(`/api/portal/${clientId}`);
      const data = await res.json() as { ok: boolean; portal?: ClientPortal; error?: string };

      if (data.ok && data.portal) {
        setPortal(data.portal);
      } else {
        setError(data.error || "Failed to load portal");
      }
    } catch (err) {
      console.error("Portal fetch error:", err);
      setError("Failed to load portal");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !portal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-2">Unable to load client portal</p>
          <p className="text-sm text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  const { client, activities, invoices, metrics } = portal;
  const healthColor = client.healthScore >= 70 ? "emerald" : client.healthScore >= 40 ? "amber" : "red";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {client.logo && (
              <img src={client.logo} alt={client.name} className="w-12 h-12 rounded-lg object-cover" />
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
              <p className="text-sm text-slate-500">Client Portal</p>
            </div>
          </div>

          {/* Health Score */}
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs text-slate-500 mb-1">Account Health</p>
              <div className="flex items-center gap-2">
                <div className="relative w-12 h-12">
                  <svg className="transform -rotate-90 w-12 h-12">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      className="text-slate-200"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - client.healthScore / 100)}`}
                      className={`text-${healthColor}-500`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-xs font-bold text-${healthColor}-600`}>
                      {client.healthScore}
                    </span>
                  </div>
                </div>
                <span className={`text-sm font-semibold text-${healthColor}-600 capitalize`}>
                  {client.healthStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            icon={DollarSign}
            label="Total Investment"
            value={`$${metrics.totalSpent.toLocaleString()}`}
            color="emerald"
          />
          <MetricCard
            icon={BarChart3}
            label="Active Projects"
            value={metrics.activeProjects}
            color="blue"
          />
          <MetricCard
            icon={Check}
            label="Tasks Completed"
            value={metrics.completedTasks}
            color="purple"
          />
          <MetricCard
            icon={Calendar}
            label="Upcoming Meetings"
            value={metrics.upcomingMeetings}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Activity className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
            </div>

            <div className="space-y-3">
              {activities.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No recent activity</p>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition"
                  >
                    <div className="mt-1">
                      {activity.type === "meeting" && <Calendar className="w-4 h-4 text-blue-500" />}
                      {activity.type === "task" && <Check className="w-4 h-4 text-emerald-500" />}
                      {activity.type === "note" && <FileText className="w-4 h-4 text-slate-500" />}
                      {activity.type === "invoice" && <DollarSign className="w-4 h-4 text-purple-500" />}
                      {!["meeting", "task", "note", "invoice"].includes(activity.type) && (
                        <Activity className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{activity.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{activity.description}</p>
                      <p className="text-xs text-slate-400 mt-1.5">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Invoices & Billing */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-5">
              <FileText className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-bold text-slate-900">Invoices</h2>
            </div>

            <div className="space-y-3">
              {invoices.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No invoices</p>
              ) : (
                invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          ${invoice.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">
                          {invoice.status === "paid"
                            ? `Paid ${invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : ""}`
                            : invoice.dueDate
                            ? `Due ${new Date(invoice.dueDate).toLocaleDateString()}`
                            : "Pending"}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                          invoice.status === "paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : invoice.status === "overdue"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </div>
                    {invoice.invoiceUrl && invoice.status !== "paid" && (
                      <a
                        href={invoice.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                      >
                        <span>Pay Now</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Next Meeting */}
        {client.nextMeeting && (
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white/80">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Next Meeting</p>
                <p className="text-lg font-bold text-slate-900">
                  {new Date(client.nextMeeting).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className={`p-2.5 rounded-xl bg-${color}-100 w-fit mb-3`}>
        <Icon className={`w-5 h-5 text-${color}-600`} />
      </div>
      <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
    </div>
  );
}
