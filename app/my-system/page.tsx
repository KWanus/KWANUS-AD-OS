"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import DatabaseFallbackNotice from "@/components/DatabaseFallbackNotice";
import {
  ARCHETYPES,
  getArchetype,
  type BusinessType,
  type SystemBlueprint,
  type SystemSlug,
} from "@/lib/archetypes";
import {
  ArrowRight,
  BarChart3,
  BotMessageSquare,
  CheckCircle2,
  ChevronDown,
  Globe,
  LayoutDashboard,
  Loader2,
  Rocket,
  Settings,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";

type Recommendation = {
  strategicSummary?: string;
  firstAction?: string;
  milestones?: {
    day30?: string;
    day60?: string;
    day90?: string;
  };
  prioritizedSystems?: Array<{
    slug: string;
    personalizedReason: string;
    priority: string;
    estimatedImpact: string;
  }>;
};

type BusinessProfile = {
  id: string;
  businessType: BusinessType;
  businessName: string | null;
  niche: string | null;
  location: string | null;
  mainGoal: string | null;
  stage: string;
  activeSystems: string[];
  systemScore: number;
  recommendedSystems: Recommendation | null;
  recommendedAt: string | null;
};

type WorkspaceStats = {
  campaigns?: number;
  activeCampaigns?: number;
  sites?: number;
  publishedSites?: number;
  leads?: number;
  emailFlows?: number;
  clients?: number;
  systemScore?: number;
  effectiveSystemScore?: number;
  liveSystems?: string[];
  unsyncedSystems?: string[];
  effectiveSystemsCount?: number;
  missingCoreSystems?: string[];
  databaseUnavailable?: boolean;
  osVerdict?: {
    status?: string;
    label?: string;
    reason?: string;
  };
};

const BUSINESS_TYPE_OPTIONS = Object.values(ARCHETYPES).map((archetype) => ({
  value: archetype.type,
  label: `${archetype.emoji} ${archetype.label}`,
}));

const GOAL_OPTIONS = [
  { value: "more_leads", label: "Get More Leads/Clients" },
  { value: "more_sales", label: "Increase Sales & Revenue" },
  { value: "automate", label: "Automate My Business" },
  { value: "launch", label: "Launch Something New" },
  { value: "build_brand", label: "Build My Brand" },
  { value: "scale", label: "Scale What's Working" },
];

const SYSTEM_ROUTE_MAP: Record<string, string> = {
  website: "/websites/new",
  google_ads: "/campaigns/new?type=google",
  facebook_ads: "/campaigns/new?type=facebook",
  tiktok_ads: "/campaigns/new?type=tiktok",
  email_sequence: "/emails/flows",
  sms_followup: "/emails/flows?type=sms",
  crm_pipeline: "/clients",
  review_system: "/local/audit",
  gmb_optimization: "/local",
  citation_builder: "/local",
  lead_magnet: "/skills?skill=lead-magnet",
  booking_flow: "/skills?skill=discovery-call-script",
  proposal_system: "/consult/proposals",
  case_studies: "/skills?skill=case-study",
  white_label_reports: "/agency",
  content_calendar: "/skills?skill=social-content-plan",
  referral_system: "/skills?skill=referral-system",
  upsell_flow: "/campaigns",
  bridge_page: "/affiliate/offers",
  abandoned_cart: "/emails/flows?type=cart",
  product_page: "/products",
};

const SCORE_COMPONENTS = [
  { label: "Website", points: 20, slugs: ["website", "product_page", "bridge_page"] },
  { label: "Lead Capture", points: 15, slugs: ["lead_magnet", "booking_flow", "review_system"] },
  { label: "Email System", points: 20, slugs: ["email_sequence", "abandoned_cart", "sms_followup"] },
  { label: "Paid Ads", points: 15, slugs: ["google_ads", "facebook_ads", "tiktok_ads"] },
  { label: "CRM / Pipeline", points: 15, slugs: ["crm_pipeline", "proposal_system", "white_label_reports"] },
  { label: "Content System", points: 10, slugs: ["content_calendar", "case_studies", "gmb_optimization"] },
  { label: "Automation", points: 5, slugs: ["referral_system", "upsell_flow", "citation_builder"] },
];

const WORKFLOW_STAGE_LABELS: Record<string, string> = {
  website: "Website",
  google_ads: "Google Ads",
  facebook_ads: "Meta Ads",
  email_sequence: "Email Follow-Up",
  sms_followup: "SMS Follow-Up",
  crm_pipeline: "CRM Pipeline",
  review_system: "Review Engine",
  gmb_optimization: "GMB System",
  lead_magnet: "Lead Magnet",
  booking_flow: "Booking Flow",
  proposal_system: "Proposal Flow",
  case_studies: "Case Studies",
  product_page: "Product Page",
  abandoned_cart: "Cart Recovery",
  bridge_page: "Bridge Page",
};

function normalizeProfile(raw: Record<string, unknown> | null | undefined): BusinessProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const recommendation = (raw.recommendedSystems && typeof raw.recommendedSystems === "object"
    ? raw.recommendedSystems
    : null) as Recommendation | null;

  return {
    id: String(raw.id ?? ""),
    businessType: (raw.businessType ?? "local_service") as BusinessType,
    businessName: typeof raw.businessName === "string" ? raw.businessName : null,
    niche: typeof raw.niche === "string" ? raw.niche : null,
    location: typeof raw.location === "string" ? raw.location : null,
    mainGoal: typeof raw.mainGoal === "string" ? raw.mainGoal : null,
    stage: typeof raw.stage === "string" ? raw.stage : "starting",
    activeSystems: Array.isArray(raw.activeSystems) ? raw.activeSystems.filter((item): item is string => typeof item === "string") : [],
    systemScore: typeof raw.systemScore === "number" ? raw.systemScore : 0,
    recommendedSystems: recommendation,
    recommendedAt: typeof raw.recommendedAt === "string" ? raw.recommendedAt : null,
  };
}

function formatRelativeTime(iso?: string | null) {
  if (!iso) return "Never refreshed";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Refreshed just now";
  if (minutes < 60) return `Refreshed ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Refreshed ${hours}h ago`;
  return `Refreshed ${Math.floor(hours / 24)}d ago`;
}

function ScoreRing({ score }: { score: number }) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedScore / 100) * circumference;
  const tone = clampedScore >= 75 ? "stroke-emerald-400" : clampedScore >= 45 ? "stroke-amber-400" : "stroke-red-400";

  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={radius} className="fill-none stroke-white/10" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          className={`fill-none ${tone} transition-all duration-1000 ease-out`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] font-black uppercase tracking-[0.28em] text-white/35">Score</span>
        <span className="text-3xl font-black tracking-tight text-white">{clampedScore}</span>
      </div>
    </div>
  );
}

function isSystemLive(slug: string, stats: WorkspaceStats | null) {
  if (!stats) return false;

  switch (slug) {
    case "website":
    case "product_page":
    case "bridge_page":
      return (stats.sites ?? 0) > 0;
    case "google_ads":
    case "facebook_ads":
    case "tiktok_ads":
    case "upsell_flow":
      return (stats.campaigns ?? 0) > 0;
    case "email_sequence":
    case "sms_followup":
    case "abandoned_cart":
      return (stats.emailFlows ?? 0) > 0;
    case "crm_pipeline":
    case "proposal_system":
    case "white_label_reports":
      return (stats.clients ?? 0) > 0;
    case "lead_magnet":
    case "booking_flow":
    case "review_system":
      return (stats.leads ?? 0) > 0;
    default:
      return false;
  }
}

function SystemCard({
  system,
  active,
  liveInstalled,
  personalizedReason,
  onActivate,
  essential,
}: {
  system: SystemBlueprint;
  active: boolean;
  liveInstalled: boolean;
  personalizedReason?: string;
  onActivate: () => void;
  essential: boolean;
}) {
  const highlighted = active || liveInstalled;
  const statusTone = active
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
    : liveInstalled
      ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-200"
      : "border-red-500/20 bg-red-500/10 text-red-300";
  const statusLabel = active ? "Active ✓" : liveInstalled ? "Live In Workspace" : "Not Set Up";

  return (
    <div
      className={`rounded-[28px] border p-5 transition duration-300 ${
        highlighted
          ? "border-cyan-500/30 bg-cyan-500/10 shadow-[0_0_32px_rgba(6,182,212,0.08)]"
          : "border-white/[0.08] bg-white/[0.03] hover:border-cyan-500/30 hover:shadow-[0_0_32px_rgba(6,182,212,0.08)]"
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">{system.slug.replace(/_/g, " ")}</p>
          <h3 className="mt-2 text-lg font-black text-white">{system.name}</h3>
        </div>
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${statusTone}`}>
          {statusLabel}
        </span>
      </div>

      <p className="text-sm leading-6 text-white/62">{system.description}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">Estimated Impact</p>
          <p className="mt-2 text-sm font-bold text-cyan-200">{system.estimatedImpact}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">Time To Activate</p>
          <p className="mt-2 text-sm font-bold text-white">{system.timeToActivate}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">Why This Works</p>
        <p className="mt-2 text-sm leading-6 text-white/62">{personalizedReason || system.why}</p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          onClick={onActivate}
          className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black transition ${
            active
              ? "border border-white/[0.1] bg-white/[0.04] text-white/75"
              : liveInstalled
                ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-100"
              : "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_26px_rgba(6,182,212,0.24)]"
          }`}
        >
          {active ? "Keep Active" : liveInstalled ? "Mark Active In OS" : essential ? "Activate" : "Activate System"}
          <ArrowRight className="h-4 w-4" />
        </button>
        <Link
          href={SYSTEM_ROUTE_MAP[system.slug] ?? "/copilot"}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-white/70 transition hover:text-white"
        >
          Open Tool
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function StatusChip({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "cyan" | "amber" | "emerald";
}) {
  const toneClasses =
    tone === "amber"
      ? "border-amber-500/20 bg-amber-500/10 text-amber-100"
      : tone === "emerald"
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
        : "border-cyan-500/20 bg-cyan-500/10 text-cyan-100";

  return (
    <div className={`rounded-[24px] border p-4 ${toneClasses}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-70">{label}</p>
      <p className="mt-3 text-2xl font-black">{value}</p>
      <p className="mt-2 text-xs leading-6 opacity-80">{detail}</p>
    </div>
  );
}

function statusToneFromVerdict(status?: string): "cyan" | "amber" | "emerald" {
  if (status === "healthy") return "emerald";
  if (status === "stale") return "cyan";
  return "amber";
}

export default function MySystemPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [workspaceStats, setWorkspaceStats] = useState<WorkspaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [syncingWorkspace, setSyncingWorkspace] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickProfile, setQuickProfile] = useState({
    businessType: "local_service" as BusinessType,
    niche: "",
    mainGoal: "more_leads",
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const [profileRes, statsRes] = await Promise.all([
          fetch("/api/business-profile"),
          fetch("/api/stats"),
        ]);
        const data = await profileRes.json() as { ok: boolean; profile?: Record<string, unknown> | null };
        const statsData = await statsRes.json() as { ok: boolean; stats?: WorkspaceStats | null };
        if (data.ok) setProfile(normalizeProfile(data.profile));
        if (statsData.ok) {
          setWorkspaceStats(statsData.stats ?? null);
        }
      } catch {
        setError("We couldn't load your business profile right now.");
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, []);

  const activeProfile = profile ?? {
    id: "fallback",
    businessType: quickProfile.businessType,
    businessName: null,
    niche: quickProfile.niche || null,
    location: null,
    mainGoal: quickProfile.mainGoal,
    stage: "starting",
    activeSystems: [],
    systemScore: 0,
    recommendedSystems: null,
    recommendedAt: null,
  };

  const archetype = getArchetype(activeProfile.businessType);

  const prioritizedSystems = useMemo(() => {
    const recommendation = activeProfile.recommendedSystems?.prioritizedSystems ?? [];
    const map = new Map(recommendation.map((item) => [item.slug, item]));
    const ordered = [...archetype.systems].sort((a, b) => {
      const aIndex = recommendation.findIndex((item) => item.slug === a.slug);
      const bIndex = recommendation.findIndex((item) => item.slug === b.slug);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    return {
      essential: ordered.filter((system) => system.priority === "essential").map((system) => ({ system, meta: map.get(system.slug) })),
      recommended: ordered.filter((system) => system.priority === "recommended").map((system) => ({ system, meta: map.get(system.slug) })),
      optional: ordered.filter((system) => system.priority === "optional").map((system) => ({ system, meta: map.get(system.slug) })),
    };
  }, [activeProfile.recommendedSystems?.prioritizedSystems, archetype.systems]);

  const workflowSystems = useMemo(() => {
    return (activeProfile.recommendedSystems?.prioritizedSystems ?? archetype.systems).slice(0, 5).map((item) => {
      const slug = item.slug;
      return {
        slug,
        label: WORKFLOW_STAGE_LABELS[slug] ?? slug.replace(/_/g, " "),
      };
    });
  }, [activeProfile.recommendedSystems?.prioritizedSystems, archetype.systems]);

  const scoreBreakdown = useMemo(() => {
    return SCORE_COMPONENTS.map((item) => {
      const active = item.slugs.some((slug) => activeProfile.activeSystems.includes(slug) || isSystemLive(slug, workspaceStats));
      return {
        ...item,
        active,
        earned: active ? item.points : 0,
      };
    });
  }, [activeProfile.activeSystems, workspaceStats]);

  const computedScore = scoreBreakdown.reduce((sum, item) => sum + item.earned, 0);
  const liveSystemScore = workspaceStats?.effectiveSystemScore ?? workspaceStats?.systemScore ?? computedScore ?? profile?.systemScore ?? 0;
  const livePulseCards = [
    { label: "Sites", value: workspaceStats?.sites ?? 0, sub: `${workspaceStats?.publishedSites ?? 0} published` },
    { label: "Campaigns", value: workspaceStats?.campaigns ?? 0, sub: `${workspaceStats?.activeCampaigns ?? 0} active` },
    { label: "Leads", value: workspaceStats?.leads ?? 0, sub: "pipeline opportunities" },
    { label: "Flows", value: workspaceStats?.emailFlows ?? 0, sub: "follow-up automations" },
  ];
  const workspaceLiveSystems = useMemo(() => {
    if (workspaceStats?.liveSystems?.length) {
      return workspaceStats.liveSystems;
    }
    return archetype.systems
      .filter((system) => isSystemLive(system.slug, workspaceStats))
      .map((system) => system.slug);
  }, [archetype.systems, workspaceStats]);
  const unsyncedSystems = useMemo(() => {
    if (workspaceStats?.unsyncedSystems?.length) {
      return workspaceStats.unsyncedSystems;
    }
    return workspaceLiveSystems.filter((slug) => !activeProfile.activeSystems.includes(slug));
  }, [activeProfile.activeSystems, workspaceLiveSystems, workspaceStats?.unsyncedSystems]);
  const recommendationIsStale = profile?.recommendedAt
    ? Date.now() - new Date(profile.recommendedAt).getTime() > 1000 * 60 * 60 * 24 * 7
    : false;

  async function saveQuickProfile() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/business-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType: quickProfile.businessType,
          niche: quickProfile.niche,
          mainGoal: quickProfile.mainGoal,
          stage: "starting",
          setupCompleted: false,
          setupStep: 1,
        }),
      });
      const data = await res.json() as { ok: boolean; profile?: Record<string, unknown> };
      if (!data.ok) throw new Error("Failed to save profile");
      setProfile(normalizeProfile(data.profile));
    } catch {
      setError("We couldn't create your profile yet.");
    } finally {
      setSaving(false);
    }
  }

  async function updateActiveSystems(nextSystems: string[]) {
    if (!profile) return;
    const nextScore = SCORE_COMPONENTS.reduce((sum, item) => sum + (item.slugs.some((slug) => nextSystems.includes(slug)) ? item.points : 0), 0);
    setSaving(true);
    try {
      const res = await fetch("/api/business-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeSystems: nextSystems,
          systemScore: nextScore,
          setupCompleted: true,
        }),
      });
      const data = await res.json() as { ok: boolean; profile?: Record<string, unknown> };
      if (!data.ok) throw new Error("Failed to update systems");
      setProfile(normalizeProfile(data.profile));
    } catch {
      setError("We couldn't update your system right now.");
    } finally {
      setSaving(false);
    }
  }

  async function activateSystem(slug: string, essential: boolean) {
    const current = new Set(profile?.activeSystems ?? []);
    if (!current.has(slug)) current.add(slug);
    else if (!essential) current.delete(slug);
    await updateActiveSystems(Array.from(current));
  }

  async function activateBatch(slugs: string[]) {
    if (!profile) return;
    const current = new Set(profile.activeSystems);
    for (const slug of slugs) current.add(slug);
    await updateActiveSystems(Array.from(current));
  }

  async function syncLiveSystems() {
    if (!profile || unsyncedSystems.length === 0) return;
    setSyncingWorkspace(true);
    setError(null);
    try {
      const res = await fetch("/api/business-profile/sync", { method: "POST" });
      const data = await res.json() as { ok?: boolean; profile?: Record<string, unknown>; };
      if (!res.ok || !data.ok) throw new Error("Failed to sync");

      if (data.profile) {
        setProfile(normalizeProfile(data.profile));
      }

      const statsRes = await fetch("/api/stats");
      const statsData = await statsRes.json() as { ok: boolean; stats?: WorkspaceStats | null };
      if (statsData.ok) {
        setWorkspaceStats(statsData.stats ?? null);
      }
    } catch {
      setError("We couldn't sync your workspace systems right now.");
    } finally {
      setSyncingWorkspace(false);
    }
  }

  async function recalculateRecommendation() {
    const current = profile ?? activeProfile;
    setRecalculating(true);
    setError(null);
    try {
      const res = await fetch("/api/business-profile/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType: current.businessType,
          niche: current.niche,
          goal: current.mainGoal,
          stage: current.stage,
        }),
      });
      const data = await res.json() as { ok: boolean; recommendation?: Recommendation };
      if (!res.ok || !data.ok) throw new Error("Failed to recalculate");
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          recommendedSystems: data.recommendation ?? null,
          recommendedAt: new Date().toISOString(),
        };
      });
      const statsRes = await fetch("/api/stats");
      const statsData = await statsRes.json() as { ok: boolean; stats?: WorkspaceStats | null };
      if (statsData.ok) {
        setWorkspaceStats(statsData.stats ?? null);
      }
    } catch {
      setError("We couldn't recalculate your system yet.");
    } finally {
      setRecalculating(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050a14] text-white">
        <AppNav />
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-cyan-300" />
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#050a14] text-white">
        <AppNav />
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.03] p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/35">Business OS</p>
                <h1 className="mt-1 text-3xl font-black text-white">Set Up Your Business Profile</h1>
              </div>
            </div>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/62">
              Tell Himalaya what kind of business you are building so every recommendation, workflow, and AI action can start from the right operating system.
            </p>

            <div className="mt-8 grid gap-4">
              <label className="grid gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Business Type</span>
                <select
                  value={quickProfile.businessType}
                  onChange={(event) => setQuickProfile((prev) => ({ ...prev, businessType: event.target.value as BusinessType }))}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500/40"
                >
                  {BUSINESS_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-[#09111f]">
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Niche</span>
                <input
                  value={quickProfile.niche}
                  onChange={(event) => setQuickProfile((prev) => ({ ...prev, niche: event.target.value }))}
                  placeholder="e.g. HVAC, Business Coach, Pet Products"
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none transition focus:border-cyan-500/40"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Primary Goal</span>
                <select
                  value={quickProfile.mainGoal}
                  onChange={(event) => setQuickProfile((prev) => ({ ...prev, mainGoal: event.target.value }))}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500/40"
                >
                  {GOAL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-[#09111f]">
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={saveQuickProfile}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-black text-white shadow-[0_0_30px_rgba(6,182,212,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Create My Business OS
              </button>
              <Link
                href="/setup"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/75"
              >
                Open Full Setup Wizard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8">
          <section className="rounded-[32px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(6,182,212,0.08),rgba(255,255,255,0.03))] p-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200/70">Your Business OS</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">Your recommended growth system based on your business type and goals</h1>
                <p className="mt-4 text-sm leading-7 text-white/60">
                  This is the operating system Himalaya thinks you should run right now based on your business type, stage, niche, and growth goal.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                    {archetype.emoji} {archetype.label}
                  </span>
                  {profile.niche && (
                    <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.05] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/75">
                      {profile.niche}
                    </span>
                  )}
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    href="/settings"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/75"
                  >
                    <Settings className="h-4 w-4" />
                    Edit Business Profile
                  </Link>
                  <button
                    onClick={recalculateRecommendation}
                    disabled={recalculating}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-3 text-sm font-black text-white shadow-[0_0_30px_rgba(6,182,212,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {recalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    Recalculate System
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 rounded-[28px] border border-white/[0.08] bg-black/20 px-8 py-6">
                <ScoreRing score={liveSystemScore} />
                <span className="inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">
                  {formatRelativeTime(profile.recommendedAt)}
                </span>
                <p className="text-center text-sm leading-6 text-white/55">
                  {liveSystemScore >= 70
                    ? "You have a strong operating system. Focus on tightening execution and scaling the winners."
                    : liveSystemScore >= 40
                      ? "You have momentum, but a few missing systems are still holding back conversions."
                      : "The biggest opportunity is building the core systems that create predictable growth."}
                </p>
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <DatabaseFallbackNotice visible={workspaceStats?.databaseUnavailable} />

          <section className="rounded-[30px] border border-white/[0.08] bg-white/[0.03] p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/30">OS Status</p>
                <h2 className="mt-2 text-2xl font-black text-white">Keep strategy, execution, and recommendations aligned</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
                  This is the operating status layer for your Business OS. It shows whether your recommendations are fresh, whether the workspace has drifted ahead of the profile, and how much of the system is actually live.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={syncLiveSystems}
                  disabled={saving || syncingWorkspace || unsyncedSystems.length === 0}
                  className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {syncingWorkspace ? "Syncing..." : unsyncedSystems.length > 0 ? `Sync ${unsyncedSystems.length} System${unsyncedSystems.length === 1 ? "" : "s"}` : "No Drift To Sync"}
                </button>
                <button
                  onClick={recalculateRecommendation}
                  disabled={recalculating}
                  className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm font-bold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Wand2 className="h-4 w-4" />
                  {recalculating ? "Refreshing..." : "Refresh Recommendations"}
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatusChip
                label="Guidance"
                value={formatRelativeTime(profile.recommendedAt)}
                tone={recommendationIsStale ? "amber" : "cyan"}
                detail={recommendationIsStale ? "Recommendation is getting stale" : "Recommendation is current"}
              />
              <StatusChip
                label="Verdict"
                value={workspaceStats?.osVerdict?.label || "Checking"}
                tone={statusToneFromVerdict(workspaceStats?.osVerdict?.status)}
                detail={workspaceStats?.osVerdict?.reason || "Shared Business OS health verdict across the app"}
              />
              <StatusChip
                label="Drift"
                value={unsyncedSystems.length === 0 ? "Aligned" : `${unsyncedSystems.length} unsynced`}
                tone={unsyncedSystems.length === 0 ? "emerald" : "amber"}
                detail={unsyncedSystems.length === 0 ? "Workspace matches OS" : "Live systems are ahead of profile"}
              />
              <StatusChip
                label="Live Systems"
                value={String(workspaceStats?.effectiveSystemsCount ?? workspaceLiveSystems.length)}
                tone="cyan"
                detail="Systems detected from real workspace activity"
              />
            </div>
          </section>

          <section className="rounded-[30px] border border-white/[0.08] bg-white/[0.03] p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/30">Live Workspace Pulse</p>
                <h2 className="mt-2 text-2xl font-black text-white">What is actually live in your OS right now</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
                  Your business strategy matters, but the real leverage comes from what is already built and active. This pulse shows the current execution layer behind the recommendation engine.
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/75"
              >
                <LayoutDashboard className="h-4 w-4" />
                Open Home Command Center
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {livePulseCards.map((card) => (
                <div key={card.label} className="rounded-[24px] border border-white/[0.08] bg-black/20 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/28">{card.label}</p>
                  <p className="mt-3 text-3xl font-black text-white">{card.value}</p>
                  <p className="mt-2 text-xs text-white/45">{card.sub}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/28">Execution Readiness</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400"
                    style={{ width: `${Math.min(Math.max(liveSystemScore, 4), 100)}%` }}
                  />
                </div>
                <p className="mt-4 text-sm leading-7 text-white/60">
                  {liveSystemScore >= 70
                    ? "Your execution layer is healthy. The next gains likely come from optimization and scale, not basic setup."
                    : liveSystemScore >= 40
                      ? "You have enough infrastructure to move, but one or two missing systems are still slowing down conversion or follow-up."
                      : "Your strategy is ahead of your execution. Activate more of the essential stack so the OS can start compounding."}
                </p>
              </div>

              <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/28">Missing Core Systems</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(workspaceStats?.missingCoreSystems?.length
                    ? workspaceStats.missingCoreSystems
                    : []).map((slug) => (
                    <span
                      key={slug}
                      className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200"
                    >
                      {slug.replace(/_/g, " ")}
                    </span>
                  ))}
                  {!(workspaceStats?.missingCoreSystems?.length) && (
                    <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
                      Core systems covered
                    </span>
                  )}
                </div>
                <p className="mt-4 text-sm leading-7 text-white/60">
                  This is the live execution check, not just theory. When these basics are covered, the rest of the OS gets much more effective.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/28">Live Systems Detected</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {workspaceLiveSystems.length > 0 ? (
                    workspaceLiveSystems.map((slug) => (
                      <span
                        key={slug}
                        className="inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100"
                      >
                        {slug.replace(/_/g, " ")}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/50">
                      No live systems detected yet
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/28">OS vs Workspace Drift</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {unsyncedSystems.length > 0 ? (
                    unsyncedSystems.map((slug) => (
                      <span
                        key={slug}
                        className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-100"
                      >
                        {slug.replace(/_/g, " ")}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
                      Strategy and execution are aligned
                    </span>
                  )}
                </div>
                <p className="mt-4 text-sm leading-7 text-white/60">
                  This shows where the workspace has real systems running but your OS profile has not been updated yet.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-white/[0.08] bg-white/[0.03] p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/30">Recommended Operating System</p>
                <h2 className="mt-2 text-2xl font-black text-white">Activate the core workflow in one move</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
                  This is the shortest path from strategy to execution for your {archetype.label.toLowerCase()}. Turn on the essential stack first, then layer the recommended systems that improve follow-up, scale, and retention.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => activateBatch(prioritizedSystems.essential.map(({ system }) => system.slug))}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-black text-white shadow-[0_0_30px_rgba(6,182,212,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Activate Essential Stack
                </button>
                <button
                  onClick={() => activateBatch([
                    ...prioritizedSystems.essential.map(({ system }) => system.slug),
                    ...prioritizedSystems.recommended.slice(0, 3).map(({ system }) => system.slug),
                  ])}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/75 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Zap className="h-4 w-4" />
                  Activate Growth Stack
                </button>
                <button
                  onClick={syncLiveSystems}
                  disabled={saving || syncingWorkspace || unsyncedSystems.length === 0}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/75 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {syncingWorkspace ? "Syncing..." : "Sync From Workspace"}
                </button>
              </div>
            </div>

            {unsyncedSystems.length > 0 && (
              <div className="mt-5 rounded-[24px] border border-amber-500/20 bg-amber-500/10 px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-200/80">Sync Available</p>
                <p className="mt-2 text-sm leading-7 text-white/75">
                  You already have live work in the workspace that the OS has not marked active yet.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {unsyncedSystems.map((slug) => (
                    <span
                      key={slug}
                      className="inline-flex items-center rounded-full border border-amber-500/20 bg-black/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-100"
                    >
                      {slug.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-4 lg:grid-cols-5">
              {workflowSystems.map((item, index) => {
                const active = profile.activeSystems.includes(item.slug) || isSystemLive(item.slug, workspaceStats);
                return (
                  <div key={item.slug} className="relative rounded-[24px] border border-white/[0.08] bg-black/20 p-4">
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border text-sm font-black ${active ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-white/[0.08] bg-white/[0.04] text-white/55"}`}>
                      0{index + 1}
                    </div>
                    <h3 className="mt-4 text-base font-black text-white">{item.label}</h3>
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/28">
                      {active ? "active now" : "recommended next"}
                    </p>
                    {index < workflowSystems.length - 1 && (
                      <div className="pointer-events-none absolute -right-2 top-8 hidden h-px w-4 bg-cyan-500/40 lg:block" />
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[30px] border border-white/[0.08] bg-white/[0.03] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                <Rocket className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/30">Your Growth Strategy</p>
                <h2 className="mt-1 text-2xl font-black text-white">Strategic Summary</h2>
              </div>
            </div>

            <p className="mt-5 text-base leading-8 text-white/65">
              {profile.recommendedSystems?.strategicSummary ||
                `Your ${archetype.label.toLowerCase()} should start with the essential systems that create trust, capture demand, and keep follow-up moving automatically. Once the foundation is live, layer in the recommended systems that increase efficiency and scale.`}
            </p>

            <div className="mt-6 rounded-[24px] border border-cyan-500/20 bg-cyan-500/10 px-5 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200/75">Start Here Today</p>
              <p className="mt-2 text-sm font-bold leading-7 text-white">
                {profile.recommendedSystems?.firstAction ||
                  `Activate ${prioritizedSystems.essential[0]?.system.name || "your website"} so your ${profile.niche || archetype.label.toLowerCase()} business has a live conversion path before anything else.`}
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                { label: "Day 30", value: profile.recommendedSystems?.milestones?.day30 || "Launch the core system and get the first workflow live." },
                { label: "Day 60", value: profile.recommendedSystems?.milestones?.day60 || "Run acquisition and follow-up together with clear offers and active tracking." },
                { label: "Day 90", value: profile.recommendedSystems?.milestones?.day90 || "Optimize what converts best and turn the strongest channel into your growth engine." },
              ].map((milestone) => (
                <div key={milestone.label} className="rounded-[24px] border border-white/[0.08] bg-black/20 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/28">{milestone.label}</p>
                  <p className="mt-3 text-sm leading-7 text-white/65">{milestone.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[30px] border border-white/[0.08] bg-white/[0.03] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.05] text-white/75">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/30">System Score Breakdown</p>
                <h2 className="mt-1 text-2xl font-black text-white">Where You Are Strong and What Is Missing</h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {scoreBreakdown.map((item) => {
                const width = `${(item.earned / item.points) * 100}%`;
                return (
                  <div key={item.label} className="rounded-[22px] border border-white/[0.07] bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-white">{item.label}</p>
                        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white/28">{item.active ? "active" : "not active"}</p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${item.active ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-white/[0.08] bg-white/[0.04] text-white/45"}`}>
                        {item.earned}/{item.points} pts
                      </span>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-700" style={{ width }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="grid gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-red-200/70">Essential</p>
              <h2 className="mt-2 text-2xl font-black text-white">Set These Up First</h2>
            </div>
            <div className="grid gap-5 xl:grid-cols-2">
              {prioritizedSystems.essential.map(({ system, meta }) => (
                <SystemCard
                  key={system.slug}
                  system={system}
                  active={profile.activeSystems.includes(system.slug)}
                  liveInstalled={isSystemLive(system.slug, workspaceStats)}
                  personalizedReason={meta?.personalizedReason}
                  essential
                  onActivate={() => activateSystem(system.slug, true)}
                />
              ))}
            </div>
          </section>

          <section className="grid gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-200/70">Recommended</p>
              <h2 className="mt-2 text-2xl font-black text-white">High Impact Next Steps</h2>
            </div>
            <div className="grid gap-5 xl:grid-cols-2">
              {prioritizedSystems.recommended.map(({ system, meta }) => (
                <SystemCard
                  key={system.slug}
                  system={system}
                  active={profile.activeSystems.includes(system.slug)}
                  liveInstalled={isSystemLive(system.slug, workspaceStats)}
                  personalizedReason={meta?.personalizedReason}
                  essential={false}
                  onActivate={() => activateSystem(system.slug, false)}
                />
              ))}
            </div>
          </section>

          <section className="rounded-[30px] border border-white/[0.08] bg-white/[0.03] p-6">
            <button
              onClick={() => setShowOptional((prev) => !prev)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/30">Optional</p>
                <h2 className="mt-2 text-2xl font-black text-white">Scale & Optimize</h2>
              </div>
              <ChevronDown className={`h-5 w-5 text-white/60 transition ${showOptional ? "rotate-180" : ""}`} />
            </button>

            {showOptional && (
              <div className="mt-6 grid gap-5 xl:grid-cols-2">
                {prioritizedSystems.optional.map(({ system, meta }) => (
                  <SystemCard
                    key={system.slug}
                    system={system}
                    active={profile.activeSystems.includes(system.slug)}
                    liveInstalled={isSystemLive(system.slug, workspaceStats)}
                    personalizedReason={meta?.personalizedReason}
                    essential={false}
                    onActivate={() => activateSystem(system.slug, false)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/30">Quick Actions</p>
              <h2 className="mt-2 text-2xl font-black text-white">Move the system forward now</h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {[
                { title: "Find Leads Now", href: "/leads", icon: Zap, tone: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/20" },
                { title: "Build Your Website", href: "/websites/new", icon: Globe, tone: "from-blue-500/20 to-blue-500/5 border-blue-500/20" },
                { title: "Create Your First Campaign", href: "/campaigns/new", icon: CheckCircle2, tone: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20" },
                {
                  title: "Ask Copilot for Strategy",
                  href: `/copilot?prefill=${encodeURIComponent(`Give me a full growth plan for my ${archetype.label} business in ${profile.niche || "my niche"}`)}`,
                  icon: BotMessageSquare,
                  tone: "from-violet-500/20 to-violet-500/5 border-violet-500/20",
                },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.title}
                    href={action.href}
                    className={`rounded-[28px] border bg-gradient-to-br ${action.tone} p-5 transition hover:border-cyan-400/30 hover:shadow-[0_0_28px_rgba(6,182,212,0.08)]`}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-black/20 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-black text-white">{action.title}</h3>
                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-white/70">
                      Open
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
