"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  ArrowLeft, Globe, Zap, Mail, Users, ExternalLink, Copy, Check,
  Play, DollarSign, Shield, Mountain, Loader2, ChevronDown,
  BarChart2, Settings, ChevronRight, Wrench,
  Image as ImageIcon, Monitor, Smartphone, Eye, FileText,
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
  const NAV: { id: Tab; label: string; icon: React.ElementType; count?: string | number; done?: boolean }[] = [
    { id: "overview", label: "Overview", icon: Mountain },
    { id: "website", label: "Website", icon: Globe, done: sitePublished, count: sitePublished ? "Live" : "Draft" },
    { id: "ads", label: "Ads & Creatives", icon: Zap, count: p?.campaign?.variationCount ?? 0, done: hasAds },
    { id: "scripts", label: "Scripts", icon: Play, count: scripts.length, done: hasScripts },
    { id: "emails", label: "Emails", icon: Mail, count: p?.emailFlow?.sent ?? 0, done: hasEmails },
    { id: "analytics", label: "Analytics", icon: BarChart2, count: p?.site?.views ?? 0 },
    { id: "orders", label: "Orders", icon: DollarSign },
    { id: "tools", label: "Tools", icon: Wrench },
  ];

  return (
    <main className="min-h-screen bg-t-bg text-t-text flex">

      {/* ═══ LEFT SIDEBAR ═══ */}
      <aside className="w-[220px] shrink-0 border-r border-t-border h-screen sticky top-0 flex flex-col bg-t-bg">

        {/* Project header */}
        <div className="p-4 border-b border-t-border">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[10px] text-t-text-faint hover:text-t-text-muted transition mb-2">
            <ArrowLeft className="w-3 h-3" /> All Projects
          </Link>
          <h2 className="text-sm font-black truncate">{p?.name ?? "Business"}</h2>
          <p className="text-[10px] text-t-text-faint truncate mt-0.5">{p?.niche ?? ""}</p>

          {/* Status badges */}
          <div className="flex items-center gap-1.5 mt-2">
            {sitePublished && (
              <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Live</span>
            )}
            {hasAds && (
              <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20">{p?.campaign?.variationCount} Ads</span>
            )}
          </div>

          {/* Revenue */}
          {(p?.revenue ?? 0) > 0 && (
            <div className="mt-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-1.5 text-center">
              <p className="text-lg font-black text-emerald-400">${(p?.revenue ?? 0).toLocaleString()}</p>
              <p className="text-[8px] text-emerald-400/60">Revenue</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {NAV.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition ${
                tab === item.id
                  ? "bg-[#f5a623]/10 text-[#f5a623]"
                  : "text-t-text-faint hover:text-t-text-muted hover:bg-white/[0.03]"
              }`}>
              <div className="flex items-center gap-2.5">
                <item.icon className="w-4 h-4" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
              {item.count !== undefined && (
                <span className={`text-[10px] font-bold ${
                  tab === item.id ? "text-[#f5a623]" : item.done ? "text-emerald-400" : "text-t-text-faint"
                }`}>{item.count}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-t-border space-y-1">
          {siteUrl && (
            <button onClick={() => copy(siteUrl, "sidebar-url")}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] text-t-text-faint hover:text-t-text-muted transition">
              {copiedId === "sidebar-url" ? <><Check className="w-3 h-3" /> Copied URL</> : <><Copy className="w-3 h-3" /> Copy Site Link</>}
            </button>
          )}
          {siteUrl && (
            <a href={siteUrl} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] text-t-text-faint hover:text-t-text-muted transition">
              <ExternalLink className="w-3 h-3" /> Open Live Site
            </a>
          )}
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 overflow-y-auto min-h-screen">
        <div className={`mx-auto p-6 sm:p-8 ${tab === "website" ? "max-w-6xl" : "max-w-3xl"}`}>

          {/* ═══ OVERVIEW ═══ */}
          {tab === "overview" && (
            <div className="space-y-5">
              {/* Business context card */}
              <div className="rounded-2xl border border-[#f5a623]/15 bg-gradient-to-br from-[#f5a623]/[0.04] to-transparent p-6">
                <p className="text-[10px] font-black text-[#f5a623] tracking-widest mb-3">BUSINESS CONTEXT</p>
                <h1 className="text-xl font-black mb-2">{p?.name ?? "Your Business"}</h1>
                <p className="text-xs text-t-text-muted mb-4">Everything Himalaya built for this business. Review each section, approve or edit, then launch.</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "NICHE", val: p?.niche || "Not set" },
                    { label: "STAGE", val: pkg?.product ? "Active" : "Starting" },
                    { label: "GOAL", val: pkg?.math ? `$${pkg.math.targetDaily}/day` : "More leads" },
                    { label: "SYSTEMS", val: [hasSite && "Site", hasAds && "Ads", hasEmails && "Email", hasScripts && "Scripts"].filter(Boolean).join(", ") || "Building..." },
                  ].map(c => (
                    <div key={c.label} className="rounded-xl bg-t-bg-card border border-t-border p-3">
                      <p className="text-[9px] font-black text-t-text-faint tracking-wider mb-1">{c.label}</p>
                      <p className="text-xs font-bold truncate">{c.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { icon: Globe, val: p?.site?.views ?? 0, label: "Views", color: "text-[#e07850]" },
                  { icon: Zap, val: p?.campaign?.variationCount ?? 0, label: "Ads", color: "text-[#f5a623]" },
                  { icon: Mail, val: p?.emailFlow?.sent ?? 0, label: "Emails Sent", color: "text-blue-400" },
                  { icon: Users, val: p?.leadCount ?? 0, label: "Leads", color: "text-emerald-400" },
                ].map(m => (
                  <div key={m.label} className="rounded-xl bg-t-bg-card border border-t-border p-4 text-center">
                    <m.icon className={`w-4 h-4 ${m.color} mx-auto mb-1.5`} />
                    <p className="text-xl font-black">{m.val}</p>
                    <p className="text-[9px] text-t-text-faint">{m.label}</p>
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

          {/* ═══ WEBSITE — with live preview ═══ */}
          {tab === "website" && (
            <div className="space-y-4">
              {/* Header with preview controls */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black">Your Website</h2>
                  <p className="text-xs text-t-text-faint">{sitePublished ? `Published · ${p?.site?.views ?? 0} views` : hasSite ? "Built — ready to publish" : "Being generated..."}</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Device toggle */}
                  <div className="flex items-center rounded-lg border border-t-border overflow-hidden">
                    <button onClick={() => setPreviewMode("desktop")}
                      className={`px-2.5 py-1.5 transition ${previewMode === "desktop" ? "bg-[#f5a623]/10 text-[#f5a623]" : "text-t-text-faint hover:text-t-text-muted"}`}>
                      <Monitor className="w-4 h-4" />
                    </button>
                    <button onClick={() => setPreviewMode("mobile")}
                      className={`px-2.5 py-1.5 transition ${previewMode === "mobile" ? "bg-[#f5a623]/10 text-[#f5a623]" : "text-t-text-faint hover:text-t-text-muted"}`}>
                      <Smartphone className="w-4 h-4" />
                    </button>
                  </div>
                  {siteUrl && (
                    <a href={siteUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500 hover:bg-emerald-500/20 transition">
                      <ExternalLink className="w-3 h-3" /> View Live
                    </a>
                  )}
                  {p?.site && (
                    <Link href={`/websites/${p.site.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#f5a623]/20 text-[10px] font-bold text-[#f5a623] hover:bg-[#f5a623]/10 transition">
                      <Settings className="w-3 h-3" /> Edit
                    </Link>
                  )}
                </div>
              </div>

              {/* URL bar */}
              {siteUrl && (
                <div className="flex items-center gap-2 rounded-xl border border-t-border bg-t-bg-card px-4 py-2.5">
                  <Globe className="w-3.5 h-3.5 text-t-text-faint shrink-0" />
                  <code className="flex-1 text-xs font-mono text-t-text-muted truncate">{siteUrl}</code>
                  <button onClick={() => copy(siteUrl, "preview-url")}
                    className="text-[10px] font-bold text-t-text-faint hover:text-[#f5a623] transition">
                    {copiedId === "preview-url" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {/* Live site preview */}
              {sitePreviewUrl ? (
                <div className={`rounded-2xl border border-t-border bg-t-bg-card overflow-hidden transition-all duration-300 ${
                  previewMode === "mobile" ? "max-w-[375px] mx-auto" : ""
                }`}>
                  {/* Browser chrome */}
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-t-border bg-t-bg-raised">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/40" />
                    </div>
                    <div className="flex-1 rounded-md bg-t-bg-card border border-t-border px-3 py-1 text-[10px] text-t-text-faint font-mono truncate mx-4">
                      {sitePreviewUrl}
                    </div>
                    <Eye className="w-3.5 h-3.5 text-t-text-faint" />
                  </div>
                  {/* iframe */}
                  <div className={`relative ${previewMode === "mobile" ? "h-[667px]" : "h-[600px]"}`}>
                    <iframe
                      src={sitePreviewUrl}
                      className="w-full h-full border-0"
                      title="Site Preview"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-t-border bg-t-bg-raised p-12 text-center">
                  <Globe className="w-8 h-8 text-t-text-faint mx-auto mb-3" />
                  <p className="text-sm font-bold text-t-text-muted">Your site is being built...</p>
                  <p className="text-[10px] text-t-text-faint mt-1">Refresh in a moment to see the preview.</p>
                </div>
              )}
            </div>
          )}

          {/* ═══ ADS & CREATIVES ═══ */}
          {tab === "ads" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-black">Ads & Creatives</h2>
                <p className="text-xs text-t-text-faint">Pre-generated ad images and videos ready for your approval.</p>
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-3">
                <Link href={`/project/${id}/create`}
                  className="flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] px-5 py-4 text-sm font-bold text-[#0c0a08] hover:opacity-90 transition">
                  <ImageIcon className="w-5 h-5" /> Review Ad Images
                </Link>
                <Link href={`/project/${id}/video`}
                  className="flex items-center justify-center gap-2.5 rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/[0.04] px-5 py-4 text-sm font-bold text-[#f5a623] hover:bg-[#f5a623]/[0.08] transition">
                  <Play className="w-5 h-5" /> Review Videos
                </Link>
              </div>

              {/* Campaign status */}
              {p?.campaign ? (
                <div className="rounded-xl border border-t-border bg-t-bg-raised p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-black">{p.campaign.variationCount} Ad Creatives Ready</p>
                      <p className="text-[10px] text-t-text-faint mt-0.5">Generated automatically from your scripts and business data</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      p.campaign.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-t-bg-card text-t-text-faint border border-t-border"
                    }`}>{p.campaign.status}</span>
                  </div>
                  <Link href={`/campaigns/${p.campaign.id}`}
                    className="flex items-center gap-2 text-xs font-bold text-[#f5a623] hover:text-[#e07850] transition">
                    Open full campaign workspace <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                <div className="rounded-xl border border-t-border bg-t-bg-raised p-8 text-center">
                  <Loader2 className="w-6 h-6 text-[#f5a623] animate-spin mx-auto mb-3" />
                  <p className="text-sm font-bold text-t-text-muted">Generating your ad creatives...</p>
                  <p className="text-[10px] text-t-text-faint mt-1">This happens automatically. Refresh in a moment.</p>
                </div>
              )}
            </div>
          )}

          {/* ═══ SCRIPTS ═══ */}
          {tab === "scripts" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-black">Video Scripts</h2>
                <p className="text-xs text-t-text-faint">{scripts.length} scripts ready to record. Each is 15-30 seconds — just read it off your phone.</p>
              </div>

              {scripts.length === 0 ? (
                <div className="rounded-xl border border-t-border bg-t-bg-raised p-8 text-center">
                  <Play className="w-6 h-6 text-t-text-faint mx-auto mb-3" />
                  <p className="text-sm font-bold text-t-text-muted">Scripts are being generated...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scripts.map(script => (
                    <details key={script.id} className="group rounded-xl border border-t-border bg-t-bg-raised overflow-hidden">
                      <summary className="flex items-center justify-between cursor-pointer px-5 py-3.5 hover:bg-t-bg-card transition">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-t-bg-card border border-t-border flex items-center justify-center text-[10px] font-black text-t-text-faint">{script.id}</span>
                          {script.postFirst && <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20">POST FIRST</span>}
                          <span className="text-sm font-bold">{script.title}</span>
                          <span className="text-[10px] text-t-text-faint">{script.length}</span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-t-text-faint group-open:rotate-180 transition" />
                      </summary>
                      <div className="px-5 pb-5 space-y-3">
                        <div className="rounded-lg bg-[#f5a623]/[0.04] border border-[#f5a623]/10 p-3">
                          <p className="text-[9px] font-black text-[#f5a623] tracking-wider mb-1">HOOK</p>
                          <p className="text-sm font-bold">&ldquo;{script.hook}&rdquo;</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-t-text-faint tracking-wider mb-1">BODY</p>
                          <p className="text-xs text-t-text-muted leading-relaxed">{script.body}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-t-text-faint tracking-wider mb-1">CTA</p>
                          <p className="text-xs text-t-text-muted">&ldquo;{script.cta}&rdquo;</p>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-t-border">
                          <div className="flex flex-wrap gap-1">{script.hashtags.map(h => <span key={h} className="text-[9px] text-t-text-faint bg-t-bg-card px-1.5 py-0.5 rounded">#{h}</span>)}</div>
                          <button onClick={() => copy(`${script.hook}\n\n${script.body}\n\n${script.cta}`, `s-${script.id}`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f5a623]/10 border border-[#f5a623]/20 text-[10px] font-bold text-[#f5a623] hover:bg-[#f5a623]/20 transition">
                            {copiedId === `s-${script.id}` ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy Script</>}
                          </button>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ EMAILS ═══ */}
          {tab === "emails" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-black">Email Automation</h2>
                <p className="text-xs text-t-text-faint">Welcome sequences, cart recovery, and follow-ups — all running automatically.</p>
              </div>

              {p?.emailFlow ? (
                <>
                  <div className="rounded-xl border border-t-border bg-t-bg-raised p-5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-black">Email Flow</p>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        p.emailFlow.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-t-bg-card text-t-text-faint border border-t-border"
                      }`}>{p.emailFlow.status}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="rounded-lg bg-t-bg-card border border-t-border p-3 text-center">
                        <p className="text-xl font-black">{p.emailFlow.enrolled}</p>
                        <p className="text-[9px] text-t-text-faint">Enrolled</p>
                      </div>
                      <div className="rounded-lg bg-t-bg-card border border-t-border p-3 text-center">
                        <p className="text-xl font-black">{p.emailFlow.sent}</p>
                        <p className="text-[9px] text-t-text-faint">Sent</p>
                      </div>
                      <div className="rounded-lg bg-t-bg-card border border-t-border p-3 text-center">
                        <p className="text-xl font-black text-emerald-400">—</p>
                        <p className="text-[9px] text-t-text-faint">Opens</p>
                      </div>
                    </div>

                    <Link href={`/emails/flows/${p.emailFlow.id}`}
                      className="flex items-center gap-2 text-xs font-bold text-[#f5a623] hover:text-[#e07850] transition">
                      Open flow editor <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {/* Email & lead features */}
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/websites/submissions" className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-4 hover:border-emerald-500/25 transition">
                      <FileText className="w-4 h-4 text-emerald-400 mb-2" />
                      <p className="text-xs font-bold text-emerald-400">Submissions</p>
                      <p className="text-[10px] text-t-text-faint">Form leads from your site</p>
                    </Link>
                    <Link href="/emails/contacts" className="rounded-xl border border-t-border bg-t-bg-raised p-4 hover:border-[#f5a623]/15 transition">
                      <Users className="w-4 h-4 text-t-text-faint mb-2" />
                      <p className="text-xs font-bold">Contacts</p>
                      <p className="text-[10px] text-t-text-faint">Manage your list</p>
                    </Link>
                    <Link href="/emails/broadcasts" className="rounded-xl border border-t-border bg-t-bg-raised p-4 hover:border-[#f5a623]/15 transition">
                      <Mail className="w-4 h-4 text-t-text-faint mb-2" />
                      <p className="text-xs font-bold">Broadcasts</p>
                      <p className="text-[10px] text-t-text-faint">One-off sends</p>
                    </Link>
                    <Link href="/emails/analytics" className="rounded-xl border border-t-border bg-t-bg-raised p-4 hover:border-[#f5a623]/15 transition">
                      <BarChart2 className="w-4 h-4 text-t-text-faint mb-2" />
                      <p className="text-xs font-bold">Analytics</p>
                      <p className="text-[10px] text-t-text-faint">Opens, clicks, revenue</p>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-t-border bg-t-bg-raised p-8 text-center">
                  <Mail className="w-6 h-6 text-t-text-faint mx-auto mb-3" />
                  <p className="text-sm font-bold text-t-text-muted">Email automation is being set up...</p>
                  <p className="text-[10px] text-t-text-faint mt-1">Welcome, cart recovery, and follow-up sequences will appear here.</p>
                </div>
              )}
            </div>
          )}

          {/* ═══ ANALYTICS ═══ */}
          {tab === "analytics" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-black">Analytics</h2>
                <p className="text-xs text-t-text-faint">Track your business performance across all channels.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-t-border bg-t-bg-raised p-5 text-center">
                  <Globe className="w-5 h-5 text-[#e07850] mx-auto mb-2" />
                  <p className="text-3xl font-black">{p?.site?.views ?? 0}</p>
                  <p className="text-xs text-t-text-faint">Site Views</p>
                </div>
                <div className="rounded-xl border border-t-border bg-t-bg-raised p-5 text-center">
                  <Users className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                  <p className="text-3xl font-black">{p?.leadCount ?? 0}</p>
                  <p className="text-xs text-t-text-faint">Leads</p>
                </div>
                <div className="rounded-xl border border-t-border bg-t-bg-raised p-5 text-center">
                  <Mail className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                  <p className="text-3xl font-black">{p?.emailFlow?.sent ?? 0}</p>
                  <p className="text-xs text-t-text-faint">Emails Sent</p>
                </div>
                <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-5 text-center">
                  <DollarSign className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                  <p className="text-3xl font-black text-emerald-400">${(p?.revenue ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-emerald-400/60">Revenue</p>
                </div>
              </div>

              <Link href="/dashboard"
                className="flex items-center justify-center gap-2 rounded-xl border border-t-border bg-t-bg-raised px-4 py-3.5 text-sm font-bold text-t-text-muted hover:text-t-text hover:border-[#f5a623]/15 transition">
                <BarChart2 className="w-4 h-4" /> Full Dashboard
              </Link>
            </div>
          )}

          {/* ═══ ORDERS ═══ */}
          {tab === "orders" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-black">Orders</h2>
                <p className="text-xs text-t-text-faint">Track customer purchases and revenue.</p>
              </div>

              {/* Revenue stat card */}
              <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-5 text-center">
                <DollarSign className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                <p className="text-3xl font-black text-emerald-400">
                  ${(orders.reduce((sum, o) => sum + o.amountCents, 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-emerald-400/60">Total Revenue</p>
              </div>

              {ordersLoading ? (
                <div className="rounded-xl border border-t-border bg-t-bg-raised p-8 text-center">
                  <Loader2 className="w-6 h-6 text-[#f5a623] animate-spin mx-auto mb-3" />
                  <p className="text-sm font-bold text-t-text-muted">Loading orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="rounded-xl border border-t-border bg-t-bg-raised p-8 text-center">
                  <DollarSign className="w-6 h-6 text-t-text-faint mx-auto mb-3" />
                  <p className="text-sm font-bold text-t-text-muted">No orders yet</p>
                  <p className="text-[10px] text-t-text-faint mt-1">Orders will appear here once customers start purchasing.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {orders.map(order => (
                    <div key={order.id} className="rounded-xl border border-t-border bg-t-bg-raised px-5 py-3.5 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{order.customerName || order.customerEmail}</p>
                        {order.customerName && <p className="text-[10px] text-t-text-faint truncate">{order.customerEmail}</p>}
                        {order.productName && <p className="text-[10px] text-t-text-faint mt-0.5">{order.productName}</p>}
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-sm font-black">${(order.amountCents / 100).toFixed(2)}</span>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          order.status === "paid" || order.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : order.status === "refunded"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-t-bg-card text-t-text-faint border border-t-border"
                        }`}>{order.status}</span>
                        <span className="text-[10px] text-t-text-faint">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Link href="/orders"
                className="flex items-center justify-center gap-2 rounded-xl border border-t-border bg-t-bg-raised px-4 py-3.5 text-sm font-bold text-t-text-muted hover:text-t-text hover:border-[#f5a623]/15 transition">
                <DollarSign className="w-4 h-4" /> Full Order Management
              </Link>
            </div>
          )}

          {/* ═══ TOOLS ═══ */}
          {tab === "tools" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-black">Business Tools</h2>
                <p className="text-xs text-t-text-faint">AI-powered tools to grow faster. Click any tool to generate content instantly.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                    className="flex items-start gap-3 rounded-xl border border-t-border bg-t-bg-raised px-4 py-3.5 hover:border-[#f5a623]/20 hover:bg-[#f5a623]/[0.03] transition text-left disabled:opacity-50">
                    <span className="text-lg">{tool.icon}</span>
                    <div>
                      <span className="text-xs font-bold block">{tool.label}</span>
                      <span className="text-[10px] text-t-text-faint">{tool.desc}</span>
                    </div>
                    {toolLoading === tool.id && <Loader2 className="w-3 h-3 text-[#f5a623] animate-spin ml-auto mt-1" />}
                  </button>
                ))}
              </div>

              {toolResult && (
                <div className="rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/[0.03] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-black text-[#f5a623]">{toolResult.name}</p>
                    <button onClick={() => { navigator.clipboard.writeText(typeof toolResult.data === "string" ? toolResult.data : JSON.stringify(toolResult.data, null, 2)); setCopiedId("tr"); setTimeout(() => setCopiedId(null), 2000); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f5a623]/10 border border-[#f5a623]/20 text-[10px] font-bold text-[#f5a623] hover:bg-[#f5a623]/20 transition">
                      {copiedId === "tr" ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                    </button>
                  </div>
                  <pre className="text-[11px] text-t-text-muted whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                    {typeof toolResult.data === "string" ? toolResult.data : JSON.stringify(toolResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
