"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  ArrowLeft, Globe, Zap, Mail, Users, ExternalLink, Copy, Check,
  Play, DollarSign, Calendar, Shield, Mountain, Loader2, ChevronDown,
  BarChart2, Settings, Wrench, Target, Trash2, ChevronRight,
  Image as ImageIcon,
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

type Tab = "overview" | "scripts" | "ads" | "site" | "emails" | "tools" | "analytics";

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
    return <main className="min-h-screen bg-t-bg text-t-text"><AppNav /><div className="flex items-center justify-center min-h-[70vh]"><Loader2 className="w-6 h-6 text-t-text-faint animate-spin" /></div></main>;
  }

  const p = project;
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const siteUrl = p?.site?.published ? `${appUrl}/s/${p.site.slug}` : null;

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: Mountain },
    { id: "scripts", label: "Scripts", icon: Play },
    { id: "ads", label: "Ads", icon: Zap },
    { id: "site", label: "Site", icon: Globe },
    { id: "emails", label: "Emails", icon: Mail },
    { id: "tools", label: "Tools", icon: Wrench },
    { id: "analytics", label: "Analytics", icon: BarChart2 },
  ];

  return (
    <main className="min-h-screen bg-t-bg text-t-text">
      <AppNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">

        {/* Header */}
        <div className="pt-6 pb-3">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-t-text-faint hover:text-t-text-muted transition mb-3">
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black">{p?.name ?? "Business"}</h1>
              <p className="text-xs text-t-text-faint">{p?.niche ?? ""}</p>
            </div>
            <div className="flex items-center gap-2">
              {siteUrl && (
                <a href={siteUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500">
                  <ExternalLink className="w-3 h-3" /> Live
                </a>
              )}
              {p?.revenue ? <span className="text-lg font-black text-emerald-500">${p.revenue.toLocaleString()}</span> : null}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                tab === t.id ? "bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20" : "text-t-text-faint hover:text-t-text-muted hover:bg-t-bg-raised"
              }`}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══ OVERVIEW TAB ═══ */}
        {tab === "overview" && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: Globe, val: p?.site?.views ?? 0, label: "Views", color: "text-[#e07850]" },
                { icon: Zap, val: p?.campaign?.variationCount ?? 0, label: "Ads", color: "text-[#f5a623]" },
                { icon: Mail, val: p?.emailFlow?.sent ?? 0, label: "Emails", color: "text-blue-400" },
                { icon: Users, val: p?.leadCount ?? 0, label: "Leads", color: "text-emerald-400" },
              ].map(m => (
                <div key={m.label} className="rounded-xl bg-t-bg-card border border-t-border px-3 py-3 text-center">
                  <m.icon className={`w-3.5 h-3.5 ${m.color} mx-auto mb-1`} />
                  <p className="text-lg font-black">{m.val}</p>
                  <p className="text-[9px] text-t-text-faint">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Product + Math */}
            {pkg?.product && (
              <div className="rounded-xl border border-t-border bg-t-bg-raised p-4">
                <p className="text-[10px] font-black text-t-text-faint tracking-wider mb-2">YOUR PRODUCT</p>
                <h3 className="text-base font-black">{pkg.product.name}</h3>
                <p className="text-xs text-t-text-muted">{pkg.product.network} · {pkg.product.avgPayout}</p>
                <p className="text-xs text-t-text-faint mt-1">{pkg.product.targetAudience}</p>
              </div>
            )}

            {pkg?.math && (
              <div className="rounded-xl border border-[#f5a623]/15 bg-[#f5a623]/[0.03] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-black text-[#f5a623]">${pkg.math.targetDaily}/day</span>
                  <span className="text-xs text-t-text-faint">{pkg.math.salesNeeded} sales · ${pkg.math.dailyAdBudget}/day ads</span>
                </div>
                <p className="text-xs text-t-text-muted whitespace-pre-wrap">{pkg.math.explanation}</p>
              </div>
            )}

            {/* Timeline */}
            {pkg?.timeline && pkg.timeline.length > 0 && (
              <div className="rounded-xl border border-t-border bg-t-bg-raised p-4">
                <p className="text-[10px] font-black text-t-text-faint tracking-wider mb-2">TIMELINE</p>
                <div className="space-y-2">
                  {pkg.timeline.map((t, i) => (
                    <div key={i} className="flex gap-3 rounded-lg bg-t-bg-card border border-t-border p-2.5">
                      <div className="w-14 shrink-0">
                        <p className="text-[10px] font-black text-[#f5a623]">{t.week}</p>
                        <p className="text-[10px] font-bold text-emerald-500">{t.revenue}</p>
                      </div>
                      <p className="text-[11px] text-t-text-muted flex-1">{t.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ SCRIPTS TAB ═══ */}
        {tab === "scripts" && (
          <div className="space-y-3">
            {scripts.length === 0 ? (
              <div className="rounded-xl border border-t-border bg-t-bg-raised p-6 text-center">
                <Play className="w-6 h-6 text-t-text-faint mx-auto mb-2" />
                <p className="text-sm text-t-text-muted">No scripts yet. Build a business to generate them.</p>
              </div>
            ) : scripts.map(script => (
              <details key={script.id} className="group rounded-xl border border-t-border bg-t-bg-raised overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer px-4 py-3 hover:bg-t-bg-card transition">
                  <div className="flex items-center gap-3">
                    {script.postFirst && <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20">POST FIRST</span>}
                    <span className="text-xs font-bold">{script.title}</span>
                    <span className="text-[10px] text-t-text-faint">{script.length}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-t-text-faint group-open:rotate-180 transition" />
                </summary>
                <div className="px-4 pb-4 space-y-2">
                  <div><p className="text-[10px] font-bold text-[#f5a623] mb-0.5">HOOK</p><p className="text-sm font-bold">&ldquo;{script.hook}&rdquo;</p></div>
                  <div><p className="text-[10px] font-bold text-t-text-faint mb-0.5">BODY</p><p className="text-xs text-t-text-muted">{script.body}</p></div>
                  <div><p className="text-[10px] font-bold text-t-text-faint mb-0.5">CTA</p><p className="text-xs text-t-text-muted">&ldquo;{script.cta}&rdquo;</p></div>
                  <div className="flex items-center justify-between pt-2 border-t border-t-border">
                    <div className="flex gap-1">{script.hashtags.map(h => <span key={h} className="text-[9px] text-t-text-faint">#{h}</span>)}</div>
                    <button onClick={() => copy(`${script.hook}\n\n${script.body}\n\n${script.cta}`, `s-${script.id}`)}
                      className="text-[10px] font-bold text-[#f5a623]/60 hover:text-[#f5a623] transition flex items-center gap-1">
                      {copiedId === `s-${script.id}` ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                    </button>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}

        {/* ═══ ADS TAB ═══ */}
        {tab === "ads" && (
          <div className="space-y-4">
            {/* Create new ad */}
            <Link href={`/project/${id}/create`}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] px-4 py-3.5 text-sm font-bold text-[#0c0a08] hover:opacity-90 transition">
              <ImageIcon className="w-4 h-4" /> Create New Ad Image
            </Link>

            {p?.campaign ? (
              <>
                <div className="rounded-xl border border-t-border bg-t-bg-raised p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-black">{p.campaign.variationCount} Ad Creatives</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${p.campaign.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-t-bg-card text-t-text-faint"}`}>{p.campaign.status}</span>
                  </div>
                  <Link href={`/campaigns/${p.campaign.id}`} className="flex items-center gap-1.5 text-xs font-bold text-[#f5a623] hover:text-[#e07850] transition">
                    Open full campaign editor <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="rounded-xl border border-t-border bg-t-bg-raised p-4 text-center">
                  <p className="text-xs text-t-text-faint mb-2">Quick actions</p>
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => void runTool("market_trends", "Market Trends")} disabled={toolLoading === "market_trends"}
                      className="px-3 py-2 rounded-lg border border-t-border text-xs font-bold text-t-text-muted hover:border-[#f5a623]/20 transition">
                      {toolLoading === "market_trends" ? <Loader2 className="w-3 h-3 animate-spin" /> : "Trending Angles"}
                    </button>
                    <button onClick={() => void runTool("flash_sale", "Flash Sale")} disabled={toolLoading === "flash_sale"}
                      className="px-3 py-2 rounded-lg border border-t-border text-xs font-bold text-t-text-muted hover:border-[#f5a623]/20 transition">
                      {toolLoading === "flash_sale" ? <Loader2 className="w-3 h-3 animate-spin" /> : "Flash Sale"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-t-border bg-t-bg-raised p-6 text-center">
                <Zap className="w-6 h-6 text-t-text-faint mx-auto mb-2" />
                <p className="text-sm text-t-text-muted">No campaign yet.</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ SITE TAB ═══ */}
        {tab === "site" && (
          <div className="space-y-4">
            {p?.site ? (
              <>
                <div className="rounded-xl border border-t-border bg-t-bg-raised p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-black">Your Website</p>
                      <p className="text-xs text-t-text-faint">{p.site.views} views · {p.site.published ? "Published" : "Draft"}</p>
                    </div>
                    {siteUrl && (
                      <a href={siteUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500">
                        <ExternalLink className="w-3 h-3" /> View Live
                      </a>
                    )}
                  </div>
                  {siteUrl && (
                    <div className="flex items-center gap-2 mt-2">
                      <code className="flex-1 rounded-lg bg-t-bg-card border border-t-border px-3 py-2 text-xs font-mono text-t-text-muted truncate">{siteUrl}</code>
                      <button onClick={() => copy(siteUrl, "url")}
                        className="px-3 py-2 rounded-lg border border-t-border text-xs font-bold text-t-text-muted hover:text-t-text transition">
                        {copiedId === "url" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  )}
                </div>
                <Link href={`/websites/${p.site.id}`} className="flex items-center justify-center gap-2 rounded-xl border border-t-border bg-t-bg-raised px-4 py-3 text-sm font-bold text-t-text-muted hover:text-t-text hover:border-[#f5a623]/15 transition">
                  <Settings className="w-4 h-4" /> Open Site Editor
                </Link>
              </>
            ) : (
              <div className="rounded-xl border border-t-border bg-t-bg-raised p-6 text-center">
                <Globe className="w-6 h-6 text-t-text-faint mx-auto mb-2" />
                <p className="text-sm text-t-text-muted">No site yet.</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ EMAILS TAB ═══ */}
        {tab === "emails" && (
          <div className="space-y-4">
            {p?.emailFlow ? (
              <>
                <div className="rounded-xl border border-t-border bg-t-bg-raised p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-black">Email Automation</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${p.emailFlow.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-t-bg-card text-t-text-faint"}`}>{p.emailFlow.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-t-bg-card border border-t-border p-2 text-center">
                      <p className="text-lg font-black">{p.emailFlow.enrolled}</p>
                      <p className="text-[9px] text-t-text-faint">Enrolled</p>
                    </div>
                    <div className="rounded-lg bg-t-bg-card border border-t-border p-2 text-center">
                      <p className="text-lg font-black">{p.emailFlow.sent}</p>
                      <p className="text-[9px] text-t-text-faint">Sent</p>
                    </div>
                  </div>
                </div>
                <Link href={`/emails/flows/${p.emailFlow.id}`} className="flex items-center justify-center gap-2 rounded-xl border border-t-border bg-t-bg-raised px-4 py-3 text-sm font-bold text-t-text-muted hover:text-t-text hover:border-[#f5a623]/15 transition">
                  <Settings className="w-4 h-4" /> Open Flow Editor
                </Link>
              </>
            ) : (
              <div className="rounded-xl border border-t-border bg-t-bg-raised p-6 text-center">
                <Mail className="w-6 h-6 text-t-text-faint mx-auto mb-2" />
                <p className="text-sm text-t-text-muted">No email flows yet.</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ TOOLS TAB ═══ */}
        {tab === "tools" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: "webinar", label: "Webinar", desc: "Evergreen funnel" },
                { id: "vsl", label: "VSL Script", desc: "10-min sales video" },
                { id: "challenge", label: "Challenge", desc: "7-day funnel" },
                { id: "case_study", label: "Case Study", desc: "Client proof" },
                { id: "blog_post", label: "Blog Post", desc: "SEO content" },
                { id: "offer_stack", label: "Offer Stack", desc: "No-brainer offer" },
                { id: "quiz_funnel", label: "Quiz Funnel", desc: "Segment visitors" },
                { id: "sales_script", label: "Sales Script", desc: "Close calls" },
                { id: "proposal", label: "Proposal", desc: "Win clients" },
                { id: "flash_sale", label: "Flash Sale", desc: "48hr promo" },
                { id: "launch_sequence", label: "Launch", desc: "Product launch" },
                { id: "influencer_outreach", label: "Influencer", desc: "Collab DMs" },
                { id: "partnerships", label: "Partners", desc: "Find collabs" },
                { id: "market_trends", label: "Trends", desc: "What's hot" },
                { id: "profit_margins", label: "Profit Calc", desc: "Real margins" },
                { id: "valuation", label: "Valuation", desc: "Business worth" },
                { id: "brand_guide", label: "Brand Guide", desc: "Style guide" },
                { id: "pitch_deck", label: "Pitch Deck", desc: "For investors" },
              ].map(tool => (
                <button key={tool.id} onClick={() => void runTool(tool.id, tool.label)}
                  disabled={toolLoading === tool.id}
                  className="flex flex-col items-start rounded-xl border border-t-border bg-t-bg-raised px-3 py-2.5 hover:border-[#f5a623]/20 hover:bg-[#f5a623]/[0.03] transition text-left disabled:opacity-50">
                  <span className="text-xs font-bold">{tool.label}</span>
                  <span className="text-[10px] text-t-text-faint">{tool.desc}</span>
                  {toolLoading === tool.id && <Loader2 className="w-3 h-3 text-[#f5a623] animate-spin mt-1" />}
                </button>
              ))}
            </div>

            {toolResult && (
              <div className="rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/[0.03] p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-black text-[#f5a623]">{toolResult.name}</p>
                  <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(toolResult.data, null, 2)); setCopiedId("tr"); setTimeout(() => setCopiedId(null), 2000); }}
                    className="text-[10px] font-bold text-t-text-faint hover:text-t-text transition flex items-center gap-1">
                    {copiedId === "tr" ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
                <pre className="text-[11px] text-t-text-muted whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                  {typeof toolResult.data === "string" ? toolResult.data : JSON.stringify(toolResult.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* ═══ ANALYTICS TAB ═══ */}
        {tab === "analytics" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-t-border bg-t-bg-raised p-4 text-center">
                <Globe className="w-5 h-5 text-[#e07850] mx-auto mb-1" />
                <p className="text-2xl font-black">{p?.site?.views ?? 0}</p>
                <p className="text-xs text-t-text-faint">Site Views</p>
              </div>
              <div className="rounded-xl border border-t-border bg-t-bg-raised p-4 text-center">
                <Users className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-2xl font-black">{p?.leadCount ?? 0}</p>
                <p className="text-xs text-t-text-faint">Leads</p>
              </div>
              <div className="rounded-xl border border-t-border bg-t-bg-raised p-4 text-center">
                <Mail className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <p className="text-2xl font-black">{p?.emailFlow?.sent ?? 0}</p>
                <p className="text-xs text-t-text-faint">Emails Sent</p>
              </div>
              <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-4 text-center">
                <DollarSign className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-2xl font-black text-emerald-400">${(p?.revenue ?? 0).toLocaleString()}</p>
                <p className="text-xs text-emerald-400/60">Revenue</p>
              </div>
            </div>

            <Link href="/dashboard" className="flex items-center justify-center gap-2 rounded-xl border border-t-border bg-t-bg-raised px-4 py-3 text-sm font-bold text-t-text-muted hover:text-t-text transition">
              <BarChart2 className="w-4 h-4" /> Full Dashboard
            </Link>
          </div>
        )}

        {/* Compliance */}
        {tab === "overview" && pkg?.compliance && pkg.compliance.length > 0 && (
          <div className="mt-4 rounded-xl border border-t-border bg-t-bg-raised p-4">
            <p className="text-[10px] font-black text-t-text-faint tracking-wider mb-2">COMPLIANCE</p>
            <div className="space-y-1">{pkg.compliance.map((r, i) => (
              <div key={i} className="flex items-start gap-2"><Shield className="w-3 h-3 text-red-400 shrink-0 mt-0.5" /><p className="text-[11px] text-t-text-faint">{r}</p></div>
            ))}</div>
          </div>
        )}
      </div>
    </main>
  );
}
