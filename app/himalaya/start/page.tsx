"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Loader2, Briefcase, ShoppingBag,
  Globe, TrendingUp, Users, Laptop, Palette, DollarSign,
} from "lucide-react";

// ── Business model options ──────────────────────────────────────────────────

const MODELS = [
  { key: "consultant_coach", label: "Consultant / Coach", desc: "Sell expertise, coaching, or programs", icon: Briefcase, color: "border-cyan-500/30 hover:border-cyan-500/60" },
  { key: "ecommerce", label: "E-Commerce / Brand", desc: "Sell physical or digital products", icon: ShoppingBag, color: "border-purple-500/30 hover:border-purple-500/60" },
  { key: "local_service", label: "Local Service Business", desc: "Roofer, plumber, dentist, HVAC, etc.", icon: Globe, color: "border-amber-500/30 hover:border-amber-500/60" },
  { key: "affiliate", label: "Affiliate / Dropship", desc: "Promote products and earn commissions", icon: TrendingUp, color: "border-green-500/30 hover:border-green-500/60" },
  { key: "agency", label: "Agency / Freelancer", desc: "Provide marketing or services to clients", icon: Users, color: "border-pink-500/30 hover:border-pink-500/60" },
  { key: "saas", label: "SaaS / Software", desc: "Build and sell software subscriptions", icon: Laptop, color: "border-blue-500/30 hover:border-blue-500/60" },
  { key: "content_creator", label: "Content Creator", desc: "YouTube, podcast, newsletter, personal brand", icon: Palette, color: "border-orange-500/30 hover:border-orange-500/60" },
  { key: "financial", label: "Financial Services", desc: "Insurance, credit, tax, real estate", icon: DollarSign, color: "border-emerald-500/30 hover:border-emerald-500/60" },
] as const;

const GOALS = [
  { key: "first_client", label: "Get my first client or sale" },
  { key: "first_1k", label: "Hit $1K/month" },
  { key: "replace_income", label: "Replace my income" },
  { key: "scale_10k", label: "Scale to $10K/month" },
] as const;

type Step = 1 | 2 | 3 | 4;

export default function HimalayaStartPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [businessType, setBusinessType] = useState("");
  const [niche, setNiche] = useState("");
  const [goal, setGoal] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("");

  async function handleGenerate() {
    setLoading(true);

    try {
      // Step 1: Diagnose
      setPhase("Understanding your business...");
      const diagRes = await fetch("/api/himalaya/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "scratch", businessType, niche, goal, description }),
      });
      const diagData = await diagRes.json();
      if (!diagData.ok) throw new Error(diagData.error);

      // Step 2: Strategize
      setPhase("Building your strategy...");
      const stratRes = await fetch("/api/himalaya/strategize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "scratch", diagnosis: diagData.diagnosis }),
      });
      const stratData = await stratRes.json();
      if (!stratData.ok) throw new Error(stratData.error);

      // Step 3: Generate
      setPhase("Creating your foundation...");
      const genRes = await fetch("/api/himalaya/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "scratch",
          diagnosis: diagData.diagnosis,
          strategy: stratData.strategy,
        }),
      });
      const genData = await genRes.json();
      if (!genData.ok) throw new Error(genData.error);

      // Store results and navigate
      sessionStorage.setItem("himalaya_results", JSON.stringify({
        mode: "scratch",
        diagnosis: diagData.diagnosis,
        strategy: stratData.strategy,
        generated: genData.generated,
        created: genData.created,
      }));
      router.push("/himalaya/results");
    } catch (err) {
      console.error(err);
      setPhase("");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050a14] flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Back button */}
        {!loading && (
          <button
            onClick={() => (step === 1 ? router.push("/himalaya") : setStep((s) => (s - 1) as Step))}
            className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}

        {/* ── Loading state ──────────────────────────────────────────────── */}
        {loading && (
          <div className="text-center space-y-6 py-20">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
            <div>
              <p className="text-white text-lg font-medium">{phase}</p>
              <p className="text-white/40 text-sm mt-2">This takes about 30 seconds.</p>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-3">
              {["Diagnosis", "Strategy", "Generation"].map((label) => {
                const isActive =
                  (label === "Diagnosis" && phase.includes("Understanding")) ||
                  (label === "Strategy" && phase.includes("strategy")) ||
                  (label === "Generation" && phase.includes("Creating"));
                const isDone =
                  (label === "Diagnosis" && !phase.includes("Understanding")) ||
                  (label === "Strategy" && phase.includes("Creating"));
                return (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isDone ? "bg-cyan-400" : isActive ? "bg-cyan-400 animate-pulse" : "bg-white/20"}`} />
                    <span className={`text-xs ${isDone || isActive ? "text-white/70" : "text-white/30"}`}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 1: Business model ─────────────────────────────────────── */}
        {!loading && step === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-white">What type of business?</h1>
              <p className="text-white/40 text-sm">Pick the closest match. You can refine later.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MODELS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => { setBusinessType(m.key); setStep(2); }}
                  className={`text-left rounded-xl border bg-white/[0.02] p-4 transition-all ${m.color} ${businessType === m.key ? "ring-1 ring-cyan-500/50" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <m.icon className="w-5 h-5 text-white/60 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-white text-sm font-medium">{m.label}</p>
                      <p className="text-white/40 text-xs mt-0.5">{m.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Niche ──────────────────────────────────────────────── */}
        {!loading && step === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-white">What's your niche?</h1>
              <p className="text-white/40 text-sm">Be specific. The more detail, the better your output.</p>
            </div>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g. Weight loss for women over 40"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50"
            />
            <button
              onClick={() => setStep(3)}
              disabled={!niche.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-medium text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-cyan-400 transition-colors"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Step 3: Goal ───────────────────────────────────────────────── */}
        {!loading && step === 3 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-white">What's your first goal?</h1>
              <p className="text-white/40 text-sm">This shapes what Himalaya builds for you.</p>
            </div>
            <div className="grid gap-3">
              {GOALS.map((g) => (
                <button
                  key={g.key}
                  onClick={() => { setGoal(g.key); setStep(4); }}
                  className={`text-left rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white hover:border-cyan-500/40 transition-all ${goal === g.key ? "ring-1 ring-cyan-500/50 border-cyan-500/40" : ""}`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 4: Optional description + generate ────────────────────── */}
        {!loading && step === 4 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-white">Anything else?</h1>
              <p className="text-white/40 text-sm">Optional — describe your dream business to get better results.</p>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. I want to help small restaurant owners get more customers through social media marketing..."
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 resize-none"
            />

            {/* Summary */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2">
              <p className="text-white/50 text-xs uppercase tracking-wider">Building for</p>
              <p className="text-white text-sm">
                {MODELS.find((m) => m.key === businessType)?.label} · {niche} · {GOALS.find((g) => g.key === goal)?.label}
              </p>
            </div>

            <button
              onClick={handleGenerate}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-medium text-white hover:bg-cyan-400 transition-colors"
            >
              Build My Foundation <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
