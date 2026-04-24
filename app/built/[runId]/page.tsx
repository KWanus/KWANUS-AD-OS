"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  Check, Globe, Zap, Mail, Play, Copy, ExternalLink,
  ArrowRight, Mountain, Loader2, ChevronDown, Crown,
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
  const [bizType, setBizType] = useState<string>("");

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

    fetch("/api/business-profile").then(r => r.json()).then(data => {
      if (data.ok) setBizType(data.profile?.businessType ?? "");
    }).catch(() => {});

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
        {(() => {
          const NEXT_STEPS: Record<string, { title: string; desc: string; cta: string; href: string }> = {
            agency: {
              title: "Set up your outreach pipeline",
              desc: "Find 50 businesses in your niche, generate personalized cold emails, and start sending. Your first client is 500 emails away.",
              cta: "Open Outreach Pipeline",
              href: "/outreach",
            },
            affiliate: {
              title: "Share your site link with 5 people",
              desc: "Your site is live with your affiliate links. Text or DM this link to 5 people you know. Post it on social media with your scripts.",
              cta: "Copy Site Link",
              href: "#",
            },
            consultant_coach: {
              title: "Book your first discovery call",
              desc: "Your booking page is live. Share it in your network — DMs, LinkedIn, email signature. One call = one client.",
              cta: "Share Booking Link",
              href: "/bookings",
            },
            dropship: {
              title: "Launch your first ad",
              desc: "Your store and products are ready. Launch a $20/day ad using the creatives we generated. Test 3 audiences.",
              cta: "Review Ad Creatives",
              href: d?.projectId ? `/project/${d.projectId}` : "/",
            },
            local_service: {
              title: "Get listed and start collecting reviews",
              desc: "Share your site with existing customers. Ask 5 happy clients for Google reviews. Reviews = free traffic.",
              cta: "Open Your Site",
              href: d?.siteUrl ?? "/",
            },
            content_creator: {
              title: "Record and post your first 3 videos",
              desc: "Your scripts are ready — just read them off your phone. 15 seconds each. Post to TikTok + Instagram Reels.",
              cta: "View Scripts",
              href: d?.projectId ? `/project/${d.projectId}` : "/",
            },
          };
          const nextStep = NEXT_STEPS[bizType] ?? NEXT_STEPS.affiliate;
          return (
            <div className="rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/[0.04] p-5 mb-6">
              <p className="text-[10px] font-black text-[#f5a623] mb-2">YOUR NEXT STEP</p>
              <h3 className="text-base font-black mb-1">{nextStep.title}</h3>
              <p className="text-xs text-t-text-muted mb-3">{nextStep.desc}</p>
              <Link href={nextStep.href}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f5a623] text-sm font-bold text-[#0c0a08] hover:opacity-90 transition">
                {nextStep.cta} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
        })()}

        {/* Upgrade banner — if user came from pricing with a plan */}
        {(() => {
          const sp = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
          const plan = sp.get("plan");
          if (!plan || plan === "free") return null;
          return (
            <div className="rounded-xl border border-[#f5a623]/20 bg-gradient-to-r from-[#f5a623]/[0.06] to-[#e07850]/[0.04] p-5 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <Crown className="w-5 h-5 text-[#f5a623]" />
                <p className="text-sm font-black">Upgrade to {plan === "pro" ? "Pro" : "Business"} to unlock everything</p>
              </div>
              <p className="text-xs text-t-text-faint mb-3">
                Your business is built! Upgrade now to get unlimited builds, auto-optimizer, and all growth tools.
              </p>
              <Link href={`/himalaya/upgrade`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-sm font-bold text-[#0c0a08] hover:opacity-90 transition">
                <Crown className="w-4 h-4" /> Upgrade to {plan === "pro" ? "Pro — $29/mo" : "Business — $79/mo"}
              </Link>
            </div>
          );
        })()}

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
