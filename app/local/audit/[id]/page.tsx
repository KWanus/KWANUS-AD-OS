"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import DatabaseFallbackNotice from "@/components/DatabaseFallbackNotice";
import { toast } from "sonner";
import {
  ArrowLeft, Loader2, Copy, Check, Sparkles, MapPin, Tag,
  AlertTriangle, ChevronRight, Star, Globe, MessageSquare, FileText,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditFinding {
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  issue: string;
  fix: string;
  impact: string;
}

interface AuditScores {
  overall?: number;
  gmb?: number;
  reviews?: number;
  citations?: number;
  website?: number;
  seo?: number;
}

interface TopPriority {
  title: string;
  impact: string;
  revenueImpact?: string;
}

interface AuditJson {
  scores?: AuditScores;
  findings?: AuditFinding[];
  topPriorities?: TopPriority[];
  competitorAdvantages?: string[];
  quickWins?: string[];
}

interface LocalPackageTier {
  name: string;
  tier: "basic" | "pro" | "elite";
  price: number;
  billingCycle?: string;
  deliverables: string[];
  bestResults?: string;
  timeToResults?: string;
}

interface GmbPost {
  day: number;
  type: string;
  title: string;
  body: string;
  cta: string;
  bestTime: string;
}

interface ReviewTemplate {
  timing: string;
  message: string;
  subject?: string;
  body?: string;
}

interface ReportScoreRow {
  metric: string;
  current: string;
  benchmark: string;
  status: "good" | "warning" | "critical";
}

interface Recommendation {
  priority: number;
  action: string;
  expectedResult: string;
  timeline: string;
}

interface ReportJson {
  title?: string;
  executiveSummary?: string;
  scorecard?: ReportScoreRow[];
  recommendations?: Recommendation[];
  competitorAnalysis?: string;
  investmentSummary?: string;
}

interface LocalAudit {
  id: string;
  businessName: string;
  businessUrl: string | null;
  niche: string;
  location: string;
  overallScore: number | null;
  status: string;
  auditJson: AuditJson | null;
  packagesJson: LocalPackageTier[] | null;
  gmbPostsJson: GmbPost[] | null;
  reviewTemplates: { sms?: ReviewTemplate[]; email?: ReviewTemplate[] } | null;
  reportJson: ReportJson | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SEV_COLORS: Record<string, string> = {
  critical: "text-red-400 bg-red-500/10 border-red-500/20",
  high:     "text-orange-400 bg-orange-500/10 border-orange-500/20",
  medium:   "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  low:      "text-white/40 bg-white/[0.04] border-white/10",
};

const GMB_TYPE_COLORS: Record<string, string> = {
  offer:   "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  update:  "text-blue-400 bg-blue-500/10 border-blue-500/20",
  event:   "text-purple-400 bg-purple-500/10 border-purple-500/20",
  product: "text-green-400 bg-green-500/10 border-green-500/20",
};

const REPORT_STATUS_COLORS: Record<string, string> = {
  good:     "text-green-400",
  warning:  "text-yellow-400",
  critical: "text-red-400",
};

const TABS = ["Audit Findings", "Packages", "GMB Content", "Review System", "SEO Report"];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">{children}</p>;
}

function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    if (label) toast.success(`${label} copied`);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-xs text-white/40 hover:text-white/70 transition">
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
      {label ?? "Copy"}
    </button>
  );
}

// Score ring SVG
function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score));
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 70 ? "#22d3ee" : pct >= 50 ? "#facc15" : "#f87171";

  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} stroke="white" strokeOpacity="0.06" strokeWidth="8" fill="none" />
        <circle
          cx="44" cy="44" r={r}
          stroke={color} strokeWidth="8" fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-white">{score}</span>
        <span className="text-[9px] text-white/30 font-bold">/100</span>
      </div>
    </div>
  );
}

// Score bar
function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? "bg-cyan-400" : value >= 50 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/50 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-bold text-white/60 w-8 text-right">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 1 — Audit Findings
// ---------------------------------------------------------------------------

function AuditFindingsTab({ audit }: { audit: LocalAudit }) {
  const aj = audit.auditJson;
  if (!aj) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="w-10 h-10 text-white/10 mb-3" />
        <p className="text-sm font-bold text-white/30">No audit data yet</p>
      </div>
    );
  }

  const scores = aj.scores ?? {};
  const scoreEntries: [string, number][] = [
    ["Overall",   audit.overallScore ?? scores.overall ?? 0],
    ["GMB",       scores.gmb ?? 0],
    ["Reviews",   scores.reviews ?? 0],
    ["Citations", scores.citations ?? 0],
    ["Website",   scores.website ?? 0],
    ["SEO",       scores.seo ?? 0],
  ];

  const findings = aj.findings ?? [];
  const severityOrder = ["critical", "high", "medium", "low"];
  const grouped = severityOrder.reduce<Record<string, AuditFinding[]>>((acc, sev) => {
    const items = findings.filter((f) => f.severity === sev);
    if (items.length > 0) acc[sev] = items;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Score bars */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <SectionLabel>Score Overview</SectionLabel>
        <div className="space-y-3 mt-3">
          {scoreEntries.map(([label, val]) => (
            <ScoreBar key={label} label={label} value={val} />
          ))}
        </div>
      </div>

      {/* Findings by severity */}
      {Object.entries(grouped).map(([sev, items]) => (
        <div key={sev}>
          <SectionLabel>{sev} issues ({items.length})</SectionLabel>
          <div className="space-y-3">
            {items.map((f, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-white/50 bg-white/[0.06] border border-white/[0.08] rounded-lg px-2 py-0.5">
                    {f.category}
                  </span>
                  <span className={`text-[10px] font-bold border rounded-lg px-2 py-0.5 capitalize ${SEV_COLORS[f.severity] ?? SEV_COLORS.low}`}>
                    {f.severity}
                  </span>
                </div>
                <p className="text-sm font-bold text-white mb-1">{f.issue}</p>
                <p className="text-xs text-white/50 mb-2 leading-relaxed">{f.fix}</p>
                {f.impact && (
                  <p className="text-[11px] text-cyan-400/70">{f.impact}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Top priorities */}
      {aj.topPriorities && aj.topPriorities.length > 0 && (
        <div>
          <SectionLabel>Top Priorities</SectionLabel>
          <div className="space-y-2">
            {aj.topPriorities.map((p, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-black flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{p.title}</p>
                  <p className="text-xs text-white/45 mt-0.5">{p.impact}</p>
                  {p.revenueImpact && (
                    <p className="text-[11px] text-green-400/80 mt-1">{p.revenueImpact}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitor advantages */}
      {aj.competitorAdvantages && aj.competitorAdvantages.length > 0 && (
        <div>
          <SectionLabel>Competitor Advantages</SectionLabel>
          <div className="space-y-1.5">
            {aj.competitorAdvantages.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-white/50">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-400 mt-0.5 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick wins */}
      {aj.quickWins && aj.quickWins.length > 0 && (
        <div>
          <SectionLabel>Quick Wins</SectionLabel>
          <div className="space-y-1.5">
            {aj.quickWins.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-white/50">
                <Check className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2 — Packages
// ---------------------------------------------------------------------------

function PackagesTab({ audit, onRefresh }: { audit: LocalAudit; onRefresh: () => void }) {
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/local/packages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId: audit.id }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) { toast.success("Packages generated"); onRefresh(); }
      else toast.error(data.error ?? "Failed");
    } catch { toast.error("Could not connect"); }
    finally { setGenerating(false); }
  }

  const packages = audit.packagesJson;

  if (!packages || packages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Tag className="w-10 h-10 text-white/10 mb-4" />
        <p className="text-sm font-bold text-white/30 mb-1">No packages yet</p>
        <p className="text-xs text-white/20 mb-5">Generate tiered service packages based on this audit</p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-black px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-30 transition"
        >
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Generate Packages
        </button>
      </div>
    );
  }

  const TIER_COLORS: Record<string, string> = {
    basic: "border-white/[0.06] bg-white/[0.02]",
    pro:   "border-cyan-500/40 bg-cyan-500/[0.04]",
    elite: "border-purple-500/30 bg-purple-500/[0.03]",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <SectionLabel>Service Packages</SectionLabel>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition"
        >
          {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcwIcon />}
          Regenerate
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {packages.map((pkg, i) => {
          const isRecommended = pkg.tier === "pro" || (packages.length === 1);
          const text = [
            `${pkg.name} — $${pkg.price}${pkg.billingCycle ? `/${pkg.billingCycle}` : ""}`,
            "",
            "Deliverables:",
            ...pkg.deliverables.map((d) => `• ${d}`),
            pkg.bestResults ? `\nBest results: ${pkg.bestResults}` : "",
            pkg.timeToResults ? `Time to results: ${pkg.timeToResults}` : "",
          ].join("\n");
          return (
            <div key={i} className={`rounded-2xl p-5 border flex flex-col gap-3 ${TIER_COLORS[pkg.tier] ?? TIER_COLORS.basic}`}>
              {isRecommended && (
                <span className="self-start text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-lg">
                  Recommended
                </span>
              )}
              <div>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{pkg.tier}</p>
                <p className="text-sm font-black text-white">{pkg.name}</p>
                <p className="text-xl font-black text-cyan-400">${pkg.price.toLocaleString()}</p>
                {pkg.billingCycle && <p className="text-xs text-white/30">/{pkg.billingCycle}</p>}
              </div>
              <ul className="space-y-1.5 flex-1">
                {pkg.deliverables.map((d, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-white/55">
                    <Check className="w-3 h-3 text-cyan-400/60 mt-0.5 shrink-0" />{d}
                  </li>
                ))}
              </ul>
              {pkg.bestResults && (
                <p className="text-[11px] text-white/35 border-t border-white/[0.06] pt-2">
                  Best results: {pkg.bestResults}
                </p>
              )}
              {pkg.timeToResults && (
                <p className="text-[11px] text-white/35">Timeline: {pkg.timeToResults}</p>
              )}
              <CopyBtn text={text} label="Package" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Inline icon sub (avoid import conflict)
function RotateCcwIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Tab 3 — GMB Content
// ---------------------------------------------------------------------------

function GmbContentTab({ audit, onRefresh }: { audit: LocalAudit; onRefresh: () => void }) {
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/local/gmb-posts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId: audit.id }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) { toast.success("GMB calendar generated"); onRefresh(); }
      else toast.error(data.error ?? "Failed");
    } catch { toast.error("Could not connect"); }
    finally { setGenerating(false); }
  }

  const posts = audit.gmbPostsJson;

  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Globe className="w-10 h-10 text-white/10 mb-4" />
        <p className="text-sm font-bold text-white/30 mb-1">No GMB calendar yet</p>
        <p className="text-xs text-white/20 mb-5">Generate a 30-day Google Business posting schedule</p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-black px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-30 transition"
        >
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Generate 30-Day Calendar
        </button>
      </div>
    );
  }

  const allText = posts.map((p) =>
    `Day ${p.day} — ${p.title}\n${p.body}\nCTA: ${p.cta}\nBest time: ${p.bestTime}`
  ).join("\n\n---\n\n");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionLabel>30-Day Posting Calendar ({posts.length} posts)</SectionLabel>
        <CopyBtn text={allText} label="All posts" />
      </div>
      <div className="space-y-3">
        {posts.map((post, i) => {
          const typeColor = GMB_TYPE_COLORS[post.type.toLowerCase()] ?? "text-white/40 bg-white/[0.04] border-white/10";
          const postText = `${post.title}\n\n${post.body}\n\nCTA: ${post.cta}`;
          return (
            <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-full bg-white/[0.06] text-white/60 text-xs font-black flex items-center justify-center shrink-0">
                  {post.day}
                </span>
                <span className={`text-[10px] font-bold border rounded-lg px-2 py-0.5 capitalize ${typeColor}`}>
                  {post.type}
                </span>
                <span className="text-xs text-white/25 ml-auto">{post.bestTime}</span>
              </div>
              <p className="text-sm font-bold text-white mb-1">{post.title}</p>
              <p className="text-xs text-white/50 leading-relaxed mb-2">{post.body}</p>
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-cyan-400/70">CTA: {post.cta}</p>
                <CopyBtn text={postText} label="Post" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 4 — Review System
// ---------------------------------------------------------------------------

function ReviewSystemTab({ audit, onRefresh }: { audit: LocalAudit; onRefresh: () => void }) {
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/local/review-request/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: audit.businessName, niche: audit.niche, auditId: audit.id }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) { toast.success("Review templates generated"); onRefresh(); }
      else toast.error(data.error ?? "Failed");
    } catch { toast.error("Could not connect"); }
    finally { setGenerating(false); }
  }

  const templates = audit.reviewTemplates;

  if (!templates) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Star className="w-10 h-10 text-white/10 mb-4" />
        <p className="text-sm font-bold text-white/30 mb-1">No review templates yet</p>
        <p className="text-xs text-white/20 mb-5">Generate SMS & email review request sequences</p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-black px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-30 transition"
        >
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Generate Review Templates
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* SMS */}
      {templates.sms && templates.sms.length > 0 && (
        <div>
          <SectionLabel>SMS Templates</SectionLabel>
          <div className="space-y-3">
            {templates.sms.map((t, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg px-2 py-0.5">
                    {t.timing}
                  </span>
                </div>
                <p className="text-sm text-white/60 leading-relaxed mb-3">{t.message}</p>
                <CopyBtn text={t.message} label="SMS" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email */}
      {templates.email && templates.email.length > 0 && (
        <div>
          <SectionLabel>Email Templates</SectionLabel>
          <div className="space-y-3">
            {templates.email.map((t, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg px-2 py-0.5">
                    {t.timing}
                  </span>
                </div>
                {t.subject && (
                  <p className="text-xs font-bold text-white/50 mb-1">Subject: <span className="text-white/70">{t.subject}</span></p>
                )}
                <p className="text-sm text-white/55 leading-relaxed mb-3">{t.body ?? t.message}</p>
                <CopyBtn text={[t.subject ? `Subject: ${t.subject}\n\n` : "", t.body ?? t.message ?? ""].join("")} label="Email" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best practices */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <SectionLabel>Best Practices</SectionLabel>
        <ul className="space-y-2 text-xs text-white/45 leading-relaxed">
          {[
            "Send SMS within 1 hour of service completion for highest response rate",
            "Personalize with customer name and specific service provided",
            "Include a direct Google review link — never make them search",
            "Follow up once via email if no review within 3 days",
            "Never incentivize reviews — it violates Google policy",
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2">
              <ChevronRight className="w-3 h-3 text-cyan-400/50 mt-0.5 shrink-0" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 5 — SEO Report
// ---------------------------------------------------------------------------

function SeoReportTab({ audit, onRefresh }: { audit: LocalAudit; onRefresh: () => void }) {
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/local/seo-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId: audit.id }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) { toast.success("Report generated"); onRefresh(); }
      else toast.error(data.error ?? "Failed");
    } catch { toast.error("Could not connect"); }
    finally { setGenerating(false); }
  }

  const report = audit.reportJson;

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileText className="w-10 h-10 text-white/10 mb-4" />
        <p className="text-sm font-bold text-white/30 mb-1">No client report yet</p>
        <p className="text-xs text-white/20 mb-5">Generate a polished SEO report to share with the business</p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-black px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-30 transition"
        >
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Generate Client Report
        </button>
      </div>
    );
  }

  const fullReportText = [
    report.title ?? "",
    "",
    report.executiveSummary ?? "",
    "",
    report.scorecard ? "SCORECARD:\n" + (report.scorecard ?? []).map((r) => `${r.metric}: ${r.current} (benchmark: ${r.benchmark}) — ${r.status}`).join("\n") : "",
    "",
    report.recommendations ? "RECOMMENDATIONS:\n" + (report.recommendations ?? []).map((r, i) => `${i + 1}. ${r.action} — Expected: ${r.expectedResult} (${r.timeline})`).join("\n") : "",
    "",
    report.competitorAnalysis ? `COMPETITOR ANALYSIS:\n${report.competitorAnalysis}` : "",
    "",
    report.investmentSummary ? `INVESTMENT:\n${report.investmentSummary}` : "",
  ].join("\n");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        {report.title && <h2 className="text-base font-black text-white">{report.title}</h2>}
        <CopyBtn text={fullReportText} label="Full report" />
      </div>

      {report.executiveSummary && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <SectionLabel>Executive Summary</SectionLabel>
          <p className="text-sm text-white/60 leading-relaxed">{report.executiveSummary}</p>
        </div>
      )}

      {report.scorecard && report.scorecard.length > 0 && (
        <div>
          <SectionLabel>Scorecard</SectionLabel>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Metric", "Current", "Benchmark", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-white/30 font-black uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.scorecard.map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-4 py-3 text-white/70 font-medium">{row.metric}</td>
                    <td className="px-4 py-3 text-white/60">{row.current}</td>
                    <td className="px-4 py-3 text-white/40">{row.benchmark}</td>
                    <td className={`px-4 py-3 font-bold capitalize ${REPORT_STATUS_COLORS[row.status] ?? "text-white/40"}`}>
                      {row.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {report.recommendations && report.recommendations.length > 0 && (
        <div>
          <SectionLabel>Recommendations</SectionLabel>
          <div className="space-y-3">
            {report.recommendations.map((rec, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-black flex items-center justify-center shrink-0">
                  {rec.priority ?? i + 1}
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{rec.action}</p>
                  <p className="text-xs text-white/45 mt-1">{rec.expectedResult}</p>
                  <p className="text-[11px] text-white/25 mt-0.5">Timeline: {rec.timeline}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.competitorAnalysis && (
        <div>
          <SectionLabel>Competitor Analysis</SectionLabel>
          <p className="text-sm text-white/55 leading-relaxed">{report.competitorAnalysis}</p>
        </div>
      )}

      {report.investmentSummary && (
        <div className="bg-cyan-500/[0.04] border border-cyan-500/20 rounded-2xl p-5">
          <SectionLabel>Investment Summary</SectionLabel>
          <p className="text-sm text-white/60 leading-relaxed">{report.investmentSummary}</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  pending:   "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  complete:  "text-green-400 bg-green-500/10 border-green-500/20",
  error:     "text-red-400 bg-red-500/10 border-red-500/20",
};

export default function LocalAuditDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [audit, setAudit] = useState<LocalAudit | null>(null);
  const [databaseUnavailable, setDatabaseUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchAudit() {
    try {
      const res = await fetch(`/api/local/audit/${id}`);
      const data = await res.json() as { ok: boolean; audit: LocalAudit | null; error?: string; databaseUnavailable?: boolean };
      setDatabaseUnavailable(Boolean(data.databaseUnavailable));
      if (data.ok) setAudit(data.audit);
      else toast.error(data.error ?? "Failed to load audit");
    } catch { toast.error("Could not connect"); }
    finally { setLoading(false); }
  }

  useEffect(() => { void fetchAudit(); }, [id]);

  async function runAction(key: string, endpoint: string, body: Record<string, unknown>) {
    setActionLoading(key);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) { toast.success(`${key} generated`); void fetchAudit(); }
      else toast.error(data.error ?? "Failed");
    } catch { toast.error("Could not connect"); }
    finally { setActionLoading(null); }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050a14] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-white/20" />
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="min-h-screen bg-[#050a14] flex items-center justify-center px-4">
        <div className="w-full max-w-3xl space-y-4">
          <DatabaseFallbackNotice visible={databaseUnavailable} />
          <div className="flex flex-col items-center justify-center text-center rounded-2xl border border-white/[0.07] bg-white/[0.03] p-8">
            <p className="text-sm font-bold text-white/30 mb-4">{databaseUnavailable ? "Audit data is temporarily unavailable" : "Audit not found"}</p>
            <button onClick={() => router.push("/local")} className="text-cyan-400 text-sm hover:underline">Back to Local</button>
          </div>
        </div>
      </div>
    );
  }

  const score = audit.overallScore ?? 0;
  const actionBtns = [
    { key: "Packages",         label: "Generate Packages",    endpoint: "/api/local/packages/generate",       body: { auditId: id } },
    { key: "GMB Posts",        label: "GMB Posts",            endpoint: "/api/local/gmb-posts/generate",      body: { auditId: id } },
    { key: "Review Templates", label: "Review Templates",     endpoint: "/api/local/review-request/generate", body: { businessName: audit.businessName, niche: audit.niche, auditId: id } },
    { key: "SEO Report",       label: "SEO Report",           endpoint: "/api/local/seo-report",              body: { auditId: id } },
    { key: "Keywords",         label: "Keywords",             endpoint: "/api/local/keywords/generate",       body: { auditId: id } },
  ];

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <div className="max-w-5xl mx-auto px-4 pt-8 pb-24">

        {/* Back */}
        <button onClick={() => router.push("/local")} className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/70 transition mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Local
        </button>

        {/* Header */}
        <div className="flex flex-col gap-5 mb-8">
          <div className="flex flex-wrap items-start gap-5">
            <ScoreRing score={score} />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-black text-white">{audit.businessName}</h1>
                <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold capitalize ${STATUS_COLORS[audit.status] ?? STATUS_COLORS.pending}`}>
                  {audit.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/35">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />{audit.niche}
                </span>
                {audit.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{audit.location}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 mt-3">
                {actionBtns.map(({ key, label, endpoint, body }) => (
                  <button
                    key={key}
                    onClick={() => void runAction(key, endpoint, body)}
                    disabled={actionLoading === key}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50 text-xs font-bold hover:text-white hover:border-white/[0.15] disabled:opacity-30 transition"
                  >
                    {actionLoading === key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl flex gap-1 p-1 mb-6 overflow-x-auto">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`whitespace-nowrap px-4 py-2 text-sm rounded-xl transition ${
                activeTab === i ? "bg-white/[0.06] text-white font-black" : "text-white/40 hover:text-white/60"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 0 && <AuditFindingsTab audit={audit} />}
        {activeTab === 1 && <PackagesTab audit={audit} onRefresh={() => void fetchAudit()} />}
        {activeTab === 2 && <GmbContentTab audit={audit} onRefresh={() => void fetchAudit()} />}
        {activeTab === 3 && <ReviewSystemTab audit={audit} onRefresh={() => void fetchAudit()} />}
        {activeTab === 4 && <SeoReportTab audit={audit} onRefresh={() => void fetchAudit()} />}
      </div>
    </div>
  );
}
