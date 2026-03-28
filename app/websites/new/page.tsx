"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Rocket, Sparkles, Wand2, Layout } from "lucide-react";

type Campaign = { id: string; name: string };
type SiteTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
};

export default function NewSitePage() {
  const router = useRouter();
  const [mode, setMode] = useState<"manual" | "generate" | "template">("generate");
  const [templates, setTemplates] = useState<SiteTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateSlug, setTemplateSlug] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const [businessName, setBusinessName] = useState("");
  const [niche, setNiche] = useState("");
  const [location, setLocation] = useState("");
  const [tone, setTone] = useState("Clear, trustworthy, confident");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/campaigns")
      .then((response) => response.json())
      .then((data) => {
        if (data.ok) setCampaigns(data.campaigns);
      })
      .catch(() => {});
    fetch("/api/templates?type=site")
      .then((response) => response.json())
      .then((data) => {
        if (data.ok) setTemplates(data.siteTemplates ?? []);
      })
      .catch(() => {});
  }, []);

  async function createFromTemplate(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedTemplate || !templateName || !templateSlug) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: templateName, slug: templateSlug, template: "golden", campaignId, templateId: selectedTemplate }),
      });

      const data = await response.json() as { ok: boolean; error?: string; site?: { id: string } };
      if (!data.ok || !data.site) {
        throw new Error(data.error || "Failed to create site");
      }

      router.push(`/websites/${data.site.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create site");
      setLoading(false);
    }
  }

  async function createManualSite(event: React.FormEvent) {
    event.preventDefault();
    if (!name || !slug) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, template: "golden", campaignId }),
      });

      const data = await response.json() as { ok: boolean; error?: string; site?: { id: string } };
      if (!data.ok || !data.site) {
        throw new Error(data.error || "Failed to create site");
      }

      router.push(`/websites/${data.site.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create site");
      setLoading(false);
    }
  }

  async function generateSite(event: React.FormEvent) {
    event.preventDefault();
    if (!businessName.trim() || !niche.trim() || !location.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/sites/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          niche: niche.trim(),
          location: location.trim(),
          tone: tone.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await response.json() as { ok: boolean; error?: string; site?: { id: string } };
      if (!response.ok || !data.ok || !data.site) {
        throw new Error(data.error || "Failed to generate site");
      }

      router.push(`/websites/${data.site.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate site");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#020509] flex flex-col items-center justify-center font-sans p-6 text-white">
      <div className="w-full max-w-2xl">
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-sm font-semibold text-white/40 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="rounded-[32px] border border-white/[0.08] bg-[#050a14] p-8 shadow-2xl">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-cyan-300">
                {mode === "generate" ? <Wand2 className="h-6 w-6" /> : <Rocket className="h-6 w-6" />}
              </div>
              <h1 className="text-3xl font-black tracking-tight">
                {mode === "generate" ? "Generate a Conversion-First Site" : "Create a Manual Site"}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-7 text-white/45">
                {mode === "generate"
                  ? "Start from business name, niche, and city. The generator now builds a strategy-first draft instead of a blank shell."
                  : "Create a shell manually and fill it yourself or inject campaign assets into the funnel baseline."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setMode("generate")}
                className={`rounded-2xl border px-4 py-2.5 text-sm font-bold transition ${
                  mode === "generate"
                    ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-200"
                    : "border-white/[0.08] bg-white/[0.03] text-white/55"
                }`}
              >
                AI Generate
              </button>
              <button
                onClick={() => setMode("template")}
                className={`rounded-2xl border px-4 py-2.5 text-sm font-bold transition ${
                  mode === "template"
                    ? "border-purple-500/20 bg-purple-500/10 text-purple-200"
                    : "border-white/[0.08] bg-white/[0.03] text-white/55"
                }`}
              >
                Templates
              </button>
              <button
                onClick={() => setMode("manual")}
                className={`rounded-2xl border px-4 py-2.5 text-sm font-bold transition ${
                  mode === "manual"
                    ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-200"
                    : "border-white/[0.08] bg-white/[0.03] text-white/55"
                }`}
              >
                Manual
              </button>
            </div>
          </div>

          {mode === "generate" ? (
            <form onSubmit={generateSite} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-white/50">Business Name</label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(event) => setBusinessName(event.target.value)}
                    className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/20 focus:border-cyan-500/50 focus:outline-none"
                    placeholder="Bright Smile Dental"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-white/50">Niche</label>
                  <input
                    type="text"
                    required
                    value={niche}
                    onChange={(event) => setNiche(event.target.value)}
                    className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/20 focus:border-cyan-500/50 focus:outline-none"
                    placeholder="dentist, roofing, med spa, law firm"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-white/50">City / Market</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/20 focus:border-cyan-500/50 focus:outline-none"
                    placeholder="Austin, TX"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-white/50">Tone</label>
                  <input
                    type="text"
                    value={tone}
                    onChange={(event) => setTone(event.target.value)}
                    className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/20 focus:border-cyan-500/50 focus:outline-none"
                    placeholder="Clear, premium, urgent, trustworthy"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-white/50">Notes</label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/20 focus:border-cyan-500/50 focus:outline-none"
                  placeholder="Optional direction: focus on booking consultations, make it feel high trust, use local relevance, emphasize emergency response..."
                />
              </div>

              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                  <p className="text-sm leading-6 text-cyan-50/90">
                    This route uses the new conversion engine: input normalization, conversion analysis, business profile, template selection, section-by-section copy, scoring, and deterministic rendering.
                  </p>
                </div>
              </div>

              {error && <p className="text-sm font-semibold text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={loading || !businessName.trim() || !niche.trim() || !location.trim()}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 py-4 font-black text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
                Generate Site
              </button>
            </form>
          ) : mode === "template" ? (
            <form onSubmit={createFromTemplate} className="space-y-5">
              <div>
                <label className="mb-3 block text-xs font-black uppercase tracking-widest text-white/50">Choose a Template</label>
                <div className="grid grid-cols-1 gap-3">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTemplate(t.id);
                        if (!templateName) setTemplateName(t.name);
                        if (!templateSlug) setTemplateSlug(t.id);
                      }}
                      className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition ${
                        selectedTemplate === t.id
                          ? "border-purple-500/40 bg-purple-500/10"
                          : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center text-lg shrink-0">
                        {t.thumbnail}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${selectedTemplate === t.id ? "text-purple-200" : "text-white/70"}`}>{t.name}</p>
                        <p className="text-[11px] text-white/35 mt-0.5 leading-relaxed">{t.description}</p>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/20 mt-1 inline-block">{t.category}</span>
                      </div>
                    </button>
                  ))}
                  {templates.length === 0 && (
                    <p className="text-sm text-white/30 text-center py-6">Loading templates...</p>
                  )}
                </div>
              </div>

              {selectedTemplate && (
                <>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-widest text-white/50">Site Name</label>
                    <input
                      type="text"
                      required
                      value={templateName}
                      onChange={(e) => {
                        setTemplateName(e.target.value);
                        setTemplateSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                      }}
                      className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/20 focus:border-purple-500/50 focus:outline-none"
                      placeholder="My Landing Page"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-widest text-white/50">Web Address</label>
                    <div className="flex overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.03] transition focus-within:border-purple-500/50">
                      <input
                        type="text"
                        required
                        value={templateSlug}
                        onChange={(e) => setTemplateSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                        className="flex-1 bg-transparent px-4 py-3 font-mono text-sm text-white placeholder:text-white/20 focus:outline-none"
                        placeholder="my-landing-page"
                      />
                      <span className="border-l border-white/[0.05] bg-white/[0.02] px-4 py-3 font-mono text-sm text-white/40">
                        .kwanus.co
                      </span>
                    </div>
                  </div>
                </>
              )}

              {error && <p className="text-sm font-semibold text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={loading || !selectedTemplate || !templateName || !templateSlug}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-600 py-4 font-black text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Layout className="h-5 w-5" />}
                Create from Template
              </button>
            </form>
          ) : (
            <form onSubmit={createManualSite} className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-white/50">Site Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (!slug) setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                  }}
                  className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/20 focus:border-cyan-500/50 focus:outline-none"
                  placeholder="My Awesome Store"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-white/50">Web Address</label>
                <div className="flex overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.03] transition focus-within:border-cyan-500/50">
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    className="flex-1 bg-transparent px-4 py-3 font-mono text-sm text-white placeholder:text-white/20 focus:outline-none"
                    placeholder="my-store"
                  />
                  <span className="border-l border-white/[0.05] bg-white/[0.02] px-4 py-3 font-mono text-sm text-white/40">
                    .kwanus.co
                  </span>
                </div>
              </div>

              {campaigns.length > 0 && (
                <div className="border-t border-white/5 pt-4">
                  <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-400">
                    <Sparkles className="h-4 w-4" /> AI Auto-Generate Funnel
                  </label>
                  <select
                    value={campaignId}
                    onChange={(event) => setCampaignId(event.target.value)}
                    className="w-full rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-cyan-100 outline-none transition focus:border-cyan-400"
                  >
                    <option value="">Start with blank template</option>
                    {campaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        Auto-build using: {campaign.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-[10px] leading-relaxed text-white/40">
                    Selecting a campaign injects AI-generated headlines, benefits, and sales copy into the existing funnel baseline.
                  </p>
                </div>
              )}

              {error && <p className="text-sm font-semibold text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={loading || !name || !slug}
                className="mt-4 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 py-4 font-black text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Site"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
