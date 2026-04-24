"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
} from "lucide-react";
import type { BusinessType } from "@/lib/archetypes";

const BUSINESS_TYPES: Array<{ key: BusinessType; emoji: string; label: string; description: string }> = [
  { key: "local_service", emoji: "🔧", label: "Local Service Business", description: "HVAC, plumbing, roofing, cleaning, and trades" },
  { key: "consultant_coach", emoji: "🎯", label: "Consultant / Coach", description: "Business coaching, consulting, and high-ticket services" },
  { key: "affiliate", emoji: "💰", label: "Affiliate Marketer", description: "Promoting offers and earning commissions" },
  { key: "dropship", emoji: "📦", label: "Dropshipper", description: "Selling products without holding inventory" },
  { key: "agency", emoji: "🏢", label: "Marketing Agency", description: "Running a digital marketing or advertising agency" },
  { key: "ecommerce", emoji: "🛍️", label: "E-commerce Brand", description: "Selling your own branded products online" },
  { key: "saas", emoji: "💻", label: "SaaS Product", description: "Software with recurring subscriptions" },
  { key: "content_creator", emoji: "🎥", label: "Content Creator", description: "YouTube, podcast, newsletter, or personal brand" },
  { key: "financial", emoji: "📊", label: "Financial / Insurance", description: "Financial advisory, insurance, tax, or credit" },
  { key: "real_estate", emoji: "🏠", label: "Real Estate", description: "Agent, investor, wholesaler, or property manager" },
];

const NICHE_SUGGESTIONS: Record<BusinessType, string[]> = {
  local_service: ["HVAC", "Plumbing", "Roofing", "Electrical", "Cleaning", "Pest Control"],
  consultant_coach: ["Business Coach", "Life Coach", "Marketing Consultant", "Sales Coach"],
  affiliate: ["Weight Loss", "Make Money Online", "Crypto", "Dog Training"],
  dropship: ["Home Gadgets", "Pet Products", "Beauty", "Fitness"],
  agency: ["Local Service Marketing", "E-commerce Ads", "SEO", "Social Media"],
  ecommerce: ["Beauty", "Supplements", "Apparel", "Home Goods"],
  saas: ["CRM", "Marketing Automation", "Analytics", "Productivity"],
  content_creator: ["Business", "Fitness", "Travel", "Personal Development"],
  financial: ["Tax Prep", "Insurance", "Credit Repair", "Mortgage"],
  real_estate: ["Buyer Agent", "Seller Listings", "Wholesaling", "Property Management"],
};

const NICHE_PLACEHOLDERS: Record<BusinessType, string> = {
  local_service: "e.g. HVAC, Plumbing, Roofing...",
  consultant_coach: "e.g. Business coach, Life coach, Sales consultant...",
  affiliate: "e.g. Weight loss, Make money online, Survival...",
  dropship: "e.g. Home gadgets, Pet products, Fitness...",
  agency: "e.g. Local service marketing, E-commerce ads, SEO...",
  ecommerce: "e.g. Beauty, Apparel, Supplements...",
  saas: "e.g. CRM, Analytics, Automation...",
  content_creator: "e.g. Finance, Fitness, Business...",
  financial: "e.g. Tax prep, Insurance, Mortgage...",
  real_estate: "e.g. Listings, Buyers, Wholesaling...",
};

const OFFER_PLACEHOLDERS: Record<BusinessType, string> = {
  local_service: "Emergency HVAC repair, roof replacement, weekly cleaning...",
  consultant_coach: "Business coaching, sales consulting, leadership program...",
  affiliate: "Affiliate recommendations, reviews, comparison funnels...",
  dropship: "Portable blender, pet grooming kit, car gadget...",
  agency: "Meta ads management, SEO retainer, full-service marketing...",
  ecommerce: "Skincare set, protein powder, custom apparel...",
  saas: "CRM subscription, analytics platform, automation suite...",
  content_creator: "Newsletter, course, membership, sponsorship package...",
  financial: "Tax filing, mortgage advisory, credit repair plan...",
  real_estate: "Buyer representation, listing package, investor sourcing...",
};

const GOALS = [
  { value: "more_leads", emoji: "📞", title: "Get More Leads/Clients", description: "Fill the pipeline with more qualified opportunities" },
  { value: "more_sales", emoji: "💳", title: "Increase Sales & Revenue", description: "Turn more demand into actual revenue" },
  { value: "automate", emoji: "🤖", title: "Automate My Business", description: "Reduce manual follow-up and repetitive work" },
  { value: "launch", emoji: "🏗️", title: "Launch Something New", description: "Stand up a new offer, funnel, or business system" },
  { value: "build_brand", emoji: "📣", title: "Build My Brand", description: "Create more authority and long-term trust" },
  { value: "scale", emoji: "⚡", title: "Scale What's Working", description: "Double down on the channels already showing promise" },
];

const STAGES = [
  { value: "starting", emoji: "🌱", label: "Just Starting", description: "New to this, building from scratch" },
  { value: "early", emoji: "📈", label: "Early & Growing", description: "Have some clients or sales, want to scale" },
  { value: "scaling", emoji: "🚀", label: "Scaling Up", description: "Established, optimizing and expanding" },
];

const REVENUE_OPTIONS = ["$0-1k", "$1k-5k", "$5k-20k", "$20k-100k", "$100k+"];
const LOCAL_TYPES = new Set<BusinessType>(["local_service", "real_estate", "financial", "agency"]);
const STATUS_MESSAGES = [
  "Analyzing your business type...",
  "Researching top 1% operators in your niche...",
  "Mapping your growth system...",
  "Generating your recommendations...",
  "Your system is ready ✓",
];

type FormState = {
  businessType: BusinessType | null;
  businessName: string;
  niche: string;
  location: string;
  website: string;
  mainOffer: string;
  offerPrice: string;
  targetAudience: string;
  audiencePain: string;
  audienceGoal: string;
  stage: string;
  mainGoal: string;
  monthlyRevenue: string;
};

function StepButton({
  children,
  onClick,
  disabled,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition ${
        variant === "primary"
          ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_26px_rgba(6,182,212,0.22)] disabled:opacity-40"
          : "border border-white/[0.08] bg-white/[0.04] text-white/70 disabled:opacity-30"
      }`}
    >
      {children}
    </button>
  );
}

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [submitting, setSubmitting] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [form, setForm] = useState<FormState>({
    businessType: null,
    businessName: "",
    niche: "",
    location: "",
    website: "",
    mainOffer: "",
    offerPrice: "",
    targetAudience: "",
    audiencePain: "",
    audienceGoal: "",
    stage: "starting",
    mainGoal: "more_leads",
    monthlyRevenue: "$0-1k",
  });

  useEffect(() => {
    if (step !== 5 || completed) return;
    const timer = window.setInterval(() => {
      setStatusIndex((prev) => (prev < STATUS_MESSAGES.length - 1 ? prev + 1 : prev));
    }, 900);
    return () => window.clearInterval(timer);
  }, [step, completed]);

  const progress = `${((step - 1) / 4) * 100}%`;
  const selectedType = form.businessType ?? "local_service";

  const suggestions = useMemo(() => NICHE_SUGGESTIONS[selectedType], [selectedType]);

  function nextStep() {
    if (step === 1 && !form.businessType) {
      setError("Choose the kind of business you're building first.");
      return;
    }
    if (step === 2 && !form.niche.trim()) {
      setError("Add your niche so we can tailor the system to the right market.");
      return;
    }
    setError(null);
    setStep((prev) => {
      if (prev === 1) return 2;
      if (prev === 2) return 3;
      if (prev === 3) return 4;
      return 5;
    });
  }

  function previousStep() {
    setError(null);
    setStep((prev) => {
      if (prev === 5) return 4;
      if (prev === 4) return 3;
      if (prev === 3) return 2;
      return 1;
    });
  }

  async function handleSubmit() {
    if (!form.businessType) return;
    setStep(5);
    setSubmitting(true);
    setError(null);
    setStatusIndex(0);

    try {
      const profilePayload = {
        businessType: form.businessType,
        businessName: form.businessName,
        niche: form.niche,
        location: form.location,
        website: form.website,
        mainOffer: form.mainOffer,
        offerPrice: form.offerPrice,
        targetAudience: form.targetAudience,
        audiencePains: [form.audiencePain].filter(Boolean),
        audienceDesires: [form.audienceGoal].filter(Boolean),
        stage: form.stage,
        mainGoal: form.mainGoal,
        monthlyRevenue: form.monthlyRevenue,
        setupCompleted: true,
        setupStep: 5,
      };

      await fetch("/api/business-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profilePayload),
      });

      await fetch("/api/business-profile/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType: form.businessType,
          niche: form.niche,
          goal: form.mainGoal,
          stage: form.stage,
        }),
      });

      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingCompleted: true, businessType: form.businessType, businessUrl: form.website || undefined }),
      });

      setStatusIndex(STATUS_MESSAGES.length - 1);
      setCompleted(true);
      window.setTimeout(() => router.push("/my-system"), 800);
    } catch {
      setError("We hit a snag generating your system, but your setup inputs can still be saved on the next try.");
      setSubmitting(false);
      setCompleted(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020509] text-white">
      <AppNav />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="rounded-[32px] border border-white/[0.08] bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.08),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.02))] p-6 sm:p-8">
          <div className="mb-8">
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 transition-all duration-500" style={{ width: progress }} />
            </div>
            <div className="flex items-center justify-between gap-3 text-[11px] font-black uppercase tracking-[0.24em] text-white/32">
              <span>Business OS Setup</span>
              <span>Step {step} of 5</span>
            </div>
          </div>

          <div className="mx-auto max-w-4xl">
            {step === 1 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200/70">Step 1</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-white">What kind of business are you building?</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">
                  Pick the business model that best matches what you are building. This tells Himalaya which acquisition model, funnel logic, and operating system to preload.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {BUSINESS_TYPES.map((type) => {
                    const selected = form.businessType === type.key;
                    return (
                      <button
                        key={type.key}
                        onClick={() => setForm((prev) => ({ ...prev, businessType: type.key }))}
                        className={`rounded-[28px] border p-5 text-left transition ${
                          selected
                            ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_26px_rgba(6,182,212,0.12)]"
                            : "border-white/[0.08] bg-white/[0.03] hover:border-cyan-500/50 hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="text-4xl">{type.emoji}</div>
                        <h2 className="mt-4 text-lg font-black text-white">{type.label}</h2>
                        <p className="mt-2 text-sm leading-6 text-white/58">{type.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 2 && form.businessType && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200/70">Step 2</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-white">Tell us about your business</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">
                  We are capturing the core offer and market context so your website, campaigns, workflows, and AI recommendations can all start from the same business truth.
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Business Name</span>
                    <input
                      value={form.businessName}
                      onChange={(event) => setForm((prev) => ({ ...prev, businessName: event.target.value }))}
                      placeholder="ACME HVAC Services"
                      className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none transition focus:border-cyan-500/40"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Your Niche</span>
                    <input
                      value={form.niche}
                      onChange={(event) => setForm((prev) => ({ ...prev, niche: event.target.value }))}
                      placeholder={NICHE_PLACEHOLDERS[form.businessType]}
                      className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none transition focus:border-cyan-500/40"
                    />
                  </label>

                  {LOCAL_TYPES.has(form.businessType) && (
                    <label className="grid gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Location</span>
                      <input
                        value={form.location}
                        onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                        placeholder="City, State"
                        className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none transition focus:border-cyan-500/40"
                      />
                    </label>
                  )}

                  <label className="grid gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Website</span>
                    <input
                      value={form.website}
                      onChange={(event) => setForm((prev) => ({ ...prev, website: event.target.value }))}
                      placeholder="https://yourbusiness.com"
                      className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none transition focus:border-cyan-500/40"
                    />
                  </label>

                  <label className="grid gap-2 md:col-span-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">What You Sell</span>
                    <input
                      value={form.mainOffer}
                      onChange={(event) => setForm((prev) => ({ ...prev, mainOffer: event.target.value }))}
                      placeholder={OFFER_PLACEHOLDERS[form.businessType]}
                      className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none transition focus:border-cyan-500/40"
                    />
                  </label>

                  <label className="grid gap-2 md:col-span-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Price Point</span>
                    <input
                      value={form.offerPrice}
                      onChange={(event) => setForm((prev) => ({ ...prev, offerPrice: event.target.value }))}
                      placeholder="$97/month, $2,997 one-time, $150/service call..."
                      className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none transition focus:border-cyan-500/40"
                    />
                  </label>
                </div>

                <div className="mt-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Suggested Niches</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setForm((prev) => ({ ...prev, niche: suggestion }))}
                        className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/70 transition hover:border-cyan-500/40 hover:text-white"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200/70">Step 3</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-white">Who are you selling to?</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">
                  This is where we make the business system intelligent. The sharper the audience and pain, the better the site copy, ads, and follow-up become.
                </p>

                <div className="mt-8 grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Target Audience</span>
                    <input
                      value={form.targetAudience}
                      onChange={(event) => setForm((prev) => ({ ...prev, targetAudience: event.target.value }))}
                      placeholder="e.g. Homeowners aged 35-60 in suburban areas"
                      className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none transition focus:border-cyan-500/40"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Their #1 Pain</span>
                    <input
                      value={form.audiencePain}
                      onChange={(event) => setForm((prev) => ({ ...prev, audiencePain: event.target.value }))}
                      placeholder="Their biggest problem is..."
                      className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none transition focus:border-cyan-500/40"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Their Goal</span>
                    <input
                      value={form.audienceGoal}
                      onChange={(event) => setForm((prev) => ({ ...prev, audienceGoal: event.target.value }))}
                      placeholder="What they really want is..."
                      className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none transition focus:border-cyan-500/40"
                    />
                  </label>
                </div>

                <div className="mt-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Business Stage</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    {STAGES.map((stage) => {
                      const selected = form.stage === stage.value;
                      return (
                        <button
                          key={stage.value}
                          onClick={() => setForm((prev) => ({ ...prev, stage: stage.value }))}
                          className={`rounded-[26px] border p-5 text-left transition ${
                            selected
                              ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_26px_rgba(6,182,212,0.12)]"
                              : "border-white/[0.08] bg-white/[0.03] hover:border-cyan-500/40"
                          }`}
                        >
                          <div className="text-3xl">{stage.emoji}</div>
                          <h3 className="mt-3 text-lg font-black text-white">{stage.label}</h3>
                          <p className="mt-2 text-sm leading-6 text-white/58">{stage.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200/70">Step 4</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-white">What&apos;s your #1 goal right now?</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">
                  This lets us prioritize the operating system in the right order. Two businesses in the same niche can need very different workflows depending on whether they want leads, automation, or scale.
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  {GOALS.map((goal) => {
                    const selected = form.mainGoal === goal.value;
                    return (
                      <button
                        key={goal.value}
                        onClick={() => setForm((prev) => ({ ...prev, mainGoal: goal.value }))}
                        className={`rounded-[26px] border p-5 text-left transition ${
                          selected
                            ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_26px_rgba(6,182,212,0.12)]"
                            : "border-white/[0.08] bg-white/[0.03] hover:border-cyan-500/40"
                        }`}
                      >
                        <div className="text-3xl">{goal.emoji}</div>
                        <h3 className="mt-3 text-lg font-black text-white">{goal.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-white/58">{goal.description}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Monthly Revenue</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {REVENUE_OPTIONS.map((revenue) => {
                      const selected = form.monthlyRevenue === revenue;
                      return (
                        <button
                          key={revenue}
                          onClick={() => setForm((prev) => ({ ...prev, monthlyRevenue: revenue }))}
                          className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition ${
                            selected
                              ? "border-cyan-500 bg-cyan-500/10 text-cyan-200"
                              : "border-white/[0.08] bg-white/[0.04] text-white/60 hover:border-cyan-500/40"
                          }`}
                        >
                          {revenue}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <div className={`flex h-20 w-20 items-center justify-center rounded-full border ${completed ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-cyan-500/20 bg-cyan-500/10 text-cyan-300"}`}>
                  {completed ? <Check className="h-10 w-10" /> : <Loader2 className="h-10 w-10 animate-spin" />}
                </div>
                <p className="mt-6 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200/70">Step 5</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
                  {completed ? "Your system is ready!" : "Building your operating system..."}
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-white/62">
                  {STATUS_MESSAGES[statusIndex]}
                </p>

                {!completed && (
                  <div className="mt-8 h-2 w-full max-w-xl overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 transition-all duration-700"
                      style={{ width: `${((statusIndex + 1) / STATUS_MESSAGES.length) * 100}%` }}
                    />
                  </div>
                )}

                {completed && (
                  <button
                    onClick={() => router.push("/my-system")}
                    className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-black text-white shadow-[0_0_26px_rgba(6,182,212,0.24)]"
                  >
                    View Your Business OS
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {error && step !== 5 && <p className="mt-6 text-sm text-red-300">{error}</p>}
          </div>

          {step !== 5 && (
            <div className="mt-10 flex items-center justify-between gap-3">
              <StepButton onClick={previousStep} disabled={step === 1} variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                Back
              </StepButton>
              {step < 4 && (
                <StepButton onClick={nextStep}>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </StepButton>
              )}
              {step === 4 && (
                <StepButton onClick={handleSubmit} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Build My Business OS
                  <ArrowRight className="h-4 w-4" />
                </StepButton>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
