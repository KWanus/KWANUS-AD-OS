"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  ArrowLeft, Globe, Zap, Mail, Users, ExternalLink, Copy, Check,
  Play, DollarSign, Calendar, Shield, Mountain, Loader2, ChevronDown,
} from "lucide-react";

type PackageData = {
  product?: { name: string; avgPayout: string; targetAudience: string; whyItWins: string; network: string };
  math?: { explanation: string; targetDaily: number; salesNeeded: number; dailyAdBudget: number };
  scriptCount?: number;
  emailCount?: number;
  timeline?: { week: string; revenue: string; action: string }[];
  compliance?: string[];
};

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [project, setProject] = useState<Record<string, unknown> | null>(null);
  const [pkg, setPkg] = useState<PackageData | null>(null);
  const [scripts, setScripts] = useState<{ id: number; title: string; style: string; length: string; hook: string; body: string; cta: string; caption: string; hashtags: string[]; postFirst: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toolResult, setToolResult] = useState<{ name: string; data: unknown } | null>(null);
  const [toolLoading, setToolLoading] = useState<string | null>(null);

  useEffect(() => { if (isLoaded && !isSignedIn) router.replace("/sign-in"); }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!isSignedIn) return;
    Promise.allSettled([
      fetch(`/api/himalaya/projects`).then(r => r.json()),
      fetch(`/api/himalaya/projects/${id}/package`).then(r => r.json()),
      fetch(`/api/himalaya/projects/${id}/scripts`).then(r => r.json()),
    ]).then(([pRes, pkgRes, sRes]) => {
      if (pRes.status === "fulfilled" && pRes.value.ok) {
        const found = (pRes.value.projects ?? []).find((p: { id: string }) => p.id === id);
        if (found) setProject(found);
      }
      if (pkgRes.status === "fulfilled" && pkgRes.value.ok && pkgRes.value.package) {
        setPkg(pkgRes.value.package as PackageData);
      }
      if (sRes.status === "fulfilled" && sRes.value.ok) {
        setScripts(sRes.value.scripts ?? []);
      }
    }).finally(() => setLoading(false));
  }, [isSignedIn, id]);

  function copyText(text: string, copyId: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(copyId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (!isLoaded || !isSignedIn) return null;

  if (loading) {
    return (
      <main className="min-h-screen bg-t-bg text-t-text">
        <AppNav />
        <div className="flex items-center justify-center min-h-[70vh]">
          <Loader2 className="w-6 h-6 text-t-text-faint animate-spin" />
        </div>
      </main>
    );
  }

  const p = project as Record<string, unknown> | null;
  const site = p?.site as { id: string; slug: string; published: boolean; views: number } | undefined;
  const campaign = p?.campaign as { id: string; variationCount: number } | undefined;
  const emailFlow = p?.emailFlow as { id: string; sent: number } | undefined;

  return (
    <main className="min-h-screen bg-t-bg text-t-text">
      <AppNav />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">

        {/* Back + Title */}
        <div className="pt-8 pb-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-t-text-faint hover:text-t-text-muted transition mb-4">
            <ArrowLeft className="w-3 h-3" /> Back to businesses
          </Link>
          <h1 className="text-2xl font-black">{(p?.name as string) ?? "Business"}</h1>
          <p className="text-sm text-t-text-muted">{(p?.niche as string) ?? ""}</p>
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap gap-2 mb-6">
          {site?.published && (
            <a href={`${typeof window !== "undefined" ? window.location.origin : ""}/s/${site.slug}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-500">
              <ExternalLink className="w-3 h-3" /> Live Site
            </a>
          )}
          {site && !site.published && (
            <Link href={`/websites/${site.id}`} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-t-bg-card border border-t-border text-xs font-bold text-t-text-muted">
              <Globe className="w-3 h-3" /> Edit Site
            </Link>
          )}
          {campaign && (
            <Link href={`/campaigns/${campaign.id}`} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-t-bg-card border border-t-border text-xs font-bold text-t-text-muted">
              <Zap className="w-3 h-3" /> Ads ({campaign.variationCount})
            </Link>
          )}
          {emailFlow && (
            <Link href={`/emails/flows/${emailFlow.id}`} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-t-bg-card border border-t-border text-xs font-bold text-t-text-muted">
              <Mail className="w-3 h-3" /> Emails ({emailFlow.sent} sent)
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { icon: Globe, val: site?.views ?? 0, label: "Views", color: "text-[#e07850]" },
            { icon: Zap, val: campaign?.variationCount ?? 0, label: "Ads", color: "text-[#f5a623]" },
            { icon: Mail, val: emailFlow?.sent ?? 0, label: "Emails", color: "text-blue-400" },
            { icon: Users, val: (p?.leadCount as number) ?? 0, label: "Leads", color: "text-emerald-400" },
          ].map(m => (
            <div key={m.label} className="rounded-xl bg-t-bg-card border border-t-border px-3 py-3 text-center">
              <m.icon className={`w-3.5 h-3.5 ${m.color} mx-auto mb-1`} />
              <p className="text-lg font-black">{m.val}</p>
              <p className="text-[9px] text-t-text-faint">{m.label}</p>
            </div>
          ))}
        </div>

        {/* ── Campaign Package ── */}
        {pkg && (
          <>
            {/* Product */}
            {pkg.product && (
              <Section title="YOUR PRODUCT" icon={DollarSign}>
                <div className="rounded-xl bg-t-bg-card border border-t-border p-4">
                  <h3 className="text-base font-black mb-1">{pkg.product.name}</h3>
                  <p className="text-xs text-t-text-muted mb-2">{pkg.product.network} · {pkg.product.avgPayout}</p>
                  <p className="text-sm text-t-text-muted mb-2">{pkg.product.targetAudience}</p>
                  <p className="text-xs text-t-text-faint">{pkg.product.whyItWins}</p>
                </div>
              </Section>
            )}

            {/* Math */}
            {pkg.math && (
              <Section title="THE MATH" icon={DollarSign}>
                <div className="rounded-xl bg-t-bg-card border border-t-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-black text-[#f5a623]">${pkg.math.targetDaily}/day</span>
                    <span className="text-xs text-t-text-faint">{pkg.math.salesNeeded} sales needed · ${pkg.math.dailyAdBudget}/day ads</span>
                  </div>
                  <p className="text-xs text-t-text-muted whitespace-pre-wrap leading-relaxed">{pkg.math.explanation}</p>
                </div>
              </Section>
            )}

            {/* Scripts — full word-for-word */}
            {scripts.length > 0 && (
              <Section title={`${scripts.length} VIDEO SCRIPTS`} icon={Play}>
                <div className="space-y-3">
                  {scripts.map((script) => (
                    <details key={script.id} className="group rounded-xl border border-t-border bg-t-bg-card overflow-hidden">
                      <summary className="flex items-center justify-between cursor-pointer px-4 py-3 hover:bg-t-bg-raised transition">
                        <div className="flex items-center gap-3">
                          {script.postFirst && (
                            <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20">POST FIRST</span>
                          )}
                          <span className="text-xs font-bold text-t-text">{script.title}</span>
                          <span className="text-[10px] text-t-text-faint">{script.length}</span>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-t-text-faint group-open:rotate-180 transition" />
                      </summary>
                      <div className="px-4 pb-4 space-y-3">
                        <div>
                          <p className="text-[10px] font-bold text-[#f5a623] mb-1">HOOK (first 3 seconds)</p>
                          <p className="text-sm text-t-text font-bold leading-relaxed">&ldquo;{script.hook}&rdquo;</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-t-text-faint mb-1">BODY</p>
                          <p className="text-xs text-t-text-muted leading-relaxed">{script.body}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-t-text-faint mb-1">CTA</p>
                          <p className="text-xs text-t-text-muted">&ldquo;{script.cta}&rdquo;</p>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-t-border">
                          <div className="flex flex-wrap gap-1">
                            {script.hashtags.map(h => (
                              <span key={h} className="text-[9px] text-t-text-faint">#{h}</span>
                            ))}
                          </div>
                          <button onClick={() => copyText(`${script.hook}\n\n${script.body}\n\n${script.cta}`, `script-${script.id}`)}
                            className="flex items-center gap-1 text-[10px] font-bold text-[#f5a623]/60 hover:text-[#f5a623] transition">
                            {copiedId === `script-${script.id}` ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy Script</>}
                          </button>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </Section>
            )}

            {/* Timeline */}
            {pkg.timeline && pkg.timeline.length > 0 && (
              <Section title="YOUR TIMELINE" icon={Calendar}>
                <div className="space-y-2">
                  {pkg.timeline.map((t, i) => (
                    <div key={i} className="flex gap-3 rounded-xl bg-t-bg-card border border-t-border p-3">
                      <div className="w-16 shrink-0">
                        <p className="text-xs font-black text-[#f5a623]">{t.week}</p>
                        <p className="text-xs font-bold text-emerald-500">{t.revenue}</p>
                      </div>
                      <p className="text-xs text-t-text-muted flex-1">{t.action}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Compliance */}
            {pkg.compliance && pkg.compliance.length > 0 && (
              <Section title="COMPLIANCE RULES" icon={Shield}>
                <div className="rounded-xl bg-t-bg-card border border-t-border p-4">
                  <div className="space-y-1.5">
                    {pkg.compliance.map((rule, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Shield className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-t-text-muted">{rule}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Section>
            )}
          </>
        )}

        {/* ── Growth Tools ── */}
        <Section title="GROWTH TOOLS" icon={Zap}>
          <p className="text-xs text-t-text-faint mb-3">Click any tool to generate it for this business</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: "webinar", label: "Webinar System", desc: "Evergreen webinar funnel" },
              { id: "vsl", label: "Video Sales Letter", desc: "10-min conversion script" },
              { id: "challenge", label: "Challenge Funnel", desc: "7-day challenge" },
              { id: "case_study", label: "Case Study", desc: "From client results" },
              { id: "blog_post", label: "SEO Blog Post", desc: "Rank on Google" },
              { id: "offer_stack", label: "Offer Stack", desc: "No-brainer offer" },
              { id: "quiz_funnel", label: "Quiz Funnel", desc: "Segment visitors" },
              { id: "sales_script", label: "Sales Script", desc: "Close on calls" },
              { id: "sop", label: "SOP Generator", desc: "Systemize processes" },
              { id: "proposal", label: "Proposal", desc: "Win clients" },
              { id: "flash_sale", label: "Flash Sale", desc: "48-hour promotion" },
              { id: "launch_sequence", label: "Launch Sequence", desc: "Pre-launch → launch" },
              { id: "influencer_outreach", label: "Influencer Outreach", desc: "Collab templates" },
              { id: "partnerships", label: "Find Partners", desc: "Collab opportunities" },
              { id: "market_trends", label: "Market Trends", desc: "What's hot now" },
              { id: "profit_margins", label: "Profit Calculator", desc: "Your real margins" },
              { id: "cash_flow", label: "Cash Flow Forecast", desc: "12-month projection" },
              { id: "valuation", label: "Business Value", desc: "What you're worth" },
              { id: "brand_guide", label: "Brand Guide", desc: "Colors, voice, style" },
              { id: "pitch_deck", label: "Pitch Deck", desc: "For investors" },
            ].map(tool => (
              <button
                key={tool.id}
                onClick={async () => {
                  setToolLoading(tool.id);
                  setToolResult(null);
                  const niche = (p?.niche as string) ?? "business";
                  const name = (p?.name as string) ?? "My Business";
                  try {
                    const res = await fetch("/api/himalaya/tools", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ tool: tool.id, params: { niche, businessName: name, offer: name, audience: niche } }),
                    });
                    const data = await res.json();
                    if (data.ok) {
                      setToolResult({ name: tool.label, data: data.result });
                    }
                  } catch { /* ignore */ }
                  setToolLoading(null);
                }}
                className="flex flex-col items-start rounded-xl border border-t-border bg-t-bg-card px-3 py-2.5 hover:border-[#f5a623]/20 hover:bg-[#f5a623]/[0.03] transition text-left"
              >
                <span className="text-xs font-bold text-t-text">{tool.label}</span>
                <span className="text-[10px] text-t-text-faint">{tool.desc}</span>
                {toolLoading === tool.id && <Loader2 className="w-3 h-3 text-[#f5a623] animate-spin mt-1" />}
              </button>
            ))}
          </div>

          {/* Tool result display */}
          {toolResult && (
            <div className="mt-4 rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/[0.03] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-black text-[#f5a623]">{toolResult.name} — Generated</p>
                <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(toolResult.data, null, 2)); setCopiedId("tool-result"); setTimeout(() => setCopiedId(null), 2000); }}
                  className="flex items-center gap-1 text-[10px] font-bold text-t-text-faint hover:text-t-text transition">
                  {copiedId === "tool-result" ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                </button>
              </div>
              <pre className="text-[11px] text-t-text-muted whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                {typeof toolResult.data === "string" ? toolResult.data : JSON.stringify(toolResult.data, null, 2)}
              </pre>
            </div>
          )}
        </Section>

        {/* No package yet */}
        {!pkg && !loading && (
          <div className="rounded-xl border border-t-border bg-t-bg-raised p-6 text-center">
            <Mountain className="w-8 h-8 text-t-text-faint mx-auto mb-3" />
            <p className="text-sm text-t-text-muted">Campaign package is generating...</p>
            <p className="text-xs text-t-text-faint mt-1">This includes scripts, emails, math, and timeline. Refresh in a moment.</p>
          </div>
        )}
      </div>
    </main>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-t-text-faint" />
        <p className="text-[10px] font-black text-t-text-faint tracking-wider">{title}</p>
      </div>
      {children}
    </div>
  );
}
