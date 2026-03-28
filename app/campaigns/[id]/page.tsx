"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import CreativeStudio, { type StudioBrief } from "@/components/studio/CreativeStudio";
import DatabaseFallbackNotice from "@/components/DatabaseFallbackNotice";

// ── Types ────────────────────────────────────────────────────────────────────

type VariationMetrics = {
  impressions?: number;
  clicks?: number;
  ctr?: string;
  roas?: number;
  spend?: number;
  conversions?: number;
};

type AdVariation = {
  id: string;
  name: string;
  type: string;
  content: Record<string, unknown>;
  platform: string | null;
  status: string;
  notes: string | null;
  metrics: VariationMetrics | null;
  sortOrder: number;
};

type LandingDraft = {
  id: string;
  headline: string | null;
  subheadline: string | null;
  trustBar: string[] | null;
  bullets: string[] | null;
  socialProof: string | null;
  guarantee: string | null;
  faqItems: { question: string; answer: string }[] | null;
  ctaCopy: string | null;
  urgencyLine: string | null;
  status: string;
};

type EmailDraft = {
  id: string;
  sequence: string;
  position: number;
  subject: string | null;
  preview: string | null;
  body: string | null;
  timing: string | null;
  status: string;
};

type ChecklistItem = {
  id: string;
  day: string;
  position: number;
  text: string;
  done: boolean;
};

type AnalysisRun = {
  inputUrl: string;
  title: string | null;
  verdict: string | null;
  score: number | null;
  confidence: string | null;
  summary: string | null;
  mode: string;
  decisionPacket: Record<string, unknown> | null;
};

type ExecutionTier = "core" | "elite";

type Campaign = {
  id: string;
  name: string;
  mode: string;
  status: string;
  productName: string | null;
  productUrl: string | null;
  notes: string | null;
  createdAt: string;
  adVariations: AdVariation[];
  landingDraft: LandingDraft | null;
  emailDrafts: EmailDraft[];
  checklistItems: ChecklistItem[];
  analysisRun: AnalysisRun | null;
  workflowState?: {
    executionTier?: ExecutionTier;
  } | null;
};

type BusinessProfileSummary = {
  businessType: string;
  businessName: string | null;
  niche: string | null;
  location: string | null;
  mainOffer: string | null;
  targetAudience: string | null;
  mainGoal: string | null;
  stage: string;
  activeSystems: string[];
};

// ── Constants ────────────────────────────────────────────────────────────────

type WorkspaceTab = "overview" | "briefs" | "hooks" | "landing" | "emails" | "checklist";

const STATUS_OPTIONS = ["draft", "testing", "live", "winner", "dead"] as const;

const STATUS_STYLES: Record<string, string> = {
  draft: "border-white/10 text-white/40 bg-white/5",
  testing: "border-yellow-500/40 text-yellow-300 bg-yellow-500/10",
  live: "border-cyan-500/40 text-cyan-300 bg-cyan-500/10",
  winner: "border-green-500/40 text-green-300 bg-green-500/10",
  dead: "border-red-500/30 text-red-400/60 bg-red-500/5",
  ready: "border-cyan-500/40 text-cyan-300 bg-cyan-500/10",
  active: "border-cyan-500/40 text-cyan-400 bg-cyan-500/10",
  scaling: "border-green-500/40 text-green-400 bg-green-500/10",
};

const CAMPAIGN_STATUS_OPTIONS = ["draft", "active", "testing", "scaling", "dead"];

const DAY_LABELS: Record<string, string> = {
  day1: "Day 1 — Today",
  day2: "Day 2",
  day3: "Day 3",
  week2: "Week 2",
  scaling: "Scale Trigger",
  kill: "Kill Criteria",
};

const EMAIL_SEQ_LABELS: Record<string, string> = {
  welcome: "Welcome Sequence",
  cart: "Abandoned Cart",
  "post-purchase": "Post-Purchase",
};

const VERDICT_COLORS: Record<string, string> = {
  "Strong Opportunity": "text-green-400",
  "Testable": "text-yellow-400",
  "Weak": "text-orange-400",
  "Reject": "text-red-400",
};

// ── NavItem sub-component ─────────────────────────────────────────────────────

function NavItem({
  id,
  label,
  count,
  active,
  onClick,
}: {
  id: WorkspaceTab;
  label: string;
  count?: string | number | null;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center justify-between ${
        active
          ? "bg-cyan-500/10 text-cyan-300 font-medium"
          : "text-white/40 hover:text-white/70 hover:bg-white/5"
      }`}
    >
      <span>{label}</span>
      {count !== undefined && count !== null && (
        <span className={`text-xs ${active ? "text-cyan-400" : "text-white/20"}`}>{count}</span>
      )}
    </button>
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {[
        {
          id: "core" as const,
          label: "Core",
          description: "Strong operator-ready assets with clean structure and fast execution.",
        },
        {
          id: "elite" as const,
          label: "Elite",
          description: "Sharper premium positioning, stronger proof logic, and higher-conviction execution.",
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

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CampaignWorkspace() {
  const { id } = useParams() as { id: string };
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [databaseUnavailable, setDatabaseUnavailable] = useState(false);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [saving, setSaving] = useState(false);

  // Creative Studio state
  const [studioOpen, setStudioOpen] = useState(false);
  const [studioBrief, setStudioBrief] = useState<StudioBrief | null>(null);

  // Regenerate state
  const [regenerating, setRegenerating] = useState<string | null>(null);

  // Email editor state
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [emailEdits, setEmailEdits] = useState<Record<string, Partial<EmailDraft>>>({});

  // Landing editor state
  const [landingEdits, setLandingEdits] = useState<Partial<LandingDraft>>({});
  const [landingSavedFields, setLandingSavedFields] = useState<Set<string>>(new Set());
  const [landingUnsavedFields, setLandingUnsavedFields] = useState<Set<string>>(new Set());

  function openStudio(variation: { name: string; content: Record<string, unknown> }) {
    const c = variation.content;
    setStudioBrief({
      id: String(c.id ?? variation.name),
      title: String(c.title ?? variation.name),
      format: String(c.format ?? "Ad Brief"),
      duration: String(c.duration ?? "30-60s"),
      platform: String(c.platform ?? "TikTok"),
      concept: String(c.concept ?? ""),
      scenes: (c.scenes as StudioBrief["scenes"]) ?? [],
      productionKit: (c.productionKit as StudioBrief["productionKit"]) ?? { location: "", props: [], casting: "", lighting: "", audioStyle: "", colorGrade: "" },
      imageAd: c.imageAd ? (c.imageAd as StudioBrief["imageAd"]) : undefined,
    });
    setStudioOpen(true);
  }

  // Add variation form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addType, setAddType] = useState<"hook" | "script">("hook");
  const [addName, setAddName] = useState("");
  const [addContent, setAddContent] = useState("");
  const [addPlatform, setAddPlatform] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch(`/api/campaigns/${id}`)
      .then((r) => r.json() as Promise<{ ok: boolean; campaign?: Campaign | null; databaseUnavailable?: boolean }>)
      .then((data) => {
        setDatabaseUnavailable(Boolean(data.databaseUnavailable));
        if (data.ok && data.campaign) {
          setCampaign(data.campaign);
          // Seed landing edits from existing data
          if (data.campaign.landingDraft) {
            setLandingEdits({ ...data.campaign.landingDraft });
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetch("/api/business-profile")
      .then((r) => r.json() as Promise<{ ok: boolean; profile?: BusinessProfileSummary | null }>)
      .then((data) => {
        if (data.ok && data.profile) setBusinessProfile(data.profile);
      })
      .catch(() => {});
  }, []);

  async function updateCampaign(patch: {
    name?: string;
    status?: string;
    notes?: string;
    workflowState?: Campaign["workflowState"];
  }) {
    setSaving(true);
    const res = await fetch(`/api/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json() as { ok: boolean; campaign?: Campaign };
    if (data.ok && data.campaign && campaign) {
      setCampaign({ ...campaign, ...data.campaign });
    }
    setSaving(false);
  }

  async function updateVariationStatus(vid: string, status: string) {
    await fetch(`/api/campaigns/${id}/variations/${vid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (campaign) {
      setCampaign({
        ...campaign,
        adVariations: campaign.adVariations.map((v) =>
          v.id === vid ? { ...v, status } : v
        ),
      });
    }
  }

  async function updateVariationNotes(vid: string, notes: string) {
    await fetch(`/api/campaigns/${id}/variations/${vid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
  }

  async function deleteVariation(vid: string) {
    await fetch(`/api/campaigns/${id}/variations/${vid}`, { method: "DELETE" });
    if (campaign) {
      setCampaign({ ...campaign, adVariations: campaign.adVariations.filter((v) => v.id !== vid) });
    }
  }

  async function toggleChecklist(cid: string, done: boolean) {
    await fetch(`/api/campaigns/${id}/checklist/${cid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    });
    if (campaign) {
      setCampaign({
        ...campaign,
        checklistItems: campaign.checklistItems.map((item) =>
          item.id === cid ? { ...item, done } : item
        ),
      });
    }
  }

  async function updateEmailStatus(eid: string, status: string) {
    await fetch(`/api/campaigns/${id}/emails/${eid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (campaign) {
      setCampaign({
        ...campaign,
        emailDrafts: campaign.emailDrafts.map((e) =>
          e.id === eid ? { ...e, status } : e
        ),
      });
    }
  }

  async function updateEmail(eid: string, patch: Partial<EmailDraft>) {
    const res = await fetch(`/api/campaigns/${id}/emails/${eid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json() as { ok: boolean };
    if (data.ok && campaign) {
      setCampaign({
        ...campaign,
        emailDrafts: campaign.emailDrafts.map((e) =>
          e.id === eid ? { ...e, ...patch } : e
        ),
      });
    }
    return data.ok;
  }

  async function updateLanding(patch: Partial<LandingDraft>) {
    const res = await fetch(`/api/campaigns/${id}/landing`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json() as { ok: boolean };
    if (data.ok && campaign?.landingDraft) {
      setCampaign({
        ...campaign,
        landingDraft: { ...campaign.landingDraft, ...patch },
      });
    }
    return data.ok;
  }

  async function addVariation() {
    if (!addContent.trim() || !campaign) return;
    setAdding(true);
    const name = addName.trim() || (addType === "hook" ? "Custom Hook" : "Custom Script");
    const content = addType === "hook"
      ? { format: name, hook: addContent.trim() }
      : { title: name, duration: "60s", sections: [{ timestamp: "0:00", direction: "Deliver to camera", copy: addContent.trim() }] };
    const res = await fetch(`/api/campaigns/${id}/variations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type: addType, content, platform: addPlatform || undefined }),
    });
    const data = await res.json() as { ok: boolean; variation?: AdVariation };
    if (data.ok && data.variation) {
      setCampaign({ ...campaign, adVariations: [...campaign.adVariations, data.variation] });
    }
    setAdding(false);
    setShowAddForm(false);
    setAddName(""); setAddContent(""); setAddPlatform("");
  }

  async function regenerateAssets(type: "hooks" | "scripts" | "briefs" | "emails" | "checklist" | "all") {
    if (!campaign) return;
    setRegenerating(type);
    try {
      const res = await fetch(`/api/campaigns/${id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) {
        // Reload full campaign to get fresh data
        const r2 = await fetch(`/api/campaigns/${id}`);
        const d2 = await r2.json() as { ok: boolean; campaign?: Campaign };
        if (d2.ok && d2.campaign) setCampaign(d2.campaign);
      }
    } finally {
      setRegenerating(null);
    }
  }

  function exportCampaign() {
    if (!campaign) return;
    const lines: string[] = [`# ${campaign.name}`, `Status: ${campaign.status} | Mode: ${campaign.mode}`, ""];

    const hooks = campaign.adVariations.filter((v) => v.type === "hook");
    const scripts = campaign.adVariations.filter((v) => v.type === "script");

    if (hooks.length) {
      lines.push("## Ad Hooks", "");
      hooks.forEach((v) => { lines.push(`[${v.status.toUpperCase()}] ${v.name}`); lines.push(String(v.content.hook ?? "")); lines.push(""); });
    }
    if (scripts.length) {
      lines.push("## Ad Scripts", "");
      scripts.forEach((v) => {
        lines.push(`[${v.status.toUpperCase()}] ${v.name}`);
        (v.content.sections as { timestamp: string; copy: string }[] ?? []).forEach((s) => lines.push(`  ${s.timestamp} — ${s.copy}`));
        lines.push("");
      });
    }
    if (campaign.landingDraft) {
      const ld = campaign.landingDraft;
      lines.push("## Landing Page", "");
      if (ld.headline) lines.push(`Headline: ${ld.headline}`);
      if (ld.subheadline) lines.push(`Subheadline: ${ld.subheadline}`);
      if (ld.ctaCopy) lines.push(`CTA: ${ld.ctaCopy}`);
      if (ld.urgencyLine) lines.push(`Urgency: ${ld.urgencyLine}`);
      if (ld.bullets?.length) { lines.push("Bullets:"); ld.bullets.forEach((b) => lines.push(`  • ${b}`)); }
      lines.push("");
    }
    if (campaign.emailDrafts.length) {
      lines.push("## Emails", "");
      campaign.emailDrafts.forEach((e) => {
        lines.push(`[${e.sequence} #${e.position}] ${e.subject ?? ""}`);
        if (e.body) lines.push(e.body);
        lines.push("");
      });
    }
    if (campaign.checklistItems.length) {
      lines.push("## Checklist", "");
      Object.entries(DAY_LABELS).forEach(([day, label]) => {
        const items = campaign.checklistItems.filter((i) => i.day === day);
        if (items.length) { lines.push(label); items.forEach((i) => lines.push(`  [${i.done ? "x" : " "}] ${i.text}`)); lines.push(""); }
      });
    }

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${campaign.name.replace(/\s+/g, "-").toLowerCase()}-campaign.txt`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  }

  async function updateLandingStatus(status: string) {
    await fetch(`/api/campaigns/${id}/landing`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (campaign?.landingDraft) {
      setCampaign({ ...campaign, landingDraft: { ...campaign.landingDraft, status } });
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0f1e] text-white flex items-center justify-center">
        <p className="text-white/30 text-sm">Loading workspace...</p>
      </main>
    );
  }

  if (!campaign) {
    return (
      <main className="min-h-screen bg-[#0a0f1e] px-4 text-white flex items-center justify-center">
        <div className="w-full max-w-3xl space-y-4">
          <DatabaseFallbackNotice visible={databaseUnavailable} />
          <div className="text-center rounded-2xl border border-white/[0.07] bg-white/[0.03] p-8">
          <p className="text-white/40 mb-4">{databaseUnavailable ? "Campaign data is temporarily unavailable." : "Campaign not found."}</p>
          <Link href="/campaigns" className="text-cyan-400 hover:underline text-sm">← Back to campaigns</Link>
          </div>
        </div>
      </main>
    );
  }

  const hooks = campaign.adVariations.filter((v) => v.type === "hook");
  const scripts = campaign.adVariations.filter((v) => v.type === "script");
  const briefs = campaign.adVariations.filter((v) => v.type === "brief");
  const doneCount = campaign.checklistItems.filter((i) => i.done).length;
  const totalCount = campaign.checklistItems.length;
  const productUrl = campaign.productUrl ?? campaign.analysisRun?.inputUrl ?? "";
  const executionTier: ExecutionTier = campaign.workflowState?.executionTier === "core" ? "core" : "elite";

  // Landing preview data — merge saved state with live edits
  const previewLanding: Partial<LandingDraft> = campaign.landingDraft
    ? { ...campaign.landingDraft, ...landingEdits }
    : landingEdits;

  return (
    <main className="flex h-screen bg-[#0a0f1e] text-white overflow-hidden">

      {/* LEFT SIDEBAR (fixed, 220px) */}
      <aside className="w-[220px] shrink-0 border-r border-white/10 flex flex-col">

        {/* Campaign info */}
        <div className="p-4 border-b border-white/10">
          <Link href="/campaigns" className="text-xs text-cyan-400/60 hover:text-cyan-400 transition">
            ← Campaigns
          </Link>
          <h2 className="font-bold text-sm mt-2 leading-tight text-white">{campaign.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <select
              value={campaign.status}
              onChange={(e) => void updateCampaign({ status: e.target.value })}
              className={`text-xs px-2 py-0.5 rounded-full border cursor-pointer bg-transparent outline-none ${STATUS_STYLES[campaign.status] ?? ""}`}
            >
              {CAMPAIGN_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="bg-[#0a0f1e]">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
              {executionTier}
            </span>
            {saving && <span className="text-[10px] text-white/20">saving...</span>}
          </div>
          {campaign.productName && (
            <p className="text-[10px] text-white/30 mt-1.5 truncate">{campaign.productName}</p>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <NavItem
            id="overview"
            label="Overview"
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          />
          <NavItem
            id="briefs"
            label="Creative Briefs"
            count={briefs.length || null}
            active={activeTab === "briefs"}
            onClick={() => setActiveTab("briefs")}
          />
          <NavItem
            id="hooks"
            label="Hooks & Scripts"
            count={(hooks.length + scripts.length) || null}
            active={activeTab === "hooks"}
            onClick={() => setActiveTab("hooks")}
          />
          <NavItem
            id="landing"
            label="Landing Page"
            active={activeTab === "landing"}
            onClick={() => setActiveTab("landing")}
          />
          <NavItem
            id="emails"
            label="Emails"
            count={campaign.emailDrafts.length || null}
            active={activeTab === "emails"}
            onClick={() => setActiveTab("emails")}
          />
          <NavItem
            id="checklist"
            label="Checklist"
            count={totalCount > 0 ? `${doneCount}/${totalCount}` : null}
            active={activeTab === "checklist"}
            onClick={() => setActiveTab("checklist")}
          />
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 space-y-2">
          <a
            href={`/api/campaigns/${id}/export?format=md`}
            download
            className="block w-full text-left px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition"
          >
            Export Markdown ↓
          </a>
          <a
            href={`/api/campaigns/${id}/export?format=json`}
            download
            className="block w-full text-left px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition"
          >
            Export JSON ↓
          </a>
          {productUrl && (
            <Link
              href={`/analyze?url=${encodeURIComponent(productUrl)}`}
              className="block px-3 py-2 rounded-lg text-xs text-cyan-400/60 hover:text-cyan-400 hover:bg-cyan-500/5 transition"
            >
              Re-analyze →
            </Link>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto">
        <div className={`mx-auto p-8 ${activeTab === "landing" ? "max-w-6xl" : "max-w-3xl"}`}>

          {/* ── Overview ── */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {businessProfile && (
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.06] p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <p className="text-xs uppercase tracking-widest text-cyan-200/70 mb-3">Business Context</p>
                      <h3 className="text-xl font-bold text-white">
                        {businessProfile.businessName || campaign.productName || campaign.name}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/65">
                        This campaign is being shaped around your saved Business OS, so hooks, landing copy, emails, and next actions can stay aligned with the same niche, audience, offer, and goal.
                      </p>
                    </div>
                    <Link
                      href="/my-system"
                      className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-black/20 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-200 transition hover:bg-black/30"
                    >
                      Open My System →
                    </Link>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <ContextChip label="Business Type" value={businessProfile.businessType.replace(/_/g, " ")} />
                    <ContextChip label="Niche" value={businessProfile.niche || "Not set"} />
                    <ContextChip label="Audience" value={businessProfile.targetAudience || "Not set"} />
                    <ContextChip label="Goal" value={businessProfile.mainGoal?.replace(/_/g, " ") || "Not set"} />
                    <ContextChip label="Offer" value={businessProfile.mainOffer || "Not set"} />
                    <ContextChip label="Location" value={businessProfile.location || "Online"} />
                    <ContextChip label="Stage" value={businessProfile.stage} />
                    <ContextChip label="Active Systems" value={businessProfile.activeSystems.length ? businessProfile.activeSystems.join(", ") : "None active"} />
                  </div>
                </div>
              )}

              {campaign.analysisRun && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <p className="text-xs uppercase tracking-widest text-white/30 mb-3">Analysis Summary</p>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className={`text-2xl font-bold ${VERDICT_COLORS[campaign.analysisRun.verdict ?? ""] ?? "text-white"}`}>
                        {campaign.analysisRun.verdict}
                      </p>
                      {campaign.analysisRun.title && (
                        <p className="text-sm text-white/50 mt-1">{campaign.analysisRun.title}</p>
                      )}
                    </div>
                    {campaign.analysisRun.score != null && (
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">{campaign.analysisRun.score}<span className="text-sm text-white/30">/100</span></p>
                        <p className="text-xs text-white/30">{campaign.analysisRun.confidence} confidence</p>
                      </div>
                    )}
                  </div>
                  {campaign.analysisRun.summary && (
                    <p className="text-sm text-white/60 leading-relaxed">{campaign.analysisRun.summary}</p>
                  )}
                  {campaign.analysisRun.inputUrl && (
                    <p className="text-xs text-white/20 mt-3 truncate">{campaign.analysisRun.inputUrl}</p>
                  )}
                </div>
              )}

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-xs uppercase tracking-widest text-white/30 mb-3">Execution Lane</p>
                    <h3 className="text-xl font-bold text-white">
                      {executionTier === "elite" ? "Elite campaign execution is active" : "Core campaign execution is active"}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/60">
                      This sets the quality bar for regenerated hooks, scripts, emails, and checklist guidance. Switching lanes updates the stored campaign strategy so future generations stay aligned.
                    </p>
                  </div>
                  <div className="shrink-0 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/45">
                    Stored on campaign
                  </div>
                </div>

                <div className="mt-5">
                  <ExecutionTierPicker
                    value={executionTier}
                    onChange={(tier) => {
                      if (tier === executionTier) return;
                      void updateCampaign({
                        workflowState: {
                          ...(campaign.workflowState ?? {}),
                          executionTier: tier,
                        },
                      });
                    }}
                  />
                </div>

                <div className="mt-4 rounded-xl border border-cyan-500/15 bg-cyan-500/[0.05] px-4 py-3 text-xs leading-relaxed text-cyan-100/80">
                  Regenerate assets after switching if you want the current workspace to reflect the new execution lane immediately.
                </div>
              </div>

              {/* Quick status of all assets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <AssetStatusCard label="Creative Briefs" count={briefs.length}
                  live={briefs.filter((v) => v.status === "live" || v.status === "testing").length}
                  onNav={() => setActiveTab("briefs")} />
                <AssetStatusCard label="Hooks & Scripts" count={hooks.length + scripts.length}
                  live={[...hooks, ...scripts].filter((v) => v.status === "live" || v.status === "testing").length}
                  onNav={() => setActiveTab("hooks")} />
                <AssetStatusCard label="Landing Page" count={campaign.landingDraft ? 1 : 0}
                  live={campaign.landingDraft?.status === "live" ? 1 : 0}
                  onNav={() => setActiveTab("landing")} />
                <AssetStatusCard label="Emails" count={campaign.emailDrafts.length}
                  live={campaign.emailDrafts.filter((e) => e.status === "live").length}
                  onNav={() => setActiveTab("emails")} />
              </div>

              {/* Notes */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-widest text-white/30 mb-3">Notes</p>
                <textarea
                  defaultValue={campaign.notes ?? ""}
                  placeholder="Add notes — results, ideas, what's working, what's not..."
                  onBlur={(e) => { if (e.target.value !== (campaign.notes ?? "")) void updateCampaign({ notes: e.target.value }); }}
                  rows={4}
                  className="w-full bg-transparent text-sm text-white/70 placeholder-white/20 outline-none resize-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* ── Creative Briefs ── */}
          {activeTab === "briefs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Creative Briefs</h2>
                <div className="flex items-center gap-2">
                  {briefs.length > 0 && (
                    <span className="text-xs text-white/30">{briefs.length} production-ready brief{briefs.length !== 1 ? "s" : ""}</span>
                  )}
                  {campaign.analysisRun && (
                    <button
                      onClick={() => void regenerateAssets("briefs")}
                      disabled={regenerating !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-400 text-xs font-bold transition disabled:opacity-40"
                    >
                      {regenerating === "briefs" ? "⟳ Regenerating..." : "⟳ Regenerate"}
                    </button>
                  )}
                </div>
              </div>

              {briefs.length === 0 ? (
                <EmptyState
                  icon="🎬"
                  title="No creative briefs yet"
                  sub="Run an analysis and save to workspace to generate creative briefs with full storyboards, AI prompts, and image ad specs."
                />
              ) : (
                <div className="space-y-3">
                  {briefs.map((v) => {
                    const c = v.content;
                    const scenes = (c.scenes as unknown[]) ?? [];
                    return (
                      <div key={v.id} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-cyan-400/20 transition">
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              {!!c.platform && <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">{String(c.platform)}</span>}
                              {!!c.duration && <span className="text-[10px] text-white/30 border border-white/10 px-2 py-0.5 rounded font-mono">{String(c.duration)}</span>}
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                                v.status === "winner" ? "border-green-500/30 text-green-400 bg-green-500/10" :
                                v.status === "live" ? "border-cyan-500/30 text-cyan-400 bg-cyan-500/10" :
                                "border-white/10 text-white/30 bg-white/5"
                              }`}>{v.status.charAt(0).toUpperCase() + v.status.slice(1)}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <select value={v.status} onChange={(e) => void updateVariationStatus(v.id, e.target.value)}
                                className="text-[10px] px-2 py-1 rounded-lg border border-white/10 bg-transparent text-white/40 outline-none cursor-pointer">
                                {["draft","testing","live","winner","dead"].map(s => <option key={s} value={s} className="bg-[#0a0f1e]">{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                              </select>
                              <button onClick={() => void deleteVariation(v.id)} className="text-xs text-white/15 hover:text-red-400 transition">✕</button>
                            </div>
                          </div>
                          <h3 className="text-base font-bold text-white mb-1">{v.name}</h3>
                          {!!c.concept && <p className="text-xs text-white/50 leading-relaxed italic mb-4">{String(c.concept)}</p>}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => openStudio(v)}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#0a0f1e] text-xs font-black uppercase tracking-wide transition shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                            >
                              ✦ Open in Studio
                            </button>
                            <span className="text-xs text-white/20">{scenes.length} scenes</span>
                            {!!c.imageAd && <span className="text-xs text-white/20">+ image ad</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Hooks & Scripts ── */}
          {activeTab === "hooks" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Hooks &amp; Scripts</h2>
                {campaign.analysisRun && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => void regenerateAssets("hooks")}
                      disabled={regenerating !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-400 text-xs font-bold transition disabled:opacity-40"
                    >
                      {regenerating === "hooks" ? "⟳ Regenerating..." : "⟳ Hooks"}
                    </button>
                    <button
                      onClick={() => void regenerateAssets("scripts")}
                      disabled={regenerating !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 text-purple-400 text-xs font-bold transition disabled:opacity-40"
                    >
                      {regenerating === "scripts" ? "⟳ Regenerating..." : "⟳ Scripts"}
                    </button>
                  </div>
                )}
              </div>

              {/* Hooks */}
              {hooks.length > 0 && (
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-white/30 mb-3">Ad Hooks ({hooks.length})</h3>
                  <div className="space-y-3">
                    {hooks.map((v) => (
                      <VariationCard
                        key={v.id}
                        variation={v}
                        onStatusChange={(s) => void updateVariationStatus(v.id, s)}
                        onNotesChange={(n) => void updateVariationNotes(v.id, n)}
                        onDelete={() => void deleteVariation(v.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Scripts */}
              {scripts.length > 0 && (
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-white/30 mb-3">Ad Scripts ({scripts.length})</h3>
                  <div className="space-y-3">
                    {scripts.map((v) => (
                      <VariationCard
                        key={v.id}
                        variation={v}
                        onStatusChange={(s) => void updateVariationStatus(v.id, s)}
                        onNotesChange={(n) => void updateVariationNotes(v.id, n)}
                        onDelete={() => void deleteVariation(v.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {hooks.length === 0 && scripts.length === 0 && (
                <EmptyState
                  icon="🪝"
                  title="No hooks or scripts yet"
                  sub="Run an analysis and save to workspace to generate hooks and scripts."
                />
              )}

              {/* Add Variation */}
              {showAddForm ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
                  <p className="text-xs font-semibold text-white/60 uppercase tracking-widest">New Variation</p>
                  <div className="flex gap-2">
                    <button onClick={() => setAddType("hook")} className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition ${addType === "hook" ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-300" : "border-white/10 text-white/40"}`}>Hook</button>
                    <button onClick={() => setAddType("script")} className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition ${addType === "script" ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-300" : "border-white/10 text-white/40"}`}>Script</button>
                  </div>
                  <input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Label (e.g. Pain Hook v2)" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-400/40 transition" />
                  <textarea value={addContent} onChange={(e) => setAddContent(e.target.value)} placeholder={addType === "hook" ? "Write your hook copy here..." : "Write your script here..."} rows={3} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-400/40 resize-none transition" />
                  <input value={addPlatform} onChange={(e) => setAddPlatform(e.target.value)} placeholder="Platform (optional — TikTok, Facebook...)" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-400/40 transition" />
                  <div className="flex gap-2">
                    <button onClick={() => void addVariation()} disabled={adding || !addContent.trim()} className="flex-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-[#0a0f1e] transition">{adding ? "Adding..." : "Add Variation"}</button>
                    <button onClick={() => { setShowAddForm(false); setAddName(""); setAddContent(""); setAddPlatform(""); }} className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-sm text-white/50 transition">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAddForm(true)} className="w-full rounded-2xl border border-dashed border-white/10 hover:border-cyan-400/30 hover:bg-cyan-500/5 py-4 text-sm text-white/30 hover:text-cyan-400 transition">
                  + Add Variation
                </button>
              )}

              {/* Testing guide */}
              {(hooks.length > 0 || scripts.length > 0) && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">How to test these</p>
                  <ol className="space-y-1.5 text-xs text-white/50">
                    <li><span className="text-white/70">1.</span> Set each new ad to <span className="text-yellow-300">Testing</span></li>
                    <li><span className="text-white/70">2.</span> After 3 days + $50 spend: mark low performers <span className="text-red-400">Dead</span></li>
                    <li><span className="text-white/70">3.</span> Mark your best performer <span className="text-green-300">Winner</span> and scale it</li>
                    <li><span className="text-white/70">4.</span> Mark the one you&apos;re actively spending on as <span className="text-cyan-300">Live</span></li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* ── Landing Page ── */}
          {activeTab === "landing" && (
            <div>
              {campaign.landingDraft ? (
                <>
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-white">Landing Page Editor</h2>
                      <p className="text-xs text-white/30 mt-0.5">Changes auto-save on blur. Preview updates instantly.</p>
                    </div>
                    <select
                      value={campaign.landingDraft.status}
                      onChange={(e) => void updateLandingStatus(e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full border cursor-pointer bg-transparent outline-none ${STATUS_STYLES[campaign.landingDraft.status] ?? ""}`}
                    >
                      {["draft", "ready", "live"].map((s) => (
                        <option key={s} value={s} className="bg-[#0a0f1e]">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Two-column layout */}
                  <div className="flex gap-6 items-start">

                    {/* LEFT — Edit form (60%) */}
                    <div className="flex-[3] space-y-4 min-w-0">

                      {/* Headline */}
                      <LandingEditField
                        label="Headline"
                        fieldKey="headline"
                        value={landingEdits.headline ?? campaign.landingDraft.headline ?? ""}
                        saved={landingSavedFields.has("headline")}
                        unsaved={landingUnsavedFields.has("unsaved:headline")}
                        onChange={(v) => {
                          setLandingEdits((prev) => ({ ...prev, headline: v }));
                          setLandingUnsavedFields((prev) => { const s = new Set(prev); s.add("unsaved:headline"); return s; });
                          setLandingSavedFields((prev) => { const s = new Set(prev); s.delete("headline"); return s; });
                        }}
                        onSave={(v) => {
                          void updateLanding({ headline: v }).then(() => {
                            setLandingSavedFields((prev) => { const s = new Set(prev); s.add("headline"); return s; });
                            setLandingUnsavedFields((prev) => { const s = new Set(prev); s.delete("unsaved:headline"); return s; });
                          });
                        }}
                        placeholder="Your big bold headline..."
                        multiline={false}
                      />

                      {/* Subheadline */}
                      <LandingEditField
                        label="Subheadline"
                        fieldKey="subheadline"
                        value={landingEdits.subheadline ?? campaign.landingDraft.subheadline ?? ""}
                        saved={landingSavedFields.has("subheadline")}
                        unsaved={landingUnsavedFields.has("unsaved:subheadline")}
                        onChange={(v) => {
                          setLandingEdits((prev) => ({ ...prev, subheadline: v }));
                          setLandingUnsavedFields((prev) => { const s = new Set(prev); s.add("unsaved:subheadline"); return s; });
                          setLandingSavedFields((prev) => { const s = new Set(prev); s.delete("subheadline"); return s; });
                        }}
                        onSave={(v) => {
                          void updateLanding({ subheadline: v }).then(() => {
                            setLandingSavedFields((prev) => { const s = new Set(prev); s.add("subheadline"); return s; });
                            setLandingUnsavedFields((prev) => { const s = new Set(prev); s.delete("unsaved:subheadline"); return s; });
                          });
                        }}
                        placeholder="Supporting subheadline..."
                        multiline={true}
                        rows={2}
                      />

                      {/* CTA Copy */}
                      <LandingEditField
                        label="CTA Button Copy"
                        fieldKey="ctaCopy"
                        value={landingEdits.ctaCopy ?? campaign.landingDraft.ctaCopy ?? ""}
                        saved={landingSavedFields.has("ctaCopy")}
                        unsaved={landingUnsavedFields.has("unsaved:ctaCopy")}
                        onChange={(v) => {
                          setLandingEdits((prev) => ({ ...prev, ctaCopy: v }));
                          setLandingUnsavedFields((prev) => { const s = new Set(prev); s.add("unsaved:ctaCopy"); return s; });
                          setLandingSavedFields((prev) => { const s = new Set(prev); s.delete("ctaCopy"); return s; });
                        }}
                        onSave={(v) => {
                          void updateLanding({ ctaCopy: v }).then(() => {
                            setLandingSavedFields((prev) => { const s = new Set(prev); s.add("ctaCopy"); return s; });
                            setLandingUnsavedFields((prev) => { const s = new Set(prev); s.delete("unsaved:ctaCopy"); return s; });
                          });
                        }}
                        placeholder="Get Instant Access →"
                        multiline={false}
                      />

                      {/* Urgency Line */}
                      <LandingEditField
                        label="Urgency Line"
                        fieldKey="urgencyLine"
                        value={landingEdits.urgencyLine ?? campaign.landingDraft.urgencyLine ?? ""}
                        saved={landingSavedFields.has("urgencyLine")}
                        unsaved={landingUnsavedFields.has("unsaved:urgencyLine")}
                        onChange={(v) => {
                          setLandingEdits((prev) => ({ ...prev, urgencyLine: v }));
                          setLandingUnsavedFields((prev) => { const s = new Set(prev); s.add("unsaved:urgencyLine"); return s; });
                          setLandingSavedFields((prev) => { const s = new Set(prev); s.delete("urgencyLine"); return s; });
                        }}
                        onSave={(v) => {
                          void updateLanding({ urgencyLine: v }).then(() => {
                            setLandingSavedFields((prev) => { const s = new Set(prev); s.add("urgencyLine"); return s; });
                            setLandingUnsavedFields((prev) => { const s = new Set(prev); s.delete("unsaved:urgencyLine"); return s; });
                          });
                        }}
                        placeholder="Limited time offer — ends tonight..."
                        multiline={false}
                      />

                      {/* Trust Bar */}
                      <LandingListEditField
                        label="Trust Bar Items"
                        fieldKey="trustBar"
                        items={landingEdits.trustBar ?? campaign.landingDraft.trustBar ?? []}
                        saved={landingSavedFields.has("trustBar")}
                        unsaved={landingUnsavedFields.has("unsaved:trustBar")}
                        onChange={(v) => {
                          setLandingEdits((prev) => ({ ...prev, trustBar: v }));
                          setLandingUnsavedFields((prev) => { const s = new Set(prev); s.add("unsaved:trustBar"); return s; });
                          setLandingSavedFields((prev) => { const s = new Set(prev); s.delete("trustBar"); return s; });
                        }}
                        onSave={(v) => {
                          void updateLanding({ trustBar: v }).then(() => {
                            setLandingSavedFields((prev) => { const s = new Set(prev); s.add("trustBar"); return s; });
                            setLandingUnsavedFields((prev) => { const s = new Set(prev); s.delete("unsaved:trustBar"); return s; });
                          });
                        }}
                      />

                      {/* Benefit Bullets */}
                      <LandingListEditField
                        label="Benefit Bullets"
                        fieldKey="bullets"
                        items={landingEdits.bullets ?? campaign.landingDraft.bullets ?? []}
                        saved={landingSavedFields.has("bullets")}
                        unsaved={landingUnsavedFields.has("unsaved:bullets")}
                        onChange={(v) => {
                          setLandingEdits((prev) => ({ ...prev, bullets: v }));
                          setLandingUnsavedFields((prev) => { const s = new Set(prev); s.add("unsaved:bullets"); return s; });
                          setLandingSavedFields((prev) => { const s = new Set(prev); s.delete("bullets"); return s; });
                        }}
                        onSave={(v) => {
                          void updateLanding({ bullets: v }).then(() => {
                            setLandingSavedFields((prev) => { const s = new Set(prev); s.add("bullets"); return s; });
                            setLandingUnsavedFields((prev) => { const s = new Set(prev); s.delete("unsaved:bullets"); return s; });
                          });
                        }}
                      />

                      {/* Social Proof */}
                      <LandingEditField
                        label="Social Proof"
                        fieldKey="socialProof"
                        value={landingEdits.socialProof ?? campaign.landingDraft.socialProof ?? ""}
                        saved={landingSavedFields.has("socialProof")}
                        unsaved={landingUnsavedFields.has("unsaved:socialProof")}
                        onChange={(v) => {
                          setLandingEdits((prev) => ({ ...prev, socialProof: v }));
                          setLandingUnsavedFields((prev) => { const s = new Set(prev); s.add("unsaved:socialProof"); return s; });
                          setLandingSavedFields((prev) => { const s = new Set(prev); s.delete("socialProof"); return s; });
                        }}
                        onSave={(v) => {
                          void updateLanding({ socialProof: v }).then(() => {
                            setLandingSavedFields((prev) => { const s = new Set(prev); s.add("socialProof"); return s; });
                            setLandingUnsavedFields((prev) => { const s = new Set(prev); s.delete("unsaved:socialProof"); return s; });
                          });
                        }}
                        placeholder="What testimonials or social proof to feature..."
                        multiline={true}
                        rows={3}
                      />

                      {/* Guarantee */}
                      <LandingEditField
                        label="Guarantee Copy"
                        fieldKey="guarantee"
                        value={landingEdits.guarantee ?? campaign.landingDraft.guarantee ?? ""}
                        saved={landingSavedFields.has("guarantee")}
                        unsaved={landingUnsavedFields.has("unsaved:guarantee")}
                        onChange={(v) => {
                          setLandingEdits((prev) => ({ ...prev, guarantee: v }));
                          setLandingUnsavedFields((prev) => { const s = new Set(prev); s.add("unsaved:guarantee"); return s; });
                          setLandingSavedFields((prev) => { const s = new Set(prev); s.delete("guarantee"); return s; });
                        }}
                        onSave={(v) => {
                          void updateLanding({ guarantee: v }).then(() => {
                            setLandingSavedFields((prev) => { const s = new Set(prev); s.add("guarantee"); return s; });
                            setLandingUnsavedFields((prev) => { const s = new Set(prev); s.delete("unsaved:guarantee"); return s; });
                          });
                        }}
                        placeholder="30-day money-back guarantee..."
                        multiline={true}
                        rows={2}
                      />

                      {/* FAQ (read-only display, not editable inline since structure differs) */}
                      {campaign.landingDraft.faqItems && campaign.landingDraft.faqItems.length > 0 && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                          <p className="text-xs uppercase tracking-widest text-white/30 mb-3">FAQ Items</p>
                          <div className="space-y-3">
                            {campaign.landingDraft.faqItems.map((faq, i) => (
                              <div key={i} className="rounded-xl border border-white/5 bg-black/20 p-3">
                                <p className="text-xs font-semibold text-white/70 mb-1">{faq.question}</p>
                                <p className="text-xs text-white/50">{faq.answer}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* RIGHT — Live preview (40%) sticky */}
                    <div className="flex-[2] min-w-0">
                      <div className="sticky top-0">
                        <LandingPreview landing={previewLanding} />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState icon="📄" title="No landing page draft" sub="Run an analysis and save to workspace to generate landing page copy." />
              )}
            </div>
          )}

          {/* ── Emails ── */}
          {activeTab === "emails" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Email Sequences</h2>
                {campaign.analysisRun && (
                  <button
                    onClick={() => void regenerateAssets("emails")}
                    disabled={regenerating !== null}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 text-purple-400 text-xs font-bold transition disabled:opacity-40"
                  >
                    {regenerating === "emails" ? "⟳ Regenerating..." : "⟳ Regenerate All"}
                  </button>
                )}
              </div>

              {campaign.emailDrafts.length === 0 ? (
                <EmptyState icon="📧" title="No email drafts yet" sub="Run an analysis and save to workspace to generate email sequences." />
              ) : (
                <>
                  {/* Email Flow Diagram */}
                  <EmailFlowDiagram emails={campaign.emailDrafts} />

                  {/* Sequence flow header + cards */}
                  {(() => {
                    const seqKeys = Object.keys(EMAIL_SEQ_LABELS);
                    const presentSeqs = seqKeys.filter((seq) => campaign.emailDrafts.some((e) => e.sequence === seq));
                    return (
                      <div className="space-y-8">
                        {presentSeqs.map((seq, seqIndex) => {
                          const emails = campaign.emailDrafts.filter((e) => e.sequence === seq).sort((a, b) => a.position - b.position);
                          const nextSeq = presentSeqs[seqIndex + 1];
                          return (
                            <div key={seq}>
                              {/* Sequence header — flow arrow style */}
                              <div className="flex items-center gap-2 mb-4">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-500/30" />
                                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                                  <span className="text-xs font-semibold text-cyan-300">{EMAIL_SEQ_LABELS[seq]}</span>
                                  <span className="text-xs text-white/30">· {emails.length} email{emails.length !== 1 ? "s" : ""}</span>
                                </div>
                                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-500/30" />
                              </div>

                              <div className="space-y-3">
                                {emails.map((email) => (
                                  <EmailEditorCard
                                    key={email.id}
                                    email={email}
                                    isEditing={editingEmailId === email.id}
                                    edits={emailEdits[email.id] ?? {}}
                                    onEdit={() => {
                                      setEditingEmailId(email.id);
                                      setEmailEdits((prev) => ({
                                        ...prev,
                                        [email.id]: {
                                          subject: email.subject ?? "",
                                          preview: email.preview ?? "",
                                          timing: email.timing ?? "",
                                          body: email.body ?? "",
                                          status: email.status,
                                        },
                                      }));
                                    }}
                                    onCancel={() => {
                                      setEditingEmailId(null);
                                      setEmailEdits((prev) => {
                                        const next = { ...prev };
                                        delete next[email.id];
                                        return next;
                                      });
                                    }}
                                    onSave={() => {
                                      const patch = emailEdits[email.id] ?? {};
                                      void updateEmail(email.id, patch).then(() => {
                                        setEditingEmailId(null);
                                        setEmailEdits((prev) => {
                                          const next = { ...prev };
                                          delete next[email.id];
                                          return next;
                                        });
                                      });
                                    }}
                                    onEditChange={(patch) => {
                                      setEmailEdits((prev) => ({
                                        ...prev,
                                        [email.id]: { ...(prev[email.id] ?? {}), ...patch },
                                      }));
                                    }}
                                    onStatusChange={(s) => void updateEmailStatus(email.id, s)}
                                  />
                                ))}
                              </div>

                              {/* Flow arrow to next sequence */}
                              {nextSeq && (
                                <div className="flex items-center gap-3 mt-4 pl-4">
                                  <div className="flex flex-col items-center gap-1">
                                    <div className="w-px h-3 bg-white/10" />
                                    <div className="text-white/20 text-xs">↓</div>
                                    <div className="w-px h-3 bg-white/10" />
                                  </div>
                                  <span className="text-xs text-white/20 italic">Flows into → {EMAIL_SEQ_LABELS[nextSeq]}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </>
              )}

              {campaign.emailDrafts.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">How to use these</p>
                  <ol className="space-y-1.5 text-xs text-white/50">
                    <li><span className="text-white/70">1.</span> Copy each email into Klaviyo, Mailchimp, or your email tool</li>
                    <li><span className="text-white/70">2.</span> Customize [First Name], [Product Name], and dates</li>
                    <li><span className="text-white/70">3.</span> Mark each one <span className="text-cyan-300">Live</span> as you set it up</li>
                    <li><span className="text-white/70">4.</span> Start with the Welcome sequence first, then Abandoned Cart, then Post-Purchase</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* ── Checklist ── */}
          {activeTab === "checklist" && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-white">Execution Checklist</h2>
              {campaign.checklistItems.length === 0 ? (
                <EmptyState icon="✅" title="No checklist yet" sub="Run an analysis and save to workspace to generate your execution plan." />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-white/50">{doneCount} of {totalCount} done</p>
                    <div className="flex-1 mx-4 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full transition-all" style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }} />
                    </div>
                    <p className="text-sm font-semibold text-white">{totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0}%</p>
                  </div>

                  {Object.entries(DAY_LABELS).map(([day, dayLabel]) => {
                    const items = campaign.checklistItems.filter((i) => i.day === day);
                    if (items.length === 0) return null;
                    const isWarning = day === "kill";
                    const isScaling = day === "scaling";
                    return (
                      <div key={day}>
                        <h3 className={`text-xs uppercase tracking-widest mb-3 ${isWarning ? "text-red-400/60" : isScaling ? "text-green-400/60" : "text-white/30"}`}>
                          {dayLabel}
                        </h3>
                        <div className="space-y-2">
                          {items.map((item) => (
                            <label
                              key={item.id}
                              className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${
                                item.done
                                  ? "border-white/5 bg-white/2 opacity-50"
                                  : isWarning
                                  ? "border-red-500/20 bg-red-500/5 hover:border-red-500/30"
                                  : isScaling
                                  ? "border-green-500/20 bg-green-500/5 hover:border-green-500/30"
                                  : "border-white/10 bg-white/5 hover:border-cyan-400/20 hover:bg-cyan-500/5"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={item.done}
                                onChange={(e) => void toggleChecklist(item.id, e.target.checked)}
                                className="mt-0.5 accent-cyan-400 shrink-0"
                              />
                              <span className={`text-sm ${item.done ? "line-through text-white/30" : "text-white/70"}`}>
                                {item.text}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Creative Studio modal */}
      {studioBrief && (
        <CreativeStudio
          isOpen={studioOpen}
          onClose={() => setStudioOpen(false)}
          brief={studioBrief}
          executionTier={executionTier}
        />
      )}
    </main>
  );
}

function ContextChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/25">{label}</p>
      <p className="mt-2 text-sm font-medium leading-relaxed text-white/75">{value}</p>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AssetStatusCard({ label, count, live, onNav }: { label: string; count: number; live: number; onNav: () => void }) {
  return (
    <button onClick={onNav} className="rounded-xl border border-white/10 bg-white/5 hover:border-cyan-400/20 hover:bg-cyan-500/5 p-4 text-left transition">
      <p className="text-xs text-white/30 mb-1">{label}</p>
      <p className="text-xl font-bold text-white">{count}</p>
      {live > 0 && <p className="text-xs text-cyan-400 mt-0.5">{live} active</p>}
    </button>
  );
}

function VariationCard({
  variation, onStatusChange, onNotesChange, onDelete,
}: {
  variation: AdVariation;
  onStatusChange: (s: string) => void;
  onNotesChange: (n: string) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(variation.type === "brief");
  const [notes, setNotes] = useState(variation.notes ?? "");

  const isHook = variation.type === "hook";
  const isBrief = variation.type === "brief";
  const content = variation.content;

  // Brief helpers
  type Scene = { timestamp: string; shotType: string; visual: string; audio: string; textOverlay: string };
  type Kit = { location: string; props: string[]; casting: string; lighting: string; audioStyle: string; colorGrade: string };
  type ImageAd = { headline: string; visualDirection: string; bodyCopy: string; cta: string };
  const briefScenes = isBrief ? (content.scenes as Scene[] ?? []) : [];
  const briefKit = isBrief ? (content.productionKit as Kit | undefined) : undefined;
  const briefImageAd = isBrief ? (content.imageAd as ImageAd | undefined) : undefined;

  const borderClass = variation.status === "winner" ? "border-green-500/30 bg-green-500/5" :
    variation.status === "dead" ? "border-red-500/10 bg-red-500/5 opacity-60" :
    variation.status === "live" || variation.status === "testing" ? "border-cyan-500/20 bg-cyan-500/5" :
    "border-white/10 bg-white/5";

  return (
    <div className={`rounded-xl border overflow-hidden transition ${borderClass} ${isBrief ? "shadow-lg" : ""}`}>
      <div className={`${isBrief ? "p-5" : "p-4"}`}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-semibold text-white/60 ${isBrief ? "text-sm" : "text-xs"}`}>{variation.name}</span>
            {isBrief && !!content.platform && (
              <span className="text-xs text-cyan-400/60 border border-cyan-400/20 px-1.5 py-0.5 rounded">{String(content.platform)}</span>
            )}
            {isBrief && !!content.duration && (
              <span className="text-xs text-white/30 border border-white/10 px-1.5 py-0.5 rounded">{String(content.duration)}</span>
            )}
            {!isBrief && variation.platform && (
              <span className="text-xs text-white/30 border border-white/10 px-1.5 py-0.5 rounded">{variation.platform}</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={variation.status}
              onChange={(e) => onStatusChange(e.target.value)}
              className={`text-xs px-2 py-0.5 rounded-full border cursor-pointer bg-transparent outline-none ${STATUS_STYLES[variation.status] ?? ""}`}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="bg-[#0a0f1e]">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <button onClick={onDelete} className="text-xs text-white/20 hover:text-red-400 transition">✕</button>
          </div>
        </div>

        {isHook && (
          <p className="text-sm text-white/80 leading-relaxed">
            &ldquo;{String(content.hook ?? "")}&rdquo;
          </p>
        )}

        {!isHook && !isBrief && (
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-cyan-400/60 hover:text-cyan-400 transition">
            {expanded ? "Hide script ↑" : "View script ↓"}
          </button>
        )}

        {!isHook && !isBrief && expanded && (
          <div className="mt-3 space-y-2">
            {(content.sections as { timestamp: string; direction: string; copy: string }[] ?? []).map((s, i) => (
              <div key={i} className="flex gap-3 text-xs">
                <span className="text-cyan-400 font-bold shrink-0 w-10">{s.timestamp}</span>
                <div>
                  <p className="text-white/30 mb-0.5">{s.direction}</p>
                  <p className="text-white/70">{s.copy}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {isBrief && (
          <>
            {content.concept && (
              <div className="mt-2 mb-3 p-3 rounded-lg bg-black/30 border border-white/5">
                <p className="text-[10px] font-semibold text-cyan-400/70 uppercase tracking-wide mb-1">Creative Concept</p>
                <p className="text-sm text-white/70 leading-relaxed italic">&ldquo;{String(content.concept)}&rdquo;</p>
              </div>
            )}
            <button onClick={() => setExpanded(!expanded)} className="text-xs text-cyan-400/60 hover:text-cyan-400 transition">
              {expanded ? "Hide full brief ↑" : "View full brief ↓"}
            </button>

            {expanded && (
              <div className="mt-4 space-y-5">
                {briefScenes.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-white/25 mb-2">Scene Breakdown</p>
                    <div className="space-y-3">
                      {briefScenes.map((scene, i) => (
                        <div key={i} className="rounded-lg border border-white/8 bg-black/20 p-3 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-cyan-400 font-bold text-xs shrink-0 w-12">{scene.timestamp}</span>
                            <span className="text-xs text-white/40 border border-white/10 px-1.5 py-0.5 rounded">{scene.shotType}</span>
                          </div>
                          <p className="text-xs text-white/70 ml-14">{scene.visual}</p>
                          {scene.audio && (
                            <p className="text-xs text-yellow-300/60 ml-14">🎙 {scene.audio}</p>
                          )}
                          {scene.textOverlay && (
                            <p className="text-xs text-white/40 ml-14 font-mono bg-white/5 px-2 py-0.5 rounded inline-block">{scene.textOverlay}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {briefKit && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-white/25 mb-2">Production Kit</p>
                    <div className="rounded-lg border border-white/8 bg-black/20 p-3 grid grid-cols-2 gap-2">
                      {([
                        ["Location", briefKit.location],
                        ["Casting", briefKit.casting],
                        ["Lighting", briefKit.lighting],
                        ["Audio Style", briefKit.audioStyle],
                        ["Color Grade", briefKit.colorGrade],
                      ] as [string, string][]).map(([label, val]) => (
                        <div key={label}>
                          <p className="text-xs text-white/25">{label}</p>
                          <p className="text-xs text-white/70">{val}</p>
                        </div>
                      ))}
                      {briefKit.props?.length > 0 && (
                        <div className="col-span-2">
                          <p className="text-xs text-white/25">Props</p>
                          <p className="text-xs text-white/70">{briefKit.props.join(", ")}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {briefImageAd && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-white/25 mb-2">Static Ad Copy</p>
                    <div className="rounded-lg border border-white/8 bg-black/20 p-3 space-y-2">
                      <p className="text-sm font-bold text-white">{briefImageAd.headline}</p>
                      <p className="text-xs text-white/50 leading-relaxed">{briefImageAd.bodyCopy}</p>
                      <p className="text-xs text-white/30 italic">{briefImageAd.visualDirection}</p>
                      <span className="inline-block rounded-lg border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 text-xs px-3 py-1 font-semibold">{briefImageAd.cta}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Metrics bar — shown when testing/live/winner */}
        {(variation.status === "testing" || variation.status === "live" || variation.status === "winner") && (
          <MetricsBar metrics={variation.metrics} />
        )}

        {/* Notes */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => onNotesChange(notes)}
          placeholder="Add notes — results, what you changed, CPM..."
          rows={1}
          className="mt-3 w-full bg-transparent text-xs text-white/40 placeholder-white/15 outline-none resize-none border-t border-white/5 pt-2"
        />
      </div>
      <CopyBar text={isHook ? String(content.hook ?? "") : isBrief ? `${String(content.format ?? "")} — ${String(content.concept ?? "")}\n\n${briefScenes.map((s) => `[${s.timestamp}] ${s.shotType}\nVisual: ${s.visual}\nAudio: ${s.audio}`).join("\n\n")}` : (content.sections as { timestamp: string; copy: string }[] ?? []).map((s) => `[${s.timestamp}] ${s.copy}`).join("\n\n")} />
    </div>
  );
}

function MetricsBar({ metrics }: { metrics: VariationMetrics | null }) {
  if (!metrics) {
    return (
      <div className="mt-3 pt-3 border-t border-white/5">
        <p className="text-[10px] text-white/20 italic">No metrics yet — add spend, ROAS, and CTR to track performance</p>
      </div>
    );
  }
  return (
    <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-4">
      {metrics.roas != null && (
        <div>
          <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">ROAS</p>
          <p className="text-sm font-black text-green-400">{metrics.roas}x</p>
        </div>
      )}
      {metrics.ctr != null && (
        <div>
          <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">CTR</p>
          <p className="text-sm font-black text-cyan-400">{metrics.ctr}</p>
        </div>
      )}
      {metrics.spend != null && (
        <div>
          <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Spend</p>
          <p className="text-sm font-black text-white/60">${metrics.spend}</p>
        </div>
      )}
      {metrics.impressions != null && (
        <div>
          <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Impr.</p>
          <p className="text-sm font-black text-white/60">{metrics.impressions.toLocaleString()}</p>
        </div>
      )}
      {metrics.conversions != null && (
        <div>
          <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Conv.</p>
          <p className="text-sm font-black text-white/60">{metrics.conversions}</p>
        </div>
      )}
    </div>
  );
}

// ── Email Editor Card ──────────────────────────────────────────────────────────

function EmailEditorCard({
  email,
  isEditing,
  edits,
  onEdit,
  onCancel,
  onSave,
  onEditChange,
  onStatusChange,
}: {
  email: EmailDraft;
  isEditing: boolean;
  edits: Partial<EmailDraft>;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onEditChange: (patch: Partial<EmailDraft>) => void;
  onStatusChange: (s: string) => void;
}) {
  const statusStyle = STATUS_STYLES[email.status] ?? STATUS_STYLES.draft;
  const bodyLines = email.body ? email.body.split("\n").slice(0, 3) : [];

  if (isEditing) {
    return (
      <div className="rounded-xl border border-cyan-500/30 bg-[#070c1a] overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.08)]">
        <div className="p-5 space-y-3">
          {/* Edit mode header */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">Editing Email #{email.position}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={onCancel}
                className="px-3 py-1 rounded-lg border border-white/10 text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-xs font-semibold text-[#0a0f1e] transition"
              >
                Save
              </button>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/30 mb-1">Subject Line</label>
            <input
              value={edits.subject ?? ""}
              onChange={(e) => onEditChange({ subject: e.target.value })}
              placeholder="Email subject..."
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-400/50 transition"
            />
          </div>

          {/* Preview text */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/30 mb-1">Preview Text</label>
            <input
              value={edits.preview ?? ""}
              onChange={(e) => onEditChange({ preview: e.target.value })}
              placeholder="Preview text shown in inbox..."
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-400/50 transition"
            />
          </div>

          {/* Timing */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/30 mb-1">Send Timing</label>
            <input
              value={edits.timing ?? ""}
              onChange={(e) => onEditChange({ timing: e.target.value })}
              placeholder="e.g. Send immediately, Day 3 after signup..."
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-cyan-400/50 transition"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/30 mb-1">Email Body</label>
            <textarea
              value={edits.body ?? ""}
              onChange={(e) => onEditChange({ body: e.target.value })}
              placeholder="Write your email body here..."
              rows={10}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-cyan-400/50 transition resize-y font-mono leading-relaxed"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/30 mb-1">Status</label>
            <select
              value={edits.status ?? email.status}
              onChange={(e) => onEditChange({ status: e.target.value })}
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50 transition cursor-pointer"
            >
              {["draft", "ready", "live"].map((s) => (
                <option key={s} value={s} className="bg-[#0a0f1e]">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  // View mode
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden hover:border-white/20 transition group">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {email.timing && (
                <span className="text-xs font-bold text-cyan-400 shrink-0">{email.timing}</span>
              )}
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0 ${statusStyle}`}>
                {email.status.charAt(0).toUpperCase() + email.status.slice(1)}
              </span>
            </div>
            <p className="text-sm font-semibold text-white/90 leading-snug">{email.subject ?? "(no subject)"}</p>
            {email.preview && (
              <p className="text-xs text-white/40 mt-0.5 truncate">{email.preview}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={email.status}
              onChange={(e) => onStatusChange(e.target.value)}
              className={`text-xs px-2 py-0.5 rounded-full border cursor-pointer bg-transparent outline-none ${statusStyle}`}
            >
              {["draft", "ready", "live"].map((s) => (
                <option key={s} value={s} className="bg-[#0a0f1e]">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <button
              onClick={onEdit}
              className="px-3 py-1 rounded-lg border border-white/10 text-xs text-white/40 hover:text-cyan-300 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition"
            >
              Edit
            </button>
          </div>
        </div>

        {/* First 3 lines of body as preview */}
        {bodyLines.length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/5">
            {bodyLines.map((line, i) => (
              <p key={i} className="text-xs text-white/35 leading-relaxed truncate">{line || <span className="opacity-0">_</span>}</p>
            ))}
            {(email.body?.split("\n").length ?? 0) > 3 && (
              <p className="text-xs text-white/20 mt-0.5">+ {(email.body?.split("\n").length ?? 0) - 3} more lines</p>
            )}
          </div>
        )}
      </div>
      <CopyBar text={`Subject: ${email.subject ?? ""}\nPreview: ${email.preview ?? ""}\n\n${email.body ?? ""}`} />
    </div>
  );
}

// ── Email Flow Diagram ─────────────────────────────────────────────────────────

function EmailFlowDiagram({ emails }: { emails: EmailDraft[] }) {
  // Build a flat timeline sorted by sequence order then position
  const seqOrder: Record<string, number> = { welcome: 0, cart: 1, "post-purchase": 2 };
  const sorted = [...emails].sort((a, b) => {
    const seqDiff = (seqOrder[a.sequence] ?? 99) - (seqOrder[b.sequence] ?? 99);
    return seqDiff !== 0 ? seqDiff : a.position - b.position;
  });

  // Try to parse a "day number" from timing string for diagram labels
  function extractDay(timing: string | null, fallbackIndex: number): string {
    if (!timing) return `Day ${fallbackIndex}`;
    const m = timing.match(/day\s*(\d+)/i);
    if (m) return `Day ${m[1]}`;
    if (/immedi/i.test(timing)) return "Day 0";
    return `#${fallbackIndex + 1}`;
  }

  if (sorted.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-5 overflow-x-auto">
      <p className="text-xs uppercase tracking-widest text-white/25 mb-4">Email Flow Timeline</p>
      <div className="flex items-center gap-0 min-w-max">
        {sorted.map((email, i) => {
          const dayLabel = extractDay(email.timing, i);
          const isLast = i === sorted.length - 1;
          const seqColor = email.sequence === "welcome"
            ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
            : email.sequence === "cart"
            ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
            : "border-purple-500/30 bg-purple-500/10 text-purple-300";
          const dotColor = email.sequence === "welcome"
            ? "bg-cyan-400"
            : email.sequence === "cart"
            ? "bg-yellow-400"
            : "bg-purple-400";
          const statusDot = email.status === "live"
            ? "bg-green-400"
            : email.status === "ready"
            ? "bg-cyan-400"
            : "bg-white/20";

          return (
            <div key={email.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5 group">
                <span className="text-[10px] text-white/25 font-mono">{dayLabel}</span>
                <div className={`relative w-8 h-8 rounded-full border-2 flex items-center justify-center ${seqColor.split(" ").slice(0, 2).join(" ")} transition`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                  <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0a0f1e] ${statusDot}`} />
                </div>
                <div className={`px-2 py-0.5 rounded-md border text-[9px] font-medium whitespace-nowrap max-w-[90px] truncate ${seqColor}`}>
                  {email.subject ? email.subject.slice(0, 14) + (email.subject.length > 14 ? "…" : "") : EMAIL_SEQ_LABELS[email.sequence]}
                </div>
              </div>
              {!isLast && (
                <div className="w-6 h-px bg-white/10 mx-0.5 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-[10px] text-white/25">Welcome</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
          <span className="text-[10px] text-white/25">Abandoned Cart</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-400" />
          <span className="text-[10px] text-white/25">Post-Purchase</span>
        </div>
        <div className="flex items-center gap-1.5 ml-4">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-[10px] text-white/25">Live</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-white/20" />
          <span className="text-[10px] text-white/25">Draft</span>
        </div>
      </div>
    </div>
  );
}

// ── Landing Edit Field ─────────────────────────────────────────────────────────

function LandingEditField({
  label,
  value,
  saved,
  unsaved,
  onChange,
  onSave,
  placeholder,
  multiline,
  rows = 1,
}: {
  label: string;
  fieldKey: string;
  value: string;
  saved: boolean;
  unsaved: boolean;
  onChange: (v: string) => void;
  onSave: (v: string) => void;
  placeholder?: string;
  multiline: boolean;
  rows?: number;
}) {
  const borderClass = unsaved
    ? "border-yellow-500/30 focus-within:border-yellow-400/50"
    : saved
    ? "border-green-500/30 focus-within:border-green-400/50"
    : "border-white/10 focus-within:border-cyan-400/40";

  const dotClass = unsaved
    ? "bg-yellow-400"
    : saved
    ? "bg-green-400"
    : "bg-white/15";

  return (
    <div className={`rounded-xl border bg-white/[0.03] p-4 transition ${borderClass}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-widest text-white/30">{label}</p>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full transition ${dotClass}`} />
          <span className="text-[9px] text-white/20">
            {unsaved ? "unsaved" : saved ? "saved" : ""}
          </span>
        </div>
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => { if (e.target.value.trim()) onSave(e.target.value); }}
          placeholder={placeholder}
          rows={rows}
          className="w-full bg-transparent text-sm text-white/80 placeholder-white/20 outline-none resize-none leading-relaxed"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => { if (e.target.value.trim()) onSave(e.target.value); }}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-white/80 placeholder-white/20 outline-none leading-relaxed"
        />
      )}
    </div>
  );
}

// ── Landing List Edit Field ────────────────────────────────────────────────────

function LandingListEditField({
  label,
  items,
  saved,
  unsaved,
  onChange,
  onSave,
}: {
  label: string;
  fieldKey: string;
  items: string[];
  saved: boolean;
  unsaved: boolean;
  onChange: (v: string[]) => void;
  onSave: (v: string[]) => void;
}) {
  // Edit as newline-separated text
  const [text, setText] = useState(items.join("\n"));

  const borderClass = unsaved
    ? "border-yellow-500/30 focus-within:border-yellow-400/50"
    : saved
    ? "border-green-500/30 focus-within:border-green-400/50"
    : "border-white/10 focus-within:border-cyan-400/40";

  const dotClass = unsaved
    ? "bg-yellow-400"
    : saved
    ? "bg-green-400"
    : "bg-white/15";

  function handleBlur() {
    const parsed = text.split("\n").map((l) => l.trim()).filter(Boolean);
    onChange(parsed);
    onSave(parsed);
  }

  return (
    <div className={`rounded-xl border bg-white/[0.03] p-4 transition ${borderClass}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-widest text-white/30">{label}</p>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full transition ${dotClass}`} />
          <span className="text-[9px] text-white/20">{unsaved ? "unsaved" : saved ? "saved" : ""}</span>
        </div>
      </div>
      <p className="text-[9px] text-white/20 mb-2">One item per line</p>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const parsed = e.target.value.split("\n").map((l) => l.trim()).filter(Boolean);
          onChange(parsed);
        }}
        onBlur={handleBlur}
        rows={Math.max(3, items.length + 1)}
        className="w-full bg-transparent text-sm text-white/80 placeholder-white/20 outline-none resize-none leading-relaxed font-mono"
      />
    </div>
  );
}

// ── Landing Live Preview ───────────────────────────────────────────────────────

function LandingPreview({ landing }: { landing: Partial<LandingDraft> }) {
  const bullets = landing.bullets ?? [];
  const trustBar = landing.trustBar ?? [];

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
      {/* Browser chrome mockup bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.03] border-b border-white/10">
        <span className="w-2 h-2 rounded-full bg-red-500/40" />
        <span className="w-2 h-2 rounded-full bg-yellow-500/40" />
        <span className="w-2 h-2 rounded-full bg-green-500/40" />
        <div className="flex-1 mx-3 h-4 rounded bg-white/5 flex items-center px-2">
          <span className="text-[9px] text-white/20 font-mono truncate">yoursite.com</span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Trust bar */}
        {trustBar.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {trustBar.map((item, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-white/50">
                {item}
              </span>
            ))}
          </div>
        )}

        {/* Headline */}
        {landing.headline ? (
          <h1 className="text-xl font-black text-white leading-tight">{landing.headline}</h1>
        ) : (
          <div className="h-7 rounded-lg bg-white/5 w-3/4" />
        )}

        {/* Subheadline */}
        {landing.subheadline ? (
          <p className="text-sm text-white/60 leading-relaxed">{landing.subheadline}</p>
        ) : (
          <div className="space-y-1.5">
            <div className="h-3 rounded bg-white/5 w-full" />
            <div className="h-3 rounded bg-white/5 w-2/3" />
          </div>
        )}

        {/* Bullets */}
        {bullets.length > 0 && (
          <ul className="space-y-2">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-white/70">
                <span className="text-cyan-400 mt-0.5 shrink-0">✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        {/* CTA */}
        <div>
          {landing.ctaCopy ? (
            <button className="w-full py-3 rounded-xl bg-cyan-500 text-[#0a0f1e] text-sm font-black uppercase tracking-wide shadow-[0_0_24px_rgba(6,182,212,0.3)] hover:bg-cyan-400 transition">
              {landing.ctaCopy}
            </button>
          ) : (
            <div className="h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/20" />
          )}
        </div>

        {/* Urgency */}
        {landing.urgencyLine && (
          <p className="text-center text-xs text-orange-400/80 font-medium">{landing.urgencyLine}</p>
        )}

        {/* Social proof snippet */}
        {landing.socialProof && (
          <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
            <p className="text-xs text-white/40 italic leading-relaxed">&ldquo;{landing.socialProof.slice(0, 120)}{landing.socialProof.length > 120 ? "…" : ""}&rdquo;</p>
          </div>
        )}

        {/* Guarantee */}
        {landing.guarantee && (
          <div className="flex items-start gap-2 rounded-lg border border-green-500/15 bg-green-500/5 p-3">
            <span className="text-green-400 text-sm shrink-0">🛡</span>
            <p className="text-xs text-green-300/70 leading-relaxed">{landing.guarantee}</p>
          </div>
        )}

        {/* Empty state hint */}
        {!landing.headline && !landing.subheadline && !landing.ctaCopy && (
          <p className="text-center text-xs text-white/15 py-4">Start typing in the editor to see your live preview</p>
        )}
      </div>
    </div>
  );
}

function CopyBar({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex justify-end px-3 pb-2">
      <button
        onClick={() => { void navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); }); }}
        className="text-xs text-white/20 hover:text-white/50 transition"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-4xl mb-3">{icon}</span>
      <p className="text-sm font-semibold text-white/40 mb-1">{title}</p>
      <p className="text-xs text-white/20 max-w-xs">{sub}</p>
    </div>
  );
}
