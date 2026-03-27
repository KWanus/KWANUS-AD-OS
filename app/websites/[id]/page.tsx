"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import DatabaseFallbackNotice from "@/components/DatabaseFallbackNotice";
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
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAiPageTemplateLabel,
  getMissingSiteStructurePages,
  type AiPageTemplate,
} from "@/lib/site-builder/copilotActions";

interface SitePage {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  views: number;
  order: number;
  updatedAt: string;
}

interface Site {
  id: string;
  name: string;
  slug: string;
  description?: string;
  faviconEmoji?: string;
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
    setPublishing(true);
    try {
      await fetch(`/api/sites/${siteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !site.published }),
      });
      setSite(prev => prev ? { ...prev, published: !prev.published } : prev);
      toast.success(site.published ? "Site unpublished" : "Site is now live!");
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

  function copyLink() {
    if (!site) return;
    void navigator.clipboard.writeText(`${window.location.origin}/s/${site.slug}`);
    toast.success("Link copied!");
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
      <div className="min-h-screen bg-[#050a14] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-[#050a14] flex items-center justify-center px-4">
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
  const missingStructurePages = getMissingSiteStructurePages(site.pages.map((page) => page.slug));
  const visiblePages = site.pages.filter((page) => page.published);
  const hiddenPages = site.pages.filter((page) => !page.published);
  const hasLandingPage = site.pages.some((page) => page.slug === "landing" || /landing/i.test(page.title));
  const siteHealthScore = Math.max(
    40,
    100
      - (site.published ? 0 : 18)
      - missingStructurePages.length * 8
      - (!hasLandingPage ? 8 : 0)
      - (visiblePages.length < 2 ? 10 : 0)
      - (hiddenPages.length > 2 ? 6 : 0)
  );
  const siteHealthFindings = [
    ...(!site.published ? ["The site is still in draft, so visitors cannot see the live version yet."] : []),
    ...(missingStructurePages.length
      ? [`Core structure pages are still missing: ${missingStructurePages.map((template) => getAiPageTemplateLabel(template)).join(", ")}.`]
      : []),
    ...(!hasLandingPage ? ["There is no dedicated landing-style page for focused traffic or campaign use yet."] : []),
    ...(visiblePages.length < 2 ? ["The public site still feels thin because too few pages are visible."] : []),
    ...(hiddenPages.length > 0 ? [`${hiddenPages.length} page${hiddenPages.length > 1 ? "s are" : " is"} hidden from the live nav and sitemap.`] : []),
  ];
  const siteHealthWins = [
    ...(site.published ? ["The site is publish-ready and already live."] : []),
    ...(missingStructurePages.length === 0 ? ["The core site structure is in place."] : []),
    ...(hasLandingPage ? ["There is already a landing-page style asset available."] : []),
    ...(visiblePages.length >= 3 ? ["The live site has enough visible pages to feel more complete."] : []),
  ];

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
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
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${site.published ? "bg-green-500/15 text-green-400 border border-green-500/20" : "bg-white/5 text-white/30 border border-white/10"}`}>
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
                href={`/s/${site.slug}`}
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
            <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-5 py-4">
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1">{label}</p>
              <p className={`text-2xl font-black ${color}`}>{value}</p>
            </div>
          ))}
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

        <div className="mb-8 rounded-[28px] border border-white/[0.07] bg-white/[0.03] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300/80">Site Health</p>
              <div className="mt-3 flex items-center gap-3">
                <p className="text-3xl font-black text-white">{siteHealthScore}</p>
                <p className="text-sm font-bold text-white/45">/ 100</p>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                This score reflects live readiness, structure completeness, and whether the site has enough visible pages and focused page types to convert well.
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
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-amber-500/15 bg-amber-500/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200/80">What Needs Work</p>
              <div className="mt-3 space-y-2">
                {siteHealthFindings.length ? siteHealthFindings.map((finding) => (
                  <p key={finding} className="text-sm leading-6 text-amber-50/90">{finding}</p>
                )) : (
                  <p className="text-sm leading-6 text-amber-50/90">No major structure issues detected right now.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200/80">What Is Strong</p>
              <div className="mt-3 space-y-2">
                {siteHealthWins.length ? siteHealthWins.map((win) => (
                  <p key={win} className="text-sm leading-6 text-emerald-50/90">{win}</p>
                )) : (
                  <p className="text-sm leading-6 text-emerald-50/90">As you add and publish more structure, the strengths will show up here.</p>
                )}
              </div>
            </div>
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
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black text-white/30 bg-white/5 border border-white/10 uppercase">Hidden</span>
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
