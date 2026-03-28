"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getUserId } from "@/lib/userId";
import { NICHES, CURATED_OFFERS, getRecommendedOffer, type CuratedOffer } from "@/src/data/curatedOffers";
import {
  PRODUCT_LIBRARY,
  getTopProductByNiche,
  getDefaultBeginnerProduct,
  getTopProductByPlatform,
  type ProductEntry,
  type Niche as DropNiche,
  type Platform as DropPlatform,
} from "@/lib/data/productLibrary";

type BusinessModel = "affiliate" | "dropship";
type Step = "intro" | "model" | 1 | 2 | 3 | "loading" | "result";
type AffPlatform = "tiktok" | "facebook" | "youtube" | "organic";
type ExecutionTier = "core" | "elite";

const BUDGET_OPTIONS = [
  { value: 10, label: "$10/day", sub: "Start small, learn fast" },
  { value: 20, label: "$20/day", sub: "Enough data to make real decisions" },
  { value: 30, label: "$30/day", sub: "Test 2–3 products at once" },
  { value: 50, label: "$50+/day", sub: "Built to scale" },
];

const AFF_PLATFORM_OPTIONS: { id: AffPlatform; label: string; sub: string }[] = [
  { id: "tiktok", label: "TikTok", sub: "18–35 audience • lowest ad costs • best for visual products" },
  { id: "facebook", label: "Facebook / Instagram", sub: "35–65 audience • best targeting • works for everything" },
  { id: "youtube", label: "YouTube", sub: "High-intent buyers • great for high-ticket offers" },
  { id: "organic", label: "No paid ads yet", sub: "Start with free content, add ads later" },
];

const DROP_PLATFORM_OPTIONS: { id: DropPlatform; label: string; sub: string }[] = [
  { id: "tiktok", label: "TikTok", sub: "18–35 audience • lowest CPM • best for visual wow-factor products" },
  { id: "facebook", label: "Facebook / Instagram", sub: "35–65 audience • strongest retargeting • best for problem-solving products" },
];

const DROP_NICHES: { id: DropNiche; label: string; icon: string; sub: string }[] = [
  { id: "home-kitchen", label: "Home & Kitchen", icon: "🏠", sub: "Organizers, storage, kitchen gadgets" },
  { id: "pet", label: "Pet Products", icon: "🐾", sub: "Dog bowls, grooming, toys" },
  { id: "health-wellness", label: "Health & Wellness", icon: "💆", sub: "Massage tools, posture, self-care" },
  { id: "beauty-grooming", label: "Beauty & Grooming", icon: "✨", sub: "Skincare tools, facial devices" },
  { id: "fitness-posture", label: "Fitness", icon: "💪", sub: "Resistance bands, posture, home gym" },
  { id: "outdoor-survival", label: "Outdoor & EDC", icon: "🔦", sub: "Camping tools, everyday carry" },
];

const LOADING_MESSAGES = [
  "Matching your answers...",
  "Checking your budget fit...",
  "Finding your best pick...",
  "Writing your first hook...",
  "Building your Day 1 plan...",
  "Almost ready...",
];

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
          description: "Strong starter kit with practical, operator-ready execution.",
        },
        {
          id: "elite" as const,
          label: "Elite",
          description: "Sharper premium launch kit with stronger positioning and follow-through.",
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

export default function StartPage() {
  const [step, setStep] = useState<Step>("intro");
  const [model, setModel] = useState<BusinessModel>("affiliate");
  const [executionTier, setExecutionTier] = useState<ExecutionTier>("elite");

  // Affiliate state
  const [affNiche, setAffNiche] = useState<string>("");
  const [affBudget, setAffBudget] = useState<number>(0);
  const [affPlatform, setAffPlatform] = useState<AffPlatform | "">("");
  const [pickedOffer, setPickedOffer] = useState<CuratedOffer | null>(null);
  const [allOffers, setAllOffers] = useState<CuratedOffer[]>([]);

  // Dropship state
  const [dropNiche, setDropNiche] = useState<DropNiche | "">("");
  const [dropBudget, setDropBudget] = useState<number>(0);
  const [dropPlatform, setDropPlatform] = useState<DropPlatform | "">("");
  const [pickedProduct, setPickedProduct] = useState<ProductEntry | null>(null);
  const [altProducts, setAltProducts] = useState<ProductEntry[]>([]);

  // Loading
  const [loadingMsg, setLoadingMsg] = useState(0);

  useEffect(() => {
    if (step !== "loading") return;
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      if (i < LOADING_MESSAGES.length) setLoadingMsg(i);
    }, 1400);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setStep("result");
    }, LOADING_MESSAGES.length * 1400 + 400);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [step]);

  function selectModel(m: BusinessModel) {
    setModel(m);
    setStep(1);
  }

  // ── Affiliate handlers ──
  function handleAffNiche(id: string) { setAffNiche(id); setStep(2); }
  function handleAffBudget(v: number) { setAffBudget(v); setStep(3); }
  function handleAffPlatform(p: AffPlatform) {
    setAffPlatform(p);
    const effectiveBudget = p === "organic" ? 999 : affBudget;
    const filtered = CURATED_OFFERS.filter(
      (o) => o.niche === affNiche && o.minBudget <= effectiveBudget
    ).sort((a, b) => (a.difficulty === "beginner" ? -1 : b.difficulty === "beginner" ? 1 : 0));
    setAllOffers(CURATED_OFFERS.filter((o) => o.niche === affNiche));
    setPickedOffer(filtered[0] ?? getRecommendedOffer(affNiche as Parameters<typeof getRecommendedOffer>[0], affBudget));
    setLoadingMsg(0);
    setStep("loading");
  }

  // ── Dropship handlers ──
  function handleDropNiche(n: DropNiche) { setDropNiche(n); setStep(2); }
  function handleDropBudget(v: number) { setDropBudget(v); setStep(3); }
  function handleDropPlatform(p: DropPlatform) {
    setDropPlatform(p);
    const nicheProduct = dropNiche ? getTopProductByNiche(dropNiche) : getDefaultBeginnerProduct();
    const platformAlts = getTopProductByPlatform(p, 4).filter((pr) => pr.id !== nicheProduct.id);
    const nicheAlts = PRODUCT_LIBRARY.filter(
      (pr) => pr.niche === dropNiche && pr.id !== nicheProduct.id
    ).slice(0, 2);
    setPickedProduct(nicheProduct);
    setAltProducts([...nicheAlts, ...platformAlts].slice(0, 3));
    setLoadingMsg(0);
    setStep("loading");
  }

  function handleReset() {
    setStep("intro");
    setAffNiche(""); setAffBudget(0); setAffPlatform(""); setPickedOffer(null); setAllOffers([]);
    setDropNiche(""); setDropBudget(0); setDropPlatform(""); setPickedProduct(null); setAltProducts([]);
    setLoadingMsg(0);
  }

  const stepNum = step === 1 ? 2 : step === 2 ? 3 : step === 3 ? 4 : null;
  const selectedAffNiche = NICHES.find((n) => n.id === affNiche);

  return (
    <main className="min-h-screen bg-[#0a0f1e] text-white flex flex-col">
      <header className="px-8 py-6 border-b border-white/10">
        <Link href="/" className="text-cyan-400 text-sm hover:underline">← Back to Dashboard</Link>
        <h1 className="text-2xl font-bold mt-2">Get Started</h1>
        <p className="text-sm text-white/40 mt-1">Answer 3 questions. Get your complete launch kit.</p>
      </header>

      <div className="flex-1 px-6 py-10 max-w-2xl mx-auto w-full">

        {/* ── Intro ── */}
        {step === "intro" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold leading-tight">
                You&apos;re 3 questions away from your first offer.
              </h2>
              <p className="text-white/50 mt-2 text-sm leading-relaxed">
                We&apos;ll match you with a proven offer, write your first hook, and hand you a Day 1 action plan — no experience needed.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-widest text-white/30 mb-4">What you&apos;ll get</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: "🎯", label: "Your matched offer", sub: "Pre-vetted, beginner-proven" },
                  { icon: "🎤", label: "Your first hook", sub: "Copy it. Record it. Post it." },
                  { icon: "📋", label: "Your Day 1 plan", sub: "5 steps. No guesswork." },
                  { icon: "💰", label: "Your earnings breakdown", sub: "What you make per sale" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/5 bg-black/20 p-3 flex items-start gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-white/80">{item.label}</p>
                      <p className="text-xs text-white/40">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-widest text-white/30 mb-4">Execution Lane</p>
              <ExecutionTierPicker value={executionTier} onChange={setExecutionTier} />
            </div>

            <button
              onClick={() => setStep("model")}
              className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 px-6 py-4 text-base font-bold text-[#0a0f1e] transition"
            >
              Build My Kit →
            </button>
            <p className="text-center text-xs text-white/20">Takes about 2 minutes. Free.</p>
          </div>
        )}

        {/* ── Model selector ── */}
        {step === "model" && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold">How do you want to make money?</h2>
              <p className="text-sm text-white/40 mt-1">Both are beginner-friendly. Pick what sounds right to you.</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => selectModel("affiliate")}
                className="w-full rounded-2xl border border-white/10 bg-white/5 hover:border-cyan-400/50 hover:bg-cyan-500/5 p-6 text-left transition group"
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl shrink-0">🔗</span>
                  <div>
                    <p className="text-base font-bold text-white group-hover:text-cyan-300 transition">
                      Promote other people&apos;s products
                    </p>
                    <p className="text-sm text-white/40 mt-1">
                      You share a link. When someone buys, you earn a commission. No inventory, no shipping, no customer service.
                    </p>
                    <p className="text-xs text-green-400 mt-2">
                      Commission: $27–$225 per sale · Best for: TikTok, Facebook
                    </p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => selectModel("dropship")}
                className="w-full rounded-2xl border border-white/10 bg-white/5 hover:border-cyan-400/50 hover:bg-cyan-500/5 p-6 text-left transition group"
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl shrink-0">📦</span>
                  <div>
                    <p className="text-base font-bold text-white group-hover:text-cyan-300 transition">
                      Sell physical products online
                    </p>
                    <p className="text-sm text-white/40 mt-1">
                      You sell products you never touch. A supplier ships directly to your customer. You keep the margin.
                    </p>
                    <p className="text-xs text-cyan-400 mt-2">
                      Margin: $15–$25 per order · Best for: TikTok, Facebook Ads
                    </p>
                  </div>
                </div>
              </button>
            </div>
            <button onClick={() => setStep("intro")} className="mt-4 text-xs text-white/30 hover:text-white/50 transition">
              ← Back
            </button>
          </div>
        )}

        {/* ── Step progress bar ── */}
        {stepNum !== null && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < stepNum ? "bg-cyan-400" : "bg-white/10"}`} />
              ))}
            </div>
            <p className="text-xs text-white/30">
              Step {stepNum} of 4 · <span className="text-cyan-400">{stepNum - 1} of 3 answered</span>
              {" · "}
              <span className="text-white/20">{model === "affiliate" ? "Affiliate track" : "Dropshipping track"}</span>
            </p>
          </div>
        )}

        {/* ── AFFILIATE: Step 1 — Niche ── */}
        {step === 1 && model === "affiliate" && (
          <div>
            <p className="text-xs text-white/30 mb-1">30 seconds</p>
            <h2 className="text-xl font-bold mb-1">What kind of product do you want to promote?</h2>
            <p className="text-sm text-white/40 mb-6">Pick what interests you. No wrong answer.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {NICHES.map((n) => (
                <button key={n.id} onClick={() => handleAffNiche(n.id)}
                  className="rounded-2xl border border-white/10 bg-white/5 hover:border-cyan-400/50 hover:bg-cyan-500/5 p-5 text-left transition group">
                  <span className="text-2xl mb-2 block">{n.icon}</span>
                  <p className="text-sm font-semibold text-white group-hover:text-cyan-300 transition">{n.label}</p>
                  <p className="text-xs text-white/40 mt-1">
                    {n.id === "health" && "Weight loss, supplements, wellness products"}
                    {n.id === "mmo" && "Teaching people to make money online"}
                    {n.id === "relationships" && "Dating, getting an ex back, relationships"}
                    {n.id === "diy" && "Woodworking, home projects, crafts"}
                    {n.id === "beauty" && "Skincare, anti-aging, looking better"}
                    {n.id === "survival" && "Emergency prep, self-reliance, off-grid"}
                  </p>
                </button>
              ))}
            </div>
            <button onClick={() => setStep("model")} className="mt-4 text-xs text-white/30 hover:text-white/50 transition">← Back</button>
          </div>
        )}

        {/* ── DROPSHIP: Step 1 — Niche ── */}
        {step === 1 && model === "dropship" && (
          <div>
            <p className="text-xs text-white/30 mb-1">30 seconds</p>
            <h2 className="text-xl font-bold mb-1">What kind of product do you want to sell?</h2>
            <p className="text-sm text-white/40 mb-6">All of these film well, ship fast, and work at beginner budgets.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DROP_NICHES.map((n) => (
                <button key={n.id} onClick={() => handleDropNiche(n.id)}
                  className="rounded-2xl border border-white/10 bg-white/5 hover:border-cyan-400/50 hover:bg-cyan-500/5 p-5 text-left transition group">
                  <span className="text-2xl mb-2 block">{n.icon}</span>
                  <p className="text-sm font-semibold text-white group-hover:text-cyan-300 transition">{n.label}</p>
                  <p className="text-xs text-white/40 mt-1">{n.sub}</p>
                </button>
              ))}
            </div>
            <button onClick={() => setStep("model")} className="mt-4 text-xs text-white/30 hover:text-white/50 transition">← Back</button>
          </div>
        )}

        {/* ── Step 2 — Budget ── */}
        {step === 2 && (
          <div>
            <p className="text-xs text-white/30 mb-1">15 seconds</p>
            <h2 className="text-xl font-bold mb-1">How much can you spend on ads per day?</h2>
            <p className="text-sm text-white/40 mb-6">Helps us match you with something that makes sense at your budget.</p>
            <div className="space-y-3">
              {BUDGET_OPTIONS.map((b) => (
                <button key={b.value}
                  onClick={() => model === "affiliate" ? handleAffBudget(b.value) : handleDropBudget(b.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 hover:border-cyan-400/50 hover:bg-cyan-500/5 p-5 text-left flex items-center justify-between transition group">
                  <div>
                    <p className="text-base font-bold text-white group-hover:text-cyan-300 transition">{b.label}</p>
                    <p className="text-xs text-white/40 mt-0.5">{b.sub}</p>
                  </div>
                  <span className="text-white/20 group-hover:text-cyan-400 transition text-lg">→</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(1)} className="mt-4 text-xs text-white/30 hover:text-white/50 transition">← Back</button>
          </div>
        )}

        {/* ── Step 3 — Platform ── */}
        {step === 3 && (
          <div>
            <p className="text-xs text-white/30 mb-1">15 seconds · last question</p>
            <h2 className="text-xl font-bold mb-1">Where do you want to run your ads?</h2>
            <p className="text-sm text-white/40 mb-6">Different platforms reach different people.</p>
            <div className="space-y-3">
              {(model === "affiliate" ? AFF_PLATFORM_OPTIONS : DROP_PLATFORM_OPTIONS).map((p) => (
                <button key={p.id}
                  onClick={() => model === "affiliate"
                    ? handleAffPlatform(p.id as AffPlatform)
                    : handleDropPlatform(p.id as DropPlatform)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 hover:border-cyan-400/50 hover:bg-cyan-500/5 p-5 text-left flex items-center justify-between transition group">
                  <div>
                    <p className="text-base font-bold text-white group-hover:text-cyan-300 transition">{p.label}</p>
                    <p className="text-xs text-white/40 mt-0.5">{p.sub}</p>
                  </div>
                  <span className="text-white/20 group-hover:text-cyan-400 transition text-lg">→</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} className="mt-4 text-xs text-white/30 hover:text-white/50 transition">← Back</button>
          </div>
        )}

        {/* ── Loading ── */}
        {step === "loading" && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="w-16 h-16 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 flex items-center justify-center mb-6">
              <span className="text-3xl animate-pulse">⚡</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Building your launch kit...</h2>
            <p className="text-sm text-cyan-400 min-h-[20px]">{LOADING_MESSAGES[loadingMsg]}</p>
            <div className="mt-8 flex gap-1.5">
              {LOADING_MESSAGES.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${i <= loadingMsg ? "bg-cyan-400" : "bg-white/10"}`} />
              ))}
            </div>
          </div>
        )}

        {/* ── Result: Affiliate ── */}
        {step === "result" && model === "affiliate" && pickedOffer && (
          <AffiliateResult
            offer={pickedOffer}
            allOffers={allOffers}
            budget={affBudget}
            platform={affPlatform as AffPlatform}
            nicheName={selectedAffNiche?.label ?? ""}
            executionTier={executionTier}
            onSwitch={setPickedOffer}
            onReset={handleReset}
          />
        )}

        {/* ── Result: Dropship ── */}
        {step === "result" && model === "dropship" && pickedProduct && (
          <DropshipResult
            product={pickedProduct}
            alts={altProducts}
            budget={dropBudget}
            platform={dropPlatform as DropPlatform}
            executionTier={executionTier}
            onSwitch={setPickedProduct}
            onReset={handleReset}
          />
        )}
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────
// Affiliate Result
// ─────────────────────────────────────────────

function AffiliateResult({
  offer, allOffers, budget, platform, nicheName, executionTier, onSwitch, onReset,
}: {
  offer: CuratedOffer;
  allOffers: CuratedOffer[];
  budget: number;
  platform: AffPlatform;
  nicheName: string;
  executionTier: ExecutionTier;
  onSwitch: (o: CuratedOffer) => void;
  onReset: () => void;
}) {
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const platformLabel = AFF_PLATFORM_OPTIONS.find((p) => p.id === platform)?.label ?? "your platform";

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": getUserId() },
        body: JSON.stringify({
          name: offer.name,
          mode: "saas",
          productName: offer.name,
          productUrl: offer.networkUrl,
          assets: {
            executionTier,
            adHooks: [{ format: "Proven Hook", hook: offer.provenHook }],
            executionChecklist: {
              day1: [
                `Sign up at ${offer.network} and get your affiliate link`,
                "Film a 30-second video using the hook above — phone camera is fine",
                `Post it on ${platform === "organic" ? "TikTok or Instagram Reels" : platformLabel} with your link in bio`,
                platform !== "organic" ? `Run it as an ad at $${budget}/day` : "Post daily for 7 days before adding paid ads",
              ],
              day2: ["Check click data — which platform is getting traction?", "Reply to every comment on your post"],
              day3: ["Cut what got zero clicks", "Double budget on what worked"],
              week2: ["Test 2 new hooks with the same offer", "Track your EPC vs target"],
              scalingTrigger: `ROAS > 1.5x for 3 consecutive days on ${platformLabel}`,
              killCriteria: `No sales after $${budget * 5} spent — kill and test a new hook`,
            },
          },
        }),
      });
      const data = await res.json() as { ok: boolean; campaign?: { id: string } };
      if (data.ok && data.campaign) setSavedId(data.campaign.id);
    } catch { /* silent */ } finally { setSaving(false); }
  }
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-6">
        <p className="text-xs uppercase tracking-widest text-cyan-400/60 mb-1">Your matched offer</p>
        <h2 className="text-2xl font-bold">{offer.name}</h2>
        <p className="text-sm text-cyan-300 mt-1">{offer.nicheLabel} · {offer.network}</p>
        <p className="text-xs text-white/30 mt-2 italic">
          Picked for {nicheName.toLowerCase()} at ${budget}/day on {platformLabel}.
        </p>
        <div className="mt-3 inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
          {executionTier} lane
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat label="You earn per sale" value={offer.avgCommission} />
          <Stat label="EPC (per click)" value={offer.avgEpc} />
          <Stat label="Min daily budget" value={`$${offer.minBudget}/day`} />
          <Stat label="Best on" value={offer.platforms.join(", ")} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-2">What you&apos;re promoting</p>
          <p className="text-sm text-white/80">{offer.whatYouSell}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Who buys it</p>
          <p className="text-sm text-white/80">{offer.whoBuysIt}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
        <p className="text-xs uppercase tracking-widest text-green-400/60 mb-2">Your first hook — copy this today</p>
        <p className="text-base text-white font-medium leading-relaxed">&ldquo;{offer.provenHook}&rdquo;</p>
        <p className="text-xs text-white/30 mt-3">Record a 30-second video saying this. That&apos;s your first ad.</p>
      </div>

      <DayOnePlan budget={budget} platform={platform} network={offer.network} platformLabel={platformLabel} isDropship={false} />

      {allOffers.length > 1 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-3">Other options in this niche</p>
          <div className="space-y-2">
            {allOffers.filter((o) => o.id !== offer.id).map((o) => (
              <button key={o.id} onClick={() => onSwitch(o)}
                className="w-full rounded-xl border border-white/5 bg-black/20 hover:border-white/20 p-3 text-left transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white/80">{o.name}</p>
                    <p className="text-xs text-white/40 mt-0.5">{o.avgCommission} · Min ${o.minBudget}/day</p>
                  </div>
                  <span className="text-white/20 text-sm">Switch →</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Save to Workspace */}
      <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-5">
        {savedId ? (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-cyan-400">Saved to your workspace!</p>
              <p className="text-xs text-white/40 mt-0.5">Track your ads, mark what&apos;s live, and add new variations.</p>
            </div>
            <Link href={`/campaigns/${savedId}`} className="shrink-0 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-[#0a0f1e] transition">
              Open Workspace →
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white/80">Save to workspace</p>
              <p className="text-xs text-white/40 mt-0.5">Track this campaign, mark ads live, and add variations.</p>
            </div>
            <button onClick={() => void handleSave()} disabled={saving} className="shrink-0 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-[#0a0f1e] transition">
              {saving ? "Saving..." : "Save to Workspace →"}
            </button>
          </div>
        )}
      </div>

      <DeepDiveCTA executionTier={executionTier} />
      <ResetButton onReset={onReset} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Dropship Result
// ─────────────────────────────────────────────

function DropshipResult({
  product, alts, budget, platform, executionTier, onSwitch, onReset,
}: {
  product: ProductEntry;
  alts: ProductEntry[];
  budget: number;
  platform: DropPlatform;
  executionTier: ExecutionTier;
  onSwitch: (p: ProductEntry) => void;
  onReset: () => void;
}) {
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const margin = product.pricing.grossMarginAtRecommended;
  const price = product.pricing.sellingPriceRecommended;
  const cogs = product.pricing.cogsRecommended;
  const platformLabel = DROP_PLATFORM_OPTIONS.find((p) => p.id === platform)?.label ?? "your platform";

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": getUserId() },
        body: JSON.stringify({
          name: product.name,
          mode: "saas",
          productName: product.name,
          assets: {
            executionTier,
            adHooks: [{ format: "Proven Hook", hook: product.marketing.primaryHook }],
            executionChecklist: {
              day1: [
                `Search "${product.searchTermCJ}" on CJdropshipping.com and order a sample`,
                "Set up a Shopify store (free trial)",
                "Film a 30-second unboxing or demo video using the hook above",
                `Post on ${platformLabel} as an ad at $${budget}/day`,
              ],
              day2: ["Check click data and add-to-cart rate", "Reply to every comment"],
              day3: ["Cut ad sets with zero add-to-carts", "Increase budget on best performer"],
              week2: ["Test 2 new creative angles", "Add post-purchase email in Klaviyo"],
              scalingTrigger: `ROAS > 2x for 3 consecutive days — increase budget 20%`,
              killCriteria: `No add-to-carts after $${budget * 3} spent — kill and test new hook`,
            },
          },
        }),
      });
      const data = await res.json() as { ok: boolean; campaign?: { id: string } };
      if (data.ok && data.campaign) setSavedId(data.campaign.id);
    } catch { /* silent */ } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-6">
        <p className="text-xs uppercase tracking-widest text-cyan-400/60 mb-1">Your matched product</p>
        <h2 className="text-2xl font-bold">{product.name}</h2>
        <p className="text-sm text-cyan-300 mt-1 capitalize">{product.niche.replace(/-/g, " ")} · Source via CJ Dropshipping</p>
        <p className="text-xs text-white/30 mt-2 italic">
          Beginner score {product.beginnerScore}/10 · Picked for {platformLabel} at ${budget}/day.
        </p>
        <div className="mt-3 inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
          {executionTier} lane
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat label="You sell for" value={`$${price}`} />
          <Stat label="Your cost" value={`~$${cogs} + shipping`} />
          <Stat label="Margin per order" value={`~$${margin}`} />
          <Stat label="Ships in" value={`${product.shipping.estimatedDaysMin}–${product.shipping.estimatedDaysMax} days`} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-widest text-white/40 mb-2">What it is</p>
        <p className="text-sm text-white/80">{product.description}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Who buys it</p>
        <p className="text-sm text-white/80">{product.marketing.audienceSummary}</p>
      </div>

      <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
        <p className="text-xs uppercase tracking-widest text-green-400/60 mb-2">Your first hook — copy this today</p>
        <p className="text-base text-white font-medium leading-relaxed">&ldquo;{product.marketing.primaryHook}&rdquo;</p>
        <p className="text-xs text-white/30 mt-3">Record a 30-second video. That&apos;s your first ad.</p>
      </div>

      {product.marketing.creativeAnglesAvailable.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-3">Other angles you can test</p>
          <div className="flex flex-wrap gap-2">
            {product.marketing.creativeAnglesAvailable.map((a, i) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-full border border-white/10 text-white/60">{a}</span>
            ))}
          </div>
        </div>
      )}

      {product.warnings.length > 0 && (
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">
          <p className="text-xs uppercase tracking-widest text-yellow-400/60 mb-2">Important notes</p>
          <ul className="space-y-1">
            {product.warnings.map((w, i) => (
              <li key={i} className="text-xs text-white/60 flex items-start gap-2">
                <span className="text-yellow-400 shrink-0">⚠</span>{w}
              </li>
            ))}
          </ul>
        </div>
      )}

      <DayOnePlan budget={budget} platform={platform} network="CJ Dropshipping" platformLabel={platformLabel} isDropship searchTerm={product.searchTermCJ} />

      {alts.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-3">Other products to consider</p>
          <div className="space-y-2">
            {alts.map((p) => (
              <button key={p.id} onClick={() => onSwitch(p)}
                className="w-full rounded-xl border border-white/5 bg-black/20 hover:border-white/20 p-3 text-left transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white/80">{p.name}</p>
                    <p className="text-xs text-white/40 mt-0.5">Score {p.beginnerScore}/10 · ${p.pricing.sellingPriceRecommended} sell price · ~${p.pricing.grossMarginAtRecommended} margin</p>
                  </div>
                  <span className="text-white/20 text-sm">Switch →</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Save to Workspace */}
      <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-5">
        {savedId ? (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-cyan-400">Saved to your workspace!</p>
              <p className="text-xs text-white/40 mt-0.5">Track your ads, mark what&apos;s live, and add new variations.</p>
            </div>
            <Link href={`/campaigns/${savedId}`} className="shrink-0 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-[#0a0f1e] transition">
              Open Workspace →
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white/80">Save to workspace</p>
              <p className="text-xs text-white/40 mt-0.5">Track this campaign, mark ads live, and add variations.</p>
            </div>
            <button onClick={() => void handleSave()} disabled={saving} className="shrink-0 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-[#0a0f1e] transition">
              {saving ? "Saving..." : "Save to Workspace →"}
            </button>
          </div>
        )}
      </div>

      <DeepDiveCTA executionTier={executionTier} />
      <ResetButton onReset={onReset} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Shared components
// ─────────────────────────────────────────────

function DayOnePlan({ budget, platform, network, platformLabel, isDropship, searchTerm }: {
  budget: number;
  platform: string;
  network: string;
  platformLabel: string;
  isDropship: boolean;
  searchTerm?: string;
}) {
  const steps = isDropship
    ? [
        { action: `Search "${searchTerm}" on CJdropshipping.com and order a sample to yourself`, time: "20 min" },
        { action: "While waiting for sample: set up a Shopify store (free trial)", time: "30 min" },
        { action: "Film a 30-second unboxing or demo video using the hook above — phone is fine", time: "20 min" },
        { action: `Post it on ${platformLabel}. Run it as an ad at $${budget}/day`, time: "10 min" },
        { action: "Track: clicks, add-to-carts, orders. After 3 days cut what doesn't work.", time: "Day 4" },
      ]
    : [
        { action: `Sign up at ${network.split("(")[0].trim()} and get your affiliate link`, time: "10 min" },
        { action: "Film a 30-second video using the hook above — phone camera is fine", time: "20 min" },
        { action: `Post it on ${platform === "organic" ? "TikTok or Instagram Reels" : platformLabel} with your link in bio`, time: "5 min" },
        { action: platform !== "organic" ? `Run it as an ad at $${budget}/day — watch clicks, add-to-carts, sales` : "Post daily for 7 days before adding paid ads", time: platform !== "organic" ? "15 min" : "ongoing" },
        { action: "After 3 days: cut what got zero clicks. Double what worked.", time: "Day 4" },
      ];

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
      <p className="text-xs uppercase tracking-widest text-cyan-400/60 mb-4">Your Day 1 plan</p>
      <ol className="space-y-4">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="text-cyan-400 font-bold shrink-0 w-5 text-center">{i + 1}.</span>
            <p className="flex-1 text-sm text-white/80">{s.action}</p>
            <span className="text-xs text-white/20 shrink-0">{s.time}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function DeepDiveCTA({ executionTier }: { executionTier: ExecutionTier }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm font-semibold text-white mb-1">Want the full package?</p>
      <p className="text-xs text-white/40 mb-4">
        Paste the product or offer page into Analyze to get full ad scripts, email sequences, landing page copy, and a 2-week checklist — built specifically for what you picked.
      </p>
      <Link href={`/analyze?execution_tier=${executionTier}`}
        className="block w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 px-6 py-3 text-sm font-semibold text-[#0a0f1e] transition text-center">
        Get My Full Launch Package →
      </Link>
    </div>
  );
}

function ResetButton({ onReset }: { onReset: () => void }) {
  return (
    <button onClick={onReset}
      className="w-full rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-6 py-3 text-sm font-semibold text-white/40 transition">
      Start Over
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-xs text-white/40 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
