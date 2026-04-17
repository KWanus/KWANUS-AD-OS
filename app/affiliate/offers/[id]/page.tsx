"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import AppNav from "@/components/AppNav";
import DatabaseFallbackNotice from "@/components/DatabaseFallbackNotice";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft, Copy, Check, ExternalLink, Loader2, ChevronDown,
  Sparkles, Zap, AlertTriangle, DollarSign, TrendingUp, Target,
  BarChart2, Clock, Globe, Link2, FileText, Mail, Megaphone,
  LayoutTemplate, CheckCircle2, XCircle, Users, Tag,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Platform = "clickbank" | "jvzoo" | "warriorplus" | "cj" | "amazon" | "digistore24" | "custom";
type OfferStatus = "researching" | "approved" | "building" | "running" | "paused" | "dropped";

interface TrafficSource {
  source: string;
  difficulty: "easy" | "medium" | "hard";
  cost: "free" | "low" | "medium" | "high";
  notes?: string;
}

interface AudienceSegment {
  segment: string;
  angle: string;
  size: string;
}

interface OfferAnalysis {
  verdict: "promote" | "test_first" | "pass";
  verdictReason?: string;
  targetAudience?: {
    demographics?: string;
    psychographics?: string;
    painPoints?: string[];
    desiredOutcome?: string;
  };
  strengths?: string[];
  weaknesses?: string[];
  bestTrafficSources?: TrafficSource[];
  audienceSegments?: AudienceSegment[];
  estimatedEPC?: string;
}

interface FunnelStep {
  type: string;
  headline?: string;
  body?: string;
  cta?: string;
}

interface EmailItem {
  day: number;
  subject: string;
  body: string;
}

interface FunnelJson {
  steps?: FunnelStep[];
  emailSequence?: EmailItem[];
  trafficPlan?: {
    primarySource?: string;
    budgetRecommendation?: string;
    targeting?: string;
    bidStrategy?: string;
  };
}

interface SwipeItem {
  subject: string;
  body: string;
}

interface SwipeJson {
  broadcasts?: SwipeItem[];
  sequence?: SwipeItem[];
  sms?: SwipeItem[];
  push?: SwipeItem[];
}

interface AdCreative {
  hooks?: string[];
  primaryTexts?: string[];
  headlines?: string[];
  descriptions?: string[];
  thumbnailConcepts?: string[];
  scripts?: { hook: string; body: string; cta: string }[];
  ugcBriefs?: string[];
  searchAdGroups?: { headline1: string; headline2: string; description: string }[];
  shoppingTitle?: string;
  shoppingDesc?: string;
}

interface AdHooksJson {
  facebook?: AdCreative;
  tiktok?: AdCreative;
  google?: AdCreative;
}

interface LandingJson {
  pageType?: string;
  seoTitle?: string;
  headline?: string;
  hookSection?: string;
  storySection?: string;
  offerTransition?: string;
  ctaButton?: string;
  socialProof?: string[];
  faqs?: { question: string; answer: string }[];
  disclaimer?: string;
}

interface AffiliateOffer {
  id: string;
  name: string;
  platform: Platform;
  niche: string;
  url?: string;
  affiliateUrl?: string;
  commission?: string;
  gravity?: number;
  epc?: string;
  convRate?: string;
  cookieDuration?: string;
  avgOrderValue?: number;
  refundRate?: string;
  status: OfferStatus;
  notes?: string;
  offerAnalysis?: OfferAnalysis;
  funnelJson?: FunnelJson;
  swipeJson?: SwipeJson;
  adHooksJson?: AdHooksJson;
  landingJson?: LandingJson;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const PLATFORM_BADGE: Record<Platform, string> = {
  clickbank:   "bg-green-500/15 text-green-400 border-green-500/30",
  jvzoo:       "bg-blue-500/15 text-blue-400 border-blue-500/30",
  warriorplus: "bg-purple-500/15 text-[#e07850] border-purple-500/30",
  cj:          "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  amazon:      "bg-orange-500/15 text-orange-400 border-orange-500/30",
  digistore24: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  custom:      "bg-white/10 text-white/60 border-white/20",
};

const STATUS_BADGE: Record<OfferStatus, string> = {
  researching: "bg-white/10 text-white/50 border-white/20",
  approved:    "bg-[#f5a623]/15 text-[#f5a623] border-[#f5a623]/30",
  building:    "bg-blue-500/15 text-blue-400 border-blue-500/30",
  running:     "bg-green-500/15 text-green-400 border-green-500/30",
  paused:      "bg-amber-500/15 text-amber-400 border-amber-500/30",
  dropped:     "bg-red-500/15 text-red-400 border-red-500/30",
};

const STATUSES: OfferStatus[] = ["researching", "approved", "building", "running", "paused", "dropped"];

const TABS = ["Overview", "Analysis", "Funnel", "Swipe Copy", "Ads", "Bridge Page"] as const;
type Tab = typeof TABS[number];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function CopyButton({ text, size = "sm" }: { text: string; size?: "sm" | "xs" }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  const cls = size === "xs"
    ? "p-1 rounded-md text-white/30 hover:text-white/60"
    : "p-1.5 rounded-lg text-white/30 hover:text-white/60";
  return (
    <button onClick={handleCopy} className={`${cls} hover:bg-white/[0.06] transition`}>
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function StatPill({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-col items-center px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
      <span className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-0.5">{label}</span>
      <span className="text-sm font-black text-white">{value ?? "—"}</span>
    </div>
  );
}

function DifficultyBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    easy: "bg-green-500/15 text-green-400 border-green-500/30",
    medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    hard: "bg-red-500/15 text-red-400 border-red-500/30",
    free: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    low: "bg-green-500/15 text-green-400 border-green-500/30",
    high: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black border ${map[level] ?? "bg-white/10 text-white/50 border-white/20"}`}>
      {level}
    </span>
  );
}

// ─── Tab: Overview ─────────────────────────────────────────────────────────────

function TabOverview({ offer, onNotesBlur }: {
  offer: AffiliateOffer;
  onNotesBlur: (notes: string) => void;
}) {
  const [notes, setNotes] = useState(offer.notes ?? "");
  const PIPELINE = ["researching", "approved", "building", "running", "paused", "dropped"];

  return (
    <div className="space-y-5">
      {/* URLs */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-white/30">Links</h3>
        {[
          { label: "Affiliate URL", value: offer.affiliateUrl, icon: Link2 },
          { label: "Product URL", value: offer.url, icon: Globe },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label}>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1.5">{label}</p>
            <div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2">
              <Icon className="w-3.5 h-3.5 text-white/20 shrink-0" />
              <span className="flex-1 text-xs text-white/60 truncate font-mono">{value ?? <span className="text-white/20 italic">Not set</span>}</span>
              {value && (
                <>
                  <CopyButton text={value} size="xs" />
                  <a href={value} target="_blank" rel="noopener noreferrer" className="p-1 rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Metadata */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-4">Metadata</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Avg Order Value", value: offer.avgOrderValue ? `$${offer.avgOrderValue}` : null },
            { label: "Refund Rate", value: offer.refundRate },
            { label: "Cookie Duration", value: offer.cookieDuration },
            { label: "Commission", value: offer.commission },
            { label: "EPC", value: offer.epc },
            { label: "Conv. Rate", value: offer.convRate },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-1">{label}</span>
              <span className="text-xs font-bold text-white/70">{value ?? "—"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => onNotesBlur(notes)}
          placeholder="Add research notes, observations, or reminders..."
          rows={5}
          className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2.5 text-xs text-white/70 placeholder-white/20 focus:outline-none focus:border-[#f5a623]/40 transition resize-none"
        />
      </div>

      {/* Pipeline timeline */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-4">Pipeline Stage</h3>
        <div className="flex items-center gap-0">
          {PIPELINE.map((stage, i) => {
            const idx = PIPELINE.indexOf(offer.status);
            const active = stage === offer.status;
            const past = i < idx;
            return (
              <div key={stage} className="flex items-center flex-1 min-w-0">
                <div className={`flex flex-col items-center gap-1 flex-1 min-w-0 ${active ? "opacity-100" : past ? "opacity-50" : "opacity-25"}`}>
                  <div className={`w-2.5 h-2.5 rounded-full border-2 ${active ? "bg-cyan-400 border-cyan-400" : past ? "bg-white/40 border-white/40" : "bg-transparent border-white/30"}`} />
                  <span className={`text-[9px] font-black uppercase tracking-wide text-center leading-tight ${active ? "text-[#f5a623]" : "text-white/40"}`}>
                    {stage}
                  </span>
                </div>
                {i < PIPELINE.length - 1 && (
                  <div className={`h-px flex-1 max-w-[20px] mb-4 ${i < idx ? "bg-white/30" : "bg-white/10"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Analysis ─────────────────────────────────────────────────────────────

function TabAnalysis({ offer, onRunAnalysis, running }: {
  offer: AffiliateOffer;
  onRunAnalysis: () => void;
  running: boolean;
}) {
  const a = offer.offerAnalysis;

  if (!a) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <BarChart2 className="w-10 h-10 text-white/10" />
        <p className="text-sm text-white/30">No analysis yet</p>
        <button
          onClick={onRunAnalysis}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border border-[#f5a623]/30 hover:border-cyan-400/50 text-sm font-bold text-white transition disabled:opacity-40"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Run Analysis
        </button>
      </div>
    );
  }

  const verdictMap = {
    promote:    { bg: "bg-green-500/10 border-green-500/30", text: "text-green-400", label: "PROMOTE" },
    test_first: { bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400", label: "TEST FIRST" },
    pass:       { bg: "bg-red-500/10 border-red-500/30",   text: "text-red-400",   label: "PASS" },
  };
  const vd = verdictMap[a.verdict] ?? verdictMap.test_first;

  return (
    <div className="space-y-5">
      {/* Verdict */}
      <div className={`${vd.bg} border rounded-2xl p-5`}>
        <div className="flex items-center gap-3 mb-2">
          {a.verdict === "promote" ? <CheckCircle2 className="w-5 h-5 text-green-400" /> :
           a.verdict === "pass" ? <XCircle className="w-5 h-5 text-red-400" /> :
           <AlertTriangle className="w-5 h-5 text-amber-400" />}
          <span className={`text-lg font-black ${vd.text}`}>{vd.label}</span>
        </div>
        {a.verdictReason && <p className="text-sm text-white/60 leading-relaxed">{a.verdictReason}</p>}
        {a.estimatedEPC && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.05] border border-white/10">
            <DollarSign className="w-3 h-3 text-white/40" />
            <span className="text-xs font-bold text-white/60">Est. EPC: <span className="text-white">{a.estimatedEPC}</span></span>
          </div>
        )}
      </div>

      {/* Target Audience */}
      {a.targetAudience && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-[#f5a623]" />
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Target Audience</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {a.targetAudience.demographics && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1">Demographics</p>
                <p className="text-xs text-white/60 leading-relaxed">{a.targetAudience.demographics}</p>
              </div>
            )}
            {a.targetAudience.psychographics && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1">Psychographics</p>
                <p className="text-xs text-white/60 leading-relaxed">{a.targetAudience.psychographics}</p>
              </div>
            )}
            {a.targetAudience.desiredOutcome && (
              <div className="sm:col-span-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1">Desired Outcome</p>
                <p className="text-xs text-white/60 leading-relaxed">{a.targetAudience.desiredOutcome}</p>
              </div>
            )}
            {a.targetAudience.painPoints && a.targetAudience.painPoints.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-2">Pain Points</p>
                <div className="flex flex-wrap gap-1.5">
                  {a.targetAudience.painPoints.map((pt, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">{pt}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Strengths vs Weaknesses */}
      {(a.strengths || a.weaknesses) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-green-500/[0.04] border border-green-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-green-400/70">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {(a.strengths ?? []).map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                  <Check className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />{s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-red-500/[0.04] border border-red-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="w-4 h-4 text-red-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-red-400/70">Weaknesses</h3>
            </div>
            <ul className="space-y-2">
              {(a.weaknesses ?? []).map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                  <XCircle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />{w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Traffic Sources */}
      {a.bestTrafficSources && a.bestTrafficSources.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Best Traffic Sources</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {a.bestTrafficSources.map((ts, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">{ts.source}</span>
                  <div className="flex gap-1">
                    <DifficultyBadge level={ts.difficulty} />
                    <DifficultyBadge level={ts.cost} />
                  </div>
                </div>
                {ts.notes && <p className="text-[11px] text-white/40 leading-relaxed">{ts.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audience Segments */}
      {a.audienceSegments && a.audienceSegments.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-[#e07850]" />
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Audience Segments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left border-b border-white/[0.06]">
                  <th className="pb-2 text-[10px] font-black uppercase tracking-widest text-white/25 pr-4">Segment</th>
                  <th className="pb-2 text-[10px] font-black uppercase tracking-widest text-white/25 pr-4">Angle</th>
                  <th className="pb-2 text-[10px] font-black uppercase tracking-widest text-white/25">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {a.audienceSegments.map((seg, i) => (
                  <tr key={i}>
                    <td className="py-2.5 pr-4 font-semibold text-white/70">{seg.segment}</td>
                    <td className="py-2.5 pr-4 text-white/50">{seg.angle}</td>
                    <td className="py-2.5 text-white/40">{seg.size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Funnel ───────────────────────────────────────────────────────────────

function TabFunnel({ offer, onGenerate, running }: {
  offer: AffiliateOffer;
  onGenerate: () => void;
  running: boolean;
}) {
  const f = offer.funnelJson;

  if (!f) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Zap className="w-10 h-10 text-white/10" />
        <p className="text-sm text-white/30">No funnel generated yet</p>
        <button
          onClick={onGenerate}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#e07850]/30 to-pink-600/30 border border-purple-500/30 hover:border-purple-400/50 text-sm font-bold text-white transition disabled:opacity-40"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Generate Funnel
        </button>
      </div>
    );
  }

  const STEP_COLORS = ["text-blue-400 border-blue-500/30 bg-blue-500/10", "text-[#e07850] border-purple-500/30 bg-purple-500/10", "text-[#f5a623] border-[#f5a623]/30 bg-[#f5a623]/10", "text-green-400 border-green-500/30 bg-green-500/10"];

  return (
    <div className="space-y-5">
      {/* Flow */}
      {f.steps && f.steps.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-5">Funnel Flow</h3>
          <div className="space-y-3">
            {f.steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-xl border ${STEP_COLORS[i % STEP_COLORS.length]} flex items-center justify-center text-[11px] font-black shrink-0`}>{i + 1}</div>
                  {i < (f.steps?.length ?? 0) - 1 && <div className="w-px flex-1 bg-white/[0.08] my-1.5 min-h-[20px]" />}
                </div>
                <div className="flex-1 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1.5 block">{step.type}</span>
                  {step.headline && <p className="text-sm font-bold text-white mb-1">{step.headline}</p>}
                  {step.body && <p className="text-xs text-white/50 leading-relaxed mb-2">{step.body}</p>}
                  {step.cta && (
                    <span className="inline-flex px-3 py-1 rounded-lg bg-[#f5a623]/15 text-[#f5a623] border border-[#f5a623]/25 text-[11px] font-bold">
                      {step.cta}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email Sequence */}
      {f.emailSequence && f.emailSequence.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-4">Email Sequence</h3>
          <div className="space-y-3">
            {f.emailSequence.map((email, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/25">Day {email.day}</span>
                  <CopyButton text={`Subject: ${email.subject}\n\n${email.body}`} />
                </div>
                <p className="text-sm font-bold text-white mb-1.5">{email.subject}</p>
                <p className="text-xs text-white/50 leading-relaxed line-clamp-3">{email.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Traffic Plan */}
      {f.trafficPlan && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Traffic Plan</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Primary Source", value: f.trafficPlan.primarySource },
              { label: "Budget Recommendation", value: f.trafficPlan.budgetRecommendation },
              { label: "Targeting", value: f.trafficPlan.targeting },
              { label: "Bid Strategy", value: f.trafficPlan.bidStrategy },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-1">{label}</p>
                <p className="text-xs text-white/60">{value ?? "—"}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Swipe Copy ───────────────────────────────────────────────────────────

function TabSwipe({ offer, onGenerate, running }: {
  offer: AffiliateOffer;
  onGenerate: () => void;
  running: boolean;
}) {
  const [activeSwipeTab, setActiveSwipeTab] = useState<"Broadcasts" | "7-Day Sequence" | "SMS" | "Push">("Broadcasts");
  const s = offer.swipeJson;

  if (!s) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Mail className="w-10 h-10 text-white/10" />
        <p className="text-sm text-white/30">No swipe copy generated yet</p>
        <button
          onClick={onGenerate}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border border-blue-500/30 hover:border-blue-400/50 text-sm font-bold text-white transition disabled:opacity-40"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          Generate Swipe Copy
        </button>
      </div>
    );
  }

  const SWIPE_TABS = ["Broadcasts", "7-Day Sequence", "SMS", "Push"] as const;
  const dataMap: Record<string, SwipeItem[] | undefined> = {
    "Broadcasts": s.broadcasts,
    "7-Day Sequence": s.sequence,
    "SMS": s.sms,
    "Push": s.push,
  };
  const items = dataMap[activeSwipeTab] ?? [];

  function copyAll() {
    const text = items.map((item, i) => `--- ${activeSwipeTab} #${i + 1} ---\nSubject: ${item.subject}\n\n${item.body}`).join("\n\n");
    void navigator.clipboard.writeText(text).then(() => toast.success("Copied all!"));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06]">
          {SWIPE_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActiveSwipeTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeSwipeTab === t ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white/60"}`}
            >
              {t}
            </button>
          ))}
        </div>
        {items.length > 0 && (
          <button
            onClick={copyAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-bold text-white/50 hover:text-white hover:bg-white/[0.07] transition"
          >
            <Copy className="w-3 h-3" /> Copy All
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-center text-xs text-white/20 py-10">No {activeSwipeTab} in this sequence.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-white/[0.06] text-white/50 border border-white/10">
                  #{i + 1}
                </span>
                <CopyButton text={`Subject: ${item.subject}\n\n${item.body}`} />
              </div>
              <p className="text-sm font-bold text-white mb-2">{item.subject}</p>
              <p className="text-xs text-white/55 leading-relaxed whitespace-pre-wrap">{item.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Ads ──────────────────────────────────────────────────────────────────

function TabAds({ offer, onGenerate, running }: {
  offer: AffiliateOffer;
  onGenerate: () => void;
  running: boolean;
}) {
  const [adTab, setAdTab] = useState<"Facebook" | "TikTok" | "Google">("Facebook");
  const ads = offer.adHooksJson;

  if (!ads) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Megaphone className="w-10 h-10 text-white/10" />
        <p className="text-sm text-white/30">No ads generated yet</p>
        <button
          onClick={onGenerate}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600/30 to-[#e07850]/30 border border-indigo-500/30 hover:border-indigo-400/50 text-sm font-bold text-white transition disabled:opacity-40"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
          Generate Ads
        </button>
      </div>
    );
  }

  const AD_TABS = ["Facebook", "TikTok", "Google"] as const;
  const data = ads[adTab.toLowerCase() as "facebook" | "tiktok" | "google"];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] w-fit">
        {AD_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setAdTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${adTab === t ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white/60"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {!data ? (
        <p className="text-center text-xs text-white/20 py-10">No {adTab} creatives available.</p>
      ) : (
        <div className="space-y-5">
          {/* Hooks */}
          {data.hooks && data.hooks.length > 0 && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">Hooks</h3>
              <div className="space-y-2">
                {data.hooks.map((hook, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                    <span className="text-[10px] font-black text-white/25 mt-0.5 w-5 shrink-0">{i + 1}.</span>
                    <p className="flex-1 text-xs text-white/70">{hook}</p>
                    <CopyButton text={hook} size="xs" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Facebook-specific */}
          {adTab === "Facebook" && (
            <>
              {data.primaryTexts && data.primaryTexts.length > 0 && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">Primary Texts</h3>
                  <div className="space-y-2">
                    {data.primaryTexts.map((t, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                        <p className="flex-1 text-xs text-white/60 leading-relaxed whitespace-pre-wrap">{t}</p>
                        <CopyButton text={t} size="xs" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.headlines && data.headlines.length > 0 && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">Headlines</h3>
                  <div className="flex flex-wrap gap-2">
                    {data.headlines.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                        <span className="text-xs font-semibold text-white/70">{h}</span>
                        <CopyButton text={h} size="xs" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.thumbnailConcepts && data.thumbnailConcepts.length > 0 && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">Thumbnail Concepts</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.thumbnailConcepts.map((tc, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 bg-white/[0.02] rounded-xl border border-white/[0.05]">
                        <LayoutTemplate className="w-3.5 h-3.5 text-[#e07850] mt-0.5 shrink-0" />
                        <p className="flex-1 text-xs text-white/60">{tc}</p>
                        <CopyButton text={tc} size="xs" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* TikTok-specific */}
          {adTab === "TikTok" && (
            <>
              {data.scripts && data.scripts.length > 0 && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">Scripts</h3>
                  <div className="space-y-3">
                    {data.scripts.map((sc, i) => (
                      <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Script {i + 1}</span>
                          <CopyButton text={`Hook: ${sc.hook}\n\n${sc.body}\n\nCTA: ${sc.cta}`} size="xs" />
                        </div>
                        {[{ label: "Hook", val: sc.hook, color: "text-pink-400" }, { label: "Body", val: sc.body, color: "text-white/60" }, { label: "CTA", val: sc.cta, color: "text-[#f5a623]" }].map(({ label, val, color }) => (
                          <div key={label} className="mb-2 last:mb-0">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${color} block mb-0.5`}>{label}</span>
                            <p className="text-xs text-white/60 leading-relaxed">{val}</p>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.ugcBriefs && data.ugcBriefs.length > 0 && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">UGC Briefs</h3>
                  <div className="space-y-2">
                    {data.ugcBriefs.map((brief, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                        <p className="flex-1 text-xs text-white/60 leading-relaxed">{brief}</p>
                        <CopyButton text={brief} size="xs" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Google-specific */}
          {adTab === "Google" && (
            <>
              {data.searchAdGroups && data.searchAdGroups.length > 0 && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">Search Ads</h3>
                  <div className="space-y-3">
                    {data.searchAdGroups.map((ad, i) => (
                      <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase text-white/30">Ad {i + 1}</span>
                          <CopyButton text={`${ad.headline1} | ${ad.headline2}\n${ad.description}`} size="xs" />
                        </div>
                        <p className="text-sm font-bold text-blue-400">{ad.headline1} | {ad.headline2}</p>
                        <p className="text-xs text-white/55 mt-1">{ad.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(data.shoppingTitle || data.shoppingDesc) && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">Shopping</h3>
                  {data.shoppingTitle && (
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-bold text-white flex-1">{data.shoppingTitle}</p>
                      <CopyButton text={data.shoppingTitle} size="xs" />
                    </div>
                  )}
                  {data.shoppingDesc && (
                    <div className="flex items-start gap-2">
                      <p className="text-xs text-white/55 flex-1">{data.shoppingDesc}</p>
                      <CopyButton text={data.shoppingDesc} size="xs" />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Bridge Page ──────────────────────────────────────────────────────────

function TabBridgePage({ offer, onGenerate, running }: {
  offer: AffiliateOffer;
  onGenerate: () => void;
  running: boolean;
}) {
  const lp = offer.landingJson;

  if (!lp) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <LayoutTemplate className="w-10 h-10 text-white/10" />
        <p className="text-sm text-white/30">No bridge page built yet</p>
        <button
          onClick={onGenerate}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600/30 to-cyan-600/30 border border-green-500/30 hover:border-green-400/50 text-sm font-bold text-white transition disabled:opacity-40"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <LayoutTemplate className="w-4 h-4" />}
          Build Bridge Page
        </button>
      </div>
    );
  }

  function copyAsHtml() {
    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${lp?.seoTitle ?? "Bridge Page"}</title></head>
<body>
<h1>${lp?.headline ?? ""}</h1>
<p>${lp?.hookSection ?? ""}</p>
<p>${lp?.storySection ?? ""}</p>
<p>${lp?.offerTransition ?? ""}</p>
<a href="#" style="display:inline-block;padding:16px 32px;background:#0ea5e9;color:#fff;font-weight:bold;text-decoration:none;">${lp?.ctaButton ?? "Click Here"}</a>
${lp?.socialProof ? `<ul>${lp.socialProof.map((sp) => `<li>${sp}</li>`).join("")}</ul>` : ""}
${lp?.faqs ? `<dl>${lp.faqs.map((faq) => `<dt>${faq.question}</dt><dd>${faq.answer}</dd>`).join("")}</dl>` : ""}
<small>${lp?.disclaimer ?? ""}</small>
</body>
</html>`;
    void navigator.clipboard.writeText(html).then(() => toast.success("HTML copied!"));
  }

  return (
    <div className="space-y-5">
      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={copyAsHtml}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-bold text-white/60 hover:text-white hover:bg-white/[0.07] transition"
        >
          <Copy className="w-3.5 h-3.5" /> Copy as HTML
        </button>
        <Link
          href={`/websites/new?prefill_source=bridge&offer_id=${offer.id}`}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f5a623]/15 border border-[#f5a623]/25 text-xs font-bold text-[#f5a623] hover:bg-[#f5a623]/25 transition"
        >
          <Globe className="w-3.5 h-3.5" /> Build this in Sites →
        </Link>
      </div>

      {/* Page meta */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-4">
        {lp.pageType && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black bg-blue-500/15 text-blue-400 border border-blue-500/25">
            {lp.pageType}
          </span>
        )}
        {lp.seoTitle && (
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-1">SEO Title</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-white/60 font-mono flex-1">{lp.seoTitle}</p>
              <CopyButton text={lp.seoTitle} size="xs" />
            </div>
          </div>
        )}
        {lp.headline && (
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-1">Headline</p>
            <p className="text-xl font-black text-white leading-tight">{lp.headline}</p>
          </div>
        )}
      </div>

      {/* Content sections */}
      {[
        { label: "Hook", value: lp.hookSection },
        { label: "Story", value: lp.storySection },
        { label: "Offer Transition", value: lp.offerTransition },
      ].map(({ label, value }) => value ? (
        <div key={label} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/25">{label}</p>
            <CopyButton text={value} size="xs" />
          </div>
          <p className="text-xs text-white/60 leading-relaxed">{value}</p>
        </div>
      ) : null)}

      {/* CTA */}
      {lp.ctaButton && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-3">CTA Button</p>
          <div className="flex items-center gap-3">
            <div className="px-6 py-3 rounded-xl bg-[#f5a623] text-white font-black text-sm cursor-default">
              {lp.ctaButton}
            </div>
            <CopyButton text={lp.ctaButton} />
          </div>
        </div>
      )}

      {/* Social proof */}
      {lp.socialProof && lp.socialProof.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-3">Social Proof</p>
          <ul className="space-y-2">
            {lp.socialProof.map((sp, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />{sp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* FAQs */}
      {lp.faqs && lp.faqs.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-3">FAQ</p>
          <div className="space-y-3">
            {lp.faqs.map((faq, i) => (
              <details key={i} className="group bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-4 py-3 cursor-pointer text-xs font-bold text-white/70 hover:text-white transition list-none">
                  {faq.question}
                  <ChevronDown className="w-3.5 h-3.5 text-white/30 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-4 pb-3 text-xs text-white/50 leading-relaxed">{faq.answer}</div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      {lp.disclaimer && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Disclaimer</p>
          <p className="text-[11px] text-white/30 leading-relaxed">{lp.disclaimer}</p>
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AffiliateOfferPage() {
  const { id } = useParams<{ id: string }>();
  const [offer, setOffer] = useState<AffiliateOffer | null>(null);
  const [databaseUnavailable, setDatabaseUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [running, setRunning] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/affiliate/offers/${id}`)
      .then((r) => r.json() as Promise<{ ok: boolean; offer?: AffiliateOffer | null; databaseUnavailable?: boolean }>)
      .then((data) => {
        setDatabaseUnavailable(Boolean(data.databaseUnavailable));
        if (data.ok && data.offer) setOffer(data.offer);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const patchOffer = useCallback(async (body: Partial<AffiliateOffer>) => {
    try {
      const res = await fetch(`/api/affiliate/offers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { ok: boolean; offer?: AffiliateOffer };
      if (data.ok && data.offer) setOffer(data.offer);
    } catch {
      toast.error("Failed to save");
    }
  }, [id]);

  async function runAction(action: "analyze" | "funnel" | "swipe" | "ads" | "bridge") {
    const endpointMap: Record<string, string> = {
      analyze: `/api/affiliate/offers/analyze`,
      funnel:  `/api/affiliate/offers/funnel`,
      swipe:   `/api/affiliate/offers/swipe`,
      ads:     `/api/affiliate/offers/ads`,
      bridge:  `/api/affiliate/offers/bridge`,
    };
    setRunning(action);
    try {
      const res = await fetch(endpointMap[action], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId: id }),
      });
      const data = await res.json() as { ok: boolean; offer?: AffiliateOffer; error?: string };
      if (data.ok && data.offer) {
        setOffer(data.offer);
        toast.success("Done!");
      } else {
        toast.error(data.error ?? "Failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setRunning(null);
    }
  }

  if (loading) {
    return (
      <>
        <AppNav />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
        </div>
      </>
    );
  }

  if (!offer) {
    return (
      <>
        <AppNav />
        <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center gap-4 px-4">
          <DatabaseFallbackNotice visible={databaseUnavailable} />
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-8">
            <AlertTriangle className="w-8 h-8 text-red-400/50" />
            <p className="text-white/40">{databaseUnavailable ? "Offer data is temporarily unavailable" : "Offer not found"}</p>
            <Link href="/affiliate" className="text-sm text-[#f5a623] hover:text-[#f5a623]">← Back to Affiliate</Link>
          </div>
        </div>
      </>
    );
  }

  const ACTION_BUTTONS = [
    { label: "Analyze Offer",     key: "analyze",  icon: BarChart2,     tab: "Analysis" as Tab },
    { label: "Generate Funnel",   key: "funnel",   icon: Zap,           tab: "Funnel" as Tab },
    { label: "Write Swipe",       key: "swipe",    icon: Mail,          tab: "Swipe Copy" as Tab },
    { label: "Generate Ads",      key: "ads",      icon: Megaphone,     tab: "Ads" as Tab },
    { label: "Build Bridge Page", key: "bridge",   icon: LayoutTemplate, tab: "Bridge Page" as Tab },
  ] as const;

  return (
    <>
      <AppNav />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <Link href="/affiliate" className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> All Offers
        </Link>

        {/* Header */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black border ${PLATFORM_BADGE[offer.platform]}`}>
                  {offer.platform.toUpperCase()}
                </span>
                {offer.niche && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-white/[0.05] text-white/50 border border-white/[0.1]">
                    <Tag className="w-2.5 h-2.5" />{offer.niche}
                  </span>
                )}

                {/* Status dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowStatusMenu((v) => !v)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-black border ${STATUS_BADGE[offer.status]} cursor-pointer hover:opacity-80 transition`}
                  >
                    {offer.status.toUpperCase()}
                    <ChevronDown className="w-2.5 h-2.5" />
                  </button>
                  {showStatusMenu && (
                    <div className="absolute top-full left-0 mt-1 rounded-xl border border-white/10 bg-[#0d1525] overflow-hidden z-50 shadow-2xl min-w-[140px]">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => { void patchOffer({ status: s }); setShowStatusMenu(false); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-white/5 transition ${STATUS_BADGE[s]}`}
                        >
                          {offer.status === s && <Check className="w-3 h-3" />}
                          {offer.status !== s && <div className="w-3" />}
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <h1 className="text-2xl font-black text-white leading-tight">{offer.name}</h1>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-2">
            <StatPill label="Commission" value={offer.commission} />
            <StatPill label="Gravity" value={offer.gravity} />
            <StatPill label="EPC" value={offer.epc} />
            <StatPill label="Conv. Rate" value={offer.convRate} />
            <StatPill label="Cookie" value={offer.cookieDuration} />
          </div>
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap gap-2 mb-6">
          {ACTION_BUTTONS.map(({ label, key, icon: Icon, tab }) => (
            <button
              key={key}
              onClick={() => { void runAction(key); setActiveTab(tab); }}
              disabled={running === key}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-bold text-white/60 hover:text-white hover:bg-white/[0.07] hover:border-white/15 transition disabled:opacity-40"
            >
              {running === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
              {label}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/[0.02] rounded-2xl border border-white/[0.06] mb-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-fit px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${activeTab === tab ? "bg-white/[0.06] text-white" : "text-white/40 hover:text-white/60"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "Overview" && (
          <TabOverview offer={offer} onNotesBlur={(notes) => void patchOffer({ notes })} />
        )}
        {activeTab === "Analysis" && (
          <TabAnalysis offer={offer} onRunAnalysis={() => void runAction("analyze")} running={running === "analyze"} />
        )}
        {activeTab === "Funnel" && (
          <TabFunnel offer={offer} onGenerate={() => void runAction("funnel")} running={running === "funnel"} />
        )}
        {activeTab === "Swipe Copy" && (
          <TabSwipe offer={offer} onGenerate={() => void runAction("swipe")} running={running === "swipe"} />
        )}
        {activeTab === "Ads" && (
          <TabAds offer={offer} onGenerate={() => void runAction("ads")} running={running === "ads"} />
        )}
        {activeTab === "Bridge Page" && (
          <TabBridgePage offer={offer} onGenerate={() => void runAction("bridge")} running={running === "bridge"} />
        )}
      </main>
    </>
  );
}
