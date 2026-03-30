"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, Rocket, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";

type Campaign = { id: string; name: string };
type BusinessProfile = {
  businessName?: string | null;
  niche?: string | null;
  location?: string | null;
  mainGoal?: string | null;
  businessType?: string | null;
};

const NICHE_PRESETS = [
  {
    id: "local-service",
    label: "Local Service",
    niche: "HVAC",
    tone: "Trustworthy, local, urgent",
    notes: "Lead-gen focused, phone CTA above the fold, local proof, reviews, service-area trust.",
  },
  {
    id: "med-spa",
    label: "Med Spa",
    niche: "Med Spa",
    tone: "Premium, calm, high-trust",
    notes: "Highlight transformation, trust, consultation booking, testimonials, and premium visual feel.",
  },
  {
    id: "legal",
    label: "Law Firm",
    niche: "Personal Injury Law",
    tone: "Authoritative, clear, reassuring",
    notes: "Strong credibility, case trust, consultation CTA, objection handling, and local relevance.",
  },
  {
    id: "coach",
    label: "Consultant / Coach",
    niche: "Business Coach",
    tone: "Confident, authority-driven, outcome-focused",
    notes: "Position the offer clearly, add transformation proof, and drive call bookings.",
  },
];

export default function NewSitePage() {
  const router = useRouter();
  const [mode, setMode] = useState<"manual" | "generate">("generate");
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);

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
  const [manualTemplate, setManualTemplate] = useState<"golden" | "landing" | "store" | "blank">("golden");
  const [executionTier, setExecutionTier] = useState<"core" | "elite">("elite");

  useEffect(() => {
    Promise.all([
      fetch("/api/campaigns").then((response) => response.json()).catch(() => null),
      fetch("/api/business-profile").then((response) => response.json()).catch(() => null),
    ]).then(([campaignData, profileData]) => {
      if (campaignData?.ok) setCampaigns(campaignData.campaigns);
      if (profileData?.ok && profileData.profile) {
        const profile = profileData.profile as BusinessProfile;
        setBusinessProfile(profile);

        if (profile.businessName) {
          setBusinessName((prev) => prev || profile.businessName || "");
          setName((prev) => prev || profile.businessName || "");
          setSlug((prev) => prev || profile.businessName?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "");
        }
        if (profile.niche) setNiche((prev) => prev || profile.niche || "");
        if (profile.location) setLocation((prev) => prev || profile.location || "");
        if (profile.mainGoal && !notes) {
          setNotes(`Primary goal: ${profile.mainGoal.replace(/_/g, " ")}`);
        }
      }
    });
  }, [notes]);

  function applyPreset(preset: typeof NICHE_PRESETS[number]) {
    setNiche(preset.niche);
    setTone(preset.tone);
    setNotes(preset.notes);
    setMode("generate");
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
        body: JSON.stringify({
          name,
          slug,
          template: manualTemplate,
          campaignId,
          executionTier,
          businessType: businessProfile?.businessType,
          niche: niche.trim() || businessProfile?.niche,
          location: location.trim() || businessProfile?.location,
        }),
      });

      const data = await response.json() as { ok: boolean; error?: string; site?: { id: string } };
      if (!data.ok || !data.site) {
        throw new Error(data.error || "Failed to create site");
      }

      toast.success("Site created!");
      router.push(`/websites/${data.site.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create site");
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
          executionTier,
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
                className={`rounded-2xl border px-4 py-2.5 text-sm font-bold transition ${mode === "generate"
                    ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-200"
                    : "border-white/[0.08] bg-white/[0.03] text-white/55"
                  }`}
              >
                AI Generate
              </button>
              <button
                onClick={() => setMode("manual")}
                className={`rounded-2xl border px-4 py-2.5 text-sm font-bold transition ${mode === "manual"
                    ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-200"
                    : "border-white/[0.08] bg-white/[0.03] text-white/55"
                  }`}
              >
                Manual
              </button>
            </div>
          </div>

          <div className="mb-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {NICHE_PRESETS.map((preset) => {
              const active = niche.trim().toLowerCase() === preset.niche.toLowerCase() && tone === preset.tone;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`rounded-2xl border p-4 text-left transition ${active
                      ? "border-cyan-500/25 bg-cyan-500/10 text-cyan-100"
                      : "border-white/[0.08] bg-white/[0.03] text-white/60 hover:border-cyan-500/20 hover:bg-cyan-500/[0.05]"
                    }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black">{preset.label}</p>
                    {active ? <Check className="h-4 w-4 text-cyan-200" /> : null}
                  </div>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-inherit/70">{preset.niche}</p>
                  <p className="mt-2 text-xs leading-5 text-inherit/75">{preset.notes}</p>
                </button>
              );
            })}
          </div>

          {businessProfile && (
            <div className="mb-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                <div>
                  <p className="text-sm font-black text-cyan-50">Business OS data detected</p>
                  <p className="mt-1 text-sm leading-6 text-cyan-50/85">
                    I prefilled this form from your saved business profile so new sites start closer to your niche, location, and goal.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">Execution Level</p>
                <h2 className="mt-2 text-lg font-black text-white">Choose the quality lane</h2>
                <p className="mt-1 max-w-xl text-sm leading-6 text-white/50">
                  Core gives a strong launch-ready baseline. Elite adds the heavier conversion stack so the page starts closer to a top-performer in its niche.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {([
                ["core", "Core", "Strong, clean, conversion-ready execution."],
                ["elite", "Elite", "Sharper, more specific, more top-operator output."],
              ] as const).map(([value, label, description]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setExecutionTier(value)}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${executionTier === value
                      ? "border-cyan-500/25 bg-cyan-500/10 text-cyan-100"
                      : "border-white/[0.08] bg-white/[0.03] text-white/60 hover:border-cyan-500/20 hover:bg-cyan-500/[0.05]"
                    }`}
                >
                  <p className="text-sm font-black">{label}</p>
                  <p className="mt-2 text-xs leading-5 text-inherit/80">{description}</p>
                </button>
              ))}
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
                    This route uses the new conversion engine: input normalization, conversion analysis, business profile, template selection, section-by-section copy, scoring, and deterministic rendering. Elite mode pushes a heavier trust, objection-handling, and conversion stack.
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

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-white/50">Starting Template</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {([
                    ["golden", "Golden Funnel", "Full conversion-first baseline with proof, pricing, CTA, and launch-ready structure."],
                    ["landing", "Simple Landing", "Lean hero + features + CTA for a faster single-page draft."],
                    ["store", "Storefront", "Product-oriented start with a shop section."],
                    ["blank", "Blank Canvas", "Start empty and build from scratch."],
                  ] as const).map(([value, label, description]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setManualTemplate(value)}
                      className={`rounded-2xl border px-4 py-3 text-left transition ${manualTemplate === value
                          ? "border-cyan-500/25 bg-cyan-500/10 text-cyan-100"
                          : "border-white/[0.08] bg-white/[0.03] text-white/55"
                        }`}
                    >
                      <p className="text-sm font-black">{label}</p>
                      <p className="mt-1 text-xs leading-5 text-inherit/75">{description}</p>
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-[11px] leading-5 text-white/40">
                  Manual sites now start from a baseline that adapts to your niche, business type, and selected execution level instead of always using the same generic blocks.
                </p>
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
