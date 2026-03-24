"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";
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
} from "lucide-react";
import { toast } from "sonner";

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

export default function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: siteId } = use(params);
  const router = useRouter();

  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [addingPage, setAddingPage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [creatingPage, setCreatingPage] = useState(false);

  useEffect(() => {
    fetch(`/api/sites/${siteId}`)
      .then(r => r.json() as Promise<{ ok: boolean; site?: Site }>)
      .then(d => { if (d.ok && d.site) setSite(d.site); })
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
        body: JSON.stringify({ title: newPageTitle.trim() }),
      });
      const data = await res.json() as { ok: boolean; page?: SitePage };
      if (data.ok && data.page) {
        setSite(prev => prev ? { ...prev, pages: [...prev.pages, data.page!] } : prev);
        setAddingPage(false);
        setNewPageTitle("");
        router.push(`/websites/${siteId}/editor/${data.page.id}`);
      }
    } catch {
      toast.error("Failed to create page");
    } finally {
      setCreatingPage(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050a14] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-[#050a14] flex items-center justify-center">
        <p className="text-white/30">Site not found.</p>
      </div>
    );
  }

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

        {/* Pages section */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-base font-black text-white">Pages</h2>
          <button
            onClick={() => setAddingPage(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] text-white/50 hover:text-white text-xs font-bold transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Page
          </button>
        </div>

        {/* New page input */}
        {addingPage && (
          <div className="mb-4 flex items-center gap-2">
            <input
              type="text"
              value={newPageTitle}
              onChange={e => setNewPageTitle(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") void createPage(); if (e.key === "Escape") setAddingPage(false); }}
              placeholder="Page title..."
              autoFocus
              className="flex-1 bg-white/[0.05] border border-cyan-500/40 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none"
            />
            <button onClick={() => void createPage()} disabled={creatingPage || !newPageTitle.trim()} className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 transition disabled:opacity-40">
              {creatingPage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
            <button onClick={() => { setAddingPage(false); setNewPageTitle(""); }} className="p-2.5 rounded-xl hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition">
              <X className="w-4 h-4" />
            </button>
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
