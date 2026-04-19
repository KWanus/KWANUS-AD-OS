"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  ArrowLeft, Download, Copy, Check, Loader2, Save,
  Image as ImageIcon, Video, ChevronRight, Palette,
} from "lucide-react";
import { AD_TEMPLATES, type AdTemplate } from "@/lib/ads/adTemplates";

export default function CreativeStudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const [selectedTemplate, setSelectedTemplate] = useState<AdTemplate | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"templates" | "editor">("templates");
  const [filterCategory, setFilterCategory] = useState("all");

  if (!isLoaded || !isSignedIn) return null;

  function selectTemplate(template: AdTemplate) {
    setSelectedTemplate(template);
    const defaults: Record<string, string> = {};
    template.fields.forEach(f => { defaults[f.name] = f.default; });
    setValues(defaults);
    setTab("editor");
  }

  function updateField(name: string, value: string) {
    setValues(prev => ({ ...prev, [name]: value }));
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
      const preview = renderPreview();
      await fetch("/api/himalaya/creatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: id,
          templateId: selectedTemplate.id,
          templateName: selectedTemplate.name,
          values,
          preview,
          status: "draft",
        }),
      });
      setSavedId(selectedTemplate.id);
      setTimeout(() => setSavedId(null), 3000);
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
          <p className="text-sm text-t-text-muted">Create ad images and videos for your business</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab("templates")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${tab === "templates" ? "bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20" : "text-t-text-faint hover:text-t-text-muted"}`}>
            <Palette className="w-3.5 h-3.5" /> Templates
          </button>
          <button onClick={() => { if (selectedTemplate) setTab("editor"); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${tab === "editor" ? "bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20" : "text-t-text-faint hover:text-t-text-muted"} ${!selectedTemplate ? "opacity-30" : ""}`}>
            <ImageIcon className="w-3.5 h-3.5" /> Editor
          </button>
        </div>

        {/* ═══ TEMPLATES TAB ═══ */}
        {tab === "templates" && (
          <div>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {categories.map(cat => (
                <button key={cat} onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition ${filterCategory === cat ? "bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20" : "text-t-text-faint hover:text-t-text-muted border border-t-border"}`}>
                  {cat === "all" ? "All" : cat.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                </button>
              ))}
            </div>

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
              <div className="rounded-xl border border-t-border bg-t-bg-card overflow-hidden">
                {preview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="Ad preview" className="w-full" />
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={downloadImage}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-t-border text-xs font-bold text-t-text-muted hover:text-t-text transition">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button onClick={() => void saveCreative()} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-xs font-bold text-[#0c0a08] disabled:opacity-30 transition">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : savedId ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  {savedId ? "Saved!" : "Save to Project"}
                </button>
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black">{selectedTemplate.name}</h3>
                <button onClick={() => setTab("templates")} className="text-xs text-t-text-faint hover:text-t-text-muted transition">
                  ← Pick different template
                </button>
              </div>

              {selectedTemplate.fields.map(field => (
                <div key={field.name}>
                  <label className="text-[10px] font-bold text-t-text-faint uppercase tracking-wider">{field.name.replace(/([A-Z])/g, " $1").trim()}</label>
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

              <div className="pt-3 border-t border-t-border">
                <p className="text-[10px] text-t-text-faint">
                  Platform: {selectedTemplate.platform} · Aspect: {selectedTemplate.aspectRatio} · Category: {selectedTemplate.category.replace("_", " ")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
