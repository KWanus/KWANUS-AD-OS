"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import { Mountain, Loader2, ChevronRight } from "lucide-react";

// ── The only 3 options ───────────────────────────────────────────────────────

const ENTRY = [
  {
    id: "no_business",
    label: "I'm starting from zero",
    sub: "No business yet. Himalaya will pick your path and build everything.",
  },
  {
    id: "has_business",
    label: "I have a business",
    sub: "Tell us what you do. We'll build the systems to grow it.",
  },
  {
    id: "scaling",
    label: "I'm making money and want more",
    sub: "We'll find what's leaking and multiply what's working.",
  },
] as const;

type Entry = typeof ENTRY[number]["id"];

export default function SetupPage() {
  const router = useRouter();

  const [phase, setPhase] = useState<"pick" | "context" | "building">("pick");
  const [entry, setEntry] = useState<Entry | null>(null);
  const [context, setContext] = useState("");
  const [revenue, setRevenue] = useState("");
  const [buildStage, setBuildStage] = useState("");

  // ── Save profile + trigger Himalaya build ──────────────────────────────────
  async function launch() {
    setPhase("building");

    const stages = [
      "Setting up your account...",
      "Choosing your business model...",
      "Analyzing your market...",
      "Generating your website...",
      "Writing your ads...",
      "Building email sequences...",
      "Creating your funnel...",
      "Deploying everything...",
    ];
    let i = 0;
    setBuildStage(stages[0]);
    const iv = setInterval(() => { i++; if (i < stages.length) setBuildStage(stages[i]); }, 3000);

    try {
      // 1. Auto-detect business type from context
      const businessType = detectBusinessType(context, entry!);

      // 2. Save minimal profile + mark onboarding complete
      await fetch("/api/business-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType,
          niche: context.trim() || undefined,
          stage: entry === "scaling" ? "scaling" : entry === "has_business" ? "early" : "starting",
          monthlyRevenue: revenue || "$0-1k",
          mainGoal: entry === "scaling" ? "scale" : "more_leads",
          setupCompleted: true,
          setupStep: 5,
        }),
      });

      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingCompleted: true, businessType }),
      });

      // 3. Run Himalaya express — build everything
      let niche = context.trim();
      if (!niche && entry === "no_business") niche = "Start a profitable online business from scratch";
      if (!niche && entry === "has_business") niche = "Grow my existing business";
      if (!niche && entry === "scaling") niche = `Scale my business from ${revenue || "$5k"}/month`;

      if (entry === "scaling" && revenue) {
        niche = `${niche}. Currently at ${revenue}/month`;
      }

      const isUrl = /^https?:\/\/.+\..+/.test(niche);
      const res = await fetch("/api/himalaya/express", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isUrl ? { niche, url: niche } : { niche }),
      });

      const data = await res.json() as { ok: boolean; runId?: string };
      clearInterval(iv);

      if (data.ok && data.runId) {
        setBuildStage("Your business is ready.");
        setTimeout(() => router.push(`/himalaya/run/${data.runId}`), 800);
      } else {
        // Himalaya express failed — still go to homepage with commands
        setBuildStage("Setup complete. Loading your dashboard...");
        setTimeout(() => router.push("/"), 800);
      }
    } catch {
      clearInterval(iv);
      // Even if build fails, onboarding is done — go to homepage
      setBuildStage("Setup complete.");
      setTimeout(() => router.push("/"), 800);
    }
  }

  // ── Building state (full screen) ───────────────────────────────────────────
  if (phase === "building") {
    return (
      <main className="min-h-screen bg-[#020509] text-white">
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_60px_rgba(6,182,212,0.25)]">
            <Mountain className="w-10 h-10 text-white animate-pulse" />
          </div>
          <div className="text-center max-w-sm">
            <p className="text-lg font-bold text-white mb-1">{buildStage}</p>
            <p className="text-xs text-white/25">We're building your entire business. About 60 seconds.</p>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: 8 }).map((_, idx) => {
              const stages = ["Setting up your account...", "Choosing your business model...", "Analyzing your market...", "Generating your website...", "Writing your ads...", "Building email sequences...", "Creating your funnel...", "Deploying everything..."];
              const currentIdx = stages.indexOf(buildStage);
              return <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx <= currentIdx ? "bg-cyan-400" : "bg-white/[0.06]"}`} />;
            })}
          </div>
          <Loader2 className="w-4 h-4 text-white/15 animate-spin mt-2" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020509] text-white">
      <AppNav />

      <div className="max-w-lg mx-auto px-4 sm:px-6 pb-20">

        {/* ── Header ── */}
        <div className="pt-16 pb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_rgba(6,182,212,0.2)]">
            <Mountain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">
            {phase === "pick" ? "Let's get you making money." : entry === "no_business" ? "What sounds interesting to you?" : entry === "scaling" ? "Where are you at?" : "Tell us about your business."}
          </h1>
          <p className="mt-2 text-sm text-white/30">
            {phase === "pick" ? "One question. Then we build everything." : "Be specific or vague. We'll figure it out."}
          </p>
        </div>

        {/* ── Phase 1: Pick ── */}
        {phase === "pick" && (
          <div className="space-y-2">
            {ENTRY.map(opt => (
              <button
                key={opt.id}
                onClick={() => { setEntry(opt.id); setPhase("context"); }}
                className="w-full text-left rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 hover:border-cyan-500/20 hover:bg-cyan-500/[0.03] transition group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white group-hover:text-cyan-100 transition">{opt.label}</p>
                    <p className="text-xs text-white/25 mt-0.5">{opt.sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-white/30 transition" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Phase 2: Context ── */}
        {phase === "context" && entry && (
          <div className="space-y-4">
            <input
              type="text"
              value={context}
              onChange={e => setContext(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") void launch(); }}
              autoFocus
              placeholder={
                entry === "no_business" ? "e.g. affiliate marketing, coaching, dropshipping..." :
                entry === "has_business" ? "Paste your website URL or describe what you do" :
                "What's your business? e.g. coaching, agency, ecommerce"
              }
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-sm text-white placeholder-white/15 outline-none focus:border-cyan-500/25 transition"
            />

            {/* Revenue for scaling */}
            {entry === "scaling" && (
              <div>
                <p className="text-[10px] font-bold text-white/20 mb-1.5">Current monthly revenue</p>
                <div className="flex gap-2">
                  {["$1-5k", "$5-10k", "$10-25k", "$25-50k", "$50k+"].map(r => (
                    <button key={r} onClick={() => setRevenue(r)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-bold transition ${
                        revenue === r ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300" : "border-white/[0.06] text-white/25 hover:text-white/50"
                      }`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick picks for new users */}
            {entry === "no_business" && !context && (
              <div className="flex flex-wrap gap-1.5">
                {["Affiliate marketing", "Coaching business", "Dropshipping", "Digital products", "Marketing agency", "Freelancing"].map(s => (
                  <button key={s} onClick={() => setContext(s)}
                    className="px-2.5 py-1 rounded-lg border border-white/[0.04] text-[10px] text-white/20 hover:text-white/40 hover:border-white/[0.08] transition">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* GO button */}
            <button
              onClick={() => void launch()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 py-3.5 text-sm font-bold text-white hover:opacity-90 transition"
            >
              <Mountain className="w-4 h-4" />
              Build My Business
            </button>

            {/* Skip — system picks everything */}
            {entry === "no_business" && (
              <button onClick={() => void launch()}
                className="w-full text-center text-[11px] text-white/15 hover:text-white/30 transition py-1">
                Skip — let Himalaya pick everything
              </button>
            )}

            <button onClick={() => { setPhase("pick"); setEntry(null); setContext(""); setRevenue(""); }}
              className="w-full text-center text-[11px] text-white/15 hover:text-white/30 transition">
              ← Back
            </button>
          </div>
        )}

        {/* ── What happens ── */}
        {phase === "context" && (
          <div className="mt-8 rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-3">
            <p className="text-[10px] font-bold text-white/15 mb-2">WHAT HAPPENS NEXT</p>
            <div className="space-y-1.5">
              {[
                "We pick the best business model for you",
                "Generate your website, ads, and emails",
                "Build your funnel and follow-up system",
                "Deploy everything — ready to launch",
                "Give you daily commands: do this, then this",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full border border-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[8px] font-bold text-white/20">{i + 1}</span>
                  </div>
                  <p className="text-[11px] text-white/25">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ── Auto-detect business type from user input ────────────────────────────────

function detectBusinessType(input: string, entry: Entry): string {
  const lower = input.toLowerCase();

  if (entry === "scaling") return "consultant_coach"; // scaling users are usually service-based

  // URL detection
  if (/^https?:\/\//.test(lower)) return "ecommerce"; // will be refined by Himalaya

  // Keyword matching
  const patterns: [RegExp, string][] = [
    [/affiliate|commission|promote|clickbank|digistore/, "affiliate"],
    [/coach|consult|mentor|advisor|therapy|counsel/, "consultant_coach"],
    [/dropship|aliexpress|oberlo|spocket/, "dropship"],
    [/agency|client|marketing agency|ad agency|seo agency/, "agency"],
    [/ecommerce|store|shopify|product|brand/, "ecommerce"],
    [/saas|software|app|platform|subscription/, "saas"],
    [/course|ebook|digital product|membership|community/, "content_creator"],
    [/freelanc|design|develop|write|virtual assistant/, "agency"],
    [/real estate|property|agent|broker|wholesale/, "real_estate"],
    [/plumb|hvac|roof|clean|lawn|electric|contractor|local/, "local_service"],
    [/insur|financ|tax|mortgage|credit|loan/, "financial"],
    [/youtube|podcast|newsletter|creator|influenc/, "content_creator"],
  ];

  for (const [pattern, type] of patterns) {
    if (pattern.test(lower)) return type;
  }

  // Default based on entry
  return entry === "no_business" ? "affiliate" : "consultant_coach";
}
