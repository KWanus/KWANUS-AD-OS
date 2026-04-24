"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import AppNav from "@/components/AppNav";
import DatabaseFallbackNotice from "@/components/DatabaseFallbackNotice";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft, Copy, Check, Loader2, ChevronDown,
  Sparkles, Zap, AlertTriangle, DollarSign, TrendingUp, Tag,
  BarChart2, Package, ExternalLink, Globe, FileText, Mail,
  Megaphone, CheckCircle2, XCircle, Users, ShoppingCart,
  ChevronRight, Percent, AlertOctagon,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ProductStatus = "researching" | "testing" | "winning" | "scaling" | "dead";

interface ScoreBreakdown {
  demand: number;
  competition: number;
  trend: number;
  margin: number;
}

interface PricingTier {
  label: string;
  cogs: number;
  retail: number;
  profit: number;
  marginPct: number;
  breakEvenRoas: number;
}

interface ProductAnalysis {
  verdict: "winner" | "potential" | "pass";
  reason?: string;
  pricingTiers?: PricingTier[];
  targetAudience?: {
    age?: string;
    gender?: string;
    interests?: string[];
    pain?: string;
    desire?: string;
  };
  topAngles?: string[];
  riskFactors?: string[];
  upsellOpportunities?: string[];
  seasonality?: string;
}

interface StoreContent {
  seoTitle?: string;
  seoDescription?: string;
  mainTitle?: string;
  shortDescription?: string;
  bullets?: string[];
  fullDescription?: string;
  faqs?: { question: string; answer: string }[];
  specifications?: { key: string; value: string }[];
  shippingText?: string;
  guaranteeText?: string;
}

interface AdCreative {
  hooks?: string[];
  primaryTexts?: string[];
  thumbnailConcepts?: { concept: string; style: string }[];
  scripts?: { hook: string; demo: string; proof: string; cta: string }[];
  trendingSounds?: string[];
  hashtags?: string[];
  searchAds?: { headline1: string; headline2: string; description: string }[];
  shoppingTitle?: string;
  shoppingDesc?: string;
  ugcBrief?: {
    creatorType?: string;
    scriptOutline?: string[];
    deliverables?: string[];
    donts?: string[];
  };
}

interface AdAnglesJson {
  facebook?: AdCreative;
  tiktok?: AdCreative;
  google?: AdCreative;
  ugcBrief?: AdCreative["ugcBrief"];
}

interface EmailCard {
  delay: string;
  subject: string;
  previewText?: string;
  body: string;
}

interface EmailFlows {
  abandonedCart?: EmailCard[];
  postPurchase?: EmailCard[];
  winBack?: EmailCard[];
}

interface DropshipProduct {
  id: string;
  name: string;
  niche: string;
  status: ProductStatus;
  supplierUrl?: string;
  supplierName?: string;
  supplierPrice?: number;
  shippingCost?: number;
  suggestedRetail?: number;
  winnerScore?: number;
  scoreBreakdown?: ScoreBreakdown;
  notes?: string;
  productJson?: ProductAnalysis;
  storeJson?: StoreContent;
  adAnglesJson?: AdAnglesJson;
  emailsJson?: EmailFlows;
  createdAt?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<ProductStatus, string> = {
  researching: "bg-white/10 text-white/50 border-white/20",
  testing:     "bg-amber-500/15 text-amber-400 border-amber-500/30",
  winning:     "bg-green-500/15 text-green-400 border-green-500/30",
  scaling:     "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  dead:        "bg-red-500/15 text-red-400 border-red-500/30",
};

const STATUSES: ProductStatus[] = ["researching", "testing", "winning", "scaling", "dead"];

const TABS = ["Analysis", "Store Content", "Ad Creatives", "Email Flows", "Suppliers"] as const;
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

// ─── Winner Score Ring ──────────────────────────────────────────────────────────

function WinnerRing({ score }: { score: number }) {
  const color = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const glow = score >= 75 ? "#10b98160" : score >= 50 ? "#f59e0b60" : "#ef444460";
  const circumference = 2 * Math.PI * 42;
  const dash = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="42"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${glow})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white">{score}</span>
          <span className="text-[8px] font-black uppercase tracking-widest text-white/30">score</span>
        </div>
      </div>
    </div>
  );
}

// ─── Score Bar ─────────────────────────────────────────────────────────────────

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex-1 min-w-[100px]">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{label}</span>
        <span className="text-xs font-black text-white/60">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${value}%`, transition: "width 0.6s ease" }}
        />
      </div>
    </div>
  );
}

// ─── Profit Calculator ─────────────────────────────────────────────────────────

function ProfitCalc({ supplierPrice = 0, shipping = 0, suggestedRetail = 0 }: {
  supplierPrice?: number;
  shipping?: number;
  suggestedRetail?: number;
}) {
  const [retail, setRetail] = useState(suggestedRetail);
  const [adSpend, setAdSpend] = useState(15);
  const cogs = supplierPrice + shipping;
  const profit = retail - cogs - adSpend;
  const margin = retail > 0 ? ((profit / retail) * 100).toFixed(1) : "0.0";
  const roas = adSpend > 0 ? (retail / adSpend).toFixed(2) : "0.00";
  const breakEvenRoas = adSpend > 0 && retail > cogs ? (retail / (retail - cogs)).toFixed(2) : "—";

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-4 h-4 text-green-400" />
        <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Profit Calculator</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1.5 block">Retail Price ($)</label>
          <input
            type="number"
            value={retail}
            onChange={(e) => setRetail(Number(e.target.value))}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/40 transition"
          />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1.5 block">Ad Spend per Sale ($)</label>
          <input
            type="number"
            value={adSpend}
            onChange={(e) => setAdSpend(Number(e.target.value))}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/40 transition"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "COGS", value: `$${cogs.toFixed(2)}`, color: "text-red-400" },
          { label: "Profit", value: `$${profit.toFixed(2)}`, color: profit >= 0 ? "text-green-400" : "text-red-400" },
          { label: "Margin", value: `${margin}%`, color: "text-cyan-400" },
          { label: "Break-Even ROAS", value: breakEvenRoas, color: "text-amber-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex flex-col items-center p-3 bg-white/[0.02] rounded-xl border border-white/[0.05]">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-1">{label}</span>
            <span className={`text-sm font-black ${color}`}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Analysis ─────────────────────────────────────────────────────────────

function TabAnalysis({ product, onRunAnalysis, running }: {
  product: DropshipProduct;
  onRunAnalysis: () => void;
  running: boolean;
}) {
  const a = product.productJson;

  if (!a) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <BarChart2 className="w-10 h-10 text-white/10" />
        <p className="text-sm text-white/30">No analysis yet</p>
        <button
          onClick={onRunAnalysis}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border border-cyan-500/30 hover:border-cyan-400/50 text-sm font-bold text-white transition disabled:opacity-40"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Run Full Analysis
        </button>
      </div>
    );
  }

  const verdictMap = {
    winner:    { bg: "bg-green-500/10 border-green-500/30", text: "text-green-400", label: "WINNER", icon: CheckCircle2 },
    potential: { bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400", label: "POTENTIAL", icon: AlertTriangle },
    pass:      { bg: "bg-red-500/10 border-red-500/30",   text: "text-red-400",   label: "PASS",    icon: XCircle },
  };
  const vd = verdictMap[a.verdict] ?? verdictMap.potential;
  const VdIcon = vd.icon;

  return (
    <div className="space-y-5">
      {/* Verdict */}
      <div className={`${vd.bg} border rounded-2xl p-5`}>
        <div className="flex items-center gap-3 mb-2">
          <VdIcon className={`w-5 h-5 ${vd.text}`} />
          <span className={`text-lg font-black ${vd.text}`}>{vd.label}</span>
        </div>
        {a.reason && <p className="text-sm text-white/60 leading-relaxed">{a.reason}</p>}
        {a.seasonality && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.05] border border-white/10">
            <Tag className="w-3 h-3 text-white/40" />
            <span className="text-xs font-bold text-white/60">Seasonality: <span className="text-white">{a.seasonality}</span></span>
          </div>
        )}
      </div>

      {/* Pricing breakdown */}
      {a.pricingTiers && a.pricingTiers.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-green-400" />
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Pricing Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left border-b border-white/[0.06]">
                  {["Tier", "COGS", "Retail", "Profit", "Margin", "Break-Even ROAS"].map((h) => (
                    <th key={h} className="pb-2 pr-4 text-[10px] font-black uppercase tracking-widest text-white/25">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {a.pricingTiers.map((tier, i) => (
                  <tr key={i}>
                    <td className="py-2.5 pr-4 font-bold text-white/70 capitalize">{tier.label}</td>
                    <td className="py-2.5 pr-4 text-white/50">${tier.cogs.toFixed(2)}</td>
                    <td className="py-2.5 pr-4 text-white/70 font-semibold">${tier.retail.toFixed(2)}</td>
                    <td className="py-2.5 pr-4 text-green-400 font-bold">${tier.profit.toFixed(2)}</td>
                    <td className="py-2.5 pr-4 text-cyan-400 font-bold">{tier.marginPct.toFixed(1)}%</td>
                    <td className="py-2.5 text-amber-400 font-bold">{tier.breakEvenRoas.toFixed(2)}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Target audience */}
      {a.targetAudience && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Target Audience</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {a.targetAudience.age && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1">Age</p>
                <p className="text-xs text-white/60">{a.targetAudience.age}</p>
              </div>
            )}
            {a.targetAudience.gender && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1">Gender</p>
                <p className="text-xs text-white/60">{a.targetAudience.gender}</p>
              </div>
            )}
            {a.targetAudience.pain && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1">Pain</p>
                <p className="text-xs text-white/60 leading-relaxed">{a.targetAudience.pain}</p>
              </div>
            )}
            {a.targetAudience.desire && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1">Desire</p>
                <p className="text-xs text-white/60 leading-relaxed">{a.targetAudience.desire}</p>
              </div>
            )}
            {a.targetAudience.interests && a.targetAudience.interests.length > 0 && (
              <div className="col-span-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-2">Interests</p>
                <div className="flex flex-wrap gap-1.5">
                  {a.targetAudience.interests.map((int, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">{int}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top angles */}
      {a.topAngles && a.topAngles.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Top Angles</h3>
          </div>
          <ol className="space-y-2">
            {a.topAngles.map((angle, i) => (
              <li key={i} className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                <span className="text-[10px] font-black text-white/25 mt-0.5 w-5 shrink-0">{i + 1}.</span>
                <p className="flex-1 text-xs text-white/70">{angle}</p>
                <CopyButton text={angle} size="xs" />
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Risk factors */}
      {a.riskFactors && a.riskFactors.length > 0 && (
        <div className="bg-red-500/[0.04] border border-red-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertOctagon className="w-4 h-4 text-red-400" />
            <h3 className="text-xs font-black uppercase tracking-widest text-red-400/70">Risk Factors</h3>
          </div>
          <div className="space-y-2">
            {a.riskFactors.map((risk, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-red-500/[0.06] rounded-xl border border-red-500/15">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs text-white/60">{risk}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upsells */}
      {a.upsellOpportunities && a.upsellOpportunities.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <ChevronRight className="w-4 h-4 text-green-400" />
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Upsell Opportunities</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {a.upsellOpportunities.map((upsell, i) => (
              <span key={i} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                {upsell}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Store Content ────────────────────────────────────────────────────────

function TabStoreContent({ product, onGenerate, running }: {
  product: DropshipProduct;
  onGenerate: () => void;
  running: boolean;
}) {
  const [editTitle, setEditTitle] = useState<string | null>(null);
  const s = product.storeJson;

  if (!s) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <FileText className="w-10 h-10 text-white/10" />
        <p className="text-sm text-white/30">No store content generated yet</p>
        <button
          onClick={onGenerate}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border border-blue-500/30 hover:border-blue-400/50 text-sm font-bold text-white transition disabled:opacity-40"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Generate Store Content
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* SEO */}
      {(s.seoTitle || s.seoDescription) && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-4">SEO</h3>
          {s.seoTitle && (
            <div className="mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1.5">Title</p>
              <div className="flex items-center gap-2 p-3 bg-white/[0.02] rounded-xl border border-white/[0.05]">
                <p className="flex-1 text-xs text-white/70 font-mono">{s.seoTitle}</p>
                <CopyButton text={s.seoTitle} size="xs" />
              </div>
            </div>
          )}
          {s.seoDescription && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1.5">Description</p>
              <div className="flex items-start gap-2 p-3 bg-white/[0.02] rounded-xl border border-white/[0.05]">
                <p className="flex-1 text-xs text-white/60 leading-relaxed">{s.seoDescription}</p>
                <CopyButton text={s.seoDescription} size="xs" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main title (inline editable) */}
      {s.mainTitle && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-2">Product Title</p>
          {editTitle !== null ? (
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={() => setEditTitle(null)}
              className="w-full text-xl font-black text-white bg-transparent border-b border-cyan-500 outline-none pb-1"
            />
          ) : (
            <button onClick={() => setEditTitle(s.mainTitle ?? "")} className="group w-full text-left">
              <h2 className="text-xl font-black text-white group-hover:text-cyan-300 transition-colors">{s.mainTitle}</h2>
            </button>
          )}
        </div>
      )}

      {/* Short description */}
      {s.shortDescription && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/25">Short Description</p>
            <CopyButton text={s.shortDescription} size="xs" />
          </div>
          <p className="text-sm text-white/60 leading-relaxed">{s.shortDescription}</p>
        </div>
      )}

      {/* Bullet points */}
      {s.bullets && s.bullets.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/25">Bullet Points</p>
            <button
              onClick={() => void navigator.clipboard.writeText(s.bullets!.map((b, i) => `${i + 1}. ${b}`).join("\n")).then(() => toast.success("Copied!"))}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] font-bold text-white/40 hover:text-white transition"
            >
              <Copy className="w-3 h-3" /> Copy All
            </button>
          </div>
          <ol className="space-y-2">
            {s.bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-3 p-2.5 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                <span className="text-[10px] font-black text-white/25 mt-0.5 w-4 shrink-0">{i + 1}.</span>
                <p className="flex-1 text-xs text-white/70">{bullet}</p>
                <CopyButton text={bullet} size="xs" />
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Full description */}
      {s.fullDescription && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/25">Full Description</p>
            <CopyButton text={s.fullDescription} />
          </div>
          <div className="text-xs text-white/60 leading-relaxed whitespace-pre-wrap">{s.fullDescription}</div>
        </div>
      )}

      {/* Specs */}
      {s.specifications && s.specifications.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-3">Specifications</p>
          <div className="divide-y divide-white/[0.04]">
            {s.specifications.map((spec, i) => (
              <div key={i} className="flex justify-between py-2.5 text-xs">
                <span className="text-white/40 font-semibold">{spec.key}</span>
                <span className="text-white/70">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQs */}
      {s.faqs && s.faqs.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-3">FAQ</p>
          <div className="space-y-2">
            {s.faqs.map((faq, i) => (
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

      {/* Shipping + Guarantee */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {s.shippingText && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-2">Shipping</p>
            <p className="text-xs text-white/60 leading-relaxed">{s.shippingText}</p>
          </div>
        )}
        {s.guaranteeText && (
          <div className="bg-green-500/[0.04] border border-green-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-green-400/70">Guarantee</p>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">{s.guaranteeText}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Ad Creatives ─────────────────────────────────────────────────────────

function TabAdCreatives({ product, onGenerate, running }: {
  product: DropshipProduct;
  onGenerate: () => void;
  running: boolean;
}) {
  const [adTab, setAdTab] = useState<"Facebook" | "TikTok" | "Google" | "UGC Brief">("Facebook");
  const ads = product.adAnglesJson;

  if (!ads) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Megaphone className="w-10 h-10 text-white/10" />
        <p className="text-sm text-white/30">No ad creatives generated yet</p>
        <button
          onClick={onGenerate}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/30 hover:border-indigo-400/50 text-sm font-bold text-white transition disabled:opacity-40"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
          Generate Ads
        </button>
      </div>
    );
  }

  const AD_TABS = ["Facebook", "TikTok", "Google", "UGC Brief"] as const;
  const data = adTab === "UGC Brief" ? null : ads[adTab.toLowerCase() as "facebook" | "tiktok" | "google"];
  const ugc = ads.ugcBrief ?? (ads.tiktok?.ugcBrief ? ads.tiktok.ugcBrief : undefined);

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] w-fit overflow-x-auto">
        {AD_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setAdTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${adTab === t ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white/60"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {adTab === "UGC Brief" ? (
        ugc ? (
          <div className="space-y-5">
            {ugc.creatorType && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-2">Creator Type</p>
                <p className="text-sm font-bold text-white">{ugc.creatorType}</p>
              </div>
            )}
            {ugc.scriptOutline && ugc.scriptOutline.length > 0 && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-3">Script Outline</p>
                <ol className="space-y-2">
                  {ugc.scriptOutline.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 p-2.5 bg-white/[0.02] rounded-xl border border-white/[0.04] text-xs text-white/65">
                      <span className="font-black text-white/25 w-5 shrink-0">{i + 1}.</span>{step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {ugc.deliverables && ugc.deliverables.length > 0 && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-3">Deliverables</p>
                <ul className="space-y-2">
                  {ugc.deliverables.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/65">
                      <Check className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />{d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {ugc.donts && ugc.donts.length > 0 && (
              <div className="bg-red-500/[0.04] border border-red-500/20 rounded-2xl p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-400/60 mb-3">Don&apos;ts</p>
                <ul className="space-y-2">
                  {ugc.donts.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                      <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />{d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-xs text-white/20 py-10">No UGC brief available.</p>
        )
      ) : !data ? (
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
              {data.thumbnailConcepts && data.thumbnailConcepts.length > 0 && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">Thumbnail Concepts</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.thumbnailConcepts.map((tc, i) => (
                      <div key={i} className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.05]">
                        <span className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black bg-purple-500/15 text-purple-400 border border-purple-500/25 mb-2">{tc.style}</span>
                        <p className="text-xs text-white/60">{tc.concept}</p>
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
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-black uppercase text-white/30">Script {i + 1}</span>
                          <CopyButton text={`Hook: ${sc.hook}\n\nDemo: ${sc.demo}\n\nProof: ${sc.proof}\n\nCTA: ${sc.cta}`} size="xs" />
                        </div>
                        {[
                          { label: "Hook", val: sc.hook, color: "text-pink-400" },
                          { label: "Demo", val: sc.demo, color: "text-white/60" },
                          { label: "Proof", val: sc.proof, color: "text-cyan-400" },
                          { label: "CTA", val: sc.cta, color: "text-green-400" },
                        ].map(({ label, val, color }) => (
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
              {((data.trendingSounds && data.trendingSounds.length > 0) || (data.hashtags && data.hashtags.length > 0)) && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                  {data.trendingSounds && data.trendingSounds.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-2">Trending Sounds</p>
                      <div className="flex flex-wrap gap-2">
                        {data.trendingSounds.map((s, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {data.hashtags && data.hashtags.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-2">Hashtags</p>
                      <div className="flex flex-wrap gap-2">
                        {data.hashtags.map((tag, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Google-specific */}
          {adTab === "Google" && (
            <>
              {data.searchAds && data.searchAds.length > 0 && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">Search Ads</h3>
                  <div className="space-y-3">
                    {data.searchAds.map((ad, i) => (
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

// ─── Tab: Email Flows ──────────────────────────────────────────────────────────

function TabEmailFlows({ product, onGenerate, running }: {
  product: DropshipProduct;
  onGenerate: () => void;
  running: boolean;
}) {
  const [emailTab, setEmailTab] = useState<"Abandoned Cart" | "Post-Purchase" | "Win-Back">("Abandoned Cart");
  const emails = product.emailsJson;

  if (!emails) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Mail className="w-10 h-10 text-white/10" />
        <p className="text-sm text-white/30">No email flows generated yet</p>
        <button
          onClick={onGenerate}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border border-blue-500/30 hover:border-blue-400/50 text-sm font-bold text-white transition disabled:opacity-40"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          Generate Email Flows
        </button>
      </div>
    );
  }

  const EMAIL_TABS = ["Abandoned Cart", "Post-Purchase", "Win-Back"] as const;
  const flowMap: Record<string, EmailCard[] | undefined> = {
    "Abandoned Cart": emails.abandonedCart,
    "Post-Purchase": emails.postPurchase,
    "Win-Back": emails.winBack,
  };
  const items = flowMap[emailTab] ?? [];

  const DELAY_COLORS: Record<string, string> = {
    "1h": "bg-amber-500/15 text-amber-400 border-amber-500/25",
    "24h": "bg-blue-500/15 text-blue-400 border-blue-500/25",
    "48h": "bg-purple-500/15 text-purple-400 border-purple-500/25",
    "3d": "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
    "7d": "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
    "14d": "bg-green-500/15 text-green-400 border-green-500/25",
    "30d": "bg-white/10 text-white/50 border-white/20",
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] w-fit">
        {EMAIL_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setEmailTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${emailTab === t ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white/60"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="text-center text-xs text-white/20 py-10">No emails in this flow.</p>
      ) : (
        <div className="space-y-3">
          {items.map((email, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black border ${DELAY_COLORS[email.delay] ?? "bg-white/10 text-white/50 border-white/20"}`}>
                  {email.delay}
                </span>
                <CopyButton text={`Subject: ${email.subject}\nPreview: ${email.previewText ?? ""}\n\n${email.body}`} />
              </div>
              <p className="text-sm font-bold text-white mb-1">{email.subject}</p>
              {email.previewText && (
                <p className="text-[11px] text-white/35 mb-3 italic">{email.previewText}</p>
              )}
              <p className="text-xs text-white/55 leading-relaxed whitespace-pre-wrap">{email.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Suppliers ────────────────────────────────────────────────────────────

function TabSuppliers({ product, onPatch }: {
  product: DropshipProduct;
  onPatch: (body: Partial<DropshipProduct>) => void;
}) {
  const [supplierPrice, setSupplierPrice] = useState(product.supplierPrice ?? 0);
  const [shipping, setShipping] = useState(product.shippingCost ?? 0);
  const [notes, setNotes] = useState(product.notes ?? "");

  return (
    <div className="space-y-5">
      {/* Supplier info */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-4">Supplier</h3>
        {product.supplierName && (
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-white/[0.05] text-white/70 border border-white/[0.1]">
              <Package className="w-3.5 h-3.5 mr-1.5 text-white/30" />
              {product.supplierName}
            </span>
          </div>
        )}
        {product.supplierUrl && (
          <a
            href={product.supplierUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-xs text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/30 transition mb-4"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate font-mono">{product.supplierUrl}</span>
          </a>
        )}

        {/* Editable price fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1.5 block">Supplier Price ($)</label>
            <input
              type="number"
              value={supplierPrice}
              onChange={(e) => setSupplierPrice(Number(e.target.value))}
              onBlur={() => onPatch({ supplierPrice })}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/40 transition"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1.5 block">Shipping ($)</label>
            <input
              type="number"
              value={shipping}
              onChange={(e) => setShipping(Number(e.target.value))}
              onBlur={() => onPatch({ shippingCost: shipping })}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/40 transition"
            />
          </div>
        </div>
      </div>

      {/* Profit calculator */}
      <ProfitCalc
        supplierPrice={supplierPrice}
        shipping={shipping}
        suggestedRetail={product.suggestedRetail}
      />

      {/* Notes */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => onPatch({ notes })}
          placeholder="Supplier notes, shipping times, MOQ, contacts..."
          rows={5}
          className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2.5 text-xs text-white/70 placeholder-white/20 focus:outline-none focus:border-cyan-500/40 transition resize-none"
        />
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DropshipProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<DropshipProduct | null>(null);
  const [databaseUnavailable, setDatabaseUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Analysis");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [running, setRunning] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/dropship/products/${id}`)
      .then((r) => r.json() as Promise<{ ok: boolean; product?: DropshipProduct | null; databaseUnavailable?: boolean }>)
      .then((data) => {
        setDatabaseUnavailable(Boolean(data.databaseUnavailable));
        if (data.ok && data.product) setProduct(data.product);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const patchProduct = useCallback(async (body: Partial<DropshipProduct>) => {
    try {
      const res = await fetch(`/api/dropship/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { ok: boolean; product?: DropshipProduct };
      if (data.ok && data.product) setProduct(data.product);
    } catch {
      toast.error("Failed to save");
    }
  }, [id]);

  async function runAction(action: "analyze" | "store-content" | "ads" | "emails") {
    const endpointMap: Record<string, string> = {
      analyze:       "/api/dropship/products/analyze",
      "store-content": "/api/dropship/products/store-content",
      ads:           "/api/dropship/products/ads/generate",
      emails:        "/api/dropship/products/emails/generate",
    };
    setRunning(action);
    try {
      const res = await fetch(endpointMap[action], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id }),
      });
      const data = await res.json() as { ok: boolean; product?: DropshipProduct; error?: string };
      if (data.ok && data.product) {
        setProduct(data.product);
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

  if (!product) {
    return (
      <>
        <AppNav />
        <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center gap-4 px-4">
          <DatabaseFallbackNotice visible={databaseUnavailable} />
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-8">
            <AlertTriangle className="w-8 h-8 text-red-400/50" />
            <p className="text-white/40">{databaseUnavailable ? "Product data is temporarily unavailable" : "Product not found"}</p>
            <Link href="/dropship" className="text-sm text-cyan-400 hover:text-cyan-300">← Back to Dropship</Link>
          </div>
        </div>
      </>
    );
  }

  const sb = product.scoreBreakdown;
  const ACTION_BUTTONS = [
    { label: "Run Analysis",   key: "analyze",        icon: BarChart2,  tab: "Analysis" as Tab },
    { label: "Store Content",  key: "store-content",  icon: FileText,   tab: "Store Content" as Tab },
    { label: "Generate Ads",   key: "ads",            icon: Megaphone,  tab: "Ad Creatives" as Tab },
    { label: "Email Flows",    key: "emails",         icon: Mail,       tab: "Email Flows" as Tab },
  ] as const;

  return (
    <>
      <AppNav />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <Link href="/dropship" className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> All Products
        </Link>

        {/* Header */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-6 mb-5">
            {/* Winner ring */}
            {product.winnerScore !== undefined && (
              <WinnerRing score={product.winnerScore} />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {product.niche && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-white/[0.05] text-white/50 border border-white/[0.1]">
                    <Tag className="w-2.5 h-2.5" />{product.niche}
                  </span>
                )}

                {/* Status dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowStatusMenu((v) => !v)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-black border ${STATUS_BADGE[product.status]} cursor-pointer hover:opacity-80 transition`}
                  >
                    {product.status.toUpperCase()}
                    <ChevronDown className="w-2.5 h-2.5" />
                  </button>
                  {showStatusMenu && (
                    <div className="absolute top-full left-0 mt-1 rounded-xl border border-white/10 bg-[#020509] overflow-hidden z-50 shadow-2xl min-w-[140px]">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => { void patchProduct({ status: s }); setShowStatusMenu(false); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-white/5 transition ${STATUS_BADGE[s]}`}
                        >
                          {product.status === s && <Check className="w-3 h-3" />}
                          {product.status !== s && <div className="w-3" />}
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <h1 className="text-2xl font-black text-white leading-tight mb-4">{product.name}</h1>

              {/* Score breakdown bars */}
              {sb && (
                <div className="flex flex-wrap gap-4">
                  <ScoreBar label="Demand" value={sb.demand} color="bg-cyan-500" />
                  <ScoreBar label="Competition" value={sb.competition} color="bg-purple-500" />
                  <ScoreBar label="Trend" value={sb.trend} color="bg-amber-500" />
                  <ScoreBar label="Margin" value={sb.margin} color="bg-green-500" />
                </div>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/[0.05]">
            {[
              { label: "Supplier Price", value: product.supplierPrice !== undefined ? `$${product.supplierPrice.toFixed(2)}` : null },
              { label: "Shipping", value: product.shippingCost !== undefined ? `$${product.shippingCost.toFixed(2)}` : null },
              { label: "Suggested Retail", value: product.suggestedRetail !== undefined ? `$${product.suggestedRetail.toFixed(2)}` : null },
              {
                label: "Profit/Unit",
                value: (product.supplierPrice !== undefined && product.shippingCost !== undefined && product.suggestedRetail !== undefined)
                  ? `$${(product.suggestedRetail - product.supplierPrice - product.shippingCost).toFixed(2)}`
                  : null,
              },
              {
                label: "Break-Even ROAS",
                value: (product.supplierPrice !== undefined && product.shippingCost !== undefined && product.suggestedRetail !== undefined && product.suggestedRetail > 0)
                  ? `${(product.suggestedRetail / (product.suggestedRetail - product.supplierPrice - product.shippingCost)).toFixed(2)}x`
                  : null,
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-0.5">{label}</span>
                <span className="text-sm font-black text-white">{value ?? "—"}</span>
              </div>
            ))}
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
        {activeTab === "Analysis" && (
          <TabAnalysis product={product} onRunAnalysis={() => void runAction("analyze")} running={running === "analyze"} />
        )}
        {activeTab === "Store Content" && (
          <TabStoreContent product={product} onGenerate={() => void runAction("store-content")} running={running === "store-content"} />
        )}
        {activeTab === "Ad Creatives" && (
          <TabAdCreatives product={product} onGenerate={() => void runAction("ads")} running={running === "ads"} />
        )}
        {activeTab === "Email Flows" && (
          <TabEmailFlows product={product} onGenerate={() => void runAction("emails")} running={running === "emails"} />
        )}
        {activeTab === "Suppliers" && (
          <TabSuppliers product={product} onPatch={(body) => void patchProduct(body)} />
        )}
      </main>
    </>
  );
}
