"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mountain, RotateCcw } from "lucide-react";
import AppNav from "@/components/AppNav";
import HimalayaNav from "@/components/himalaya/HimalayaNav";
import ProgressStage from "@/components/himalaya/ProgressStage";
import type { UiRunStage, UiStageState } from "@/components/himalaya/ProgressStage";

const NICHE_SUGGESTIONS: Record<string, string[]> = {
  "Service Business": ["plumbers in Dallas", "house cleaning in Miami", "HVAC contractors", "landscaping companies", "auto detailing"],
  "E-commerce Brand": ["sustainable fashion", "pet accessories", "home fitness equipment", "organic skincare", "phone accessories"],
  "Agency": ["dental practices", "real estate agents", "restaurants", "law firms", "chiropractors"],
  "Coaching / Consulting": ["executive leadership", "career transitions", "fitness for busy professionals", "dating for men 30+", "small business owners"],
  "Personal Brand": ["tech content creator", "fitness influencer", "business educator", "lifestyle blogger", "motivational speaker"],
  "Digital Product": ["Notion templates for freelancers", "Lightroom presets", "resume templates", "online courses for parents", "Excel dashboards"],
  "SaaS": ["project management for agencies", "CRM for real estate", "scheduling for salons", "invoicing for freelancers", "email marketing for creators"],
  "Other": ["local food delivery", "event planning", "tutoring services", "pet sitting", "mobile car wash"],
};

const BUSINESS_TYPES = [
  "Service Business",
  "E-commerce Brand",
  "Agency",
  "Coaching / Consulting",
  "Personal Brand",
  "Digital Product",
  "SaaS",
  "Other",
];

const GOALS = [
  "Get first client",
  "Get more leads",
  "Build a stronger offer",
  "Launch faster",
  "Improve conversions",
  "Create structure",
  "Scale operations",
];

function SelectGrid({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`p-3 rounded-xl border text-sm font-semibold text-left transition ${
            value === opt
              ? "bg-cyan-500/10 border-cyan-500/25 text-cyan-300"
              : "bg-white/[0.02] border-white/[0.07] text-white/50 hover:border-white/[0.15]"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function HimalayaScratchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromRun = searchParams.get("fromRun");
  const [loadedFromRun, setLoadedFromRun] = useState(false);
  const [businessType, setBusinessType] = useState("");
  const [niche, setNiche] = useState("");
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [goal, setGoal] = useState("");
  const [dream, setDream] = useState("");

  const [running, setRunning] = useState(false);
  const [stages, setStages] = useState<Record<UiRunStage, UiStageState>>({
    diagnosis: "waiting",
    strategy: "waiting",
    generation: "waiting",
    save: "waiting",
  });
  const [error, setError] = useState<string | null>(null);

  // Load prior run data if fromRun param exists
  useEffect(() => {
    if (!fromRun) return;
    fetch(`/api/analyses/${fromRun}`)
      .then((r) => r.json() as Promise<{ ok: boolean; analysis?: { mode: string; title: string | null; inputUrl: string; decisionPacket: Record<string, unknown> | null; rawSignals: Record<string, unknown> | null } }>)
      .then((data) => {
        if (!data.ok || !data.analysis) return;
        const a = data.analysis;
        const packet = a.decisionPacket;
        const foundation = (a.rawSignals?.foundation ?? null) as { businessProfile?: { businessType?: string; niche?: string }; businessPath?: string } | null;

        // Prefill from foundation or packet
        if (foundation?.businessProfile?.niche) setNiche(foundation.businessProfile.niche);
        else if (packet?.audience) setNiche(packet.audience as string);

        if (foundation?.businessProfile?.businessType) {
          // Try to map to our options
          const typeMap: Record<string, string> = {
            "Affiliate Marketing": "Other",
            "Dropshipping / E-commerce": "E-commerce Brand",
            "Agency / Service Business": "Agency",
            "Freelancing": "Other",
            "Coaching / Consulting": "Coaching / Consulting",
            "Local Service Business": "Service Business",
            "E-commerce Brand": "E-commerce Brand",
            "Digital Products": "Digital Product",
          };
          setBusinessType(typeMap[foundation.businessProfile.businessType] ?? "Other");
        }

        if (packet?.angle) setDream(packet.angle as string);
        setLoadedFromRun(true);
      })
      .catch(() => {});
  }, [fromRun]);

  const canSubmit = businessType && niche.trim() && goal;

  async function handleSubmit() {
    if (!canSubmit) return;
    setRunning(true);
    setError(null);

    // Animate stages progressively
    const stageOrder: UiRunStage[] = ["diagnosis", "strategy", "generation", "save"];
    let stageIdx = 0;
    const interval = setInterval(() => {
      if (stageIdx < stageOrder.length) {
        setStages((prev) => {
          const next = { ...prev };
          if (stageIdx > 0) next[stageOrder[stageIdx - 1]] = "complete";
          next[stageOrder[stageIdx]] = "active";
          return next;
        });
        stageIdx++;
      }
    }, 800);

    try {
      // First create a profile via decide endpoint
      const decideRes = await fetch("/api/himalaya/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessStage: "no_business",
          primaryGoal: "full_business",
          budget: "micro",
          timeAvailable: "parttime",
          skills: ["communication"],
          riskTolerance: "medium",
          niche: niche.trim(),
          description: [businessType, goal, dream, competitorUrl ? `Competitor: ${competitorUrl}` : ""].filter(Boolean).join(". "),
          existingUrl: competitorUrl.trim() || undefined,
        }),
      });

      // Debug: check what the API actually returned
      const decideText = await decideRes.text();
      let decideData: { ok: boolean; profileId?: string; error?: string; result?: { primary?: { path?: string } } };
      try {
        decideData = JSON.parse(decideText);
      } catch {
        throw new Error(`API returned non-JSON (status ${decideRes.status}): ${decideText.slice(0, 150)}`);
      }

      if (!decideData.ok || !decideData.profileId) {
        throw new Error(`Decide failed (status ${decideRes.status}): ${decideData.error ?? decideText.slice(0, 150)}`);
      }

      // Map business type to best path
      const pathMap: Record<string, string> = {
        "Service Business": "local_service",
        "E-commerce Brand": "ecommerce_brand",
        "Agency": "agency",
        "Coaching / Consulting": "coaching",
        "Personal Brand": "digital_product",
        "Digital Product": "digital_product",
        "SaaS": "digital_product",
        "Other": decideData.result?.primary?.path ?? "freelance",
      };
      const path = pathMap[businessType] ?? "freelance";

      // Run the pipeline
      const runRes = await fetch("/api/himalaya/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "scratch", profileId: decideData.profileId, path }),
      });
      const runData = (await runRes.json()) as { ok: boolean; runId?: string; error?: string; trace?: { stages?: { name: string; status: string }[] } };

      clearInterval(interval);

      if (runData.ok && runData.runId) {
        // Map real stage statuses
        if (runData.trace?.stages) {
          const finalStages = { ...stages };
          for (const s of runData.trace.stages) {
            const key = s.name as UiRunStage;
            if (key in finalStages) {
              finalStages[key] = s.status as UiStageState;
            }
          }
          setStages(finalStages);
        } else {
          setStages({ diagnosis: "complete", strategy: "complete", generation: "complete", save: "complete" });
        }

        setTimeout(() => router.push(`/himalaya/run/${runData.runId}`), 1000);
      } else {
        throw new Error(runData.error ?? "Run failed");
      }
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStages((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next) as UiRunStage[]) {
          if (next[key] === "active") next[key] = "failed";
        }
        return next;
      });
    }
  }

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <HimalayaNav />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {running ? (
          <>
            <div className="text-center mb-4">
              <Mountain className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
              <h1 className="text-xl font-black text-white">Building Your Foundation</h1>
              <p className="text-sm text-white/30 mt-1">Himalaya is creating your business assets</p>
            </div>
            <ProgressStage stages={stages} error={error} />
          </>
        ) : (
          <>
            <Link href="/himalaya" className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition mb-6">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Link>

            <h1 className="text-xl font-black text-white mb-1">Start from Scratch</h1>
            <p className="text-sm text-white/35 mb-4">
              Build a business foundation from idea to strategy, site direction, and launch assets.
            </p>
            {loadedFromRun && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-purple-500/5 border border-purple-500/10">
                <RotateCcw className="w-3 h-3 text-purple-400/50" />
                <p className="text-[10px] text-purple-300/60">Loaded from a previous run. Edit anything before rebuilding.</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Business Type */}
              <div>
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 block">What kind of business?</label>
                <SelectGrid options={BUSINESS_TYPES} value={businessType} onChange={setBusinessType} />
              </div>

              {/* Niche */}
              <div>
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 block">Your niche or market</label>
                <input
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g. gym owners in Atlanta, busy moms, B2B SaaS founders"
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/30"
                />
                {businessType && !niche && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(NICHE_SUGGESTIONS[businessType] ?? []).map((s) => (
                      <button key={s} type="button" onClick={() => setNiche(s)} className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[10px] text-white/30 hover:text-white/60 hover:border-white/[0.12] transition">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-white/15 mt-1 pl-1">Be specific. The more precise, the better your assets.</p>
              </div>

              {/* Competitor URL (optional) */}
              <div>
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-2 block">
                  Know a competitor? <span className="text-white/10">(optional)</span>
                </label>
                <input
                  value={competitorUrl}
                  onChange={(e) => setCompetitorUrl(e.target.value)}
                  placeholder="https://competitor-website.com"
                  className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/15 focus:outline-none focus:border-cyan-500/20"
                />
                <p className="text-[10px] text-white/12 mt-1 pl-1">We'll scan them and position you to beat them.</p>
              </div>

              {/* Goal */}
              <div>
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 block">Your immediate goal</label>
                <SelectGrid options={GOALS} value={goal} onChange={setGoal} />
              </div>

              {/* Dream (optional) */}
              <div>
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 block">
                  Anything else? <span className="text-white/15">(optional)</span>
                </label>
                <textarea
                  value={dream}
                  onChange={(e) => setDream(e.target.value)}
                  placeholder="Describe your dream outcome, extra context, or challenges"
                  rows={3}
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/30 resize-none"
                />
              </div>

              {/* Submit */}
              <button
                onClick={() => void handleSubmit()}
                disabled={!canSubmit}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Build My Foundation
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
