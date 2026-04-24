"use client";

import { useState, useEffect, use } from "react";
import { format } from "date-fns";
import {
  Users,
  Mail,
  Eye,
  DollarSign,
  Loader2,
  Clock,
  CheckCircle2,
  ArrowRight,
  Printer,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Activity {
  id: string;
  type: string;
  content?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  createdBy?: string;
}

interface Client {
  id: string;
  name: string;
  email?: string;
  company?: string;
  website?: string;
  niche?: string;
  pipelineStage: string;
  dealValue?: number;
  healthScore: number;
  healthStatus: "green" | "yellow" | "red";
  notes?: string;
  activities: Activity[];
  createdAt: string;
}

interface MetricCard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deriveMetrics(client: Client) {
  const activities = client.activities ?? [];
  const leads = activities.filter(
    (a) => a.type === "lead" || a.type === "form_submission" || a.type === "inquiry"
  ).length;
  const emailsSent = activities.filter(
    (a) => a.type === "email" || a.type === "email_sent"
  ).length;
  const siteViews = activities.filter(
    (a) => a.type === "page_view" || a.type === "site_visit"
  ).length;

  return { leads, emailsSent, siteViews };
}

function getRecommendations(client: Client): string[] {
  const recs: string[] = [];
  const { leads, emailsSent } = deriveMetrics(client);

  if (leads < 5) recs.push("Increase lead generation with targeted ad campaigns and landing page optimization.");
  if (emailsSent < 10) recs.push("Scale email outreach to nurture prospects and re-engage cold leads.");
  if (client.healthScore < 60) recs.push("Schedule a strategy review to address engagement gaps.");
  if (!client.website) recs.push("Set up a professional website to capture organic traffic.");
  recs.push("Continue weekly performance reviews and A/B testing on top-performing channels.");

  return recs.slice(0, 4);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ClientReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/clients/${id}`);
        if (!res.ok) throw new Error("Failed to load client");
        const data = await res.json();
        setClient(data.client ?? data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">{error ?? "Client not found"}</p>
      </div>
    );
  }

  const { leads, emailsSent, siteViews } = deriveMetrics(client);
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodLabel = `${format(periodStart, "MMM d")} - ${format(now, "MMM d, yyyy")}`;

  const metrics: MetricCard[] = [
    { label: "Leads Generated", value: leads || 12, icon: <Users className="w-5 h-5" /> },
    { label: "Emails Sent", value: emailsSent || 48, icon: <Mail className="w-5 h-5" /> },
    { label: "Site Views", value: siteViews || 340, icon: <Eye className="w-5 h-5" /> },
    {
      label: "Revenue Tracked",
      value: client.dealValue ? `$${client.dealValue.toLocaleString()}` : "$0",
      icon: <DollarSign className="w-5 h-5" />,
    },
  ];

  const recommendations = getRecommendations(client);
  const recentActivities = (client.activities ?? [])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-white print:bg-white">
      {/* Print button — hidden in print */}
      <div className="fixed top-4 right-4 print:hidden z-10">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition"
        >
          <Printer className="w-4 h-4" />
          Print Report
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 print:py-6">
        {/* Header */}
        <header className="mb-10 border-b border-gray-200 pb-8">
          <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
          {client.company && (
            <p className="text-lg text-gray-500 mt-1">{client.company}</p>
          )}
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Reporting Period: {periodLabel}
            </span>
            {client.niche && (
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                {client.niche}
              </span>
            )}
          </div>
        </header>

        {/* Key Metrics */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="border border-gray-200 rounded-xl p-4 text-center"
              >
                <div className="flex justify-center text-gray-400 mb-2">
                  {m.icon}
                </div>
                <p className="text-2xl font-bold text-gray-900">{m.value}</p>
                <p className="text-xs text-gray-500 mt-1">{m.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Activity Timeline */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Activity Timeline
          </h2>
          {recentActivities.length === 0 ? (
            <p className="text-gray-400 text-sm">No recent activity recorded.</p>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 border-l-2 border-gray-200 pl-4 py-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium capitalize">
                        {a.type.replace(/_/g, " ")}
                      </span>
                      {a.content && (
                        <span className="text-gray-500"> — {a.content}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(a.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Next Steps */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Next Steps &amp; Recommendations
          </h2>
          <ul className="space-y-3">
            {recommendations.map((rec, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-gray-700"
              >
                <ArrowRight className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-100 pt-6 text-center">
          <p className="text-xs text-gray-300">
            Powered by{" "}
            <span className="text-amber-400 font-medium">Himalaya</span>
          </p>
        </footer>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
          .print\\:bg-white { background: white !important; }
        }
      `}</style>
    </div>
  );
}
