"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mountain, Globe, Zap, Mail, Play, ArrowRight,
  Check, Copy, ExternalLink, ChevronRight, X,
} from "lucide-react";

type TourStep = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action: string;
  actionHref?: string;
  completed: boolean;
};

export default function PostBuildTour({
  siteUrl,
  siteId,
  campaignId,
  emailFlowId,
  projectId,
  onDismiss,
}: {
  siteUrl?: string;
  siteId?: string;
  campaignId?: string;
  emailFlowId?: string;
  projectId?: string;
  onDismiss?: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const steps: TourStep[] = [
    {
      id: "site",
      title: "Your site is live",
      description: siteUrl
        ? `Your website is published and anyone can visit it. Share this link everywhere — social media, DMs, email signatures.`
        : "Your website was created. Publish it to make it live.",
      icon: Globe,
      action: siteUrl ? "Copy your link" : "Open site editor",
      actionHref: siteUrl ? undefined : siteId ? `/websites/${siteId}` : undefined,
      completed: !!siteUrl,
    },
    {
      id: "scripts",
      title: "Record your first 3 videos",
      description: "Open your project page — 10 word-for-word scripts are ready. Record Scripts #1, #3, and #7 on your phone. Kitchen or living room, no setup needed. Post to TikTok + Instagram Reels.",
      icon: Play,
      action: "See your scripts",
      actionHref: projectId ? `/project/${projectId}` : undefined,
      completed: false,
    },
    {
      id: "ads",
      title: "Your ads are ready",
      description: `${campaignId ? "Ad creatives with hooks and images are generated." : "Generate ad creatives from your campaign."} Don't boost anything yet — wait until a post gets 500+ organic views first. Then boost THAT post for $20/day.`,
      icon: Zap,
      action: "View your ads",
      actionHref: campaignId ? `/campaigns/${campaignId}` : "/campaigns",
      completed: !!campaignId,
    },
    {
      id: "emails",
      title: "Email automation is running",
      description: "Your welcome sequence and follow-up emails are active. Anyone who fills out the form on your site automatically gets enrolled. You don't need to do anything — it sends on its own.",
      icon: Mail,
      action: "View email flows",
      actionHref: emailFlowId ? `/emails/flows/${emailFlowId}` : "/emails",
      completed: !!emailFlowId,
    },
    {
      id: "commands",
      title: "Follow your daily commands",
      description: "Every day, open Himalaya and look at 'DO THIS NOW.' It tells you exactly what to post, who to follow up with, and what to check. Don't think — just execute.",
      icon: Mountain,
      action: "Go to homepage",
      actionHref: "/",
      completed: false,
    },
  ];

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="rounded-2xl border border-[#f5a623]/20 bg-[#f5a623]/[0.03] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f5a623]/10">
        <div className="flex items-center gap-2">
          <Mountain className="w-4 h-4 text-[#f5a623]" />
          <p className="text-xs font-black text-[#f5a623]">YOUR BUSINESS IS BUILT — HERE&apos;S WHAT TO DO</p>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="p-1 rounded-lg hover:bg-white/[0.05] transition">
            <X className="w-3.5 h-3.5 text-t-text-faint" />
          </button>
        )}
      </div>

      {/* Progress */}
      <div className="h-1 bg-white/[0.04]">
        <div className="h-full bg-[#f5a623] transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Step content */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${step.completed ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-[#f5a623]/10 border border-[#f5a623]/20"}`}>
            {step.completed ? (
              <Check className="w-5 h-5 text-emerald-400" />
            ) : (
              <step.icon className="w-5 h-5 text-[#f5a623]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-t-text-faint">STEP {currentStep + 1} OF {steps.length}</span>
              {step.completed && <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">DONE</span>}
            </div>
            <h3 className="text-base font-black text-t-text mb-1">{step.title}</h3>
            <p className="text-sm text-t-text-muted leading-relaxed mb-4">{step.description}</p>

            {/* Action */}
            <div className="flex items-center gap-3">
              {step.id === "site" && siteUrl ? (
                <button
                  onClick={() => { navigator.clipboard.writeText(siteUrl); setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2000); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm font-bold text-emerald-400 hover:bg-emerald-500/20 transition"
                >
                  {copiedUrl ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Link</>}
                </button>
              ) : step.actionHref ? (
                <Link href={step.actionHref}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f5a623]/10 border border-[#f5a623]/20 text-sm font-bold text-[#f5a623] hover:bg-[#f5a623]/20 transition">
                  {step.action} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : null}

              {siteUrl && step.id === "site" && (
                <a href={siteUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-t-text-faint hover:text-t-text-muted transition">
                  <ExternalLink className="w-3 h-3" /> View live
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04]">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="text-xs text-t-text-faint hover:text-t-text-muted transition disabled:opacity-30"
        >
          ← Previous
        </button>

        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`w-2 h-2 rounded-full transition ${i === currentStep ? "bg-[#f5a623]" : i < currentStep ? "bg-emerald-400" : "bg-white/[0.08]"}`}
            />
          ))}
        </div>

        <button
          onClick={() => isLast ? onDismiss?.() : setCurrentStep(currentStep + 1)}
          className="text-xs font-bold text-[#f5a623] hover:text-[#e07850] transition"
        >
          {isLast ? "Done ✓" : "Next →"}
        </button>
      </div>
    </div>
  );
}
