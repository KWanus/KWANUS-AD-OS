"use client";

import { useState, useEffect } from "react";
import AppNav from "@/components/AppNav";
import ThemePicker from "@/components/settings/ThemePicker";
import OperatorStatCard from "@/components/navigation/OperatorStatCard";
import WorkflowHeader from "@/components/navigation/WorkflowHeader";
import Link from "next/link";
import { toast } from "sonner";
import {
  Settings,
  Mail,
  Zap,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  Crown,
  Shield,
  AlertTriangle,
  Loader2,
  Copy,
  Globe,
  BarChart3,
  Webhook,
  TrendingUp,
  MessageSquareText,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserSettings {
  workspaceName: string;
  sendingFromName: string;
  sendingFromEmail: string;
  sendingDomain: string;
  hasResendKey: boolean;
  plan: string;
  email: string;
  name: string;
  // Ad & Analytics
  metaPixelId: string;
  googleAnalyticsId: string;
  tiktokPixelId: string;
  googleAdsId: string;
  // Automation
  webhookUrl: string;
  businessUrl: string;
  businessType: string;
  // Connected Accounts
  clickbankNickname: string;
  amazonTrackingId: string;
  jvzooAffiliateId: string;
  warriorplusId: string;
  sharesaleAffiliateId: string;
}

interface EmailDeliveryAlert {
  failedEnrollments: number;
  latestError: string | null;
  latestFailedAt: string | null;
}

interface OAuthPlatformStatus {
  connected: boolean;
  connectUrl: string;
}

interface OAuthStatusResponse {
  ok: boolean;
  platforms?: {
    meta: OAuthPlatformStatus;
    google: OAuthPlatformStatus;
    tiktok: OAuthPlatformStatus;
  };
}

// ---------------------------------------------------------------------------
// Plan config
// ---------------------------------------------------------------------------

const PLAN_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  free:  { label: "Free",  color: "text-white/50",   bg: "bg-white/5",        border: "border-white/10",       icon: Zap },
  pro:   { label: "Pro",   color: "text-[#f5a623]",   bg: "bg-[#f5a623]/10",    border: "border-[#f5a623]/20",    icon: Crown },
  elite: { label: "Elite", color: "text-[#e07850]", bg: "bg-purple-500/10",  border: "border-purple-500/20",  icon: Shield },
};

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({ id, title, sub, children }: { id?: string; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div id={id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden scroll-mt-32">
      <div className="px-6 py-4 border-b border-white/[0.06]">
        <h2 className="text-sm font-black text-white">{title}</h2>
        {sub && <p className="text-[11px] text-white/35 mt-0.5">{sub}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-white/30">{label}</label>
      {sub && <p className="text-[10px] text-white/20 -mt-1">{sub}</p>}
      {children}
    </div>
  );
}

function Input({
  value, onChange, placeholder, type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 transition"
    />
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    workspaceName: "", sendingFromName: "", sendingFromEmail: "",
    sendingDomain: "", hasResendKey: false, plan: "free", email: "", name: "",
    metaPixelId: "", googleAnalyticsId: "", tiktokPixelId: "", googleAdsId: "",
    webhookUrl: "", businessUrl: "", businessType: "",
    clickbankNickname: "", amazonTrackingId: "", jvzooAffiliateId: "",
    warriorplusId: "", sharesaleAffiliateId: "",
  });
  const [resendKey, setResendKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAccounts, setSavingAccounts] = useState(false);
  const [emailDeliveryAlert, setEmailDeliveryAlert] = useState<EmailDeliveryAlert | null>(null);
  const [oauthStatus, setOauthStatus] = useState<OAuthStatusResponse["platforms"] | null>(null);
  const [stripeStatus, setStripeStatus] = useState<{ connected: boolean; verified?: boolean; accountId?: string; businessName?: string; email?: string } | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json() as Promise<{ ok: boolean; settings?: UserSettings; emailDeliveryAlert?: EmailDeliveryAlert }>)
      .then((data) => {
        if (data.ok && data.settings) setSettings(data.settings);
        if (data.ok && data.emailDeliveryAlert) setEmailDeliveryAlert(data.emailDeliveryAlert);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch("/api/settings/accounts")
      .then((r) => r.json() as Promise<{ ok: boolean; accounts?: Partial<Pick<UserSettings, "clickbankNickname" | "amazonTrackingId" | "jvzooAffiliateId" | "warriorplusId" | "sharesaleAffiliateId">> }>)
      .then((data) => {
        if (data.ok && data.accounts) {
          const accounts = data.accounts;
          setSettings((s) => ({ ...s,
            clickbankNickname: accounts.clickbankNickname ?? "",
            amazonTrackingId: accounts.amazonTrackingId ?? "",
            jvzooAffiliateId: accounts.jvzooAffiliateId ?? "",
            warriorplusId: accounts.warriorplusId ?? "",
            sharesaleAffiliateId: accounts.sharesaleAffiliateId ?? "",
          }));
        }
      }).catch(() => {});

    fetch("/api/oauth/status")
      .then((r) => r.json() as Promise<OAuthStatusResponse>)
      .then((data) => {
        if (data.ok && data.platforms) setOauthStatus(data.platforms);
      })
      .catch(() => {});

    fetch("/api/stripe/connect")
      .then((r) => r.json())
      .then((data: any) => {
        if (data.ok) setStripeStatus(data);
      })
      .catch(() => {});
  }, []);

  async function save(fields: Partial<UserSettings & { resendApiKey: string }>) {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json() as { ok: boolean };
      if (data.ok) {
        toast.success("Saved");
        if (fields.resendApiKey !== undefined) {
          setSettings((s) => ({ ...s, hasResendKey: !!fields.resendApiKey }));
          setResendKey("");
        }
      } else {
        toast.error("Failed to save");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function saveAffiliateAccounts() {
    setSavingAccounts(true);
    try {
      const res = await fetch("/api/settings/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clickbankNickname: settings.clickbankNickname,
          amazonTrackingId: settings.amazonTrackingId,
          jvzooAffiliateId: settings.jvzooAffiliateId,
          warriorplusId: settings.warriorplusId,
          sharesaleAffiliateId: settings.sharesaleAffiliateId,
        }),
      });
      const data = await res.json() as { ok: boolean };
      if (data.ok) {
        toast.success("Accounts saved");
      } else {
        toast.error("Failed to save accounts");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSavingAccounts(false);
    }
  }

  async function stripeConnect() {
    setStripeLoading(true);
    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_account" }),
      });
      const data = await res.json() as { ok: boolean; url?: string };
      if (data.ok && data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to start Stripe onboarding");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setStripeLoading(false);
    }
  }

  async function stripeDisconnect() {
    setStripeLoading(true);
    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      const data = await res.json() as { ok: boolean };
      if (data.ok) {
        setStripeStatus({ connected: false });
        toast.success("Stripe disconnected");
      } else {
        toast.error("Failed to disconnect");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setStripeLoading(false);
    }
  }

  async function stripeDashboard() {
    setStripeLoading(true);
    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_login_link" }),
      });
      const data = await res.json() as { ok: boolean; url?: string };
      if (data.ok && data.url) {
        window.open(data.url, "_blank");
      } else {
        toast.error("Failed to open dashboard");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setStripeLoading(false);
    }
  }

  const planCfg = PLAN_CONFIG[settings.plan] ?? PLAN_CONFIG.free;
  const PlanIcon = planCfg.icon;
  const connectedOAuthCount = Object.values(oauthStatus ?? {}).filter((platform) => platform.connected).length;
  const hasPixels = [settings.metaPixelId, settings.googleAnalyticsId, settings.tiktokPixelId, settings.googleAdsId].filter(Boolean).length;
  const connectedAffiliateCount = [
    settings.clickbankNickname,
    settings.amazonTrackingId,
    settings.jvzooAffiliateId,
    settings.warriorplusId,
    settings.sharesaleAffiliateId,
  ].filter(Boolean).length;
  const automationReadyCount = [
    settings.webhookUrl,
    settings.businessUrl,
    settings.businessType,
  ].filter(Boolean).length;
  const settingsSections = [
    { href: "#appearance", label: "Appearance" },
    { href: "#workspace", label: "Workspace" },
    { href: "#email-delivery", label: "Email" },
    { href: "#pixels", label: "Tracking" },
    { href: "#ad-connections", label: "Ad Connections" },
    { href: "#automation", label: "Automation" },
    { href: "#payments", label: "Payments" },
    { href: "#accounts", label: "Accounts" },
    { href: "#integrations", label: "Integrations" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-t-bg text-white">
        <AppNav />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-t-bg text-white">
      <AppNav />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="rounded-3xl border border-white/[0.06] bg-gradient-to-br from-cyan-500/[0.07] via-white/[0.02] to-purple-500/[0.04] p-5 sm:p-6">
          <WorkflowHeader
            title="Settings"
            description="Workspace configuration, delivery health, tracking, and connected growth systems in one control surface."
            icon={Settings}
          />

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <OperatorStatCard label="Plan" value={<span className={planCfg.color}>{planCfg.label}</span>} description="Current workspace tier and feature access level." />
            <OperatorStatCard label="Ad Connections" value={`${connectedOAuthCount}/3 connected`} description="Meta, Google, and TikTok readiness for the ads dashboard." />
            <OperatorStatCard label="Tracking IDs" value={`${hasPixels}/4 saved`} description="Pixels and analytics identifiers currently staged for published sites." />
          </div>
        </div>

        {/* Plan badge */}
        <div className={`flex items-center justify-between p-4 rounded-2xl border ${planCfg.border} ${planCfg.bg}`}>
          <div className="flex items-center gap-3">
            <PlanIcon className={`w-5 h-5 ${planCfg.color}`} />
            <div>
              <p className={`text-sm font-black ${planCfg.color}`}>{planCfg.label} Plan</p>
              <p className="text-[11px] text-white/30">{settings.email}</p>
            </div>
          </div>
          <Link
            href="/billing"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-xs text-white/50 hover:text-white font-bold transition"
          >
            {settings.plan === "free" ? "Upgrade" : "Manage"}
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {(emailDeliveryAlert?.failedEnrollments ?? 0) > 0 && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <div>
              <p className="text-sm font-bold text-amber-100">
                Recent email follow-up attempts are failing
              </p>
              <p className="mt-1 text-xs leading-6 text-amber-100/75">
                {emailDeliveryAlert?.failedEnrollments} enrollment{emailDeliveryAlert?.failedEnrollments === 1 ? "" : "s"} failed in the last 24 hours.
                {emailDeliveryAlert?.latestError ? ` Latest issue: ${emailDeliveryAlert.latestError}` : ""}
              </p>
              <p className="mt-1 text-[11px] text-amber-100/60">
                Check your Resend API key, verified sender domain, and from address below.
              </p>
            </div>
          </div>
        )}

        <div className="sticky top-[108px] z-20 rounded-2xl border border-white/[0.06] bg-[#07101d]/90 p-3 backdrop-blur xl:top-[72px]">
          <div className="flex gap-2 overflow-x-auto">
            {settingsSections.map((section) => (
              <a
                key={section.href}
                href={section.href}
                className="shrink-0 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px] font-bold text-white/35 transition hover:border-white/[0.12] hover:text-white/70"
              >
                {section.label}
              </a>
            ))}
          </div>
        </div>

        {/* Appearance */}
        <Section id="appearance" title="Appearance" sub="Choose your preferred look and feel">
          <ThemePicker />
        </Section>

        {/* Workspace */}
        <Section id="workspace" title="Workspace" sub="Your workspace name shown across the platform">
          <div className="space-y-4">
            <Field label="Workspace Name">
              <Input
                value={settings.workspaceName}
                onChange={(v) => setSettings((s) => ({ ...s, workspaceName: v }))}
                placeholder="e.g. My Agency"
              />
            </Field>
            <button
              onClick={() => void save({ workspaceName: settings.workspaceName })}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-bold text-white/60 hover:text-white transition disabled:opacity-40"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save
            </button>
          </div>
        </Section>

        {/* Email Delivery */}
        <Section
          id="email-delivery"
          title="Email Delivery"
          sub="Connect Resend to send broadcasts and flow emails from your own domain"
        >
          <div className="space-y-5">
            {/* Resend key status */}
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${
              settings.hasResendKey
                ? "border-green-500/20 bg-green-500/5"
                : "border-amber-500/20 bg-amber-500/5"
            }`}>
              {settings.hasResendKey ? (
                <>
                  <Check className="w-4 h-4 text-green-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-green-400">Resend connected</p>
                    <p className="text-[10px] text-white/30">Email delivery is active</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-400">No API key — emails won&apos;t send</p>
                    <p className="text-[10px] text-white/30">
                      Get a free key at{" "}
                      <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-[#f5a623] hover:underline">
                        resend.com
                      </a>
                    </p>
                  </div>
                </>
              )}
            </div>

            <Field
              label="Resend API Key"
              sub={settings.hasResendKey ? "Enter a new key to replace the existing one" : "Starts with re_"}
            >
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={resendKey}
                  onChange={(e) => setResendKey(e.target.value)}
                  placeholder={settings.hasResendKey ? "••••••••••••••••" : "re_..."}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 transition font-mono"
                />
                <button
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="From Name">
                <Input
                  value={settings.sendingFromName}
                  onChange={(v) => setSettings((s) => ({ ...s, sendingFromName: v }))}
                  placeholder="Your Name or Brand"
                />
              </Field>
              <Field label="From Email" sub="Must be verified in Resend">
                <Input
                  value={settings.sendingFromEmail}
                  onChange={(v) => setSettings((s) => ({ ...s, sendingFromEmail: v }))}
                  placeholder="hello@yourdomain.com"
                  type="email"
                />
              </Field>
            </div>

            <button
              onClick={() => void save({
                resendApiKey: resendKey || undefined,
                sendingFromName: settings.sendingFromName,
                sendingFromEmail: settings.sendingFromEmail,
              })}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f5a623]/20 hover:bg-[#f5a623]/30 border border-[#f5a623]/30 text-[#f5a623] text-xs font-bold transition disabled:opacity-40"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
              Save Email Settings
            </button>

            {/* Resend guide */}
            <div className="bg-white/[0.02] rounded-xl p-4 text-xs text-white/30 space-y-1.5">
              <p className="font-bold text-white/50 mb-2">Quick setup guide</p>
              <p>1. Sign up at <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-[#f5a623]">resend.com</a> (free — 3,000 emails/mo)</p>
              <p>2. Add your domain under Domains → Verify DNS records</p>
              <p>3. Create an API key under API Keys</p>
              <p>4. Paste the key here and set your From email to your verified domain</p>
            </div>
          </div>
        </Section>

        {/* Opt-in Forms */}
        <Section
          id="forms"
          title="Opt-in Forms"
          sub="Embeddable forms that capture leads into your email list"
        >
          <OptInFormsManager />
        </Section>

        {/* Ad & Analytics Pixels */}
        <Section
          id="pixels"
          title="Ad & Analytics Pixels"
          sub="Pixels fire on every public site page you publish — track conversions and retarget visitors"
        >
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/20">Tracking Readiness</p>
                <p className="mt-2 text-sm font-black text-white">{hasPixels}/4 identifiers saved</p>
                <p className="mt-1 text-[11px] leading-5 text-white/35">Once IDs are set, published sites can fire analytics and retargeting signals without manual code edits.</p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/20">Operator View</p>
                <p className="mt-2 text-sm font-black text-white">One publish path</p>
                <p className="mt-1 text-[11px] leading-5 text-white/35">This page is where measurement gets wired into every generated site before you send traffic.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Meta Pixel ID" sub="Facebook & Instagram ads">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#1877f2]"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </div>
                  <input
                    type="text"
                    value={settings.metaPixelId}
                    onChange={(e) => setSettings((s) => ({ ...s, metaPixelId: e.target.value }))}
                    placeholder="123456789012345"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 transition font-mono"
                  />
                </div>
              </Field>

              <Field label="TikTok Pixel ID" sub="TikTok for Business">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white/50"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.73a4.85 4.85 0 01-1.01-.04z"/></svg>
                  </div>
                  <input
                    type="text"
                    value={settings.tiktokPixelId}
                    onChange={(e) => setSettings((s) => ({ ...s, tiktokPixelId: e.target.value }))}
                    placeholder="C1A2B3D4E5F6G7H8I9J0"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 transition font-mono"
                  />
                </div>
              </Field>

              <Field label="Google Analytics ID (GA4)" sub="Measurement ID starts with G-">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5"><path fill="#F9AB00" d="M22.84 20.33a2.86 2.86 0 01-2.86 2.86 2.86 2.86 0 01-2.86-2.86V3.67a2.86 2.86 0 012.86-2.86 2.86 2.86 0 012.86 2.86z"/><path fill="#E37400" d="M13.71 20.33a2.86 2.86 0 01-2.86 2.86 2.86 2.86 0 01-2.86-2.86v-7.14a2.86 2.86 0 012.86-2.86 2.86 2.86 0 012.86 2.86z"/><circle fill="#E37400" cx="5" cy="20.33" r="2.86"/></svg>
                  </div>
                  <input
                    type="text"
                    value={settings.googleAnalyticsId}
                    onChange={(e) => setSettings((s) => ({ ...s, googleAnalyticsId: e.target.value }))}
                    placeholder="G-XXXXXXXXXX"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 transition font-mono"
                  />
                </div>
              </Field>

              <Field label="Google Ads Conversion ID" sub="For conversion tracking (AW-XXXXXXXXX)">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  </div>
                  <input
                    type="text"
                    value={settings.googleAdsId}
                    onChange={(e) => setSettings((s) => ({ ...s, googleAdsId: e.target.value }))}
                    placeholder="AW-XXXXXXXXX"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 transition font-mono"
                  />
                </div>
              </Field>
            </div>

            <div className="bg-white/[0.02] rounded-xl p-3 text-[10px] text-white/25 flex items-start gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-[#f5a623]/50 shrink-0 mt-0.5" />
              <span>All pixels are injected into every published site page automatically. You only need to add the IDs — no manual code editing required.</span>
            </div>

            <button
              onClick={() => void save({
                metaPixelId: settings.metaPixelId,
                googleAnalyticsId: settings.googleAnalyticsId,
                tiktokPixelId: settings.tiktokPixelId,
                googleAdsId: settings.googleAdsId,
              })}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f5a623]/20 hover:bg-[#f5a623]/30 border border-[#f5a623]/30 text-[#f5a623] text-xs font-bold transition disabled:opacity-40"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
              Save Pixels
            </button>
          </div>
        </Section>

        <Section
          id="ad-connections"
          title="Ad Platform Connections"
          sub="Connect Meta, Google, and TikTok so Himalaya can pull performance data and power the ads dashboard"
        >
          <div className="space-y-3">
            <div className="rounded-xl border border-[#f5a623]/15 bg-[#f5a623]/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f5f0e8]/70">Connection Status</p>
                  <p className="mt-2 text-sm font-black text-white">{connectedOAuthCount}/3 ad platforms connected</p>
                  <p className="mt-1 text-[11px] leading-5 text-white/40">
                    These connections are the bridge between settings and the unified ads dashboard. Once connected, this stops being static setup and becomes a live control system.
                  </p>
                </div>
                <Link
                  href="/ads"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-bold text-white/55 transition hover:text-white/80"
                >
                  Open Ads Dashboard
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {([
              { key: "meta", label: "Meta Ads", sub: "Facebook and Instagram campaign data" },
              { key: "google", label: "Google Ads", sub: "Search, YouTube, and display campaign data" },
              { key: "tiktok", label: "TikTok Ads", sub: "TikTok campaign performance and spend" },
            ] as const).map((platform) => {
              const status = oauthStatus?.[platform.key];
              return (
                <div key={platform.key} className="flex flex-col gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                  <div>
                    <p className="text-sm font-bold text-white/70">{platform.label}</p>
                    <p className="mt-1 text-[11px] text-white/30">{platform.sub}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                          status?.connected
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                            : "border-white/[0.08] bg-white/[0.04] text-white/35"
                        }`}>
                          {status?.connected ? "Connected" : "Not Connected"}
                        </span>
                        <span className="text-[11px] text-white/35">
                          {status?.connected ? "Ready for token-backed campaign sync." : "Still in setup mode for this platform."}
                        </span>
                      </div>
                    </div>
                    <a
                      href={status?.connectUrl ?? `/api/oauth/connect?provider=${platform.key}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/10 px-4 py-2 text-xs font-bold text-[#f5a623] transition hover:bg-[#f5a623]/20"
                    >
                      {status?.connected ? "Reconnect" : "Connect"}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}

            <div className="rounded-xl bg-white/[0.02] p-3 text-[10px] text-white/25 flex items-start gap-2">
              <MessageSquareText className="w-3.5 h-3.5 text-[#f5a623]/50 shrink-0 mt-0.5" />
              <span>
                Once connected, the unified ads dashboard can pull live spend, ROAS, and campaign totals. The current backend is ready for token-based sync, and these connections are the frontend entry point.
              </span>
            </div>
          </div>
        </Section>

        {/* Automation / Webhooks */}
        <Section
          id="automation"
          title="Automation & Webhooks"
          sub="Connect to N8N, Zapier, or any webhook endpoint to trigger automations"
        >
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/20">Automation Readiness</p>
                <p className="mt-2 text-sm font-black text-white">{automationReadyCount}/3 essentials configured</p>
                <p className="mt-1 text-[11px] leading-5 text-white/35">Webhook target, business URL, and business type give the automation layer enough context to trigger and enrich downstream actions.</p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/20">Operator Use</p>
                <p className="mt-2 text-sm font-black text-white">External workflow bridge</p>
                <p className="mt-1 text-[11px] leading-5 text-white/35">This is where Himalaya hands off events to Zapier, N8N, or custom systems without adding manual glue code to every campaign.</p>
              </div>
            </div>

            <Field
              label="Webhook URL"
              sub="We POST JSON events here: new_contact, broadcast_sent, order_placed, campaign_launched"
            >
              <Input
                value={settings.webhookUrl}
                onChange={(v) => setSettings((s) => ({ ...s, webhookUrl: v }))}
                placeholder="https://your-n8n.com/webhook/abc123"
              />
            </Field>

            <Field label="Business Website URL" sub="Used for auto-analysis and AI-generated content">
              <Input
                value={settings.businessUrl}
                onChange={(v) => setSettings((s) => ({ ...s, businessUrl: v }))}
                placeholder="https://yourbusiness.com"
              />
            </Field>

            <Field label="Business Type" sub="Helps AI generate better campaigns and copy">
              <select
                value={settings.businessType}
                onChange={(e) => setSettings((s) => ({ ...s, businessType: e.target.value }))}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#f5a623]/50 transition appearance-none"
              >
                <option value="" className="bg-t-bg">Select business type…</option>
                <option value="consultant" className="bg-t-bg">Consultant / Freelancer</option>
                <option value="ecommerce" className="bg-t-bg">E-commerce / Product Store</option>
                <option value="service" className="bg-t-bg">Local Service Business</option>
                <option value="affiliate" className="bg-t-bg">Affiliate / Dropshipping</option>
                <option value="agency" className="bg-t-bg">Agency / SaaS</option>
              </select>
            </Field>

            <div className="bg-white/[0.02] rounded-xl p-3 space-y-2">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Webhook Event Payload</p>
              <pre className="text-[10px] text-white/25 font-mono leading-relaxed overflow-x-auto">{`{
  "event": "new_contact",
  "timestamp": "2025-01-01T00:00:00Z",
  "data": { "email": "...", "tags": [...] }
}`}</pre>
            </div>

            <button
              onClick={() => void save({
                webhookUrl: settings.webhookUrl,
                businessUrl: settings.businessUrl,
                businessType: settings.businessType,
              })}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-[#e07850] text-xs font-bold transition disabled:opacity-40"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Webhook className="w-3.5 h-3.5" />}
              Save Automation Settings
            </button>
          </div>
        </Section>

        {/* Stripe Payments */}
        <Section id="payments" title="Stripe Payments" sub="Accept payments and manage payouts through Stripe Connect">
          <div className="space-y-4">
            {stripeStatus === null ? (
              <div className="flex items-center gap-2 text-white/30 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading payment status...
              </div>
            ) : stripeStatus.connected && stripeStatus.verified ? (
              <>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-emerald-400">Connected</p>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-[9px] font-black uppercase tracking-wider text-emerald-400">Verified</span>
                    </div>
                    {stripeStatus.businessName && (
                      <p className="text-[11px] text-white/40 mt-0.5">{stripeStatus.businessName}{stripeStatus.email ? ` — ${stripeStatus.email}` : ""}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => void stripeDashboard()}
                    disabled={stripeLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f5a623]/20 hover:bg-[#f5a623]/30 border border-[#f5a623]/30 text-[#f5a623] text-xs font-bold transition disabled:opacity-40"
                  >
                    {stripeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                    Open Stripe Dashboard
                  </button>
                  <button
                    onClick={() => void stripeDisconnect()}
                    disabled={stripeLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-red-500/10 border border-white/[0.08] hover:border-red-500/20 text-xs font-bold text-white/50 hover:text-red-400 transition disabled:opacity-40"
                  >
                    Disconnect
                  </button>
                </div>
              </>
            ) : stripeStatus.connected && !stripeStatus.verified ? (
              <>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-amber-400">Setup Incomplete</p>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-500/20 text-[9px] font-black uppercase tracking-wider text-amber-400">Action Needed</span>
                    </div>
                    <p className="text-[10px] text-white/30 mt-0.5">Stripe requires additional verification before you can accept payments</p>
                  </div>
                </div>
                <button
                  onClick={() => void stripeConnect()}
                  disabled={stripeLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f5a623]/20 hover:bg-[#f5a623]/30 border border-[#f5a623]/30 text-[#f5a623] text-xs font-bold transition disabled:opacity-40"
                >
                  {stripeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                  Complete Setup
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-black/20">
                  <Zap className="w-4 h-4 text-white/30 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white/50">Not connected</p>
                    <p className="text-[10px] text-white/30">Connect Stripe to accept payments and receive payouts for your products and services</p>
                  </div>
                </div>
                <button
                  onClick={() => void stripeConnect()}
                  disabled={stripeLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f5a623]/20 hover:bg-[#f5a623]/30 border border-[#f5a623]/30 text-[#f5a623] text-xs font-bold transition disabled:opacity-40"
                >
                  {stripeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  Connect Stripe
                </button>
              </>
            )}
          </div>
        </Section>

        {/* Connected Accounts */}
        <Section id="accounts" title="Connected Accounts" sub="Link your affiliate and platform accounts to auto-generate affiliate URLs">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/20">Connected Accounts</p>
                <p className="mt-2 text-sm font-black text-white">{connectedAffiliateCount}/5 saved</p>
                <p className="mt-1 text-[11px] leading-5 text-white/35">Stored account handles let affiliate links and monetized assets be generated directly inside the workspace.</p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/20">Revenue Path</p>
                <p className="mt-2 text-sm font-black text-white">Offer links without hand-editing</p>
                <p className="mt-1 text-[11px] leading-5 text-white/35">Once these IDs are present, the frontend can route generated product and funnel assets toward your actual monetization accounts.</p>
              </div>
            </div>

            <Field label="ClickBank Nickname" sub="Your ClickBank account nickname (for hoplinks)">
              <Input
                value={settings.clickbankNickname}
                onChange={(v) => setSettings((s) => ({ ...s, clickbankNickname: v }))}
                placeholder="yourname"
              />
            </Field>
            {settings.clickbankNickname && (
              <p className="text-[11px] text-white/30 -mt-2">
                Hoplinks will use: <span className="text-[#f5a623]/70">https://{settings.clickbankNickname}.hop.clickbank.net</span>
              </p>
            )}

            <Field label="Amazon Associates Tracking ID" sub="Your Amazon tracking/tag ID">
              <Input
                value={settings.amazonTrackingId}
                onChange={(v) => setSettings((s) => ({ ...s, amazonTrackingId: v }))}
                placeholder="yourtag-20"
              />
            </Field>

            <Field label="JVZoo Affiliate ID" sub="Your JVZoo affiliate account ID">
              <Input
                value={settings.jvzooAffiliateId}
                onChange={(v) => setSettings((s) => ({ ...s, jvzooAffiliateId: v }))}
                placeholder="123456"
              />
            </Field>

            <Field label="WarriorPlus ID" sub="Your WarriorPlus affiliate username">
              <Input
                value={settings.warriorplusId}
                onChange={(v) => setSettings((s) => ({ ...s, warriorplusId: v }))}
                placeholder="yourhandle"
              />
            </Field>

            <Field label="ShareASale Affiliate ID">
              <Input
                value={settings.sharesaleAffiliateId}
                onChange={(v) => setSettings((s) => ({ ...s, sharesaleAffiliateId: v }))}
                placeholder="1234567"
              />
            </Field>

            <button
              onClick={() => void saveAffiliateAccounts()}
              disabled={savingAccounts}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f5a623]/20 hover:bg-[#f5a623]/30 border border-[#f5a623]/30 text-[#f5a623] text-xs font-bold transition disabled:opacity-40"
            >
              {savingAccounts ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {savingAccounts ? "Saving..." : "Save Accounts"}
            </button>
          </div>
        </Section>

        {/* Integrations */}
        <Section id="integrations" title="Integrations" sub="Connect external tools">
          <div className="space-y-3">
            <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/20">Integration Surface</p>
                  <p className="mt-2 text-sm font-black text-white">Current plan: {planCfg.label}</p>
                  <p className="mt-1 text-[11px] leading-5 text-white/35">These are the next external systems the product can absorb into the operating workflow as the platform matures.</p>
                </div>
                <Link
                  href="/billing"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-bold text-white/55 transition hover:text-white/80"
                >
                  {settings.plan === "free" ? "Upgrade Plan" : "Manage Plan"}
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {[
              { name: "Shopify", desc: "Sync customers to email contacts", status: "coming_soon" },
              { name: "Stripe Webhooks", desc: "Trigger flows on purchase events", status: "coming_soon" },
              { name: "Zapier", desc: "Connect 5,000+ apps", status: "coming_soon" },
              { name: "API Access", desc: "Push contacts and events via REST", status: settings.plan === "elite" ? "active" : "upgrade" },
            ].map(({ name, desc, status }) => (
              <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div>
                  <p className="text-xs font-bold text-white/60">{name}</p>
                  <p className="text-[10px] text-white/25">{desc}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                  status === "active"
                    ? "text-green-400 bg-green-500/10 border-green-500/20"
                    : status === "upgrade"
                    ? "text-[#e07850] bg-purple-500/10 border-purple-500/20"
                    : "text-white/20 bg-white/5 border-white/10"
                }`}>
                  {status === "active" ? "Active" : status === "upgrade" ? "Elite" : "Soon"}
                </span>
              </div>
            ))}
          </div>
        </Section>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Opt-in Forms Manager (inline in settings)
// ---------------------------------------------------------------------------

interface OptInForm {
  id: string;
  name: string;
  headline?: string;
  subheadline?: string;
  buttonText: string;
  tags: string[];
  redirectUrl?: string;
  executionTier?: "core" | "elite";
  active: boolean;
  views: number;
  submissions: number;
}

type FormExecutionTier = "core" | "elite";

function OptInFormsManager() {
  const [forms, setForms] = useState<OptInForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", headline: "", subheadline: "", buttonText: "Subscribe", tags: "", redirectUrl: "", executionTier: "elite" as FormExecutionTier });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/opt-in-forms")
      .then((r) => r.json() as Promise<{ ok: boolean; forms?: OptInForm[] }>)
      .then((data) => { if (data.ok) setForms(data.forms ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!newForm.name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/opt-in-forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newForm.name,
          headline: newForm.headline || undefined,
          subheadline: newForm.subheadline || undefined,
          buttonText: newForm.buttonText || "Subscribe",
          tags: newForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
          redirectUrl: newForm.redirectUrl || undefined,
          executionTier: newForm.executionTier,
        }),
      });
      const data = await res.json() as { ok: boolean; form?: OptInForm };
      if (data.ok && data.form) {
        setForms((p) => [data.form!, ...p]);
        setShowNew(false);
        setNewForm({ name: "", headline: "", subheadline: "", buttonText: "Subscribe", tags: "", redirectUrl: "", executionTier: "elite" });
        toast.success("Form created");
      }
    } catch {
      toast.error("Failed to create form");
    } finally {
      setCreating(false);
    }
  }

  function copyUrl(formId: string) {
    const url = `${window.location.origin}/forms/${formId}`;
    void navigator.clipboard.writeText(url);
    setCopiedId(formId);
    toast.success("Form URL copied!");
    setTimeout(() => setCopiedId(null), 2000);
  }

  function getEmbedCode(formId: string) {
    const url = `${window.location.origin}/forms/${formId}`;
    return `<iframe src="${url}" width="100%" height="400" frameborder="0" style="border-radius:12px"></iframe>`;
  }

  if (loading) return <Loader2 className="w-4 h-4 text-white/20 animate-spin" />;

  return (
    <div className="space-y-4">
      {forms.map((form) => (
        <div key={form.id} className="bg-white/[0.02] border border-white/[0.07] rounded-xl p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-sm font-bold text-white">{form.name}</p>
              {form.headline && <p className="text-[11px] text-white/35 mt-0.5">{form.headline}</p>}
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
              form.active ? "text-green-400 bg-green-500/10 border-green-500/20" : "text-white/30 bg-white/5 border-white/10"
            }`}>
              {form.active ? "Active" : "Paused"}
            </span>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] ${
              (form.executionTier ?? "elite") === "elite"
                ? "border-[#f5a623]/30 bg-[#f5a623]/10 text-[#f5a623]"
                : "border-white/10 bg-white/5 text-white/45"
            }`}>
              {(form.executionTier ?? "elite")}
            </span>
          </div>

          <div className="flex gap-4 mb-3 text-xs text-white/30">
            <span><span className="font-bold text-white/50">{form.views}</span> views</span>
            <span><span className="font-bold text-white/50">{form.submissions}</span> submissions</span>
            {form.submissions > 0 && form.views > 0 && (
              <span><span className="font-bold text-[#f5a623]">{Math.round((form.submissions / form.views) * 100)}%</span> conversion</span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => copyUrl(form.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-[11px] text-white/50 hover:text-white font-semibold transition"
            >
              {copiedId === form.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              Copy URL
            </button>
            <button
              onClick={() => {
                void navigator.clipboard.writeText(getEmbedCode(form.id));
                toast.success("Embed code copied!");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-[11px] text-white/50 hover:text-white font-semibold transition"
            >
              <Globe className="w-3 h-3" />
              Embed Code
            </button>
            <a
              href={`/forms/${form.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-[11px] text-white/50 hover:text-white font-semibold transition"
            >
              <ExternalLink className="w-3 h-3" />
              Preview
            </a>
          </div>
        </div>
      ))}

      {!showNew ? (
        <button
          onClick={() => setShowNew(true)}
          className="w-full py-2.5 rounded-xl border border-dashed border-white/[0.12] text-white/30 hover:text-white/60 hover:border-white/[0.25] text-xs font-bold transition"
        >
          + Create New Form
        </button>
      ) : (
        <div className="bg-white/[0.02] border border-white/[0.1] rounded-xl p-4 space-y-3">
          <p className="text-xs font-black text-white/50 uppercase tracking-wider">New Form</p>
          {[
            { field: "name", label: "Internal Name *", placeholder: "e.g. Newsletter Signup" },
            { field: "headline", label: "Headline", placeholder: "Join our newsletter" },
            { field: "subheadline", label: "Subheadline", placeholder: "Get weekly tips straight to your inbox" },
            { field: "buttonText", label: "Button Text", placeholder: "Subscribe" },
            { field: "tags", label: "Auto-tag (comma separated)", placeholder: "newsletter, leads" },
            { field: "redirectUrl", label: "Redirect URL after submit", placeholder: "https://yoursite.com/thank-you" },
          ].map(({ field, label, placeholder }) => (
            <div key={field}>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/25 mb-1">{label}</label>
              <input
                type="text"
                value={newForm[field as keyof typeof newForm]}
                onChange={(e) => setNewForm((f) => ({ ...f, [field]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#f5a623]/50 transition"
              />
            </div>
          ))}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-white/25 mb-2">Execution Lane</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                { id: "core" as const, label: "Core", description: "Clean form experience that ships quickly." },
                { id: "elite" as const, label: "Elite", description: "Sharper public form presentation with stronger premium polish." },
              ].map((tier) => {
                const active = newForm.executionTier === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setNewForm((f) => ({ ...f, executionTier: tier.id }))}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      active
                        ? "border-[#f5a623]/40 bg-[#f5a623]/10 shadow-[0_0_20px_rgba(245,166,35,0.12)]"
                        : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className={`text-xs font-black ${active ? "text-[#f5a623]" : "text-white"}`}>{tier.label}</span>
                      <span className={`text-[10px] font-black uppercase tracking-[0.24em] ${active ? "text-[#f5a623]" : "text-white/20"}`}>
                        {tier.id}
                      </span>
                    </div>
                    <p className={`mt-2 text-[11px] leading-relaxed ${active ? "text-[#f5f0e8]/80" : "text-white/45"}`}>
                      {tier.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowNew(false)} className="flex-1 py-2 rounded-lg border border-white/[0.08] text-white/30 text-xs font-bold hover:text-white/50 transition">
              Cancel
            </button>
            <button
              onClick={() => void handleCreate()}
              disabled={creating || !newForm.name.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#f5a623]/20 border border-[#f5a623]/30 text-[#f5a623] text-xs font-bold hover:bg-[#f5a623]/30 transition disabled:opacity-40"
            >
              {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Create
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
