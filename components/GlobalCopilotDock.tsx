"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  ChevronUp,
  CircleAlert,
  CreditCard,
  GripHorizontal,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

type SettingsPayload = {
  onboardingCompleted?: boolean;
  workspaceName?: string | null;
  businessUrl?: string | null;
  businessType?: string | null;
  plan?: string | null;
  databaseUnavailable?: boolean;
};

type StatsPayload = {
  campaigns?: number;
  activeCampaigns?: number;
  databaseUnavailable?: boolean;
  unsyncedSystems?: string[];
  osVerdict?: {
    status?: string;
    label?: string;
    reason?: string;
  };
};

type BusinessProfileSummary = {
  businessType: string;
  businessName?: string | null;
  niche?: string | null;
  location?: string | null;
  website?: string | null;
  mainGoal?: string | null;
  stage?: string | null;
  activeSystems: string[];
  systemScore?: number;
  recommendedAt?: string | null;
  recommendedSystems?: {
    strategicSummary?: string;
    firstAction?: string;
    prioritizedSystems?: Array<{
      slug: string;
      personalizedReason?: string;
    }>;
  } | null;
};

type DockState = {
  settings: SettingsPayload | null;
  businessProfile: BusinessProfileSummary | null;
  credits: number | null;
  campaigns: number;
  sites: number;
  leads: number;
  emailFlows: number;
  publishedSites: number;
  activeCampaigns: number;
  unsyncedSystems: string[];
  osVerdict: StatsPayload["osVerdict"] | null;
  databaseUnavailable: boolean;
  loadError?: boolean;
};

type ActionItem = {
  label: string;
  href: string;
  tone: "primary" | "secondary" | "warning";
};

type Reminder = {
  id: string;
  label: string;
  href: string;
  icon: "warning" | "success" | "billing";
};

type NextAction = {
  title: string;
  body: string;
  href: string;
  cta: string;
  impact?: string;
};

const INITIAL_STATE: DockState = {
  settings: null,
  businessProfile: null,
  credits: null,
  campaigns: 0,
  sites: 0,
  leads: 0,
  emailFlows: 0,
  publishedSites: 0,
  activeCampaigns: 0,
  unsyncedSystems: [],
  osVerdict: null,
  databaseUnavailable: false,
};

function toneClass(tone: ActionItem["tone"]) {
  if (tone === "primary") {
    return "bg-gradient-to-r from-[#f5a623] to-[#e07850] text-white shadow-[0_0_24px_rgba(245,166,35,0.25)]";
  }
  if (tone === "warning") {
    return "border border-amber-500/30 bg-amber-500/10 text-amber-300";
  }
  return "border border-white/[0.08] bg-white/[0.04] text-white/65";
}

function reminderIcon(icon: Reminder["icon"]) {
  if (icon === "billing") return <CreditCard className="h-3.5 w-3.5 text-amber-300" />;
  if (icon === "success") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />;
  return <CircleAlert className="h-3.5 w-3.5 text-orange-300" />;
}

function relativeTime(iso?: string | null) {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function verdictTone(status?: string) {
  if (status === "healthy") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  if (status === "stale") return "border-[#f5a623]/20 bg-[#f5a623]/10 text-cyan-100";
  return "border-amber-500/20 bg-amber-500/10 text-amber-100";
}

function dockBounds(compact: boolean) {
  return {
    maxX: Math.max(window.innerWidth - (compact ? 96 : 390), 0),
    maxY: Math.max(window.innerHeight - (compact ? 76 : 760), 0),
  };
}

function clampDockPosition(next: { x: number; y: number }, compact: boolean) {
  const bounds = dockBounds(compact);
  return {
    x: Math.min(Math.max(next.x, 0), bounds.maxX),
    y: Math.min(Math.max(next.y, 0), bounds.maxY),
  };
}

export default function GlobalCopilotDock() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useUser();
  const [expanded, setExpanded] = useState(true);
  const [compact, setCompact] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [state, setState] = useState<DockState>(INITIAL_STATE);
  const [refreshKey, setRefreshKey] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [refreshingRecommendations, setRefreshingRecommendations] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({
    pointerId: null as number | null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  const hidden = useMemo(() => {
    if (!pathname) return false;
    return (
      pathname.startsWith("/sign-in") ||
      pathname.startsWith("/sign-up") ||
      pathname.startsWith("/s/") ||
      pathname === "/_not-found"
    );
  }, [pathname]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || hidden) return;

    let cancelled = false;

    async function load() {
      try {
        const [settingsRes, creditsRes, statsRes, campaignsRes, sitesRes, leadsRes, profileRes, emailFlowsRes] = await Promise.allSettled([
          fetch("/api/settings").then((res) => res.json() as Promise<{ ok: boolean; settings?: SettingsPayload }>),
          fetch("/api/user/credits").then((res) => res.json() as Promise<{ ok: boolean; credits?: number }>),
          fetch("/api/stats").then((res) => res.json() as Promise<{ ok: boolean; stats?: StatsPayload }>),
          fetch("/api/campaigns").then((res) => res.json() as Promise<{ ok: boolean; campaigns?: Array<unknown> }>),
          fetch("/api/sites").then((res) => res.json() as Promise<{ ok: boolean; sites?: Array<{ published?: boolean }> }>),
          fetch("/api/leads").then((res) => res.json() as Promise<{ ok: boolean; leads?: Array<unknown> }>),
          fetch("/api/business-profile").then((res) => res.json() as Promise<{ ok: boolean; profile?: BusinessProfileSummary | null }>),
          fetch("/api/email-flows").then((res) => res.json() as Promise<{ ok: boolean; flows?: Array<unknown> }>),
        ]);

        if (cancelled) return;

        setState({
          settings: settingsRes.status === "fulfilled" && settingsRes.value.ok ? settingsRes.value.settings ?? null : null,
          businessProfile: profileRes.status === "fulfilled" && profileRes.value.ok ? profileRes.value.profile ?? null : null,
          credits: creditsRes.status === "fulfilled" && creditsRes.value.ok ? creditsRes.value.credits ?? null : null,
          campaigns: campaignsRes.status === "fulfilled" && campaignsRes.value.ok ? campaignsRes.value.campaigns?.length ?? 0 : 0,
          sites: sitesRes.status === "fulfilled" && sitesRes.value.ok ? sitesRes.value.sites?.length ?? 0 : 0,
          emailFlows: emailFlowsRes.status === "fulfilled" && emailFlowsRes.value.ok ? emailFlowsRes.value.flows?.length ?? 0 : 0,
          publishedSites:
            sitesRes.status === "fulfilled" && sitesRes.value.ok
              ? sitesRes.value.sites?.filter((site) => Boolean(site.published)).length ?? 0
              : 0,
          leads: leadsRes.status === "fulfilled" && leadsRes.value.ok ? leadsRes.value.leads?.length ?? 0 : 0,
          activeCampaigns: statsRes.status === "fulfilled" && statsRes.value.ok ? statsRes.value.stats?.activeCampaigns ?? 0 : 0,
          unsyncedSystems: statsRes.status === "fulfilled" && statsRes.value.ok ? statsRes.value.stats?.unsyncedSystems ?? [] : [],
          osVerdict: statsRes.status === "fulfilled" && statsRes.value.ok ? statsRes.value.stats?.osVerdict ?? null : null,
          databaseUnavailable:
            (settingsRes.status === "fulfilled" && settingsRes.value.ok ? Boolean(settingsRes.value.settings?.databaseUnavailable) : false) ||
            (statsRes.status === "fulfilled" && statsRes.value.ok ? Boolean(statsRes.value.stats?.databaseUnavailable) : false),
        });
      } catch {
        if (!cancelled) setState({ ...INITIAL_STATE, loadError: true });
      }
    }

    void load();
    const interval = setInterval(() => void load(), 45000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [hidden, isLoaded, isSignedIn, pathname, refreshKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("global-copilot-dock-ui");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as {
        expanded?: boolean;
        compact?: boolean;
        collapsed?: boolean;
        position?: { x?: number; y?: number };
      };
      if (typeof parsed.expanded === "boolean") setExpanded(parsed.expanded);
      if (typeof parsed.compact === "boolean") setCompact(parsed.compact);
      if (typeof parsed.collapsed === "boolean") setCollapsed(parsed.collapsed);
      if (parsed.position && typeof parsed.position.x === "number" && typeof parsed.position.y === "number") {
        setPosition({ x: parsed.position.x, y: parsed.position.y });
      }
    } catch {
      // Ignore invalid saved UI state.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "global-copilot-dock-ui",
      JSON.stringify({ expanded, compact, collapsed, position })
    );
  }, [collapsed, compact, expanded, position]);

  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      if (dragRef.current.pointerId !== event.pointerId) return;
      const nextX = dragRef.current.originX + (event.clientX - dragRef.current.startX);
      const nextY = dragRef.current.originY + (event.clientY - dragRef.current.startY);
      setPosition(clampDockPosition({ x: nextX, y: nextY }, compact));
    }

    function stopDragging(event?: PointerEvent) {
      if (event && dragRef.current.pointerId !== event.pointerId) return;
      dragRef.current.pointerId = null;
      setDragging(false);
    }

    function onResize() {
      setPosition((current) => clampDockPosition(current, compact));
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
      window.removeEventListener("resize", onResize);
    };
  }, [compact]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth < 768) {
      setCompact(true);
      setExpanded(false);
      setCollapsed(true);
    }
  }, []);

  function resetDockPosition() {
    dragRef.current.pointerId = null;
    setDragging(false);
    setPosition({ x: 0, y: 0 });
  }

  async function syncBusinessSystem() {
    try {
      setSyncing(true);
      const res = await fetch("/api/business-profile/sync", { method: "POST" });
      const data = await res.json() as { ok?: boolean };
      if (!res.ok || !data.ok) {
        throw new Error("Failed to sync");
      }
      setRefreshKey((value) => value + 1);
    } catch {
      // Keep the dock resilient; the user still has /my-system fallback.
    } finally {
      setSyncing(false);
    }
  }

  async function refreshBusinessSystem() {
    if (!state.businessProfile?.businessType) return;
    try {
      setRefreshingRecommendations(true);
      const res = await fetch("/api/business-profile/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType: state.businessProfile.businessType,
          niche: state.businessProfile.niche,
          goal: state.businessProfile.mainGoal,
          stage: state.businessProfile.stage,
        }),
      });
      const data = await res.json() as { ok?: boolean };
      if (!res.ok || !data.ok) {
        throw new Error("Failed to refresh");
      }
      setRefreshKey((value) => value + 1);
    } catch {
      // Keep dock resilient.
    } finally {
      setRefreshingRecommendations(false);
    }
  }

  const reminders = useMemo<Reminder[]>(() => {
    const next: Reminder[] = [];
    const businessProfile = state.businessProfile;
    const prioritizedSlug = businessProfile?.recommendedSystems?.prioritizedSystems?.[0]?.slug;

    if (state.databaseUnavailable) {
      next.push({
        id: "database-unavailable",
        label: "Production workspace data is temporarily unavailable",
        href: "/settings",
        icon: "warning",
      });
    }

    if (!state.settings?.onboardingCompleted) {
      next.push({
        id: "onboarding",
        label: "Finish onboarding or skip it cleanly",
        href: "/setup",
        icon: "warning",
      });
    }

    if ((state.credits ?? 999) < 20) {
      next.push({
        id: "credits",
        label: "Low credits. Top up before creative work stalls",
        href: "/billing",
        icon: "billing",
      });
    }

    if (!state.settings?.businessUrl) {
      next.push({
        id: "business-profile",
        label: "Add your main business URL in settings",
        href: "/setup",
        icon: "warning",
      });
    }

    if (!businessProfile) {
      next.push({
        id: "os-setup",
        label: "Finish your Business OS so every tool inherits your niche and goals",
        href: "/setup",
        icon: "warning",
      });
    }

    if (state.sites === 0 && shouldPrioritizeSystem(prioritizedSlug, businessProfile?.activeSystems, ["website"])) {
      next.push({
        id: "site-missing",
        label: "Your system says the website should be built next",
        href: businessProfile?.website ? "/websites" : "/websites/new",
        icon: "warning",
      });
    }

    if (state.emailFlows === 0 && shouldPrioritizeSystem(prioritizedSlug, businessProfile?.activeSystems, ["email_sequence", "sms_followup", "abandoned_cart"])) {
      next.push({
        id: "email-missing",
        label: "You are missing the follow-up sequence this business profile needs",
        href: "/emails",
        icon: "warning",
      });
    }

    if (state.campaigns > 0 && state.activeCampaigns === 0) {
      next.push({
        id: "campaign-progress",
        label: "You have campaign drafts waiting to be pushed forward",
        href: "/campaigns",
        icon: "success",
      });
    }

    if (state.sites > 0 && state.publishedSites === 0) {
      next.push({
        id: "publish-site",
        label: "A site draft is ready but still not published",
        href: "/websites",
        icon: "success",
      });
    }

    if (state.unsyncedSystems.length > 0) {
      next.push({
        id: "sync-os",
        label: `Sync ${state.unsyncedSystems.length} live system${state.unsyncedSystems.length === 1 ? "" : "s"} into My System`,
        href: "/my-system",
        icon: "warning",
      });
    }

    const recommendationAge = state.businessProfile?.recommendedAt
      ? Date.now() - new Date(state.businessProfile.recommendedAt).getTime()
      : null;
    if (!state.unsyncedSystems.length && recommendationAge !== null && recommendationAge > 1000 * 60 * 60 * 24 * 7) {
      next.push({
        id: "refresh-os",
        label: "Your Business OS guidance is getting stale. Refresh recommendations",
        href: "/my-system",
        icon: "warning",
      });
    }

    return next.slice(0, 4);
  }, [state]);

  const recommendationIsStale = useMemo(() => {
    if (!state.businessProfile?.recommendedAt) return false;
    return Date.now() - new Date(state.businessProfile.recommendedAt).getTime() > 1000 * 60 * 60 * 24 * 7;
  }, [state.businessProfile?.recommendedAt]);

  const nextBestAction = useMemo<NextAction>(() => {
    return getNextBestAction({
      businessProfile: state.businessProfile,
      campaigns: state.campaigns,
      sites: state.sites,
      leads: state.leads,
      emailFlows: state.emailFlows,
      publishedSites: state.publishedSites,
      activeCampaigns: state.activeCampaigns,
    });
  }, [state]);

  const actionStream = useMemo<NextAction[]>(() => {
    const actions: NextAction[] = [nextBestAction];

    if (!state.businessProfile) {
      actions.push({
        title: "Open My System after setup",
        body: "This is where your recommended stack, milestones, and active systems live.",
        href: "/my-system",
        cta: "Open My System",
      });
    } else {
      actions.push({
        title: "Review your Business OS",
        body: state.businessProfile.recommendedSystems?.strategicSummary || "See the exact systems, score, and priorities guiding the rest of the app.",
        href: "/my-system",
        cta: "Open My System",
      });
    }

    if (state.campaigns === 0) {
      actions.push({
        title: "Stand up a campaign lane",
        body: "Once traffic starts, the rest of the OS has something real to optimize and follow up.",
        href: "/campaigns/new",
        cta: "Create campaign",
      });
    } else if (state.activeCampaigns === 0) {
      actions.push({
        title: "Advance one campaign out of draft",
        body: "The fastest compounding move is getting one current campaign into testing instead of starting a new one.",
        href: "/campaigns",
        cta: "Open campaigns",
      });
    }

    return actions.slice(0, 3);
  }, [nextBestAction, state]);

  const actions = useMemo<ActionItem[]>(() => {
    if (pathname.startsWith("/campaigns")) {
      return [
        { label: "Continue campaign build", href: "/campaigns", tone: "primary" },
        { label: "Turn campaign into a site", href: "/websites", tone: "secondary" },
        { label: "Wire follow-up emails", href: "/emails", tone: "secondary" },
      ];
    }

    if (pathname.startsWith("/websites")) {
      return [
        { label: "Keep building this site", href: pathname, tone: "primary" },
        { label: "Manage store products", href: "/products", tone: "secondary" },
        { label: "Launch related campaign", href: "/campaigns", tone: "secondary" },
      ];
    }

    if (pathname.startsWith("/products")) {
      return [
        { label: "Scan another product", href: "/products", tone: "primary" },
        { label: "Generate campaign assets", href: "/campaigns", tone: "secondary" },
        { label: "Build a storefront", href: "/websites", tone: "secondary" },
      ];
    }

    if (pathname.startsWith("/emails")) {
      return [
        { label: "Continue email automation", href: "/emails", tone: "primary" },
        { label: "Back to campaigns", href: "/campaigns", tone: "secondary" },
        { label: "Review client list", href: "/clients", tone: "secondary" },
      ];
    }

    if (pathname.startsWith("/leads")) {
      return [
        { label: "Process lead pipeline", href: "/leads", tone: "primary" },
        { label: "Build assets from leads", href: "/campaigns", tone: "secondary" },
        { label: "Deploy a site", href: "/websites", tone: "secondary" },
      ];
    }

    return [
      { label: nextBestAction.cta, href: nextBestAction.href, tone: "primary" },
      { label: state.unsyncedSystems.length > 0 ? "Sync My System" : state.campaigns === 0 ? "Start a campaign" : "Open campaigns", href: state.unsyncedSystems.length > 0 ? "/my-system" : state.campaigns === 0 ? "/analyze" : "/campaigns", tone: state.unsyncedSystems.length > 0 ? "warning" : "secondary" },
      { label: "Open My System", href: "/my-system", tone: "secondary" },
    ];
  }, [nextBestAction.cta, nextBestAction.href, pathname, state.campaigns, state.unsyncedSystems.length]);

  const statusLine = useMemo(() => {
    const name = state.settings?.workspaceName || "your workspace";
    const plan = (state.settings?.plan || "free").toUpperCase();
    return `${name} · ${plan} plan`;
  }, [state.settings]);

  const compactLabel = useMemo(() => {
    if (reminders.length > 0) return `${reminders.length} reminder${reminders.length === 1 ? "" : "s"}`;
    if (state.unsyncedSystems.length > 0) return "Sync OS";
    if (state.osVerdict?.status === "stale") return "Refresh OS";
    return "Copilot";
  }, [reminders.length, state.osVerdict?.status, state.unsyncedSystems.length]);

  if (!isLoaded || !isSignedIn || hidden) return null;

  return (
    <div
      className="fixed z-[60]"
      style={{
        right: "1.25rem",
        bottom: "1.25rem",
        transform: `translate(${-position.x}px, ${-position.y}px)`,
      }}
    >
      {collapsed ? (
        <button
          onClick={() => {
            setCollapsed(false);
            setCompact(false);
            setExpanded(true);
          }}
          className="group flex h-[132px] w-[46px] items-center justify-center overflow-hidden rounded-[20px] border border-white/[0.1] bg-[#06101de8] shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition hover:border-[#f5a623]/25 hover:bg-[#081423ee]"
          aria-label="Open Copilot dock"
        >
          <div className="flex -rotate-90 items-center gap-2 whitespace-nowrap">
            <Sparkles className="h-4 w-4 text-[#f5a623]" />
            <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">
              {compactLabel}
            </span>
          </div>
        </button>
      ) : (
      <div className="relative">
        {!compact && (
          <div className="absolute left-[-58px] top-24 z-10 flex flex-col gap-2">
            <button
              onClick={() => setCompact(true)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-[#06101de8] text-white/65 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition hover:border-[#f5a623]/25 hover:text-white"
              aria-label="Compact dock"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCollapsed(true)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-[#06101de8] text-white/65 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition hover:border-[#f5a623]/25 hover:text-white"
              aria-label="Hide dock"
            >
              <ChevronUp className="h-4 w-4 rotate-90" />
            </button>
          </div>
        )}

        <div
          className={`flex max-h-[calc(100vh-1.5rem)] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden border border-white/[0.1] bg-[#06101de8] shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-[width,border-radius] ${
            compact ? "w-[86px] rounded-[22px]" : "w-[350px] rounded-[28px]"
          }`}
        >
        {state.loadError && (
          <div className="border-b border-red-500/20 bg-red-500/10 px-4 py-2.5 text-[11px] leading-5 text-red-200 flex items-center gap-2">
            <CircleAlert className="w-3.5 h-3.5 shrink-0" />
            Could not load workspace data. Check your connection.
          </div>
        )}
        {state.databaseUnavailable && (
          <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-3 text-[11px] leading-5 text-amber-100">
            Workspace data is running in fallback mode because the production database is unreachable.
          </div>
        )}
        <div
          onPointerDown={(event) => {
            dragRef.current = {
              pointerId: event.pointerId,
              startX: event.clientX,
              startY: event.clientY,
              originX: position.x,
              originY: position.y,
            };
            setDragging(true);
          }}
          onDoubleClick={() => resetDockPosition()}
          className={`relative flex w-full items-center text-left ${
            compact ? "justify-center px-2 py-2.5" : "justify-between px-4 py-4"
          } select-none touch-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f5a623] to-[#e07850] shadow-[0_0_25px_rgba(245,166,35,0.3)]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            {!compact ? (
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#f5a623]/80">Copilot Live</p>
                  <GripHorizontal className="h-3.5 w-3.5 text-white/25" />
                </div>
                <p className="text-sm font-black text-white">Tasks, reminders, and next moves</p>
                <p className="text-[11px] text-white/35">{statusLine}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {reminders.length > 0 && (
                  <div className="flex items-center justify-center rounded-full border border-orange-500/25 bg-orange-500/10 px-1.5 py-0.5 text-[9px] font-black text-orange-300">
                    {reminders.length}
                  </div>
                )}
                <div className="text-center text-[10px] font-black text-white/70">
                  {state.credits ?? "—"}
                </div>
              </div>
            )}
          </div>
          <div className={`flex items-center gap-2 ${compact ? "absolute right-2 top-2" : ""}`}>
            {!compact && reminders.length > 0 && (
              <div className="flex items-center gap-1 rounded-full border border-orange-500/25 bg-orange-500/10 px-2 py-1 text-[10px] font-bold text-orange-300">
                <BellRing className="h-3 w-3" />
                {reminders.length}
              </div>
            )}
            {compact ? (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setCompact(false);
                }}
                className="rounded-lg border border-white/[0.08] bg-white/[0.05] p-1.5 text-white/55 transition hover:bg-white/[0.09] hover:text-white/80"
                aria-label="Expand dock"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setCompact(true);
                }}
                className="rounded-xl border border-white/[0.08] bg-white/[0.05] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/65 transition hover:bg-white/[0.09] hover:text-white"
                aria-label="Make dock smaller"
              >
                Make Smaller
              </button>
            )}
            {!compact && (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  resetDockPosition();
                }}
                className="rounded-lg border border-white/[0.08] bg-white/[0.05] p-1.5 text-white/55 transition hover:bg-white/[0.09] hover:text-white/80"
                aria-label="Reset dock position"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
            {!compact && (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setCollapsed(true);
                }}
                className="rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/55 transition hover:bg-white/[0.09] hover:text-white/80"
                aria-label="Hide dock"
              >
                Hide
              </button>
            )}
            {!compact && (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setExpanded((value) => !value);
                }}
                className="rounded-lg border border-white/[0.08] bg-white/[0.05] p-1.5 text-white/55 transition hover:bg-white/[0.09] hover:text-white/80"
                aria-label={expanded ? "Collapse panel" : "Expand panel"}
              >
                <ChevronUp className={`h-4 w-4 transition ${expanded ? "" : "rotate-180"}`} />
              </button>
            )}
          </div>
        </div>

        {!compact && expanded && (
          <div className="space-y-4 overflow-y-auto border-t border-white/[0.07] px-4 pb-4 pt-4">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Next Best Action</p>
                <span className="text-[11px] text-[#f5a623]">{nextBestAction.impact || pathname}</span>
              </div>
              <div className="mb-3 rounded-2xl border border-[#f5a623]/15 bg-[#f5a623]/8 p-3">
                <p className="text-sm font-black text-white">{nextBestAction.title}</p>
                <p className="mt-1 text-xs leading-6 text-white/50">{nextBestAction.body}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {actions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${toneClass(action.tone)}`}
                  >
                    {action.label}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/25">Sites</p>
                <p className="mt-1 text-lg font-black text-white">{state.sites}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/25">Campaigns</p>
                <p className="mt-1 text-lg font-black text-white">{state.campaigns}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/25">Credits</p>
                <p className="mt-1 text-lg font-black text-white">{state.credits ?? "—"}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/25">OS Freshness</p>
                <span className="text-[11px] font-bold text-[#f5a623]">
                  {relativeTime(state.businessProfile?.recommendedAt)}
                </span>
              </div>
              {state.osVerdict?.label && (
                <span className={`mt-3 inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${verdictTone(state.osVerdict.status)}`}>
                  {state.osVerdict.label}
                </span>
              )}
              <p className="mt-2 text-[11px] leading-5 text-white/45">
                {state.osVerdict?.reason ||
                (state.unsyncedSystems.length > 0
                  ? "Live work changed the system. Sync or refresh to keep guidance aligned."
                  : "This shows how recently the Business OS recommendation layer was refreshed.")}
              </p>
              {recommendationIsStale && state.unsyncedSystems.length === 0 && (
                <button
                  onClick={refreshBusinessSystem}
                  disabled={refreshingRecommendations}
                  className="mt-3 w-full rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/10 px-3 py-2 text-xs font-bold text-cyan-100 transition hover:bg-[#f5a623]/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {refreshingRecommendations ? "Refreshing recommendations..." : "Refresh Recommendations"}
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
              <div className="mb-2 flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-[#f5a623]" />
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Action Stream</p>
              </div>
              <div className="space-y-2">
                {actionStream.map((action, index) => (
                  <Link
                    key={`${action.title}-${index}`}
                    href={action.href}
                    className="block rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2 transition hover:border-[#f5a623]/25 hover:bg-[#f5a623]/5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold text-white">{action.title}</p>
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f5a623]">
                        {index === 0 ? "Now" : `Next ${index}`}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-5 text-white/45">{action.body}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
              <div className="mb-2 flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-[#f5a623]" />
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Reminders</p>
              </div>
              {state.unsyncedSystems.length > 0 && (
                <button
                  onClick={syncBusinessSystem}
                  disabled={syncing}
                  className="mb-2 flex w-full items-center justify-between rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-100 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>Sync {state.unsyncedSystems.length} live system{state.unsyncedSystems.length === 1 ? "" : "s"} now</span>
                  <span className="text-[11px]">{syncing ? "Syncing..." : "Repair OS"}</span>
                </button>
              )}
              <div className="space-y-2">
                {reminders.length > 0 ? (
                  reminders.map((reminder) => (
                    <Link
                      key={reminder.id}
                      href={reminder.href}
                      className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2 text-xs text-white/70 transition hover:border-[#f5a623]/25 hover:bg-[#f5a623]/5"
                    >
                      <span className="flex items-center gap-2">
                        {reminderIcon(reminder.icon)}
                        {reminder.label}
                      </span>
                      <ArrowRight className="h-3 w-3 text-white/30" />
                    </Link>
                  ))
                ) : (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3 py-2 text-xs text-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    You’re clear to keep building.
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/copilot"
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#f5a623] to-[#e07850] px-4 py-3 text-sm font-black text-white"
              >
                <Zap className="h-4 w-4" />
                Open Full Copilot
              </Link>
              <Link
                href="/billing"
                className="flex items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/65"
              >
                Billing
              </Link>
            </div>
          </div>
        )}
        </div>
      </div>
      )}
    </div>
  );
}

function getNextBestAction(input: {
  businessProfile: BusinessProfileSummary | null;
  campaigns: number;
  sites: number;
  leads: number;
  emailFlows: number;
  publishedSites: number;
  activeCampaigns: number;
}): NextAction {
  const { businessProfile, campaigns, sites, leads, emailFlows, publishedSites, activeCampaigns } = input;
  const prioritizedSlug = businessProfile?.recommendedSystems?.prioritizedSystems?.[0]?.slug;

  if (!businessProfile) {
    return {
      title: "Finish your Business OS setup",
      body: "Once your business type, niche, and goals are locked in, this assistant can guide every page, campaign, and workflow with much better precision.",
      href: "/setup",
      cta: "Complete setup",
      impact: "Foundation",
    };
  }

  if (sites === 0 && shouldPrioritizeSystem(prioritizedSlug, businessProfile.activeSystems, ["website"])) {
    return {
      title: "Create the first conversion site",
      body: businessProfile.website
        ? "You already have a main site URL saved, so the strongest move is to scan and improve it."
        : "Your profile is pointing to the website layer as the next core system to activate.",
      href: businessProfile.website ? "/websites" : "/websites/new",
      cta: businessProfile.website ? "Improve site" : "Create site",
      impact: "Conversion",
    };
  }

  if (emailFlows === 0 && shouldPrioritizeSystem(prioritizedSlug, businessProfile.activeSystems, ["email_sequence", "sms_followup", "abandoned_cart"])) {
    return {
      title: "Install your follow-up engine",
      body: "This business type gets stronger when every lead or buyer gets a next touch automatically instead of relying on memory.",
      href: "/emails",
      cta: "Build email flow",
      impact: "Follow-up",
    };
  }

  if (campaigns === 0 && shouldPrioritizeSystem(prioritizedSlug, businessProfile.activeSystems, ["google_ads", "facebook_ads", "tiktok_ads"])) {
    return {
      title: "Launch the first traffic system",
      body: "The operating system is telling you to stand up traffic now, not later, so the rest of the stack has demand flowing through it.",
      href: systemHref(prioritizedSlug),
      cta: "Start campaign",
      impact: "Acquisition",
    };
  }

  if (leads === 0 && isLeadDrivenBusiness(businessProfile.businessType)) {
    return {
      title: "Feed the pipeline with fresh leads",
      body: "This business profile depends on consistent pipeline volume. Bring fresh opportunities into the system and push them into campaigns and follow-up.",
      href: "/leads",
      cta: "Find leads",
      impact: "Pipeline",
    };
  }

  if (sites > 0 && publishedSites === 0) {
    return {
      title: "Publish the site draft you already have",
      body: "You have enough built. Going live now creates a real destination for offers, campaigns, and forms.",
      href: "/websites",
      cta: "Publish site",
      impact: "Go live",
    };
  }

  if (campaigns > 0 && activeCampaigns === 0) {
    return {
      title: "Move one campaign into testing",
      body: "The biggest next gain is execution. Choose one draft and push it into active testing instead of adding more unfinished work.",
      href: "/campaigns",
      cta: "Advance campaign",
      impact: "Momentum",
    };
  }

  return {
    title: "Use Copilot to sequence the next sprint",
    body: businessProfile.recommendedSystems?.firstAction || "The core systems are in place enough now that the best move depends on what you want to push harder this week.",
    href: "/copilot",
    cta: "Ask Copilot",
    impact: "Guidance",
  };
}

function shouldPrioritizeSystem(prioritizedSlug: string | undefined, activeSystems: string[] | undefined, candidates: string[]) {
  const active = activeSystems ?? [];
  if (prioritizedSlug && candidates.includes(prioritizedSlug)) return true;
  return candidates.some((candidate) => active.includes(candidate));
}

function isLeadDrivenBusiness(businessType: string | undefined | null) {
  return ["local_service", "agency", "consultant_coach", "financial", "real_estate"].includes(businessType ?? "");
}

function systemHref(slug: string | undefined) {
  switch (slug) {
    case "google_ads":
      return "/campaigns/new?type=google";
    case "facebook_ads":
      return "/campaigns/new?type=facebook";
    case "tiktok_ads":
      return "/campaigns/new?type=tiktok";
    default:
      return "/campaigns/new";
  }
}
