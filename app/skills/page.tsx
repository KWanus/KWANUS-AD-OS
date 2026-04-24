"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AppNav from "@/components/AppNav";
import AISubNav from "@/components/AISubNav";
import DatabaseFallbackNotice from "@/components/DatabaseFallbackNotice";
import { WorkspaceHero, WorkspaceShell } from "@/components/ui/WorkspaceShell";
import { SKILLS, SKILL_CATEGORIES } from "@/lib/skills/registry";
import type { SkillMeta, SkillResult } from "@/lib/skills/types";
import { Loader2, Zap, Check, ExternalLink, ChevronRight, X } from "lucide-react";
import Link from "next/link";

type BusinessProfileSummary = {
  businessType: string;
  businessName: string | null;
  niche: string | null;
  mainGoal: string | null;
  recommendedSystems?: {
    firstAction?: string;
    strategicSummary?: string;
  } | null;
};

type StatsSummary = {
  effectiveSystemScore?: number;
  unsyncedSystems?: string[];
  databaseUnavailable?: boolean;
  osVerdict?: {
    status?: string;
    label?: string;
    reason?: string;
  };
};

function verdictTone(status?: string) {
  if (status === "healthy") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  if (status === "stale") return "border-cyan-500/20 bg-cyan-500/10 text-cyan-100";
  return "border-amber-500/20 bg-amber-500/10 text-amber-100";
}

// ---------------------------------------------------------------------------
// Skill card
// ---------------------------------------------------------------------------

function SkillCard({ skill, onRun }: { skill: SkillMeta; onRun: (skill: SkillMeta) => void }) {
  const cat = SKILL_CATEGORIES[skill.category];
  const colors: Record<string, string> = {
    cyan:   "from-cyan-500/10 border-cyan-500/20 text-cyan-400",
    purple: "from-purple-500/10 border-purple-500/20 text-purple-400",
    blue:   "from-blue-500/10 border-blue-500/20 text-blue-400",
    green:  "from-green-500/10 border-green-500/20 text-green-400",
  };
  const colorClass = colors[cat.color] ?? colors.cyan;

  return (
    <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5 hover:border-white/[0.15] transition-all group flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{skill.icon}</div>
          <div>
            <h3 className="text-sm font-black text-white">{skill.name}</h3>
            <p className="text-[11px] text-white/40 mt-0.5">{skill.tagline}</p>
          </div>
        </div>
        <div className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gradient-to-r ${colorClass} border text-[10px] font-black`}>
          <Zap className="w-3 h-3" />
          {skill.credits}
        </div>
      </div>

      <p className="text-[11px] text-white/35 leading-relaxed flex-1">{skill.description}</p>

      <div className="space-y-1">
        {skill.outputs.map((o) => (
          <div key={o} className="flex items-center gap-1.5 text-[10px] text-white/30">
            <Check className="w-3 h-3 text-green-400/60 shrink-0" />
            {o}
          </div>
        ))}
      </div>

      <button
        onClick={() => onRun(skill)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/15 to-blue-500/15 hover:from-cyan-500/25 hover:to-purple-600/25 border border-white/[0.08] hover:border-cyan-500/30 text-white/70 hover:text-white text-xs font-bold transition-all"
      >
        Run Skill
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skill runner modal
// ---------------------------------------------------------------------------

function SkillRunner({
  skill,
  onClose,
  prefillData,
}: {
  skill: SkillMeta;
  onClose: () => void;
  prefillData?: Record<string, string>;
}) {
  const [input, setInput] = useState<Record<string, string>>(prefillData ?? {});
  const [executionTier, setExecutionTier] = useState<"core" | "elite">(
    prefillData?.execution_tier === "core" ? "core" : "elite"
  );
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SkillResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInput(prefillData ?? {});
    setExecutionTier(prefillData?.execution_tier === "core" ? "core" : "elite");
  }, [prefillData]);

  async function run() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(`/api/skills/${skill.slug}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, executionTier }),
      });
      const data = await res.json() as SkillResult;
      if (data.ok) {
        setResult(data);
      } else {
        setError(data.error ?? "Something went wrong");
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#020509] border border-white/[0.1] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{skill.icon}</span>
            <div>
              <h2 className="text-sm font-black text-white">{skill.name}</h2>
              <p className="text-[11px] text-white/35">{skill.credits} credits</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/[0.05] text-white/30 hover:text-white/60 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!result ? (
            <div className="p-6 space-y-4">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Execution Level</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {([
                    ["core", "Core", "Strong, clean, conversion-ready execution."],
                    ["elite", "Elite", "Sharper, more specific, more top-operator output."],
                  ] as const).map(([value, label, description]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setExecutionTier(value)}
                      className={`rounded-2xl border px-4 py-3 text-left transition ${
                        executionTier === value
                          ? "border-cyan-500/25 bg-cyan-500/10 text-cyan-100"
                          : "border-white/[0.08] bg-white/[0.03] text-white/60 hover:border-cyan-500/20 hover:bg-cyan-500/[0.05]"
                      }`}
                    >
                      <p className="text-sm font-black">{label}</p>
                      <p className="mt-1 text-xs leading-5 text-inherit/75">{description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {skill.inputs.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/30">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  {field.hint && <p className="text-[10px] text-white/20 -mt-1">{field.hint}</p>}

                  {field.type === "textarea" ? (
                    <textarea
                      rows={3}
                      value={input[field.key] ?? ""}
                      onChange={(e) => setInput((p) => ({ ...p, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition resize-none"
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={input[field.key] ?? ""}
                      onChange={(e) => setInput((p) => ({ ...p, [field.key]: e.target.value }))}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition appearance-none"
                    >
                      <option value="" className="bg-[#020509]">Select…</option>
                      {field.options?.map((o) => (
                        <option key={o} value={o} className="bg-[#020509]">{o}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={input[field.key] ?? ""}
                      onChange={(e) => setInput((p) => ({ ...p, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition"
                    />
                  )}
                </div>
              ))}

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  {error}
                </div>
              )}

              <button
                onClick={() => void run()}
                disabled={running}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-sm font-black shadow-[0_0_15px_rgba(6,182,212,0.15)] transition disabled:opacity-40"
              >
                {running ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running {skill.name}…
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Run — {skill.credits} Credits
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Result view */
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
                <Check className="w-5 h-5 text-green-400 shrink-0" />
                <div>
                  <p className="text-sm font-black text-green-400">Done!</p>
                  <p className="text-[11px] text-white/40">{result.summary}</p>
                </div>
              </div>

              {/* Output text */}
              {result.data?.rawText && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 max-h-80 overflow-y-auto">
                  <pre className="text-[11px] text-white/70 leading-relaxed whitespace-pre-wrap font-mono">
                    {result.data.rawText as string}
                  </pre>
                </div>
              )}

              {/* Created links — standard skills */}
              {result.created.siteId && (
                <Link
                  href={
                    result.data?.pageId
                      ? `/websites/${result.created.siteId}/editor/${result.data.pageId as string}`
                      : `/websites/${result.created.siteId}`
                  }
                  className="flex items-center gap-2 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold hover:bg-cyan-500/15 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open your new site in the editor →
                </Link>
              )}
              {result.created.emailFlowId && (
                <Link
                  href={`/emails/flows/${result.created.emailFlowId}`}
                  className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold hover:bg-blue-500/15 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open your email flow →
                </Link>
              )}
              {result.created.broadcastId && (
                <Link
                  href="/emails/broadcasts"
                  className="flex items-center gap-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold hover:bg-purple-500/15 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open broadcast drafts →
                </Link>
              )}

              {/* Created links — pipeline skills (website-builder-scout, ad-campaign, email-campaign) */}
              {result.created.campaignId && (
                <Link
                  href={`/campaigns/${result.created.campaignId}`}
                  className="flex items-center gap-2 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold hover:bg-orange-500/15 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open campaign (hooks, scripts, emails) →
                </Link>
              )}
              {result.created.clientId && (
                <Link
                  href={`/clients/${result.created.clientId}`}
                  className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold hover:bg-green-500/15 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open CRM client record →
                </Link>
              )}

              {/* Structured result data for pipeline skills */}
              {result.data?.topGaps && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Top Opportunity Gaps</p>
                  {(result.data.topGaps as string[]).map((g, i) => (
                    <p key={i} className="text-[11px] text-white/50 flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">✗</span>{g}
                    </p>
                  ))}
                </div>
              )}
              {result.data?.hooks && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Ad Hooks</p>
                  {(result.data.hooks as { hook: string; format?: string }[]).slice(0, 3).map((h, i) => (
                    <p key={i} className="text-[11px] text-white/60 leading-relaxed border-l-2 border-cyan-500/20 pl-3">
                      {h.hook ?? String(h)}
                    </p>
                  ))}
                </div>
              )}
              {result.data?.outreachEmail && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Outreach Email</p>
                  <p className="text-[11px] font-bold text-white/70">{(result.data.outreachEmail as { subject: string }).subject}</p>
                  <pre className="text-[10px] text-white/40 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto font-sans">
                    {(result.data.outreachEmail as { body: string }).body}
                  </pre>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setResult(null); setInput({}); }}
                  className="flex-1 py-2.5 rounded-xl border border-white/[0.1] text-white/40 hover:text-white/60 text-xs font-bold transition"
                >
                  Run again
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white/60 hover:text-white text-xs font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function SkillsPageInner() {
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [runningSkill, setRunningSkill] = useState<SkillMeta | null>(null);
  const [prefillData, setPrefillData] = useState<Record<string, string>>({});
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileSummary | null>(null);
  const [osStats, setOsStats] = useState<StatsSummary | null>(null);
  const [syncingSystem, setSyncingSystem] = useState(false);
  const [refreshingRecommendations, setRefreshingRecommendations] = useState(false);

  useEffect(() => {
    const skillSlug = searchParams.get("skill");
    if (skillSlug) {
      const skill = SKILLS.find((s) => s.slug === skillSlug);
      if (skill) {
        // Build prefill from URL params
        const fill: Record<string, string> = {};
        searchParams.forEach((val, key) => {
          if (key.startsWith("prefill_")) {
            fill[key.replace("prefill_", "")] = val;
          }
        });
        setPrefillData(fill);
        setRunningSkill(skill);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function fetchContext() {
      try {
        const [profileRes, statsRes] = await Promise.all([
          fetch("/api/business-profile"),
          fetch("/api/stats"),
        ]);
        const profileData = await profileRes.json() as { ok: boolean; profile?: BusinessProfileSummary | null };
        const statsData = await statsRes.json() as { ok: boolean; stats?: StatsSummary | null };
        if (profileData.ok) setBusinessProfile(profileData.profile ?? null);
        if (statsData.ok) setOsStats(statsData.stats ?? null);
      } catch (error) {
        console.error(error);
      }
    }

    void fetchContext();
  }, []);

  async function syncBusinessSystem() {
    try {
      setSyncingSystem(true);
      const res = await fetch("/api/business-profile/sync", { method: "POST" });
      const data = await res.json() as { ok?: boolean };
      if (!res.ok || !data.ok) throw new Error("Failed");
      const [profileRes, statsRes] = await Promise.all([
        fetch("/api/business-profile"),
        fetch("/api/stats"),
      ]);
      const profileData = await profileRes.json() as { ok: boolean; profile?: BusinessProfileSummary | null };
      const statsData = await statsRes.json() as { ok: boolean; stats?: StatsSummary | null };
      if (profileData.ok) setBusinessProfile(profileData.profile ?? null);
      if (statsData.ok) setOsStats(statsData.stats ?? null);
    } finally {
      setSyncingSystem(false);
    }
  }

  async function refreshBusinessSystem() {
    if (!businessProfile?.businessType) return;
    try {
      setRefreshingRecommendations(true);
      const res = await fetch("/api/business-profile/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType: businessProfile.businessType,
          niche: businessProfile.niche,
          goal: businessProfile.mainGoal,
        }),
      });
      const data = await res.json() as { ok?: boolean };
      if (!res.ok || !data.ok) throw new Error("Failed");
      const [profileRes, statsRes] = await Promise.all([
        fetch("/api/business-profile"),
        fetch("/api/stats"),
      ]);
      const profileData = await profileRes.json() as { ok: boolean; profile?: BusinessProfileSummary | null };
      const statsData = await statsRes.json() as { ok: boolean; stats?: StatsSummary | null };
      if (profileData.ok) setBusinessProfile(profileData.profile ?? null);
      if (statsData.ok) setOsStats(statsData.stats ?? null);
    } finally {
      setRefreshingRecommendations(false);
    }
  }

  const filtered = activeCategory === "all"
    ? SKILLS
    : SKILLS.filter((s) => s.category === activeCategory);
  const recommendedSkillSlug =
    businessProfile?.mainGoal === "more_leads"
      ? "local-ad-campaign"
      : businessProfile?.mainGoal === "more_sales"
        ? "product-description"
        : businessProfile?.mainGoal === "automate"
          ? "discovery-call-script"
          : businessProfile?.businessType === "agency"
            ? "agency-pitch-deck"
            : businessProfile?.businessType === "consultant_coach"
              ? "consulting-proposal"
              : businessProfile?.businessType === "affiliate"
                ? "presell-article"
                : businessProfile?.businessType === "local_service"
                  ? "review-response"
                  : "consulting-proposal";
  const recommendedSkill = SKILLS.find((skill) => skill.slug === recommendedSkillSlug) ?? null;

  return (
    <div className="min-h-screen bg-[#020509] text-white">
      <AppNav />
      <AISubNav />
      <WorkspaceShell>
        <WorkspaceHero
          eyebrow="Skills"
          title="One-Click AI Operators"
          description="Run specialized skills for audits, campaigns, landing pages, emails, and client work. Each skill wraps a real production workflow so you can go from prompt to asset fast."
          stats={[
            { label: "Available Skills", value: SKILLS.length.toString() },
            { label: "Categories", value: Object.keys(SKILL_CATEGORIES).length.toString(), tone: "text-cyan-300" },
            { label: "Instant Workflows", value: "30 sec", tone: "text-emerald-300" },
          ]}
        />

        {businessProfile && (
          <div className="mb-6 rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/35">Business OS Status</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {osStats?.osVerdict?.label && (
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${verdictTone(osStats.osVerdict.status)}`}>
                      {osStats.osVerdict.label}
                    </span>
                  )}
                  <span className="text-sm font-black text-white">{osStats?.effectiveSystemScore ?? 0}/100</span>
                  {(osStats?.unsyncedSystems?.length ?? 0) > 0 && (
                    <span className="text-xs text-amber-200/80">{osStats?.unsyncedSystems?.length} unsynced systems</span>
                  )}
                </div>
                <p className="mt-3 text-sm leading-7 text-white/58">
                  {osStats?.osVerdict?.reason ||
                    "The skills workspace is now reading the same Business OS health layer as the rest of the app."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {(osStats?.unsyncedSystems?.length ?? 0) > 0 && (
                  <button
                    onClick={() => void syncBusinessSystem()}
                    disabled={syncingSystem}
                    className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-5 py-3 text-sm font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {syncingSystem ? "Syncing..." : "Sync My System"}
                  </button>
                )}
                {osStats?.osVerdict?.status === "stale" && (
                  <button
                    onClick={() => void refreshBusinessSystem()}
                    disabled={refreshingRecommendations}
                    className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-5 py-3 text-sm font-bold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {refreshingRecommendations ? "Refreshing..." : "Refresh Recommendations"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <DatabaseFallbackNotice visible={osStats?.databaseUnavailable} className="mb-6" />

        {businessProfile && recommendedSkill && (
          <div className="mb-6 rounded-[28px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.08] to-blue-600/[0.03] p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-cyan-200/70">Recommended Operator Skill</p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  Run {recommendedSkill.name} for {businessProfile.niche || businessProfile.businessType.replace(/_/g, " ")}
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/62">
                  {businessProfile.recommendedSystems?.firstAction ||
                    businessProfile.recommendedSystems?.strategicSummary ||
                    "Your Business OS can now push the most useful operator skill to the top instead of making you hunt through the whole library."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setRunningSkill(recommendedSkill)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-black text-white shadow-[0_0_30px_rgba(6,182,212,0.22)]"
                >
                  <Zap className="w-4 h-4" />
                  Run Recommended Skill
                </button>
                <Link
                  href="/my-system"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/70"
                >
                  Open My System
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-8">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              activeCategory === "all"
                ? "bg-white/[0.08] text-white border-white/[0.15]"
                : "text-white/35 border-white/[0.08] hover:text-white/60"
            }`}
          >
            All Skills
          </button>
          {Object.entries(SKILL_CATEGORIES).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                activeCategory === key
                  ? "bg-white/[0.08] text-white border-white/[0.15]"
                  : "text-white/35 border-white/[0.08] hover:text-white/60"
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Skills grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((skill) => (
            <SkillCard key={skill.slug} skill={skill} onRun={setRunningSkill} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-white/25">
            <p className="text-lg font-black">No skills in this category yet</p>
            <p className="text-sm mt-1">More skills coming soon</p>
          </div>
        )}
      </WorkspaceShell>

      {runningSkill && (
        <SkillRunner skill={runningSkill} onClose={() => { setRunningSkill(null); setPrefillData({}); }} prefillData={prefillData} />
      )}
    </div>
  );
}

export default function SkillsPage() {
  return (
    <Suspense>
      <SkillsPageInner />
    </Suspense>
  );
}
