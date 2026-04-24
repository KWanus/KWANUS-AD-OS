"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import DatabaseFallbackNotice from "@/components/DatabaseFallbackNotice";
import type { Block } from "@/components/site-builder/BlockRenderer";
import {
  ArrowLeft,
  Loader2,
  Globe,
  Edit2,
  Trash2,
  Plus,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Check,
  X,
  Copy,
  Wand2,
  Megaphone,
  Link2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAiPageTemplateLabel,
  getMissingSiteStructurePages,
  type AiPageTemplate,
} from "@/lib/site-builder/copilotActions";
import { auditPublishedSite } from "@/lib/site-builder/publishAudit";
import { getStarterTemplateNextMoves } from "@/lib/site-builder/starterTemplates";

interface SitePage {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  views: number;
  order: number;
  updatedAt: string;
  blocks?: unknown[];
  seoTitle?: string | null;
  seoDesc?: string | null;
}

interface Site {
  id: string;
  name: string;
  slug: string;
  description?: string;
  faviconEmoji?: string;
  customDomain?: string | null;
  published: boolean;
  totalViews: number;
  theme: Record<string, unknown>;
  pages: SitePage[];
  _count?: { products: number };
}

type GenerationContext = {
  sourceMode?: string;
  sourceUrl?: string;
  sourceTitle?: string;
  niche?: string;
  location?: string;
  businessType?: string;
  executionTier?: "core" | "elite";
  templateId?: string;
  pageType?: string;
  createdPages?: { title?: string; slug?: string }[];
  blueprintScore?: { overall?: number };
  conversionNotes?: {
    primary_goal?: string;
    trust_elements_used?: string[];
    objections_addressed?: string[];
  };
  generationTrace?: {
    template_reason?: string;
    analysis_summary?: string[];
  };
};

export default function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: siteId } = use(params);
  const router = useRouter();

  const [site, setSite] = useState<Site | null>(null);
  const [databaseUnavailable, setDatabaseUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [addingPage, setAddingPage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [pageMode, setPageMode] = useState<"manual" | "ai">("manual");
  const [aiPageTemplate, setAiPageTemplate] = useState<AiPageTemplate>("about");
  const [creatingPage, setCreatingPage] = useState(false);
  const [upgradingStructure, setUpgradingStructure] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);
  const [autoFixingBasics, setAutoFixingBasics] = useState(false);

  useEffect(() => {
    fetch(`/api/sites/${siteId}`)
      .then(r => r.json() as Promise<{ ok: boolean; site?: Site | null; databaseUnavailable?: boolean }>)
      .then(d => {
        setDatabaseUnavailable(Boolean(d.databaseUnavailable));
        if (d.ok && d.site) setSite(d.site);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [siteId]);

  async function togglePublish() {
    if (!site) return;
    if (!site.published) {
      const blockers = [
        !site.description?.trim() ? "site description is missing" : null,
        siteAudit.summary.pagesMissingSeo > 0 ? `${siteAudit.summary.pagesMissingSeo} page${siteAudit.summary.pagesMissingSeo > 1 ? "s are" : " is"} missing SEO` : null,
        siteAudit.summary.pagesMissingTrust > 0 ? `${siteAudit.summary.pagesMissingTrust} page${siteAudit.summary.pagesMissingTrust > 1 ? "s are" : " is"} missing trust proof` : null,
        siteAudit.summary.pagesMissingCta > 0 ? `${siteAudit.summary.pagesMissingCta} page${siteAudit.summary.pagesMissingCta > 1 ? "s are" : " is"} missing a clear CTA` : null,
        missingStructurePages.length > 0 ? "core pages are still missing" : null,
      ].filter(Boolean);

      if (blockers.length > 0) {
        const shouldContinue = confirm(
          `This site still has launch gaps:\n\n- ${blockers.join("\n- ")}\n\nPublish anyway?`
        );
        if (!shouldContinue) return;
      }
    }

    setPublishing(true);
    try {
      await fetch(`/api/sites/${siteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !site.published }),
      });
      const wasPublished = site.published;
      setSite(prev => prev ? { ...prev, published: !prev.published } : prev);
      if (wasPublished) {
        toast.success("Site unpublished");
      } else {
        toast.success(`Site is now live!`, {
          description: `${window.location.origin}/s/${site.slug}`,
          action: { label: "View", onClick: () => window.open(`/s/${site.slug}`, "_blank") },
          duration: 8000,
        });
      }
    } finally {
      setPublishing(false);
    }
  }

  async function createPage() {
    if (!newPageTitle.trim()) return;
    setCreatingPage(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPageTitle.trim(),
          ...(pageMode === "ai" ? { aiTemplate: aiPageTemplate } : {}),
        }),
      });
      const data = await res.json() as { ok: boolean; page?: SitePage };
      if (data.ok && data.page) {
        setSite(prev => prev ? { ...prev, pages: [...prev.pages, data.page!] } : prev);
        setAddingPage(false);
        setNewPageTitle("");
        setPageMode("manual");
        setAiPageTemplate("about");
        router.push(`/websites/${siteId}/editor/${data.page.id}`);
      }
    } catch {
      toast.error("Failed to create page");
    } finally {
      setCreatingPage(false);
    }
  }

  function startAiPageFlow(template: AiPageTemplate) {
    setPageMode("ai");
    setAiPageTemplate(template);
    setNewPageTitle(getAiPageTemplateLabel(template));
    setAddingPage(true);
  }

  async function deletePage(pageId: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/sites/${siteId}/pages/${pageId}`, { method: "DELETE" });
      const data = await res.json() as { ok: boolean; error?: string };
      if (!data.ok) { toast.error(data.error ?? "Failed"); return; }
      setSite(prev => prev ? { ...prev, pages: prev.pages.filter(p => p.id !== pageId) } : prev);
    } catch {
      toast.error("Failed to delete page");
    }
  }

  function getPublicUrl(currentSite: Site) {
    if (currentSite.customDomain?.trim()) {
      const normalized = currentSite.customDomain.trim().replace(/^https?:\/\//, "");
      return `https://${normalized}`;
    }
    return `${window.location.origin}/s/${currentSite.slug}`;
  }

  function copyLink() {
    if (!site) return;
    void navigator.clipboard.writeText(getPublicUrl(site));
    toast.success("Link copied!");
  }

  async function saveBrandingSettings() {
    if (!site) return;
    setSavingBranding(true);
    try {
      const res = await fetch(`/api/sites/${siteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: site.name,
          description: site.description ?? "",
          faviconEmoji: site.faviconEmoji ?? "🚀",
          customDomain: site.customDomain ?? "",
        }),
      });
      const data = await res.json() as { ok?: boolean };
      if (!res.ok || !data.ok) throw new Error("Failed");
      toast.success("Site settings saved");
    } catch {
      toast.error("Could not save site settings");
    } finally {
      setSavingBranding(false);
    }
  }

  async function applyLaunchBasics() {
    setAutoFixingBasics(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/launch-basics`, {
        method: "POST",
      });
      const data = await res.json() as { ok?: boolean; summary?: string; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed");

      const refreshed = await fetch(`/api/sites/${siteId}`);
      const refreshedData = await refreshed.json() as { ok: boolean; site?: Site | null };
      if (refreshedData.ok && refreshedData.site) {
        setSite(refreshedData.site);
      }
      toast.success(data.summary ?? "Launch basics updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not auto-fix launch basics");
    } finally {
      setAutoFixingBasics(false);
    }
  }

  async function movePage(pageId: string, direction: "up" | "down") {
    if (!site) return;
    const currentIndex = site.pages.findIndex((page) => page.id === pageId);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= site.pages.length) return;

    const nextPages = [...site.pages];
    const currentPage = nextPages[currentIndex];
    const targetPage = nextPages[targetIndex];
    nextPages[currentIndex] = { ...targetPage, order: currentPage.order };
    nextPages[targetIndex] = { ...currentPage, order: targetPage.order };
    nextPages.sort((a, b) => a.order - b.order);
    setSite((prev) => prev ? { ...prev, pages: nextPages } : prev);

    try {
      await Promise.all([
        fetch(`/api/sites/${siteId}/pages/${currentPage.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: targetPage.order }),
        }),
        fetch(`/api/sites/${siteId}/pages/${targetPage.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: currentPage.order }),
        }),
      ]);
    } catch {
      toast.error("Failed to reorder pages");
      setSite((prev) => prev ? {
        ...prev,
        pages: [...prev.pages].sort((a, b) => a.order - b.order),
      } : prev);
    }
  }

  async function togglePageVisibility(pageId: string, published: boolean) {
    if (!site) return;
    try {
      await fetch(`/api/sites/${siteId}/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !published }),
      });
      setSite((prev) => prev ? {
        ...prev,
        pages: prev.pages.map((page) => page.id === pageId ? { ...page, published: !published } : page),
      } : prev);
      toast.success(published ? "Page hidden from the live site" : "Page is now visible on the live site");
    } catch {
      toast.error("Failed to update page visibility");
    }
  }

  async function duplicatePage(pageId: string, title: string) {
    if (!site) return;
    try {
      const response = await fetch(`/api/sites/${siteId}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${title} Copy`,
          sourcePageId: pageId,
        }),
      });
      const data = await response.json() as { ok: boolean; page?: SitePage; error?: string };
      if (!data.ok || !data.page) {
        throw new Error(data.error ?? "Failed to duplicate page");
      }
      setSite((prev) => prev ? {
        ...prev,
        pages: [...prev.pages, data.page!].sort((a, b) => a.order - b.order),
      } : prev);
      toast.success("Page duplicated as a new draft");
      router.push(`/websites/${siteId}/editor/${data.page.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to duplicate page");
    }
  }

  async function upgradeSiteStructure() {
    if (!site) return;
    const missingTemplates = getMissingSiteStructurePages(site.pages.map((page) => page.slug));
    if (!missingTemplates.length) {
      toast.success("This site already has the core structure pages.");
      return;
    }

    setUpgradingStructure(true);
    try {
      const createdPages: SitePage[] = [];
      for (const template of missingTemplates) {
        const res = await fetch(`/api/sites/${siteId}/pages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: getAiPageTemplateLabel(template),
            aiTemplate: template,
          }),
        });
        const data = await res.json() as { ok: boolean; page?: SitePage; error?: string };
        if (!data.ok || !data.page) {
          throw new Error(data.error ?? `Failed to create ${template} page`);
        }
        createdPages.push(data.page);
      }
      setSite((prev) => prev ? { ...prev, pages: [...prev.pages, ...createdPages] } : prev);
      toast.success(`Created ${createdPages.length} missing page${createdPages.length > 1 ? "s" : ""}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upgrade site structure");
    } finally {
      setUpgradingStructure(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020509] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-[#020509] flex items-center justify-center px-4">
        <div className="w-full max-w-3xl space-y-4">
          <DatabaseFallbackNotice visible={databaseUnavailable} />
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-8 text-center">
            <p className="text-white/30">{databaseUnavailable ? "Site data is temporarily unavailable." : "Site not found."}</p>
          </div>
        </div>
      </div>
    );
  }

  const generation = (site.theme?.generation as GenerationContext | undefined) ?? null;
  const starterGuidance = getStarterTemplateNextMoves(generation?.templateId);
  const missingStructurePages = getMissingSiteStructurePages(site.pages.map((page) => page.slug));
  const visiblePages = site.pages.filter((page) => page.published);
  const hiddenPages = site.pages.filter((page) => !page.published);
  const hasLandingPage = site.pages.some((page) => page.slug === "landing" || /landing/i.test(page.title));
  const siteAudit = auditPublishedSite({
    published: site.published,
    productCount: site._count?.products ?? 0,
    pages: site.pages.map((page) => ({
      id: page.id,
      title: page.title,
      slug: page.slug,
      published: page.published,
      blocks: (page.blocks as Block[] | undefined) ?? [],
      seoTitle: page.seoTitle ?? null,
      seoDesc: page.seoDesc ?? null,
    })),
  });
  const firstVisiblePageNeedingSeo = siteAudit.pageAudits.find((pageAudit) => !pageAudit.seoReady)?.id;
  const firstPageNeedingTrust = siteAudit.pageAudits.find((pageAudit) => !pageAudit.hasTrust)?.id;
  const firstPageNeedingCta = siteAudit.pageAudits.find((pageAudit) => !pageAudit.hasPrimaryCta)?.id;
  const launchChecklist = [
    {
      id: "publish",
      label: "Publish the site",
      done: site.published,
      actionLabel: "Publish",
      onAction: () => void togglePublish(),
    },
    {
      id: "structure",
      label: "Complete the core site structure",
      done: missingStructurePages.length === 0,
      actionLabel: "Build Pages",
      onAction: () => void upgradeSiteStructure(),
    },
    {
      id: "seo",
      label: "Set SEO titles and descriptions on visible pages",
      done: siteAudit.summary.pagesMissingSeo === 0,
      actionLabel: "Fix SEO",
      onAction: () => {
        if (firstVisiblePageNeedingSeo) router.push(`/websites/${siteId}/editor/${firstVisiblePageNeedingSeo}`);
      },
    },
    {
      id: "trust",
      label: "Add trust proof to every major page",
      done: siteAudit.summary.pagesMissingTrust === 0,
      actionLabel: "Add Trust",
      onAction: () => {
        if (firstPageNeedingTrust) router.push(`/websites/${siteId}/editor/${firstPageNeedingTrust}`);
      },
    },
    {
      id: "cta",
      label: "Make sure each page has a clear CTA",
      done: siteAudit.summary.pagesMissingCta === 0,
      actionLabel: "Fix CTA",
      onAction: () => {
        if (firstPageNeedingCta) router.push(`/websites/${siteId}/editor/${firstPageNeedingCta}`);
      },
    },
  ];
  const checklistCompleteCount = launchChecklist.filter((item) => item.done).length;
  const checklistPercent = Math.round((checklistCompleteCount / launchChecklist.length) * 100);

  function runStarterAction(actionType: string) {
    switch (actionType) {
      case "build_pages":
        void upgradeSiteStructure();
        break;
      case "fix_trust":
        if (firstPageNeedingTrust) router.push(`/websites/${siteId}/editor/${firstPageNeedingTrust}`);
        break;
      case "launch_google":
        router.push("/campaigns/new?type=google");
        break;
      case "launch_campaign":
        router.push("/campaigns/new");
        break;
      case "open_store":
        router.push(`/websites/${siteId}/store`);
        break;
      case "add_landing":
        startAiPageFlow("landing");
        break;
      case "open_editor":
        if (site?.pages[0]) router.push(`/websites/${siteId}/editor/${site.pages[0].id}`);
        break;
      case "fix_basics":
        void applyLaunchBasics();
        break;
      default:
        break;
    }
  }

  return (
    <div className="min-h-screen bg-[#020509] text-white">
      <AppNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Back */}
        <Link href="/websites" className="inline-flex items-center gap-1.5 text-white/30 hover:text-white/60 text-sm transition mb-6">
          <ArrowLeft className="w-3.5 h-3.5" />
          All Sites
        </Link>

        {/* Site header */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-white/[0.08] flex items-center justify-center text-2xl">
              {site.faviconEmoji ?? "🚀"}
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">{site.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${site.published ? "bg-green-500/15 text-green-400 border border-green-500/20" : "bg-white/[0.03] text-white/30 border border-white/10"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${site.published ? "bg-green-400 animate-pulse" : "bg-white/30"}`} />
                  {site.published ? "Live" : "Draft"}
                </span>
                <button onClick={copyLink} className="flex items-center gap-1 text-[11px] text-white/30 hover:text-cyan-400 transition">
                  <Copy className="w-3 h-3" />
                  /s/{site.slug}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {site.published && (
              <a
                href={getPublicUrl(site)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.1] text-white/40 hover:text-white/60 text-sm transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Live
              </a>
            )}
            <button
              onClick={() => void togglePublish()}
              disabled={publishing}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black transition-all ${
                site.published
                  ? "bg-white/[0.06] border border-white/[0.1] text-white/50 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
                  : "bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:opacity-90 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
              }`}
            >
              {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
              {site.published ? "Unpublish" : "Publish Site"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Total Views", value: site.totalViews.toLocaleString(), color: "text-cyan-400" },
            { label: "Pages", value: site.pages.length, color: "text-purple-400" },
            { label: "Status", value: site.published ? "Live" : "Draft", color: site.published ? "text-green-400" : "text-white/40" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-5 py-4 backdrop-blur-sm hover:border-white/[0.1] transition">
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1">{label}</p>
              <p className={`text-2xl font-black bg-gradient-to-r ${color === "text-cyan-400" ? "from-cyan-400 to-blue-300" : color === "text-purple-400" ? "from-purple-400 to-fuchsia-300" : color === "text-green-400" ? "from-green-400 to-emerald-300" : "from-white/40 to-white/40"} bg-clip-text text-transparent`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="mb-8 rounded-[28px] border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/15 to-transparent" />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300/80">Branding & Share Settings</p>
              <p className="mt-2 text-lg font-black text-white">Set how this site looks and where people should visit it.</p>
              <p className="mt-2 text-sm leading-6 text-white/55">
                Keep the public URL, favicon, and description clean so the site looks launch-ready when you share it or index it.
              </p>
            </div>
            <button
              onClick={() => void saveBrandingSettings()}
              disabled={savingBranding}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-cyan-900 disabled:opacity-50"
            >
              {savingBranding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save Settings
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => void applyLaunchBasics()}
              disabled={autoFixingBasics}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm font-black text-cyan-100 disabled:opacity-50"
            >
              {autoFixingBasics ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Auto-Fix Launch Basics
            </button>
            <p className="self-center text-xs leading-5 text-white/40">
              Fills in missing site description, favicon defaults, domain formatting, and page SEO titles/descriptions.
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="space-y-4 rounded-2xl border border-white/[0.06] bg-black/20 backdrop-blur-sm p-4 hover:border-white/[0.1] transition">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/25">Site Name</label>
                <input
                  type="text"
                  value={site.name}
                  onChange={(e) => setSite((prev) => prev ? { ...prev, name: e.target.value } : prev)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-cyan-500/40 focus:outline-none"
                  placeholder="Your site name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/25">Description</label>
                <textarea
                  rows={3}
                  value={site.description ?? ""}
                  onChange={(e) => setSite((prev) => prev ? { ...prev, description: e.target.value } : prev)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-cyan-500/40 focus:outline-none resize-none"
                  placeholder="Short description used across the site and metadata."
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/25">Favicon Emoji</label>
                <input
                  type="text"
                  maxLength={4}
                  value={site.faviconEmoji ?? "🚀"}
                  onChange={(e) => setSite((prev) => prev ? { ...prev, faviconEmoji: e.target.value } : prev)}
                  className="w-24 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-center text-xl text-white focus:border-cyan-500/40 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-white/[0.06] bg-black/20 backdrop-blur-sm p-4 hover:border-white/[0.1] transition">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/25">Custom Domain</label>
                <input
                  type="text"
                  value={site.customDomain ?? ""}
                  onChange={(e) => setSite((prev) => prev ? { ...prev, customDomain: e.target.value } : prev)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-cyan-500/40 focus:outline-none"
                  placeholder="www.yoursite.com"
                />
                <p className="text-xs leading-5 text-white/35">Leave blank to use the built-in `/s/{site.slug}` public URL.</p>
              </div>

              <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/10 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/80">Share URL</p>
                <p className="mt-2 break-all text-sm font-bold text-cyan-50">{getPublicUrl(site)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={copyLink}
                    className="rounded-xl border border-cyan-500/20 bg-white px-3 py-2 text-xs font-black text-cyan-900"
                  >
                    Copy Link
                  </button>
                  <a
                    href={getPublicUrl(site)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-black text-cyan-100"
                  >
                    Open Public Site
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {generation?.templateId && (
          <div className="mb-8 rounded-[28px] border border-cyan-500/20 bg-cyan-500/[0.08] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200/80">Template Guidance</p>
                <p className="mt-2 text-lg font-black text-white">{starterGuidance.headline}</p>
                <p className="mt-2 text-sm leading-6 text-cyan-50/80">
                  {starterGuidance.summary}
                </p>
                <p className="mt-3 text-xs leading-5 text-cyan-50/55">
                  Template: {generation.templateId} · Tier: {generation.executionTier ?? "core"} · Source: {generation.sourceMode?.replaceAll("_", " ") ?? "manual"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {starterGuidance.actions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => runStarterAction(action.type)}
                    className="rounded-2xl border border-cyan-500/20 bg-white px-4 py-3 text-sm font-black text-cyan-900"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 rounded-[28px] border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/15 to-transparent" />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300/80">Launch Path</p>
              <p className="mt-2 text-lg font-black text-white">
                {site.published ? "This site is live." : "This site is still in preflight."}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/55">
                Use this strip to see whether you are still polishing the internal draft, sharing the built-in public URL, or ready to move to a real domain.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={getPublicUrl(site)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/75"
              >
                <ExternalLink className="h-4 w-4" />
                Preview Public URL
              </a>
              <button
                onClick={() => void applyLaunchBasics()}
                disabled={autoFixingBasics}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm font-black text-cyan-100 disabled:opacity-50"
              >
                {autoFixingBasics ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                Fix Launch Basics
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/[0.06] bg-black/20 backdrop-blur-sm p-4 hover:border-white/[0.1] transition">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">Launch Stage</p>
              <p className="mt-2 text-sm font-black text-white">
                {site.published ? (site.customDomain?.trim() ? "Live on custom domain" : "Live on built-in public URL") : "Internal draft / preflight"}
              </p>
              <p className="mt-2 text-xs leading-5 text-white/40">
                {site.customDomain?.trim()
                  ? `Primary domain: ${site.customDomain.trim().replace(/^https?:\/\//, "")}`
                  : "No custom domain yet. Share the built-in public route first, then switch to your branded domain when ready."}
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-black/20 backdrop-blur-sm p-4 hover:border-white/[0.1] transition">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">Readiness Progress</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 transition-all"
                  style={{ width: `${checklistPercent}%` }}
                />
              </div>
              <p className="mt-3 text-sm font-black text-white">{checklistPercent}% ready</p>
              <p className="mt-1 text-xs leading-5 text-white/40">
                {checklistCompleteCount}/{launchChecklist.length} launch checks complete.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-black/20 backdrop-blur-sm p-4 hover:border-white/[0.1] transition">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">Domain Guidance</p>
              <p className="mt-2 text-sm font-black text-white">
                {site.customDomain?.trim() ? "Custom domain is set" : "Built-in route only"}
              </p>
              <p className="mt-2 text-xs leading-5 text-white/40">
                {site.customDomain?.trim()
                  ? "Make sure DNS points here before you push real traffic."
                  : "When you are ready to ship for real, add your custom domain in Branding & Share Settings so metadata and share links stay branded."}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-[28px] border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/15 to-transparent" />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300/80">Launch Actions</p>
              <p className="mt-2 text-lg font-black text-white">Once this page is clean, start sending traffic with intent.</p>
              <p className="mt-2 text-sm leading-6 text-white/55">
                These are the fastest next moves after the site is polished: preview, share, connect it to a campaign, or go find traffic sources.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <a
              href={getPublicUrl(site)}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-white/[0.08] bg-black/20 p-4 transition hover:border-cyan-500/20 hover:bg-cyan-500/[0.05]"
            >
              <ExternalLink className="h-5 w-5 text-cyan-300" />
              <p className="mt-3 text-sm font-black text-white">Preview Public Site</p>
              <p className="mt-2 text-xs leading-5 text-white/40">Open the actual public version and sanity-check the share path before you push traffic.</p>
            </a>

            <button
              onClick={copyLink}
              className="rounded-2xl border border-white/[0.08] bg-black/20 p-4 text-left transition hover:border-cyan-500/20 hover:bg-cyan-500/[0.05]"
            >
              <Link2 className="h-5 w-5 text-cyan-300" />
              <p className="mt-3 text-sm font-black text-white">Copy Share Link</p>
              <p className="mt-2 text-xs leading-5 text-white/40">Use the current public URL in sales messages, DMs, or internal review before a domain switch.</p>
            </button>

            <Link
              href="/campaigns/new"
              className="rounded-2xl border border-white/[0.08] bg-black/20 p-4 transition hover:border-cyan-500/20 hover:bg-cyan-500/[0.05]"
            >
              <Megaphone className="h-5 w-5 text-cyan-300" />
              <p className="mt-3 text-sm font-black text-white">Create Launch Campaign</p>
              <p className="mt-2 text-xs leading-5 text-white/40">Spin this site into your next Google, Facebook, or offer campaign instead of leaving it idle.</p>
            </Link>

            <Link
              href="/leads"
              className="rounded-2xl border border-white/[0.08] bg-black/20 p-4 transition hover:border-cyan-500/20 hover:bg-cyan-500/[0.05]"
            >
              <Globe className="h-5 w-5 text-cyan-300" />
              <p className="mt-3 text-sm font-black text-white">Find Traffic Sources</p>
              <p className="mt-2 text-xs leading-5 text-white/40">Go straight from site readiness into lead finding so the website becomes part of a real growth loop.</p>
            </Link>
          </div>
        </div>

        {generation && (
          <div className="mb-8 rounded-[28px] border border-white/[0.07] bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300/80">Build Context</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">Origin</p>
                <p className="mt-2 text-sm font-bold text-white/75">{generation.sourceMode?.replaceAll("_", " ") ?? "unknown"}</p>
                {generation.sourceUrl && (
                  <p className="mt-2 break-all text-xs leading-5 text-cyan-300/75">{generation.sourceUrl}</p>
                )}
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">Strategy</p>
                <p className="mt-2 text-sm font-bold text-white/75">
                  {generation.templateId ?? "custom"} · {generation.pageType ?? "page"}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/50">
                  {(generation.niche ?? "Unknown niche")} · {(generation.location ?? "Unknown market")}
                </p>
                {generation.createdPages?.length ? (
                  <p className="mt-2 text-xs font-bold text-cyan-300">
                    Created pages: {generation.createdPages.map((page) => page.title ?? page.slug ?? "Page").join(" · ")}
                  </p>
                ) : null}
                {typeof generation.blueprintScore?.overall === "number" && (
                  <p className="mt-2 text-xs font-bold text-emerald-300">Blueprint score: {generation.blueprintScore.overall}/100</p>
                )}
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">Why It Was Built</p>
                {generation.conversionNotes?.primary_goal && (
                  <p className="mt-2 text-sm font-bold text-white/75">Goal: {generation.conversionNotes.primary_goal}</p>
                )}
                {generation.generationTrace?.template_reason && (
                  <p className="mt-2 text-sm leading-6 text-white/50">{generation.generationTrace.template_reason}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {missingStructurePages.length > 0 && (
          <div className="mb-8 rounded-[28px] border border-cyan-500/20 bg-cyan-500/[0.07] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300/80">Upgrade Site Structure</p>
                <p className="mt-2 text-lg font-black text-white">This site is still missing some core pages.</p>
                <p className="mt-2 text-sm leading-6 text-cyan-50/75">
                  Generate the missing structure automatically so the public site feels more complete and easier to navigate.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {missingStructurePages.map((template) => (
                    <span
                      key={template}
                      className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-bold text-cyan-100"
                    >
                      {getAiPageTemplateLabel(template)}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => void upgradeSiteStructure()}
                disabled={upgradingStructure}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-cyan-900 disabled:opacity-50"
              >
                {upgradingStructure ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Upgrade Site Structure
              </button>
            </div>
          </div>
        )}

        <div className="mb-8 rounded-[28px] border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/15 to-transparent" />
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300/80">Site Health</p>
              <div className="mt-3 flex items-center gap-3">
                <p className="text-3xl font-black text-white">{siteAudit.score}</p>
                <p className="text-sm font-bold text-white/45">/ 100</p>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                This score reflects live readiness, structure completeness, SEO coverage, and whether visible pages actually contain the conversion ingredients they need.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!site.published && (
                <button
                  onClick={() => void togglePublish()}
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-cyan-900"
                >
                  Publish Site
                </button>
              )}
              {!hasLandingPage && (
                <button
                  onClick={() => startAiPageFlow("landing")}
                  className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm font-black text-cyan-200"
                >
                  Add Landing Page
                </button>
              )}
              {missingStructurePages.length > 0 && (
                <button
                  onClick={() => void upgradeSiteStructure()}
                  className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm font-black text-cyan-200"
                >
                  Build Missing Pages
                </button>
              )}
              {siteAudit.summary.pagesMissingSeo > 0 && site.pages[0] && (
                <button
                  onClick={() => router.push(`/websites/${siteId}/editor/${site.pages[0].id}`)}
                  className="rounded-2xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-sm font-black text-white/75"
                >
                  Fix SEO
                </button>
              )}
              {(!site.description?.trim() || siteAudit.summary.pagesMissingSeo > 0) && (
                <button
                  onClick={() => void applyLaunchBasics()}
                  disabled={autoFixingBasics}
                  className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm font-black text-cyan-200 disabled:opacity-50"
                >
                  {autoFixingBasics ? "Fixing..." : "Auto-Fix Basics"}
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-amber-500/15 bg-amber-500/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200/80">What Needs Work</p>
              <div className="mt-3 space-y-2">
                {siteAudit.blockers.length ? siteAudit.blockers.map((finding) => (
                  <p key={finding} className="text-sm leading-6 text-amber-50/90">{finding}</p>
                )) : (
                  <p className="text-sm leading-6 text-amber-50/90">No major structure issues detected right now.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200/80">What Is Strong</p>
              <div className="mt-3 space-y-2">
                {siteAudit.wins.length ? siteAudit.wins.map((win) => (
                  <p key={win} className="text-sm leading-6 text-emerald-50/90">{win}</p>
                )) : (
                  <p className="text-sm leading-6 text-emerald-50/90">As you add and publish more structure, the strengths will show up here.</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.05fr_1.35fr]">
            <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/80">Next Best Fixes</p>
              <div className="mt-3 space-y-2">
                {siteAudit.recommendations.length ? siteAudit.recommendations.map((item) => (
                  <p key={item} className="text-sm leading-6 text-cyan-50/90">{item}</p>
                )) : (
                  <p className="text-sm leading-6 text-cyan-50/90">No urgent fixes detected. This site is in a strong publish-ready state.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Page Readiness</p>
              <div className="mt-3 space-y-3">
                {siteAudit.pageAudits.map((pageAudit) => (
                  <button
                    key={pageAudit.id}
                    onClick={() => router.push(`/websites/${siteId}/editor/${pageAudit.id}`)}
                    className="flex w-full items-start justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-left transition hover:border-cyan-500/20 hover:bg-cyan-500/[0.05]"
                  >
                    <div>
                      <p className="text-sm font-black text-white">{pageAudit.title}</p>
                      <p className="mt-1 text-xs leading-5 text-white/40">
                        {pageAudit.blockCount} blocks ·
                        {pageAudit.seoReady ? " SEO ready" : " SEO missing"} ·
                        {pageAudit.hasPrimaryCta ? " CTA ready" : " CTA missing"} ·
                        {pageAudit.hasTrust ? " trust ready" : " trust missing"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-black text-white">{pageAudit.score}</p>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/25">Score</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-[28px] border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300/80">Launch Checklist</p>
              <p className="mt-2 text-lg font-black text-white">Finish the site before you send traffic.</p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                This checklist tracks the minimum launch-ready pieces: visibility, structure, SEO, trust, and CTA coverage.
              </p>
            </div>
            <p className="text-sm font-black text-white/50">
              {checklistCompleteCount}/{launchChecklist.length} complete
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {launchChecklist.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col gap-3 rounded-2xl border px-4 py-4 md:flex-row md:items-center md:justify-between ${
                  item.done
                    ? "border-emerald-500/20 bg-emerald-500/10"
                    : "border-white/[0.08] bg-black/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border ${
                    item.done
                      ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-200"
                      : "border-white/[0.1] bg-white/[0.04] text-white/35"
                  }`}>
                    {item.done ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{item.label}</p>
                    <p className="mt-1 text-xs leading-5 text-white/40">
                      {item.done ? "Completed." : "Still needs attention before this site is truly launch-ready."}
                    </p>
                  </div>
                </div>
                {!item.done && (
                  <button
                    onClick={item.onAction}
                    className="inline-flex items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-black text-cyan-200"
                  >
                    {item.actionLabel}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pages section */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-base font-black text-white">Pages</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPageMode("ai");
                setAddingPage(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 hover:text-cyan-200 text-xs font-bold transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Page with AI
            </button>
            <button
              onClick={() => {
                setPageMode("manual");
                setAddingPage(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] text-white/50 hover:text-white text-xs font-bold transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Page
            </button>
          </div>
        </div>

        {/* New page input */}
        {addingPage && (
          <div className="mb-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
            <div className="mb-3 flex gap-2">
              {([
                ["manual", "Blank Page"],
                ["ai", "AI Page"],
              ] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => setPageMode(mode)}
                  className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                    pageMode === mode
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "bg-white/[0.04] text-white/35 border border-white/[0.08] hover:text-white/60"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {pageMode === "ai" && (
              <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {([
                  ["about", "About"],
                  ["services", "Services"],
                  ["faq", "FAQ"],
                  ["contact", "Contact"],
                  ["landing", "Landing"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => {
                      setAiPageTemplate(value);
                      if (!newPageTitle.trim()) {
                        setNewPageTitle(label);
                      }
                    }}
                    className={`rounded-xl border px-3 py-2 text-left text-xs font-bold transition ${
                      aiPageTemplate === value
                        ? "border-cyan-500/30 bg-cyan-500/15 text-cyan-200"
                        : "border-white/[0.08] bg-white/[0.03] text-white/40 hover:text-white/70"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newPageTitle}
                onChange={e => setNewPageTitle(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") void createPage(); if (e.key === "Escape") setAddingPage(false); }}
                placeholder={pageMode === "ai" ? "Page title for the AI-generated page..." : "Page title..."}
                autoFocus
                className="flex-1 bg-white/[0.05] border border-cyan-500/40 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none"
              />
              <button onClick={() => void createPage()} disabled={creatingPage || !newPageTitle.trim()} className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 transition disabled:opacity-40">
                {creatingPage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button onClick={() => { setAddingPage(false); setNewPageTitle(""); setPageMode("manual"); }} className="p-2.5 rounded-xl hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            {pageMode === "ai" && (
              <p className="mt-3 text-xs leading-5 text-cyan-100/70">
                AI page generation uses this site’s niche, location, and conversion context to start the page with structured sections instead of a blank canvas.
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          {site.pages.map((page) => (
            <div
              key={page.id}
              className="group flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-white/[0.025] border border-white/[0.07] hover:border-white/[0.14] hover:bg-white/[0.04] transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5 text-white/30" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white truncate">{page.title}</span>
                  {page.slug === "home" && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 uppercase">Home</span>
                  )}
                  {!page.published && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black text-white/30 bg-white/[0.03] border border-white/10 uppercase">Hidden</span>
                  )}
                </div>
                <p className="text-xs text-white/30 mt-0.5">/s/{site.slug}/{page.slug === "home" ? "" : page.slug} · {page.views.toLocaleString()} views</p>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => void movePage(page.id, "up")}
                  disabled={page.order === site.pages[0]?.order}
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/20 hover:text-white/60 transition disabled:opacity-20"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => void movePage(page.id, "down")}
                  disabled={page.order === site.pages[site.pages.length - 1]?.order}
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/20 hover:text-white/60 transition disabled:opacity-20"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => void togglePageVisibility(page.id, page.published)}
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/25 hover:text-white/60 transition"
                >
                  {page.published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => void duplicatePage(page.id, page.title)}
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/25 hover:text-cyan-300 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {site.published && (
                  <a
                    href={`/s/${site.slug}${page.slug === "home" ? "" : `/${page.slug}`}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/25 hover:text-white/60 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </a>
                )}
                <Link
                  href={`/websites/${siteId}/editor/${page.id}`}
                  className="p-1.5 rounded-lg hover:bg-cyan-500/10 text-white/25 hover:text-cyan-400 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Link>
                {page.slug !== "home" && (
                  <button
                    onClick={() => void deletePage(page.id, page.title)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Danger zone */}
        <div className="mt-12 pt-8 border-t border-white/[0.06]">
          <h3 className="text-xs font-black uppercase tracking-widest text-white/20 mb-4">Danger Zone</h3>
          <button
            onClick={async () => {
              if (!confirm(`Permanently delete "${site.name}"? All pages, products, and data will be lost.`)) return;
              await fetch(`/api/sites/${siteId}`, { method: "DELETE" });
              router.push("/websites");
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 text-red-400/60 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/[0.05] text-sm transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Site
          </button>
        </div>
      </main>
    </div>
  );
}
