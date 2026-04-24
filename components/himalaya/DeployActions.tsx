"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Rocket, Loader2, CheckCircle, Globe, Mail, Megaphone, RotateCcw, Eye,
  Image, Video, CreditCard, BarChart3, Zap, ArrowRight, Send,
} from "lucide-react";
import DeployQAReport from "./DeployQAReport";
import AdReviewLaunch from "./AdReviewLaunch";
import PostBuildTour from "./PostBuildTour";
import WorkflowSuccess from "@/components/navigation/WorkflowSuccess";
import { track } from "@/lib/himalaya/tracking";
import type { HimalayaResultsViewModel } from "@/lib/himalaya/types";

type DeployResult = {
  campaign?: { id: string; url: string };
  site?: { id: string; url: string; slug?: string; publicUrl?: string };
  emails?: { id: string; url: string };
};

type GeneratedInfo = {
  adImages: number;
  adVideo: boolean;
  paymentLink: string | null;
  trackingEnabled: boolean;
  emailFlowsCreated: number;
};

type QAReport = {
  score: number;
  checks: { id: string; label: string; category: string; status: "pass" | "warn" | "fail"; detail: string }[];
  passCount: number;
  warnCount: number;
  failCount: number;
  summary: string;
};

export default function DeployActions({ vm, autoDeploy = false, autoPublish = false }: { vm: HimalayaResultsViewModel; autoDeploy?: boolean; autoPublish?: boolean }) {
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState<DeployResult | null>(null);
  const [generated, setGenerated] = useState<GeneratedInfo | null>(null);
  const [qaReport, setQaReport] = useState<QAReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoDeployAttempted, setAutoDeployAttempted] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [sitePublished, setSitePublished] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [adImages, setAdImages] = useState<{ name: string; base64: string }[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Load generated images/videos from campaign after deploy
  useEffect(() => {
    if (!deployed?.campaign) return;
    fetch(`/api/campaigns/${deployed.campaign.id}`)
      .then((r) => r.json() as Promise<{ ok: boolean; campaign?: { adVariations?: { name: string; content: Record<string, unknown> }[] } }>)
      .then((data) => {
        if (!data.ok || !data.campaign?.adVariations) return;
        const imgs = data.campaign.adVariations
          .filter((v) => typeof v.content.imageBase64 === "string")
          .map((v) => ({ name: v.name, base64: v.content.imageBase64 as string }));
        if (imgs.length > 0) setAdImages(imgs);
        const vid = data.campaign.adVariations.find((v) => typeof v.content.videoUrl === "string");
        if (vid) setVideoUrl(vid.content.videoUrl as string);
      })
      .catch(() => {});
  }, [deployed?.campaign]);

  // Auto-deploy on first load if enabled
  useEffect(() => {
    if (autoDeploy && !autoDeployAttempted && !deployed && !deploying && vm.assetGroups.length > 0) {
      setAutoDeployAttempted(true);
      void handleDeploy(["all"]);
    }
  }, [autoDeploy, autoDeployAttempted, deployed, deploying, vm.assetGroups.length]);

  async function handleDeploy(targets: string[]) {
    setDeploying(true);
    setError(null);
    try {
      const res = await fetch("/api/himalaya/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: vm.analysisId, targets }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        deployed?: DeployResult;
        generated?: GeneratedInfo;
        qa?: QAReport;
        error?: string;
      };
      if (data.ok && data.deployed) {
        setDeployed(data.deployed);
        if (data.generated) setGenerated(data.generated);
        track.deploy(vm.analysisId, targets);
        if (data.qa) setQaReport(data.qa);
        // Auto-publish site if enabled
        if (autoPublish && data.deployed.site?.id) {
          publishSite(data.deployed.site.id);
        }
      } else {
        setError(data.error ?? "Deploy failed");
      }
    } catch {
      setError("Connection failed");
    } finally {
      setDeploying(false);
    }
  }

  async function publishSite(siteId: string) {
    setPublishing(true);
    try {
      const res = await fetch(`/api/sites/${siteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: true }),
      });
      const data = await res.json() as { ok: boolean };
      if (data.ok) setSitePublished(true);
    } catch {
      // Non-blocking
    } finally {
      setPublishing(false);
    }
  }

  function handleRedeploy() {
    setDeployed(null);
    setQaReport(null);
    setGenerated(null);
    void handleDeploy(["all"]);
  }

  if (vm.assetGroups.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#f5a623]/15 bg-gradient-to-br from-[#f5a623]/[0.05] to-[#e07850]/[0.05] p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Rocket className="w-4 h-4 text-[#f5a623]/60" />
          <h2 className="text-[10px] font-black uppercase tracking-widest text-white/30">Deploy</h2>
        </div>

        {deployed ? (
          <div>
            {/* Post-build tour — guides user through what to do next */}
            <div className="mb-4">
              <PostBuildTour
                siteUrl={(deployed.site as Record<string, string> | undefined)?.publicUrl}
                siteId={deployed.site?.id}
                campaignId={deployed.campaign?.id}
                emailFlowId={deployed.emails?.id}
              />
            </div>

            {/* Public site URL — the most important thing */}
            {deployed.site?.publicUrl && (
              <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/60 mb-2">
                  {sitePublished ? "Your live site" : "Your site URL (publish to go live)"}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <code className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-black/30 px-4 py-2.5 text-xs font-mono text-emerald-300 sm:text-sm">
                    {deployed.site.publicUrl}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(deployed.site!.publicUrl!);
                      setUrlCopied(true);
                      setTimeout(() => setUrlCopied(false), 2000);
                    }}
                    className="w-full shrink-0 rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-400 sm:w-auto"
                  >
                    {urlCopied ? "Copied!" : "Copy URL"}
                  </button>
                </div>
              </div>
            )}

            {/* What was generated — visual summary */}
            {generated && (
              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {generated.adImages > 0 && (
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-3 text-center">
                    <Image className="w-4 h-4 text-[#f5a623] mx-auto mb-1" />
                    <p className="text-sm font-bold text-white">{generated.adImages}</p>
                    <p className="text-[10px] text-white/30">Ad Images</p>
                  </div>
                )}
                {generated.adVideo && (
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-3 text-center">
                    <Video className="w-4 h-4 text-[#e07850] mx-auto mb-1" />
                    <p className="text-sm font-bold text-white">1</p>
                    <p className="text-[10px] text-white/30">Ad Video</p>
                  </div>
                )}
                {generated.paymentLink && (
                  <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-3 text-center">
                    <CreditCard className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                    <p className="text-sm font-bold text-emerald-300">Live</p>
                    <p className="text-[10px] text-white/30">Payment Link</p>
                  </div>
                )}
                {generated.emailFlowsCreated > 0 && (
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-3 text-center">
                    <Mail className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                    <p className="text-sm font-bold text-white">{generated.emailFlowsCreated}</p>
                    <p className="text-[10px] text-white/30">Email Flows</p>
                  </div>
                )}
                {generated.trackingEnabled && (
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-3 text-center">
                    <BarChart3 className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                    <p className="text-sm font-bold text-white">On</p>
                    <p className="text-[10px] text-white/30">Tracking</p>
                  </div>
                )}
              </div>
            )}

            {/* Full ad review + launch — select best, one-click launch */}
            {deployed.campaign && (
              <div className="mb-4">
                <AdReviewLaunch campaignId={deployed.campaign.id} />
              </div>
            )}

            {/* Deployed tool links */}
            <div className="mb-4 space-y-2">
              {deployed.site && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Link href={deployed.site.url} className="flex flex-1 items-center justify-between rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3 transition group hover:bg-emerald-500/10">
                    <div className="flex items-center gap-2.5">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      <div>
                        <p className="text-xs font-bold text-emerald-300">Website</p>
                        <p className="text-[10px] text-white/30">
                          {sitePublished ? "Live — receiving traffic" : "Edit, customize, publish"}
                          {generated?.paymentLink && " — payment link included"}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400/40 group-hover:text-emerald-400 transition" />
                  </Link>
                  {!sitePublished ? (
                    <button
                      onClick={() => publishSite(deployed.site!.id)}
                      disabled={publishing}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-3 text-xs font-bold text-white shadow-[0_0_16px_rgba(34,197,94,0.2)] transition hover:bg-emerald-400 disabled:opacity-40 sm:w-auto"
                      title="Publish site now"
                    >
                      {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>Publish</span>
                    </button>
                  ) : (
                    <Link
                      href={`/s/preview?siteId=${deployed.site.id}`}
                      target="_blank"
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/20 sm:w-auto"
                      title="View live site"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Live</span>
                    </Link>
                  )}
                </div>
              )}
              {deployed.campaign && (
                <Link href={deployed.campaign.url} className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 hover:bg-emerald-500/10 transition group">
                  <div className="flex items-center gap-2.5">
                    <Megaphone className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-emerald-300">Campaign</p>
                      <p className="text-[10px] text-white/30">
                        {generated?.adImages ? `${generated.adImages} images` : "Ad hooks & scripts"}
                        {generated?.adVideo ? " + video" : ""}
                        {" — AI Generate tab ready"}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400/40 group-hover:text-emerald-400 transition" />
                </Link>
              )}
              {deployed.emails && (
                <Link href={deployed.emails.url} className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 hover:bg-emerald-500/10 transition group">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-emerald-300">Email Flows</p>
                      <p className="text-[10px] text-white/30">
                        {generated?.emailFlowsCreated === 3
                          ? "Welcome + Abandoned Cart + Post-Purchase — active, enrollment live"
                          : "Welcome sequence — active, enrollment live"}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400/40 group-hover:text-emerald-400 transition" />
                </Link>
              )}
            </div>

            {/* What to do next */}
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-2">What happens now</p>
              <ol className="space-y-1.5 text-xs text-white/50">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">1.</span>
                  <span>Your email flows are <span className="text-emerald-300 font-semibold">active</span> — anyone who submits the form on your site is enrolled automatically. Email delivery starts as soon as your Resend sender setup is verified.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">2.</span>
                  <span>Open your <span className="text-white/70 font-semibold">Campaign</span> → click <span className="text-white/70 font-semibold">AI Generate</span> tab → your top ad copy and images are already generated. Copy them to Meta/TikTok/Google.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">3.</span>
                  <span>Open your <span className="text-white/70 font-semibold">Website</span> → review it → click <span className="text-white/70 font-semibold">Publish</span>. {generated?.paymentLink ? "The Stripe payment link is already embedded." : "Add your pricing when ready."}</span>
                </li>
                {generated?.trackingEnabled && (
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">4.</span>
                    <span>Your tracking pixels are <span className="text-emerald-300 font-semibold">active</span> on the site. Ad platforms will start receiving conversion data as soon as you publish.</span>
                  </li>
                )}
              </ol>
            </div>

            {/* Redeploy */}
            <button
              onClick={handleRedeploy}
              disabled={deploying}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[10px] font-semibold text-white/30 transition hover:text-white/60 disabled:opacity-40"
            >
              {deploying ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
              Redeploy (new version)
            </button>
          </div>
        ) : (
          <div>
            <p className="text-xs text-white/50 mb-2 font-semibold">One click builds your entire business:</p>
            <div className="mb-4 grid grid-cols-1 gap-2 text-[10px] text-white/30 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-1.5"><Globe className="w-3 h-3 text-[#f5a623]/50" /> Website with payment</div>
              <div className="flex items-center gap-1.5"><Megaphone className="w-3 h-3 text-[#f5a623]/50" /> Campaign + ad images</div>
              <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-[#f5a623]/50" /> 3 email flows (active)</div>
              <div className="flex items-center gap-1.5"><Image className="w-3 h-3 text-[#f5a623]/50" /> 5 AI ad creatives</div>
              <div className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-[#f5a623]/50" /> 4 pre-written ad copies</div>
              <div className="flex items-center gap-1.5"><BarChart3 className="w-3 h-3 text-[#f5a623]/50" /> Tracking pixels</div>
            </div>

            {error && <p className="text-xs text-red-400/70 mb-3">{error}</p>}

            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
              <button
                onClick={() => void handleDeploy(["all"])}
                disabled={deploying}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] px-6 py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(245,166,35,0.2)] transition hover:opacity-90 disabled:opacity-40"
              >
                {deploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                {deploying ? "Building your business..." : "Deploy Everything"}
              </button>
              <button onClick={() => void handleDeploy(["site"])} disabled={deploying} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/40 transition hover:text-white/70 disabled:opacity-40">
                <Globe className="w-3 h-3" /> Site Only
              </button>
              <button onClick={() => void handleDeploy(["campaign"])} disabled={deploying} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/40 transition hover:text-white/70 disabled:opacity-40">
                <Megaphone className="w-3 h-3" /> Campaign Only
              </button>
              <button onClick={() => void handleDeploy(["emails"])} disabled={deploying} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/40 transition hover:text-white/70 disabled:opacity-40">
                <Mail className="w-3 h-3" /> Emails Only
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QA Report */}
      {qaReport && <DeployQAReport report={qaReport} />}
    </div>
  );
}
