"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  Check, Globe, Zap, Mail, Play, Copy, ExternalLink,
  ArrowRight, Mountain, Loader2, ChevronDown,
} from "lucide-react";

type BuiltData = {
  id?: string;
  name: string;
  niche: string;
  siteUrl?: string;
  siteId?: string;
  campaignId?: string;
  emailFlowId?: string;
  projectId?: string;
  scriptCount: number;
  adCount: number;
  emailCount: number;
  topScript?: { hook: string; style: string };
};

export default function BuiltPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = use(params);
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const [data, setData] = useState<BuiltData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace("/sign-in");
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!isSignedIn) return;

    // Load the run data + deployment data
    Promise.allSettled([
      fetch(`/api/analyses/${runId}`).then(r => r.json()),
      fetch("/api/himalaya/projects").then(r => r.json()),
    ]).then(([runRes, projRes]) => {
      const run = runRes.status === "fulfilled" ? runRes.value : {};
      const projs = projRes.status === "fulfilled" ? projRes.value : {};

      const analysis = run.analysis;
      const projects = (projs.projects ?? []) as BuiltData[];

      // Find the project that matches this run
      const project = projects[0]; // Most recent

      setData({
        name: analysis?.title ?? project?.name ?? "Your Business",
        niche: (analysis?.decisionPacket as Record<string, string>)?.audience ?? project?.niche ?? "",
        siteUrl: (project as Record<string, unknown>)?.site ? `${window.location.origin}/s/${((project as Record<string, unknown>).site as Record<string, string>)?.slug}` : undefined,
        siteId: ((project as Record<string, unknown>)?.site as Record<string, string>)?.id,
        campaignId: ((project as Record<string, unknown>)?.campaign as Record<string, string>)?.id,
        emailFlowId: ((project as Record<string, unknown>)?.emailFlow as Record<string, string>)?.id,
        projectId: project?.id,
        scriptCount: ((project as Record<string, unknown>)?.scriptCount as number) ?? 10,
        adCount: ((project as Record<string, unknown>)?.campaign as Record<string, number>)?.variationCount ?? 0,
        emailCount: ((project as Record<string, unknown>)?.emailCount as number) ?? 5,
      });
    }).finally(() => setLoading(false));

    // Timeout: if data doesn't load in 15s, stop loading and show what we have
    const timeout = setTimeout(() => setLoading(false), 15000);
    return () => clearTimeout(timeout);
  }, [isSignedIn, runId]);

  if (!isLoaded || !isSignedIn) return null;

  if (loading) {
    return (
      <main className="min-h-screen bg-t-bg text-t-text">
        <AppNav />
        <div className="flex flex-col items-center justify-center min-h-[75vh] gap-4">
          <Loader2 className="w-6 h-6 text-[#f5a623] animate-spin" />
          <p className="text-sm text-t-text-muted">Loading your business...</p>
        </div>
      </main>
    );
  }

  const d = data ?? { name: "Your Business", niche: "", scriptCount: 0, adCount: 0, emailCount: 0 };
  const STEPS = [
    {
      title: "Your website is live",
      description: d?.siteUrl
        ? "We built and published your website. It's live right now — anyone with the link can see it."
        : "Your website was created. It needs to be published to go live.",
      icon: Globe,
      color: "text-emerald-400",
      done: !!d?.siteUrl,
    },
    {
      title: `${d?.scriptCount ?? 10} video scripts written`,
      description: "Word-for-word scripts you can record on your phone. Each one is 15-30 seconds. No writing needed — just read and record.",
      icon: Play,
      color: "text-[#e07850]",
      done: true,
    },
    {
      title: `Ad creatives generated`,
      description: "Ad images and copy for Facebook, Instagram, TikTok, and Google. All sized correctly for each platform.",
      icon: Zap,
      color: "text-[#f5a623]",
      done: (d?.adCount ?? 0) > 0,
    },
    {
      title: "Email automation active",
      description: "Welcome sequence, follow-up emails, and cart recovery — all set up and running. When someone fills out your form, they automatically get your emails.",
      icon: Mail,
      color: "text-blue-400",
      done: !!d?.emailFlowId,
    },
  ];

  return (
    <main className="min-h-screen bg-t-bg text-t-text">
      <AppNav />
      <div className="max-w-lg mx-auto px-4 sm:px-6 pb-20">

        {/* Header */}
        <div className="pt-10 pb-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f5a623] to-[#e07850] flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(245,166,35,0.2)]">
            <Check className="w-8 h-8 text-[#0c0a08]" />
          </div>
          <h1 className="text-2xl font-black">Your business is ready.</h1>
          <p className="text-sm text-t-text-muted mt-2">{d?.name}</p>
        </div>

        {/* What was built */}
        <div className="space-y-3 mb-6">
          {STEPS.map((s, i) => (
            <div key={i} className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition ${
              s.done ? "border-emerald-500/15 bg-emerald-500/[0.03]" : "border-t-border bg-t-bg-raised"
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                s.done ? "bg-emerald-500" : "bg-t-bg-card border border-t-border"
              }`}>
                {s.done ? <Check className="w-4 h-4 text-white" /> : <s.icon className={`w-4 h-4 ${s.color}`} />}
              </div>
              <div>
                <p className={`text-sm font-bold ${s.done ? "text-emerald-400" : ""}`}>{s.title}</p>
                <p className="text-xs text-t-text-faint mt-0.5">{s.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Site URL — the most important thing */}
        {d?.siteUrl && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 mb-6">
            <p className="text-[10px] font-black text-emerald-400/60 mb-2">YOUR LIVE SITE</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-t-bg-card border border-t-border px-3 py-2 text-xs font-mono text-t-text-muted truncate">{d.siteUrl}</code>
              <button onClick={() => { navigator.clipboard.writeText(d.siteUrl!); setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2000); }}
                className="px-3 py-2 rounded-lg bg-emerald-500 text-xs font-bold text-white hover:bg-emerald-400 transition">
                {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a href={d.siteUrl} target="_blank" rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg border border-emerald-500/20 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10 transition">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Your ONE next step */}
        <div className="rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/[0.04] p-5 mb-6">
          <p className="text-[10px] font-black text-[#f5a623] mb-2">YOUR NEXT STEP</p>
          <h3 className="text-base font-black mb-1">Review and approve everything</h3>
          <p className="text-xs text-t-text-muted mb-3">
            We already created your ads, scripts, emails, and website. Open your project,
            review what we built, and approve it. Edit anything you want to change — or just hit approve.
          </p>
          <div className="flex items-start gap-2 rounded-lg bg-[#f5a623]/[0.06] border border-[#f5a623]/10 px-3 py-2 mb-3">
            <span className="text-[10px]">💡</span>
            <p className="text-[11px] text-[#f5a623]/70">You don&apos;t need to create anything. We did it for you. Just review, approve, and share your link.</p>
          </div>
        </div>

        {/* Go to your business */}
        <div className="space-y-3">
          {d?.projectId && (
            <Link href={`/project/${d.projectId}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] px-4 py-3.5 text-sm font-bold text-[#0c0a08] hover:opacity-90 transition">
              <Mountain className="w-4 h-4" /> Open Your Business
            </Link>
          )}
          <Link href="/"
            className="flex items-center justify-center gap-2 rounded-xl border border-t-border px-4 py-3 text-sm font-bold text-t-text-muted hover:text-t-text transition">
            Go to Homepage <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </main>
  );
}
