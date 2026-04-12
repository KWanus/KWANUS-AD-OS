"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowRight, ArrowLeft, Mountain, Wrench, Sparkles, Search, CheckCircle } from "lucide-react";
import AppNav from "@/components/AppNav";
import HimalayaNav from "@/components/himalaya/HimalayaNav";
import CheckInBanner from "@/components/himalaya/CheckInBanner";
import WorkflowGuide from "@/components/navigation/WorkflowGuide";
import WorkflowHeader from "@/components/navigation/WorkflowHeader";
import WorkflowPanel from "@/components/navigation/WorkflowPanel";
import WorkflowLoading from "@/components/navigation/WorkflowLoading";
import { track } from "@/lib/himalaya/tracking";
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

function ExpressInput() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Pick up goal from homepage redirect
  useEffect(() => {
    try {
      const goal = sessionStorage.getItem("himalaya_goal");
      if (goal) {
        setInput(goal);
        sessionStorage.removeItem("himalaya_goal");
      }
    } catch { /* ignore */ }

    // Pick up revenue target from URL
    const params = new URLSearchParams(window.location.search);
    const target = params.get("target");
    if (target) {
      setInput(`I want to make $${Number(target).toLocaleString()}/month`);
    }
  }, []);

  const isUrl = /^https?:\/\/.+\..+/.test(input.trim());

  async function handleGo() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setRunning(true);
    setError(null);

    const stages = ["Researching your market...", "Building your strategy...", "Creating your assets...", "Deploying everything..."];
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < stages.length) { setStage(stages[idx]); idx++; }
    }, 1500);

    try {
      const body = isUrl
        ? { niche: trimmed, url: trimmed }
        : { niche: trimmed };

      const res = await fetch("/api/himalaya/express", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const resText = await res.text();
      let data: { ok: boolean; runId?: string; error?: string };
      try { data = JSON.parse(resText); } catch { data = { ok: false, error: `Unexpected response: ${resText.slice(0, 100)}` }; }

      clearInterval(interval);

      if (data.ok && data.runId) {
        setStage("Done! Loading your results...");
        setTimeout(() => router.push(`/himalaya/run/${data.runId}`), 500);
      } else {
        setError(data.error ?? "Something went wrong");
        setRunning(false);
      }
    } catch {
      clearInterval(interval);
      setError("Connection failed. Try again.");
      setRunning(false);
    }
  }

  if (running) {
    return (
      <div className="mt-8 mb-6">
        <WorkflowLoading
          title={stage || "Starting..."}
          subtitle="Usually takes 30-90 seconds. We're scanning competitors and building your assets."
          icon={Mountain}
          steps={["Researching your market...", "Building your strategy...", "Creating your assets...", "Loading your results..."]}
          activeIndex={Math.max(0, ["Researching your market...", "Building your strategy...", "Creating your assets...", "Done! Loading your results..."].indexOf(stage || "Researching your market..."))}
        />
        {error && (
          <div className="mt-4 text-center">
            <p className="text-xs text-red-400">{error}</p>
            <button onClick={() => setRunning(false)} className="text-[10px] text-white/30 hover:text-white/60 mt-2 transition">Try again</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-8 mb-6">
      <WorkflowPanel
        title={isUrl ? "Paste a URL. We'll fix it." : "Tell us your niche. We'll build it."}
        description="One input. Himalaya handles the research, asset generation, launch path, and next steps."
        className="text-center"
      >
        <div className="mx-auto flex max-w-lg gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleGo()}
            placeholder="dental practices in Texas  OR  https://yourbusiness.com"
            autoFocus
            className="flex-1 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/30"
          />
          <button
            onClick={() => void handleGo()}
            disabled={!input.trim()}
            className="shrink-0 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-30"
          >
            Go
          </button>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-4 text-[10px] text-white/15">
          <span>✓ Scans competitors</span>
          <span>✓ Builds assets</span>
          <span>✓ Maps the launch path</span>
          <span>✓ 7-day action plan</span>
        </div>
      </WorkflowPanel>
    </div>
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
      const text = await res.text();
      let data: { ok: boolean; profileId?: string; error?: string };
      try { data = JSON.parse(text); } catch { data = { ok: false, error: `Unexpected response: ${text.slice(0, 100)}` }; }

      if (data.ok && data.profileId) {
        router.push(`/himalaya/path/${data.profileId}`);
      } else {
        alert(data.error ?? "Something went wrong. Try again.");
        setSubmitting(false);
      }
    } catch (err) {
      console.error("Find My Path error:", err);
      alert("Connection error. Please try again.");
      setSubmitting(false);
    }
  }

  const [showProfiler, setShowProfiler] = useState(false);
  const [hasHistory, setHasHistory] = useState(false);
  const [runsRemaining, setRunsRemaining] = useState<number | null>(null);
  const [tier, setTier] = useState<string | null>(null);

  useEffect(() => {
    // Check if user has prior runs
    track.pageView("/himalaya");
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
        <WorkflowHeader
          className="mb-2"
          title="Himalaya"
          description="Build, improve, and grow with a guided operating system powered by real competitive intelligence."
          icon={Mountain}
        />

        <WorkflowGuide
          items={[
            {
              title: "Need a quick score?",
              description: "Use Scan when you just want a fast verdict on a URL, offer, or competitor.",
              href: "/scan",
            },
            {
              title: "Need editable assets?",
              description: "Use Analysis Studio when you want full briefs, hooks, pages, and emails before launch.",
              href: "/analyze",
            },
            {
              title: "Use Himalaya",
              description: "Best when you want guided decisions plus the system building, launching, and iterating the stack.",
              active: true,
            },
          ]}
        />

        {/* Run counter */}
        {tier === "free" && runsRemaining !== null && (
          <div className="flex items-center gap-2 mt-3 mb-1">
            <div className="flex-1 h-1 bg-white/[0.05] rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500/40 rounded-full" style={{ width: `${Math.max(((2 - runsRemaining) / 2) * 100, 5)}%` }} />
            </div>
            <span className="text-[10px] text-white/25 shrink-0">
              {runsRemaining > 0 ? `${runsRemaining} free run${runsRemaining > 1 ? "s" : ""} left (total, not monthly)` : (
                <Link href="/himalaya/upgrade" className="text-cyan-400/60 hover:text-cyan-400 transition">Upgrade to continue →</Link>
              )}
            </span>
          </div>
        )}

        {/* Check-in banner for returning users */}
        <CheckInBanner />

        {/* Express input — zero friction entry */}
        {!showProfiler && <ExpressInput />}

        {/* Need more control? */}
        {!showProfiler && (
          <div className="text-center mb-6">
            <div className="flex justify-center gap-3 text-[10px]">
              <Link href="/himalaya/scratch" className="text-white/20 hover:text-white/50 transition">Detailed scratch form</Link>
              <span className="text-white/10">·</span>
              <Link href="/himalaya/improve" className="text-white/20 hover:text-white/50 transition">Detailed improve form</Link>
              <span className="text-white/10">·</span>
              <button onClick={() => setShowProfiler(true)} className="text-white/20 hover:text-white/50 transition">Let Himalaya decide</button>
            </div>
            {hasHistory && (
              <div className="flex justify-center gap-3 mt-2 text-[10px]">
                <Link href="/himalaya/runs" className="text-white/20 hover:text-white/50 transition">Past results</Link>
                <span className="text-white/10">·</span>
                <Link href="/himalaya/templates" className="text-white/20 hover:text-white/50 transition">Templates</Link>
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
