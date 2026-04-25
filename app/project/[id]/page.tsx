"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  ArrowLeft, Globe, Zap, Mail, Users, ExternalLink, Copy, Check,
  Play, DollarSign, Shield, Mountain, Loader2, ChevronDown,
  BarChart2, Settings, ChevronRight, Wrench, ArrowRight,
  Image as ImageIcon, Monitor, Smartphone, Eye, FileText,
  Send, CalendarDays,
} from "lucide-react";

type Project = {
  id: string;
  name: string;
  niche: string;
  site?: { id: string; slug: string; published: boolean; views: number };
  campaign?: { id: string; status: string; variationCount: number };
  emailFlow?: { id: string; status: string; enrolled: number; sent: number };
  leadCount: number;
  revenue: number;
};

type Script = { id: number; title: string; style: string; length: string; hook: string; body: string; cta: string; caption: string; hashtags: string[]; postFirst: boolean };
type PackageData = {
  product?: { name: string; avgPayout: string; targetAudience: string; whyItWins: string; network: string };
  math?: { explanation: string; targetDaily: number; salesNeeded: number; dailyAdBudget: number };
  scriptCount?: number;
  emailCount?: number;
  timeline?: { week: string; revenue: string; action: string }[];
  compliance?: string[];
};

type Tab = "overview" | "website" | "ads" | "scripts" | "emails" | "analytics" | "orders" | "tools";

export default function ProjectHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [pkg, setPkg] = useState<PackageData | null>(null);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toolResult, setToolResult] = useState<{ name: string; data: unknown } | null>(null);
  const [toolLoading, setToolLoading] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [orders, setOrders] = useState<{id: string; customerEmail: string; customerName?: string; amountCents: number; status: string; createdAt: string; productName?: string}[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [bizType, setBizType] = useState<string>("");

  useEffect(() => { if (isLoaded && !isSignedIn) router.replace("/sign-in"); }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!isSignedIn) return;
    Promise.allSettled([
      fetch("/api/himalaya/projects").then(r => r.json()),
      fetch(`/api/himalaya/projects/${id}/package`).then(r => r.json()),
      fetch(`/api/himalaya/projects/${id}/scripts`).then(r => r.json()),
    ]).then(([pRes, pkgRes, sRes]) => {
      if (pRes.status === "fulfilled" && pRes.value.ok) {
        const found = (pRes.value.projects ?? []).find((p: Project) => p.id === id);
        if (found) setProject(found);
      }
      if (pkgRes.status === "fulfilled" && pkgRes.value.ok && pkgRes.value.package) setPkg(pkgRes.value.package as PackageData);
      if (sRes.status === "fulfilled" && sRes.value.ok) setScripts(sRes.value.scripts ?? []);
    }).finally(() => setLoading(false));

    fetch("/api/business-profile").then(r => r.json()).then(data => {
      if (data.ok) setBizType(data.profile?.businessType ?? "");
    }).catch(() => {});
  }, [isSignedIn, id]);

  useEffect(() => {
    if (tab !== "orders" || !isSignedIn) return;
    setOrdersLoading(true);
    fetch("/api/orders")
      .then(r => r.json())
      .then(data => { if (data.ok) setOrders(data.orders ?? []); })
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, [tab, isSignedIn]);

  function copy(text: string, copyId: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(copyId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function runTool(toolId: string, toolName: string) {
    setToolLoading(toolId);
    setToolResult(null);
    try {
      const res = await fetch("/api/himalaya/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: toolId, params: { niche: project?.niche ?? "business", businessName: project?.name ?? "My Business", offer: project?.name, audience: project?.niche } }),
      });
      const data = await res.json();
      if (data.ok) setToolResult({ name: toolName, data: data.result });
    } catch { /* ignore */ }
    setToolLoading(null);
  }

  if (!isLoaded || !isSignedIn) return null;
  if (loading) {
    return (
      <main className="min-h-screen bg-t-bg text-t-text flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-[#f5a623] animate-spin" />
          <p className="text-xs text-t-text-faint">Loading your business...</p>
        </div>
      </main>
    );
  }

  const p = project;
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const siteUrl = p?.site?.published ? `${appUrl}/s/${p.site.slug}` : null;
  const sitePreviewUrl = p?.site?.slug ? `${appUrl}/s/${p.site.slug}` : null;

  // Determine what's done
  const hasSite = !!p?.site;
  const sitePublished = !!p?.site?.published;
  const hasAds = (p?.campaign?.variationCount ?? 0) > 0;
  const hasEmails = !!p?.emailFlow;
  const hasScripts = scripts.length > 0;

  // Sidebar nav items
  const NAV: { id: string; label: string; icon: React.ElementType; count?: string | number; done?: boolean; href?: string }[] = [
    { id: "overview", label: "Overview", icon: Mountain },
    { id: "website", label: "Website", icon: Globe, done: sitePublished, count: sitePublished ? "Live" : "Draft" },
    { id: "ads", label: "Ads & Creatives", icon: Zap, count: p?.campaign?.variationCount ?? 0, done: hasAds },
    { id: "scripts", label: "Scripts", icon: Play, count: scripts.length, done: hasScripts },
    { id: "emails", label: "Emails", icon: Mail, count: p?.emailFlow?.sent ?? 0, done: hasEmails },
    { id: "analytics", label: "Analytics", icon: BarChart2, count: p?.site?.views ?? 0 },
    { id: "orders", label: "Orders", icon: DollarSign },
    { id: "tools", label: "Tools", icon: Wrench },
  ];

  // Add business-type-specific nav items
  if (bizType === "agency") {
    NAV.splice(1, 0,
      { id: "outreach_link", label: "Outreach", icon: Send, href: "/outreach" },
      { id: "clients_link", label: "Clients", icon: Users, href: "/clients" },
    );
  }
  if (bizType === "consultant_coach") {
    NAV.splice(1, 0,
      { id: "bookings_link", label: "Bookings", icon: CalendarDays, href: "/bookings" },
    );
  }

  return (
    <main className="min-h-screen bg-t-bg text-t-text flex">

      {/* ═══ LEFT SIDEBAR ═══ */}
      <aside className="w-[260px] shrink-0 border-r border-white/10 h-screen sticky top-0 flex flex-col bg-gradient-to-b from-[#0c0a08] via-[#0c0a08] to-violet-950/5">

        {/* Project header */}
        <div className="p-5 border-b border-white/10 bg-white/[0.02] backdrop-blur-xl">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-t-text-faint hover:text-[#f5a623] transition mb-3">
            <ArrowLeft className="w-3.5 h-3.5" /> All Projects
          </Link>
          <h2 className="text-base font-black truncate bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">{p?.name ?? "Business"}</h2>
          <p className="text-xs text-t-text-faint truncate mt-1">{p?.niche ?? ""}</p>

          {/* Status badges */}
          <div className="flex items-center gap-2 mt-3">
            {sitePublished && (
              <span className="text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]">Live</span>
            )}
            {hasAds && (
              <span className="text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/30 shadow-[0_0_10px_rgba(245,166,35,0.1)]">{p?.campaign?.variationCount} Ads</span>
            )}
          </div>

          {/* Revenue */}
          {(p?.revenue ?? 0) > 0 && (
            <div className="mt-3 rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/30 px-3 py-2.5 text-center shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <p className="text-2xl font-black text-emerald-400">${(p?.revenue ?? 0).toLocaleString()}</p>
              <p className="text-[9px] text-emerald-400/60 mt-0.5">Revenue</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV.map(item => item.href ? (
            <Link key={item.id} href={item.href}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition text-t-text-faint hover:text-white hover:bg-white/[0.05] border border-transparent hover:border-white/10">
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <button key={item.id} onClick={() => setTab(item.id as Tab)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition ${
                tab === item.id
                  ? "bg-gradient-to-r from-[#f5a623]/10 to-orange-500/10 text-[#f5a623] border border-[#f5a623]/30 shadow-[0_0_20px_rgba(245,166,35,0.1)]"
                  : "text-t-text-faint hover:text-white hover:bg-white/[0.05] border border-transparent hover:border-white/10"
              }`}>
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {item.count !== undefined && (
                <span className={`text-xs font-bold ${
                  tab === item.id ? "text-[#f5a623]" : item.done ? "text-emerald-400" : "text-t-text-faint"
                }`}>{item.count}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-white/10 space-y-2 bg-white/[0.01]">
          {siteUrl && (
            <button onClick={() => copy(siteUrl, "sidebar-url")}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-t-text-faint hover:text-[#f5a623] hover:bg-white/[0.03] transition border border-transparent hover:border-white/10">
              {copiedId === "sidebar-url" ? <><Check className="w-3.5 h-3.5" /> Copied URL</> : <><Copy className="w-3.5 h-3.5" /> Copy Site Link</>}
            </button>
          )}
          {siteUrl && (
            <a href={siteUrl} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 transition border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
              <ExternalLink className="w-3.5 h-3.5" /> Open Live Site
            </a>
          )}
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 overflow-y-auto min-h-screen">
        <div className={`mx-auto p-6 sm:p-8 ${tab === "website" ? "max-w-6xl" : "max-w-3xl"}`}>

          {/* ═══ OVERVIEW ═══ */}
          {tab === "overview" && (
            <div className="space-y-6">
              {/* Business context card */}
              <div className="rounded-2xl border border-[#f5a623]/20 bg-gradient-to-br from-[#f5a623]/[0.06] to-transparent p-8 shadow-[0_0_40px_rgba(245,166,35,0.05)]">
                <p className="text-xs font-black text-[#f5a623] tracking-widest mb-4">BUSINESS CONTEXT</p>
                <h1 className="text-2xl font-black mb-3 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">{p?.name ?? "Your Business"}</h1>
                <p className="text-sm text-t-text-muted mb-6">Everything Himalaya built for this business. Review each section, approve or edit, then launch.</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "NICHE", val: p?.niche || "Not set" },
                    { label: "STAGE", val: pkg?.product ? "Active" : "Starting" },
                    { label: "GOAL", val: pkg?.math ? `$${pkg.math.targetDaily}/day` : "More leads" },
                    { label: "SYSTEMS", val: [hasSite && "Site", hasAds && "Ads", hasEmails && "Email", hasScripts && "Scripts"].filter(Boolean).join(", ") || "Building..." },
                  ].map(c => (
                    <div key={c.label} className="rounded-xl bg-white/[0.02] border border-white/10 p-4 hover:border-white/20 hover:bg-white/[0.04] transition">
                      <p className="text-[10px] font-black text-t-text-faint tracking-wider mb-1.5">{c.label}</p>
                      <p className="text-sm font-bold truncate text-white">{c.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: Globe, val: p?.site?.views ?? 0, label: "Views", color: "text-orange-400", bgGradient: "from-orange-500/10" },
                  { icon: Zap, val: p?.campaign?.variationCount ?? 0, label: "Ads", color: "text-[#f5a623]", bgGradient: "from-[#f5a623]/10" },
                  { icon: Mail, val: p?.emailFlow?.sent ?? 0, label: "Emails Sent", color: "text-blue-400", bgGradient: "from-blue-500/10" },
                  { icon: Users, val: p?.leadCount ?? 0, label: "Leads", color: "text-emerald-400", bgGradient: "from-emerald-500/10" },
                ].map(m => (
                  <div key={m.label} className={`rounded-xl bg-gradient-to-br ${m.bgGradient} to-transparent border border-white/10 p-5 text-center hover:border-white/20 hover:scale-105 transition-all shadow-[0_5px_20px_rgba(0,0,0,0.1)]`}>
                    <m.icon className={`w-5 h-5 ${m.color} mx-auto mb-2`} />
                    <p className="text-2xl font-black text-white">{m.val}</p>
                    <p className="text-[10px] text-t-text-faint mt-1">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* What's ready — status grid */}
              <div>
                <p className="text-[10px] font-black text-t-text-faint tracking-widest mb-3">WHAT&apos;S READY</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Website", icon: Globe, done: sitePublished, detail: sitePublished ? `${p?.site?.views ?? 0} views` : hasSite ? "Ready to publish" : "Building...", tab: "website" as Tab },
                    { label: "Ad Creatives", icon: Zap, done: hasAds, detail: hasAds ? `${p?.campaign?.variationCount} ready` : "Generating...", tab: "ads" as Tab },
                    { label: "Video Scripts", icon: Play, done: hasScripts, detail: hasScripts ? `${scripts.length} scripts` : "Generating...", tab: "scripts" as Tab },
                    { label: "Email Automation", icon: Mail, done: hasEmails, detail: hasEmails ? `${p?.emailFlow?.sent ?? 0} sent` : "Setting up...", tab: "emails" as Tab },
                  ].map(s => (
                    <button key={s.label} onClick={() => setTab(s.tab)}
                      className={`rounded-xl border p-4 text-left transition hover:border-[#f5a623]/20 ${
                        s.done ? "border-emerald-500/15 bg-emerald-500/[0.03]" : "border-t-border bg-t-bg-raised"
                      }`}>
                      <div className="flex items-center justify-between mb-2">
                        <s.icon className={`w-4 h-4 ${s.done ? "text-emerald-400" : "text-t-text-faint"}`} />
                        {s.done && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <p className="text-sm font-bold">{s.label}</p>
                      <p className="text-[10px] text-t-text-faint mt-0.5">{s.detail}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Product + Math */}
              {pkg?.product && (
                <div className="rounded-xl border border-t-border bg-t-bg-raised p-5">
                  <p className="text-[10px] font-black text-t-text-faint tracking-widest mb-2">YOUR PRODUCT</p>
                  <h3 className="text-base font-black">{pkg.product.name}</h3>
                  <p className="text-xs text-t-text-muted mt-1">{pkg.product.network} · {pkg.product.avgPayout}</p>
                  <p className="text-xs text-t-text-faint mt-1">{pkg.product.targetAudience}</p>
                  {pkg.product.whyItWins && <p className="text-xs text-[#f5a623]/70 mt-2 italic">{pkg.product.whyItWins}</p>}
                </div>
              )}

              {pkg?.math && (
                <div className="rounded-xl border border-[#f5a623]/15 bg-[#f5a623]/[0.03] p-5">
                  <p className="text-[10px] font-black text-[#f5a623] tracking-widest mb-2">YOUR MATH</p>
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-2xl font-black text-[#f5a623]">${pkg.math.targetDaily}/day</span>
                    <span className="text-xs text-t-text-faint">{pkg.math.salesNeeded} sales · ${pkg.math.dailyAdBudget}/day ads</span>
                  </div>
                  <p className="text-xs text-t-text-muted whitespace-pre-wrap">{pkg.math.explanation}</p>
                </div>
              )}

              {/* Timeline */}
              {pkg?.timeline && pkg.timeline.length > 0 && (
                <div className="rounded-xl border border-t-border bg-t-bg-raised p-5">
                  <p className="text-[10px] font-black text-t-text-faint tracking-widest mb-3">TIMELINE</p>
                  <div className="space-y-2">
                    {pkg.timeline.map((t, i) => (
                      <div key={i} className="flex gap-3 rounded-lg bg-t-bg-card border border-t-border p-3">
                        <div className="w-16 shrink-0">
                          <p className="text-[10px] font-black text-[#f5a623]">{t.week}</p>
                          <p className="text-[10px] font-bold text-emerald-500">{t.revenue}</p>
                        </div>
                        <p className="text-[11px] text-t-text-muted flex-1">{t.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Compliance */}
              {pkg?.compliance && pkg.compliance.length > 0 && (
                <div className="rounded-xl border border-t-border bg-t-bg-raised p-5">
                  <p className="text-[10px] font-black text-t-text-faint tracking-widest mb-2">COMPLIANCE</p>
                  <div className="space-y-1.5">{pkg.compliance.map((r, i) => (
                    <div key={i} className="flex items-start gap-2"><Shield className="w-3 h-3 text-red-400 shrink-0 mt-0.5" /><p className="text-[11px] text-t-text-faint">{r}</p></div>
                  ))}</div>
                </div>
              )}
            </div>
          )}

          {/* ═══ WEBSITE — Shopify-level 2060 UI ═══ */}
          {tab === "website" && (
            <div className="space-y-6">
              {/* Performance stats bar */}
              <div className="grid grid-cols-4 gap-3">
                <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-transparent border border-violet-500/20 p-4 text-center">
                  <Eye className="w-4 h-4 text-violet-400 mx-auto mb-1" />
                  <p className="text-2xl font-black text-white">{p?.site?.views ?? 0}</p>
                  <p className="text-[10px] text-violet-400/60 mt-0.5">Visitors</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 p-4 text-center">
                  <DollarSign className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <p className="text-2xl font-black text-emerald-400">{sitePublished ? "Live" : "Draft"}</p>
                  <p className="text-[10px] text-emerald-400/60 mt-0.5">Status</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 p-4 text-center">
                  <Zap className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                  <p className="text-2xl font-black text-blue-400">98</p>
                  <p className="text-[10px] text-blue-400/60 mt-0.5">Speed Score</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 p-4 text-center">
                  <Smartphone className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                  <p className="text-2xl font-black text-orange-400">100%</p>
                  <p className="text-[10px] text-orange-400/60 mt-0.5">Mobile Ready</p>
                </div>
              </div>

              {/* Header with preview controls */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-black bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Live Preview</h2>
                    <p className="text-sm text-t-text-faint mt-1">Your site looks amazing on every device</p>
                  </div>
                  {/* Device toggle */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                      <button onClick={() => setPreviewMode("desktop")}
                        className={`px-4 py-2.5 transition ${previewMode === "desktop" ? "bg-gradient-to-r from-[#f5a623]/10 to-orange-500/10 text-[#f5a623] border-r border-[#f5a623]/30" : "text-t-text-faint hover:text-white hover:bg-white/[0.05]"}`}>
                        <Monitor className="w-4 h-4" />
                      </button>
                      <button onClick={() => setPreviewMode("mobile")}
                        className={`px-4 py-2.5 transition ${previewMode === "mobile" ? "bg-gradient-to-r from-[#f5a623]/10 to-orange-500/10 text-[#f5a623]" : "text-t-text-faint hover:text-white hover:bg-white/[0.05]"}`}>
                        <Smartphone className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3">
                  {siteUrl && (
                    <a href={siteUrl} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-sm font-bold text-white hover:shadow-[0_10px_40px_rgba(16,185,129,0.3)] hover:scale-105 transition-all shadow-[0_5px_20px_rgba(16,185,129,0.2)]">
                      <ExternalLink className="w-4 h-4" /> Open Live Site
                    </a>
                  )}
                  {p?.site && (
                    <Link href={`/websites/${p.site.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[#f5a623]/30 bg-gradient-to-r from-[#f5a623]/10 to-orange-500/10 text-sm font-bold text-[#f5a623] hover:border-[#f5a623]/50 hover:shadow-[0_10px_30px_rgba(245,166,35,0.2)] transition-all">
                      <Settings className="w-4 h-4" /> Customize Design
                    </Link>
                  )}
                  {siteUrl && (
                    <button onClick={() => copy(siteUrl, "preview-url")}
                      className="px-4 py-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition">
                      {copiedId === "preview-url" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-t-text-faint" />}
                    </button>
                  )}
                </div>
              </div>

              {/* URL bar with SSL badge */}
              {siteUrl && (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur-xl px-5 py-3.5 flex items-center gap-3">
                  <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-emerald-400 shrink-0">HTTPS</span>
                  <Globe className="w-4 h-4 text-t-text-faint shrink-0" />
                  <code className="flex-1 text-sm font-mono text-white truncate">{siteUrl}</code>
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/30 shrink-0">Secure</span>
                </div>
              )}

              {/* Live site preview with 2060 browser chrome */}
              {sitePreviewUrl ? (
                <div className={`rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden transition-all duration-300 shadow-[0_20px_60px_rgba(0,0,0,0.3)] ${
                  previewMode === "mobile" ? "max-w-[375px] mx-auto" : ""
                }`}>
                  {/* Futuristic browser chrome */}
                  <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/10 bg-gradient-to-r from-violet-950/20 to-transparent backdrop-blur-xl">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-400 to-red-500 shadow-[0_0_10px_rgba(248,113,113,0.5)]" />
                      <div className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                      <div className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                    </div>
                    <div className="flex-1 rounded-lg bg-white/[0.03] border border-white/10 px-4 py-2 text-xs text-white/70 font-mono truncate">
                      {sitePreviewUrl}
                    </div>
                    <Eye className="w-4 h-4 text-violet-400" />
                  </div>
                  {/* iframe with glow effect */}
                  <div className={`relative ${previewMode === "mobile" ? "h-[667px]" : "h-[700px]"} bg-gradient-to-b from-transparent via-transparent to-violet-950/5`}>
                    <iframe
                      src={sitePreviewUrl}
                      className="w-full h-full border-0"
                      title="Site Preview"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-transparent p-16 text-center shadow-[0_0_60px_rgba(139,92,246,0.1)]">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center mx-auto mb-5 shadow-[0_10px_40px_rgba(139,92,246,0.3)] animate-pulse">
                    <Globe className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">Building Your Website...</h3>
                  <p className="text-sm text-t-text-muted">Your site will be ready in just a moment. Refresh to see it live.</p>
                </div>
              )}
            </div>
          )}

          {/* ═══ ADS & CREATIVES — 5-year-old simple, 100x value ═══ */}
          {tab === "ads" && (
            <div className="space-y-6">
              {/* Hero header with emoji */}
              <div className="rounded-2xl border border-[#f5a623]/20 bg-gradient-to-br from-[#f5a623]/[0.08] to-transparent p-8 text-center shadow-[0_0_60px_rgba(245,166,35,0.05)]">
                <div className="text-6xl mb-4">🎨</div>
                <h2 className="text-3xl font-black bg-gradient-to-r from-white via-[#f5a623] to-orange-500 bg-clip-text text-transparent mb-3">
                  {p?.campaign?.variationCount ?? 0} Ads Ready to Go
                </h2>
                <p className="text-base text-t-text-muted max-w-xl mx-auto">
                  We made {p?.campaign?.variationCount ?? 0} different ads for you. Just pick the ones you like and hit "Launch". That's it! 🚀
                </p>
              </div>

              {/* Giant action cards - SO EASY */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Link href={`/project/${id}/create`}
                  className="group rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/10 to-transparent p-8 hover:border-violet-500/30 hover:shadow-[0_20px_60px_rgba(139,92,246,0.2)] hover:scale-105 transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-[0_10px_30px_rgba(139,92,246,0.3)]">
                    <ImageIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">📸 Ad Images</h3>
                  <p className="text-sm text-t-text-faint mb-4">Static images for Facebook, Instagram, Google. Just download and post!</p>
                  <div className="flex items-center gap-2 text-violet-400 font-bold">
                    <span className="text-lg">Tap to Review</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                <Link href={`/project/${id}/video`}
                  className="group rounded-2xl border border-white/10 bg-gradient-to-br from-pink-500/10 to-transparent p-8 hover:border-pink-500/30 hover:shadow-[0_20px_60px_rgba(236,72,153,0.2)] hover:scale-105 transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-[0_10px_30px_rgba(236,72,153,0.3)]">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">🎬 Video Ads</h3>
                  <p className="text-sm text-t-text-faint mb-4">Animated videos with your copy. TikTok, Reels, YouTube Shorts ready!</p>
                  <div className="flex items-center gap-2 text-pink-400 font-bold">
                    <span className="text-lg">Tap to Review</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </div>

              {/* Campaign performance stats */}
              {p?.campaign ? (
                <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] to-transparent p-6 shadow-[0_0_40px_rgba(16,185,129,0.05)]">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-black text-white">Campaign Stats</h3>
                        <span className={`text-xs font-bold px-3 py-1 rounded-lg ${
                          p.campaign.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                            : "bg-white/[0.02] text-t-text-faint border border-white/10"
                        }`}>{p.campaign.status === "active" ? "🟢 Live" : "⏸️ Paused"}</span>
                      </div>
                      <p className="text-sm text-t-text-faint">Real-time performance of your ads</p>
                    </div>
                    <Link href={`/campaigns/${p.campaign.id}`}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#f5a623]/10 to-orange-500/10 border border-[#f5a623]/30 text-sm font-bold text-[#f5a623] hover:shadow-[0_10px_30px_rgba(245,166,35,0.2)] transition-all">
                        Full Workspace <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-xl bg-white/[0.02] border border-white/10 p-5 text-center">
                      <Zap className="w-5 h-5 text-[#f5a623] mx-auto mb-2" />
                      <p className="text-3xl font-black text-white">{p.campaign.variationCount}</p>
                      <p className="text-xs text-t-text-faint mt-1">Ad Variations</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.02] border border-white/10 p-5 text-center">
                      <Eye className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                      <p className="text-3xl font-black text-blue-400">—</p>
                      <p className="text-xs text-blue-400/60 mt-1">Impressions</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.02] border border-white/10 p-5 text-center">
                      <DollarSign className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                      <p className="text-3xl font-black text-emerald-400">—</p>
                      <p className="text-xs text-emerald-400/60 mt-1">Cost</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-[#f5a623]/20 bg-gradient-to-br from-[#f5a623]/[0.06] to-transparent p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f5a623] to-orange-500 flex items-center justify-center mx-auto mb-5 animate-pulse shadow-[0_10px_40px_rgba(245,166,35,0.3)]">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">Creating Your Ads...</h3>
                  <p className="text-sm text-t-text-muted max-w-md mx-auto">We're generating {scripts.length} different ad variations from your scripts. This takes about 60 seconds!</p>
                </div>
              )}

              {/* Quick tips - make it feel helpful */}
              <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.05] to-transparent p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <span className="text-xl">💡</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-400 mb-2">Pro Tip: Test 3-5 ads at once</h4>
                    <p className="text-xs text-t-text-faint leading-relaxed">Run multiple ads at the same time to see which one your audience likes best. The winner gets more budget automatically!</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ SCRIPTS — TikTok Creator Studio vibes ═══ */}
          {tab === "scripts" && (
            <div className="space-y-6">
              {/* Hero header */}
              <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] to-transparent p-8 text-center shadow-[0_0_60px_rgba(139,92,246,0.05)]">
                <div className="text-6xl mb-4">🎬</div>
                <h2 className="text-3xl font-black bg-gradient-to-r from-white via-violet-400 to-violet-500 bg-clip-text text-transparent mb-3">
                  {scripts.length} Video Scripts Ready
                </h2>
                <p className="text-base text-t-text-muted max-w-2xl mx-auto">
                  Just read these off your phone! Each script is 15-30 seconds. Record, post, and watch the views roll in. 📱
                </p>
              </div>

              {scripts.length === 0 ? (
                <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-transparent p-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center mx-auto mb-5 animate-pulse shadow-[0_10px_40px_rgba(139,92,246,0.3)]">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">Writing Your Scripts...</h3>
                  <p className="text-sm text-t-text-muted">AI is crafting scroll-stopping hooks for your niche. Almost done!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scripts.map((script, idx) => (
                    <details key={script.id} className="group rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden hover:border-white/20 transition-all">
                      <summary className="flex items-center justify-between cursor-pointer px-6 py-5 hover:bg-white/[0.04] transition">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-sm font-black text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                            {script.id}
                          </div>
                          {script.postFirst && <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/30 shadow-[0_0_10px_rgba(245,166,35,0.1)]">⭐ POST FIRST</span>}
                          <div className="flex-1">
                            <p className="text-base font-bold text-white">{script.title}</p>
                            <p className="text-xs text-violet-400 mt-0.5">{script.length} • Perfect for TikTok & Reels</p>
                          </div>
                        </div>
                        <ChevronDown className="w-5 h-5 text-t-text-faint group-open:rotate-180 transition-transform" />
                      </summary>

                      <div className="px-6 pb-6 space-y-4 bg-gradient-to-b from-transparent to-violet-950/5">
                        {/* Hook section */}
                        <div className="rounded-xl bg-gradient-to-br from-[#f5a623]/[0.08] to-transparent border border-[#f5a623]/20 p-5 shadow-[0_0_20px_rgba(245,166,35,0.05)]">
                          <div className="flex items-center gap-2 mb-3">
                            <Zap className="w-4 h-4 text-[#f5a623]" />
                            <p className="text-xs font-black text-[#f5a623] tracking-wider">HOOK (First 3 seconds)</p>
                          </div>
                          <p className="text-lg font-bold text-white leading-relaxed">&ldquo;{script.hook}&rdquo;</p>
                        </div>

                        {/* Body section */}
                        <div className="rounded-xl bg-white/[0.02] border border-white/10 p-5">
                          <p className="text-[10px] font-black text-t-text-faint tracking-wider mb-3">BODY (Main message)</p>
                          <p className="text-sm text-white/90 leading-relaxed">{script.body}</p>
                        </div>

                        {/* CTA section */}
                        <div className="rounded-xl bg-gradient-to-br from-emerald-500/[0.08] to-transparent border border-emerald-500/20 p-5">
                          <p className="text-[10px] font-black text-emerald-400 tracking-wider mb-3">CALL TO ACTION</p>
                          <p className="text-sm font-bold text-white">&ldquo;{script.cta}&rdquo;</p>
                        </div>

                        {/* Hashtags and copy button */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <div className="flex flex-wrap gap-2">
                            {script.hashtags.map(h => (
                              <span key={h} className="text-xs text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-lg border border-violet-500/30">
                                #{h}
                              </span>
                            ))}
                          </div>
                          <button onClick={() => copy(`${script.hook}\n\n${script.body}\n\n${script.cta}\n\n${script.hashtags.map(h => `#${h}`).join(' ')}`, `s-${script.id}`)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5a623]/10 to-orange-500/10 border border-[#f5a623]/30 text-sm font-bold text-[#f5a623] hover:shadow-[0_10px_30px_rgba(245,166,35,0.2)] hover:scale-105 transition-all">
                            {copiedId === `s-${script.id}` ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Full Script</>}
                          </button>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ EMAILS — Klaviyo-level 2060 UI ═══ */}
          {tab === "emails" && (
            <div className="space-y-6">
              {/* Hero header */}
              <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.08] to-transparent p-8 text-center shadow-[0_0_60px_rgba(59,130,246,0.05)]">
                <div className="text-6xl mb-4">📧</div>
                <h2 className="text-3xl font-black bg-gradient-to-r from-white via-blue-400 to-blue-500 bg-clip-text text-transparent mb-3">
                  Email Automation Running
                </h2>
                <p className="text-base text-t-text-muted max-w-2xl mx-auto">
                  Set it and forget it! Welcome emails, cart recovery, and follow-ups send automatically while you sleep. 💤
                </p>
              </div>

              {p?.emailFlow ? (
                <>
                  {/* Main flow stats card */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-black text-white">Active Flow</h3>
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                            p.emailFlow.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                              : "bg-white/[0.02] text-t-text-faint border border-white/10"
                          }`}>{p.emailFlow.status === "active" ? "🟢 Live" : "⏸️ Paused"}</span>
                        </div>
                        <p className="text-sm text-t-text-faint">Nurturing your audience on autopilot</p>
                      </div>
                      <Link href={`/emails/flows/${p.emailFlow.id}`}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#f5a623]/10 to-orange-500/10 border border-[#f5a623]/30 text-sm font-bold text-[#f5a623] hover:shadow-[0_10px_30px_rgba(245,166,35,0.2)] hover:scale-105 transition-all">
                        Edit Flow <Settings className="w-4 h-4" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-transparent border border-violet-500/20 p-5 text-center">
                        <Users className="w-5 h-5 text-violet-400 mx-auto mb-2" />
                        <p className="text-3xl font-black text-white">{p.emailFlow.enrolled}</p>
                        <p className="text-xs text-violet-400/60 mt-1">Subscribers</p>
                      </div>
                      <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 p-5 text-center">
                        <Send className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                        <p className="text-3xl font-black text-blue-400">{p.emailFlow.sent}</p>
                        <p className="text-xs text-blue-400/60 mt-1">Emails Sent</p>
                      </div>
                      <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 p-5 text-center">
                        <Eye className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                        <p className="text-3xl font-black text-emerald-400">—</p>
                        <p className="text-xs text-emerald-400/60 mt-1">Open Rate</p>
                      </div>
                    </div>
                  </div>

                  {/* Email features grid */}
                  <div>
                    <p className="text-xs font-black text-t-text-faint tracking-widest mb-4">EMAIL TOOLS</p>
                    <div className="grid grid-cols-2 gap-4">
                      <Link href="/websites/submissions" className="group rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/[0.05] to-transparent p-6 hover:border-emerald-500/30 hover:shadow-[0_20px_60px_rgba(16,185,129,0.1)] hover:scale-105 transition-all">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <FileText className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h4 className="text-lg font-black text-emerald-400 mb-2">Form Submissions</h4>
                        <p className="text-xs text-t-text-faint">Leads captured from your website</p>
                      </Link>

                      <Link href="/emails/contacts" className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 hover:border-white/20 hover:shadow-[0_20px_60px_rgba(255,255,255,0.05)] hover:scale-105 transition-all">
                        <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="text-lg font-black text-white mb-2">Contacts</h4>
                        <p className="text-xs text-t-text-faint">Manage your email list</p>
                      </Link>

                      <Link href="/emails/broadcasts" className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 hover:border-white/20 hover:shadow-[0_20px_60px_rgba(255,255,255,0.05)] hover:scale-105 transition-all">
                        <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Mail className="w-6 h-6 text-blue-400" />
                        </div>
                        <h4 className="text-lg font-black text-white mb-2">Broadcasts</h4>
                        <p className="text-xs text-t-text-faint">Send one-time campaigns</p>
                      </Link>

                      <Link href="/emails/analytics" className="group rounded-2xl border border-white/10 bg-gradient-to-br from-[#f5a623]/[0.05] to-transparent p-6 hover:border-[#f5a623]/30 hover:shadow-[0_20px_60px_rgba(245,166,35,0.1)] hover:scale-105 transition-all">
                        <div className="w-12 h-12 rounded-xl bg-[#f5a623]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <BarChart2 className="w-6 h-6 text-[#f5a623]" />
                        </div>
                        <h4 className="text-lg font-black text-[#f5a623] mb-2">Analytics</h4>
                        <p className="text-xs text-t-text-faint">Opens, clicks, and revenue</p>
                      </Link>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent p-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-5 animate-pulse shadow-[0_10px_40px_rgba(59,130,246,0.3)]">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">Building Your Email Flow...</h3>
                  <p className="text-sm text-t-text-muted max-w-md mx-auto">We're creating welcome emails, cart recovery, and follow-up sequences. They'll run automatically!</p>
                </div>
              )}
            </div>
          )}

          {/* ═══ ANALYTICS — Real-time insights, 2060 UI ═══ */}
          {tab === "analytics" && (
            <div className="space-y-6">
              {/* Hero header with 📊 emoji */}
              <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] to-transparent p-8 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h2 className="text-3xl font-black bg-gradient-to-r from-white via-violet-400 to-violet-500 bg-clip-text text-transparent mb-3">
                  Your Business in Real-Time
                </h2>
                <p className="text-base text-t-text-muted max-w-xl mx-auto">
                  Every number updates live. See exactly what's working across all channels. 🎯
                </p>
              </div>

              {/* Main metrics grid - 2x2 with gradients */}
              <div className="grid grid-cols-2 gap-4">
                {/* Site Views - Orange gradient */}
                <div className="rounded-2xl border border-[#f5a623]/20 bg-gradient-to-br from-[#f5a623]/[0.08] to-transparent p-6 text-center hover:scale-105 transition-transform shadow-[0_0_20px_rgba(245,166,35,0.1)]">
                  <Globe className="w-6 h-6 text-[#f5a623] mx-auto mb-3" />
                  <p className="text-4xl font-black text-white mb-2">{(p?.site?.views ?? 0).toLocaleString()}</p>
                  <p className="text-sm text-[#f5a623]/60">Site Views</p>
                </div>

                {/* Leads - Emerald gradient */}
                <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] to-transparent p-6 text-center hover:scale-105 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <Users className="w-6 h-6 text-emerald-400 mx-auto mb-3" />
                  <p className="text-4xl font-black text-white mb-2">{(p?.leadCount ?? 0).toLocaleString()}</p>
                  <p className="text-sm text-emerald-400/60">Leads</p>
                </div>

                {/* Emails Sent - Blue gradient */}
                <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.08] to-transparent p-6 text-center hover:scale-105 transition-transform shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                  <Mail className="w-6 h-6 text-blue-400 mx-auto mb-3" />
                  <p className="text-4xl font-black text-white mb-2">{(p?.emailFlow?.sent ?? 0).toLocaleString()}</p>
                  <p className="text-sm text-blue-400/60">Emails Sent</p>
                </div>

                {/* Revenue - Emerald gradient (emphasized) */}
                <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-6 text-center hover:scale-105 transition-transform shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <DollarSign className="w-6 h-6 text-emerald-400 mx-auto mb-3" />
                  <p className="text-4xl font-black text-emerald-400 mb-2">${(p?.revenue ?? 0).toLocaleString()}</p>
                  <p className="text-sm text-emerald-400/60">Total Revenue</p>
                </div>
              </div>

              {/* Performance indicator bar */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                    <p className="text-sm font-bold text-white">All Systems Running</p>
                  </div>
                  <span className="text-[10px] font-black uppercase px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Live
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-xs text-t-text-faint mb-1">Website</p>
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <p className="text-xs font-bold text-emerald-400">Online</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-t-text-faint mb-1">Email</p>
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <p className="text-xs font-bold text-emerald-400">Active</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-t-text-faint mb-1">Tracking</p>
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <p className="text-xs font-bold text-emerald-400">Recording</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full dashboard link - giant button */}
              <Link href="/dashboard"
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-violet-600 px-6 py-4 text-base font-black text-white hover:shadow-[0_20px_60px_rgba(139,92,246,0.3)] hover:scale-105 transition-all">
                <BarChart2 className="w-5 h-5" /> See Full Analytics Dashboard
              </Link>
            </div>
          )}

          {/* ═══ ORDERS — Stripe-level commerce, 2060 UI ═══ */}
          {tab === "orders" && (
            <div className="space-y-6">
              {/* Hero header with 💳 emoji */}
              <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] to-transparent p-8 text-center">
                <div className="text-6xl mb-4">💳</div>
                <h2 className="text-3xl font-black bg-gradient-to-r from-white via-emerald-400 to-emerald-500 bg-clip-text text-transparent mb-3">
                  {orders.length === 0 ? "Ready for Your First Sale" : `${orders.length} ${orders.length === 1 ? "Order" : "Orders"} Processed`}
                </h2>
                <p className="text-base text-t-text-muted max-w-xl mx-auto">
                  {orders.length === 0
                    ? "Stripe is connected. Payments will appear here automatically. 💰"
                    : "Every transaction tracked. Money in your account. Customer data captured. 🎉"
                  }
                </p>
              </div>

              {/* Revenue stat card - giant */}
              <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-8 text-center shadow-[0_0_40px_rgba(16,185,129,0.15)]">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <DollarSign className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-5xl font-black text-emerald-400 mb-2">
                  ${(orders.reduce((sum, o) => sum + o.amountCents, 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-emerald-400/60">Total Revenue (All-Time)</p>
                {orders.length > 0 && (
                  <p className="text-xs text-t-text-faint mt-3">
                    Average order: ${((orders.reduce((sum, o) => sum + o.amountCents, 0) / 100) / orders.length).toFixed(2)}
                  </p>
                )}
              </div>

              {/* Orders list or loading/empty state */}
              {ordersLoading ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-12 text-center">
                  <Loader2 className="w-10 h-10 text-[#f5a623] animate-spin mx-auto mb-4" />
                  <p className="text-base font-bold text-t-text-muted">Loading orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.05] to-transparent p-12 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-violet-500/10 border border-violet-500/20 mb-5">
                    <DollarSign className="w-10 h-10 text-violet-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">No Orders Yet</h3>
                  <p className="text-sm text-t-text-faint max-w-md mx-auto">
                    Orders will appear here once customers start purchasing. Your payment system is ready! 🚀
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <p className="text-xs font-black text-t-text-faint uppercase tracking-widest">Recent Transactions</p>
                    <p className="text-xs text-t-text-faint">{orders.length} total</p>
                  </div>
                  {orders.map(order => (
                    <div key={order.id}
                      className="group rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl px-6 py-5 hover:border-emerald-500/30 hover:bg-emerald-500/[0.03] transition-all">
                      <div className="flex items-center justify-between gap-4">
                        {/* Customer info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-base font-black text-white truncate">{order.customerName || order.customerEmail}</p>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0 ${
                              order.status === "paid" || order.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                                : order.status === "refunded"
                                ? "bg-red-500/10 text-red-400 border border-red-500/30"
                                : "bg-white/[0.05] text-t-text-faint border border-white/10"
                            }`}>
                              {order.status === "paid" || order.status === "completed" ? "✓ Paid" : order.status === "refunded" ? "↩ Refunded" : order.status}
                            </span>
                          </div>
                          {order.customerName && <p className="text-xs text-t-text-faint truncate">{order.customerEmail}</p>}
                          {order.productName && (
                            <p className="text-xs text-t-text-muted mt-1.5 flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-violet-400" />
                              {order.productName}
                            </p>
                          )}
                        </div>

                        {/* Amount + date */}
                        <div className="text-right shrink-0">
                          <p className="text-2xl font-black text-emerald-400 mb-1">
                            ${(order.amountCents / 100).toFixed(2)}
                          </p>
                          <p className="text-[10px] text-t-text-faint">
                            {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Full order management link - giant button */}
              <Link href="/orders"
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 text-base font-black text-white hover:shadow-[0_20px_60px_rgba(16,185,129,0.3)] hover:scale-105 transition-all">
                <DollarSign className="w-5 h-5" /> Full Order Management
              </Link>
            </div>
          )}

          {/* ═══ TOOLS — AI power features, 2060 UI ═══ */}
          {tab === "tools" && (
            <div className="space-y-6">
              {/* Hero header with 🤖 emoji */}
              <div className="rounded-2xl border border-[#f5a623]/20 bg-gradient-to-br from-[#f5a623]/[0.08] to-transparent p-8 text-center">
                <div className="text-6xl mb-4">🤖</div>
                <h2 className="text-3xl font-black bg-gradient-to-r from-white via-[#f5a623] to-orange-500 bg-clip-text text-transparent mb-3">
                  AI Power Tools
                </h2>
                <p className="text-base text-t-text-muted max-w-2xl mx-auto">
                  Click any tool to generate content instantly. No setup, no coding, just results. Every tool runs on AI. ⚡
                </p>
              </div>

              {/* Power features - bigger, bolder */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#f5a623]/30 to-transparent" />
                  <p className="text-xs font-black text-[#f5a623] tracking-widest">⚡ POWER FEATURES</p>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#f5a623]/30 to-transparent" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: "digital_twin", label: "Digital Twin", desc: "Simulate how your target customer reacts to headlines, offers, and prices before you spend money", icon: "🧬", action: "Test my funnel" },
                    { id: "business_cloner", label: "Clone Competitor", desc: "Paste a competitor URL — we analyze what works, find their weaknesses, and build you something better", icon: "🔬", action: "Clone a business" },
                    { id: "voice_agent", label: "Voice Agent", desc: "AI calls your leads automatically. 5x cheaper than Retell. Follows up, books appointments, closes", icon: "📱", action: "Set up voice" },
                    { id: "auto_optimizer", label: "Auto-Optimizer", desc: "Kills losing ads, doubles winners, generates new angles from winning DNA. Runs while you sleep", icon: "🤖", action: "Run optimization" },
                    { id: "revenue_leaks", label: "Revenue Leak Detector", desc: "Finds exactly where money is leaking in your funnel and calculates the dollar value of each leak", icon: "🔍", action: "Find leaks" },
                    { id: "social_poster", label: "Auto-Post Content", desc: "Generates and actually POSTS to Instagram, TikTok, Twitter, LinkedIn. Scheduling included", icon: "📲", action: "Set up posting" },
                  ].map(feat => (
                    <button key={feat.id} onClick={() => void runTool(feat.id, feat.label)}
                      disabled={toolLoading === feat.id}
                      className="group flex items-start gap-4 rounded-2xl border border-[#f5a623]/20 bg-gradient-to-br from-[#f5a623]/[0.05] to-transparent p-6 hover:border-[#f5a623]/40 hover:bg-[#f5a623]/[0.08] hover:scale-105 transition-all text-left disabled:opacity-50 shadow-[0_0_20px_rgba(245,166,35,0.05)] hover:shadow-[0_0_30px_rgba(245,166,35,0.15)]">
                      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f5a623]/10 to-transparent border border-[#f5a623]/30 shrink-0 text-3xl group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(245,166,35,0.1)]">
                        {feat.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-black text-white mb-1.5">{feat.label}</p>
                        <p className="text-xs text-t-text-faint leading-relaxed mb-3">{feat.desc}</p>
                        <div className="flex items-center gap-1.5 text-[#f5a623]">
                          <p className="text-xs font-bold">{feat.action}</p>
                          <span className="text-sm">→</span>
                        </div>
                      </div>
                      {toolLoading === feat.id && <Loader2 className="w-5 h-5 text-[#f5a623] animate-spin shrink-0 mt-2" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content tools - 3-column grid */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
                  <p className="text-xs font-black text-violet-400 tracking-widest">📝 CONTENT GENERATORS</p>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: "webinar", label: "Webinar", desc: "Evergreen funnel", icon: "🎥" },
                    { id: "vsl", label: "VSL Script", desc: "10-min sales video", icon: "📹" },
                    { id: "challenge", label: "Challenge", desc: "7-day funnel", icon: "🏆" },
                    { id: "case_study", label: "Case Study", desc: "Client proof", icon: "📊" },
                    { id: "blog_post", label: "Blog Post", desc: "SEO content", icon: "📝" },
                    { id: "offer_stack", label: "Offer Stack", desc: "No-brainer offer", icon: "💰" },
                    { id: "quiz_funnel", label: "Quiz Funnel", desc: "Segment visitors", icon: "❓" },
                    { id: "sales_script", label: "Sales Script", desc: "Close calls", icon: "📞" },
                    { id: "proposal", label: "Proposal", desc: "Win clients", icon: "📋" },
                    { id: "flash_sale", label: "Flash Sale", desc: "48hr promo", icon: "⚡" },
                    { id: "launch_sequence", label: "Launch", desc: "Product launch", icon: "🚀" },
                    { id: "influencer_outreach", label: "Influencer", desc: "Collab DMs", icon: "🤝" },
                    { id: "partnerships", label: "Partners", desc: "Find collabs", icon: "🔗" },
                    { id: "market_trends", label: "Trends", desc: "What's hot", icon: "📈" },
                    { id: "profit_margins", label: "Profit Calc", desc: "Real margins", icon: "🧮" },
                    { id: "valuation", label: "Valuation", desc: "Business worth", icon: "💎" },
                    { id: "brand_guide", label: "Brand Guide", desc: "Style guide", icon: "🎨" },
                    { id: "pitch_deck", label: "Pitch Deck", desc: "For investors", icon: "🎯" },
                  ].map(tool => (
                    <button key={tool.id} onClick={() => void runTool(tool.id, tool.label)}
                      disabled={toolLoading === tool.id}
                      className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl px-4 py-4 hover:border-violet-500/30 hover:bg-violet-500/[0.05] hover:scale-105 transition-all text-left disabled:opacity-50">
                      <span className="text-2xl group-hover:scale-110 transition-transform">{tool.icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-bold text-white block mb-0.5">{tool.label}</span>
                        <span className="text-[10px] text-t-text-faint">{tool.desc}</span>
                      </div>
                      {toolLoading === tool.id && <Loader2 className="w-4 h-4 text-violet-400 animate-spin shrink-0 mt-0.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tool result display */}
              {toolResult && (
                <div className="rounded-2xl border border-[#f5a623]/30 bg-gradient-to-br from-[#f5a623]/[0.08] to-transparent p-6 shadow-[0_0_30px_rgba(245,166,35,0.1)]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                      <p className="text-base font-black text-[#f5a623]">{toolResult.name}</p>
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(typeof toolResult.data === "string" ? toolResult.data : JSON.stringify(toolResult.data, null, 2)); setCopiedId("tr"); setTimeout(() => setCopiedId(null), 2000); }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f5a623]/10 border border-[#f5a623]/30 text-xs font-bold text-[#f5a623] hover:bg-[#f5a623]/20 hover:scale-105 transition-all shadow-[0_0_15px_rgba(245,166,35,0.1)]">
                      {copiedId === "tr" ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Result</>}
                    </button>
                  </div>
                  <div className="rounded-xl bg-black/20 border border-white/5 p-4 max-h-96 overflow-y-auto">
                    <pre className="text-xs text-white/90 whitespace-pre-wrap leading-relaxed font-mono">
                      {typeof toolResult.data === "string" ? toolResult.data : JSON.stringify(toolResult.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Marketplace CTA - emerald gradient */}
              <Link href="/marketplace/sell"
                className="group flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.08] to-transparent p-6 hover:border-emerald-500/50 hover:bg-emerald-500/[0.12] hover:scale-105 transition-all shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                <div>
                  <p className="text-lg font-black text-emerald-400 mb-1">💰 Sell on Marketplace</p>
                  <p className="text-xs text-t-text-faint">List your campaigns, emails, and funnels. Earn 80% of every sale. Passive income awaits.</p>
                </div>
                <ChevronRight className="w-6 h-6 text-emerald-400/40 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
