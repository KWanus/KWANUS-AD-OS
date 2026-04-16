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
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => { if (isLoaded && !isSignedIn) router.replace("/sign-in"); }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!isSignedIn) return;
    Promise.allSettled([
      fetch(`/api/himalaya/projects`).then(r => r.json()),
      fetch(`/api/himalaya/projects/${id}/package`).then(r => r.json()),
    ]).then(([pRes, pkgRes]) => {
      if (pRes.status === "fulfilled" && pRes.value.ok) {
        const found = (pRes.value.projects ?? []).find((p: { id: string }) => p.id === id);
        if (found) setProject(found);
      }
      if (pkgRes.status === "fulfilled" && pkgRes.value.ok && pkgRes.value.package) {
        setPkg(pkgRes.value.package as PackageData);
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

            {/* Scripts count */}
            {pkg.scriptCount && pkg.scriptCount > 0 && (
              <Section title={`${pkg.scriptCount} VIDEO SCRIPTS`} icon={Play}>
                <div className="rounded-xl bg-t-bg-card border border-t-border p-4 text-center">
                  <p className="text-sm text-t-text-muted mb-2">{pkg.scriptCount} word-for-word scripts ready to record</p>
                  <p className="text-xs text-t-text-faint">Open your campaign to see the full scripts with hooks, body, and CTAs</p>
                  {campaign && (
                    <Link href={`/campaigns/${campaign.id}`} className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-[#f5a623]">
                      View Scripts <Play className="w-3 h-3" />
                    </Link>
                  )}
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
