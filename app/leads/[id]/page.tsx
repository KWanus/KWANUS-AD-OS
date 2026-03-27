"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import AppNav from "@/components/AppNav";
import DatabaseFallbackNotice from "@/components/DatabaseFallbackNotice";
import Link from "next/link";
import {
  ArrowLeft, Globe, Phone, MapPin, Star, Zap, Search, Send, Loader2,
  CheckCircle, AlertCircle, Copy, ExternalLink, Mail, Megaphone,
  Building2, XCircle, BarChart3, User, Layout, ChevronRight,
  MessageSquare, Sparkles, Rocket,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type AnalyzerJson = {
  summary?: string;
  scores?: { design_score?: number; trust_score?: number; clarity_score?: number; cta_score?: number; conversion_score?: number };
  issues?: { title: string; severity: string; reason: string; impact: string }[];
  missed_opportunities?: string[];
  strengths?: string[];
  quick_wins?: string[];
  assumptions?: string[];
};

type ProfileJson = {
  audience?: { primary_audience?: string; secondary_audience?: string; customer_pains?: string[]; customer_desires?: string[]; customer_objections?: string[] };
  brand_direction?: { recommended_tone?: string; trust_style?: string; positioning_angle?: string; offer_angle?: string };
  conversion_strategy?: { primary_cta?: string; secondary_cta?: string; trust_elements_needed?: string[]; recommended_sections?: string[] };
  content_strategy?: { top_hooks?: string[]; top_benefits?: string[]; top_problems_to_call_out?: string[] };
  assumptions?: string[];
};

type WebsiteSection = {
  type: string;
  headline: string;
  body?: string;
  items?: string[] | { question: string; answer: string }[];
  steps?: string[];
  primary_cta?: string;
};

type WebsiteJson = {
  seo?: { title?: string; meta_description?: string };
  hero?: { headline?: string; subheadline?: string; primary_cta?: string; secondary_cta?: string };
  sections?: WebsiteSection[];
  visual_direction?: { style?: string; color_direction?: string; image_prompts?: string[] };
  notes?: { conversion_notes?: string[]; mobile_notes?: string[] };
};

type AdsJson = {
  platforms?: {
    facebook_instagram?: { hooks?: string[]; primary_texts?: string[]; headlines?: string[]; ctas?: string[] };
    google_search?: { headlines?: string[]; descriptions?: string[] };
    short_form_video?: { hooks?: string[]; script_angles?: string[] };
  };
  angles?: { name?: string; focus?: string; why_it_should_work?: string }[];
};

type EmailsJson = {
  outreach_email?: { subject?: string; body?: string };
  follow_ups?: { subject?: string; body?: string }[];
  sms?: { message?: string };
  notes?: { tone?: string; goal?: string };
};

type Lead = {
  id: string;
  name: string;
  niche: string;
  location: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  rating: number | null;
  reviewCount: number | null;
  score: number | null;
  verdict: string | null;
  summary: string | null;
  audience: string | null;
  painPoints: string | null;
  angle: string | null;
  topGaps: string[] | null;
  topStrengths: string[] | null;
  weaknesses: string[] | null;
  analyzerJson: AnalyzerJson | null;
  profileJson: ProfileJson | null;
  websiteJson: WebsiteJson | null;
  adsJson: AdsJson | null;
  emailsJson: EmailsJson | null;
  outreachEmail: { subject: string; body: string; followUp1?: string; followUp2?: string; sms?: string } | null;
  status: string;
  outreachSentAt: string | null;
  emailOpened: boolean;
  emailReplied: boolean;
  notes: string | null;
};

type Tab = "analysis" | "profile" | "website" | "ads" | "emails" | "outreach";

// ── Small helpers ─────────────────────────────────────────────────────────────

function copyText(text: string) {
  void navigator.clipboard.writeText(text);
}

function ScoreRing({ score }: { score: number }) {
  const size = 88; const stroke = 8;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }} />
    </svg>
  );
}

function ScoreBar({ label, value }: { label: string; value: number | undefined }) {
  if (value === undefined) return null;
  const color = value >= 7 ? "bg-emerald-500" : value >= 5 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/40 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value * 10}%`, transition: "width 0.8s ease" }} />
      </div>
      <span className="text-xs font-bold text-white/50 w-6 text-right">{value}</span>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { copyText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1 rounded text-white/20 hover:text-white/60 transition"
    >
      {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function Tag({ text, color = "white" }: { text: string; color?: "red" | "green" | "blue" | "amber" | "white" }) {
  const colors = {
    red: "bg-red-500/10 text-red-400 border-red-500/15",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/15",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/15",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/15",
    white: "bg-white/[0.05] text-white/50 border-white/[0.08]",
  };
  return <span className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold ${colors[color]}`}>{text}</span>;
}

// ── Tab content panels ────────────────────────────────────────────────────────

function AnalysisTab({ lead }: { lead: Lead }) {
  const a = lead.analyzerJson;
  return (
    <div className="space-y-5">
      {/* Score row */}
      {lead.score !== null && (
        <div className="flex items-center gap-6 p-4 bg-white/[0.025] border border-white/[0.07] rounded-2xl">
          <div className="relative shrink-0">
            <ScoreRing score={lead.score} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-xl font-black ${lead.score >= 70 ? "text-emerald-400" : lead.score >= 45 ? "text-amber-400" : "text-red-400"}`}>{lead.score}</span>
              <span className="text-[9px] text-white/30">/100</span>
            </div>
          </div>
          <div>
            <p className={`text-base font-black ${lead.score >= 70 ? "text-emerald-400" : lead.score >= 45 ? "text-amber-400" : "text-red-400"}`}>{lead.verdict}</p>
            <p className="text-xs text-white/40 mt-1 max-w-xs">{a?.summary ?? lead.summary}</p>
          </div>
        </div>
      )}

      {/* Dimension scores */}
      {a?.scores && (
        <div className="p-4 bg-white/[0.025] border border-white/[0.07] rounded-2xl space-y-3">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">Score Breakdown</p>
          <ScoreBar label="Design" value={a.scores.design_score} />
          <ScoreBar label="Trust" value={a.scores.trust_score} />
          <ScoreBar label="Clarity" value={a.scores.clarity_score} />
          <ScoreBar label="CTA Strength" value={a.scores.cta_score} />
          <ScoreBar label="Conversion" value={a.scores.conversion_score} />
        </div>
      )}

      {/* Issues */}
      {a?.issues && a.issues.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Issues Found</p>
          {a.issues.map((issue, i) => (
            <div key={i} className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                  issue.severity === "high" ? "bg-red-500/15 text-red-400" :
                  issue.severity === "medium" ? "bg-amber-500/15 text-amber-400" :
                  "bg-white/[0.05] text-white/30"
                }`}>{issue.severity}</span>
                <span className="text-xs font-bold text-white">{issue.title}</span>
              </div>
              <p className="text-[11px] text-white/40">{issue.reason}</p>
              {issue.impact && <p className="text-[11px] text-amber-400/60 mt-1">Impact: {issue.impact}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Quick wins */}
      {a?.quick_wins && a.quick_wins.length > 0 && (
        <div className="p-4 bg-emerald-500/[0.04] border border-emerald-500/15 rounded-xl">
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3">Quick Wins</p>
          <ul className="space-y-1.5">
            {a.quick_wins.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-white/55">
                <Zap className="w-3 h-3 text-emerald-400/60 shrink-0 mt-0.5" />{w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missed opportunities */}
      {(a?.missed_opportunities ?? lead.topGaps) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 bg-red-500/[0.04] border border-red-500/15 rounded-xl">
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3">Missed Opportunities</p>
            <ul className="space-y-1.5">
              {(a?.missed_opportunities ?? lead.topGaps ?? []).slice(0, 5).map((g, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-white/55">
                  <span className="text-red-400/50 shrink-0">•</span>{g}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 bg-emerald-500/[0.04] border border-emerald-500/15 rounded-xl">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3">Strengths</p>
            <ul className="space-y-1.5">
              {(a?.strengths ?? lead.topStrengths ?? []).slice(0, 5).map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-white/55">
                  <span className="text-emerald-400/50 shrink-0">•</span>{s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileTab({ lead }: { lead: Lead }) {
  const p = lead.profileJson;
  if (!p) return <EmptyState label="profile" />;
  return (
    <div className="space-y-4">
      {/* Audience */}
      <div className="p-5 bg-white/[0.025] border border-white/[0.07] rounded-2xl space-y-4">
        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Audience Profile</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-white/30 mb-1">Primary</p>
            <p className="text-sm font-bold text-white">{p.audience?.primary_audience ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-white/30 mb-1">Secondary</p>
            <p className="text-sm text-white/60">{p.audience?.secondary_audience ?? "—"}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] text-red-400/70 mb-2">Pains</p>
            <ul className="space-y-1">{p.audience?.customer_pains?.map((x, i) => <li key={i} className="text-[11px] text-white/50 flex gap-1.5"><span className="text-red-400/50">•</span>{x}</li>)}</ul>
          </div>
          <div>
            <p className="text-[10px] text-emerald-400/70 mb-2">Desires</p>
            <ul className="space-y-1">{p.audience?.customer_desires?.map((x, i) => <li key={i} className="text-[11px] text-white/50 flex gap-1.5"><span className="text-emerald-400/50">•</span>{x}</li>)}</ul>
          </div>
          <div>
            <p className="text-[10px] text-amber-400/70 mb-2">Objections</p>
            <ul className="space-y-1">{p.audience?.customer_objections?.map((x, i) => <li key={i} className="text-[11px] text-white/50 flex gap-1.5"><span className="text-amber-400/50">•</span>{x}</li>)}</ul>
          </div>
        </div>
      </div>

      {/* Brand direction */}
      <div className="p-5 bg-white/[0.025] border border-white/[0.07] rounded-2xl">
        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">Brand Direction</p>
        <div className="grid grid-cols-2 gap-4">
          {[
            ["Tone", p.brand_direction?.recommended_tone],
            ["Trust Style", p.brand_direction?.trust_style],
            ["Positioning", p.brand_direction?.positioning_angle],
            ["Offer Angle", p.brand_direction?.offer_angle],
          ].map(([label, val]) => val ? (
            <div key={label as string}>
              <p className="text-[10px] text-white/25 mb-1">{label}</p>
              <p className="text-xs text-white/65">{val}</p>
            </div>
          ) : null)}
        </div>
      </div>

      {/* Conversion strategy */}
      <div className="p-5 bg-white/[0.025] border border-white/[0.07] rounded-2xl">
        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">Conversion Strategy</p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-[10px] text-white/25 mb-1">Primary CTA</p>
            <p className="text-sm font-bold text-cyan-400">{p.conversion_strategy?.primary_cta ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-white/25 mb-1">Secondary CTA</p>
            <p className="text-sm font-bold text-white/60">{p.conversion_strategy?.secondary_cta ?? "—"}</p>
          </div>
        </div>
        {p.conversion_strategy?.trust_elements_needed?.length ? (
          <div>
            <p className="text-[10px] text-white/25 mb-2">Trust Elements Needed</p>
            <div className="flex flex-wrap gap-1.5">
              {p.conversion_strategy.trust_elements_needed.map((t, i) => <Tag key={i} text={t} color="blue" />)}
            </div>
          </div>
        ) : null}
      </div>

      {/* Content strategy */}
      {p.content_strategy && (
        <div className="p-5 bg-white/[0.025] border border-white/[0.07] rounded-2xl">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">Content Strategy</p>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-white/25 mb-2">Top Hooks</p>
              <ul className="space-y-1.5">
                {p.content_strategy.top_hooks?.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/60 group">
                    <span className="text-cyan-400/50 shrink-0 mt-0.5">{i + 1}.</span>{h}
                    <CopyButton text={h} />
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] text-white/25 mb-2">Problems to Call Out</p>
              <div className="flex flex-wrap gap-1.5">
                {p.content_strategy.top_problems_to_call_out?.map((t, i) => <Tag key={i} text={t} color="red" />)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WebsiteTab({ lead }: { lead: Lead }) {
  const w = lead.websiteJson;
  const [deploying, setDeploying] = useState(false);
  const [deployedSlug, setDeployedSlug] = useState<string | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);

  if (!w) return <EmptyState label="website structure" />;

  async function handleDeploy() {
    setDeploying(true);
    setDeployError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}/deploy-site`, { method: "POST" });
      const data = await res.json() as { ok: boolean; slug?: string; error?: string };
      if (!data.ok) throw new Error(data.error ?? "Deploy failed");
      setDeployedSlug(data.slug ?? null);
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : "Deploy failed");
    } finally {
      setDeploying(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* SEO */}
      {w.seo && (
        <div className="p-4 bg-white/[0.025] border border-white/[0.07] rounded-2xl">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">SEO</p>
          <p className="text-sm font-bold text-cyan-400">{w.seo.title}</p>
          <p className="text-xs text-white/40 mt-1">{w.seo.meta_description}</p>
        </div>
      )}

      {/* Hero */}
      {w.hero && (
        <div className="p-5 bg-gradient-to-r from-cyan-500/[0.06] to-purple-500/[0.06] border border-white/[0.08] rounded-2xl">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">Hero Section</p>
          <p className="text-xl font-black text-white mb-2">{w.hero.headline}</p>
          <p className="text-sm text-white/55 mb-4">{w.hero.subheadline}</p>
          <div className="flex flex-wrap gap-2">
            {w.hero.primary_cta && <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/25 to-purple-500/25 border border-cyan-500/25 text-sm font-bold text-white">{w.hero.primary_cta}</div>}
            {w.hero.secondary_cta && <div className="px-4 py-2 rounded-xl border border-white/10 text-sm text-white/50">{w.hero.secondary_cta}</div>}
          </div>
        </div>
      )}

      {/* Sections */}
      {w.sections?.map((section, i) => (
        <div key={i} className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 rounded bg-white/[0.05] text-[10px] font-black text-white/30 uppercase">{section.type}</span>
            <p className="text-sm font-bold text-white">{section.headline}</p>
          </div>
          {section.body && <p className="text-xs text-white/50 leading-relaxed mb-2">{section.body}</p>}
          {section.items && <ul className="space-y-1">{section.items.map((x, j) => <li key={j} className="text-xs text-white/55 flex gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-400/50 shrink-0 mt-0.5" />{typeof x === "string" ? x : x.question}</li>)}</ul>}
          {section.steps && <ol className="space-y-1">{section.steps.map((x, j) => <li key={j} className="text-xs text-white/55 flex gap-2"><span className="text-cyan-400/60 font-bold shrink-0">{j + 1}.</span>{x}</li>)}</ol>}
        </div>
      ))}

      {/* Deploy to Himalaya */}
      {deployedSlug ? (
        <div className="p-5 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/25 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <p className="text-sm font-bold text-emerald-400">Site deployed!</p>
          </div>
          <p className="text-xs text-white/50">Your Himalaya site is live and ready.</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/s/${deployedSlug}`}
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition"
            >
              <ExternalLink className="w-3 h-3" />
              View live site
            </Link>
            <Link
              href="/websites"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-xs font-bold text-white/60 hover:bg-white/[0.08] transition"
            >
              <Layout className="w-3 h-3" />
              Edit in Websites
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            onClick={handleDeploy}
            disabled={deploying}
            className="w-full flex items-center gap-2 p-4 rounded-2xl bg-cyan-500/[0.06] border border-cyan-500/20 text-cyan-400 text-sm font-bold hover:bg-cyan-500/[0.1] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deploying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Rocket className="w-4 h-4" />
            )}
            {deploying ? "Deploying..." : "Deploy to Himalaya Site"}
            {!deploying && <ChevronRight className="w-4 h-4 ml-auto" />}
          </button>
          {deployError && (
            <p className="text-xs text-red-400 px-1">{deployError}</p>
          )}
        </div>
      )}
    </div>
  );
}

function AdsTab({ lead }: { lead: Lead }) {
  const a = lead.adsJson;
  if (!a) return <EmptyState label="ad copy" />;
  const { facebook_instagram: fb, google_search: goog, short_form_video: vid } = a.platforms ?? {};
  return (
    <div className="space-y-5">
      {/* Facebook / Instagram */}
      {fb && (
        <div className="p-5 bg-white/[0.025] border border-white/[0.07] rounded-2xl">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Megaphone className="w-3.5 h-3.5 text-blue-400" /> Facebook / Instagram
          </p>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-white/25 mb-2">Scroll-Stopping Hooks</p>
              {fb.hooks?.map((h, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg hover:bg-white/[0.03] group transition">
                  <span className="text-[10px] text-white/20 font-bold mt-0.5 w-4 shrink-0">{i+1}</span>
                  <p className="text-xs text-white/65 flex-1">{h}</p>
                  <CopyButton text={h} />
                </div>
              ))}
            </div>
            <div>
              <p className="text-[10px] text-white/25 mb-2">Primary Texts</p>
              {fb.primary_texts?.map((t, i) => (
                <div key={i} className="p-3 bg-white/[0.02] rounded-lg mb-2 group flex items-start gap-2">
                  <p className="text-xs text-white/55 leading-relaxed flex-1">{t}</p>
                  <CopyButton text={t} />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {fb.headlines?.map((h, i) => <Tag key={i} text={h} color="blue" />)}
            </div>
          </div>
        </div>
      )}

      {/* Google */}
      {goog && (
        <div className="p-5 bg-white/[0.025] border border-white/[0.07] rounded-2xl">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-emerald-400" /> Google Search Ads
          </p>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-white/25 mb-2">Headlines (max 30 chars)</p>
              <div className="flex flex-wrap gap-2">
                {goog.headlines?.map((h, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.03] border border-white/[0.06] rounded-lg">
                    <span className="text-[11px] text-white/60">{h}</span>
                    <CopyButton text={h} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-white/25 mb-2">Descriptions</p>
              {goog.descriptions?.map((d, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 bg-white/[0.02] rounded-lg mb-1.5 group">
                  <p className="text-xs text-white/55 flex-1">{d}</p>
                  <CopyButton text={d} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Short-form video */}
      {vid && (
        <div className="p-5 bg-white/[0.025] border border-white/[0.07] rounded-2xl">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" /> TikTok / Reels
          </p>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-white/25 mb-2">Video Hooks</p>
              {vid.hooks?.map((h, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg hover:bg-white/[0.03] group transition">
                  <span className="text-[10px] text-pink-400/50 font-bold mt-0.5">{i+1}.</span>
                  <p className="text-xs text-white/65 flex-1">{h}</p>
                  <CopyButton text={h} />
                </div>
              ))}
            </div>
            <div>
              <p className="text-[10px] text-white/25 mb-2">Script Angles</p>
              {vid.script_angles?.map((s, i) => (
                <div key={i} className="p-2.5 bg-white/[0.02] rounded-lg mb-1.5 group flex items-start gap-2">
                  <p className="text-xs text-white/55 flex-1">{s}</p>
                  <CopyButton text={s} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Angles */}
      {a.angles && a.angles.length > 0 && (
        <div className="p-5 bg-white/[0.025] border border-white/[0.07] rounded-2xl">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">Campaign Angles</p>
          <div className="space-y-3">
            {a.angles.map((angle, i) => (
              <div key={i} className="p-3 bg-white/[0.02] rounded-xl">
                <p className="text-sm font-bold text-white mb-1">{angle.name}</p>
                <p className="text-xs text-white/50 mb-1">{angle.focus}</p>
                <p className="text-[11px] text-emerald-400/70">{angle.why_it_should_work}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmailsTab({ lead }: { lead: Lead }) {
  const e = lead.emailsJson;
  const legacy = lead.outreachEmail;
  const subject = e?.outreach_email?.subject ?? legacy?.subject ?? "";
  const body = e?.outreach_email?.body ?? legacy?.body ?? "";
  const followUps = e?.follow_ups ?? [];
  const sms = e?.sms?.message ?? legacy?.sms ?? "";

  if (!subject && !body) return <EmptyState label="email copy" />;
  return (
    <div className="space-y-4">
      {/* Outreach email */}
      <div className="p-5 bg-white/[0.025] border border-white/[0.07] rounded-2xl">
        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-blue-400" /> Outreach Email
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="text-[10px] text-white/25 mb-1">Subject</p>
              <p className="text-sm font-bold text-white">{subject}</p>
            </div>
            <CopyButton text={subject} />
          </div>
          <div>
            <p className="text-[10px] text-white/25 mb-2">Body</p>
            <div className="relative">
              <p className="text-xs text-white/60 leading-relaxed whitespace-pre-wrap bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">{body}</p>
              <div className="absolute top-2 right-2"><CopyButton text={body} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* Follow-ups */}
      {followUps.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Follow-Up Sequence</p>
          {followUps.map((fu, i) => (
            <div key={i} className="p-4 bg-white/[0.025] border border-white/[0.07] rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] px-2 py-0.5 bg-white/[0.05] rounded text-white/30 font-bold">Follow-Up #{i + 1}</span>
                <p className="text-xs font-bold text-white/70">{fu.subject}</p>
                <div className="ml-auto"><CopyButton text={`Subject: ${fu.subject}\n\n${fu.body}`} /></div>
              </div>
              <p className="text-xs text-white/45 leading-relaxed whitespace-pre-wrap">{fu.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* SMS */}
      {sms && (
        <div className="p-4 bg-white/[0.025] border border-white/[0.07] rounded-xl">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-green-400" /> SMS
          </p>
          <div className="flex items-start gap-2">
            <p className="text-xs text-white/60 flex-1">{sms}</p>
            <CopyButton text={sms} />
          </div>
        </div>
      )}

      {e?.notes && (
        <div className="flex gap-4 text-xs text-white/30">
          {e.notes.tone && <span><b className="text-white/40">Tone:</b> {e.notes.tone}</span>}
          {e.notes.goal && <span><b className="text-white/40">Goal:</b> {e.notes.goal}</span>}
        </div>
      )}
    </div>
  );
}

function OutreachTab({ lead, onSent }: { lead: Lead; onSent: () => void }) {
  const [toEmail, setToEmail] = useState(lead.email ?? "");
  const [customBody, setCustomBody] = useState(lead.emailsJson?.outreach_email?.body ?? lead.outreachEmail?.body ?? "");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function send() {
    if (!toEmail.trim()) { setMsg({ type: "error", text: "Enter recipient email" }); return; }
    setSending(true);
    const res = await fetch(`/api/leads/${lead.id}/outreach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toEmail, customBody }),
    });
    const data = await res.json() as { ok: boolean; error?: string };
    if (data.ok) { setMsg({ type: "success", text: "Email sent!" }); onSent(); }
    else setMsg({ type: "error", text: data.error ?? "Send failed" });
    setSending(false);
  }

  const subject = lead.emailsJson?.outreach_email?.subject ?? lead.outreachEmail?.subject ?? "";

  return (
    <div className="space-y-5">
      {lead.outreachSentAt && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-400 font-bold">
          <CheckCircle className="w-4 h-4" />
          Outreach sent {new Date(lead.outreachSentAt).toLocaleString()}
          {lead.emailReplied && <span className="ml-2 px-2 py-0.5 bg-emerald-500/20 rounded text-emerald-400">Replied!</span>}
        </div>
      )}

      {msg && (
        <div className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-bold ${msg.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
          {msg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-auto opacity-50 hover:opacity-100"><XCircle className="w-4 h-4" /></button>
        </div>
      )}

      <div className="p-5 bg-white/[0.025] border border-white/[0.07] rounded-2xl space-y-4">
        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Send Outreach</p>

        <div>
          <p className="text-[10px] text-white/25 mb-1">Subject</p>
          <p className="text-sm font-bold text-white">{subject}</p>
        </div>

        <div>
          <p className="text-[10px] text-white/25 mb-2">Email Body (editable)</p>
          <textarea
            value={customBody}
            onChange={(e) => setCustomBody(e.target.value)}
            rows={8}
            className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3 text-xs text-white/70 focus:outline-none focus:border-cyan-500/30 transition resize-none leading-relaxed"
          />
        </div>

        <div className="flex gap-2">
          <input
            type="email"
            value={toEmail}
            onChange={(e) => setToEmail(e.target.value)}
            placeholder="Recipient email address…"
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-blue-500/40 transition"
          />
          <button
            onClick={() => void send()}
            disabled={sending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/20 text-blue-400 text-sm font-bold hover:opacity-90 transition disabled:opacity-40"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send
          </button>
        </div>
      </div>

      {/* Mark as replied */}
      {lead.outreachSentAt && !lead.emailReplied && (
        <button
          onClick={async () => {
            await fetch(`/api/leads/${lead.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ emailReplied: true, status: "replied" }) });
            onSent();
          }}
          className="w-full py-2.5 rounded-xl border border-emerald-500/20 text-emerald-400/70 hover:text-emerald-400 hover:border-emerald-500/40 text-xs font-bold transition"
        >
          Mark as Replied →
        </button>
      )}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center py-16 text-white/20">
      <Zap className="w-8 h-8 mx-auto mb-3 opacity-20" />
      <p className="text-sm">No {label} yet</p>
      <p className="text-xs mt-1 opacity-60">Run analysis then generate assets to see this tab</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [databaseUnavailable, setDatabaseUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("analysis");
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchLead = useCallback(async () => {
    const res = await fetch(`/api/leads/${id}`);
    const data = await res.json() as { ok: boolean; lead: Lead | null; databaseUnavailable?: boolean };
    setDatabaseUnavailable(Boolean(data.databaseUnavailable));
    if (data.ok) setLead(data.lead);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void fetchLead();
    const interval = setInterval(() => {
      void fetchLead();
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchLead]);

  async function analyze() {
    setAnalyzing(true);
    const res = await fetch(`/api/leads/${id}/analyze`, { method: "POST" });
    const data = await res.json() as { ok: boolean; error?: string };
    if (!data.ok) setActionMsg({ type: "error", text: data.error ?? "Analysis failed" });
    await fetchLead();
    setAnalyzing(false);
  }

  async function generate() {
    setGenerating(true);
    setActiveTab("analysis");
    const res = await fetch(`/api/leads/${id}/generate`, { method: "POST" });
    const data = await res.json() as { ok: boolean; error?: string };
    if (data.ok) {
      setActionMsg({ type: "success", text: "All 4 skills complete — assets ready!" });
      setActiveTab("profile");
    } else {
      setActionMsg({ type: "error", text: data.error ?? "Generation failed" });
    }
    await fetchLead();
    setGenerating(false);
  }

  if (loading) return (
    <div className="min-h-screen bg-[#050a14] text-white flex flex-col">
      <AppNav />
      <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/20" /></div>
    </div>
  );

  if (!lead) return (
    <div className="min-h-screen bg-[#050a14] text-white flex flex-col">
      <AppNav />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-3xl space-y-4">
          <DatabaseFallbackNotice visible={databaseUnavailable} />
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-8">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-white/40">{databaseUnavailable ? "Lead data is temporarily unavailable" : "Lead not found"}</p>
            <Link href="/leads" className="text-cyan-400 text-sm hover:underline">← Back to Leads</Link>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs: { key: Tab; label: string; icon: React.ReactNode; available: boolean }[] = [
    { key: "analysis", label: "Analysis",  icon: <BarChart3 className="w-3.5 h-3.5" />,   available: lead.score !== null || !!lead.analyzerJson },
    { key: "profile",  label: "Profile",   icon: <User className="w-3.5 h-3.5" />,         available: !!lead.profileJson },
    { key: "website",  label: "Website",   icon: <Layout className="w-3.5 h-3.5" />,       available: !!lead.websiteJson },
    { key: "ads",      label: "Ads",       icon: <Megaphone className="w-3.5 h-3.5" />,    available: !!lead.adsJson },
    { key: "emails",   label: "Emails",    icon: <Mail className="w-3.5 h-3.5" />,         available: !!lead.emailsJson || !!lead.outreachEmail },
    { key: "outreach", label: "Outreach",  icon: <Send className="w-3.5 h-3.5" />,         available: true },
  ];

  const isProcessing = lead.status === "analyzing" || lead.status === "generating";
  const scoreColor = !lead.score ? "text-white/30" : lead.score >= 70 ? "text-emerald-400" : lead.score >= 45 ? "text-amber-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-20">

        <Link href="/leads" className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Lead Engine
        </Link>

        {actionMsg && (
          <div className={`mb-4 p-3 rounded-xl border flex items-center gap-2 text-sm font-bold ${actionMsg.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
            {actionMsg.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {actionMsg.text}
            <button onClick={() => setActionMsg(null)} className="ml-auto"><XCircle className="w-4 h-4 opacity-50 hover:opacity-100" /></button>
          </div>
        )}

        {/* Business header */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 mb-5 flex items-start gap-4">
          {lead.score !== null ? (
            <div className="relative shrink-0">
              <ScoreRing score={lead.score} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-lg font-black ${scoreColor}`}>{lead.score}</span>
                <span className="text-[9px] text-white/25">/100</span>
              </div>
            </div>
          ) : (
            <div className="w-[88px] h-[88px] rounded-full border-2 border-white/[0.06] flex items-center justify-center shrink-0">
              <Building2 className="w-7 h-7 text-white/20" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-black text-white">{lead.name}</h1>
            {lead.verdict && <p className={`text-sm font-bold mt-0.5 ${scoreColor}`}>{lead.verdict} · <span className="text-white/40 capitalize">{lead.niche}</span></p>}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {lead.address && <span className="flex items-center gap-1 text-xs text-white/35"><MapPin className="w-3 h-3" />{lead.address}</span>}
              {lead.phone && <span className="flex items-center gap-1 text-xs text-white/35"><Phone className="w-3 h-3" />{lead.phone}</span>}
              {lead.rating && <span className="flex items-center gap-1 text-xs text-amber-400/60"><Star className="w-3 h-3" />{lead.rating} ({lead.reviewCount})</span>}
              {lead.website && (
                <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-cyan-400/60 hover:text-cyan-400 transition">
                  <Globe className="w-3 h-3" />{lead.website.replace(/https?:\/\/(www\.)?/, "").slice(0, 35)}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
              {!lead.website && <span className="flex items-center gap-1 text-xs text-red-400/50"><Globe className="w-3 h-3" />No website</span>}
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(lead.status === "new") && (
            <button onClick={() => void analyze()} disabled={analyzing || isProcessing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold hover:bg-blue-500/20 transition disabled:opacity-40">
              {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              Analyze
            </button>
          )}
          {(lead.status === "analyzed" || lead.status === "ready") && (
            <button onClick={() => void generate()} disabled={generating || isProcessing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-bold hover:bg-purple-500/20 transition disabled:opacity-40">
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              {generating ? "Running 4 Skills…" : lead.status === "ready" ? "Regenerate Assets" : "Generate Assets"}
            </button>
          )}
          {isProcessing && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {lead.status === "analyzing" ? "Analyzing site…" : "Running skills: Analyzer → Profile → Website → Ads → Email"}
            </div>
          )}
          {lead.website && (
            <Link href={`/scan?url=${encodeURIComponent(lead.website)}&mode=consultant`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-bold hover:bg-cyan-500/20 transition">
              <Search className="w-3.5 h-3.5" /> Deep Scan
            </Link>
          )}
          <Link href={`/clients/new?name=${encodeURIComponent(lead.name)}&niche=${encodeURIComponent(lead.niche)}&website=${encodeURIComponent(lead.website ?? "")}&phone=${encodeURIComponent(lead.phone ?? "")}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold hover:bg-amber-500/20 transition ml-auto">
            <User className="w-3.5 h-3.5" /> Add to CRM
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto mb-5 pb-1">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-white/[0.07] text-white border border-white/[0.1]"
                  : tab.available
                    ? "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                    : "text-white/15 cursor-default"
              }`}>
              {tab.icon}
              {tab.label}
              {tab.available && activeTab !== tab.key && <div className="w-1 h-1 rounded-full bg-cyan-400/50" />}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "analysis" && <AnalysisTab lead={lead} />}
        {activeTab === "profile"  && <ProfileTab  lead={lead} />}
        {activeTab === "website"  && <WebsiteTab  lead={lead} />}
        {activeTab === "ads"      && <AdsTab      lead={lead} />}
        {activeTab === "emails"   && <EmailsTab   lead={lead} />}
        {activeTab === "outreach" && <OutreachTab lead={lead} onSent={() => void fetchLead()} />}

      </div>
    </div>
  );
}
