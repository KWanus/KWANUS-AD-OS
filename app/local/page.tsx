"use client";

import { useState, useEffect, useCallback } from "react";
import AppNav from "@/components/AppNav";
import { toast } from "sonner";
import {
  Loader2, MapPin, Package, BarChart2, Search, X, Plus,
  ChevronDown, ChevronUp, Copy, Check, Zap, Star, Globe, FileText,
  MessageSquare, Calendar, Tag,
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
  gmb?: number;
  reviews?: number;
  citations?: number;
  website?: number;
  seo?: number;
}

interface LocalAudit {
  id: string;
  businessName: string;
  businessUrl: string | null;
  niche: string;
  location: string;
  overallScore: number | null;
  status: string;
  auditJson: { findings?: AuditFinding[]; scores?: AuditScores } | null;
  createdAt: string;
}

interface LocalPackage {
  id: string;
  name: string;
  tier: "basic" | "pro" | "elite";
  price: number;
  billingCycle: string | null;
  deliverables: string[];
  createdAt: string;
}

interface GmbPost {
  day: number;
  type: string;
  title: string;
  body: string;
  cta: string;
  bestTime: string;
}

interface ReviewTemplates {
  sms: string[];
  email: string[];
}

interface KeywordResults {
  primaryKeywords: Array<{ keyword: string; intent: string; difficulty: string; volume: string }>;
  longTail: string[];
  nearMe: string[];
  contentIdeas: Array<{ title: string; format: string }>;
}

type ExecutionTier = "core" | "elite";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SEVERITY_COLORS: Record<string, string> = {
  critical: "text-red-400 bg-red-500/10 border-red-500/20",
  high:     "text-orange-400 bg-orange-500/10 border-orange-500/20",
  medium:   "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  low:      "text-white/40 bg-white/[0.03] border-white/10",
};

const TIER_COLORS: Record<string, string> = {
  basic: "text-white/50 bg-white/[0.03] border-white/10",
  pro:   "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  elite: "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

const INTENT_COLORS: Record<string, string> = {
  commercial:    "text-green-400 bg-green-500/10",
  informational: "text-blue-400 bg-blue-500/10",
  navigational:  "text-purple-400 bg-purple-500/10",
  transactional: "text-cyan-400 bg-cyan-500/10",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  low:    "text-green-400",
  medium: "text-yellow-400",
  high:   "text-red-400",
};

const TABS = [
  { id: "audits",    label: "Audits",     icon: BarChart2 },
  { id: "packages",  label: "Packages",   icon: Package },
  { id: "gmb",       label: "GMB Tools",  icon: MapPin },
  { id: "keywords",  label: "Keywords",   icon: Search },
];

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">{children}</p>;
}

function InputField({
  placeholder, value, onChange, type = "text",
}: {
  placeholder: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/40 transition w-full"
    />
  );
}

function PrimaryButton({ onClick, disabled, loading, children }: {
  onClick: () => void; disabled?: boolean; loading?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-sm font-black px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-30 transition"
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
}

function EmptyState({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="w-10 h-10 text-white/10 mb-3" />
      <p className="text-sm font-bold text-white/30">{title}</p>
      <p className="text-xs text-white/20 mt-1">{subtitle}</p>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f87171";
  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle
          cx="22" cy="22" r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

function CopyBlock({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3 group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{label}</span>
        <button onClick={copy} className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition">
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="text-xs text-white/60 leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}

function ExecutionTierPicker({
  value,
  onChange,
}: {
  value: ExecutionTier;
  onChange: (tier: ExecutionTier) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[
        {
          id: "core" as const,
          label: "Core",
          description: "Strong local marketing outputs with practical structure and clear delivery.",
        },
        {
          id: "elite" as const,
          label: "Elite",
          description: "Sharper local positioning, better offer logic, stronger proof, and top-operator execution.",
        },
      ].map((tier) => {
        const active = value === tier.id;
        return (
          <button
            key={tier.id}
            type="button"
            onClick={() => onChange(tier.id)}
            className={`rounded-2xl border p-4 text-left transition-all ${
              active
                ? "border-cyan-500/40 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.12)]"
                : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className={`text-sm font-black ${active ? "text-cyan-300" : "text-white"}`}>{tier.label}</span>
              <span className={`text-[10px] font-black uppercase tracking-[0.24em] ${active ? "text-cyan-300" : "text-white/20"}`}>
                {tier.id}
              </span>
            </div>
            <p className={`mt-2 text-xs leading-relaxed ${active ? "text-cyan-100/80" : "text-white/45"}`}>
              {tier.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Audit modal
// ---------------------------------------------------------------------------

function AuditModal({
  audit,
  onClose,
  onAction,
}: {
  audit: LocalAudit;
  onClose: () => void;
  onAction: (type: "packages" | "gmb" | "keywords", auditId: string) => void;
}) {
  const findings = audit.auditJson?.findings ?? [];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#020509] border border-white/[0.08] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-black text-white">{audit.businessName}</h2>
            <p className="text-xs text-white/30 mt-0.5">{audit.niche} · {audit.location}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mb-5 flex-wrap">
          <button
            onClick={() => onAction("packages", audit.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold hover:bg-cyan-500/20 transition"
          >
            <Package className="w-3 h-3" /> Generate Packages
          </button>
          <button
            onClick={() => onAction("gmb", audit.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold hover:bg-purple-500/20 transition"
          >
            <MapPin className="w-3 h-3" /> GMB Posts
          </button>
          <button
            onClick={() => onAction("keywords", audit.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold hover:bg-green-500/20 transition"
          >
            <Search className="w-3 h-3" /> Get Keywords
          </button>
        </div>

        {findings.length === 0 ? (
          <p className="text-sm text-white/30">No findings available.</p>
        ) : (
          <div className="space-y-2">
            <SectionLabel>Findings ({findings.length})</SectionLabel>
            {findings.map((f, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs font-bold text-white/60">{f.category}</span>
                  <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold capitalize ${SEVERITY_COLORS[f.severity] ?? SEVERITY_COLORS.low}`}>
                    {f.severity}
                  </span>
                </div>
                <p className="text-xs font-bold text-white/80 mb-1">{f.issue}</p>
                <p className="text-xs text-white/40 mb-1"><span className="text-white/25">Fix:</span> {f.fix}</p>
                <p className="text-xs text-white/40"><span className="text-white/25">Impact:</span> {f.impact}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Audits
// ---------------------------------------------------------------------------

function AuditsTab() {
  const [audits, setAudits] = useState<LocalAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [running, setRunning] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<LocalAudit | null>(null);
  const [executionTier, setExecutionTier] = useState<ExecutionTier>("elite");

  const [bizName, setBizName] = useState("");
  const [bizUrl, setBizUrl] = useState("");
  const [niche, setNiche] = useState("");
  const [location, setLocation] = useState("");

  const fetchAudits = useCallback(async () => {
    try {
      const res = await fetch("/api/local/audit");
      const data = await res.json() as { ok: boolean; audits: LocalAudit[] };
      if (data.ok) setAudits(data.audits);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchAudits(); }, [fetchAudits]);

  async function handleRun() {
    if (!bizName.trim() || !niche.trim() || !location.trim()) return;
    setRunning(true);
    try {
      const res = await fetch("/api/local/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: bizName,
          businessUrl: bizUrl || undefined,
          niche,
          location,
          executionTier,
        }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) {
        toast.success("Audit complete");
        setShowForm(false);
        setBizName(""); setBizUrl(""); setNiche(""); setLocation("");
        await fetchAudits();
      } else {
        toast.error(data.error ?? "Audit failed");
      }
    } catch {
      toast.error("Could not connect to server");
    } finally {
      setRunning(false);
    }
  }

  function handleModalAction(type: "packages" | "gmb" | "keywords", auditId: string) {
    toast.success(`Redirecting — ${auditId} queued for ${type}`);
    setSelectedAudit(null);
  }

  const scores = selectedAudit?.auditJson?.scores;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <PrimaryButton onClick={() => setShowForm((p) => !p)}>
          <Plus className="w-3.5 h-3.5" /> Run New Audit
        </PrimaryButton>
      </div>

      {showForm && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 mb-4 space-y-3">
          <SectionLabel>New Business Audit</SectionLabel>
          <ExecutionTierPicker value={executionTier} onChange={setExecutionTier} />
          <InputField placeholder="Business name" value={bizName} onChange={setBizName} />
          <InputField placeholder="Website URL (optional)" value={bizUrl} onChange={setBizUrl} />
          <div className="flex gap-3">
            <InputField placeholder="Niche (e.g. plumber)" value={niche} onChange={setNiche} />
            <InputField placeholder="Location (e.g. Austin TX)" value={location} onChange={setLocation} />
          </div>
          <PrimaryButton onClick={handleRun} disabled={!bizName.trim() || !niche.trim() || !location.trim()} loading={running}>
            {running ? "Scanning..." : "Run Audit"}
          </PrimaryButton>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-white/20" /></div>
      ) : audits.length === 0 ? (
        <EmptyState icon={BarChart2} title="No audits yet" subtitle="Run your first business audit to get started" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {audits.map((audit) => {
            const sc = audit.auditJson?.scores ?? {};
            return (
              <div
                key={audit.id}
                onClick={() => setSelectedAudit(audit)}
                className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 hover:border-white/[0.1] transition cursor-pointer"
              >
                <div className="flex items-start gap-3 mb-3">
                  {audit.overallScore !== null && <ScoreRing score={audit.overallScore} />}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-white truncate">{audit.businessName}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-white/35 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{audit.location}
                      </span>
                      <span className="text-xs text-white/25">{audit.niche}</span>
                    </div>
                  </div>
                </div>
                {Object.keys(sc).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(sc).map(([key, val]) => (
                      <span
                        key={key}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          val >= 70 ? "bg-green-500/10 text-green-400" :
                          val >= 50 ? "bg-yellow-500/10 text-yellow-400" :
                          "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {key} {val}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedAudit && (
        <AuditModal
          audit={selectedAudit}
          onClose={() => setSelectedAudit(null)}
          onAction={handleModalAction}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Packages
// ---------------------------------------------------------------------------

function PackagesTab() {
  const [packages, setPackages] = useState<LocalPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genNiche, setGenNiche] = useState("");
  const [genLocation, setGenLocation] = useState("");
  const [executionTier, setExecutionTier] = useState<ExecutionTier>("elite");

  const fetchPackages = useCallback(async () => {
    try {
      const res = await fetch("/api/local/packages");
      const data = await res.json() as { ok: boolean; packages: LocalPackage[] };
      if (data.ok) setPackages(data.packages);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchPackages(); }, [fetchPackages]);

  async function handleGenerate() {
    if (!genNiche.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/local/packages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: genNiche, location: genLocation, executionTier }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) {
        toast.success("3-tier packages generated");
        setShowForm(false);
        setGenNiche(""); setGenLocation("");
        await fetchPackages();
      } else {
        toast.error(data.error ?? "Generation failed");
      }
    } catch {
      toast.error("Could not connect to server");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <PrimaryButton onClick={() => setShowForm((p) => !p)}>
          <Plus className="w-3.5 h-3.5" /> Generate 3-Tier Packages
        </PrimaryButton>
      </div>

      {showForm && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 mb-4 space-y-3">
          <SectionLabel>Generate Packages</SectionLabel>
          <ExecutionTierPicker value={executionTier} onChange={setExecutionTier} />
          <InputField placeholder="Niche (e.g. HVAC, landscaping)" value={genNiche} onChange={setGenNiche} />
          <InputField placeholder="Location (optional)" value={genLocation} onChange={setGenLocation} />
          <PrimaryButton onClick={handleGenerate} disabled={!genNiche.trim()} loading={generating}>
            Generate
          </PrimaryButton>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-white/20" /></div>
      ) : packages.length === 0 ? (
        <EmptyState icon={Package} title="No packages yet" subtitle="Generate 3-tier packages for any local niche" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 hover:border-white/[0.1] transition">
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold capitalize ${TIER_COLORS[pkg.tier] ?? TIER_COLORS.basic}`}>
                  {pkg.tier}
                </span>
              </div>
              <h3 className="text-sm font-black text-white mb-1">{pkg.name}</h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-lg font-black text-cyan-400">${pkg.price.toLocaleString()}</span>
                {pkg.billingCycle && <span className="text-xs text-white/30">/ {pkg.billingCycle}</span>}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-2">
                {pkg.deliverables.length} deliverables
              </p>
              <ul className="space-y-1">
                {pkg.deliverables.slice(0, 5).map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/45">
                    <span className="w-1 h-1 rounded-full bg-cyan-500/50 mt-1.5 shrink-0" />
                    {d}
                  </li>
                ))}
                {pkg.deliverables.length > 5 && (
                  <li className="text-xs text-white/20">+{pkg.deliverables.length - 5} more</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: GMB Tools
// ---------------------------------------------------------------------------

function GmbTab({ audits }: { audits: LocalAudit[] }) {
  // Review Request
  const [revBiz, setRevBiz] = useState("");
  const [revNiche, setRevNiche] = useState("");
  const [revPlatform, setRevPlatform] = useState("Google");
  const [revLoading, setRevLoading] = useState(false);
  const [revResult, setRevResult] = useState<ReviewTemplates | null>(null);

  // GMB Post Calendar
  const [postBiz, setPostBiz] = useState("");
  const [postNiche, setPostNiche] = useState("");
  const [postLocation, setPostLocation] = useState("");
  const [postLoading, setPostLoading] = useState(false);
  const [postCalendar, setPostCalendar] = useState<GmbPost[]>([]);

  // SEO Report
  const [seoAuditId, setSeoAuditId] = useState("");
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoReport, setSeoReport] = useState<Record<string, string> | null>(null);
  const [seoTier, setSeoTier] = useState<ExecutionTier>("elite");
  const [reviewTier, setReviewTier] = useState<ExecutionTier>("elite");
  const [postTier, setPostTier] = useState<ExecutionTier>("elite");

  async function handleReviewGen() {
    if (!revBiz.trim() || !revNiche.trim()) return;
    setRevLoading(true);
    try {
      const res = await fetch("/api/local/review-request/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: revBiz,
          niche: revNiche,
          reviewPlatform: revPlatform,
          executionTier: reviewTier,
        }),
      });
      const data = await res.json() as {
        ok: boolean;
        templates?: { sms?: Array<{ message: string }>; email?: Array<{ subject: string; body: string }> };
        error?: string;
      };
      if (data.ok) {
        toast.success("Review templates generated");
        setRevResult({
          sms: data.templates?.sms?.map((item) => item.message) ?? [],
          email: data.templates?.email?.map((item) => `${item.subject}\n\n${item.body}`) ?? [],
        });
      } else {
        toast.error(data.error ?? "Generation failed");
      }
    } catch {
      toast.error("Could not connect to server");
    } finally {
      setRevLoading(false);
    }
  }

  async function handlePostCalendar() {
    if (!postBiz.trim() || !postNiche.trim()) return;
    setPostLoading(true);
    try {
      const res = await fetch("/api/local/gmb-posts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: postBiz,
          niche: postNiche,
          location: postLocation,
          executionTier: postTier,
        }),
      });
      const data = await res.json() as {
        ok: boolean;
        calendar?: { posts?: Array<GmbPost & { bestPostTime?: string }> };
        error?: string;
      };
      if (data.ok) {
        toast.success("30-day post calendar ready");
        setPostCalendar(
          (data.calendar?.posts ?? []).map((post) => ({
            ...post,
            bestTime: post.bestTime ?? post.bestPostTime ?? "Best local posting window",
          }))
        );
      } else {
        toast.error(data.error ?? "Generation failed");
      }
    } catch {
      toast.error("Could not connect to server");
    } finally {
      setPostLoading(false);
    }
  }

  async function handleSeoReport() {
    if (!seoAuditId) return;
    setSeoLoading(true);
    try {
      const res = await fetch("/api/local/seo-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId: seoAuditId, executionTier: seoTier }),
      });
      const data = await res.json() as { ok: boolean; report: Record<string, string>; error?: string };
      if (data.ok) {
        toast.success("SEO report generated");
        setSeoReport(data.report ?? {});
      } else {
        toast.error(data.error ?? "Generation failed");
      }
    } catch {
      toast.error("Could not connect to server");
    } finally {
      setSeoLoading(false);
    }
  }

  const POST_TYPE_COLORS: Record<string, string> = {
    offer:       "text-cyan-400 bg-cyan-500/10",
    educational: "text-blue-400 bg-blue-500/10",
    testimonial: "text-green-400 bg-green-500/10",
    event:       "text-purple-400 bg-purple-500/10",
    update:      "text-white/50 bg-white/[0.03]",
  };

  return (
    <div className="space-y-8">

      {/* Review Request Generator */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-black text-white">Review Request Generator</h3>
        </div>
        <div className="space-y-3">
          <ExecutionTierPicker value={reviewTier} onChange={setReviewTier} />
          <div className="flex gap-3">
            <InputField placeholder="Business name" value={revBiz} onChange={setRevBiz} />
            <InputField placeholder="Niche" value={revNiche} onChange={setRevNiche} />
          </div>
          <div className="flex gap-3">
            {["Google", "Yelp", "Facebook"].map((p) => (
              <button
                key={p}
                onClick={() => setRevPlatform(p)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border transition ${
                  revPlatform === p
                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                    : "border-white/[0.08] text-white/35 hover:text-white/60"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <PrimaryButton onClick={handleReviewGen} disabled={!revBiz.trim() || !revNiche.trim()} loading={revLoading}>
            Generate Templates
          </PrimaryButton>
        </div>
        {revResult && (
          <div className="mt-4 space-y-3">
            {revResult.sms.map((t, i) => (
              <CopyBlock key={i} label={`SMS Template ${i + 1}`} text={t} />
            ))}
            {revResult.email.map((t, i) => (
              <CopyBlock key={i} label={`Email Template ${i + 1}`} text={t} />
            ))}
          </div>
        )}
      </div>

      {/* GMB Post Calendar */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-black text-white">GMB Post Calendar</h3>
        </div>
        <div className="space-y-3">
          <ExecutionTierPicker value={postTier} onChange={setPostTier} />
          <div className="flex gap-3">
            <InputField placeholder="Business name" value={postBiz} onChange={setPostBiz} />
            <InputField placeholder="Niche" value={postNiche} onChange={setPostNiche} />
          </div>
          <InputField placeholder="Location (optional)" value={postLocation} onChange={setPostLocation} />
          <PrimaryButton onClick={handlePostCalendar} disabled={!postBiz.trim() || !postNiche.trim()} loading={postLoading}>
            Generate 30-Day Calendar
          </PrimaryButton>
        </div>
        {postCalendar.length > 0 && (
          <div className="mt-4 space-y-2">
            <SectionLabel>30-Day Post Calendar</SectionLabel>
            {postCalendar.map((post, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-[10px] font-black text-white/25">Day {post.day}</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize ${POST_TYPE_COLORS[post.type] ?? POST_TYPE_COLORS.update}`}>
                    {post.type}
                  </span>
                  <span className="text-[10px] text-white/25 ml-auto">{post.bestTime}</span>
                </div>
                <p className="text-xs font-bold text-white/80 mb-1">{post.title}</p>
                <p className="text-xs text-white/45 leading-relaxed mb-1">{post.body}</p>
                {post.cta && <p className="text-[10px] text-cyan-400/60">CTA: {post.cta}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SEO Report */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-green-400" />
          <h3 className="text-sm font-black text-white">SEO Client Report</h3>
        </div>
        {audits.length === 0 ? (
          <p className="text-sm text-white/25">Run an audit first to generate an SEO report.</p>
        ) : (
          <div className="space-y-3">
            <ExecutionTierPicker value={seoTier} onChange={setSeoTier} />
            <select
              value={seoAuditId}
              onChange={(e) => setSeoAuditId(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/40 transition w-full"
            >
              <option value="" className="bg-[#020509]">Select an audit...</option>
              {audits.map((a) => (
                <option key={a.id} value={a.id} className="bg-[#020509]">
                  {a.businessName} — {a.location}
                </option>
              ))}
            </select>
            <PrimaryButton onClick={handleSeoReport} disabled={!seoAuditId} loading={seoLoading}>
              Generate Client Report
            </PrimaryButton>
          </div>
        )}
        {seoReport && (
          <div className="mt-4 space-y-3">
            {Object.entries(seoReport).map(([key, val]) => (
              <div key={key} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">
                <SectionLabel>{key}</SectionLabel>
                <p className="text-sm text-white/55 leading-relaxed">{val}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Keywords
// ---------------------------------------------------------------------------

function KeywordsTab() {
  const [niche, setNiche] = useState("");
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState("10mi");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<KeywordResults | null>(null);
  const [executionTier, setExecutionTier] = useState<ExecutionTier>("elite");

  async function handleResearch() {
    if (!niche.trim() || !location.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/local/keywords/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, location, radius, executionTier }),
      });
      const data = await res.json() as {
        ok: boolean;
        keywords?: {
          primaryKeywords?: Array<{
            keyword: string;
            intent: string;
            difficulty: string;
            searchVolume?: string;
          }>;
          longTail?: string[];
          nearMeKeywords?: string[];
          contentIdeas?: Array<{ title: string; type?: string; format?: string }>;
        };
        error?: string;
      };
      if (data.ok) {
        toast.success("Keyword research complete");
        setResults({
          primaryKeywords: (data.keywords?.primaryKeywords ?? []).map((kw) => ({
            keyword: kw.keyword,
            intent: kw.intent,
            difficulty: kw.difficulty,
            volume: kw.searchVolume ?? "Unknown",
          })),
          longTail: data.keywords?.longTail ?? [],
          nearMe: data.keywords?.nearMeKeywords ?? [],
          contentIdeas: (data.keywords?.contentIdeas ?? []).map((idea) => ({
            title: idea.title,
            format: idea.format ?? idea.type ?? "blog",
          })),
        });
      } else {
        toast.error(data.error ?? "Research failed");
      }
    } catch {
      toast.error("Could not connect to server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 mb-5 space-y-3">
        <SectionLabel>Keyword Research</SectionLabel>
        <ExecutionTierPicker value={executionTier} onChange={setExecutionTier} />
        <div className="flex gap-3">
          <InputField placeholder="Niche (e.g. plumber, roofer)" value={niche} onChange={setNiche} />
          <InputField placeholder="Location (e.g. Denver CO)" value={location} onChange={setLocation} />
        </div>
        <div className="flex gap-2">
          {["5mi", "10mi", "25mi", "50mi"].map((r) => (
            <button
              key={r}
              onClick={() => setRadius(r)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold border transition ${
                radius === r
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                  : "border-white/[0.08] text-white/35 hover:text-white/60"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <PrimaryButton onClick={handleResearch} disabled={!niche.trim() || !location.trim()} loading={loading}>
          <Search className="w-3.5 h-3.5" /> Research Keywords
        </PrimaryButton>
      </div>

      {!results && !loading && (
        <EmptyState icon={Tag} title="No results yet" subtitle="Enter a niche and location to research keywords" />
      )}

      {results && (
        <div className="space-y-6">
          {/* Primary Keywords */}
          <div>
            <SectionLabel>Primary Keywords ({results.primaryKeywords.length})</SectionLabel>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="grid grid-cols-4 px-4 py-2.5 border-b border-white/[0.05]">
                {["Keyword", "Intent", "Difficulty", "Volume"].map((h) => (
                  <span key={h} className="text-[10px] font-black uppercase tracking-widest text-white/25">{h}</span>
                ))}
              </div>
              {results.primaryKeywords.map((kw, i) => (
                <div key={i} className="grid grid-cols-4 px-4 py-2.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.015] transition">
                  <span className="text-xs font-bold text-white/80">{kw.keyword}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg self-center w-fit capitalize ${INTENT_COLORS[kw.intent] ?? "text-white/40 bg-white/[0.03]"}`}>
                    {kw.intent}
                  </span>
                  <span className={`text-xs font-bold capitalize ${DIFFICULTY_COLORS[kw.difficulty] ?? "text-white/40"}`}>
                    {kw.difficulty}
                  </span>
                  <span className="text-xs text-white/50">{kw.volume}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Long Tail */}
          {results.longTail.length > 0 && (
            <div>
              <SectionLabel>Long-Tail Keywords</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {results.longTail.map((kw, i) => (
                  <span key={i} className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.07] rounded-xl text-xs text-white/60 font-medium">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Near Me */}
          {results.nearMe.length > 0 && (
            <div>
              <SectionLabel>Near Me Keywords</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {results.nearMe.map((kw, i) => (
                  <span key={i} className="px-3 py-1.5 bg-cyan-500/5 border border-cyan-500/15 rounded-xl text-xs text-cyan-400/70 font-medium">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Content Ideas */}
          {results.contentIdeas.length > 0 && (
            <div>
              <SectionLabel>Content Ideas</SectionLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {results.contentIdeas.map((idea, i) => (
                  <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 flex items-start gap-3">
                    <FileText className="w-4 h-4 text-white/20 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-white/75">{idea.title}</p>
                      <p className="text-[10px] text-white/30 mt-0.5 capitalize">{idea.format}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LocalPage() {
  const [activeTab, setActiveTab] = useState("audits");
  const [audits, setAudits] = useState<LocalAudit[]>([]);

  useEffect(() => {
    fetch("/api/local/audit")
      .then((r) => r.json())
      .then((data: { ok: boolean; audits: LocalAudit[] }) => {
        if (data.ok) setAudits(data.audits);
      })
      .catch(() => null);
  }, []);

  return (
    <div className="min-h-screen bg-[#020509] text-white">
      <AppNav />
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-20">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-black text-white">Local OS</h1>
          </div>
          <p className="text-sm text-white/35">Audits, packages, GMB tools, and keyword research for local service businesses</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/[0.06] mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 transition -mb-px ${
                activeTab === tab.id
                  ? "border-cyan-500 text-white"
                  : "border-transparent text-white/35 hover:text-white/60"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "audits"   && <AuditsTab />}
        {activeTab === "packages" && <PackagesTab />}
        {activeTab === "gmb"      && <GmbTab audits={audits} />}
        {activeTab === "keywords" && <KeywordsTab />}
      </div>
    </div>
  );
}
