"use client";

import { useEffect, useState } from "react";
import SimplifiedNav from "@/components/SimplifiedNav";
import {
  Mail, Calendar, Check, X, Loader2, ExternalLink, RefreshCw,
  AlertCircle, Zap,
} from "lucide-react";

interface Integration {
  type: "email" | "calendar";
  provider: string;
  connected: boolean;
  connectedAt?: Date;
  email?: string;
  dailyLimit?: number;
  sentToday?: number;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    void fetchIntegrations();
  }, []);

  async function fetchIntegrations() {
    try {
      const res = await fetch("/api/settings/integrations");
      const data = await res.json() as { ok: boolean; integrations?: Integration[] };
      if (data.ok && data.integrations) {
        setIntegrations(data.integrations);
      }
    } catch (err) {
      console.error("Failed to fetch integrations:", err);
    } finally {
      setLoading(false);
    }
  }

  async function connectGmail() {
    setConnecting("gmail");
    try {
      const res = await fetch("/api/integrations/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "gmail" }),
      });
      const data = await res.json() as { ok: boolean; authUrl?: string };
      if (data.ok && data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      console.error("Gmail connection error:", err);
      setConnecting(null);
    }
  }

  async function connectGoogleCalendar() {
    setConnecting("calendar");
    try {
      const res = await fetch("/api/integrations/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google" }),
      });
      const data = await res.json() as { ok: boolean; authUrl?: string };
      if (data.ok && data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      console.error("Calendar connection error:", err);
      setConnecting(null);
    }
  }

  async function disconnectIntegration(type: string) {
    try {
      const endpoint = type === "email" ? "/api/integrations/email" : "/api/integrations/calendar";
      await fetch(endpoint, { method: "DELETE" });
      await fetchIntegrations();
    } catch (err) {
      console.error("Disconnect error:", err);
    }
  }

  const emailIntegration = integrations.find((i) => i.type === "email");
  const calendarIntegration = integrations.find((i) => i.type === "calendar");

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <SimplifiedNav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-black text-white tracking-tight mb-2">Integrations</h1>
        <p className="text-sm text-white/35 mb-8">
          Connect your Gmail and Google Calendar for seamless outreach and scheduling
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-white/40" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Gmail Integration */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <Mail className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">Gmail</h2>
                    <p className="text-xs text-white/40">
                      Send outreach emails from your Gmail account
                    </p>
                  </div>
                </div>

                {emailIntegration?.connected ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-400">Connected</span>
                    </div>
                    <button
                      onClick={() => void disconnectIntegration("email")}
                      className="p-1.5 rounded-lg hover:bg-white/5 transition"
                    >
                      <X className="w-4 h-4 text-white/40 hover:text-white/60" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => void connectGmail()}
                    disabled={connecting === "gmail"}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-40"
                  >
                    {connecting === "gmail" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4" />
                        Connect Gmail
                      </>
                    )}
                  </button>
                )}
              </div>

              {emailIntegration?.connected && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-sm text-white/60">Email Address</span>
                    <span className="text-sm font-bold text-white">{emailIntegration.email}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-sm text-white/60">Daily Limit</span>
                    <span className="text-sm font-bold text-white">
                      {emailIntegration.sentToday || 0} / {emailIntegration.dailyLimit || 500}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
                    <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
                    <p className="text-xs text-blue-300">
                      Gmail allows 500 emails/day for free accounts, 2,000/day for Workspace accounts.
                      Emails sent from your account have better deliverability.
                    </p>
                  </div>
                </div>
              )}

              {!emailIntegration?.connected && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-[#f5a623] shrink-0 mt-0.5" />
                    <p className="text-xs text-white/50">
                      Send outreach emails directly from your Gmail account for maximum deliverability
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-[#f5a623] shrink-0 mt-0.5" />
                    <p className="text-xs text-white/50">
                      Track opens, clicks, and replies automatically
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-[#f5a623] shrink-0 mt-0.5" />
                    <p className="text-xs text-white/50">
                      No additional email sending costs
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Google Calendar Integration */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <Calendar className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">Google Calendar</h2>
                    <p className="text-xs text-white/40">
                      Auto-sync client meetings to your calendar
                    </p>
                  </div>
                </div>

                {calendarIntegration?.connected ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-400">Connected</span>
                    </div>
                    <button
                      onClick={() => void disconnectIntegration("calendar")}
                      className="p-1.5 rounded-lg hover:bg-white/5 transition"
                    >
                      <X className="w-4 h-4 text-white/40 hover:text-white/60" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => void connectGoogleCalendar()}
                    disabled={connecting === "calendar"}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-40"
                  >
                    {connecting === "calendar" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4" />
                        Connect Calendar
                      </>
                    )}
                  </button>
                )}
              </div>

              {calendarIntegration?.connected && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-sm text-white/60">Status</span>
                    <span className="text-sm font-bold text-emerald-400">Syncing</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
                    <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
                    <p className="text-xs text-blue-300">
                      Client meetings will automatically appear in your Google Calendar.
                      We'll check your availability before scheduling.
                    </p>
                  </div>
                </div>
              )}

              {!calendarIntegration?.connected && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-[#f5a623] shrink-0 mt-0.5" />
                    <p className="text-xs text-white/50">
                      Automatically create calendar events for client meetings
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-[#f5a623] shrink-0 mt-0.5" />
                    <p className="text-xs text-white/50">
                      Check your availability before scheduling
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-[#f5a623] shrink-0 mt-0.5" />
                    <p className="text-xs text-white/50">
                      Send calendar invites to clients automatically
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
