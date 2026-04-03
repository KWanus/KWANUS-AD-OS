"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowRight, ArrowLeft, Mountain, Wrench, Sparkles } from "lucide-react";
import AppNav from "@/components/AppNav";
import HimalayaNav from "@/components/himalaya/HimalayaNav";
import CheckInBanner from "@/components/himalaya/CheckInBanner";
import {
  BUDGET_OPTIONS,
  TIME_OPTIONS,
  SKILL_OPTIONS,
  RISK_OPTIONS,
  GOAL_OPTIONS,
  STAGE_OPTIONS,
} from "@/lib/himalaya/profileTypes";
import type {
  BudgetTier,
  TimeAvailability,
  SkillSet,
  RiskTolerance,
  PrimaryGoal,
  BusinessStage,
} from "@/lib/himalaya/profileTypes";

type Step = "stage" | "goal" | "budget" | "time" | "skills" | "risk" | "details";
const STEPS: Step[] = ["stage", "goal", "budget", "time", "skills", "risk", "details"];

function OptionCard({
  selected,
  onClick,
  label,
  detail,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  detail: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition ${
        selected
          ? "bg-cyan-500/10 border-cyan-500/25 text-white"
          : "bg-white/[0.02] border-white/[0.07] text-white/60 hover:border-white/[0.15] hover:bg-white/[0.04]"
      }`}
    >
      <p className="text-sm font-bold">{label}</p>
      <p className="text-xs text-white/35 mt-0.5">{detail}</p>
    </button>
  );
}

function SkillToggle({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition ${
        selected
          ? "bg-cyan-500/10 border-cyan-500/25 text-cyan-300"
          : "bg-white/[0.02] border-white/[0.07] text-white/40 hover:border-white/[0.15]"
      }`}
    >
      {label}
    </button>
  );
}

export default function HimalayaEntryPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Profile state
  const [stage, setStage] = useState<BusinessStage | null>(null);
  const [goal, setGoal] = useState<PrimaryGoal | null>(null);
  const [budget, setBudget] = useState<BudgetTier | null>(null);
  const [time, setTime] = useState<TimeAvailability | null>(null);
  const [skills, setSkills] = useState<SkillSet[]>([]);
  const [risk, setRisk] = useState<RiskTolerance | null>(null);
  const [niche, setNiche] = useState("");
  const [existingUrl, setExistingUrl] = useState("");
  const [description, setDescription] = useState("");

  const step = STEPS[currentStep];

  function canAdvance(): boolean {
    switch (step) {
      case "stage": return !!stage;
      case "goal": return !!goal;
      case "budget": return !!budget;
      case "time": return !!time;
      case "skills": return skills.length > 0;
      case "risk": return !!risk;
      case "details": return true;
    }
  }

  function toggleSkill(s: SkillSet) {
    if (s === "none") {
      setSkills(["none"]);
    } else {
      setSkills((prev) => {
        const filtered = prev.filter((x) => x !== "none");
        return filtered.includes(s) ? filtered.filter((x) => x !== s) : [...filtered, s];
      });
    }
  }

  async function handleSubmit() {
    if (!stage || !goal || !budget || !time || !risk || skills.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/himalaya/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessStage: stage,
          primaryGoal: goal,
          budget,
          timeAvailable: time,
          skills,
          riskTolerance: risk,
          niche: niche.trim() || undefined,
          existingUrl: existingUrl.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { ok: boolean; profileId?: string };
      if (data.ok && data.profileId) {
        router.push(`/himalaya/path/${data.profileId}`);
      }
    } catch {
      // non-fatal
    } finally {
      setSubmitting(false);
    }
  }

  const [showProfiler, setShowProfiler] = useState(false);
  const [hasHistory, setHasHistory] = useState(false);
  const [runsRemaining, setRunsRemaining] = useState<number | null>(null);
  const [tier, setTier] = useState<string | null>(null);

  useEffect(() => {
    // Check if user has prior runs
    fetch("/api/analyses?limit=1")
      .then((r) => r.json() as Promise<{ ok: boolean; analyses?: unknown[] }>)
      .then((data) => { if (data.ok && data.analyses && data.analyses.length > 0) setHasHistory(true); })
      .catch(() => {});
    // Load access info
    fetch("/api/himalaya/access")
      .then((r) => r.json() as Promise<{ ok: boolean; access?: { tier: string; runsRemaining: number } }>)
      .then((data) => { if (data.ok && data.access) { setRunsRemaining(data.access.runsRemaining); setTier(data.access.tier); } })
      .catch(() => {});
  }, []);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const showExistingFields = stage === "has_revenue" || stage === "scaling" || stage === "early_stage" ||
    goal === "fix_existing" || goal === "scale_existing";

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <HimalayaNav />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
            <Mountain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Himalaya</h1>
            <p className="text-xs text-white/30">Build, improve, and grow — guided by real competitive intelligence</p>
          </div>
        </div>

        {/* Run counter */}
        {tier === "free" && runsRemaining !== null && (
          <div className="flex items-center gap-2 mt-3 mb-1">
            <div className="flex-1 h-1 bg-white/[0.05] rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500/40 rounded-full" style={{ width: `${Math.max(((2 - runsRemaining) / 2) * 100, 5)}%` }} />
            </div>
            <span className="text-[10px] text-white/25 shrink-0">
              {runsRemaining > 0 ? `${runsRemaining} free run${runsRemaining > 1 ? "s" : ""} remaining` : (
                <Link href="/himalaya/upgrade" className="text-cyan-400/60 hover:text-cyan-400 transition">Upgrade to continue →</Link>
              )}
            </span>
          </div>
        )}

        {/* Check-in banner for returning users */}
        <CheckInBanner />

        {/* First-time welcome */}
        {!showProfiler && !hasHistory && (
          <div className="mt-6 mb-6 bg-gradient-to-br from-cyan-500/[0.04] to-purple-500/[0.03] border border-white/[0.06] rounded-2xl p-6 text-center">
            <h2 className="text-base font-black text-white mb-2">Here's how Himalaya works</h2>
            <div className="flex items-center justify-center gap-3 mb-3 text-[10px] text-white/30 font-bold">
              <span>Pick a path</span>
              <span className="text-white/10">→</span>
              <span>We research your market</span>
              <span className="text-white/10">→</span>
              <span>Get a complete business foundation</span>
              <span className="text-white/10">→</span>
              <span>Deploy and execute</span>
            </div>
            <p className="text-xs text-white/25 max-w-md mx-auto">
              Himalaya scans real competitors in your niche, builds assets that beat them, and learns from your results to improve over time. Your first 2 runs are free.
            </p>
          </div>
        )}

        {/* Main path selection */}
        {!showProfiler && (
          <div className={`${hasHistory ? "mt-8" : ""} mb-8`}>
            <h2 className="text-lg font-black text-white text-center mb-2">What do you need help with?</h2>
            <p className="text-sm text-white/30 text-center mb-6">Start from scratch or improve what you already have.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Start from Scratch */}
              <Link
                href="/himalaya/scratch"
                className="group p-6 rounded-2xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/[0.06] to-purple-500/[0.04] hover:border-cyan-500/30 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-base font-black text-white mb-1">Start from Scratch</h3>
                <p className="text-xs text-white/35 leading-relaxed">
                  Build a business foundation from idea to strategy, site direction, and launch assets.
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400/50 mt-3 group-hover:text-cyan-400/80 transition">
                  Get started <ArrowRight className="w-3 h-3" />
                </span>
              </Link>

              {/* Improve Existing */}
              <Link
                href="/himalaya/improve"
                className="group p-6 rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.04] hover:border-amber-500/30 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center mb-3">
                  <Wrench className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-base font-black text-white mb-1">Improve Existing Business</h3>
                <p className="text-xs text-white/35 leading-relaxed">
                  Analyze your current business, find what is weak, and generate better-performing assets.
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400/50 mt-3 group-hover:text-amber-400/80 transition">
                  Analyze now <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </div>

            {/* Not sure? Advanced profiler */}
            <div className="text-center mb-6">
              <p className="text-[10px] text-white/20 mb-2">Not sure which path? Answer 7 quick questions and let the system decide.</p>
              <button
                onClick={() => setShowProfiler(true)}
                className="text-xs text-cyan-400/40 hover:text-cyan-400/70 transition font-semibold"
              >
                Let Himalaya decide for me
              </button>
            </div>

            {/* Returning user shortcuts */}
            {hasHistory && (
              <div className="flex gap-2">
                <Link
                  href="/himalaya/runs"
                  className="flex-1 flex items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs font-semibold text-white/35 hover:text-white/60 hover:border-white/[0.12] transition"
                >
                  <Sparkles className="w-3.5 h-3.5" /> View Past Results
                </Link>
                <Link
                  href="/himalaya/templates"
                  className="flex-1 flex items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs font-semibold text-white/35 hover:text-white/60 hover:border-white/[0.12] transition"
                >
                  <Mountain className="w-3.5 h-3.5" /> My Templates
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Profiler (shown when "Let Himalaya decide" is clicked) */}
        {showProfiler && <>

        {/* Progress */}
        <div className="mt-6 mb-8">
          <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-white/20 mt-1.5">Step {currentStep + 1} of {STEPS.length}</p>
        </div>

        {/* Step: Stage */}
        {step === "stage" && (
          <div>
            <h2 className="text-lg font-black text-white mb-1">Where are you right now?</h2>
            <p className="text-sm text-white/35 mb-5">Be honest — this helps the system find your fastest path.</p>
            <div className="space-y-2">
              {STAGE_OPTIONS.map((o) => (
                <OptionCard key={o.value} selected={stage === o.value} onClick={() => setStage(o.value)} label={o.label} detail={o.detail} />
              ))}
            </div>
          </div>
        )}

        {/* Step: Goal */}
        {step === "goal" && (
          <div>
            <h2 className="text-lg font-black text-white mb-1">What matters most right now?</h2>
            <p className="text-sm text-white/35 mb-5">Not your long-term dream — your immediate priority.</p>
            <div className="space-y-2">
              {GOAL_OPTIONS.map((o) => (
                <OptionCard key={o.value} selected={goal === o.value} onClick={() => setGoal(o.value)} label={o.label} detail={o.detail} />
              ))}
            </div>
          </div>
        )}

        {/* Step: Budget */}
        {step === "budget" && (
          <div>
            <h2 className="text-lg font-black text-white mb-1">What can you invest to start?</h2>
            <p className="text-sm text-white/35 mb-5">The system adapts the path to your real budget.</p>
            <div className="space-y-2">
              {BUDGET_OPTIONS.map((o) => (
                <OptionCard key={o.value} selected={budget === o.value} onClick={() => setBudget(o.value)} label={o.label} detail={o.detail} />
              ))}
            </div>
          </div>
        )}

        {/* Step: Time */}
        {step === "time" && (
          <div>
            <h2 className="text-lg font-black text-white mb-1">How much time can you commit?</h2>
            <p className="text-sm text-white/35 mb-5">This determines pace, not ambition.</p>
            <div className="space-y-2">
              {TIME_OPTIONS.map((o) => (
                <OptionCard key={o.value} selected={time === o.value} onClick={() => setTime(o.value)} label={o.label} detail={o.detail} />
              ))}
            </div>
          </div>
        )}

        {/* Step: Skills */}
        {step === "skills" && (
          <div>
            <h2 className="text-lg font-black text-white mb-1">What skills do you have?</h2>
            <p className="text-sm text-white/35 mb-5">Select all that apply. No skills is a valid answer.</p>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((o) => (
                <SkillToggle key={o.value} selected={skills.includes(o.value)} onClick={() => toggleSkill(o.value)} label={o.label} />
              ))}
            </div>
          </div>
        )}

        {/* Step: Risk */}
        {step === "risk" && (
          <div>
            <h2 className="text-lg font-black text-white mb-1">How much risk can you handle?</h2>
            <p className="text-sm text-white/35 mb-5">Higher risk can mean faster results — or faster losses.</p>
            <div className="space-y-2">
              {RISK_OPTIONS.map((o) => (
                <OptionCard key={o.value} selected={risk === o.value} onClick={() => setRisk(o.value)} label={o.label} detail={o.detail} />
              ))}
            </div>
          </div>
        )}

        {/* Step: Details (optional) */}
        {step === "details" && (
          <div>
            <h2 className="text-lg font-black text-white mb-1">Almost done — any details?</h2>
            <p className="text-sm text-white/35 mb-5">Optional. This helps refine the recommendation.</p>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Niche or industry</label>
                <input
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g. fitness, real estate, SaaS, local cleaning"
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/30"
                />
                <p className="text-[10px] text-white/15 mt-1 pl-1">Be specific. "Gym owners in Atlanta" is better than "fitness".</p>
              </div>

              {showExistingFields && (
                <div>
                  <label className="text-[10px] font-bold text-cyan-400/50 uppercase tracking-widest mb-1.5 block">
                    Your website URL {goal === "fix_existing" || goal === "scale_existing" ? "(recommended)" : ""}
                  </label>
                  <input
                    value={existingUrl}
                    onChange={(e) => setExistingUrl(e.target.value)}
                    placeholder="https://yourbusiness.com"
                    className="w-full bg-white/[0.04] border border-cyan-500/15 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/30"
                  />
                  <p className="text-[10px] text-white/20 mt-1 pl-1">
                    {goal === "fix_existing"
                      ? "The system will scan your site, find what's broken, and build fixes. The more specific the URL, the better."
                      : "Paste your main website so we can analyze your current systems and recommend improvements."}
                  </p>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Anything else we should know?</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional — describe your situation, goals, or challenges"
                  rows={3}
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/30 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white/30 hover:text-white/60 transition disabled:opacity-20"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          {step === "details" ? (
            <button
              onClick={() => void handleSubmit()}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-40"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mountain className="w-4 h-4" />}
              {submitting ? "Analyzing..." : "Find My Path"}
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(Math.min(STEPS.length - 1, currentStep + 1))}
              disabled={!canAdvance()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.12] text-white text-sm font-bold hover:bg-white/[0.1] transition disabled:opacity-20 disabled:cursor-not-allowed"
            >
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        </>}
      </main>
    </div>
  );
}
