"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  ArrowLeft, Download, Copy, Check, Loader2, Save,
  Image as ImageIcon, Palette, Sparkles, Smartphone,
  Monitor, ChevronDown, RefreshCw, Grid, Star,
} from "lucide-react";
import { AD_TEMPLATES, type AdTemplate } from "@/lib/ads/adTemplates";

type Script = { id: number; hook: string; body: string; cta: string; style: string };
type SavedCreative = { id: string; templateName: string; values: Record<string, string>; savedAt: string };

export default function CreativeStudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const [selectedTemplate, setSelectedTemplate] = useState<AdTemplate | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [scripts, setScripts] = useState<Script[]>([]);
  const [savedCreatives, setSavedCreatives] = useState<SavedCreative[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"templates" | "editor" | "saved">("templates");
  const [filterCategory, setFilterCategory] = useState("all");
  const [previewDevice, setPreviewDevice] = useState<"phone" | "desktop">("phone");
  const [mockupPlatform, setMockupPlatform] = useState<"raw" | "instagram" | "facebook" | "tiktok">("raw");
  const [brandColor, setBrandColor] = useState("#f5a623");
  const [generating, setGenerating] = useState(false);

  // Load scripts + saved creatives on mount
  useEffect(() => {
    if (!isSignedIn) return;
    fetch(`/api/himalaya/projects/${id}/scripts`)
      .then(r => r.json())
      .then(d => { if (d.ok && d.scripts) setScripts(d.scripts); })
      .catch(() => {});

    fetch("/api/himalaya/creatives")
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.creatives) {
          setSavedCreatives(d.creatives.filter((c: SavedCreative & { projectId?: string }) => c.projectId === id));
        }
      })
      .catch(() => {});
  }, [isSignedIn, id]);

  if (!isLoaded || !isSignedIn) return null;

  function selectTemplate(template: AdTemplate, scriptIndex?: number) {
    setSelectedTemplate(template);
    const defaults: Record<string, string> = {};
    template.fields.forEach(f => { defaults[f.name] = f.default; });

    // Auto-populate from project scripts if available
    const script = scripts[scriptIndex ?? 0];
    if (script) {
      if (defaults.headline !== undefined) defaults.headline = script.hook;
      if (defaults.subtext !== undefined) defaults.subtext = script.body.slice(0, 40);
      if (defaults.quote !== undefined) defaults.quote = script.hook + " " + script.body;
      if (defaults.beforeText !== undefined) defaults.beforeText = "Before: struggling, stuck, frustrated";
      if (defaults.afterText !== undefined) defaults.afterText = script.body.slice(0, 50);
    }

    // Apply brand color
    if (defaults.brandColor !== undefined) defaults.brandColor = brandColor;

    setValues(defaults);
    setTab("editor");
  }

  function updateField(name: string, value: string) {
    setValues(prev => ({ ...prev, [name]: value }));
    if (name === "brandColor") setBrandColor(value);
  }

  async function generateVariation(fieldName: string) {
    setGenerating(true);
    try {
      const res = await fetch("/api/himalaya/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "market_trends",
          params: { niche: values.headline ?? "business" },
        }),
      });
      const data = await res.json();
      if (data.ok && data.result?.trending) {
        // Use trending data to generate a variation
        const trend = data.result.trending[0] ?? "new approach";
        updateField(fieldName, `${trend} — the secret nobody shares`);
      }
    } catch { /* ignore */ }
    setGenerating(false);
  }

  function renderPreview(): string | null {
    if (!selectedTemplate) return null;
    try {
      const svg = selectedTemplate.render(values);
      return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
    } catch { return null; }
  }

  async function saveCreative() {
    if (!selectedTemplate) return;
    setSaving(true);
    try {
      await fetch("/api/himalaya/creatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: id,
          templateId: selectedTemplate.id,
          templateName: selectedTemplate.name,
          values,
          status: "draft",
        }),
      });
      setSavedId(selectedTemplate.id);
      setTimeout(() => setSavedId(null), 3000);
      // Refresh saved list
      const res = await fetch("/api/himalaya/creatives").then(r => r.json());
      if (res.ok) setSavedCreatives(res.creatives.filter((c: SavedCreative & { projectId?: string }) => c.projectId === id));
    } catch { /* ignore */ }
    setSaving(false);
  }

  function downloadImage() {
    const preview = renderPreview();
    if (!preview) return;
    const link = document.createElement("a");
    link.href = preview;
    link.download = `${selectedTemplate?.name ?? "ad"}-${Date.now()}.svg`;
    link.click();
  }

  async function downloadPng() {
    if (!selectedTemplate) return;
    let svgStr: string;
    try {
      svgStr = selectedTemplate.render(values);
    } catch { return; }
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width || 1080;
      canvas.height = img.height || 1080;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(pngBlob => {
        if (!pngBlob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(pngBlob);
        a.download = `${selectedTemplate?.name ?? "ad"}-${Date.now()}.png`;
        a.click();
      }, "image/png");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  function copy(text: string, copyId: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(copyId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const preview = renderPreview();
  const categories = ["all", ...new Set(AD_TEMPLATES.map(t => t.category))];
  const filtered = filterCategory === "all" ? AD_TEMPLATES : AD_TEMPLATES.filter(t => t.category === filterCategory);

  return (
    <main className="min-h-screen bg-t-bg text-t-text">
      <AppNav />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">

        <div className="pt-6 pb-3">
          <Link href={`/project/${id}`} className="inline-flex items-center gap-1.5 text-xs text-t-text-faint hover:text-t-text-muted transition mb-3">
            <ArrowLeft className="w-3 h-3" /> Back to project
          </Link>
          <h1 className="text-xl font-black">Creative Studio</h1>
          <p className="text-sm text-t-text-muted">Create ad images from templates. Your scripts are pre-loaded.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab("templates")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${tab === "templates" ? "bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20" : "text-t-text-faint hover:text-t-text-muted"}`}>
            <Grid className="w-3.5 h-3.5" /> Templates
          </button>
          <button onClick={() => { if (selectedTemplate) setTab("editor"); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${tab === "editor" ? "bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20" : "text-t-text-faint hover:text-t-text-muted"} ${!selectedTemplate ? "opacity-30" : ""}`}>
            <Palette className="w-3.5 h-3.5" /> Editor
          </button>
          <button onClick={() => setTab("saved")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${tab === "saved" ? "bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20" : "text-t-text-faint hover:text-t-text-muted"}`}>
            <Star className="w-3.5 h-3.5" /> Saved ({savedCreatives.length})
          </button>
        </div>

        {/* ═══ TEMPLATES TAB ═══ */}
        {tab === "templates" && (
          <div>
            {/* Script-powered quick start */}
            {scripts.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] font-black text-t-text-faint tracking-wider mb-2">QUICK START — USE YOUR SCRIPTS</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {scripts.slice(0, 6).map((script, i) => (
                    <button key={script.id} onClick={() => selectTemplate(AD_TEMPLATES[i % AD_TEMPLATES.length], i)}
                      className="rounded-xl border border-t-border bg-t-bg-raised p-3 text-left hover:border-[#f5a623]/20 hover:bg-[#f5a623]/[0.03] transition">
                      <p className="text-[9px] font-bold text-[#f5a623] mb-1">{script.style}</p>
                      <p className="text-xs font-bold line-clamp-2">&ldquo;{script.hook}&rdquo;</p>
                      <p className="text-[10px] text-t-text-faint mt-1">Click to create ad →</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Category filter */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {categories.map(cat => (
                <button key={cat} onClick={() => setFilterCategory(cat)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${filterCategory === cat ? "bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20" : "text-t-text-faint border border-t-border hover:text-t-text-muted"}`}>
                  {cat === "all" ? "All" : cat.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                </button>
              ))}
            </div>

            {/* Template grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.map(template => {
                const defaults: Record<string, string> = {};
                template.fields.forEach(f => { defaults[f.name] = f.default; });
                let previewSrc: string | null = null;
                try {
                  const svg = template.render(defaults);
                  previewSrc = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
                } catch { /* ignore */ }

                return (
                  <button key={template.id} onClick={() => selectTemplate(template)}
                    className="rounded-xl border border-t-border bg-t-bg-raised overflow-hidden hover:border-[#f5a623]/20 transition group text-left">
                    {previewSrc && (
                      <div className="aspect-square bg-t-bg-card overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={previewSrc} alt={template.name} className="w-full h-full object-contain" />
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-xs font-bold group-hover:text-[#f5a623] transition">{template.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-t-text-faint">{template.aspectRatio}</span>
                        <span className="text-[9px] text-t-text-faint">{template.platform}</span>
                        <span className="text-[9px] text-emerald-400/60">~2-4% CTR</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ EDITOR TAB ═══ */}
        {tab === "editor" && selectedTemplate && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Preview */}
            <div>
              {/* Device toggle */}
              <div className="flex gap-2 mb-2">
                <button onClick={() => setPreviewDevice("phone")}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold ${previewDevice === "phone" ? "text-[#f5a623]" : "text-t-text-faint"}`}>
                  <Smartphone className="w-3 h-3" /> Phone
                </button>
                <button onClick={() => setPreviewDevice("desktop")}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold ${previewDevice === "desktop" ? "text-[#f5a623]" : "text-t-text-faint"}`}>
                  <Monitor className="w-3 h-3" /> Desktop
                </button>
              </div>

              {/* Platform mockup selector */}
              <div className="flex gap-1 mb-2">
                {(["raw", "instagram", "facebook", "tiktok"] as const).map((p) => (
                  <button key={p} onClick={() => setMockupPlatform(p)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                      mockupPlatform === p
                        ? "bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20"
                        : "text-t-text-faint border border-t-border hover:text-t-text-muted"
                    }`}>
                    {p === "raw" ? "Raw" : p === "instagram" ? "Instagram" : p === "facebook" ? "Facebook" : "TikTok"}
                  </button>
                ))}
              </div>

              {/* Raw preview */}
              {mockupPlatform === "raw" && (
                <div className={`rounded-xl border border-t-border bg-t-bg-card overflow-hidden ${previewDevice === "phone" ? "max-w-xs mx-auto" : ""}`}>
                  {preview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Ad preview" className="w-full" />
                  )}
                </div>
              )}

              {/* Instagram mockup */}
              {mockupPlatform === "instagram" && (
                <div className="max-w-xs mx-auto rounded-2xl border-2 border-neutral-700 bg-black overflow-hidden">
                  {/* IG header */}
                  <div className="flex items-center gap-2.5 px-3 py-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e07850] via-pink-500 to-yellow-500 p-[2px]">
                      <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                        <span className="text-[8px] text-white font-bold">AD</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-white truncate">your_brand</p>
                      <p className="text-[9px] text-neutral-400">Sponsored</p>
                    </div>
                    <span className="text-white/50 text-sm">...</span>
                  </div>
                  {/* Ad image */}
                  {preview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Ad preview" className="w-full" />
                  )}
                  {/* IG actions */}
                  <div className="px-3 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" /></svg>
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                    </div>
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>
                  </div>
                  <div className="px-3 pb-3">
                    <p className="text-[10px] text-neutral-400">Liked by <span className="font-bold text-white">2,847 others</span></p>
                  </div>
                </div>
              )}

              {/* Facebook mockup */}
              {mockupPlatform === "facebook" && (
                <div className="max-w-xs mx-auto rounded-xl border border-neutral-700 bg-[#242526] overflow-hidden">
                  {/* FB header */}
                  <div className="flex items-center gap-2.5 px-3 py-2.5">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">AD</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-white">Your Brand</p>
                      <p className="text-[10px] text-neutral-400">Sponsored · <span className="inline-block w-2.5 h-2.5 align-middle">🌐</span></p>
                    </div>
                    <span className="text-neutral-400 text-lg">...</span>
                  </div>
                  {/* Post text */}
                  <div className="px-3 pb-2">
                    <p className="text-[11px] text-neutral-300 leading-relaxed">Check out our latest offer. Click to learn more.</p>
                  </div>
                  {/* Ad image */}
                  {preview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Ad preview" className="w-full" />
                  )}
                  {/* FB actions */}
                  <div className="px-3 py-2 border-t border-neutral-600">
                    <div className="flex items-center justify-between">
                      <button className="flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-bold text-neutral-400 hover:bg-neutral-700 rounded transition">
                        <span>👍</span> Like
                      </button>
                      <button className="flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-bold text-neutral-400 hover:bg-neutral-700 rounded transition">
                        <span>💬</span> Comment
                      </button>
                      <button className="flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-bold text-neutral-400 hover:bg-neutral-700 rounded transition">
                        <span>↗️</span> Share
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TikTok mockup */}
              {mockupPlatform === "tiktok" && (
                <div className="max-w-xs mx-auto rounded-2xl border-2 border-neutral-700 bg-black overflow-hidden relative" style={{ aspectRatio: "9/16" }}>
                  {/* Ad fills the screen */}
                  {preview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Ad preview" className="w-full h-full object-cover" />
                  )}
                  {/* TikTok overlay — right side icons */}
                  <div className="absolute right-2 bottom-24 flex flex-col items-center gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                      </div>
                      <span className="text-[9px] text-white font-bold mt-0.5">24.5K</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" /></svg>
                      </div>
                      <span className="text-[9px] text-white font-bold mt-0.5">1,203</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                      </div>
                      <span className="text-[9px] text-white font-bold mt-0.5">Share</span>
                    </div>
                  </div>
                  {/* TikTok overlay — bottom info */}
                  <div className="absolute left-3 bottom-4 right-14">
                    <p className="text-[12px] font-bold text-white mb-0.5">@yourbrand</p>
                    <p className="text-[10px] text-white/80 leading-snug line-clamp-2">Your ad caption goes here. Check out our latest offer! #ad #sponsored</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="text-[9px] text-white/60">🎵</span>
                      <p className="text-[9px] text-white/60">Promotional Audio - Your Brand</p>
                    </div>
                  </div>
                  {/* Sponsored label */}
                  <div className="absolute top-3 left-3">
                    <span className="text-[9px] font-bold text-white/80 bg-white/10 backdrop-blur px-2 py-0.5 rounded">Sponsored</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <button onClick={downloadImage}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-t-border text-xs font-bold text-t-text-muted hover:text-t-text transition">
                  <Download className="w-3.5 h-3.5" /> SVG
                </button>
                <button onClick={() => void downloadPng()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-t-border text-xs font-bold text-t-text-muted hover:text-t-text transition">
                  <ImageIcon className="w-3.5 h-3.5" /> PNG
                </button>
                <button onClick={() => void saveCreative()} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-xs font-bold text-[#0c0a08] disabled:opacity-30 transition">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : savedId ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  {savedId ? "Saved!" : "Save Draft"}
                </button>
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black">{selectedTemplate.name}</h3>
                <button onClick={() => setTab("templates")} className="text-xs text-t-text-faint hover:text-t-text-muted transition">
                  ← Change template
                </button>
              </div>

              {selectedTemplate.fields.map(field => (
                <div key={field.name}>
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-t-text-faint uppercase tracking-wider">
                      {field.name.replace(/([A-Z])/g, " $1").trim()}
                    </label>
                    {field.type === "text" && (
                      <button onClick={() => void generateVariation(field.name)} disabled={generating}
                        className="flex items-center gap-1 text-[9px] font-bold text-[#f5a623]/60 hover:text-[#f5a623] transition">
                        {generating ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />} Suggest
                      </button>
                    )}
                  </div>
                  {field.type === "color" ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={values[field.name] ?? field.default}
                        onChange={e => updateField(field.name, e.target.value)}
                        className="w-10 h-10 rounded-lg border border-t-border cursor-pointer" />
                      <input type="text" value={values[field.name] ?? field.default}
                        onChange={e => updateField(field.name, e.target.value)}
                        className="flex-1 rounded-xl border border-t-border bg-t-bg-raised px-3 py-2 text-sm font-mono text-t-text-muted outline-none" />
                    </div>
                  ) : (
                    <input type="text" value={values[field.name] ?? field.default}
                      onChange={e => updateField(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      maxLength={field.maxLength}
                      className="w-full mt-1 rounded-xl border border-t-border bg-t-bg-raised px-3 py-2.5 text-sm placeholder-t-text-faint outline-none focus:border-[#f5a623]/30 transition" />
                  )}
                </div>
              ))}

              {/* Quick script fill */}
              {scripts.length > 0 && (
                <div className="pt-2">
                  <p className="text-[10px] font-bold text-t-text-faint mb-1.5">Fill from your scripts:</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {scripts.slice(0, 5).map((s, i) => (
                      <button key={s.id} onClick={() => {
                        const headline = selectedTemplate?.fields.find(f => f.name === "headline" || f.name === "quote");
                        if (headline) updateField(headline.name, s.hook);
                      }}
                        className="px-2 py-1 rounded-lg border border-t-border text-[9px] font-bold text-t-text-faint hover:text-[#f5a623] hover:border-[#f5a623]/20 transition">
                        Script {i + 1}: {s.style}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-t-border text-[10px] text-t-text-faint">
                Platform: {selectedTemplate.platform} · Aspect: {selectedTemplate.aspectRatio} · Est. CTR: 2-4%
              </div>
            </div>
          </div>
        )}

        {/* ═══ SAVED TAB ═══ */}
        {tab === "saved" && (
          <div>
            {savedCreatives.length === 0 ? (
              <div className="rounded-xl border border-t-border bg-t-bg-raised p-8 text-center">
                <ImageIcon className="w-8 h-8 text-t-text-faint mx-auto mb-3" />
                <p className="text-sm font-bold text-t-text-muted">No saved creatives yet</p>
                <p className="text-xs text-t-text-faint mt-1">Create an ad from the Templates tab to see it here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {savedCreatives.map(creative => (
                  <div key={creative.id} className="rounded-xl border border-t-border bg-t-bg-raised p-3">
                    <p className="text-xs font-bold mb-1">{creative.templateName}</p>
                    <p className="text-[10px] text-t-text-faint">{new Date(creative.savedAt).toLocaleDateString()}</p>
                    <div className="flex gap-1.5 mt-2">
                      <button onClick={() => copy(JSON.stringify(creative.values), creative.id)}
                        className="text-[9px] text-t-text-faint hover:text-t-text transition flex items-center gap-0.5">
                        {copiedId === creative.id ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                        Copy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
