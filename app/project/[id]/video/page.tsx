"use client";

import { useState, useEffect, use } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  ArrowLeft, Play, Save, Video, Loader2, Check,
  Smartphone, Monitor, RotateCcw,
} from "lucide-react";
import { VIDEO_TEMPLATES, generateVideoHtml } from "@/lib/ads/videoTemplates";

export default function VideoCreatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isSignedIn, isLoaded } = useUser();

  const [selectedTemplate, setSelectedTemplate] = useState(VIDEO_TEMPLATES[0]);
  const [hook, setHook] = useState("Stop scrolling. This changes everything.");
  const [body, setBody] = useState("Most people approach this the wrong way. Here's what actually works.");
  const [cta, setCta] = useState("Link in bio for the full breakdown.");
  const [brandColor, setBrandColor] = useState("#f5a623");
  const [businessName, setBusinessName] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [playing, setPlaying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load scripts from project
  useEffect(() => {
    if (!isSignedIn) return;
    fetch(`/api/himalaya/projects/${id}/scripts`)
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.scripts?.length > 0) {
          const s = data.scripts[0];
          setHook(s.hook);
          setBody(s.body);
          setCta(s.cta);
        }
      })
      .catch(() => {});
  }, [isSignedIn, id]);

  function generatePreview() {
    const html = generateVideoHtml({
      templateId: selectedTemplate.id,
      hook, body, cta, brandColor, businessName: businessName || undefined,
    });
    setPreviewHtml(html);
    setPlaying(true);
  }

  async function saveVideo() {
    setSaving(true);
    try {
      await fetch("/api/himalaya/creatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: id,
          templateId: selectedTemplate.id,
          templateName: `Video: ${selectedTemplate.name}`,
          values: { hook, body, cta, brandColor, businessName },
          status: "draft",
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* ignore */ }
    setSaving(false);
  }

  if (!isLoaded || !isSignedIn) return null;

  return (
    <main className="min-h-screen bg-t-bg text-t-text">
      <AppNav />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="pt-6 pb-3">
          <Link href={`/project/${id}`} className="inline-flex items-center gap-1.5 text-xs text-t-text-faint hover:text-t-text-muted transition mb-3">
            <ArrowLeft className="w-3 h-3" /> Back to project
          </Link>
          <h1 className="text-xl font-black">Video Creator</h1>
          <p className="text-sm text-t-text-muted">Turn your scripts into animated videos — ready to post on TikTok & Reels</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Preview */}
          <div>
            <div className="rounded-xl border border-t-border bg-t-bg-card overflow-hidden" style={{ aspectRatio: "9/16", maxHeight: "600px" }}>
              {playing && previewHtml ? (
                <iframe srcDoc={previewHtml} className="w-full h-full border-0" sandbox="allow-scripts" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center px-6">
                  <Smartphone className="w-10 h-10 text-t-text-faint mb-3" />
                  <p className="text-sm text-t-text-muted font-bold">Preview your video</p>
                  <p className="text-xs text-t-text-faint mt-1">Edit the script below, then click Preview</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={generatePreview}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e07850] text-xs font-bold text-[#0c0a08] hover:opacity-90 transition">
                {playing ? <RotateCcw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {playing ? "Replay" : "Preview Video"}
              </button>
              <button onClick={() => void saveVideo()} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-t-border text-xs font-bold text-t-text-muted hover:text-t-text transition disabled:opacity-30">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {saved ? "Saved!" : "Save Draft"}
              </button>
            </div>
            <p className="text-[10px] text-t-text-faint mt-2 text-center">
              To post: screen record this preview on your phone, then upload to TikTok/Reels
            </p>
          </div>

          {/* Editor */}
          <div className="space-y-4">
            {/* Template selector */}
            <div>
              <p className="text-[10px] font-bold text-t-text-faint uppercase tracking-wider mb-2">Video Style</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {VIDEO_TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => setSelectedTemplate(t)}
                    className={`shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition ${
                      selectedTemplate.id === t.id ? "bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20" : "border border-t-border text-t-text-faint hover:text-t-text-muted"
                    }`}>
                    {t.name}
                    <span className="block text-[9px] text-t-text-faint mt-0.5">{t.duration}s</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Script fields */}
            <div>
              <label className="text-[10px] font-bold text-t-text-faint uppercase tracking-wider">Hook (first 3 seconds)</label>
              <textarea value={hook} onChange={e => setHook(e.target.value)} rows={2}
                className="w-full mt-1 rounded-xl border border-t-border bg-t-bg-raised px-3 py-2.5 text-sm outline-none focus:border-[#f5a623]/30 transition resize-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-t-text-faint uppercase tracking-wider">Body (middle)</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={3}
                className="w-full mt-1 rounded-xl border border-t-border bg-t-bg-raised px-3 py-2.5 text-sm outline-none focus:border-[#f5a623]/30 transition resize-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-t-text-faint uppercase tracking-wider">CTA (call to action)</label>
              <textarea value={cta} onChange={e => setCta(e.target.value)} rows={1}
                className="w-full mt-1 rounded-xl border border-t-border bg-t-bg-raised px-3 py-2.5 text-sm outline-none focus:border-[#f5a623]/30 transition resize-none" />
            </div>

            {/* Branding */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-t-text-faint uppercase tracking-wider">Brand Color</label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-t-border cursor-pointer" />
                  <input type="text" value={brandColor} onChange={e => setBrandColor(e.target.value)}
                    className="flex-1 rounded-xl border border-t-border bg-t-bg-raised px-3 py-2 text-xs font-mono outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-t-text-faint uppercase tracking-wider">Business Name (optional)</label>
                <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)}
                  placeholder="Your brand"
                  className="w-full mt-1 rounded-xl border border-t-border bg-t-bg-raised px-3 py-2 text-sm placeholder-t-text-faint outline-none" />
              </div>
            </div>

            <div className="rounded-xl border border-t-border bg-t-bg-raised p-3">
              <p className="text-[10px] font-bold text-t-text-faint mb-1">How to post:</p>
              <ol className="text-[11px] text-t-text-faint space-y-1">
                <li>1. Click &ldquo;Preview Video&rdquo; above</li>
                <li>2. Screen record the preview on your phone</li>
                <li>3. Open TikTok or Instagram Reels</li>
                <li>4. Upload the recording + add trending audio</li>
                <li>5. Post with the caption from your Scripts tab</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
